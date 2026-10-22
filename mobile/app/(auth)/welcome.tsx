import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { CustomButton } from '../../src/components/common/CustomButton';
import { useI18n } from '../../src/i18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerLang}>
        <TouchableOpacity
          onPress={() => setLanguage(language === 'en' ? 'am' : 'en')}
          style={styles.langButton}
        >
          <Ionicons name="globe-outline" size={16} color={colors.primary} />
          <Text style={styles.langText}>
            {language === 'en' ? 'አማርኛ' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Ionicons name="compass" size={60} color="#FFFFFF" />
        </View>

        <Text style={styles.uniName}>{t.common.university.toUpperCase()}</Text>
        <Text style={styles.title}>{t.auth.welcomeTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.welcomeSubtitle}</Text>
      </View>

      <View style={styles.footer}>
        <CustomButton
          title={t.auth.login}
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          size="lg"
          style={styles.button}
        />
        <CustomButton
          title={t.auth.register}
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
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
  headerLang: {
    alignItems: 'flex-end',
    paddingVertical: spacing.sm
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border
  },
  langText: {
    ...typography.captionBold,
    color: colors.primary,
    marginLeft: 6
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12
  },
  uniName: {
    ...typography.captionBold,
    color: colors.secondary,
    letterSpacing: 2,
    marginBottom: 8
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24
  },
  footer: {
    paddingBottom: spacing.xl
  },
  button: {
    marginBottom: spacing.md
  }
});
