import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { colors, borderRadius, typography } from "../../theme";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const variantStyles = (() => {
    switch (variant) {
      case "secondary":
        return {
          button: { backgroundColor: colors.secondary },
          text: { color: colors.textInverse },
        };
      case "outline":
        return {
          button: {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: { color: colors.primary },
        };
      case "danger":
        return {
          button: { backgroundColor: colors.danger },
          text: { color: colors.textInverse },
        };
      default:
        return {
          button: { backgroundColor: colors.primary },
          text: { color: colors.textInverse },
        };
    }
  })();

  const sizeStyles = (() => {
    switch (size) {
      case "sm":
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12 },
          text: { fontSize: 13 },
        };
      case "lg":
        return {
          button: { paddingVertical: 16, paddingHorizontal: 24 },
          text: { fontSize: 16 },
        };
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 18 },
          text: { fontSize: 14 },
        };
    }
  })();

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      style={[
        styles.baseButton,
        variantStyles.button,
        sizeStyles.button,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? colors.primary : colors.textInverse}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.baseText,
              variantStyles.text,
              sizeStyles.text,
              isDisabled && styles.disabledText,
              icon ? styles.iconSpacing : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  baseText: {
    ...typography.button,
    textAlign: "center",
  },
  iconSpacing: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.55,
  },
  disabledText: {
    color: colors.disabledText,
  },
});
