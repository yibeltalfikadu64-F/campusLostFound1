import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { ItemCard, ItemCardData } from '../../src/components/common/ItemCard';
import { CategoryChip } from '../../src/components/common/CategoryChip';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ErrorState } from '../../src/components/common/ErrorState';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch recent categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list()
  });

  // Fetch items feed
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['items', selectedCategory],
    queryFn: () =>
      api.items.list({
        limit: 20,
        categoryId: selectedCategory || undefined
      })
  });

  // Fetch quick stats
  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.items.list({ limit: 1 }),
    staleTime: 60000
  });

  const categories = categoriesData?.data || [];
  const items: ItemCardData[] = itemsData?.data || [];
  const totalCount = statsData?.meta?.total || items.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
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
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Top Welcome Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  Hello, {user?.fullName?.split(' ')[0] || 'Student'} 👋
                </Text>
                <Text style={styles.uniTag}>Injibara University Campus</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={styles.avatarButton}
              >
                <Ionicons name="person-circle" size={40} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick Search Shortcut Bar */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/search')}
              style={styles.searchBar}
            >
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.searchPlaceholder}>{t.common.search}</Text>
              <Ionicons name="options-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Quick Action & Stats Banner */}
            <View style={styles.statsBanner}>
              <View style={styles.statsCol}>
                <Text style={styles.statsNumber}>{totalCount}</Text>
                <Text style={styles.statsLabel}>Total Reports</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsActions}>
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: colors.lostTagBg }]}
                  onPress={() => router.push('/(tabs)/report')}
                >
                  <Ionicons name="help-buoy-outline" size={16} color={colors.lostTag} />
                  <Text style={[styles.quickButtonText, { color: colors.lostTag }]}>Report Lost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: colors.foundTagBg }]}
                  onPress={() => router.push('/(tabs)/report')}
                >
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.foundTag} />
                  <Text style={[styles.quickButtonText, { color: colors.foundTag }]}>Report Found</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category horizontal pills */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>{t.items.categories}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                <CategoryChip
                  label={t.common.all}
                  isSelected={selectedCategory === null}
                  onPress={() => setSelectedCategory(null)}
                />
                {categories.map((cat: any) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.name}
                    iconName={cat.icon}
                    isSelected={selectedCategory === cat.id}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Recent Items Title */}
            <View style={styles.feedHeaderRow}>
              <Text style={styles.sectionTitle}>{t.items.recentItems}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={styles.seeAllText}>{t.common.seeAll}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner message="Fetching campus lost & found feed..." />
          ) : isError ? (
            <ErrorState
              message={(error as any)?.message || 'Could not connect to the campus server'}
              onRetry={refetch}
            />
          ) : (
            <EmptyState
              title="No Items Reported Yet"
              description="Be the first to report a lost or found item across Injibara University campus."
              icon="cube-outline"
              actionTitle="Report an Item"
              onAction={() => router.push('/(tabs)/report')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md
  },
  greeting: {
    ...typography.h2,
    color: colors.primary
  },
  uniTag: {
    ...typography.captionBold,
    color: colors.secondary,
    letterSpacing: 0.5
  },
  avatarButton: {
    padding: 2
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
    marginLeft: 10
  },
  statsBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  statsCol: {
    alignItems: 'center',
    paddingHorizontal: spacing.md
  },
  statsNumber: {
    ...typography.h2,
    color: colors.primary
  },
  statsLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  statsDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm
  },
  statsActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md
  },
  quickButtonText: {
    ...typography.captionBold,
    marginLeft: 4
  },
  categorySection: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  categoryScroll: {
    paddingRight: spacing.md
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  seeAllText: {
    ...typography.captionBold,
    color: colors.secondary
  }
});
