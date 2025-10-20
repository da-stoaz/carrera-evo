import { ThrottleDataPoint } from "@/types/types";


export function lttb(data: ThrottleDataPoint[], threshold: number): ThrottleDataPoint[] {
    const dataLength = data.length;
    if (threshold >= dataLength || threshold === 0) {
      return data; // No downsampling needed
    }
  
    const sampled: ThrottleDataPoint[] = [];
    let sampledIndex = 0;
    const bucketSize = (dataLength - 2) / (threshold - 2);
    let a = 0; // Start point
    let nextA = 0;
  
    sampled[sampledIndex++] = data[a]; // Add the first point
  
    for (let i = 0; i < threshold - 2; i++) {
      let avgX = 0;
      let avgY = 0;
      let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
      let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
      avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
      const avgRangeLength = avgRangeEnd - avgRangeStart;
  
      for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
        avgX += data[avgRangeStart].t;
        avgY += data[avgRangeStart].v;
      }
  
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
  
      let rangeOffs = Math.floor((i + 0) * bucketSize) + 1;
      const rangeTo = Math.floor((i + 1) * bucketSize) + 1;
      const pointAX = data[a].t;
      const pointAY = data[a].v;
  
      let maxArea = -1;
  
      for (; rangeOffs < rangeTo; rangeOffs++) {
        const area = Math.abs(
          (pointAX - avgX) * (data[rangeOffs].v - pointAY) -
          (pointAX - data[rangeOffs].t) * (avgY - pointAY)
        );
        if (area > maxArea) {
          maxArea = area;
          nextA = rangeOffs;
        }
      }
  
      sampled[sampledIndex++] = data[nextA]; // Add the most important point
      a = nextA;
    }
  
    sampled[sampledIndex++] = data[dataLength - 1]; // Add the last point
  
    return sampled;
}

export function calculateAverageGas(throttleData: ThrottleDataPoint[]): string {
  if (!throttleData || !throttleData.length) return '0.0';
  const sum = throttleData.reduce((acc, { v: value }) => acc + value, 0);
  return (sum / throttleData.length).toFixed(1);
}

export function calculateLapTime(throttleData: ThrottleDataPoint[]): string {
  if (!throttleData || !throttleData.length) return '0.00';
  const start = throttleData[0].t;
  const end = throttleData[throttleData.length - 1].t;
  // Assuming time in ms, convert to seconds
  return ((end - start) / 1000).toFixed(2);
}