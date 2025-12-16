import { Stop, NetworkNode, LocationData, RentalVehicle, MediaItem } from './types';
import { API_BASE_URL } from './config';

/* =======================
   GLOBAL CONFIG
======================= */

export const GOOGLE_API_KEY = "";
export const ROHTAS_MAP_URL =
  "https://raw.githubusercontent.com/Dheerajkumar3622/Villagelink-/refs/heads/main/rohtas_map.json";

/* =======================
   VISUAL LANDMARKS
======================= */

export const STOP_LANDMARKS: Record<string, string> = {
  Sasaram: "https://source.unsplash.com/random/100x100/?temple,ancient",
  "Dehri-on-Sone": "https://source.unsplash.com/random/100x100/?bridge,river",
  Nokha: "https://source.unsplash.com/random/100x100/?market,vegetable",
  Chenari: "https://source.unsplash.com/random/100x100/?mountain,hills",
  Bikramganj: "https://source.unsplash.com/random/100x100/?school,college",
  Pahleza: "https://source.unsplash.com/random/100x100/?field,farm",
  Suara: "https://source.unsplash.com/random/100x100/?tree,banyan",
  Sakhara: "https://source.unsplash.com/random/100x100/?pond,water",
};

/* =======================
   OFFLINE MEDIA
======================= */

export const OFFLINE_MEDIA: MediaItem[] = [
  { id: "MOV-01", title: "Panchayat Season 3 (Ep 1)", category: "MOVIE", sizeMb: 150, downloaded: true },
  { id: "NEWS-01", title: "Bihar Top News Today", category: "NEWS", sizeMb: 25, downloaded: true },
  { id: "AGRI-01", title: "Rabi Crop Guide 2024", category: "FARMING", sizeMb: 45, downloaded: true },
  { id: "EDU-01", title: "Maths Class 10: Algebra", category: "EDUCATION", sizeMb: 80, downloaded: false },
];

/* =======================
   TRANSLATIONS
======================= */

export const TRANSLATIONS = {
  EN: {
    welcome: "Namaste",
    plan_journey: "Plan Your Journey",
    from: "From",
    to: "To",
    book_ticket: "Book Ticket",
    buy_pass: "Buy Pass",
    total_fare: "Total Fare",
    search_bus: "Search Buses",
    offline_mode: "OFFLINE MODE",
    transport: "Transport",
    market: "Gram-Haat",
    home: "Home",
    my_passes: "My Passes",
    parcels: "Parcels",
    profile: "Profile",
    login: "Login",
    register: "Register",
    phone: "Phone Number",
    password: "Password",
    driver: "Driver",
    passenger: "Passenger",
    shopkeeper: "Seller",
    confirm: "Confirm",
    scan: "Scan",
    loading: "Loading...",
    seats: "Seats",
    available: "Available",
    send_parcel: "Send Parcel",
    book_charter: "Book Charter",
    sos_alert: "SOS Help",
    verify: "Verify",
    chutta_wallet: "Chutta",
    monthly: "Monthly",
    vidya_vahan: "Vidya Vahan",
  },
  HI: {
    welcome: "नमस्ते",
    plan_journey: "यात्रा की योजना",
    from: "कहाँ से",
    to: "कहाँ तक",
    book_ticket: "टिकट बुक करें",
    buy_pass: "पास खरीदें",
    total_fare: "कुल किराया",
    search_bus: "बस खोजें",
    offline_mode: "इंटरनेट नहीं है",
    transport: "यातायात",
    market: "ग्राम-हाट",
    home: "होम",
    my_passes: "मेरे पास",
    parcels: "पार्सल",
    profile: "प्रोफाइल",
    login: "लॉगिन",
    register: "खाता बनाएं",
    phone: "मोबाइल नंबर",
    password: "पासवर्ड",
    driver: "ड्राइवर",
    passenger: "यात्री",
    shopkeeper: "दुकानदार",
    confirm: "पक्का करें",
    scan: "स्कैन",
    loading: "लोड हो रहा है...",
    seats: "सीटें",
    available: "खाली",
    send_parcel: "पार्सल भेजें",
    book_charter: "गाड़ी बुक करें",
    sos_alert: "मदद (SOS)",
    verify: "जांच",
    chutta_wallet: "छुट्टा",
    monthly: "मासिक",
    vidya_vahan: "विद्या वाहन",
  },
};

/* =====================================================
   🚫 IMPORTANT CHANGE
   -----------------------------------------------------
   ❌ Frontend me ALL_LOCATIONS / GEO DATA hata diya
   ✅ Village search ab backend API se hoga
===================================================== */

// Deprecated placeholders (to avoid breaking imports)
export const ALL_LOCATIONS: LocationData[] = [];
export const STOPS: Stop[] = [];
export const STOP_COORDINATES: Record<string, { lat: number; lng: number }> = {};
export const STOP_POSITIONS: Record<string, number> = {};

// No-op initializer (kept for compatibility)
export const initializeGeoData = async () => {
  console.info("Geo data loading skipped (API-based search enabled)");
};

/* =======================
   RENTAL FLEET
======================= */

export const RENTAL_FLEET: RentalVehicle[] = [
  {
    id: "V-001",
    type: "HATCHBACK",
    model: "Alto 800 / Kwid",
    capacity: 4,
    baseRate: 800,
    ratePerKm: 12,
    imageIcon: "car",
    available: true,
  },
  {
    id: "V-002",
    type: "SUV",
    model: "Scorpio N / Bolero",
    capacity: 7,
    baseRate: 2500,
    ratePerKm: 18,
    imageIcon: "suv",
    available: true,
  },
  {
    id: "V-003",
    type: "TRAVELER",
    model: "Force Traveler",
    capacity: 14,
    baseRate: 4500,
    ratePerKm: 25,
    imageIcon: "bus",
    available: false,
  },
];

/* =======================
   NETWORK GRAPH (STATIC)
======================= */

export const ROHTAS_NETWORK: Record<string, NetworkNode> = {
  dehri: { id: "BLK-001", name: "Dehri-on-Sone", type: "Hub", connections: ["sakhara", "suara"] },
  sakhara: { id: "VIL-010", name: "Sakhara", type: "Stop", connections: ["dehri"] },
  suara: { id: "VIL-011", name: "Suara", type: "Stop", connections: ["dehri"] },
};

/* =======================
   MISC
======================= */

export const TICKET_PRICE = 45;

export const TEST_USERS = {
  DRIVER: { id: "DRV-888", name: "Raju Driver", password: "drive", role: "DRIVER" as const },
  PASSENGER: { id: "USR-999", name: "Amit Kumar", password: "pass", role: "PASSENGER" as const },
};
