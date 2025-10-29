

/**
 * Represents a single throttle data point recorded during a lap.
 */
export interface ThrottleDataPoint {
  t: number; // Timestamp in milliseconds (e.g., from Date.now())
  v: number; // Throttle value, likely 0-100%
} 


/**
 * Represents a single recorded lap.
 */
export interface Lap {
  id: number; // Unique identifier for the lap
  date: Date; // Timestamp of when the lap was recorded (e.g., from Date.now())
  throttleData: ThrottleDataPoint[];
  lapTime?: number; // Optional pre-calculated lap time in seconds
}