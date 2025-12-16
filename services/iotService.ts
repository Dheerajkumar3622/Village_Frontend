
import { TelemetryData } from '../types';

// Simulates OBD-II hardware stream
export const getTelemetryStream = (): TelemetryData => {
  // Random fluctuation for simulation
  const rpm = 1500 + Math.random() * 500;
  const temp = 85 + Math.random() * 10; // Celsius
  const load = 300 + Math.random() * 50; // KG
  const battery = 12.4 + (Math.random() * 0.2);
  
  return {
    speed: 40 + Math.random() * 10,
    signalStrength: Math.random() > 0.8 ? 2 : 4,
    batteryVoltage: parseFloat(battery.toFixed(1)),
    engineTemp: Math.round(temp),
    rpm: Math.round(rpm),
    fuelLevel: 65,
    suspensionLoad: Math.round(load),
    isOnline: navigator.onLine
  };
};

export const getRoadHealth = () => {
  // Simulates accelerometer data for pothole detection
  const zAxis = 9.8 + (Math.random() - 0.5) * 4; // High variance = Pothole
  const isPothole = Math.abs(zAxis - 9.8) > 2.5;
  return { zAxis, isPothole };
};
