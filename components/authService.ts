import { User, UserRole, AuthResponse } from '../types';
import { TEST_USERS } from '../constants';

const USERS_KEY = 'villagelink_users';
const CURRENT_USER_KEY = 'villagelink_current_user';

interface StoredUser extends User {
  password?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  let users: StoredUser[] = stored ? JSON.parse(stored) : [];
  
  // Seed test users if they don't exist (Constraint 1: Temporary users)
  const driverExists = users.find((u) => u.id === TEST_USERS.DRIVER.id);
  if (!driverExists) {
    users.push(TEST_USERS.DRIVER as unknown as StoredUser);
    users.push(TEST_USERS.PASSENGER as unknown as StoredUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  
  return users;
};

export const registerUser = async (name: string, role: UserRole, password: string): Promise<AuthResponse> => {
  await delay(800); // Simulate network
  const users = getStoredUsers();
  
  // Generate ID: USR-XXX
  const id = `USR-${Math.floor(100 + Math.random() * 900)}`;
  
  const newUser: StoredUser = { id, name, role, password };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  const { password: _, ...safeUser } = newUser;
  return { success: true, user: safeUser as User };
};

export const loginUser = async (id: string, password: string): Promise<AuthResponse> => {
  await delay(600);
  const users = getStoredUsers();
  const user = users.find(u => u.id === id && u.password === password);
  
  if (user) {
    const { password: _, ...safeUser } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return { success: true, user: safeUser as User };
  }
  
  return { success: false, message: "Invalid ID or Password" };
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getAuthToken = (): string | null => {
  const user = getCurrentUser();
  return user ? 'mock-token' : null;
};