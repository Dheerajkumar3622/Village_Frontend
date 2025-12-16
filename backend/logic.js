
import crypto from 'crypto';
import { Block, User } from './models.js';

// --- SERVER-SIDE ML PRICING ENGINE ---
export const calculateFare = (distanceKm, hour) => {
  const baseRate = 6; 
  const baseFixed = 10;
  let rawBaseFare = baseFixed + (distanceKm * baseRate);
  
  let finalFare = rawBaseFare;
  let surgeMultiplier = 1.0;
  let message = '';

  // Rush Hour (Server Logic)
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
    surgeMultiplier = 1.2;
    finalFare *= surgeMultiplier;
    message = 'Rush Hour';
  } else if (hour >= 13 && hour <= 15) {
    surgeMultiplier = 0.85;
    finalFare *= surgeMultiplier;
    message = 'Happy Hour';
  }

  // Rounding
  finalFare = Math.ceil(finalFare / 5) * 5; 
  if (finalFare < 10) finalFare = 10;

  return {
    totalFare: finalFare,
    baseFare: rawBaseFare,
    surge: surgeMultiplier,
    message
  };
};

// --- SERVER-SIDE BLOCKCHAIN LEDGER ---
const calculateHash = (index, prevHash, timestamp, data) => {
  return crypto.createHash('sha256').update(index + prevHash + timestamp + JSON.stringify(data)).digest('hex');
};

export const addToChain = async (data) => {
  const lastBlock = await Block.findOne().sort({ index: -1 });
  const index = lastBlock ? lastBlock.index + 1 : 0;
  const prevHash = lastBlock ? lastBlock.hash : "0";
  const timestamp = Date.now();
  const hash = calculateHash(index, prevHash, timestamp, data);

  const newBlock = new Block({ index, timestamp, data, previousHash: prevHash, hash, validator: 'VL-SERVER' });
  await newBlock.save();
  return newBlock;
};

// --- GRAMCOIN LOGIC ---
export const transferTokens = async (fromId, toId, amount, reason) => {
  const sender = await User.findOne({ id: fromId });
  if (sender.walletBalance < amount) return false;

  const receiver = await User.findOne({ id: toId });
  
  sender.walletBalance -= amount;
  receiver.walletBalance += amount;
  
  await sender.save();
  await receiver.save();
  
  await addToChain({ type: 'TOKEN_TRANSFER', from: fromId, to: toId, amount, reason });
  return true;
};
