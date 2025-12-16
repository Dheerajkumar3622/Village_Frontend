
import { ROHTAS_NETWORK, STOP_COORDINATES, ALL_LOCATIONS } from '../constants';
import { RouteDefinition, LocationData } from '../types';

let UNIVERSAL_ROUTES: RouteDefinition[] = [];

export const setUniversalRoutes = (routes: RouteDefinition[]) => {
    UNIVERSAL_ROUTES = routes;
};

// Helper: Haversine Distance (Real world km)
const calculateHaversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth radius
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

// Helper: Project a point onto a line segment and get distance info
const projectPointOnSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return { distSq: (p.x - v.x) ** 2 + (p.y - v.y) ** 2, t: 0 };
  
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  const distSq = (p.x - projection.x) ** 2 + (p.y - projection.y) ** 2;
  return { distSq, t };
};

// --- CORE FUNCTIONALITY ---

export const findDetailedPath = (startName: string, endName: string): string[] => {
    // Fallback for offline mode or simple lookups
    return [startName, endName];
};

// NEW: Smart Route with OSRM and Corridor Snapping
export const fetchSmartRoute = async (start: LocationData, end: LocationData): Promise<{ path: string[], distance: number }> => {
    try {
        // 1. Fetch Geometry from OSRM (Open Source Routing Machine)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(osrmUrl);
        
        if (!response.ok) throw new Error("OSRM Routing Failed");
        
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error("No route found");
        }

        const routeCoords = data.routes[0].geometry.coordinates; // [lng, lat]
        const totalDistance = data.routes[0].distance / 1000; // Km

        // 2. Identify Intermediate Villages
        const CORRIDOR_WIDTH_SQ = 0.0001; // Approx 1km squared
        
        const stopsWithProgress: { name: string, progress: number }[] = [];
        stopsWithProgress.push({ name: start.name, progress: 0 });

        const polylineDistances: number[] = [0];
        let cumulative = 0;
        for(let i=0; i<routeCoords.length-1; i++) {
            const segDist = Math.sqrt(Math.pow(routeCoords[i+1][0] - routeCoords[i][0], 2) + Math.pow(routeCoords[i+1][1] - routeCoords[i][1], 2));
            cumulative += segDist;
            polylineDistances.push(cumulative);
        }
        const totalPolyLen = cumulative || 1; // Prevent divide by zero

        // Filter ALL_LOCATIONS to find ones near the path
        const candidates = ALL_LOCATIONS.filter(loc => loc.name !== start.name && loc.name !== end.name);

        candidates.forEach(loc => {
            const p = { x: loc.lng, y: loc.lat };
            let minSqDist = Infinity;
            let bestProgress = -1;

            // Optimization: Step by 2
            for (let i = 0; i < routeCoords.length - 1; i += 2) { 
                const v = { x: routeCoords[i][0], y: routeCoords[i][1] };
                const w = { x: routeCoords[i+1][0], y: routeCoords[i+1][1] };
                
                const { distSq, t } = projectPointOnSegment(p, v, w);
                
                if (distSq < minSqDist) {
                    minSqDist = distSq;
                    const distAtSegmentStart = polylineDistances[i];
                    const segmentLen = polylineDistances[i+1] - polylineDistances[i];
                    bestProgress = (distAtSegmentStart + (t * segmentLen)) / totalPolyLen;
                }
            }

            if (minSqDist < CORRIDOR_WIDTH_SQ) {
                stopsWithProgress.push({ name: loc.name, progress: bestProgress });
            }
        });

        stopsWithProgress.push({ name: end.name, progress: 1.1 });
        stopsWithProgress.sort((a, b) => a.progress - b.progress);
        const uniquePath = Array.from(new Set(stopsWithProgress.map(s => s.name)));

        return { path: uniquePath, distance: totalDistance };

    } catch (error) {
        console.warn("Smart routing failed, using linear fallback.", error);
        
        // Linear Fallback: Find villages directly between start and end
        const dist = calculateHaversine(start.lat, start.lng, end.lat, end.lng);
        const midStops = ALL_LOCATIONS.filter(loc => {
            const d1 = calculateHaversine(start.lat, start.lng, loc.lat, loc.lng);
            const d2 = calculateHaversine(loc.lat, loc.lng, end.lat, end.lng);
            // If distance(A->C) + distance(C->B) ~ distance(A->B), then C is on the line
            return Math.abs((d1 + d2) - dist) < 1; // 1km buffer
        }).map(l => l.name);

        return { 
            path: [start.name, ...midStops, end.name], 
            distance: dist 
        };
    }
};

export const calculatePathDistance = (pathNames: string[]): number => {
  return pathNames.length * 5; 
};

export const getDemandLevel = (stopName: string): 'LOW' | 'MED' | 'HIGH' => {
  return 'MED';
};
