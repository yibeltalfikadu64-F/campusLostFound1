import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { ItemCard, ItemCardData } from '../../src/components/common/ItemCard';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ErrorState } from '../../src/components/common/ErrorState';

export default function SearchScreen() {
  const router = useRouter();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 400ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch categories & locations
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list()
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.list()
  });

  // Query filtered items
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'search-items',
      debouncedSearch,
      selectedType,
      selectedCategory,
      selectedLocation,
      sortOrder
    ],
    queryFn: () =>
      api.items.list({
        search: debouncedSearch.trim() || undefined,
        type: selectedType === 'ALL' ? undefined : selectedType,
        categoryId: selectedCategory || undefined,
        locationId: selectedLocation || undefined,
        sortOrder,
        limit: 50
      })
  });

  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];
  const items: ItemCardData[] = itemsData?.data || [];
  const totalCount = itemsData?.meta?.total || items.length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedType('ALL');
    setSelectedCategory(null);
    setSelectedLocation(null);
  };

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    selectedType !== 'ALL' ||
    selectedCategory !== null ||
    selectedLocation !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar Input */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search keywords, color, brand..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <Ionicons
            name={sortOrder === 'desc' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Scroll */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Type Selector (ALL / LOST / FOUND) */}
          {(['ALL', 'LOST', 'FOUND'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipSelected
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === type && styles.filterChipTextSelected
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Location Selector Chips */}
          {locations.slice(0, 6).map((loc: any) => (
            <TouchableOpacity
              key={loc.id}
              onPress={() => setSelectedLocation(selectedLocation === loc.id ? null : loc.id)}
              style={[
                styles.filterChip,
                selectedLocation === loc.id && styles.filterChipSelected
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedLocation === loc.id && styles.filterChipTextSelected
                ]}
              >
                📍 {loc.name}
              </Text>
            </TouchableOpacity>
          ))}

          {hasActiveFilters && (
            <TouchableOpacity onPress={handleClearFilters} style={styles.clearChip}>
              <Ionicons name="close-outline" size={14} color={colors.danger} />
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results Count Bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          {totalCount} {totalCount === 1 ? 'item found' : 'items found'}
        </Text>
        <Text style={styles.sortIndicator}>
          Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </Text>
      </View>

      {/* Items List */}
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
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner message="Searching campus inventory..." />
          ) : isError ? (
            <ErrorState
              message={(error as any)?.message || 'Search failed'}
              onRetry={refetch}
            />
          ) : (
            <EmptyState
              title="No Matching Reports Found"
              description="Try adjusting your keywords or clearing selected campus location and category filters."
              icon="search-outline"
              actionTitle={hasActiveFilters ? 'Clear All Filters' : undefined}
              onAction={handleClearFilters}
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 44
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 8
  },
  sortButton: {
    padding: 10,
    marginLeft: 6
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8
  },
  filterScroll: {
    paddingHorizontal: spacing.md
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    ...typography.captionBold,
    color: colors.textPrimary
  },
  filterChipTextSelected: {
    color: '#FFFFFF'
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  clearChipText: {
    ...typography.captionBold,
    color: colors.danger,
    marginLeft: 4
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  resultsCount: {
    ...typography.captionBold,
    color: colors.textSecondary
  },
  sortIndicator: {
    ...typography.caption,
    color: colors.textMuted
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl
  }
});
