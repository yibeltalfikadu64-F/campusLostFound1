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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useI18n();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your full legal name');
      return;
    }
    if (!email.trim() && !universityId.trim()) {
      setError('Please provide either your University Email or Student ID');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Please enter a valid phone number (+251...)');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        universityId: universityId.trim() || undefined,
        phone: phone.trim(),
        department: department.trim() || undefined,
        password
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      Alert.alert('Registration Error', msg);
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
            <Text style={styles.title}>{t.auth.register}</Text>
            <Text style={styles.subtitle}>
              Join the Injibara University campus community.
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
              label={t.auth.fullName}
              placeholder="e.g. Dawit Tadesse"
              value={fullName}
              onChangeText={(v) => { setFullName(v); setError(null); }}
              leftIcon="person-outline"
            />

            <FormInput
              label="University Email (Optional)"
              placeholder="e.g. dawit@injibara.edu.et"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />

            <FormInput
              label="Student / Staff ID"
              placeholder="e.g. UGR/14022/14"
              value={universityId}
              onChangeText={(v) => { setUniversityId(v); setError(null); }}
              autoCapitalize="characters"
              leftIcon="card-outline"
            />

            <FormInput
              label={t.auth.phone}
              placeholder="+251 9..."
              value={phone}
              onChangeText={(v) => { setPhone(v); setError(null); }}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <FormInput
              label={t.auth.department}
              placeholder="e.g. Computer Science / Engineering"
              value={department}
              onChangeText={setDepartment}
              leftIcon="business-outline"
            />

            <FormInput
              label={t.auth.password}
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              isPassword
              leftIcon="lock-closed-outline"
            />

            <FormInput
              label={t.auth.confirmPassword}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
              isPassword
              leftIcon="shield-checkmark-outline"
            />

            <Text style={styles.privacyNote}>{t.auth.privacyNote}</Text>

            <CustomButton
              title={t.auth.register}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Already registered? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.switchAuthLink}>{t.auth.login}</Text>
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
    paddingBottom: spacing.xxl
  },
  backButton: {
    paddingVertical: spacing.md,
    alignSelf: 'flex-start'
  },
  header: {
    marginVertical: spacing.md
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 6
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
    marginTop: spacing.xs
  },
  privacyNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18
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
