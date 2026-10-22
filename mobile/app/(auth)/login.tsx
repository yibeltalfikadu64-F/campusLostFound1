import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';
import { FormInput } from '../../src/components/common/FormInput';
import { CustomButton } from '../../src/components/common/CustomButton';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useI18n } from '../../src/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setError('Please enter your University Email or Student ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t.auth.login}</Text>
            <Text style={styles.subtitle}>
              Sign in with your Injibara University student credentials.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <FormInput
              label={t.auth.emailOrId}
              placeholder="e.g. student@injibara.edu.et or UGR/14022/14"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setError(null);
              }}
              autoCapitalize="none"
              leftIcon="person-outline"
            />

            <FormInput
              label={t.auth.password}
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              isPassword
              leftIcon="lock-closed-outline"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassButton}
            >
              <Text style={styles.forgotPassText}>{t.auth.forgotPassword}</Text>
            </TouchableOpacity>

            <CustomButton
              title={t.auth.login}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.switchAuthLink}>{t.auth.register}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  backButton: {
    paddingVertical: spacing.md,
    alignSelf: 'flex-start'
  },
  header: {
    marginVertical: spacing.lg
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 8
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  errorText: {
    ...typography.captionBold,
    color: colors.danger,
    marginLeft: 8,
    flex: 1
  },
  form: {
    marginTop: spacing.sm
  },
  forgotPassButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg
  },
  forgotPassText: {
    ...typography.captionBold,
    color: colors.secondary
  },
  submitButton: {
    marginBottom: spacing.lg
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  switchAuthText: {
    ...typography.body,
    color: colors.textSecondary
  },
  switchAuthLink: {
    ...typography.bodyBold,
    color: colors.primary
  }
});
