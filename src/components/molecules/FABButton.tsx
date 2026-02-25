import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Shadow, Layout } from '../../theme';

interface FABButtonProps { onPress: () => void; label?: string }

export const FABButton: React.FC<FABButtonProps> = ({ onPress, label }) => (
  <TouchableOpacity
    style={[styles.fab, label && styles.extended]}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityLabel={label ?? 'Create new'}
    accessibilityRole="button"
  >
    <Text style={styles.icon}>＋</Text>
    {label && <Text style={styles.label}>{label}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab:      { position: 'absolute', bottom: 28, right: 20, width: Layout.fabSize, height: Layout.fabSize, borderRadius: Layout.fabSize / 2, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
  extended: { width: 'auto', paddingHorizontal: 20, flexDirection: 'row', gap: 6, borderRadius: 28 },
  icon:     { fontSize: 22, color: Colors.white, fontWeight: Typography.weight.bold, lineHeight: 26 },
  label:    { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
});
