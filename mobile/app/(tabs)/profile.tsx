import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  useColorScheme,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { useAuth } from "../../src/features/auth/AuthContext";
import { useI18n } from "../../src/i18n";
import { CustomButton } from "../../src/components/common/CustomButton";
import { FormInput } from "../../src/components/common/FormInput";
import { api } from "../../src/api/endpoints";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const systemScheme = useColorScheme();
  const isDark = systemScheme === "dark";

  const theme = {
    background: isDark ? "#0B1120" : "#F4F7FB",
    card: isDark ? "#151F32" : "#FFFFFF",
    text: isDark ? "#F1F5F9" : "#172033",
    secondaryText: isDark ? "#A5B4CC" : "#64748B",
    mutedText: isDark ? "#8290A8" : "#94A3B8",
    border: isDark ? "#2A3850" : "#E2E8F0",
    primary: isDark ? "#7EA6FF" : colors.primary,
    accentBackground: isDark ? "#203452" : "#E8F0FF",
    inputBackground: isDark ? "#10192A" : "#F8FAFC",
    overlay: "rgba(0,0,0,0.68)",
    danger: "#EF4444",
    success: "#22C55E",
  };

  const styles = createStyles(theme);

  const [passModalVisible, setPassModalVisible] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const closePasswordModal = () => {
    if (passLoading) return;

    setPassModalVisible(false);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  const handlePasswordChange = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert("Missing information", "Please fill in all password fields.");
      return;
    }

    if (newPass.length < 8) {
      Alert.alert(
        "Invalid password",
        "Your new password must be at least 8 characters long.",
      );
      return;
    }

    if (newPass !== confirmPass) {
      Alert.alert("Password mismatch", "Your new passwords do not match.");
      return;
    }

    if (currentPass === newPass) {
      Alert.alert(
        "Choose a different password",
        "Your new password must be different from your current password.",
      );
      return;
    }

    try {
      setPassLoading(true);

      await api.users.updatePassword({
        currentPassword: currentPass,
        newPassword: newPass,
      });

      Alert.alert("Success", "Your password has been changed successfully.");

      setPassModalVisible(false);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update your password. Please try again.";

      Alert.alert("Password update failed", message);
    } finally {
      setPassLoading(false);
    }
  };

  
  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace("/(auth)/welcome");
      } catch (error) {
        console.error("Logout failed:", error);

        if (Platform.OS === "web") {
          window.alert("Unable to sign out. Please try again.");
        } else {
          Alert.alert(
            "Sign out failed",
            "Unable to sign out. Please try again.",
          );
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to sign out of your Injibara University campus account?",
      );

      if (confirmed) {
        void performLogout();
      }

      return;
    }

    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out of your Injibara University campus account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
    );
  };


  const showPrivacyNotice = () => {
    Alert.alert(
      "Privacy & Ownership Policy",
      "Injibara Campus Lost & Found is designed to protect your identity. Private phone numbers and secret verification clues should only be disclosed to authorized campus security officers according to the applicable ownership-claim approval process.",
      [{ text: "I understand", style: "default" }],
    );
  };

  const initial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const displayRole = user?.role
    ? user.role.replace(/_/g, " ").toUpperCase()
    : "USER";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.eyebrow}>INJIBARA UNIVERSITY</Text>
          <Text style={styles.pageTitle}>My Profile</Text>
          <Text style={styles.pageSubtitle}>
            Manage your account and preferences
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="person-circle-outline"
            size={27}
            color={theme.primary}
          />
        </View>
      </View>

      {/* Profile card */}
      <View style={styles.heroCard}>
        <View style={styles.heroDecoration} />

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{initial}</Text>
          <View style={styles.onlineIndicator} />
        </View>

        <Text style={styles.userName}>{user?.fullName || "Injibara User"}</Text>

        <Text style={styles.userEmail}>
          {user?.email || "No email registered"}
        </Text>

        <View style={styles.roleBadge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={theme.primary}
          />
          <Text style={styles.roleText}>{displayRole}</Text>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroFooter}>
          <View style={styles.heroFooterItem}>
            <Ionicons
              name="school-outline"
              size={18}
              color={theme.secondaryText}
            />
            <Text style={styles.heroFooterText}>Campus account</Text>
          </View>

          <View style={styles.heroFooterItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={theme.success}
            />
            <Text style={styles.heroFooterText}>Account profile</Text>
          </View>
        </View>
      </View>

      {/* Account details */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="person-outline" size={19} color={theme.primary} />
        </View>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <Text style={styles.sectionSubtitle}>
            Your registered information
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <InfoRow
          icon="card-outline"
          label="University / Student ID"
          value={user?.universityId || "Not registered"}
          theme={theme}
          styles={styles}
        />

        <View style={styles.rowDivider} />

        <InfoRow
          icon="mail-outline"
          label="Institutional email"
          value={user?.email || "None"}
          theme={theme}
          styles={styles}
        />

        <View style={styles.rowDivider} />

        <InfoRow
          icon="call-outline"
          label="Phone number"
          value={user?.phone || "None"}
          theme={theme}
          styles={styles}
        />

        <View style={styles.rowDivider} />

        <InfoRow
          icon="business-outline"
          label="Department / Faculty"
          value={user?.department || "Injibara University"}
          theme={theme}
          styles={styles}
        />
      </View>

      {/* Preferences */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="options-outline" size={19} color={theme.primary} />
        </View>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.sectionSubtitle}>
            Customize your app experience
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.preferenceHeader}>
          <View style={styles.preferenceIcon}>
            <Ionicons name="language-outline" size={21} color={theme.primary} />
          </View>

          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Language</Text>
            <Text style={styles.preferenceSubtitle}>
              Choose your preferred language
            </Text>
          </View>
        </View>

        <View style={styles.langToggle}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: language === "en" }}
            activeOpacity={0.8}
            style={[
              styles.langChoice,
              language === "en" && styles.langChoiceActive,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Ionicons
              name="globe-outline"
              size={17}
              color={language === "en" ? "#FFFFFF" : theme.secondaryText}
            />
            <Text
              style={[
                styles.langChoiceText,
                language === "en" && styles.langChoiceTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: language === "am" }}
            activeOpacity={0.8}
            style={[
              styles.langChoice,
              language === "am" && styles.langChoiceActive,
            ]}
            onPress={() => setLanguage("am")}
          >
            <Text
              style={[
                styles.langChoiceText,
                language === "am" && styles.langChoiceTextActive,
              ]}
            >
              አማርኛ
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.themeInfo}>
          <Ionicons
            name={isDark ? "moon-outline" : "sunny-outline"}
            size={17}
            color={theme.secondaryText}
          />
          <Text style={styles.themeInfoText}>
            Appearance follows your device settings
          </Text>
        </View>
      </View>

      {/* Security */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={theme.primary}
          />
        </View>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>Security & privacy</Text>
          <Text style={styles.sectionSubtitle}>
            Protect your account and information
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ActionRow
          icon="key-outline"
          title="Change account password"
          subtitle="Update your login credentials"
          onPress={() => setPassModalVisible(true)}
          theme={theme}
          styles={styles}
        />

        <View style={styles.rowDivider} />

        <ActionRow
          icon="lock-closed-outline"
          title="Privacy & ownership policy"
          subtitle="Learn how your information is protected"
          onPress={showPrivacyNotice}
          theme={theme}
          styles={styles}
        />
      </View>

      {/* Sign out */}
      <View style={styles.logoutCard}>
        <View style={styles.logoutIcon}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </View>

        <View style={styles.logoutTextContainer}>
          <Text style={styles.logoutTitle}>Ready to leave?</Text>
          <Text style={styles.logoutSubtitle}>
            You can sign back in anytime.
          </Text>
        </View>
      </View>

      <CustomButton
        title={t.auth.logout}
        onPress={handleLogout}
        variant="danger"
        size="lg"
        style={styles.logoutButton}
      />

      <Text style={styles.versionText}>Injibara Campus Lost & Found</Text>
      <Text style={styles.versionSubtext}>Version 1.0.0</Text>

      {/* Password modal */}
      <Modal
        visible={passModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingIcon}>
                <Ionicons name="key-outline" size={23} color={theme.primary} />
              </View>

              <View style={styles.modalHeadingText}>
                <Text style={styles.modalTitle}>Update password</Text>
                <Text style={styles.modalSubtitle}>
                  Choose a strong password for your account
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close password dialog"
                disabled={passLoading}
                style={styles.closeButton}
                onPress={closePasswordModal}
              >
                <Ionicons name="close" size={23} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordNotice}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={theme.primary}
              />
              <Text style={styles.passwordNoticeText}>
                Use at least 8 characters for your new password.
              </Text>
            </View>

            <FormInput
              label="Current password"
              placeholder="Enter your current password"
              value={currentPass}
              onChangeText={setCurrentPass}
              isPassword
            />

            <FormInput
              label="New password"
              placeholder="Enter a new password"
              value={newPass}
              onChangeText={setNewPass}
              isPassword
            />

            <FormInput
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              isPassword
            />

            <View style={styles.modalActions}>
              <View style={styles.modalButton}>
                <CustomButton
                  title="Cancel"
                  onPress={closePasswordModal}
                  variant="outline"
                  size="lg"
                  style={{ flex: 1 }}
                />
              </View>

              <View style={styles.modalButton}>
                <CustomButton
                  title="Save password"
                  onPress={handlePasswordChange}
                  variant="primary"
                  size="lg"
                  loading={passLoading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  primary: string;
  accentBackground: string;
  inputBackground: string;
  overlay: string;
  danger: string;
  success: string;
};

function InfoRow({
  icon,
  label,
  value,
  theme,
  styles,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  theme: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  theme,
  styles,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      style={styles.actionRow}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={21} color={theme.primary} />
      </View>

      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={theme.mutedText} />
    </TouchableOpacity>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
      width: "100%",
      maxWidth: 900,
      alignSelf: "center",
    },
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    eyebrow: {
      ...typography.captionBold,
      color: theme.primary,
      letterSpacing: 1.5,
      marginBottom: 5,
    },
    pageTitle: {
      ...typography.h1,
      color: theme.text,
      fontSize: 28,
    },
    pageSubtitle: {
      ...typography.body,
      color: theme.secondaryText,
      marginTop: 4,
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    heroCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: spacing.lg,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: spacing.xl,
      overflow: "hidden",
      ...(Platform.OS === "web"
        ? { boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.06)" }
        : {
            elevation: 2,
            shadowColor: "#000000",
            shadowOpacity: isDarkShadow(theme) ? 0.2 : 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }),
    },
    heroDecoration: {
      position: "absolute",
      top: -80,
      width: 260,
      height: 160,
      borderRadius: 100,
      backgroundColor: theme.accentBackground,
      opacity: 0.75,
    },
    avatarCircle: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: theme.card,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      elevation: 4,
    },
    avatarInitial: {
      ...typography.h1,
      color: "#FFFFFF",
      fontSize: 36,
    },
    onlineIndicator: {
      position: "absolute",
      right: 2,
      bottom: 3,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: theme.success,
      borderWidth: 3,
      borderColor: theme.card,
    },
    userName: {
      ...typography.h2,
      color: theme.text,
      textAlign: "center",
      marginBottom: 5,
    },
    userEmail: {
      ...typography.body,
      color: theme.secondaryText,
      textAlign: "center",
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      gap: 6,
      backgroundColor: theme.accentBackground,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: borderRadius.full,
      marginTop: spacing.md,
    },
    roleText: {
      ...typography.captionBold,
      color: theme.primary,
      letterSpacing: 0.5,
    },
    heroDivider: {
      height: 1,
      backgroundColor: theme.border,
      alignSelf: "stretch",
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    heroFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.lg,
    },
    heroFooterItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroFooterText: {
      ...typography.caption,
      color: theme.secondaryText,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    sectionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    sectionHeadingText: {
      flex: 1,
    },
    sectionTitle: {
      ...typography.h3,
      color: theme.text,
    },
    sectionSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 3,
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },
    infoIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
    },
    infoLabel: {
      ...typography.caption,
      color: theme.secondaryText,
    },
    infoValue: {
      ...typography.bodyBold,
      color: theme.text,
      marginTop: 4,
      flexShrink: 1,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    preferenceHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    preferenceIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    preferenceTextContainer: {
      flex: 1,
    },
    preferenceTitle: {
      ...typography.bodyBold,
      color: theme.text,
    },
    preferenceSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 3,
    },
    langToggle: {
      flexDirection: "row",
      backgroundColor: theme.inputBackground,
      borderRadius: 15,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: spacing.md,
    },
    langChoice: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 11,
    },
    langChoiceActive: {
      backgroundColor: colors.primary,
    },
    langChoiceText: {
      ...typography.bodyBold,
      color: theme.secondaryText,
    },
    langChoiceTextActive: {
      color: "#FFFFFF",
    },
    themeInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: spacing.md,
    },
    themeInfoText: {
      ...typography.caption,
      color: theme.secondaryText,
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      gap: 12,
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    actionTextContainer: {
      flex: 1,
      minWidth: 0,
    },
    actionTitle: {
      ...typography.bodyBold,
      color: theme.text,
    },
    actionSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 4,
    },
    logoutCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: 12,
    },
    logoutIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDarkColor(theme.background) ? "#3A202A" : "#FEF2F2",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutTextContainer: {
      flex: 1,
    },
    logoutTitle: {
      ...typography.bodyBold,
      color: theme.text,
    },
    logoutSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 3,
    },
    logoutButton: {
      marginBottom: spacing.md,
    },
    versionText: {
      ...typography.captionBold,
      color: theme.secondaryText,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    versionSubtext: {
      ...typography.caption,
      color: theme.mutedText,
      textAlign: "center",
      marginTop: 4,
      marginBottom: spacing.xl,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      padding: spacing.md,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      maxHeight: "90%",
    },
    modalHandle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 4,
      backgroundColor: theme.mutedText,
      opacity: 0.5,
      marginBottom: spacing.lg,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    modalHeadingIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.accentBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    modalHeadingText: {
      flex: 1,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.text,
    },
    modalSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 4,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
    },
    passwordNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.accentBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: spacing.md,
    },
    passwordNoticeText: {
      ...typography.caption,
      color: theme.text,
      flex: 1,
    },
    modalActions: {
      flexDirection: "row",
      marginTop: spacing.md,
      gap: 10,
    },
    modalButton: {
      flex: 1,
      minWidth: 0,
    },
  });
}

function isDarkColor(value: string) {
  return value.toLowerCase() === "#0b1120";
}

function isDarkShadow(theme: ThemeColors) {
  return theme.background === "#0B1120";
}
