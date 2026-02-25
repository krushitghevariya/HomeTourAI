import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { ButtonVariant } from '../../types';

interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  ButtonVariant;
  loading?:  boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?:    ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary',
  loading = false, disabled = false, fullWidth = true, style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles] as TextStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fullWidth:  { width: '100%' },
  disabled:   { opacity: 0.45 },
  // Variant containers
  primary:    { backgroundColor: Colors.primary },
  secondary:  { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary },
  ghost:      { backgroundColor: 'transparent' },
  danger:     { backgroundColor: Colors.error },
  // Variant labels
  label:         { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold },
  primaryLabel:  { color: Colors.white },
  secondaryLabel:{ color: Colors.primary },
  ghostLabel:    { color: Colors.gray500 },
  dangerLabel:   { color: Colors.white },
});
