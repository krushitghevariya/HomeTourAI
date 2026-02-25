import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { NavBar }      from '../../components/molecules/NavBar';
import { TextField }   from '../../components/atoms/TextField';
import { Button }      from '../../components/atoms/Button';
import { InlineLink }  from '../../components/atoms/InlineLink';

interface SignUpForm {
  fullName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

interface SignUpScreenProps {
  onBack:        () => void;
  onSubmit:      (form: SignUpForm) => Promise<void>;
  onLoginPress:  () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onSubmit, onLoginPress }) => {
  const [form,    setForm]    = useState<SignUpForm>({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors,  setErrors]  = useState<Partial<SignUpForm>>({});
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof SignUpForm) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const errs: Partial<SignUpForm> = {};
    if (!form.fullName.trim())           errs.fullName        = 'Full name is required';
    if (!form.email.includes('@'))       errs.email           = 'Enter a valid email';
    if (form.password.length < 8)        errs.password        = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try   { await onSubmit(form); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.screen}>
      <NavBar title="Create Account" onBackPress={onBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Start your first 360° tour today.</Text>
        <TextField label="Full Name"        placeholder="Jane Smith"            value={form.fullName}        onChangeText={setField('fullName')}        onBlur={validate} error={errors.fullName}        autoCapitalize="words" />
        <TextField label="Email"            placeholder="jane@example.com"      value={form.email}           onChangeText={setField('email')}           onBlur={validate} error={errors.email}           keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Password"         placeholder="At least 8 characters" value={form.password}        onChangeText={setField('password')}        onBlur={validate} error={errors.password}        isPassword />
        <TextField label="Confirm Password" placeholder="Re-enter your password" value={form.confirmPassword} onChangeText={setField('confirmPassword')} onBlur={validate} error={errors.confirmPassword} isPassword />
        <Button label="Create Account" onPress={handleSubmit} loading={loading} style={styles.cta} />
        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Already have an account? </Text>
          <InlineLink label="Log In" onPress={onLoginPress} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  body:     { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xl },
  subtitle: { fontSize: Typography.size.base, color: Colors.gray500, marginBottom: Spacing.xl },
  cta:      { marginTop: Spacing.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginHint:{ fontSize: Typography.size.base, color: Colors.gray500 },
});
