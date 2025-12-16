
import React from 'react';
import { User, Box, Shield } from 'lucide-react';

interface DigitalTwinSeatMapProps {
  onSelectSeat: (seatId: string) => void;
  selectedSeat: string | null;
}

export const DigitalTwinSeatMap: React.FC<DigitalTwinSeatMapProps> = ({ onSelectSeat, selectedSeat }) => {
  const seats = Array.from({ length: 12 }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const isAisle = col === 1; 
    const status = i < 4 ? 'OCCUPIED' : (i === 10 ? 'CARGO' : 'AVAILABLE');
    const isFemale = i === 4; 
    return { id: `S-${i+1}`, row, col: isAisle ? col + 1 : col, status, isFemale };
  });

  return (
    <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden perspective-800">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
         <h3 className="text-white font-bold flex items-center gap-2">Live Seat View</h3>
         <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/50">Real-time</span>
      </div>

      <div className="bg-slate-800/80 rounded-t-[40px] rounded-b-xl p-4 border-x-4 border-t-4 border-slate-700 mx-auto max-w-[240px] shadow-2xl transform rotate-x-12">
         <div className="w-full h-2 bg-slate-600 mb-8 rounded-full"></div> 
         
         <div className="grid grid-cols-5 gap-3 mb-4">
            {seats.map((seat, idx) => (
                <div 
                    key={seat.id}
                    onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat.id)}
                    className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg transition-all duration-300
                        ${seat.col === 2 ? 'col-span-2 opacity-0 pointer-events-none' : ''} 
                        ${seat.status === 'OCCUPIED' ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 
                          seat.status === 'CARGO' ? 'bg-amber-600 text-amber-100 border border-amber-400' :
                          selectedSeat === seat.id ? 'bg-emerald-500 text-white scale-110 ring-2 ring-white' : 
                          'bg-slate-700 text-white hover:bg-slate-600 cursor-pointer border border-slate-600'}
                    `}
                >
                    {seat.status === 'OCCUPIED' ? <User size={12} /> : 
                     seat.status === 'CARGO' ? <Box size={12} /> :
                     seat.isFemale ? <Shield size={12} className="text-pink-400" /> :
                     seat.id}
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};
