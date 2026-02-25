import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { NavBar }     from '../../components/molecules/NavBar';
import { TextField }  from '../../components/atoms/TextField';
import { Button }     from '../../components/atoms/Button';
import { InlineLink } from '../../components/atoms/InlineLink';

interface LoginScreenProps {
  onBack:           () => void;
  onSubmit:         (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
  onCreateAccount:  () => void;
  errorBanner?:     string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack, onSubmit, onForgotPassword, onCreateAccount, errorBanner,
}) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try   { await onSubmit(email, password); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.screen}>
      <NavBar title="Welcome Back" onBackPress={onBack} />
      {errorBanner && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorBanner}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextField label="Email"    placeholder="jane@example.com" value={email}    onChangeText={setEmail}    keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Password" placeholder="Your password"    value={password} onChangeText={setPassword} isPassword />
        <View style={styles.forgotRow}>
          <InlineLink label="Forgot password?" onPress={onForgotPassword} />
        </View>
        <Button label="Log In" onPress={handleLogin} loading={loading} style={styles.cta} />
        <View style={styles.signUpRow}>
          <Text style={styles.hint}>Don't have an account? </Text>
          <InlineLink label="Create Account" onPress={onCreateAccount} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: Colors.background },
  errorBanner:     { backgroundColor: Colors.errorLight, borderLeftWidth: 4, borderLeftColor: Colors.error, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, marginHorizontal: Spacing.base, marginTop: Spacing.md, borderRadius: 8 },
  errorBannerText: { color: Colors.error, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  body:            { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
  forgotRow:       { alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: Spacing.xs },
  cta:             { marginTop: Spacing.sm },
  signUpRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  hint:            { fontSize: Typography.size.base, color: Colors.gray500 },
});
