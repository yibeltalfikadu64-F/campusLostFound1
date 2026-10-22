import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { CustomButton } from '../../src/components/common/CustomButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>Password Assistance</Text>
        <Text style={styles.description}>
          For institutional security, student account password resets require identity verification through your student ID card.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardHeader}>Campus Support Office</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Main Administration Building, Office #104</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>+251 58 227 0000 / ext. 204</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>security-desk@injibara.edu.et</Text>
          </View>
        </View>

        <CustomButton
          title="Return to Login"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg
  },
  backButton: {
    paddingVertical: spacing.md
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center'
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xxl
  },
  cardHeader: {
    ...typography.captionBold,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  infoText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 10,
    flex: 1
  },
  button: {
    width: '100%'
  }
});
