
import { User, UserRole, AuthResponse, VehicleType } from '../types';
import { TEST_USERS } from '../constants';
import { API_BASE_URL } from '../config';
// import { auth, db } from './firebaseConfig'; // Uncomment to use Firebase

const API_URL = `${API_BASE_URL}/api/auth`;
const TOKEN_KEY = 'villagelink_token';
const USER_KEY = 'villagelink_user';
const USERS_KEY = 'villagelink_users_v3'; 
const CURRENT_USER_KEY = 'villagelink_current_user';

interface StoredUser extends User {
  password?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  let users: StoredUser[] = stored ? JSON.parse(stored) : [];
  
  // Explicitly define Test Accounts with passwords to ensure they exist
  const testAccounts = [
      { ...TEST_USERS.DRIVER, isVerified: true, password: TEST_USERS.DRIVER.password },
      { ...TEST_USERS.PASSENGER, isVerified: true, password: TEST_USERS.PASSENGER.password },
      { id: 'SHOP-001', name: 'Raju Shopkeeper', role: 'SHOPKEEPER', password: 'shop', isVerified: true },
      { id: 'ADMIN-001', name: 'Master Controller', role: 'ADMIN', password: 'admin123', isVerified: true }
  ];

  // Self-Healing Logic: 
  // Remove any existing records of test accounts to prevent stale passwords
  const testIds = testAccounts.map(t => t.id);
  users = users.filter(u => !testIds.includes(u.id));
  
  testAccounts.forEach(acc => users.push(acc as unknown as StoredUser));
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return users;
};

export const registerUser = async (name: string, role: UserRole, password: string, email: string, phone: string, capacity?: number, vehicleType?: VehicleType): Promise<AuthResponse> => {
  // 1. Try Live Server
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, password, email, phone, vehicleCapacity: capacity, vehicleType })
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data;
    } else if (!res.ok) {
        // If server returns error (e.g. User exists), return it directly
        return { success: false, message: data.error || "Registration failed on server" };
    }
  } catch (e) { 
      // Only fall through to mock if NETWORK fails
      console.warn("Registration Network Error, trying offline mode...", e);
  }

  // 2. Fallback Mock (Only if server unreachable)
  await delay(800);
  const users = getStoredUsers();
  
  const existing = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
  if (existing) {
      return { success: false, message: "User already exists (Offline Mode)" };
  }

  const id = `USR-${Math.floor(100 + Math.random() * 900)}`;
  const newUser: StoredUser = { id, name, role, password, email, phone, vehicleCapacity: capacity, vehicleType, isVerified: role === 'PASSENGER' };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  const { password: _, ...safeUser } = newUser;
  localStorage.setItem(TOKEN_KEY, 'mock-token-' + id);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  return { success: true, user: safeUser as User };
};

export const loginUser = async (loginId: string, password: string): Promise<AuthResponse> => {
  const cleanLoginId = loginId.trim();
  const cleanPassword = password.trim();

  // 1. Try Live Server
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: cleanLoginId, password: cleanPassword })
    });

    const data = await res.json();

    if (res.ok && data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data;
    } else {
        // Server responded but login failed (e.g. 401 Invalid Credentials)
        // DO NOT Fallback to mock here, or we mask real server errors
        return { success: false, message: data.error || "Invalid ID or Password" };
    }
  } catch (e) { 
      // Only fall through to mock if NETWORK fails (e.g. server down)
      console.warn("Login Network Error, trying offline mode...", e);
  }

  // 2. Fallback Mock (Only runs if fetch threw an exception)
  await delay(600);
  const users = getStoredUsers();
  
  const user = users.find(u => 
    (u.id === cleanLoginId || u.email === cleanLoginId || u.phone === cleanLoginId) && 
    u.password === cleanPassword
  );
  
  if (user) {
    const { password: _, ...safeUser } = user;
    localStorage.setItem(TOKEN_KEY, 'mock-token-' + user.id);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    return { success: true, user: safeUser as User };
  }
  
  return { success: false, message: "Invalid ID or Password (Offline Mode)" };
};

export const logoutUser = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !token.startsWith('mock-token')) {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Authorization': token } });
    } catch (e) {}
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY); 
};

export const requestPasswordReset = async (identifier: string) => {
    return { message: "OTP sent to your device", otp: "123456", error: undefined as string | undefined };
};

export const resetPassword = async (identifier: string, token: string, newPassword: string) => {
    return { message: "Password updated successfully", error: undefined as string | undefined };
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};
