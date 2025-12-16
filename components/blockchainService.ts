
import { Wallet, NFTMetadata, SmartContract } from '../types';
import { getAuthToken } from './authService';

const API_URL = '/api/user';

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/wallet`, {
      headers: { 'Authorization': token }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Wallet Fetch Error:", e);
    return null;
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
    console.error("Earn Transaction Failed", e);
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
    console.error("Spend Transaction Failed", e);
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
