import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button }     from '../../components/atoms/Button';
import { InlineLink } from '../../components/atoms/InlineLink';

interface SplashScreenProps {
  onSignUp: () => void;
  onLogin:  () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onSignUp, onLogin }) => (
  <View style={styles.container}>
    <View style={styles.backdrop} />
    <View style={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.appName}>HomeTour AI</Text>
        <Text style={styles.tagline}>
          Transform any property into an immersive 360° experience in minutes.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Create Account" onPress={onSignUp} />
        <Button label="Log In"         onPress={onLogin}  variant="secondary" />
        <InlineLink label="Continue as Guest (coming soon)" onPress={() => {}} centered />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primaryDark, opacity: 0.15 },
  content:   { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between', paddingTop: 100, paddingBottom: 60 },
  hero:      { alignItems: 'center', gap: Spacing.md },
  logo:      { fontSize: 72, marginBottom: Spacing.sm },
  appName:   { fontSize: Typography.size['4xl'], fontWeight: Typography.weight.bold, color: Colors.white },
  tagline:   { fontSize: Typography.size.lg, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 28, marginTop: Spacing.sm },
  actions:   { gap: Spacing.md },
});
