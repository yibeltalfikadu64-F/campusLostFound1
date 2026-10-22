import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors, borderRadius, typography } from '../../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: colors.secondary },
          text: { color: colors.textInverse }
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary
          },
          text: { color: colors.primary }
        };
      case 'danger':
        return {
          button: { backgroundColor: colors.danger },
          text: { color: colors.textInverse }
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: colors.primary },
          text: { color: colors.textInverse }
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12 },
          text: { fontSize: 13 }
        };
      case 'lg':
        return {
          button: { paddingVertical: 16, paddingHorizontal: 24 },
          text: { fontSize: 16 }
        };
      case 'md':
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 18 },
          text: { fontSize: 14 }
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        variantStyles.button,
        sizeStyles.button,
        disabled && styles.disabledButton,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.baseText,
              variantStyles.text,
              sizeStyles.text,
              disabled && styles.disabledText,
              icon ? { marginLeft: 8 } : {},
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  baseText: {
    ...typography.button,
    textAlign: 'center'
  },
  disabledButton: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled
  },
  disabledText: {
    color: colors.disabledText
  }
});
