import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { api } from '../../../src/api/endpoints';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ErrorState } from '../../../src/components/common/ErrorState';

export default function AdminDashboardScreen() {
  const router = useRouter();

  const {
    data: statsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.getStats()
  });

  if (isLoading) {
    return <LoadingSpinner message="Calculating campus database statistics..." />;
  }

  if (isError || !statsData?.data) {
    return (
      <ErrorState
        message={(error as any)?.message || 'Failed to retrieve administrative metrics'}
        onRetry={refetch}
      />
    );
  }

  const stats = statsData.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
        />
      }
    >
      {/* Overview Metric Cards */}
      <Text style={styles.sectionHeader}>Campus Inventory & Recovery</Text>
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.metricVal}>{stats.items.total}</Text>
          <Text style={styles.metricLabel}>Total Items Reported</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: colors.warning }]}>
          <Text style={[styles.metricVal, { color: colors.warning }]}>
            {stats.claims.pending}
          </Text>
          <Text style={styles.metricLabel}>Pending Claims</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
          <Text style={[styles.metricVal, { color: colors.success }]}>
            {stats.items.returned}
          </Text>
          <Text style={styles.metricLabel}>Returned to Owner</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: colors.secondary }]}>
          <Text style={[styles.metricVal, { color: colors.secondary }]}>
            {stats.items.recoveryRatePercentage}%
          </Text>
          <Text style={styles.metricLabel}>Recovery Rate</Text>
        </View>
      </View>

      {/* Item Types Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Reports Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: colors.lostTag }]}>
              {stats.items.lost}
            </Text>
            <Text style={styles.breakdownLabel}>Lost Items</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: colors.foundTag }]}>
              {stats.items.found}
            </Text>
            <Text style={styles.breakdownLabel}>Found Items</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: colors.info }]}>
              {stats.items.open}
            </Text>
            <Text style={styles.breakdownLabel}>Active / Open</Text>
          </View>
        </View>
      </View>

      {/* Management Modules */}
      <Text style={styles.sectionHeader}>Administrative Management</Text>

      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/admin/claims')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="shield-checkmark" size={24} color="#D97706" />
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Claims Review Queue</Text>
          <Text style={styles.menuSubtitle}>
            {stats.claims.pending} claims pending ownership verification
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/admin/users')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#E0E7FF' }]}>
          <Ionicons name="people" size={24} color="#4F46E5" />
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Campus User Directory</Text>
          <Text style={styles.menuSubtitle}>
            {stats.users.total} registered accounts ({stats.users.active} active)
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/admin/categories')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name="grid" size={24} color="#15803D" />
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Item Categories</Text>
          <Text style={styles.menuSubtitle}>Configure category list and icons</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/admin/locations')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#FCE7F3' }]}>
          <Ionicons name="location" size={24} color="#BE185D" />
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Injibara Campus Locations</Text>
          <Text style={styles.menuSubtitle}>Manage official university buildings & spots</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
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
  sectionHeader: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: spacing.sm
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  metricVal: {
    ...typography.h1,
    color: colors.primary
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg
  },
  breakdownTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  breakdownItem: {
    alignItems: 'center'
  },
  breakdownNum: {
    ...typography.h2
  },
  breakdownLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  breakdownDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  menuTextCol: {
    flex: 1
  },
  menuTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  }
});
