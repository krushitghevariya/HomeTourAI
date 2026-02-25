import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { ToastVariant } from '../../types';

const VARIANT_CONFIG: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  info:    { bg: Colors.infoLight,    text: Colors.info,    border: Colors.info },
  success: { bg: Colors.successLight, text: Colors.success, border: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning, border: Colors.warning },
  error:   { bg: Colors.errorLight,   text: Colors.error,   border: Colors.error },
};

interface ToastProps {
  message:       string;
  variant?:      ToastVariant;
  onDismiss?:    () => void;
  autoDismissMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message, variant = 'info', onDismiss, autoDismissMs = 4000,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = VARIANT_CONFIG[variant];

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onDismiss);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.message, { color: cfg.text }]} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} accessibilityLabel="Dismiss">
        <Text style={[styles.dismiss, { color: cfg.text }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 4, ...Shadow.md },
  message:   { flex: 1, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  dismiss:   { fontSize: Typography.size.sm, marginLeft: Spacing.sm, fontWeight: Typography.weight.bold },
});
