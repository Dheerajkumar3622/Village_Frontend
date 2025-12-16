
import { ROHTAS_NETWORK, STOP_COORDINATES } from '../constants';

// Breadth-First Search (BFS) to find shortest path in unweighted graph (v6.0 Structure)
export const findShortestPath = (startKey: string, endKey: string): string[] | null => {
  // Normalize keys to lowercase to match ROHTAS_NETWORK keys
  const start = startKey.toLowerCase();
  const end = endKey.toLowerCase();

  // Map display names back to keys if necessary (robustness check)
  const resolveKey = (input: string) => {
    if (ROHTAS_NETWORK[input]) return input;
    const found = Object.keys(ROHTAS_NETWORK).find(k => ROHTAS_NETWORK[k].name === input);
    return found || input;
  };

  const sKey = resolveKey(start);
  const eKey = resolveKey(end);

  if (sKey === eKey) return [ROHTAS_NETWORK[sKey]?.name || sKey];
  if (!ROHTAS_NETWORK[sKey] || !ROHTAS_NETWORK[eKey]) return null;

  const queue: string[][] = [[sKey]];
  const visited = new Set<string>([sKey]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    
    const nodeKey = path[path.length - 1];

    if (nodeKey === eKey) {
      // Return proper Names for display
      return path.map(k => ROHTAS_NETWORK[k].name);
    }

    const neighbors = ROHTAS_NETWORK[nodeKey]?.connections || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const newPath = [...path, neighbor];
        queue.push(newPath);
      }
    }
  }

  return null; // No path found
};

const calculateHaversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

export const calculatePathDistance = (pathNames: string[]): number => {
  let totalDist = 0;
  for (let i = 0; i < pathNames.length - 1; i++) {
    const from = STOP_COORDINATES[pathNames[i]];
    const to = STOP_COORDINATES[pathNames[i+1]];
    if (from && to) {
      totalDist += calculateHaversine(from.lat, from.lng, to.lat, to.lng);
    }
  }
  return totalDist;
};

// Simulated Demand Score (Randomized for demo)
export const getDemandLevel = (stopName: string): 'LOW' | 'MED' | 'HIGH' => {
  // Simple deterministic hash based on name
  const hash = stopName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const val = hash % 10;
  
  // Hubs generally have higher demand
  const key = Object.keys(ROHTAS_NETWORK).find(k => ROHTAS_NETWORK[k].name === stopName);
  if (key && ROHTAS_NETWORK[key].type === 'Hub') {
    return val > 3 ? 'HIGH' : 'MED';
  }

  if (val > 7) return 'HIGH';
  if (val > 5) return 'MED';
  return 'LOW';
};
