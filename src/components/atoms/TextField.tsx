import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?:      string;
  error?:      string;
  isPassword?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label, error, isPassword = false, ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        !!error && styles.errored,
        inputProps.editable === false && styles.disabled,
      ]}>
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          placeholderTextColor={Colors.gray400}
          autoCapitalize={isPassword ? 'none' : inputProps.autoCapitalize}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            style={styles.eyeToggle}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { marginBottom: Spacing.md },
  label:        { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray700, marginBottom: Spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: BorderRadius.md, backgroundColor: Colors.white, paddingHorizontal: Spacing.base, height: 52 },
  focused:      { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  errored:      { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  disabled:     { backgroundColor: Colors.gray100, borderColor: Colors.gray200 },
  input:        { flex: 1, fontSize: Typography.size.base, color: Colors.gray900, paddingVertical: 0 },
  eyeToggle:    { padding: Spacing.xs },
  eyeIcon:      { fontSize: 16 },
  errorText:    { marginTop: Spacing.xs, fontSize: Typography.size.xs, color: Colors.error },
});
