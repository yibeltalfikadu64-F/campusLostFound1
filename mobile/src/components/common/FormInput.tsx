import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing } from '../../theme';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  isPassword = false,
  containerStyle,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          !!error && styles.errorInput
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 48
  },
  focusedInput: {
    borderColor: colors.primary
  },
  errorInput: {
    borderColor: colors.danger
  },
  leftIcon: {
    marginRight: 8
  },
  rightIcon: {
    padding: 4
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%'
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4
  }
});
