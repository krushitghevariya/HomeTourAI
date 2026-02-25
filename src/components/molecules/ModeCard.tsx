import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { GenerationMode } from '../../types';

interface ModeCardProps {
  mode:      GenerationMode;
  icon:      string;
  title:     string;
  subtitle:  string;
  selected:  boolean;
  disabled?: boolean;
  onPress:   () => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  icon, title, subtitle, selected, disabled = false, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[styles.card, selected && styles.selected, disabled && styles.disabled]}
    accessibilityRole="button"
    accessibilityState={{ selected, disabled }}
  >
    <View style={[styles.iconContainer, selected && styles.iconSelected]}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <View style={styles.textBlock}>
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    {selected && <Text style={styles.checkmark}>✓</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 2, borderColor: Colors.gray200, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadow.sm },
  selected:      { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  disabled:      { opacity: 0.45 },
  iconContainer: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  iconSelected:  { backgroundColor: Colors.primary },
  icon:          { fontSize: 22 },
  textBlock:     { flex: 1 },
  title:         { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.gray900, marginBottom: 2 },
  titleSelected: { color: Colors.primary },
  subtitle:      { fontSize: Typography.size.sm, color: Colors.gray500 },
  checkmark:     { fontSize: Typography.size.lg, color: Colors.primary, fontWeight: Typography.weight.bold },
});
