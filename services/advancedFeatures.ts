
import { VehicleComponentHealth, MeshPeer } from '../types';

// --- AUDIO-OVER-DATA SERVICE (Sonic) ---
export const playSonicToken = (data: string) => {
  // Simulates high-frequency audio transmission
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(18000, ctx.currentTime); // Near-ultrasonic
  oscillator.frequency.exponentialRampToValueAtTime(19000, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.5);
  
  console.log(`🔊 Broadcasting Sonic Token: ${data}`);
};

export const startSonicListening = (onDetected: (data: string) => void) => {
  // Simulate listening
  setTimeout(() => {
    onDetected(`SONIC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
  }, 3000);
};

// --- DIGITAL TWIN SIMULATOR ---
export const getDigitalTwinData = (): VehicleComponentHealth[] => {
  return [
    { id: 'engine', name: 'Engine Block', status: 'GOOD', healthPercent: 92 },
    { id: 'brakes', name: 'Brake Pads', status: 'WARNING', healthPercent: 45, predictedFailureKm: 2500 },
    { id: 'battery', name: 'Battery Array', status: 'GOOD', healthPercent: 88 },
    { id: 'suspension', name: 'Suspension', status: 'CRITICAL', healthPercent: 20, predictedFailureKm: 150 },
    { id: 'tires', name: 'Tire Pressure', status: 'GOOD', healthPercent: 95 }
  ];
};

// --- MESH NETWORKING SIMULATOR ---
export const scanMeshPeers = async (): Promise<MeshPeer[]> => {
  // Simulate discovery of nearby devices via Bluetooth/WiFi-Direct
  await new Promise(r => setTimeout(r, 1500));
  return [
    { id: 'PEER-1', name: 'Raju\'s Phone', signalStrength: 85, lastSeen: Date.now() },
    { id: 'PEER-2', name: 'Bus Node #404', signalStrength: 60, lastSeen: Date.now() },
    { id: 'PEER-3', name: 'Village Hub', signalStrength: 90, lastSeen: Date.now() }
  ];
};

export const broadcastToMesh = (payload: any) => {
  console.log("📡 Mesh Broadcast:", payload);
  return true;
};

// --- EDGE AI SIMULATOR ---
export const analyzeDriverFace = () => {
  // Simulates drowsiness detection
  // Returns true if "Drowsy"
  return Math.random() > 0.8;
};
