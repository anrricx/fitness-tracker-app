import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface RingChartProps {
  currentCalories: number;
  calorieGoal: number;
  currentProtein: number;
  proteinGoal: number;
  size?: number;
  strokeWidth?: number;
}

export function RingChart({
  currentCalories,
  calorieGoal,
  currentProtein,
  proteinGoal,
}: RingChartProps) {
  const size = 250;
  const center = 125;
  const outerRadius = 100;
  const innerRadius = 70;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const calorieProgress = Math.min(currentCalories / calorieGoal, 1);
  const proteinProgress = Math.min(currentProtein / proteinGoal, 1);

  const calorieDashOffset = outerCircumference * (1 - calorieProgress);
  const proteinDashOffset = innerCircumference * (1 - proteinProgress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Outer ring background (calories) */}
        <Circle
          cx={center}
          cy={center}
          r={outerRadius}
          stroke="#E0E0E0"
          strokeWidth={20}
          fill="none"
        />
        
        {/* Outer ring progress (calories) */}
        <Circle
          cx={center}
          cy={center}
          r={outerRadius}
          stroke="#FF6B6B"
          strokeWidth={20}
          fill="none"
          strokeDasharray={outerCircumference}
          strokeDashoffset={calorieDashOffset}
        />

        {/* Inner ring background (protein) */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          stroke="#E0E0E0"
          strokeWidth={15}
          fill="none"
        />
        
        {/* Inner ring progress (protein) */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          stroke="#4ECDC4"
          strokeWidth={15}
          fill="none"
          strokeDasharray={innerCircumference}
          strokeDashoffset={proteinDashOffset}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
