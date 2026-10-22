import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { CustomButton } from '../../src/components/common/CustomButton';
import { FormInput } from '../../src/components/common/FormInput';
import { api } from '../../src/api/endpoints';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useI18n();

  // Password change modal state
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPass || !newPass) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPass.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setPassLoading(true);
      await api.users.updatePassword({
        currentPassword: currentPass,
        newPassword: newPass
      });
      Alert.alert('Success', 'Password changed successfully');
      setPassModalVisible(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password';
      Alert.alert('Error', msg);
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out from your Injibara University campus session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header Avatar */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullName || 'Injibara User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
        </View>
      </View>

      {/* Profile Information Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={18} color={colors.primary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>University / Student ID</Text>
            <Text style={styles.infoVal}>{user?.universityId || 'Not registered'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Institutional Email</Text>
            <Text style={styles.infoVal}>{user?.email || 'None'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoVal}>{user?.phone || 'None'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Department / Faculty</Text>
            <Text style={styles.infoVal}>{user?.department || 'Injibara University'}</Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences & Localization</Text>

        <View style={styles.prefRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={styles.prefLabel}>Language (ቋንቋ)</Text>
          </View>
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langChoice, language === 'en' && styles.langChoiceActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langChoice, language === 'am' && styles.langChoiceActive]}
              onPress={() => setLanguage('am')}
            >
              <Text style={[styles.langChoiceText, language === 'am' && styles.langChoiceTextActive]}>
                አማርኛ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Security Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setPassModalVisible(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Change Account Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            Alert.alert(
              'Privacy Notice',
              'Injibara Campus Lost & Found protects your identity. Private phone numbers and secret verification clues are only revealed to authorized campus security officers upon legitimate ownership claim approval.'
            )
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Privacy & Ownership Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <CustomButton
        title={t.auth.logout}
        onPress={handleLogout}
        variant="danger"
        size="lg"
        style={styles.logoutButton}
      />

      <Text style={styles.versionText}>
        Injibara Campus Lost & Found v1.0.0 • Production Build
      </Text>

      {/* Password Change Modal */}
      <Modal
        visible={passModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Password</Text>
              <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FormInput
              label="Current Password"
              placeholder="Enter current password"
              value={currentPass}
              onChangeText={setCurrentPass}
              isPassword
            />
            <FormInput
              label="New Password"
              placeholder="Minimum 8 characters"
              value={newPass}
              onChangeText={setNewPass}
              isPassword
            />
            <FormInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              isPassword
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setPassModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title="Save Password"
                onPress={handlePasswordChange}
                variant="primary"
                loading={passLoading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: spacing.md
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    elevation: 4
  },
  avatarInitial: {
    ...typography.h1,
    color: '#FFFFFF',
    fontSize: 32
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full
  },
  roleText: {
    ...typography.captionBold,
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  infoCol: {
    marginLeft: 12,
    flex: 1
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  infoVal: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 2
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  prefLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 10
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.full,
    padding: 3
  },
  langChoice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full
  },
  langChoiceActive: {
    backgroundColor: colors.primary
  },
  langChoiceText: {
    ...typography.captionBold,
    color: colors.textSecondary
  },
  langChoiceTextActive: {
    color: '#FFFFFF'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 10
  },
  logoutButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.md
  }
});
