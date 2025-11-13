// hooks/useThrottleRecorder.ts
import { useLapsContext } from '@/context/LapsContext';
import { Lap, ThrottleDataPoint } from '@/types/types';
import { useCallback, useRef, useState } from 'react';

/**
 * Hook for recording throttle data during a lap.
 */
export function useThrottleRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [data, setData] = useState<ThrottleDataPoint[]>([]);
    const startRef = useRef<number | null>(null);
    const { addLap } = useLapsContext(); // <-- automatically persists

    const start = useCallback(() => {
        setData([]);
        startRef.current = Date.now();
        setIsRecording(true);
    }, []);

    const stop = useCallback((): ThrottleDataPoint[] => {
        setIsRecording(false);
        startRef.current = null;
        return data; // return a copy of the recorded points
    }, [data]);

    const addThrottlePoint = useCallback(
        (throttle: number) => {
            if (!isRecording || startRef.current === null) return;

            const t = Date.now() - startRef.current;
            const point: ThrottleDataPoint = { t, v: throttle };

            setData(prev => [...prev, point]);
        },
        [isRecording]
    );

    /**
       * Save the current lap using `useLaps`.
       * Returns the newly saved Lap object (with id, date, etc.).
       */
    const save = useCallback(async (): Promise<Lap | null> => {
        if (data.length === 0) return null;
        const savedLap = await addLap(data); // `useLaps` handles ID, date, storage
        setData([]); // optional: clear after save
        return savedLap;
    }, [data, addLap]);

    return {
        isRecording,
        data,
        start,
        stop,
        addThrottlePoint,
        save,
    };
}