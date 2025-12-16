
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStoredTickets, updateTicketStatus, subscribeToUpdates, broadcastBusLocation, registerDriverOnNetwork, disconnectDriver, verifyPass, getRentalRequests, respondToRental, toggleDriverCharter, getAllParcels, updateParcelStatus } from '../services/transportService';
import { findDetailedPath, calculatePathDistance } from '../services/graphService';
import { getRoutes } from '../services/adminService';
import { Ticket, TicketStatus, PaymentMethod, User, LocationData, Pass, DeviationProposal, RentalBooking, TelemetryData, VehicleComponentHealth, RouteDefinition, ParcelBooking, LedgerEntry, DriverDocument, FuelAdvice } from '../types';
import { checkForRouteDeviations, analyzeCrowdImage, analyzeDriverFatigue, recognizeFace, getFuelAdvice, formatCurrency, analyzeRoadVibration, analyzeDriverDrowsiness, analyzeBusAudioOccupancy } from '../services/mlService';
import { addToTrustChain, getVehicleHealth } from '../services/blockchainService';
import { verifySignature } from '../services/securityService';
import { getDigitalTwinData, analyzeDriverFace, playSonicToken } from '../services/advancedFeatures';
import { Button } from './Button';
import { ArrowRight, Wallet, Smartphone, XCircle, Play, Square, ScanLine, AlertTriangle, UserCheck, Zap, Camera, Car, Activity, EyeOff, ScanFace, Box, ShieldCheck, Check, Users, MapPin, MonitorSmartphone, Settings, Clock, Lock, Route as RouteIcon, Volume2, Package, Truck, CloudRain, Satellite, Wrench, FileText, Fuel, BarChart3, Radio, Plus, Trash2, ArrowLeft, TrendingUp, Landmark, Wifi, Coins, Mic, AlertOctagon } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { Modal } from './Modal';
import { TRANSLATIONS } from '../constants';

interface DriverViewProps {
  user: User;
  lang: 'EN' | 'HI';
}

interface TripConfig {
  isActive: boolean;
  startLocation: LocationData | null;
  endLocation: LocationData | null;
  path: string[]; 
  totalDistance: number;
}

