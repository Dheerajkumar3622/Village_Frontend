
/**
 * VillageLink v3.3 Production Server
 * Scalable Architecture with Redis Adapter & Mobile Support
 * SECURED VERSION
 */
console.log("server file",import.meta.url);
import dotenv from 'dotenv';
dotenv.config();
console.log("JWT_SECRET",process.env.JWT_SECRET);
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Security Imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Import Modular Components
import { Ticket, Pass, RentalBooking, Parcel, User, Location, Block, Transaction, Route, RoadReport, Job, MarketItem, NewsItem } from './backend/models.js';
import * as Auth from './backend/auth.js';
import * as Logic from './backend/logic.js';

import villageRoutes from "./routes/village.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1); 

// --- SECURITY MIDDLEWARE ---
app.use(helmet({
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api/', limiter);

app.use(mongoSanitize());
app.use(xss()); 

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use("/api/villages", villageRoutes);
// ===== CORS FIX =====
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://villagelink-api.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());


// --- DATABASE STATE ---
let isDbConnected = false;
// UPDATED: Connection string for the specific 'test' database containing 'villages'
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dheerakumar3622:Dheeraj123@villagelink.j9op0nf.mongodb.net/test?appName=Villagelink';

// --- SEEDING FUNCTION ---
const seedDatabase = async () => {
  try {
    console.log('🌱 Verifying Test Accounts...');

    // 1. Driver
    await User.findOneAndUpdate(
      { id: 'DRV-888' },
      {
        name: 'Raju Driver',
        role: 'DRIVER',
        password: 'drive', 
        phone: '9999999999',
        email: 'raju@villagelink.com',
        isCharterAvailable: true,
        isVerified: true
      },
      { upsert: true, new: true }
    );

    // 2. Passenger
    await User.findOneAndUpdate(
      { id: 'USR-999' },
      {
        name: 'Amit Kumar',
        role: 'PASSENGER',
        password: 'pass', 
        phone: '8888888888',
        email: 'amit@villagelink.com',
        isVerified: true,
        referralCode: 'AMIT100',
        creditLimit: 500,
        creditUsed: 0
      },
      { upsert: true, new: true }
    );

    // 3. Admin
    await User.findOneAndUpdate(
      { id: 'ADMIN-001' },
      {
        name: 'Master Controller',
        role: 'ADMIN',
        password: 'admin123',
        email: 'admin@villagelink.com',
        isVerified: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test Accounts Synced.');

  } catch (error) {
    console.warn('⚠️ Seeding Warning:', error.message);
  }
};

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB (Production Mode)');
    isDbConnected = true;
    await seedDatabase();
  })
  .catch(err => {
    console.warn('⚠️ MongoDB Connection Failed. Running in Degraded Mode (No API). Check MONGO_URI.', err.message);
    isDbConnected = false;
  });

// --- MIDDLEWARE TO CHECK DB STATUS ---
const checkDbConnection = (req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({ error: "Database unavailable. Please use Offline Mode." });
    }
    next();
};

// --- API ROUTES ---
app.post('/api/auth/register', checkDbConnection, Auth.register);
app.post('/api/auth/login', checkDbConnection, Auth.login);
app.post('/api/auth/logout', (req, res) => res.json({ success: true }));

// --- LOCATION API (TRANSFORMED FOR APP) ---
app.get('/api/locations', checkDbConnection, async (req, res) => {
    try {
        // Fetch raw data from 'villages' collection
        // Increased limit to 5000 to cover more area from the provided PDF list
        const rawLocations = await Location.find({}).limit(5000).lean(); 
        
        // Transform GeoJSON Polygons to simple Points for the App
        const transformedLocations = rawLocations.map(doc => {
            let lat = 24.9490; // Default Sasaram
            let lng = 84.0153;

            // Handle Polygon Geometry from MongoDB
            // Structure: geometry: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
            if (doc.geometry && doc.geometry.coordinates) {
                let firstRing = doc.geometry.coordinates[0];
                // Sometimes coordinates might be nested deeper depending on MultiPolygon
                if (doc.geometry.type === 'MultiPolygon') {
                    firstRing = doc.geometry.coordinates[0][0];
                }

                if (Array.isArray(firstRing) && firstRing.length > 0) {
                    const firstPoint = firstRing[0]; // [Lng, Lat]
                    if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
                        lng = firstPoint[0]; 
                        lat = firstPoint[1];
                    }
                }
            } else if (doc.lat && doc.lng) {
                // Fallback if data is already in simple format
                lat = doc.lat;
                lng = doc.lng;
            }

            return {
                name: doc.name || doc.properties?.NAME || "Unknown Village",
                lat: lat,
                lng: lng,
                block: doc.properties?.SUB_DIST || doc.block || "Unknown Block",
                panchayat: doc.district || doc.panchayat || "Rohtas",
                villageCode: doc.code || doc.properties?.CEN_2001 || doc.properties?.VILL_CODE || "V-000"
            };
        });

        console.log(`📍 Processed ${transformedLocations.length} villages for App.`);
        res.json(transformedLocations);
    } catch (e) {
        console.error("Location Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch locations" });
    }
});

