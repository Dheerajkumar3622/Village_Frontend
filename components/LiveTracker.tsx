
import React, { useEffect, useState, useRef } from 'react';
import { STOPS } from '../constants';
import { subscribeToUpdates, getActiveBuses } from '../services/transportService';
import { Bus, Map as MapIcon, Clock, Navigation, Circle, CheckCircle2 } from 'lucide-react';
import { BusState } from '../types';

interface LiveTrackerProps {
  desiredPath?: string[];
  layout?: 'VERTICAL' | 'HORIZONTAL';
  showHeader?: boolean;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({ 
  desiredPath, 
  layout = 'VERTICAL',
  showHeader = true
}) => {
  const [buses, setBuses] = useState<BusState[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBuses(getActiveBuses());
    subscribeToUpdates(
      () => {},
      (updatedBuses) => {
        setBuses(updatedBuses);
      }
    );
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  // Filter Buses Logic
  const filteredBuses = React.useMemo(() => {
    if (!desiredPath || desiredPath.length < 2) return buses;
    const startLocation = desiredPath[0];
    const endLocation = desiredPath[desiredPath.length - 1];

    return buses.filter(bus => {
      if (!bus.activePath || bus.activePath.length === 0) return false;
      return bus.activePath.includes(startLocation) || bus.activePath.includes(endLocation);
    });
  }, [buses, desiredPath]);

  const activeBus = filteredBuses.length > 0 ? filteredBuses[0] : null;
  const displayStops = (desiredPath && desiredPath.length > 0) ? desiredPath : (activeBus?.activePath || STOPS.slice(0, 5));

  // Determine current position index
  let currentStopIndex = 0;
  if (activeBus && activeBus.activePath) {
      const matchIndex = displayStops.findIndex(s => s === activeBus.activePath[activeBus.currentStopIndex]);
      currentStopIndex = matchIndex !== -1 ? matchIndex : 0;
  }

  // Calculate dynamic ETAs
  const getETA = (index: number) => {
      const diff = index - currentStopIndex;
      if (diff < 0) return "Departed";
      if (diff === 0) return "Arriving";
      
      const mins = diff * 8; 
      const etaTime = new Date(currentTime.getTime() + mins * 60000);
      return etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- HORIZONTAL LAYOUT (ACTIVE TRIP) ---
  if (layout === 'HORIZONTAL') {
    const progressPercent = (currentStopIndex / (displayStops.length - 1)) * 100;

    return (
      <div className="w-full bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-700 overflow-hidden relative">
        {showHeader && (
          <div className="flex justify-between items-center mb-6 text-white">
             <div>
                <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Live Journey
                </h3>
                <p className="text-xs text-slate-400"> towards {displayStops[displayStops.length - 1]}</p>
             </div>
             <div className="bg-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
                {activeBus ? 'BUS-888' : 'Waiting...'}
             </div>
          </div>
        )}

        <div className="relative overflow-x-auto pb-4 scrollbar-hide" ref={scrollRef}>
           <div className="min-w-[600px] px-4 relative">
              {/* Connection Line Background */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-slate-700 rounded-full"></div>
              
              {/* Progress Line (Animated) */}
              <div 
                className="absolute top-4 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                style={{ width: `${progressPercent}%` }}
              ></div>

              {/* Moving Bus Icon */}
              <div 
                className="absolute top-1 z-20 transition-all duration-1000 ease-linear"
                style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
              >
                 <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white dark:border-slate-900">
                    <Bus size={16} />
                 </div>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-md">
                    {activeBus?.status === 'EN_ROUTE' ? 'Moving' : 'At Stop'}
                 </div>
              </div>

              {/* Stops */}
              <div className="flex justify-between relative z-10">
                 {displayStops.map((stop, index) => {
                    const isPassed = index <= currentStopIndex;
                    const isNext = index === currentStopIndex + 1;
                    
                    return (
                       <div key={stop} className="flex flex-col items-center gap-3 w-24 text-center">
                          <div className={`w-3 h-3 rounded-full border-2 transition-colors duration-500 ${isPassed ? 'bg-emerald-500 border-emerald-500' : (isNext ? 'bg-slate-900 border-white animate-pulse' : 'bg-slate-900 border-slate-600')}`}></div>
                          <div>
                             <p className={`text-[10px] font-bold ${isPassed ? 'text-white' : 'text-slate-500'}`}>{stop}</p>
                             <p className="text-[9px] text-slate-600">{index === 0 ? 'Start' : (isPassed ? 'Done' : getETA(index))}</p>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- VERTICAL LAYOUT (DEFAULT) ---
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-none md:rounded-3xl shadow-xl overflow-hidden relative min-h-[400px] border-t border-slate-200 dark:border-slate-800">
      
      {showHeader && (
      <div className="bg-brand-600 p-4 text-white flex justify-between items-center shadow-md z-20 relative">
        <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
                12802 - Bihar Rajya Transport
            </h3>
            <p className="text-xs opacity-80 flex items-center gap-1">
                <Clock size={10} /> Updated few seconds ago
            </p>
        </div>
        <div className="flex gap-2">
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30"><MapIcon size={18} /></button>
        </div>
      </div>
      )}

      {/* Arrival/Departure Columns Header */}
      <div className="flex bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
          <div className="w-16 py-2 text-center border-r border-slate-200 dark:border-slate-700">Arrival</div>
          <div className="flex-1 py-2 pl-4">Station / Halt</div>
          <div className="w-16 py-2 text-center border-l border-slate-200 dark:border-slate-700">Departure</div>
      </div>

      {/* Vertical Timeline Container */}
      <div className="relative pb-10 bg-slate-50 dark:bg-slate-950 h-[400px] overflow-y-auto">
        
        {/* The Vertical Guide Line */}
        <div className="absolute top-0 bottom-0 left-[74px] w-1 bg-slate-300 dark:bg-slate-800 z-0"></div>
        
        {/* The Active Blue Progress Line */}
        <div 
            className="absolute top-0 left-[74px] w-1 bg-sky-500 z-0 transition-all duration-1000 ease-out"
            style={{ height: `${(currentStopIndex / Math.max(1, displayStops.length - 1)) * 100}%` }}
        ></div>

        {displayStops.map((stop, index) => {
            const isPassed = index <= currentStopIndex;
            const isCurrent = index === currentStopIndex;
            const eta = getETA(index);
            const isDeparted = index < currentStopIndex;

            const distFromStart = index * 4 + 2; 

            return (
                <div key={stop + index} className={`relative flex items-stretch min-h-[60px] ${isCurrent ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}>
                    <div className="w-16 flex flex-col items-center justify-center py-2 z-10 shrink-0">
                        <span className={`text-[10px] font-bold ${isDeparted ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {index === 0 ? 'Starts' : eta}
                        </span>
                        {isDeparted && <span className="text-[8px] text-green-600 font-bold">On Time</span>}
                    </div>

                    <div className="w-6 flex flex-col items-center justify-center relative z-10 shrink-0 -ml-3">
                        <div className={`
                            w-3 h-3 rounded-full border-2 shadow-sm flex items-center justify-center transition-all duration-500
                            ${isCurrent 
                                ? 'bg-sky-500 border-white ring-2 ring-sky-300 scale-125 animate-pulse' 
                                : isPassed 
                                    ? 'bg-sky-500 border-white' 
                                    : 'bg-white border-slate-400 dark:bg-slate-800 dark:border-slate-600'}
                        `}>
                        </div>
                    </div>

                    <div className="flex-1 pl-4 pr-2 py-3 flex flex-col justify-center border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold ${isPassed ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                {stop}
                            </span>
                            <span className={`text-[10px] w-16 text-center font-mono ${isDeparted ? 'text-slate-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                {isDeparted ? eta : '--'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-400">{distFromStart} km</span>
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 rounded">
                                Platform {Math.floor(Math.random() * 2) + 1}
                            </span>
                        </div>
                    </div>

                    {isCurrent && (
                        <div className="absolute left-[64px] top-1/2 -translate-y-1/2 z-30 transition-all duration-500">
                             <div className="bg-sky-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                                <Bus size={14} />
                             </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
