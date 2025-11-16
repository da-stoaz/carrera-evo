// components/RecordingIndicator.tsx
import { useRecorder } from '@/context/RecorderContext';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function RecordingIndicator() {
  const { isRecording, data } = useRecorder(); // ← global state!
  const [elapsed, setElapsed] = useState(0);
  const blinkAnim = new Animated.Value(1);

  // Blink animation
  useEffect(() => {
    if (!isRecording) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  // Live timer
  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: blinkAnim }]} />
      <Text style={styles.text}>
        Recording: {elapsed.toFixed(elapsed < 10 ? 2 : 1)}s ({data.length.toLocaleString()} pts)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});