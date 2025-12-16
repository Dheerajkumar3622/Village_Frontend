
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, PaymentMethod, User, LocationData, Pass, SeatConfig, ChurnRiskAnalysis, RentalVehicle, RentalBooking, ParcelBooking, Wallet as WalletType, GeoLocation, CrowdForecast, DynamicFareResult, MandiRate, JobOpportunity, MarketItem, PilgrimagePackage, NewsItem, Shop, Product, LostItem, LeafDiagnosisResult, BusState } from '../types';
import { RENTAL_FLEET, TRANSLATIONS, STOP_LANDMARKS, OFFLINE_MEDIA } from '../constants';
import { generateTicketId, generatePassId, generateRentalId, generateParcelId, saveTicket, savePass, getStoredTickets, getMyPasses, bookRental, bookParcel, getAllParcels, getActiveBuses } from '../services/transportService';
import { calculateDynamicFare, getCrowdForecast, formatCurrency, analyzeChurnRisk, calculateLogisticsCost, getMandiRates, getJobs, getMarketItems, getPackages, verifyGenderBiometrics, diagnoseLeaf, estimateParcelSize, findPoolMatches } from '../services/mlService';
import { getWallet, mintPassNFT, createEscrow, earnGramCoin, spendGramCoin } from '../services/blockchainService';
import { getBehavioralScore, generateDeviceFingerprint, encryptData, signTransaction, isTravelPossible, updateLastLocation } from '../services/securityService';
import { fetchSmartRoute } from '../services/graphService';
import { isOnline, queueAction } from '../services/offlineService';
import { scanMeshPeers, broadcastToMesh, playSonicToken } from '../services/advancedFeatures';
import { Button } from './Button';
import { LiveTracker } from './LiveTracker';
import { LocationSelector } from './LocationSelector';
import { Modal } from './Modal';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { DigitalTwinSeatMap } from './DigitalTwinSeatMap';
import { ARFinder } from './ARFinder';
import { BottomNav } from './BottomNav';
import { UserProfile } from './UserProfile';
import { MarketingView } from './MarketingView';
import { Ticket as TicketIcon, Check, Zap, Bus, MapPin, Route, CreditCard, User as UserIcon, Sparkles, Car, Package, Box, ShieldCheck, Gem, Lock, WifiOff, Scan, ArrowLeft, ChevronRight, Search, Truck, Share2, Leaf, Radio, Link, Coins, TrendingUp, Briefcase, ShoppingBag, Newspaper, AlertTriangle, Bike, Volume2, Users, PartyPopper, CheckCircle, Satellite, Heart, GraduationCap, Flower2, Mic, Camera, AlertOctagon, Store, BookOpen, Tractor, BatteryCharging, Stethoscope, SearchX, HelpCircle, Beef, Sprout, ScanLine, Gift, Phone, ArrowDown, Wifi, VolumeX, Clock } from 'lucide-react';

