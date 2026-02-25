import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface ProgressBarProps { currentStep: number; totalSteps: number }

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const pct = Math.min((currentStep / totalSteps) * 100, 100);
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.label}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.xs },
  track:     { width: '100%', height: 4, backgroundColor: Colors.gray200, borderRadius: BorderRadius.full, overflow: 'hidden' },
  fill:      { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  label:     { fontSize: Typography.size.xs, color: Colors.gray500, fontWeight: Typography.weight.medium },
});
