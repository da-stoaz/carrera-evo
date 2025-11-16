// context/RecorderContext.tsx
import { useThrottleRecorder } from '@/hooks/useThrottleRecorder';
import { createContext, ReactNode, useContext } from 'react';

const RecorderContext = createContext<ReturnType<typeof useThrottleRecorder> | null>(null);

export const RecorderProvider = ({ children }: { children: ReactNode }) => {
  const recorder = useThrottleRecorder(); // ← single instance
  return (
    <RecorderContext.Provider value={recorder}>
      {children}
    </RecorderContext.Provider>
  );
};

// Custom hook to use the global recorder
export const useRecorder = () => {
  const context = useContext(RecorderContext);
  if (!context) {
    throw new Error('useRecorder must be used within a RecorderProvider');
  }
  return context;
};