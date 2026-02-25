import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button }        from '../../components/atoms/Button';
import { ConfirmModal }  from '../../components/molecules/ConfirmModal';
import { TipsCard }      from '../../components/molecules/TipsCard';

const STEPS = ['Analyzing media', 'Stitching frames', 'Enhancing quality', 'Finalizing tour'];

const TIPS = [
  '💡 Good lighting is key — natural light creates the best virtual tours.',
  '📐 Shooting from the center of the room ensures full 360° coverage.',
  '🎯 Keep the camera level for smoother panoramic stitching.',
  '🌅 Early morning light gives warm, inviting ambiance to property photos.',
];

interface ProcessingScreenProps {
  projectId:        string;
  currentStep:      number;
  estimatedSeconds: number;
  onCancel:         () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  currentStep, estimatedSeconds, onCancel,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tipIndex,        setTipIndex]        = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const mins = Math.floor(estimatedSeconds / 60);
  const secs = estimatedSeconds % 60;

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Animated.Text style={[styles.spinner, { transform: [{ rotate: spin }] }]}>⚙️</Animated.Text>
        <Text style={styles.headline}>Generating your tour…</Text>
        <Text style={styles.timeEst}>~{mins > 0 ? `${mins}m ` : ''}{secs}s remaining</Text>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <Text style={[styles.stepDot, i < currentStep && styles.stepDone, i === currentStep && styles.stepActive]}>
                {i < currentStep ? '✓' : i === currentStep ? '▶' : '○'}
              </Text>
              <Text style={[styles.stepLabel, i === currentStep && styles.stepLabelActive, i < currentStep && styles.stepLabelDone]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <TipsCard tip={TIPS[tipIndex]} />
      </View>

      <Button label="Cancel" onPress={() => setShowCancelModal(true)} variant="ghost" style={styles.cancelBtn} />

      <ConfirmModal
        visible={showCancelModal}
        title="Cancel generation?"
        message="Your uploaded media will be saved, but the tour will need to be re-generated."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep going"
        onConfirm={onCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Colors.background, justifyContent: 'space-between', paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  spinner:        { fontSize: 64 },
  headline:       { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.gray900, textAlign: 'center' },
  timeEst:        { fontSize: Typography.size.base, color: Colors.gray500 },
  steps:          { width: '100%', gap: Spacing.sm },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot:        { fontSize: Typography.size.base, color: Colors.gray300, width: 20, textAlign: 'center' },
  stepDone:       { color: Colors.success },
  stepActive:     { color: Colors.primary },
  stepLabel:      { fontSize: Typography.size.base, color: Colors.gray400 },
  stepLabelActive:{ color: Colors.gray900, fontWeight: Typography.weight.semibold },
  stepLabelDone:  { color: Colors.gray500 },
  cancelBtn:      { marginHorizontal: Spacing.xl },
});
