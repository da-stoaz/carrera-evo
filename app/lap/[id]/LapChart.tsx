import { lttb } from '@/lib/utils';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type LapChartProps = {
  throttleData: { t: number; v: number }[];
};

export default function LapChart({ throttleData }: LapChartProps) {
  if (!throttleData || throttleData.length === 0) return null;

  // Downsample the data
  const downsampledData = lttb(throttleData, 100).map(p => ({
    value: p.v,
    label: p.t.toString(),
  }));

  const screenWidth = Dimensions.get('window').width;
  const padH = 20 * 2; // same padding as parent
  const containerWidth = screenWidth - padH;

  return (
    <View style={[styles.chartContainer, styles.glassBlur]}>
      <LineChart
        data={downsampledData}
        maxValue={100}
        height={250}
        width={containerWidth}
        endSpacing={0}
        color="white"
        thickness={3}
        overScrollMode="never"
        adjustToWidth={true}
        curved={true}
        backgroundColor="transparent"
        hideRules={true}
        yAxisColor="transparent"
        xAxisThickness={0}
        hideDataPoints
        xAxisLabelTextStyle={{ display: 'none' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  glassBlur: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    marginVertical: 20,
    padding: 10,
  },
});
