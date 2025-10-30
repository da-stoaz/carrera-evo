// hooks/useLaps.ts
import { Lap, ThrottleDataPoint } from '@/types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'laps';
const MAX_ID = 999;

export function useLaps() {
    const [laps, setLaps] = useState<Lap[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Keep the highest used id in a ref – avoids re-reading storage on every add
    const maxIdRef = useRef<number>(0);

    //  Load laps + compute the next free id
    const loadLaps = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const parsed: Lap[] = raw ? JSON.parse(raw) : [];

            const laps: Lap[] = parsed.map(item => ({
                ...item,
                date: new Date(item.date), // ← ISO string → Date
            }));

            // Find the biggest id (or 0 if empty)
            const highest = parsed.reduce((max, l) => (l.id > max ? l.id : max), 0);
            maxIdRef.current = highest;

            setLaps(laps);
        } catch (e) {
            console.error('useLaps – load failed:', e);
            setLaps([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLaps();
    }, []); // ← Remove [] → run on every mount

 //  Add a lap – generates a tiny sequential id, returns the new Lap
    const addLap = useCallback(
        async (entries: ThrottleDataPoint[]): Promise<Lap> => {
            if (!entries.length) throw new Error('No entries to save');

            const nextId = maxIdRef.current + 1;
            if (nextId > MAX_ID) {
                throw new Error(`Maximum lap ID (${MAX_ID}) reached`);
            }

            const newLap: Lap = {
                id: nextId,
                date: new Date(),
                throttleData: entries,
            };

            // Optimistic UI
            setLaps(prev => [...prev, newLap]);
            maxIdRef.current = nextId; // keep ref in sync

            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                const existing: Lap[] = stored ? JSON.parse(stored) : [];

                // Convert date to ISO for storage
                const toStore = {
                    ...newLap,
                    date: newLap.date.toISOString(),
                };

                const updated = [...existing, toStore];
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

                return newLap; // return the Lap object
            } catch (e) {
                console.error('useLaps – addLap failed:', e);
                // rollback
                await loadLaps();
                throw e; // re-throw to let caller handle
            }
        },
        [loadLaps]
    );

    // Delete a lap by id
    const deleteLap = useCallback(
        async (id: number) => {
            setLaps(prev => (prev ? prev.filter(l => l.id !== id) : prev));

            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                const existing: Lap[] = stored ? JSON.parse(stored) : [];

                const updated = existing.filter(l => l.id !== id);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('useLaps – deleteLap failed:', e);
                await loadLaps();
            }
        },
        [loadLaps]
    );

    const refresh = useCallback(() => {
        setIsLoading(true);
        return loadLaps();
    }, [loadLaps]);

    return {
        laps,
        isLoading,
        addLap,
        deleteLap,
        refresh,
    };
}