
import { DynamicFareResult, CrowdForecast, ChurnRiskAnalysis, ChatMessage, DeviationProposal, MandiRate, JobOpportunity, MarketItem, PilgrimagePackage, FuelAdvice, LeafDiagnosisResult, ParcelScanResult } from '../types';
import { API_BASE_URL } from '../config';

// Updated to fetch from Server API (Source of Truth)
export const calculateDynamicFare = async (distanceKm: number, timestamp: number): Promise<DynamicFareResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pricing/calculate?distance=${distanceKm}&timestamp=${timestamp}`);
    if (!res.ok) throw new Error("Pricing API failed");
    const data = await res.json();
    
    return {
      totalFare: data.totalFare,
      baseFare: data.baseFare,
      surgeAmount: data.totalFare - data.baseFare,
      discountAmount: 0,
      isRushHour: data.surge > 1,
      isHappyHour: data.surge < 1,
      message: data.message
    };
  } catch (e) {
    // Fallback if offline
    console.warn("Using offline fallback pricing");
    return {
      totalFare: 10 + (distanceKm * 6),
      baseFare: 10 + (distanceKm * 6),
      surgeAmount: 0,
      discountAmount: 0,
      isRushHour: false,
      isHappyHour: false,
      message: 'Offline Estimate'
    };
  }
};

// Keep local simulation for UI responsiveness only
export const getCrowdForecast = (timestamp: number): CrowdForecast => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  // Simple heuristic
  const occupancy = hour > 8 && hour < 19 ? 80 : 30; 
  return {
    level: occupancy > 70 ? 'HIGH' : 'LOW',
    occupancyPercent: occupancy,
    label: occupancy > 70 ? 'Busy' : 'Seats Available',
    hour
  };
};

// --- MANDI PRICES (Idea #4) & EO INTELLIGENCE ---
export const getMandiRates = (): MandiRate[] => {
    // Simulating Earth Observation (EO) Data integration
    // Sentinel-2/Landsat data predicts harvest maturity -> Supply Surge -> Price Drop
    return [
        { 
            crop: 'Rice (Sona)', 
            price: 2450, 
            trend: 'DOWN',
            satelliteInsight: "EO Data: 85% Harvest Maturity in Chenari. Supply surge imminent.",
            predictedPrice: 2300 // ML Feature 4: Dynamic Prediction
        },
        { 
            crop: 'Wheat', 
            price: 2100, 
            trend: 'UP',
            satelliteInsight: "EO Data: Low vegetation index in north sector.",
            predictedPrice: 2250 
        },
        { crop: 'Maize', price: 1850, trend: 'UP' },
        { crop: 'Mustard', price: 5400, trend: 'STABLE' },
        { crop: 'Potato', price: 1200, trend: 'UP' },
        { crop: 'Onion', price: 3500, trend: 'DOWN', predictedPrice: 3200 },
    ];
};

// --- COMMUNITY DATA PROVIDERS (Ideas #2, #12, #20) ---
export const getJobs = (): JobOpportunity[] => [
    { id: 'J1', title: 'Rajmistri (Mason)', location: 'Sasaram', wage: '₹700/day', contact: '9988...', type: 'DAILY' },
    { id: 'J2', title: 'Harvest Helper', location: 'Nokha', wage: '₹400/day + Meal', contact: '8877...', type: 'DAILY' },
    { id: 'J3', title: 'Driver (Truck)', location: 'Dehri', wage: '₹15,000/mo', contact: '7766...', type: 'CONTRACT' },
];

export const getMarketItems = (): MarketItem[] => [
    { id: 'M1', name: 'Cement Bag (Ultratech)', price: 420, unit: 'bag', supplier: 'Gupta Hardware', inStock: true },
    { id: 'M2', name: 'Rice (25kg Sona)', price: 1100, unit: 'sack', supplier: 'Raju Kirana', inStock: true },
    { id: 'M3', name: 'Fertilizer (Urea)', price: 266, unit: 'bag', supplier: 'Kisan Kendra', inStock: false },
    // Feature 5: Gram-Lakshmi Items
    { id: 'GL1', name: 'Mango Pickle (Ghar ka)', price: 150, unit: 'jar', supplier: 'Anita Devi SHG', inStock: true, isDidiProduct: true },
    { id: 'GL2', name: 'Madhubani Painting', price: 500, unit: 'pc', supplier: 'Sita Art Group', inStock: true, isDidiProduct: true },
];

export const getPackages = (): PilgrimagePackage[] => [
    { id: 'P1', name: 'Tara Chandi Darshan', locations: ['Sasaram', 'Tara Chandi'], price: 150, duration: '4 Hrs', image: 'temple' },
    { id: 'P2', name: 'Gupta Dham Yatra', locations: ['Chenari', 'Gupta Dham'], price: 450, duration: 'Full Day', image: 'cave' },
    { id: 'P3', name: 'Rohtasgarh Fort', locations: ['Akbarpur', 'Fort'], price: 300, duration: '6 Hrs', image: 'fort' },
];

// --- DRIVER UTILITIES: DIESEL GURU (New) ---
export const getFuelAdvice = (currentSpeed: number): FuelAdvice => {
    // Simulating terrain analysis based on generic Rohtas topography
    // In real app, this uses elevation data (DEM) relative to GPS coords
    const isUphill = Math.random() > 0.7;
    const efficiency = isUphill ? 8.5 : 12.2;
    
    return {
        currentEfficiency: efficiency,
        terrainType: isUphill ? 'UPHILL' : 'FLAT',
        recommendedGear: isUphill ? '3rd' : (currentSpeed > 40 ? '5th' : '4th'),
        recommendedSpeed: isUphill ? 35 : 55,
        savingsPotential: isUphill ? 150 : 50 // INR per trip if followed
    };
};

// --- BHOJPURI NLP ENGINE (Idea #3) ---
export const processNaturalLanguageQuery = async (q: string): Promise<ChatMessage> => {
    const lowerQ = q.toLowerCase();

    // Bhojpuri Intent Matching
    if (lowerQ.includes('kahan ba') || lowerQ.includes('kahan pahuchal')) {
        return { 
            id: Date.now().toString(), 
            text: "Gadi abhi Sasaram bypass par ba. (Bus is at Sasaram bypass).", 
            sender: 'BOT', 
            timestamp: Date.now()
        };
    }
    
    if (lowerQ.includes('ticket kat') || lowerQ.includes('book kar')) {
        return { 
            id: Date.now().toString(), 
            text: "Kahan jaye ke ba? Hum ticket book kar det bani. (Where to go? I can book ticket).", 
            sender: 'BOT', 
            timestamp: Date.now(),
            actionLink: { label: 'Book Now', tab: 'HOME' }
        };
    }

    if (lowerQ.includes('daam') || lowerQ.includes('pais') || lowerQ.includes('bhaada')) {
        return { 
            id: Date.now().toString(), 
            text: "Sasaram se Dehri ke bhaada ₹45 ba. (Fare from Sasaram to Dehri is ₹45).", 
            sender: 'BOT', 
            timestamp: Date.now() 
        };
    }

    // Safety / Didi Mode
    if (lowerQ.includes('safe') || lowerQ.includes('darr') || lowerQ.includes('police')) {
        return { 
            id: Date.now().toString(), 
            text: "Darr mat! 'Enable Safe Mode' button dabai turant. Police aur parivaar ke khabar mil jaai. (Don't fear! Press Safe Mode now.)", 
            sender: 'BOT', 
            timestamp: Date.now(),
            actionLink: { label: 'Active SOS Mode', tab: 'HOME' }
        };
    }

    // Toilet Finder
    if (lowerQ.includes('bathroom') || lowerQ.includes('toilet') || lowerQ.includes('washroom')) {
        return { 
            id: Date.now().toString(), 
            text: "Pink Toilet wala stop nakshe pe dikhaat ba. (Showing stops with Pink Toilets on map).", 
            sender: 'BOT', 
            timestamp: Date.now()
        };
    }
    
    // Default Fallback
    return { 
        id: Date.now().toString(), 
        text: "Hamra bujhaat naikhe. Fir se boli? (I didn't understand. Say again?)", 
        sender: 'BOT', 
        timestamp: Date.now() 
    };
};

// --- GENDER VERIFICATION BIOMETRICS (SECURITY) ---
export const verifyGenderBiometrics = async (type: 'VOICE' | 'FACE'): Promise<{verified: boolean, confidence: number}> => {
    // SIMULATION: In a real app, this sends data to a Python/TensorFlow backend
    // to analyze voice pitch (fundamental frequency > 165Hz) or facial landmarks.
    
    await new Promise(r => setTimeout(r, 2500)); // Simulate processing delay

    // For demo purposes, we randomly succeed heavily, but this logic effectively "Simulates" the check.
    // In production, failure here locks the account out of Didi Mode.
    const success = Math.random() > 0.1; // 90% success for demo flow
    
    return {
        verified: success,
        confidence: success ? 0.95 : 0.2
    };
};

// ... keep other helpers ...
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const analyzeChurnRisk = (passes: any[]): ChurnRiskAnalysis => { 
    return { riskLevel: 'LOW', churnProbability: 0.1 }; 
};

export const analyzeCrowdImage = async (c: number) => ({ detectedCount: c, expectedCount: c, discrepancy: 0, confidence: 1 });
export const analyzeDriverFatigue = () => ({ isFatigued: false, confidence: 1 });
export const recognizeFace = async () => ({ match: true });

export const calculateLogisticsCost = (t: string, w: number) => (w * 10);

// Updated with SAR Flood Detection Logic
export const checkForRouteDeviations = (location: string): DeviationProposal | null => {
    // Mock SAR Data: Detected flood in "Pahleza"
    if (location.toLowerCase() === 'pahleza') {
        return {
            id: 'DEV-FLOOD-01',
            detourVillage: 'Dehri Bypass',
            extraDistance: 5.2,
            estimatedRevenue: 0, // Safety first
            passengerCount: 0,
            confidenceScore: 0.98,
            satelliteReason: "⚠️ SAR Satellite detected 2ft water on Main Road."
        };
    }
    return null;
};

// --- NEW ML FEATURES ---

// 1. Visual Parcel Sizer (Computer Vision)
export const estimateParcelSize = async (): Promise<ParcelScanResult> => {
    // Simulates processing an image via MobileNet/YOLO
    await new Promise(r => setTimeout(r, 2000)); 
    // Randomize slightly for demo
    const weight = Math.floor(Math.random() * 40) + 5;
    return {
        weightKg: weight,
        dimensions: `${Math.floor(Math.random()*50)+20}x30x20 cm`,
        recommendedType: weight > 20 ? 'SACK_GRAIN' : 'BOX_SMALL'
    };
};

// 2. Pothole Detection (Telemetry)
export const analyzeRoadVibration = (accelZ: number): boolean => {
    // Simple anomaly detection on Z-axis accelerometer
    // Standard gravity is ~9.8. Variance > 3 indicates pothole/bump.
    return Math.abs(accelZ - 9.8) > 3.5;
};

// 5. Dr. Kisan Leaf Diagnosis (CNN)
export const diagnoseLeaf = async (): Promise<LeafDiagnosisResult> => {
    await new Promise(r => setTimeout(r, 3000));
    const diseases = [
        { disease: "Wheat Rust", remedy: "Spray Propiconazole (Tilt). Available at Gupta Hardware.", link: "S1" },
        { disease: "Rice Blast", remedy: "Use Tricyclazole. Reduce nitrogen fertilizer.", link: "S1" },
        { disease: "Healthy Crop", remedy: "No action needed. Keep irrigating.", link: null }
    ];
    return {
        ...diseases[Math.floor(Math.random() * diseases.length)],
        confidence: 0.92
    };
};

// 6. Driver Drowsiness (Facial Landmarks)
export const analyzeDriverDrowsiness = (): boolean => {
    // Simulates eye aspect ratio (EAR) check
    return Math.random() > 0.9; // 10% chance of drowsiness event in demo
};

// 7. Gram-Score (Credit Scoring)
export const calculateGramScore = (history: any[], walletBalance: number): number => {
    let score = 300; // Base
    // Factors
    if (walletBalance > 50) score += 50;
    if (history.length > 5) score += 100;
    if (history.length > 20) score += 100;
    // Cap at 900
    return Math.min(900, score);
};

// 8. Bus Occupancy (Audio)
export const analyzeBusAudioOccupancy = async (): Promise<number> => {
    await new Promise(r => setTimeout(r, 2000));
    // Simulates noise level -> crowd density map
    return Math.floor(Math.random() * 40) + 10;
};

// 9. Smart Batching (Clustering)
export const findPoolMatches = (route: string): boolean => {
    // Simulates checking if other users are booking same route window
    return Math.random() > 0.6; // 40% chance of pool found
};

// 10. Offline Fraud Detection
export const detectOfflineFraud = (logs: any[]): boolean => {
    // Check for impossible velocity between offline timestamps
    return false; // Mock
};