export const DriverView: React.FC<DriverViewProps> = ({ user, lang }) => {
  const t = (key: keyof typeof TRANSLATIONS.EN) => TRANSLATIONS[lang][key] || TRANSLATIONS.EN[key];
  const [viewMode, setViewMode] = useState<'BUS' | 'CHARTER' | 'CARGO' | 'UTILITIES'>('BUS');
  
  if (!user.isVerified) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-slate-50 dark:bg-black">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Clock size={48} className="text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white mb-2">Verification Pending</h2>
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-xs text-left">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-2">Application Details</p>
                  <div className="flex justify-between text-sm dark:text-slate-200 mb-1"><span>Name:</span> <span className="font-bold">{user.name}</span></div>
              </div>
              <button onClick={() => window.location.reload()} className="mt-8 text-brand-600 font-bold text-sm">Refresh Status</button>
          </div>
      );
  }

  // Bus Mode State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  
  // Charter & Cargo
  const [isCharterAvailable, setIsCharterAvailable] = useState(false);
  const [rentalRequests, setRentalRequests] = useState<RentalBooking[]>([]);
  const [parcels, setParcels] = useState<ParcelBooking[]>([]);
  const [wapsiMatches, setWapsiMatches] = useState<ParcelBooking[]>([]);

  // Features
  const [deviation, setDeviation] = useState<DeviationProposal | null>(null);
  const [isSafetyMonitorActive, setIsSafetyMonitorActive] = useState(false);
  const [fatigueAlert, setFatigueAlert] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState(false);
  const [vehicleComponents, setVehicleComponents] = useState<VehicleComponentHealth[]>([]);

  // Utilities
  const [showKaagazModal, setShowKaagazModal] = useState(false);
  const [showDieselModal, setShowDieselModal] = useState(false);
  
  const [isMobileATM, setIsMobileATM] = useState(false); 
  const [isDataMuleActive, setIsDataMuleActive] = useState(false);
  const [useLandmarkNav, setUseLandmarkNav] = useState(false);
  
  // ML Feature 2: Road AI
  const [isRoadAIActive, setIsRoadAIActive] = useState(false);
  // ML Feature 8: Audio Occupancy
  const [isCountingAudio, setIsCountingAudio] = useState(false);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
      { id: '1', type: 'INCOME', category: 'TICKET', amount: 450, description: 'Morning Trip', timestamp: Date.now() - 10000000 },
      { id: '2', type: 'EXPENSE', category: 'FUEL', amount: 1500, description: 'Diesel Full Tank', timestamp: Date.now() - 5000000 },
  ]);
  const [newExpense, setNewExpense] = useState({ amount: '', desc: '' });
  const [fuelAdvice, setFuelAdvice] = useState<FuelAdvice | null>(null);

  const [routeMode, setRouteMode] = useState<'CUSTOM' | 'OFFICIAL'>('OFFICIAL');
  const [officialRoutes, setOfficialRoutes] = useState<RouteDefinition[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [tripConfig, setTripConfig] = useState<TripConfig>({ isActive: false, startLocation: null, endLocation: null, path: [], totalDistance: 0 });
  const [isOnline, setIsOnline] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const routeListRef = useRef<HTMLDivElement>(null);

  const currentOccupancy = useMemo(() => {
    return tickets.filter(t => t.status === TicketStatus.BOARDED).reduce((acc, t) => acc + t.passengerCount, 0);
  }, [tickets]);

  useEffect(() => {
    let interval: any;
    if (isOnline && tripConfig.isActive) {
      interval = setInterval(() => {
        // ML Feature 2: Road AI Simulation
        if (isRoadAIActive) {
            const hasPothole = analyzeRoadVibration(9.8 + (Math.random() - 0.5) * 5);
            if (hasPothole) console.log("Pothole detected & logged");
        }

        // ML Feature 6: Drowsiness Check Simulation
        if (analyzeDriverDrowsiness()) {
            setFatigueAlert(true);
            playSonicToken('WAKE-UP-ALERT');
        }

        broadcastBusLocation({
          driverId: user.id,
          isOnline: true,
          activePath: tripConfig.path,
          currentStopIndex: currentStopIndex,
          status: 'EN_ROUTE',
          location: tripConfig.startLocation ? { lat: tripConfig.startLocation.lat, lng: tripConfig.startLocation.lng, timestamp: Date.now() } : null,
          telemetry: undefined,
          capacity: user.vehicleCapacity || 40,
          occupancy: currentOccupancy,
          isATM: isMobileATM // Broadcast ATM capability
        });
        if (!deviation && Math.random() > 0.95) {
            const proposal = checkForRouteDeviations(tripConfig.path[currentStopIndex]);
            if (proposal) setDeviation(proposal);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isOnline, tripConfig, user.id, currentStopIndex, deviation, isMobileATM, currentOccupancy, isRoadAIActive]);

  useEffect(() => {
    setTickets(getStoredTickets());
    subscribeToUpdates(() => setTickets(getStoredTickets()), () => {});
    const loadRoutes = async () => { const routes = await getRoutes(); setOfficialRoutes(routes); }; loadRoutes();
    const loadParcels = async () => { const p = await getAllParcels(); setParcels(p); }; loadParcels();
    const rentalInterval = setInterval(async () => {
        if (viewMode === 'CHARTER' && isCharterAvailable) { const reqs = await getRentalRequests(); setRentalRequests(reqs); }
        if (viewMode === 'CARGO') { loadParcels(); }
    }, 5000);
    return () => { disconnectDriver(user.id); clearInterval(rentalInterval); };
  }, [user.id, viewMode, isCharterAvailable]);

  const handleStartTrip = () => {
    if (routeMode === 'CUSTOM') {
        if (!tripConfig.startLocation || !tripConfig.endLocation) return;
        const path = findDetailedPath(tripConfig.startLocation.name, tripConfig.endLocation.name);
        const dist = path ? calculatePathDistance(path) : 0;
        const finalPath = path && path.length > 0 ? path : [tripConfig.startLocation.name, tripConfig.endLocation.name];
        setTripConfig(prev => ({ ...prev, isActive: true, path: finalPath, totalDistance: dist }));
    } else {
        const route = officialRoutes.find(r => r.id === selectedRouteId);
        if (!route) return alert("Select a route");
        setTripConfig(prev => ({ ...prev, isActive: true, path: route.stops, totalDistance: route.totalDistance, startLocation: { name: route.from, lat: 0, lng: 0, address: '', block: '', panchayat: '', villageCode: '' }, endLocation: { name: route.to, lat: 0, lng: 0, address: '', block: '', panchayat: '', villageCode: '' } }));
    }
    setIsOnline(true); setIsSafetyMonitorActive(true); registerDriverOnNetwork(user);
  };

  const handleEndTrip = () => {
    setTripConfig({ isActive: false, startLocation: null, endLocation: null, path: [], totalDistance: 0 });
    setIsOnline(false); setIsSafetyMonitorActive(false); disconnectDriver(user.id);
  };

  const handleAudioCount = async () => {
      setIsCountingAudio(true);
      const count = await analyzeBusAudioOccupancy();
      alert(`AI Estimate based on noise: ${count} passengers.`);
      setIsCountingAudio(false);
  };

  return (
    <div className="max-w-md mx-auto pb-32 animate-fade-in font-sans relative">
       {/* FATIGUE ALERT OVERLAY (ML Feature 6) */}
       {fatigueAlert && (
           <div className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center text-white animate-pulse">
               <AlertOctagon size={80} className="mb-4 animate-bounce" />
               <h1 className="text-3xl font-black mb-2 uppercase tracking-widest text-center px-4">Driver Fatigue Detected!</h1>
               <p className="text-lg font-bold mb-8 opacity-90 text-center px-6">Please stop and rest immediately.</p>
               <button onClick={() => setFatigueAlert(false)} className="bg-white text-red-600 px-8 py-3 rounded-full font-bold shadow-xl">I am Awake</button>
           </div>
       )}

       <div className="mb-6 bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-700">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-lg">{user.name.charAt(0)}</div>
                <div>
                    <h2 className="text-base font-bold leading-none">Cpt. {user.name.split(' ')[0]}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                        <span>{viewMode} Mode</span>
                        {isMobileATM && <span className="text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Coins size={10} /> ATM Active</span>}
                    </div>
                </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex flex-col items-end gap-0.5 ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>{isOnline ? 'ACTIVE' : 'IDLE'}</div>
            </div>
         </div>
         <div className="flex bg-slate-800 p-1 rounded-xl mt-4 overflow-x-auto gap-1">
             <button onClick={() => setViewMode('BUS')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap ${viewMode === 'BUS' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Bus</button>
             <button onClick={() => setViewMode('CARGO')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap ${viewMode === 'CARGO' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Logistics</button>
             <button onClick={() => setViewMode('CHARTER')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap ${viewMode === 'CHARTER' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Charter</button>
             <button onClick={() => setViewMode('UTILITIES')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap ${viewMode === 'UTILITIES' ? 'bg-brand-700 text-white' : 'text-slate-500'}`}>Tools</button>
         </div>
       </div>

      {viewMode === 'UTILITIES' ? (
          <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setIsMobileATM(!isMobileATM)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isMobileATM ? 'bg-emerald-50 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2"><Coins size={20} /></div>
                      <h4 className="font-bold text-sm dark:text-white">Mobile ATM</h4>
                      <p className="text-xs text-slate-500">{isMobileATM ? 'Broadcast Active' : 'Enable Cash-Out'}</p>
                  </div>

                  <div onClick={() => setIsDataMuleActive(!isDataMuleActive)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isDataMuleActive ? 'bg-blue-50 border-blue-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2"><Wifi size={20} /></div>
                      <h4 className="font-bold text-sm dark:text-white">Data Mule</h4>
                      <p className="text-xs text-slate-500">{isDataMuleActive ? 'Hosting Content' : 'Sync Content'}</p>
                  </div>

                  {/* ML Feature 2: Road AI Toggle */}
                  <div onClick={() => setIsRoadAIActive(!isRoadAIActive)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isRoadAIActive ? 'bg-amber-50 border-amber-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2"><Activity size={20} /></div>
                      <h4 className="font-bold text-sm dark:text-white">Road AI</h4>
                      <p className="text-xs text-slate-500">{isRoadAIActive ? 'Detecting Potholes' : 'Monitor Roads'}</p>
                  </div>

                  {/* ML Feature 8: Audio Occupancy */}
                  <div onClick={handleAudioCount} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500`}>
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mb-2">
                          {isCountingAudio ? <span className="animate-spin">⌛</span> : <Mic size={20} />}
                      </div>
                      <h4 className="font-bold text-sm dark:text-white">Count Crowd</h4>
                      <p className="text-xs text-slate-500">Use Audio AI</p>
                  </div>
              </div>
          </div>
      ) : (!tripConfig.isActive ? (
        // ... (Route Selection UI)
        <div className="glass-panel p-8 rounded-[32px] shadow-2xl relative border border-white/50 text-center mt-6">
            {/* ... */}
            <h3 className="text-2xl font-bold dark:text-white mb-2">Begin Shift</h3>
            {/* ... */}
            <Button variant="primary" fullWidth onClick={handleStartTrip} className="h-14 text-lg rounded-xl">Initialize Route</Button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col h-80">
                {/* ... Demand Header ... */}
                <div className="relative z-10 flex-1 overflow-y-auto pr-2 space-y-0" ref={routeListRef}>
                    <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-700 -z-10"></div>
                    {tripConfig.path.map((stop, idx) => {
                        // ...
                        return (
                            <div key={idx} className={`flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0`}>
                                <div className="flex items-center gap-4">
                                    {/* Landmark Nav Simulation */}
                                    {useLandmarkNav ? (
                                        <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden relative">
                                            <img src={`https://source.unsplash.com/random/100x100/?tree,village,${stop}`} alt="" className="w-full h-full object-cover opacity-70" />
                                        </div>
                                    ) : (
                                        <div className={`relative w-6 h-6 rounded-full flex items-center justify-center border-2`}></div>
                                    )}
                                    <span className={`text-sm font-medium text-slate-400`}>{stop}</span>
                                </div>
                                {/* ... */}
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* ... Buttons ... */}
        </div>
      ))}
      {/* Modals... */}
    </div>
  );
};
