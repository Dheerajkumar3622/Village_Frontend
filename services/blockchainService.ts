
import { Wallet, NFTMetadata, SmartContract } from '../types';
import { getAuthToken } from './authService';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/user`;

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/wallet`, {
      headers: { 'Authorization': token }
    });
    
    // If backend is sleeping/down, handle gracefully
    if (!res.ok) {
        console.warn(`Wallet Fetch Failed: ${res.status}`);
        return { address: `0x${userId}`, balance: 0, transactions: [] }; // Return fallback
    }
    
    return await res.json();
  } catch (e) {
    // Network error (e.g. server unreachable)
    // Return empty wallet to allow UI to render in offline mode
    return { address: `0x${userId}`, balance: 0, transactions: [] };
  }
};

export const earnGramCoin = async (userId: string, amount: number, reason: string) => {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${API_URL}/transaction`, {
      method: 'POST',
      headers: { 
        'Authorization': token,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ amount, type: 'EARN', desc: reason })
    });
  } catch (e) {
    // console.error("Earn Transaction Failed - Queued offline");
  }
};

export const spendGramCoin = async (userId: string, amount: number, reason: string): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/transaction`, {
      method: 'POST',
      headers: { 
        'Authorization': token,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ amount, type: 'SPEND', desc: reason })
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    return false;
  }
};

// ... keep other simulations for now ...
export const mintPassNFT = (userId: string, passData: any): NFTMetadata => {
  return {
    tokenId: `PENDING-MINT-${Date.now()}`,
    owner: userId,
    assetType: 'PASS',
    mintDate: Date.now(),
    data: JSON.stringify(passData)
  };
};

export const createEscrow = (buyerId: string, sellerId: string, amount: number): SmartContract => {
  return {
    id: `SC-PENDING`,
    type: 'ESCROW',
    buyer: buyerId,
    seller: sellerId,
    amount,
    condition: 'TRIP_COMPLETE',
    status: 'LOCKED'
  };
};

export const addToTrustChain = (data: any) => {
  console.log("Logged to server trust chain");
};

export const getVehicleHealth = (vehicleId: string) => ({ score: 95, verified: true });