// --- SECURE WALLET ENDPOINTS ---
app.get('/api/user/wallet', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(20);
    
    res.json({
      address: user.did || `0x${user.id}`,
      balance: user.walletBalance,
      transactions,
      creditLimit: user.creditLimit || 500, // Idea #19
      creditUsed: user.creditUsed || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/transaction', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const { amount, type, desc, relatedEntityId } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    if (type === 'SPEND' && user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    if (type === 'EARN') user.walletBalance += amount;
    if (type === 'SPEND') user.walletBalance -= amount;
    await user.save();

    const txn = new Transaction({
      id: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      userId: user.id,
      type,
      amount,
      desc,
      timestamp: Date.now(),
      relatedEntityId
    });
    await txn.save();

    res.json({ success: true, balance: user.walletBalance, transaction: txn });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CORE TRANSPORT (TICKETS & PASSES) ---
app.post('/api/tickets/book', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const ticketData = req.body;
    const pricing = Logic.calculateFare(ticketData.distance || 10, new Date().getHours());
    
    ticketData.totalPrice = pricing.totalFare * (ticketData.passengerCount || 1);

    // GIFTING LOGIC
    if (ticketData.recipientPhone) {
        let recipient = await User.findOne({ phone: ticketData.recipientPhone });
        if (!recipient) {
            // Auto-create user for recipient if they don't exist
            const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
            recipient = new User({
                id: newId,
                name: 'Guest User',
                role: 'PASSENGER',
                phone: ticketData.recipientPhone,
                password: 'password123', // Default placeholder
                isVerified: true
            });
            await recipient.save();
        }
        ticketData.userId = recipient.id; // Assign ownership to recipient
        ticketData.giftedBy = req.user.role === 'ADMIN' ? 'VillageLink Admin' : (await User.findOne({id: req.user.id}))?.name;
    } else {
        // Ensure userId matches token if not gifting (prevent spoofing)
        ticketData.userId = req.user.id;
    }

    const ticket = new Ticket(ticketData);
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/pricing/calculate', (req, res) => {
  const { distance, timestamp } = req.query;
  if (!distance || isNaN(distance)) return res.status(400).json({error: "Invalid distance"});
  const result = Logic.calculateFare(parseFloat(distance), new Date(parseInt(timestamp) || Date.now()).getHours());
  res.json(result);
});

// --- ROUTE MANAGEMENT ---
app.get('/api/routes', checkDbConnection, async (req, res) => {
    try {
        const routes = await Route.find({});
        res.json(routes);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/routes', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        const route = new Route({ ...req.body, id: `RT-${Date.now()}` });
        await route.save();
        res.json({ success: true, route });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/routes/:id', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        await Route.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- PASSES ---
app.post('/api/passes/buy', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const passData = req.body;
    
    if (passData.recipientPhone) {
        let recipient = await User.findOne({ phone: passData.recipientPhone });
        if (!recipient) {
            const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
            recipient = new User({
                id: newId,
                name: 'Guest User',
                role: 'PASSENGER',
                phone: passData.recipientPhone,
                password: 'password123',
                isVerified: true
            });
            await recipient.save();
        }
        passData.userId = recipient.id;
        passData.userName = recipient.name; 
        passData.giftedBy = (await User.findOne({id: req.user.id}))?.name;
    } else {
        passData.userId = req.user.id;
    }

    const block = await Logic.addToChain({ type: 'NFT_MINT', owner: passData.userId, asset: 'PASS' });
    passData.nftTokenId = block.hash;
    const pass = new Pass(passData);
    await pass.save();
    res.json({ success: true, pass });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/passes/list', checkDbConnection, async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "User ID required" });
        const passes = await Pass.find({ userId });
        res.json(passes);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/passes/verify', checkDbConnection, async (req, res) => {
    try {
        const { passId } = req.body;
        const pass = await Pass.findOne({ id: passId });
        if (!pass) return res.status(404).json({ error: "Pass not found" });
        
        const today = new Date().toISOString().split('T')[0];
        if (pass.usedDates.includes(today)) return res.json({ error: "Pass already used today" });
        if (pass.expiryDate < Date.now()) return res.json({ error: "Pass expired" });
        
        pass.usedDates.push(today);
        await pass.save();
        res.json({ success: true, pass });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// --- HISTORY ---
app.get('/api/user/history', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId !== req.user.id && req.user.role !== 'DRIVER') {
        return res.status(403).json({ error: "Unauthorized access to history" });
    }

    const tickets = await Ticket.find({ userId }).lean().then(d => d.map(x => ({...x, historyType: 'TICKET'})));
    const passes = await Pass.find({ userId }).lean().then(d => d.map(x => ({...x, historyType: 'PASS'})));
    const rentals = await RentalBooking.find({ userId }).lean().then(d => d.map(x => ({...x, historyType: 'RENTAL'})));
    const parcels = await Parcel.find({ userId }).lean().then(d => d.map(x => ({...x, historyType: 'PARCEL'})));
    const history = [...tickets, ...passes, ...rentals, ...parcels].sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
    res.json(history);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RENTALS ---
app.post('/api/rentals/book', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const rentalData = req.body;
    rentalData.userId = req.user.id; 
    const rental = new RentalBooking(rentalData);
    await rental.save();
    res.json({ success: true, rental });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/rentals/requests', checkDbConnection, async (req, res) => {
    try {
        const requests = await RentalBooking.find({ status: 'PENDING' });
        res.json(requests);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rentals/respond', checkDbConnection, async (req, res) => {
    try {
        const { rentalId, driverId, status } = req.body; 
        const rental = await RentalBooking.findOneAndUpdate({ id: rentalId }, { status, driverId }, { new: true });
        res.json({ success: true, rental });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// --- LOGISTICS (SUPPLY CHAIN) ---
app.post('/api/logistics/book', checkDbConnection, Auth.authenticate, async (req, res) => {
  try {
    const parcelData = req.body;
    parcelData.userId = req.user.id;
    parcelData.status = 'PENDING';
    
    parcelData.trackingEvents = [{
        status: 'BOOKED',
        location: parcelData.from,
        timestamp: Date.now(),
        description: 'Order created in system'
    }];

    const block = await Logic.addToChain({ type: 'PARCEL_CREATE', sender: parcelData.userId, item: parcelData.itemType });
    parcelData.blockchainHash = block.hash;
    
    const parcel = new Parcel(parcelData);
    await parcel.save();
    res.json({ success: true, parcel });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/logistics/all', checkDbConnection, async (req, res) => {
    try {
        const parcels = await Parcel.find({});
        res.json(parcels);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/logistics/update-status', checkDbConnection, async (req, res) => {
    try {
        const { parcelId, status, location, driverId, description } = req.body;
        const parcel = await Parcel.findOne({ id: parcelId });
        if (!parcel) return res.status(404).json({ error: "Parcel not found" });

        parcel.status = status;
        parcel.trackingEvents.push({
            status,
            location,
            timestamp: Date.now(),
            handlerId: driverId,
            description
        });
        
        await parcel.save();
        res.json({ success: true, parcel });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- COMMUNITY REPORTING & DATA ---
app.post('/api/community/report', checkDbConnection, Auth.authenticate, async (req, res) => {
    try {
        const report = new RoadReport({ ...req.body, userId: req.user.id, timestamp: Date.now(), id: `REP-${Date.now()}` });
        await report.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/community/jobs', checkDbConnection, async (req, res) => {
    try {
        const jobs = await Job.find({});
        res.json(jobs);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/community/market', checkDbConnection, async (req, res) => {
    try {
        const items = await MarketItem.find({});
        res.json(items);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/community/news', checkDbConnection, async (req, res) => {
    try {
        const news = [
            { id: 'N1', title: 'New Bridge in Dehri', summary: 'CM inaugurates 4-lane bridge.', location: 'Dehri', timestamp: Date.now() },
            { id: 'N2', title: 'Mandi Rates Up', summary: 'Wheat prices soar by 10%.', location: 'Sasaram', timestamp: Date.now() - 86400000 }
        ];
        res.json(news);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- DRIVER ---
app.post('/api/driver/toggle-charter', checkDbConnection, async (req, res) => {
    try {
        const { userId, isAvailable } = req.body;
        await User.findOneAndUpdate({ id: userId }, { isCharterAvailable: isAvailable });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// --- MASTER PANEL (ADMIN) ROUTES ---
app.get('/api/admin/stats', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingDrivers = await User.countDocuments({ role: 'DRIVER', isVerified: false });
        const activeTrips = await Ticket.countDocuments({ status: 'PENDING' });
        
        const ticketsRev = await Ticket.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]);
        const rentalsRev = await RentalBooking.aggregate([{ $group: { _id: null, total: { $sum: "$totalFare" } } }]);
        const totalRevenue = (ticketsRev[0]?.total || 0) + (rentalsRev[0]?.total || 0);

        res.json({
            totalUsers,
            pendingDrivers,
            activeTrips,
            totalRevenue,
            systemHealth: 98
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/verify-driver', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        const { userId, isVerified } = req.body;
        await User.findOneAndUpdate({ id: userId }, { isVerified });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/toggle-ban', checkDbConnection, Auth.requireAdmin, async (req, res) => {
    try {
        const { userId, isBanned } = req.body;
        await User.findOneAndUpdate({ id: userId }, { isBanned });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  },
});


const REDIS_URL = process.env.REDIS_URL;
if (REDIS_URL) {
  (async () => {
    try {
      const { createClient } = await import('redis');
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const pubClient = createClient({ url: REDIS_URL });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('🚀 Redis Adapter Connected (Scalable Mode for 10M Users)');
    } catch (e) {
      console.error('⚠️ Redis Connection Failed (Using Memory):', e.message);
    }
  })();
}

io.on('connection', (socket) => {
   socket.on('book_ticket', (data) => {
      // If gifting, don't broadcast as my active trip
      if (data.recipientPhone) return;
   });
   
   socket.on('driver_location_update', (data) => {
      io.emit('vehicles_update', [data]); 
   });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`VillageLink v3.3 Secure Server running on ${PORT}`);
});
