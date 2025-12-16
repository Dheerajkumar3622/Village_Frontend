
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['PASSENGER', 'DRIVER', 'ADMIN', 'SHOPKEEPER'], default: 'PASSENGER' },
  password: { type: String, required: true },
  email: String,
  phone: String,
  isCharterAvailable: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 50 }, // Server-side wallet authority
  did: String, // Decentralized ID
  isVerified: { type: Boolean, default: false }, // Verification Status
  isBanned: { type: Boolean, default: false }, // Ban Status
  referralCode: String, // Idea #18
  referredBy: String,
  creditLimit: { type: Number, default: 500 }, // Idea #19
  creditUsed: { type: Number, default: 0 }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  // FIX FOR TEST ACCOUNTS:
  // If the password in DB is plain text (from seeding), compare directly.
  // Otherwise, use bcrypt.
  const isHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');

  if (!isHashed) {
      if (this.password === candidatePassword) {
          // Auto-migrate to hash for security self-healing
          this.password = await bcrypt.hash(candidatePassword, 10);
          await this.save();
          return true;
      }
      return false;
  }

  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);

// Updated Location Schema to match user's collection EXACTLY
export const Location = mongoose.model('Location', new mongoose.Schema({
  name: String,
  code: String,
  district: String,
  geometry: mongoose.Schema.Types.Mixed, // Accept GeoJSON object
  properties: mongoose.Schema.Types.Mixed
}, { strict: false, collection: 'villages' })); 

export const Transaction = mongoose.model('Transaction', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  type: { type: String, enum: ['EARN', 'SPEND'] },
  amount: Number,
  desc: String,
  timestamp: Number,
  relatedEntityId: String 
}));

export const Ticket = mongoose.model('Ticket', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  driverId: String,
  from: String,
  to: String,
  fromDetails: String,
  toDetails: String,
  status: { type: String, default: 'PENDING' },
  paymentMethod: String,
  timestamp: Number,
  passengerCount: Number,
  totalPrice: Number,
  routePath: [String],
  digitalSignature: String,
  giftedBy: String,
  recipientPhone: String
}));

export const Pass = mongoose.model('Pass', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  userName: String,
  from: String,
  to: String,
  type: String, 
  seatConfig: String, 
  validityDays: Number,
  usedDates: [String], 
  purchaseDate: Number,
  expiryDate: Number,
  price: Number,
  status: String,
  nftTokenId: String,
  giftedBy: String
}));

export const RentalBooking = mongoose.model('RentalBooking', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  userName: String,
  vehicleType: String, 
  from: String,
  to: String,
  tripType: String,
  date: String,
  distanceKm: Number,
  totalFare: Number,
  status: String, 
  driverId: String,
  bidAmount: Number
}));

const trackingEventSchema = new mongoose.Schema({
  status: String,
  location: String,
  timestamp: Number,
  handlerId: String,
  description: String
});

export const Parcel = mongoose.model('Parcel', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  from: String,
  to: String,
  itemType: String,
  weightKg: Number,
  price: Number,
  status: String,
  timestamp: Number,
  blockchainHash: String,
  trackingEvents: [trackingEventSchema] // Added for Supply Chain Technology
}));

export const RoadReport = mongoose.model('RoadReport', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  type: { type: String, enum: ['ACCIDENT', 'TRAFFIC', 'POLICE_CHECK', 'POTHOLE'] },
  location: String,
  timestamp: Number,
  upvotes: { type: Number, default: 0 }
}));

export const Route = mongoose.model('Route', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  from: String,
  to: String,
  stops: [String],
  totalDistance: Number
}));

export const Block = mongoose.model('Block', new mongoose.Schema({
  index: Number,
  timestamp: Number,
  data: mongoose.Schema.Types.Mixed,
  previousHash: String,
  hash: String,
  validator: String
}));

// --- NEW COMMUNITY MODELS ---
export const Job = mongoose.model('Job', new mongoose.Schema({
  id: String,
  title: String,
  location: String,
  wage: String,
  contact: String,
  type: String
}));

export const MarketItem = mongoose.model('MarketItem', new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  unit: String,
  supplier: String,
  inStock: Boolean
}));

export const NewsItem = mongoose.model('NewsItem', new mongoose.Schema({
  id: String,
  title: String,
  summary: String,
  location: String,
  timestamp: Number,
  videoUrl: String // Simulated short video
}));
