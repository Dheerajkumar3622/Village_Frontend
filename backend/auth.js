import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from './models.js';
import crypto from 'crypto';
import { error } from 'console';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
console.log("JWT_SECRET_LOAD",process.env.JWT_SECRET);

if (!process.env.JWT_SECRET) {
  console.warn("🔒 SECURITY WARNING: No JWT_SECRET in env. Using ephemeral random key. Sessions will invalidate on restart.");
}
const getJwtSecret = ( )=> {
  if(!process.env.JWT_SECRET){
    throw new Error ("Jw is not define");
  }
  return process.env.JWT_SECRET;
} 
/* ------------------ ZOD SCHEMAS (UNCHANGED) ------------------ */
const registerSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['PASSENGER', 'DRIVER', 'SHOPKEEPER']),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10).optional().or(z.literal('')),
  vehicleCapacity: z.number().optional(),
  vehicleType: z.string().optional()
});

const loginSchema = z.object({
  loginId: z.string(),
  password: z.string()
});

/* ------------------ REGISTER (UNCHANGED) ------------------ */
export const register = async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existing = await User.findOne({
      $or: [{ email: validated.email }, { phone: validated.phone }]
    });
    if (existing && (validated.email || validated.phone)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const id = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const isVerified = validated.role === 'PASSENGER';

    const user = new User({ ...validated, id, isVerified });
    await user.save();

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password, ...safeUser } = user.toObject();

    res.json({ success: true, user: safeUser, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message });
  }
};

/* ------------------ LOGIN (UNCHANGED) ------------------ */
export const login = async (req, res) => {
  try {
    const { loginId, password } = loginSchema.parse(req.body);

    const user = await User.findOne({
      $or: [{ id: loginId }, { email: loginId }, { phone: loginId }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "Account Suspended by Administrator" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();

    res.json({ success: true, user: safeUser, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ------------------ AUTH MIDDLEWARE (🔧 PATCHED) ------------------ */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied" });
  }

  // 🔧 PATCH: Support Bearer token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token,getJwtSecretT);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* ------------------ ADMIN MIDDLEWARE (🔧 PATCHED) ------------------ */
export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied" });
  }

  // 🔧 PATCH: Support Bearer token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, getJwtSecret);
    const user = await User.findOne({ id: decoded.id });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
