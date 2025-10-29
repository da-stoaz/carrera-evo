import { useRef, useState } from 'react';

export type LapEntry = { time: number; throttle: number };

export function useThrottleRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [data, setData] = useState<LapEntry[]>([]);
  const startRef = useRef<number | null>(null);

  const start = () => {
    setData([]);
    startRef.current = Date.now();
    setIsRecording(true);
  };

  const stop = () => {
    setIsRecording(false);
    startRef.current = null;
    // you can return the data here if you prefer
    return data;
  };

  const addSample = (throttle: number) => {
    if (!isRecording || startRef.current === null) return;
    const time = Date.now() - startRef.current;
    setData(prev => [...prev, { time, throttle }]);
  };

  return { isRecording, data, start, stop, addSample };
}