// contexts/LapsContext.tsx
import { useLaps } from '@/hooks/useLaps'; // Import your hook
import type { Lap, ThrottleDataPoint } from '@/types/types';
import { createContext, useContext } from 'react';

interface LapsContextType {
  laps: Lap[];
  isLoading: boolean;
  addLap: (entries: ThrottleDataPoint[]) => Promise<Lap>;
  deleteLap: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const LapsContext = createContext<LapsContextType | undefined>(undefined);

export function LapsProvider({ children }: { children: React.ReactNode }) {
  const { laps, isLoading, addLap, deleteLap, refresh } = useLaps();

  return (
    <LapsContext.Provider value={{ laps, isLoading, addLap, deleteLap, refresh }}>
      {children}
    </LapsContext.Provider>
  );
}

export function useLapsContext() {
  const context = useContext(LapsContext);
  if (context === undefined) {
    throw new Error('useLapsContext must be used within a LapsProvider');
  }
  return context;
}