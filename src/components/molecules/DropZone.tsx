import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface DropZoneProps {
  accept:  'images' | 'video';
  onPress: () => void;
  hint?:   string;
}

const ACCEPT_CONFIG = {
  images: { icon: '📷', hint: 'Tap to add photos (JPEG / PNG)' },
  video:  { icon: '🎬', hint: 'Tap to upload walkthrough video (MP4)' },
};

export const DropZone: React.FC<DropZoneProps> = ({ accept, onPress, hint }) => {
  const cfg = ACCEPT_CONFIG[accept];
  return (
    <TouchableOpacity onPress={onPress} style={styles.zone} activeOpacity={0.7} accessibilityRole="button">
      <Text style={styles.icon}>{cfg.icon}</Text>
      <Text style={styles.hint}>{hint ?? cfg.hint}</Text>
      <Text style={styles.sub}>or drag and drop here</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  zone: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray300, borderRadius: BorderRadius.lg, padding: Spacing['2xl'], alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray50, gap: Spacing.sm },
  icon: { fontSize: 40 },
  hint: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.gray700, textAlign: 'center' },
  sub:  { fontSize: Typography.size.sm, color: Colors.gray400 },
});
