import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { BadgeStatus } from '../../types';

interface Config { label: string; bg: string; text: string }

const CONFIG: Record<BadgeStatus, Config> = {
  processing: { label: 'Processing', bg: '#EFF6FF',          text: Colors.statusProcessing },
  ready:      { label: 'Ready',      bg: Colors.successLight, text: Colors.statusReady },
  failed:     { label: 'Failed',     bg: Colors.errorLight,   text: Colors.statusFailed },
};

interface StatusBadgeProps { status: BadgeStatus }

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      {status === 'processing' && <View style={[styles.dot, { backgroundColor: cfg.text }]} />}
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, gap: Spacing.xs },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
});
