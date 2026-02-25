import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface TipsCardProps { tip: string; icon?: string }

export const TipsCard: React.FC<TipsCardProps> = ({ tip, icon = '💡' }) => (
  <View style={styles.card}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.tip}>{tip}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.warningLight, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.sm },
  icon: { fontSize: 18, marginTop: 1 },
  tip:  { flex: 1, fontSize: Typography.size.sm, color: Colors.warning, fontWeight: Typography.weight.medium, lineHeight: 20 },
});
