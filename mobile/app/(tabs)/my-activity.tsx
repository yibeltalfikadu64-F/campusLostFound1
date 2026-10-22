import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { ItemCard } from '../../src/components/common/ItemCard';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';

export default function MyActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'CLAIMS'>('REPORTS');

  // Fetch my reported items
  const {
    data: reportsData,
    isLoading: loadingReports,
    refetch: refetchReports,
    isRefetching: refetchingReports
  } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => api.users.getMyItems(),
    enabled: activeTab === 'REPORTS'
  });

  // Fetch my submitted claims
  const {
    data: claimsData,
    isLoading: loadingClaims,
    refetch: refetchClaims,
    isRefetching: refetchingClaims
  } = useQuery({
    queryKey: ['my-claims'],
    queryFn: () => api.users.getMyClaims(),
    enabled: activeTab === 'CLAIMS'
  });

  const reports = reportsData?.data || [];
  const claims = claimsData?.data || [];

  const isRefreshing = activeTab === 'REPORTS' ? refetchingReports : refetchingClaims;
  const onRefresh = activeTab === 'REPORTS' ? refetchReports : refetchClaims;

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'REPORTS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('REPORTS')}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === 'REPORTS' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'REPORTS' && styles.tabButtonTextActive
            ]}
          >
            My Reports ({reports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'CLAIMS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('CLAIMS')}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={activeTab === 'CLAIMS' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'CLAIMS' && styles.tabButtonTextActive
            ]}
          >
            My Claims ({claims.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Feed */}
      {activeTab === 'REPORTS' ? (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/items/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            loadingReports ? (
              <LoadingSpinner message="Loading your reports..." />
            ) : (
              <EmptyState
                title="No Reports Yet"
                description="You haven't reported any lost or found items on campus yet."
                icon="document-text-outline"
                actionTitle="Report an Item"
                onAction={() => router.push('/(tabs)/report')}
              />
            )
          }
        />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(claim) => claim.id}
          renderItem={({ item: claim }) => (
            <TouchableOpacity
              style={styles.claimCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/items/${claim.itemId}` as any)}
            >
              <View style={styles.claimHeader}>
                <Text style={styles.claimItemTitle} numberOfLines={1}>
                  {claim.item?.title || 'Reported Item'}
                </Text>
                <StatusBadge status={claim.status} />
              </View>

              <Text style={styles.claimProofLabel}>Your Evidence Submitted:</Text>
              <Text style={styles.claimProofText} numberOfLines={2}>
                "{claim.proofDescription}"
              </Text>

              {claim.reviewNote ? (
                <View style={styles.reviewNoteBox}>
                  <Text style={styles.reviewNoteTitle}>Security Officer Note:</Text>
                  <Text style={styles.reviewNoteText}>{claim.reviewNote}</Text>
                </View>
              ) : null}

              {claim.handoverLocation && (
                <View style={styles.handoverBox}>
                  <Ionicons name="calendar" size={16} color="#9333EA" />
                  <Text style={styles.handoverText}>
                    Collection scheduled at {claim.handoverLocation}
                  </Text>
                </View>
              )}

              <View style={styles.claimFooter}>
                <Text style={styles.claimDate}>
                  Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            loadingClaims ? (
              <LoadingSpinner message="Loading your claims..." />
            ) : (
              <EmptyState
                title="No Submitted Claims"
                description="When you identify an item belonging to you and claim it, track security review and handover schedules here."
                icon="shield-outline"
                actionTitle="Search Items"
                onAction={() => router.push('/(tabs)/search')}
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabButtonActive: {
    borderBottomColor: colors.primary
  },
  tabButtonText: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginLeft: 6
  },
  tabButtonTextActive: {
    color: colors.primary
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  claimItemTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  claimProofLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginTop: 4
  },
  claimProofText: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 8
  },
  reviewNoteBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8
  },
  reviewNoteTitle: {
    ...typography.captionBold,
    color: colors.warning,
    marginBottom: 2
  },
  reviewNoteText: {
    ...typography.caption,
    color: '#92400E'
  },
  handoverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: 8
  },
  handoverText: {
    ...typography.captionBold,
    color: '#9333EA',
    marginLeft: 6
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  claimDate: {
    ...typography.caption,
    color: colors.textMuted
  }
});
