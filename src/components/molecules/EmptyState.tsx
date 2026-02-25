import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button } from '../atoms/Button';

interface EmptyStateProps {
  icon?:       string;
  headline:    string;
  subtext?:    string;
  ctaLabel?:   string;
  onCtaPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂', headline, subtext, ctaLabel, onCtaPress,
}) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.headline}>{headline}</Text>
    {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    {ctaLabel && onCtaPress && (
      <Button label={ctaLabel} onPress={onCtaPress} fullWidth={false} style={styles.cta} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  icon:      { fontSize: 56, marginBottom: Spacing.sm },
  headline:  { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.gray900, textAlign: 'center' },
  subtext:   { fontSize: Typography.size.base, color: Colors.gray500, textAlign: 'center', lineHeight: 22 },
  cta:       { marginTop: Spacing.md, paddingHorizontal: Spacing['2xl'] },
});
