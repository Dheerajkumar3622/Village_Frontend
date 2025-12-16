
// --- APP CONFIGURATION ---

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Automatically select the correct API URL
// 1. If running locally, use localhost:3001
// 2. If running in production (Render), use the current origin/relative path to avoid CORS and domain mismatches.
export const API_BASE_URL = isLocal 
  ? 'http://localhost:3001' 
  : window.location.origin; 
