import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface InlineLinkProps { label: string; onPress: () => void; centered?: boolean }

export const InlineLink: React.FC<InlineLinkProps> = ({ label, onPress, centered = false }) => (
  <TouchableOpacity onPress={onPress} accessibilityRole="link">
    <Text style={[styles.link, centered && styles.centered]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  link:     { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.primary },
  centered: { textAlign: 'center' },
});
