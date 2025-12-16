
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle, Calendar, Smartphone, QrCode, ScanLine, Home, Radio, HandCoins, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { playSonicToken } from '../services/advancedFeatures';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
}

type PayTab = 'CARD' | 'UPI' | 'QR' | 'SONIC' | 'UDHAAR';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen, onClose, onSuccess, amount
}) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [activeTab, setActiveTab] = useState<PayTab>('CARD');
  
  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // UPI State
  const [upiId, setUpiId] = useState('');
  
  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setUpiId('');
      setActiveTab('CARD');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'SONIC') {
        playSonicToken(`PAY-${amount}-${Date.now()}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (activeTab === 'UDHAAR' && amount > 500) {
        alert("Udhaar limit exceeded (Max ₹500)");
        return;
    }

    setStep('processing');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStep('success');
    
    setTimeout(() => {
      onSuccess();
    }, 2500);
  };

  const formatCard = (val: string) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    return val.replace(/\D/g, '').replace(/(.{2})/g, '$1/').trim().slice(0, 5).replace(/\/$/, '');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={step === 'form' ? onClose : undefined}
      ></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1 rounded-md text-white"><Lock size={12} /></div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Secure Payment Gateway</span>
          </div>
          {step === 'form' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Total Payable</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">₹{amount.toFixed(2)}</p>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-hide">
                 <button type="button" onClick={() => setActiveTab('CARD')} className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeTab === 'CARD' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-white' : 'text-slate-500'}`}>Card</button>
                 <button type="button" onClick={() => setActiveTab('UPI')} className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeTab === 'UPI' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-white' : 'text-slate-500'}`}>UPI</button>
                 <button type="button" onClick={() => setActiveTab('QR')} className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeTab === 'QR' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-white' : 'text-slate-500'}`}>QR</button>
                 {/* FEATURE 10: UDHAAR SAKHI (Styled for women) */}
                 <button type="button" onClick={() => setActiveTab('UDHAAR')} className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 justify-center ${activeTab === 'UDHAAR' ? 'bg-pink-100 text-pink-600 shadow-sm' : 'text-slate-500'}`}>Udhaar</button>
                 <button type="button" onClick={() => setActiveTab('SONIC')} className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 justify-center ${activeTab === 'SONIC' ? 'bg-brand-500 shadow-sm text-white' : 'text-slate-500'}`}><Radio size={12} /></button>
              </div>

              {/* CARD FORM */}
              {activeTab === 'CARD' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white font-mono transition-all"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCard(e.target.value))}
                        maxLength={19}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Expiry</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white font-mono transition-all"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">CVV</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white font-mono transition-all"
                        placeholder="123"
                        value={cvc}
                        onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI FORM */}
              {activeTab === 'UPI' && (
                 <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">UPI ID / Mobile Number</label>
                       <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                             type="text" 
                             className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                             placeholder="user@upi or 9988776655"
                             value={upiId}
                             onChange={e => setUpiId(e.target.value)}
                             required
                          />
                       </div>
                    </div>
                    <div className="text-xs text-slate-400 text-center">
                       Supports PhonePe, GPay, Paytm, BHIM
                    </div>
                 </div>
              )}

              {/* QR SCAN */}
              {activeTab === 'QR' && (
                 <div className="animate-fade-in flex flex-col items-center">
                    <div className="w-48 h-48 bg-white p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VillageLinkPayment')]"></div>
                        <QrCode size={120} className="text-slate-800" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-4">Scan using any UPI App</p>
                    <p className="text-xs text-slate-400 mt-1">GPay • Paytm • PhonePe</p>
                 </div>
              )}

              {/* FEATURE 10: UDHAAR SAKHI (PAY LATER) */}
              {activeTab === 'UDHAAR' && (
                  <div className="animate-fade-in space-y-4">
                      <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-200 dark:border-pink-800/50 flex items-start gap-3 relative overflow-hidden">
                          <div className="absolute -top-6 -right-6 w-20 h-20 bg-pink-100 rounded-full blur-xl"></div>
                          <HandCoins className="text-pink-500 mt-1 relative z-10" size={24} />
                          <div className="relative z-10">
                              <h4 className="text-sm font-bold text-pink-800 dark:text-pink-200 flex items-center gap-1">Udhaar Sakhi <Sparkles size={12} /></h4>
                              <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">Interest-free credit for women. Pay at next SHG meeting.</p>
                          </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm px-2">
                          <span className="text-slate-500">Sakhi Limit</span>
                          <span className="font-bold text-slate-800 dark:text-white">₹500.00</span>
                      </div>
                      
                      {amount > 500 && (
                          <div className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} /> Amount exceeds credit limit.
                          </div>
                      )}
                  </div>
              )}

              {/* SONIC PAY (Audio-Over-Data) */}
              {activeTab === 'SONIC' && (
                  <div className="animate-fade-in flex flex-col items-center text-center p-4">
                      <div className="w-32 h-32 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4 relative">
                          <div className="absolute inset-0 rounded-full border-4 border-brand-200 dark:border-brand-800 animate-ping opacity-50"></div>
                          <div className="absolute inset-4 rounded-full border-2 border-brand-400 dark:border-brand-600 animate-pulse"></div>
                          <Radio size={48} className="text-brand-600 dark:text-brand-400 relative z-10" />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Sonic Payment</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">Emitting secure audio token to driver's phone...</p>
                      <div className="text-[10px] bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">Offline Mode Compatible</div>
                  </div>
              )}

              <div className="pt-2">
                <Button type="submit" fullWidth className="py-4 shadow-xl shadow-brand-500/20" disabled={activeTab === 'UDHAAR' && amount > 500}>
                  {activeTab === 'QR' ? 'I Have Paid' : (activeTab === 'SONIC' ? 'Broadcast Token' : (activeTab === 'UDHAAR' ? 'Confirm Pay Later' : `Pay ₹${amount.toFixed(2)}`))}
                </Button>
                <div className="text-center mt-3 flex justify-center gap-2 opacity-50 grayscale">
                   <div className="h-4 w-8 bg-slate-300 rounded"></div>
                   <div className="h-4 w-8 bg-slate-300 rounded"></div>
                   <div className="h-4 w-8 bg-slate-300 rounded"></div>
                </div>
              </div>
            </form>
          )}

          {step === 'processing' && (
             <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
               <div className="relative mb-6">
                 <div className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                 <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
                 <Lock className="absolute inset-0 m-auto text-brand-500" size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Processing Payment</h3>
               <p className="text-slate-500 text-sm mt-1">Connecting to Bank Server...</p>
               <p className="text-slate-400 text-xs mt-4 animate-pulse">Do not close this window</p>
             </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
               <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="text-green-500 w-12 h-12" />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Successful</h3>
               <p className="text-slate-500 text-sm mt-1 mb-8">Txn ID: vl_{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
               
               <Button onClick={onSuccess} variant="outline" className="min-w-[160px] gap-2">
                  <Home size={16} /> Back to App
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
