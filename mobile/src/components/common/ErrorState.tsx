import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { CustomButton } from './CustomButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load content. Please check your network or try again.',
  onRetry
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={38} color={colors.danger} />
      </View>
      <Text style={styles.title}>Unable to Load Data</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <CustomButton
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          size="sm"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.lg
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 6
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.md
  },
  retryButton: {
    minWidth: 120
  }
});
