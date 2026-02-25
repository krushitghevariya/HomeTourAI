import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface ChipProps { label: string; selected: boolean; onPress: () => void }

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.selected]}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip:          { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.gray200, backgroundColor: Colors.white, marginRight: Spacing.sm },
  selected:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  label:         { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray700 },
  selectedLabel: { color: Colors.white },
});