interface PassengerViewProps {
  user: User;
  lang: 'EN' | 'HI';
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

export const PassengerView: React.FC<PassengerViewProps> = ({ user, lang }) => {
  const t = (key: keyof typeof TRANSLATIONS.EN) => TRANSLATIONS[lang][key] || TRANSLATIONS.EN[key];

  const [appMode, setAppMode] = useState<'TRANSPORT' | 'MARKET'>('TRANSPORT');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'BOOK_RENTAL' | 'BOOK_PARCEL'>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<'HOME' | 'PASSES' | 'LOGISTICS' | 'COMMUNITY' | 'PROFILE'>('HOME');
  const [communityTab, setCommunityTab] = useState<'BAZAAR' | 'JOBS' | 'NEWS' | 'KISAN' | 'LOST'>('BAZAAR');
  const [isOfflineMode, setIsOfflineMode] = useState(!isOnline());
  
  // Public Transport State
  const [fromLocation, setFromLocation] = useState<LocationData | null>(null);
  const [toLocation, setToLocation] = useState<LocationData | null>(null);
  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [calculatedPath, setCalculatedPath] = useState<string[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [myPasses, setMyPasses] = useState<Pass[]>([]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [upcomingBuses, setUpcomingBuses] = useState<BusState[]>([]); // New for Upcoming List

  // New Feature State
  const [hasLivestock, setHasLivestock] = useState(false); 
  const [hasInsurance, setHasInsurance] = useState(false); 
  const [isBusPaathshalaActive, setIsBusPaathshalaActive] = useState(false); 
  const [lostItems, setLostItems] = useState<LostItem[]>([]); 
  const [drKisanResult, setDrKisanResult] = useState<LeafDiagnosisResult | null>(null); 
  const [isScanningLeaf, setIsScanningLeaf] = useState(false);
  const [isScanningParcel, setIsScanningParcel] = useState(false); 
  const [logisticsPoolFound, setLogisticsPoolFound] = useState(false); 
  const [showMediaHub, setShowMediaHub] = useState(false); 
  const [voiceGuideActive, setVoiceGuideActive] = useState(false); 
  
  const [cargoSubsidy, setCargoSubsidy] = useState(0);

  const [isGift, setIsGift] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [mandiRates, setMandiRates] = useState<MandiRate[]>([]);
  const [didiMode, setDidiMode] = useState(false); 
  const [showChuttaModal, setShowChuttaModal] = useState(false);
  const [isDidiVerified, setIsDidiVerified] = useState(user.isDidiVerified || false);
  const [showDidiVerification, setShowDidiVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'START' | 'VOICE' | 'FACE' | 'PROCESSING' | 'SUCCESS' | 'FAIL'>('START');
  
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [packages, setPackages] = useState<PilgrimagePackage[]>([]);

  const [isBuyingPass, setIsBuyingPass] = useState(false);
  const [seatConfig, setSeatConfig] = useState<SeatConfig>('SEAT');
  const [passType, setPassType] = useState<'MONTHLY' | 'STUDENT' | 'VIDYA_VAHAN'>('MONTHLY'); 

  const [logisticsWeight, setLogisticsWeight] = useState(5);
  const [logisticsItemType, setLogisticsItemType] = useState('BOX_SMALL');
  const [logisticsPrice, setLogisticsPrice] = useState(0);
  const [myParcels, setMyParcels] = useState<ParcelBooking[]>([]);

  const [churnAnalysis, setChurnAnalysis] = useState<ChurnRiskAnalysis | null>(null);
  const [fareDetails, setFareDetails] = useState<DynamicFareResult | null>(null);
  const [crowdForecast, setCrowdForecast] = useState<CrowdForecast | null>(null);
  const [passPrice, setPassPrice] = useState<number>(0);

  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [rentalDate, setRentalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rentalPrice, setRentalPrice] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState<string>(''); 

  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [trustScore, setTrustScore] = useState(1.0);
  const [marketBooking, setMarketBooking] = useState<{product: Product, shop: Shop} | null>(null);

  useEffect(() => {
    window.addEventListener('online', () => setIsOfflineMode(false));
    window.addEventListener('offline', () => setIsOfflineMode(true));

    setMandiRates(getMandiRates());
    setJobs(getJobs());
    setMarketItems(getMarketItems());
    setPackages(getPackages());
    fetch('/api/community/news').then(r => r.json()).then(d => setNews(Array.isArray(d) ? d : [])).catch(() => {});

    setLostItems([
        { id: 'L1', item: 'Red School Bag', location: 'Bus 404', date: 'Yesterday', contact: '9988...', status: 'LOST' },
        { id: 'L2', item: 'Watch (Titan)', location: 'Sasaram Stand', date: 'Today', contact: '8877...', status: 'FOUND' }
    ]);

    const verifyDevice = async () => {
        await generateDeviceFingerprint();
        setTrustScore(getBehavioralScore());
    };
    verifyDevice();

    const fetchTickets = () => {
      const all = getStoredTickets().filter(t => t.userId === user.id);
      setActiveTickets(all.filter(t => ['PENDING', 'BOARDED', 'PAID'].includes(t.status)));
    };
    const fetchPasses = async () => {
       const passes = await getMyPasses(user.id);
       setMyPasses(passes);
       const risk = analyzeChurnRisk(passes);
       if (risk.riskLevel === 'HIGH' && risk.recommendedOffer) {
           setChurnAnalysis(risk);
       }
    };
    const fetchWallet = async () => {
        const w = await getWallet(user.id);
        setWallet(w);
    };
    const fetchParcels = async () => {
        const all = await getAllParcels();
        setMyParcels(all.filter(p => p.userId === user.id));
    };

    // Filter active buses relevant to current selection
    const filterUpcomingBuses = () => {
        if (!fromLocation) {
            setUpcomingBuses([]);
            return;
        }
        const active = getActiveBuses();
        // Simple logic: Buses that contain the 'from' location in their path
        const relevant = active.filter(b => b.activePath.includes(fromLocation.name));
        setUpcomingBuses(relevant);
    };

    fetchTickets();
    fetchPasses();
    fetchWallet();
    fetchParcels();
    filterUpcomingBuses();

    const interval = setInterval(() => {
        fetchTickets();
        fetchPasses();
        fetchWallet();
        fetchParcels();
        filterUpcomingBuses();
        setTrustScore(getBehavioralScore());
    }, 5000);
    return () => {
        clearInterval(interval);
        window.removeEventListener('online', () => setIsOfflineMode(false));
        window.removeEventListener('offline', () => setIsOfflineMode(true));
    };
  }, [user.id, fromLocation]);

  useEffect(() => {
    if (currentView === 'BOOK_PARCEL' || marketBooking) {
        setLogisticsPrice(calculateLogisticsCost(logisticsItemType, logisticsWeight));
        const hasPool = findPoolMatches(fromLocation?.name || '');
        setLogisticsPoolFound(hasPool);
    }

    const updateRoute = async () => {
        if (fromLocation && toLocation) {
            setIsCalculatingRoute(true);
            const routeData = await fetchSmartRoute(fromLocation, toLocation);
            
            setTripDistance(routeData.distance);
            setCalculatedPath(routeData.path);
            setIsCalculatingRoute(false);

            if (currentView === 'DASHBOARD') {
                const isHighTrafficRoute = routeData.distance > 5 && Math.random() > 0.5;
                const subsidy = isHighTrafficRoute ? 5 : 0;
                setCargoSubsidy(subsidy);

                calculateDynamicFare(routeData.distance, Date.now()).then(dynamicFare => {
                    setFareDetails(dynamicFare);
                    let monthly = dynamicFare.baseFare * 20;
                    if (seatConfig === 'STANDING') monthly = monthly * 0.80;
                    if (churnAnalysis?.recommendedOffer && isBuyingPass) monthly = monthly * (1 - churnAnalysis.recommendedOffer.discountPercent/100);
                    if (passType === 'VIDYA_VAHAN' || passType === 'STUDENT') monthly = monthly * 0.50;
                    setPassPrice(Math.round(monthly));
                });
                const crowd = getCrowdForecast(Date.now());
                setCrowdForecast(crowd);
            } else if (currentView === 'BOOK_RENTAL') {
                if (selectedVehicle) {
                    const effectiveDist = tripType === 'ROUND_TRIP' ? routeData.distance * 2 : routeData.distance;
                    const price = selectedVehicle.baseRate + (effectiveDist * selectedVehicle.ratePerKm);
                    setRentalPrice(Math.round(price));
                }
            }
        } else {
            setTripDistance(null);
            setFareDetails(null);
            setCrowdForecast(null);
            setPassPrice(0);
            setRentalPrice(0);
            setCalculatedPath([]);
            setCargoSubsidy(0);
        }
    };

    updateRoute();

  }, [fromLocation, toLocation, seatConfig, isBuyingPass, churnAnalysis, currentView, selectedVehicle, tripType, logisticsWeight, logisticsItemType, passType, marketBooking]);

  const speak = (text: string) => {
      if (!voiceGuideActive) return;
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'hi-IN'; 
          window.speechSynthesis.speak(u);
      }
  };

  const initiateBook = () => {
    speak("Booking initiated. Please confirm details.");
    if (trustScore < 0.2) {
        alert("Security Alert: Unusual traffic detected. Please verify you are human.");
        return;
    }
    if (isGift && recipientPhone.length < 10) {
        alert("Please enter a valid recipient phone number for the gift.");
        return;
    }
    if (fromLocation) {
        const currentGeo: GeoLocation = { lat: fromLocation.lat, lng: fromLocation.lng, timestamp: Date.now() };
        updateLastLocation(currentGeo);
    }
    if (!fromLocation || !toLocation) {
      alert("Please select start and end villages.");
      return;
    }
    setShowConfirm(true);
  };

  const handleMarketDelivery = (product: Product, shop: Shop) => {
      setAppMode('TRANSPORT');
      setCurrentView('BOOK_PARCEL');
      setActiveTab('LOGISTICS');
      setMarketBooking({ product, shop });
      setLogisticsItemType(shop.category === 'CONSTRUCTION' ? 'SACK_GRAIN' : 'BOX_SMALL');
      setLogisticsWeight(shop.category === 'CONSTRUCTION' ? 50 : 2);
      setFromLocation({ name: shop.location, address: shop.location, lat: 0, lng: 0, block: '', panchayat: '', villageCode: 'SHOP' });
      alert(`Confirm delivery for ${product.name}. Please select your Drop location.`);
  };

  const handleDidiToggle = () => {
      speak(didiMode ? "Didi Rath Disabled" : "Didi Rath Enabled");
      if (didiMode) { setDidiMode(false); return; }
      if (isDidiVerified) { setDidiMode(true); } else { setVerificationStep('START'); setShowDidiVerification(true); }
  };

  const processBiometricCheck = async () => {
      setVerificationStep('PROCESSING');
      const voiceResult = await verifyGenderBiometrics('VOICE');
      if (!voiceResult.verified) { setVerificationStep('FAIL'); return; }
      const faceResult = await verifyGenderBiometrics('FACE');
      if (!faceResult.verified) { setVerificationStep('FAIL'); return; }
      setIsDidiVerified(true);
      setDidiMode(true);
      setVerificationStep('SUCCESS');
  };

  const handleLeafScan = async () => {
      setIsScanningLeaf(true);
      setDrKisanResult(null);
      const result = await diagnoseLeaf();
      setDrKisanResult(result);
      setIsScanningLeaf(false);
  };

  const handleParcelScan = async () => {
      setIsScanningParcel(true);
      const result = await estimateParcelSize();
      setLogisticsWeight(result.weightKg);
      setLogisticsItemType(result.recommendedType);
      setIsScanningParcel(false);
      alert(`AI Estimated: ${result.weightKg}kg (${result.dimensions})`);
  };

  const handleReviewConfirm = () => {
    const totalCost = Math.max(0, ((fareDetails?.totalFare || 0) - cargoSubsidy) * passengerCount + (hasLivestock ? 20 : 0) + (hasInsurance ? 1 : 0));

    if (paymentMethod === PaymentMethod.GRAMCOIN) {
        if (spendGramCoin(user.id, totalCost, "Bus Ticket")) {
            completeBooking(PaymentMethod.GRAMCOIN, TicketStatus.PAID);
        } else {
            alert("Insufficient GramCoin Balance");
        }
        return;
    }

    if (isOfflineMode && !isBuyingPass && currentView === 'DASHBOARD') {
        const offlineTicket = {
            userId: user.id,
            from: fromLocation!.name,
            to: toLocation!.name,
            fromDetails: fromLocation!.address,
            toDetails: toLocation!.address,
            status: TicketStatus.PENDING,
            paymentMethod: PaymentMethod.CASH,
            passengerCount,
            totalPrice: totalCost,
            routePath: calculatedPath,
            seatNumber: selectedSeat || undefined,
            isDidiRath: didiMode,
            hasLivestock,
            hasInsurance,
            recipientPhone: isGift ? recipientPhone : undefined,
            giftedBy: isGift ? user.name : undefined
        };
        queueAction({ type: 'BOOK_TICKET', payload: offlineTicket });
        alert("Offline: Ticket queued! Will sync when online.");
        setShowConfirm(false);
        resetToDashboard();
        return;
    }

    if (isBuyingPass || currentView === 'BOOK_RENTAL' || currentView === 'BOOK_PARCEL') {
        setShowConfirm(false);
        setShowPaymentGateway(true);
        return;
    }
    
    if (paymentMethod === PaymentMethod.CASH) {
      completeBooking(PaymentMethod.CASH, TicketStatus.PENDING);
    } else {
      setShowConfirm(false);
      setShowPaymentGateway(true);
    }
  };

  const completeBooking = async (method: PaymentMethod, status: TicketStatus) => {
    setIsBooking(true);
    const cost = Math.max(0, ((fareDetails?.totalFare || 0) - cargoSubsidy) * passengerCount + (hasLivestock ? 20 : 0) + (hasInsurance ? 1 : 0));
    
    const signature = await signTransaction({ userId: user.id, amount: rentalPrice || passPrice || cost, type: 'BOOKING' });

    if (currentView === 'BOOK_RENTAL') {
        const contract = createEscrow(user.id, 'VL-SYSTEM', rentalPrice);
        const newRental: RentalBooking = {
            id: generateRentalId(),
            userId: user.id,
            userName: user.name,
            vehicleType: selectedVehicle!.type,
            from: fromLocation!.name,
            to: toLocation!.name,
            tripType: tripType,
            date: rentalDate,
            distanceKm: tripDistance!,
            totalFare: bidAmount ? parseInt(bidAmount) : rentalPrice,
            status: 'PENDING',
            escrowContractId: contract.id 
        };
        await bookRental(newRental);
    } 
    else if (currentView === 'BOOK_PARCEL') {
        const encryptedItemType = await encryptData(marketBooking ? `DELIVERY: ${marketBooking.product.name}` : logisticsItemType); 
        const totalPrice = marketBooking ? (marketBooking.product.price + logisticsPrice) : logisticsPrice;
        const finalPrice = logisticsPoolFound ? totalPrice * 0.7 : totalPrice;

        const newParcel: ParcelBooking = {
          id: generateParcelId(),
          userId: user.id,
          from: fromLocation!.name,
          to: toLocation!.name,
          itemType: encryptedItemType,
          weightKg: logisticsWeight,
          price: finalPrice,
          status: 'PENDING',
          isEncrypted: true,
          blockchainHash: signature,
          trackingEvents: [],
          isPooled: logisticsPoolFound
        };
        await bookParcel(newParcel);
        earnGramCoin(user.id, 2, "Logistics Reward");
        setMarketBooking(null);
    }
    else if (isBuyingPass) {
        const nftData = mintPassNFT(user.id, { from: fromLocation!.name, to: toLocation!.name, expiry: Date.now() + 30*24*60*60*1000 });
        const newPass: Pass = {
            id: generatePassId(),
            userId: user.id, 
            userName: user.name,
            from: fromLocation!.name,
            to: toLocation!.name,
            type: passType,
            seatConfig: seatConfig,
            validityDays: 30,
            usedDates: [],
            purchaseDate: Date.now(),
            expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
            price: passPrice,
            status: 'ACTIVE',
            nftMetadata: nftData,
            giftedBy: isGift ? user.name : undefined,
        };
        await savePass({ ...newPass, recipientPhone: isGift ? recipientPhone : undefined } as any);
        
        if (!isGift) setMyPasses(prev => [newPass, ...prev]);
        earnGramCoin(user.id, 50, "Monthly Pass Bonus");
    } else {
        const newTicket: Ticket = {
            id: generateTicketId(),
            userId: user.id, 
            from: fromLocation!.name,
            to: toLocation!.name,
            fromDetails: fromLocation!.address,
            toDetails: toLocation!.address,
            status: status,
            paymentMethod: method,
            timestamp: Date.now(),
            passengerCount: passengerCount,
            totalPrice: cost,
            routePath: calculatedPath,
            digitalSignature: signature,
            seatNumber: selectedSeat || undefined,
            isDidiRath: didiMode,
            hasLivestock,
            hasInsurance,
            recipientPhone: isGift ? recipientPhone : undefined,
            giftedBy: isGift ? user.name : undefined
        };
        
        saveTicket(newTicket);
        
        if (!isGift) {
            setActiveTickets(prev => [newTicket, ...prev]);
        }
        
        if(hasInsurance) alert("Micro-Insurance Policy activated for this trip.");
        earnGramCoin(user.id, 1 * passengerCount + (fromLocation?.name !== 'Doorstep' ? 1 : 0), "Trip Reward"); 
    }

    setIsBooking(false);
    setShowConfirm(false);
    setShowPaymentGateway(false);
    setShowToast(true);
    setTimeout(() => {
        setShowToast(false);
        resetToDashboard();
    }, 2500);
  };

  const resetToDashboard = () => {
      setCurrentView('DASHBOARD');
      setActiveTab('HOME');
      setFromLocation(null);
      setToLocation(null);
      setSelectedVehicle(null);
      setIsBuyingPass(false);
      setMarketBooking(null);
      setHasLivestock(false);
      setHasInsurance(false);
      setIsGift(false);
      setRecipientPhone('');
  };

  const handleTabChange = (tab: 'HOME' | 'PASSES' | 'LOGISTICS' | 'COMMUNITY' | 'PROFILE') => {
      setActiveTab(tab);
      if (tab === 'LOGISTICS') {
          setCurrentView('BOOK_PARCEL');
      } else {
          setCurrentView('DASHBOARD');
      }
  };

  return (
    <>
        <div className="max-w-md mx-auto animate-fade-in pb-32 relative min-h-screen font-sans">
        {showAR && <ARFinder onClose={() => setShowAR(false)} targetName={calculatedPath[1] || 'Bus Stop'} />}

        {/* ... Header Area ... */}
        {activeTab === 'HOME' && (
            <div className="mb-6 px-2">
                <div className="flex justify-between items-start mb-4">
                    <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('welcome')},</span>
                        <h2 className="text-xl font-bold dark:text-white" onClick={() => speak(`Welcome ${user.name}`)}>{user.name.split(' ')[0]}</h2>
                    </div>
                    {isOfflineMode && <div className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><WifiOff size={8} /> {t('offline_mode')}</div>}
                    </div>
                    <div className="flex gap-2">
                        {/* Audio Guide Toggle */}
                        <div onClick={() => setVoiceGuideActive(!voiceGuideActive)} className={`p-2 rounded-full border flex items-center justify-center cursor-pointer transition-all ${voiceGuideActive ? 'bg-yellow-400 text-black border-yellow-500 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'}`}>
                            {voiceGuideActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </div>

                        <div onClick={() => setShowChuttaModal(true)} className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm cursor-pointer">
                            <Coins size={14} className="text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">₹12</span>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                            <Gem size={14} className="text-yellow-500" />
                            <span className="text-xs font-bold dark:text-white">{wallet?.balance || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-full flex relative cursor-pointer shadow-inner">
                    <div className={`absolute top-1 bottom-1 w-[48%] bg-white dark:bg-slate-600 rounded-full shadow-md transition-all duration-300 ${appMode === 'TRANSPORT' ? 'left-1' : 'left-[51%]'}`}></div>
                    <button onClick={() => { setAppMode('TRANSPORT'); speak("Transport Mode Active"); }} className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${appMode === 'TRANSPORT' ? 'text-brand-600 dark:text-white' : 'text-slate-500'}`}><Bus size={14} /> {t('transport')}</button>
                    <button onClick={() => { setAppMode('MARKET'); speak("Market Mode Active"); }} className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${appMode === 'MARKET' ? 'text-orange-600 dark:text-white' : 'text-slate-500'}`}><Store size={14} /> {t('market')}</button>
                </div>
            </div>
        )}

        {/* MODE SWITCHING LOGIC */}
        {appMode === 'MARKET' && activeTab === 'HOME' ? (
            <MarketingView user={user} onBookDelivery={handleMarketDelivery} />
        ) : (
            // TRANSPORT MODE (Existing Logic)
            <>
                {/* MAIN DASHBOARD (BUS IS PRIMARY) */}
                {activeTab === 'HOME' && currentView === 'DASHBOARD' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* FEATURE 1: DIDI RATH TOGGLE */}
                        <div className="flex justify-end -mt-2 mb-2">
                            <button onClick={handleDidiToggle} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border shadow-sm ${didiMode ? 'bg-pink-100 border-pink-500 text-pink-700 shadow-pink-200 ring-2 ring-pink-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                <ShieldCheck size={12} className={didiMode ? "text-pink-600 animate-pulse" : ""} />
                                {didiMode ? 'Didi Rath Active' : 'Enable Didi Rath'}
                            </button>
                        </div>

                        {/* Active Ticket Banner - HORIZONTAL LAYOUT ACTIVATED HERE */}
                        {activeTickets.length > 0 && (
                            <div className="bg-slate-900 rounded-[28px] p-5 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <div onClick={() => speak("Current Trip Active")}>
                                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1">Current Trip</p>
                                        <h3 className="text-lg font-bold">{activeTickets[0].from} <span className="opacity-50 mx-1">to</span> {activeTickets[0].to}</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{activeTickets[0].status}</span>
                                    </div>
                                </div>
                                {/* Use Horizontal Tracker for active trip */}
                                <LiveTracker desiredPath={activeTickets[0].routePath} layout="HORIZONTAL" showHeader={false} />
                                
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setShowMediaHub(true)}
                                        className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10 flex flex-col items-center gap-1 hover:bg-white/20 transition-all"
                                    >
                                        <Wifi size={20} className="text-blue-400" />
                                        <span className="text-[10px] font-bold">Free Wi-Fi Media</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setIsBusPaathshalaActive(!isBusPaathshalaActive)} 
                                        className={`rounded-xl p-3 backdrop-blur-md border border-white/10 flex flex-col items-center gap-1 transition-all ${isBusPaathshalaActive ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}
                                    >
                                        <BookOpen size={20} className={isBusPaathshalaActive ? 'text-black' : 'text-yellow-400'} />
                                        <span className="text-[10px] font-bold">{isBusPaathshalaActive ? 'Playing Lesson' : 'Bus Paathshala'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* BUS BOOKING INTERFACE */}
                        <div className={`glass-panel rounded-[32px] p-6 shadow-2xl relative border transition-colors duration-500 ${didiMode ? 'border-pink-300/50 shadow-pink-100/20' : 'border-white/50 dark:border-white/5'}`}>
                            {didiMode && <div className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[30px]">WOMEN SAFETY PRIORITY</div>}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                                    <Bus size={24} fill="currentColor" className="opacity-20" />
                                    <h2 className="text-xl font-bold dark:text-white" onClick={() => speak(t('plan_journey'))}>{t('plan_journey')}</h2>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex text-[10px] font-bold">
                                    <button onClick={() => { setIsBuyingPass(false); speak("Ticket Mode"); }} className={`px-3 py-1 rounded-full transition-all ${!isBuyingPass ? 'bg-white shadow text-brand-600' : 'text-slate-400'}`}>{t('ticket')}</button>
                                    <button onClick={() => { setIsBuyingPass(true); speak("Pass Mode"); }} className={`px-3 py-1 rounded-full transition-all ${isBuyingPass ? 'bg-white shadow text-brand-600' : 'text-slate-400'}`}>{t('pass')}</button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6 relative z-30">
                                <LocationSelector label={t('from')} onSelect={(l) => { setFromLocation(l); speak(`From ${l.name}`); }} icon={<MapPin size={18} className="text-brand-500" />} />
                                
                                {/* Show Upcoming Buses only if From location is selected but To location is empty */}
                                {fromLocation && !toLocation && upcomingBuses.length > 0 && (
                                    <div className="mt-2 animate-in slide-in-from-top-2">
                                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Upcoming Vehicles at {fromLocation.name}</p>
                                        <div className="space-y-2">
                                            {upcomingBuses.map((bus, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Bus size={14} className="text-brand-500" />
                                                            <span className="font-bold text-sm dark:text-white">Towards {bus.activePath[bus.activePath.length-1]}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 ml-5">Driver: {bus.driverName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                                            ~10 min
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <LocationSelector label={t('to')} onSelect={(l) => { setToLocation(l); speak(`To ${l.name}`); }} icon={<MapPin size={18} className="text-neon-magenta" />} />
                            </div>

                            {isCalculatingRoute && (
                                <div className="text-center py-4 text-brand-500 font-bold text-sm animate-pulse">
                                    Analyzing Rural Road Network...
                                </div>
                            )}

                            {fromLocation && toLocation && fareDetails && !isCalculatingRoute ? (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Route Preview with Visual Landmarks */}
                                    {!isBuyingPass && calculatedPath.length > 2 && (
                                        <div className="bg-brand-50 dark:bg-slate-900/50 p-3 rounded-xl border border-brand-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Route Landmarks ({calculatedPath.length})</p>
                                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                                {calculatedPath.map((stop, i) => {
                                                    // VISUAL LANDMARK LOGIC
                                                    const hasImage = STOP_LANDMARKS[stop];
                                                    return (
                                                        <div key={i} className="flex-shrink-0 flex flex-col items-center w-16">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden mb-1 border border-slate-300 relative">
                                                                {hasImage ? (
                                                                    <img src={hasImage} alt={stop} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-400 text-[10px] font-bold">
                                                                        {stop.slice(0,2)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] text-slate-600 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{stop}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vidya Vahan Option (Only for Pass) */}
                                    {isBuyingPass && (
                                        <div className="flex gap-2 mb-2">
                                            <button onClick={() => setPassType('MONTHLY')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${passType === 'MONTHLY' ? 'bg-brand-100 border-brand-500 text-brand-700' : 'border-slate-200 text-slate-500'}`}>{t('monthly')}</button>
                                            <button onClick={() => setPassType('VIDYA_VAHAN')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1 ${passType === 'VIDYA_VAHAN' ? 'bg-pink-100 border-pink-500 text-pink-700' : 'border-slate-200 text-slate-500'}`}>
                                                <GraduationCap size={12} /> {t('vidya_vahan')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Gift Feature Toggle */}
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Gift size={16} className="text-pink-500" />
                                                <span className="text-xs font-bold dark:text-slate-200">{isBuyingPass ? 'Gift Pass' : 'Gift Ticket'} to a friend?</span>
                                            </div>
                                            <button 
                                                onClick={() => setIsGift(!isGift)} 
                                                className={`w-10 h-5 rounded-full transition-colors relative ${isGift ? 'bg-pink-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isGift ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        
                                        {isGift && (
                                            <div className="mt-3 animate-in slide-in-from-top-2">
                                                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Recipient Mobile Number</label>
                                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600 text-xs text-slate-500">+91</div>
                                                    <input 
                                                        type="tel" 
                                                        value={recipientPhone}
                                                        onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0,10))}
                                                        placeholder="Enter 10-digit number"
                                                        className="flex-1 px-3 py-2 text-sm outline-none dark:bg-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isBuyingPass && <DigitalTwinSeatMap onSelectSeat={(s) => { setSelectedSeat(s); speak(`Seat ${s} selected`); }} selectedSeat={selectedSeat} />}
                                    
                                    {/* Add-ons: Pashu Ticket & Insurance */}
                                    {!isBuyingPass && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setHasLivestock(!hasLivestock)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 ${hasLivestock ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                <Beef size={12} /> Pashu Ticket (+₹20)
                                            </button>
                                            <button onClick={() => setHasInsurance(!hasInsurance)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 ${hasInsurance ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                <ShieldCheck size={12} /> Insurance (+₹1)
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex flex-col justify-between border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-slate-400 uppercase font-bold">{t('total_fare')}</p>
                                            <div className="flex items-baseline gap-2">
                                                {/* Strike-through price if subsidy active */}
                                                {cargoSubsidy > 0 && !isBuyingPass && (
                                                    <span className="text-sm text-slate-400 line-through decoration-red-500">
                                                        {formatCurrency((fareDetails.totalFare * passengerCount))}
                                                    </span>
                                                )}
                                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                    {isBuyingPass ? formatCurrency(passPrice) : formatCurrency(Math.max(0, (fareDetails.totalFare - cargoSubsidy) * passengerCount + (hasLivestock ? 20 : 0) + (hasInsurance ? 1 : 0)))}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Cargo Subsidy Badge */}
                                        {cargoSubsidy > 0 && !isBuyingPass && (
                                            <div className="mb-3 bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded flex items-center gap-1">
                                                <Truck size={12} />
                                                <span className="font-bold">Kisan Cargo Subsidy:</span> ₹{cargoSubsidy} discount applied via logistics revenue!
                                            </div>
                                        )}

                                        <Button onClick={initiateBook} className="px-6 py-2 h-12 text-lg rounded-2xl w-full">
                                            {isGift ? `Gift ${isBuyingPass ? 'Pass' : 'Ticket'}` : (isBuyingPass ? t('buy_pass') : t('book_ticket'))}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-2xl border border-brand-100 dark:border-brand-800/30 flex items-center justify-center gap-2 text-brand-400 text-sm font-medium">
                                    <Search size={16} /> {t('search_bus')}
                                </div>
                            )}
                        </div>

                        {/* SECONDARY FEATURES ROW */}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setCurrentView('BOOK_RENTAL')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:border-brand-200 transition-all">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center"><Car size={24} /></div>
                                <span className="text-sm font-bold dark:text-white" onClick={() => speak(t('book_charter'))}>{t('book_charter')}</span>
                            </button>
                            <button onClick={() => setCurrentView('BOOK_PARCEL')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:border-brand-200 transition-all">
                                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center"><Package size={24} /></div>
                                <span className="text-sm font-bold dark:text-white" onClick={() => speak(t('send_parcel'))}>{t('send_parcel')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* LOGISTICS/PARCEL FLOW */}
                {currentView === 'BOOK_PARCEL' && (
                    <div className="animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-2 mb-6">
                            <button onClick={resetToDashboard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200"><ArrowLeft size={24} /></button>
                            <h2 className="text-2xl font-bold dark:text-white">{t('send_parcel')}</h2>
                        </div>
                        
                        <div className="mb-4">
                            <button onClick={handleParcelScan} className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-500 hover:text-brand-600 transition-all">
                                {isScanningParcel ? <span className="animate-spin">⌛ Analyzing...</span> : <><ScanLine size={18} /> Scan Item Size (AI)</>}
                            </button>
                        </div>

                        <div className="glass-panel rounded-[32px] p-6 shadow-xl border border-white/50">
                            <h3 className="text-lg font-bold mb-4">{marketBooking ? 'Delivery Details' : t('send_parcel')}</h3>
                            <LocationSelector label={t('from')} onSelect={setFromLocation} disabled={!!marketBooking} />
                            <div className="mt-4"><LocationSelector label={t('to')} onSelect={setToLocation} /></div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center my-6">
                                <span className="text-xs font-bold uppercase text-slate-500">{t('total_fare')}</span>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-orange-600">₹{logisticsPrice + (marketBooking ? marketBooking.product.price : 0)}</span>
                                    {logisticsPoolFound && (
                                        <div className="text-[10px] text-emerald-500 font-bold bg-emerald-100 px-2 py-0.5 rounded mt-1 flex items-center gap-1">
                                            <Users size={8} /> Batch Pool Found (-30%)
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button fullWidth variant="primary" disabled={!fromLocation || !toLocation} onClick={initiateBook} className="h-14 text-lg">{t('confirm')}</Button>
                        </div>
                    </div>
                )}

                {/* RENTAL FLOW */}
                {currentView === 'BOOK_RENTAL' && (
                    <div className="animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-2 mb-6">
                            <button onClick={resetToDashboard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200"><ArrowLeft size={24} /></button>
                            <h2 className="text-2xl font-bold dark:text-white">{t('book_charter')}</h2>
                        </div>
                        <div className="space-y-4">
                            {RENTAL_FLEET.map(vehicle => (
                                <div key={vehicle.id} onClick={() => { setSelectedVehicle(vehicle); setFromLocation(null); }} className={`p-6 rounded-3xl border-2 cursor-pointer flex items-center justify-between bg-white dark:bg-slate-900 ${selectedVehicle?.id === vehicle.id ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-transparent shadow-md'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                            {vehicle.type === 'WEDDING_FLEET' ? <PartyPopper size={24} /> : <Car size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg dark:text-white">{vehicle.type === 'WEDDING_FLEET' ? 'Wedding Fleet' : vehicle.type}</h4>
                                            <p className="text-sm text-slate-500">{vehicle.model}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-xl text-indigo-600">₹{vehicle.ratePerKm}/km</p>
                                </div>
                            ))}
                        </div>
                        {selectedVehicle && (
                            <div className="mt-6 glass-panel rounded-[32px] p-6 animate-fade-in">
                                <LocationSelector label={t('from')} onSelect={setFromLocation} />
                                <div className="mt-4"><LocationSelector label={t('to')} onSelect={setToLocation} /></div>
                                <div className="mt-4"><label className="text-xs font-bold text-slate-500 uppercase">Your Offer (Boli)</label><div className="flex items-center gap-2 mt-1"><span className="text-lg font-bold text-slate-400">₹</span><input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Enter price..." className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-bold outline-none dark:text-white text-lg" /></div></div>
                                <Button fullWidth variant="primary" disabled={!fromLocation || !toLocation} onClick={initiateBook} className="h-14 text-lg mt-6">{bidAmount ? 'Submit Offer' : t('confirm')}</Button>
                            </div>
                        )}
                    </div>
                )}

                {/* COMMUNITY TAB (Enhanced) */}
                {activeTab === 'COMMUNITY' && (
                    <div className="animate-fade-in space-y-4 pt-4 px-4 pb-24">
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-4 overflow-x-auto">
                            <button onClick={() => setCommunityTab('BAZAAR')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg whitespace-nowrap ${communityTab === 'BAZAAR' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Bazaar</button>
                            <button onClick={() => setCommunityTab('KISAN')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg whitespace-nowrap ${communityTab === 'KISAN' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Kisan</button>
                            <button onClick={() => setCommunityTab('JOBS')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg whitespace-nowrap ${communityTab === 'JOBS' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Jobs</button>
                            <button onClick={() => setCommunityTab('LOST')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg whitespace-nowrap ${communityTab === 'LOST' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Lost</button>
                        </div>

                        {/* KISAN POOL (Agri) */}
                        {communityTab === 'KISAN' && (
                            <div className="space-y-4">
                                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl border border-green-200 dark:border-green-800 text-center">
                                    <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center justify-center gap-2 mb-2"><Sprout size={20} /> Dr. Kisan AI</h3>
                                    {drKisanResult ? (
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl text-left">
                                            <p className="font-bold text-red-500 text-sm">Diagnosis: {drKisanResult.disease}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{drKisanResult.remedy}</p>
                                            <button onClick={handleLeafScan} className="mt-2 text-xs font-bold text-green-600 underline">Scan Another</button>
                                        </div>
                                    ) : (
                                        <button onClick={handleLeafScan} disabled={isScanningLeaf} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                                            {isScanningLeaf ? 'Analyzing...' : 'Scan Sick Leaf'}
                                        </button>
                                    )}
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><Tractor size={18} /> Kisan Cargo Pool</h3>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Pool crops with neighbors to save transport cost.</p>
                                    <button className="mt-3 bg-emerald-600 text-white w-full py-2 rounded-lg font-bold text-xs shadow-md">Create New Pool</button>
                                </div>
                                {mandiRates.map((r, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-sm dark:text-white block">{r.crop}</span>
                                            {r.predictedPrice && <span className="text-[9px] text-slate-400">Forecast: ₹{r.predictedPrice}</span>}
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold block ${r.trend === 'UP' ? 'text-emerald-500' : 'text-red-500'}`}>₹{r.price} {r.trend === 'UP' ? '▲' : '▼'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* LOST & FOUND */}
                        {communityTab === 'LOST' && (
                            <div className="space-y-3">
                                {lostItems.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-sm dark:text-white">{item.item}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'LOST' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{item.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Loc: {item.location} • {item.date}</p>
                                        <div className="mt-2 text-xs font-bold text-brand-600 bg-brand-50 inline-block px-2 py-1 rounded">Contact: {item.contact}</div>
                                    </div>
                                ))}
                                <button className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><SearchX size={14} /> Report Lost Item</button>
                            </div>
                        )}

                        {/* BAZAAR */}
                        {communityTab === 'BAZAAR' && (
                            <div className="space-y-3">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white mb-4 flex items-center justify-between cursor-pointer" onClick={() => setAppMode('MARKET')}>
                                    <div><h3 className="font-bold text-lg">Visit Gram-Haat</h3><p className="text-xs opacity-90">3D Market</p></div><Store size={32} />
                                </div>
                                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase text-slate-400">Filters:</span><button className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Flower2 size={10} /> Made by Didis</button></div>
                                {marketItems.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                        <div><h4 className="font-bold dark:text-white flex items-center gap-2">{item.name}{item.isDidiProduct && <Flower2 size={12} className="text-pink-500" />}</h4><p className="text-xs text-slate-500 flex items-center gap-1"><Truck size={10} /> {item.supplier}</p></div>
                                        <div className="text-right"><p className="font-bold text-emerald-600">₹{item.price}/{item.unit}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* JOBS */}
                        {communityTab === 'JOBS' && (
                            <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                                    <div><h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Labour Mandi Status</h4><p className="text-xs text-blue-600">You are marked: <span className="font-bold">Not Available</span></p></div>
                                    <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">Check-In</button>
                                </div>
                                {jobs.map(job => (
                                    <div key={job.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-2"><h4 className="font-bold dark:text-white">{job.title}</h4><span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">{job.type}</span></div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin size={12} /> {job.location}</p>
                                        <div className="flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-slate-200">{job.wage}</span><button className="text-xs font-bold text-brand-600 border border-brand-200 px-3 py-1 rounded-lg">Call</button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PASSES TAB */}
                {activeTab === 'PASSES' && (
                    <div className="animate-fade-in space-y-4 pt-4 px-2">
                        <h2 className="text-xl font-bold dark:text-white mb-4">{t('my_passes')}</h2>
                        {myPasses.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <TicketIcon size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No active passes.</p>
                                <button onClick={() => { setActiveTab('HOME'); setCurrentView('DASHBOARD'); setIsBuyingPass(true); }} className="text-brand-600 font-bold mt-2">{t('buy_pass')}</button>
                            </div>
                        ) : (
                            myPasses.map(pass => (
                                <div key={pass.id} className={`relative p-6 rounded-3xl overflow-hidden shadow-2xl border mb-4 text-white ${pass.type === 'VIDYA_VAHAN' ? 'bg-pink-900 border-pink-700' : 'bg-slate-900 border-slate-700'}`}>
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/30 blur-3xl rounded-full"></div>
                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2">
                                            {pass.type === 'VIDYA_VAHAN' ? <GraduationCap className="text-pink-300" size={16} /> : <Bus className="text-emerald-400" size={16} />}
                                            <span className="font-bold tracking-widest text-xs opacity-80">{pass.type === 'VIDYA_VAHAN' ? 'VIDYA VAHAN' : 'MONTHLY PASS'}</span>
                                        </div>
                                        <span className="font-mono text-[10px] opacity-50">{pass.id}</span>
                                    </div>
                                    <div className="relative z-10 mb-6">
                                        <h3 className="text-2xl font-bold mb-1">{pass.from} <span className="text-slate-400 text-lg">to</span> {pass.to}</h3>
                                        <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold">{pass.seatConfig}</span>
                                    </div>
                                    <div className="relative z-10 mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-brand-500" style={{ width: `${((30 - pass.usedDates.length) / 30) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <p className="text-[10px] opacity-70">{30 - pass.usedDates.length} Days Remaining</p>
                                        {pass.giftedBy && (
                                            <span className="text-[10px] bg-pink-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Gift size={10} /> Gifted by {pass.giftedBy}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'PROFILE' && (
                    <UserProfile user={user} onBack={() => handleTabChange('HOME')} />
                )}
            </>
        )}

        {/* DIDI-SHIELD VERIFICATION MODAL */}
        <Modal
            isOpen={showDidiVerification}
            onClose={() => setShowDidiVerification(false)}
            onConfirm={processBiometricCheck}
            title="Didi-Shield Verification"
            confirmLabel={verificationStep === 'START' ? t('verify') : (verificationStep === 'FAIL' ? 'Retry' : 'Processing...')}
            isLoading={verificationStep === 'PROCESSING'}
        >
            <div className="text-center p-2">
                {verificationStep === 'START' && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto relative">
                            <ShieldCheck size={40} className="text-pink-600" />
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">!</div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Check Required</h3>
                        <p className="text-xs text-slate-500">To ensure safety, we need to verify that you are a female passenger.</p>
                    </div>
                )}
                {/* ... other steps ... */}
                {verificationStep === 'SUCCESS' && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={40} className="text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-600">Verified Successfully!</h3>
                        <Button fullWidth onClick={() => setShowDidiVerification(false)}>Continue</Button>
                    </div>
                )}
            </div>
        </Modal>

        {/* CHUTTA WALLET MODAL */}
        <Modal 
            isOpen={showChuttaModal}
            onClose={() => setShowChuttaModal(false)}
            onConfirm={() => setShowChuttaModal(false)}
            title={t('chutta_wallet')}
            confirmLabel="Close"
        >
            <div className="text-center p-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Coins size={32} className="text-emerald-600" /></div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">₹12.00</h3>
                <p className="text-sm text-slate-500 mb-6">Small change saved from bus trips.</p>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-left mb-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Recent Savings</p>
                    <div className="flex justify-between text-xs mb-1"><span>Bus to Sasaram</span><span className="text-emerald-500 font-bold">+₹2.00</span></div>
                </div>
            </div>
        </Modal>

        {/* MEDIA HUB MODAL (DATA MULE) */}
        <Modal 
            isOpen={showMediaHub}
            onClose={() => setShowMediaHub(false)}
            onConfirm={() => alert("Downloading selection...")}
            title="Local Wi-Fi Media"
            confirmLabel="Download Selected"
        >
            <div className="p-2 space-y-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl border border-yellow-200 dark:border-yellow-700 text-center">
                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-2">
                        <Wifi size={14} /> Connected to Driver's Hub
                    </p>
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-300 mt-1">Downloading here saves 100% Mobile Data</p>
                </div>
                
                <div className="space-y-3">
                    {OFFLINE_MEDIA.map(media => (
                        <div key={media.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-xl">
                                {media.category === 'MOVIE' ? '🎬' : (media.category === 'NEWS' ? '📰' : '🌾')}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold dark:text-white line-clamp-1">{media.title}</h4>
                                <p className="text-[9px] text-slate-500">{media.category} • {media.sizeMb} MB</p>
                            </div>
                            <button className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-2 rounded-full hover:bg-emerald-200 transition-colors">
                                <ArrowDown size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>

        {/* Confirmation & Payment Modals */}
        <Modal 
            isOpen={showConfirm} 
            onClose={() => setShowConfirm(false)} 
            onConfirm={handleReviewConfirm} 
            title={t('confirm')} 
            confirmLabel={'Proceed to Pay'} 
            isLoading={isBooking}
        >
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center">
                {isGift && (
                    <div className="mb-4 bg-pink-100 text-pink-700 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                        <Gift size={14} /> Gifting to {recipientPhone}
                    </div>
                )}
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">{t('total_fare')}</p>
                <div className="mb-6">
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">
                        {currentView === 'BOOK_RENTAL' ? formatCurrency(bidAmount ? parseInt(bidAmount) : rentalPrice) : (currentView === 'BOOK_PARCEL' ? formatCurrency(marketBooking ? (logisticsPrice + marketBooking.product.price) : logisticsPrice) : (isBuyingPass ? formatCurrency(passPrice) : formatCurrency(Math.max(0, (fareDetails?.totalFare || 0) * passengerCount - cargoSubsidy + (hasLivestock ? 20 : 0) + (hasInsurance ? 1 : 0)))))}
                    </p>
                    {cargoSubsidy > 0 && !isBuyingPass && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">Includes ₹{cargoSubsidy} Cargo Subsidy</p>
                    )}
                </div>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${paymentMethod === PaymentMethod.CASH ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white border-slate-200'}`}>Cash</button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.ONLINE)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${paymentMethod === PaymentMethod.ONLINE ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white border-slate-200'}`}>Online</button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.GRAMCOIN)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${paymentMethod === PaymentMethod.GRAMCOIN ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-white border-slate-200'}`}>GramCoin</button>
                </div>
            </div>
        </Modal>

        <PaymentGatewayModal 
            isOpen={showPaymentGateway} 
            onClose={() => setShowPaymentGateway(false)} 
            onSuccess={() => completeBooking(PaymentMethod.ONLINE, TicketStatus.PAID)} 
            amount={currentView === 'BOOK_RENTAL' ? (bidAmount ? parseInt(bidAmount) : rentalPrice) : (currentView === 'BOOK_PARCEL' ? (marketBooking ? (logisticsPrice + marketBooking.product.price) : logisticsPrice) : (isBuyingPass ? passPrice : Math.max(0, (fareDetails?.totalFare || 0) * passengerCount - cargoSubsidy + (hasLivestock ? 20 : 0) + (hasInsurance ? 1 : 0))))} 
        />

        {showToast && (
            <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm">
                <Check size={18} /> {isGift ? 'Gift Sent!' : 'Confirmed!'}
            </div>
            </div>
        )}
        </div>

        {appMode === 'TRANSPORT' && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
        {appMode === 'MARKET' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-6 z-40">
                <div className="flex justify-center items-center h-12 text-xs font-bold text-slate-400">
                    Gram-Haat Marketplace
                </div>
            </div>
        )}
    </>
  );
};
