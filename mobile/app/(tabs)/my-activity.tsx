import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { api } from "../../src/api/endpoints";
import { ItemCard } from "../../src/components/common/ItemCard";
import { StatusBadge } from "../../src/components/common/StatusBadge";
import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { EmptyState } from "../../src/components/common/EmptyState";

type ActivityTab = "REPORTS" | "CLAIMS";

export default function MyActivityScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const isDark = systemScheme === "dark";

  const [activeTab, setActiveTab] = useState<ActivityTab>("REPORTS");

  const theme = {
    background: isDark ? "#090E1A" : "#F4F7FC",
    surface: isDark ? "#151D2E" : "#FFFFFF",
    surfaceAlt: isDark ? "#1C2940" : "#EDF2FA",
    text: isDark ? "#F1F5F9" : "#14213D",
    muted: isDark ? "#A4B1C5" : "#64748B",
    border: isDark ? "#334155" : "#DCE4F0",
    primary: isDark ? "#8BA9FF" : "#315CF5",
    green: isDark ? "#6EE7B7" : "#047857",
    greenBg: isDark ? "#12352E" : "#ECFDF5",
    amber: isDark ? "#FCD34D" : "#92400E",
    amberBg: isDark ? "#3A2D16" : "#FFFBEB",
    purple: isDark ? "#D8B4FE" : "#7E22CE",
    purpleBg: isDark ? "#302044" : "#F3E8FF",
    red: isDark ? "#FDA4AF" : "#BE123C",
    redBg: isDark ? "#3B1D29" : "#FFF1F2",
  };

  const styles = createStyles(theme);

  // Fetch the user's reports.
  const {
    data: reportsData,
    isLoading: loadingReports,
    isError: reportsError,
    refetch: refetchReports,
    isRefetching: refetchingReports,
  } = useQuery({
    queryKey: ["my-reports"],
    queryFn: () => api.users.getMyItems(),
    enabled: activeTab === "REPORTS",
  });

  // Fetch the user's claims.
  const {
    data: claimsData,
    isLoading: loadingClaims,
    isError: claimsError,
    refetch: refetchClaims,
    isRefetching: refetchingClaims,
  } = useQuery({
    queryKey: ["my-claims"],
    queryFn: () => api.users.getMyClaims(),
    enabled: activeTab === "CLAIMS",
  });

  const reports = reportsData?.data || [];
  const claims = claimsData?.data || [];

  const isRefreshing =
    activeTab === "REPORTS" ? refetchingReports : refetchingClaims;

  const onRefresh = activeTab === "REPORTS" ? refetchReports : refetchClaims;

  const isLoading = activeTab === "REPORTS" ? loadingReports : loadingClaims;

  const hasError = activeTab === "REPORTS" ? reportsError : claimsError;

  const retry = () => {
    void onRefresh();
  };

  const openItem = (itemId: string) => {
    router.push(`/items/${itemId}` as any);
  };

  const renderHeader = () => (
    <View>
      {/* Page heading */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="time-outline" size={25} color={theme.primary} />
          </View>

          <View style={styles.heroBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.heroBadgeText}>Your campus activity</Text>
          </View>
        </View>

        <Text style={styles.pageTitle}>My activity</Text>
        <Text style={styles.pageSubtitle}>
          Keep track of your reported items, submitted claims, and collection
          updates.
        </Text>
      </View>

      {/* Activity summary */}
      <View style={styles.summaryRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("REPORTS")}
          style={[
            styles.summaryCard,
            activeTab === "REPORTS" && styles.summaryCardActive,
          ]}
        >
          <View style={[styles.summaryIcon, styles.reportIcon]}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={theme.primary}
            />
          </View>
          <Text style={styles.summaryNumber}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>My reports</Text>
          <View style={styles.summaryBottom}>
            <Text style={styles.summaryAction}>View reports</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("CLAIMS")}
          style={[
            styles.summaryCard,
            activeTab === "CLAIMS" && styles.summaryCardActive,
          ]}
        >
          <View style={[styles.summaryIcon, styles.claimIcon]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={theme.purple}
            />
          </View>
          <Text style={styles.summaryNumber}>{claims.length}</Text>
          <Text style={styles.summaryLabel}>My claims</Text>
          <View style={styles.summaryBottom}>
            <Text style={styles.summaryAction}>View claims</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("REPORTS")}
          style={[
            styles.tabButton,
            activeTab === "REPORTS" && styles.tabButtonActive,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "REPORTS" }}
        >
          <Ionicons
            name="documents-outline"
            size={18}
            color={activeTab === "REPORTS" ? theme.primary : theme.muted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "REPORTS" && styles.tabTextActive,
            ]}
          >
            Reports
          </Text>
          <View
            style={[
              styles.tabCount,
              activeTab === "REPORTS" && styles.tabCountActive,
            ]}
          >
            <Text
              style={[
                styles.tabCountText,
                activeTab === "REPORTS" && styles.tabCountTextActive,
              ]}
            >
              {reports.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("CLAIMS")}
          style={[
            styles.tabButton,
            activeTab === "CLAIMS" && styles.tabButtonActive,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "CLAIMS" }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={activeTab === "CLAIMS" ? theme.primary : theme.muted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "CLAIMS" && styles.tabTextActive,
            ]}
          >
            Claims
          </Text>
          <View
            style={[
              styles.tabCount,
              activeTab === "CLAIMS" && styles.tabCountActive,
            ]}
          >
            <Text
              style={[
                styles.tabCountText,
                activeTab === "CLAIMS" && styles.tabCountTextActive,
              ]}
            >
              {claims.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Feed heading */}
      <View style={styles.feedHeading}>
        <View style={styles.feedHeadingCopy}>
          <Text style={styles.feedTitle}>
            {activeTab === "REPORTS" ? "Your reports" : "Your claims"}
          </Text>
          <Text style={styles.feedSubtitle}>
            {activeTab === "REPORTS"
              ? "Items you have reported on campus"
              : "Claims and item collection updates"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={retry}
          style={styles.refreshButton}
          accessibilityLabel="Refresh activity"
        >
          <Ionicons name="refresh-outline" size={19} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Error state */}
      {hasError && (
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={22} color={theme.red} />
          <View style={styles.errorCopy}>
            <Text style={styles.errorTitle}>Couldn't load activity</Text>
            <Text style={styles.errorDescription}>
              Check your connection and try again.
            </Text>
          </View>
          <TouchableOpacity onPress={retry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderClaim = ({ item: claim }: { item: any }) => {
    const status = String(claim.status || "PENDING").toUpperCase();

    const statusColor =
      status === "APPROVED" || status === "COMPLETED"
        ? theme.green
        : status === "REJECTED"
          ? theme.red
          : theme.amber;

    const statusBackground =
      status === "APPROVED" || status === "COMPLETED"
        ? theme.greenBg
        : status === "REJECTED"
          ? theme.redBg
          : theme.amberBg;

    return (
      <TouchableOpacity
        style={styles.claimCard}
        activeOpacity={0.8}
        onPress={() => openItem(claim.itemId)}
        accessibilityRole="button"
      >
        {/* Claim heading */}
        <View style={styles.claimHeader}>
          <View style={styles.claimItemIcon}>
            <Ionicons name="cube-outline" size={22} color={theme.primary} />
          </View>

          <View style={styles.claimTitleContainer}>
            <Text style={styles.claimItemTitle} numberOfLines={2}>
              {claim.item?.title || "Campus item"}
            </Text>
            <Text style={styles.claimSubtitle}>Item ownership claim</Text>
          </View>

          <Ionicons name="chevron-forward" size={19} color={theme.muted} />
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={styles.fieldLabel}>Claim status</Text>

          <View
            style={[styles.statusPill, { backgroundColor: statusBackground }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        {/* Evidence */}
        <View style={styles.evidenceBox}>
          <View style={styles.evidenceHeading}>
            <Ionicons
              name="document-text-outline"
              size={17}
              color={theme.primary}
            />
            <Text style={styles.evidenceLabel}>Your submitted evidence</Text>
          </View>

          <Text style={styles.evidenceText} numberOfLines={4}>
            {claim.proofDescription
              ? `“${claim.proofDescription}”`
              : "No evidence description available."}
          </Text>
        </View>

        {/* Review note */}
        {claim.reviewNote ? (
          <View style={styles.noteBox}>
            <View style={styles.noteHeading}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={17}
                color={theme.amber}
              />
              <Text style={[styles.noteTitle, { color: theme.amber }]}>
                Security review note
              </Text>
            </View>
            <Text style={styles.noteText}>{claim.reviewNote}</Text>
          </View>
        ) : null}

        {/* Handover location */}
        {claim.handoverLocation ? (
          <View style={styles.handoverBox}>
            <View style={styles.handoverIcon}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.purple}
              />
            </View>
            <View style={styles.handoverCopy}>
              <Text style={styles.handoverTitle}>Collection information</Text>
              <Text style={styles.handoverText}>{claim.handoverLocation}</Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.claimFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color={theme.muted} />
            <Text style={styles.claimDate}>
              {claim.createdAt
                ? `Submitted ${new Date(claim.createdAt).toLocaleDateString()}`
                : "Submission date unavailable"}
            </Text>
          </View>

          <Text style={styles.viewDetails}>View item</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner
            message={
              activeTab === "REPORTS"
                ? "Loading your reports..."
                : "Loading your claims..."
            }
          />
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons
            name="cloud-offline-outline"
            size={35}
            color={theme.muted}
          />
          <Text style={styles.emptyTitle}>Activity unavailable</Text>
          <Text style={styles.emptyDescription}>
            Your activity could not be loaded. Please retry.
          </Text>
          <TouchableOpacity style={styles.emptyAction} onPress={retry}>
            <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === "REPORTS") {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={33}
              color={theme.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyDescription}>
            When you report a lost or found item, it will appear here so you can
            track it.
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push("/(tabs)/report")}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Report an item</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={33}
            color={theme.purple}
          />
        </View>
        <Text style={styles.emptyTitle}>No claims yet</Text>
        <Text style={styles.emptyDescription}>
          If you find an item that belongs to you, submit a claim to track the
          review and collection process here.
        </Text>
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => router.push("/(tabs)/search")}
        >
          <Ionicons name="search-outline" size={18} color="#FFFFFF" />
          <Text style={styles.emptyActionText}>Search items</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        key={activeTab}
        data={activeTab === "REPORTS" ? reports : claims}
        keyExtractor={(item: any) => item.id}
        renderItem={
          activeTab === "REPORTS"
            ? ({ item }) => (
                <ItemCard item={item} onPress={() => openItem(item.id)} />
              )
            : renderClaim
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={retry}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.surface}
          />
        }
      />
    </View>
  );
}

function createStyles(theme: {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  green: string;
  greenBg: string;
  amber: string;
  amberBg: string;
  purple: string;
  purpleBg: string;
  red: string;
  redBg: string;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      padding: 16,
      paddingBottom: 36,
      maxWidth: 900,
      width: "100%",
      alignSelf: "center",
      flexGrow: 1,
    },

    // Heading
    hero: {
      paddingTop: 3,
      marginBottom: 21,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 30,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.green,
    },
    heroBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.muted,
    },
    pageTitle: {
      fontSize: 29,
      fontWeight: "800",
      letterSpacing: -0.6,
      color: theme.text,
      marginBottom: 7,
    },
    pageSubtitle: {
      fontSize: 13,
      lineHeight: 21,
      color: theme.muted,
      maxWidth: 550,
    },

    // Summary cards
    summaryRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 22,
    },
    summaryCard: {
      flex: 1,
      minWidth: 0,
      padding: 14,
      borderRadius: 19,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryCardActive: {
      borderColor: theme.primary,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    reportIcon: {
      backgroundColor: theme.surfaceAlt,
    },
    claimIcon: {
      backgroundColor: theme.purpleBg,
    },
    summaryNumber: {
      fontSize: 27,
      fontWeight: "800",
      color: theme.text,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 3,
      marginBottom: 14,
    },
    summaryBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
      gap: 4,
    },
    summaryAction: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "800",
      flexShrink: 1,
    },

    // Tabs
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 5,
      marginBottom: 24,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      paddingHorizontal: 5,
      borderRadius: 12,
    },
    tabButtonActive: {
      backgroundColor: theme.surfaceAlt,
    },
    tabText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.muted,
    },
    tabTextActive: {
      color: theme.primary,
    },
    tabCount: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      backgroundColor: theme.surfaceAlt,
    },
    tabCountActive: {
      backgroundColor: theme.primary,
    },
    tabCountText: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
    },
    tabCountTextActive: {
      color: "#FFFFFF",
    },

    // Feed heading
    feedHeading: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    feedHeadingCopy: {
      flex: 1,
    },
    feedTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
    feedSubtitle: {
      fontSize: 11,
      lineHeight: 17,
      color: theme.muted,
      marginTop: 4,
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },

    // Claim cards
    claimCard: {
      backgroundColor: theme.surface,
      borderRadius: 19,
      padding: 15,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    claimHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      marginBottom: 16,
    },
    claimItemIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceAlt,
    },
    claimTitleContainer: {
      flex: 1,
    },
    claimItemTitle: {
      ...typography.h3,
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 21,
    },
    claimSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.muted,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 30,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "800",
    },
    evidenceBox: {
      padding: 13,
      borderRadius: 13,
      backgroundColor: theme.surfaceAlt,
      marginBottom: 12,
    },
    evidenceHeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 8,
    },
    evidenceLabel: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "800",
    },
    evidenceText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
      fontStyle: "italic",
    },

    // Review note
    noteBox: {
      backgroundColor: theme.amberBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 13,
      padding: 12,
      marginBottom: 12,
    },
    noteHeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 7,
    },
    noteTitle: {
      fontSize: 11,
      fontWeight: "800",
    },
    noteText: {
      color: theme.text,
      fontSize: 12,
      lineHeight: 19,
    },

    // Collection details
    handoverBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 13,
      backgroundColor: theme.purpleBg,
      marginBottom: 12,
    },
    handoverIcon: {
      width: 37,
      height: 37,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
    },
    handoverCopy: {
      flex: 1,
    },
    handoverTitle: {
      color: theme.purple,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
    },
    handoverText: {
      color: theme.text,
      fontSize: 12,
      lineHeight: 18,
    },
    claimFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    claimDate: {
      color: theme.muted,
      fontSize: 10,
      flexShrink: 1,
    },
    viewDetails: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "800",
    },

    // Empty and error states
    loadingContainer: {
      paddingVertical: 35,
    },
    emptyCard: {
      alignItems: "center",
      paddingHorizontal: 22,
      paddingVertical: 32,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      marginBottom: 20,
    },
    emptyIcon: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: theme.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 17,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 8,
    },
    emptyDescription: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 350,
      marginBottom: 20,
    },
    emptyAction: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 13,
      backgroundColor: theme.primary,
    },
    emptyActionText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      padding: 13,
      borderRadius: 14,
      backgroundColor: theme.redBg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    errorCopy: {
      flex: 1,
    },
    errorTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 4,
    },
    errorDescription: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17,
    },
    retryButton: {
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.surface,
    },
    retryText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "800",
    },
  });
}
