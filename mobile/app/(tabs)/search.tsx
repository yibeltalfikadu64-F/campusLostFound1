import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { api } from "../../src/api/endpoints";
import { ItemCard, ItemCardData } from "../../src/components/common/ItemCard";
import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { EmptyState } from "../../src/components/common/EmptyState";
import { ErrorState } from "../../src/components/common/ErrorState";

type ItemType = "ALL" | "LOST" | "FOUND";

export default function SearchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWideScreen = width >= 900;
  const isTablet = width >= 600;
  const horizontalPadding = isWideScreen ? 32 : isTablet ? 24 : 16;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.locations.list(),
  });

  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "search-items",
      debouncedSearch,
      selectedType,
      selectedCategory,
      selectedLocation,
      sortOrder,
    ],
    queryFn: () =>
      api.items.list({
        search: debouncedSearch.trim() || undefined,
        type: selectedType === "ALL" ? undefined : selectedType,
        categoryId: selectedCategory || undefined,
        locationId: selectedLocation || undefined,
        sortOrder,
        limit: 50,
      }),
  });

  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];
  const items: ItemCardData[] = itemsData?.data || [];
  const totalCount = itemsData?.meta?.total ?? items.length;

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    selectedType !== "ALL" ||
    selectedCategory !== null ||
    selectedLocation !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedType("ALL");
    setSelectedCategory(null);
    setSelectedLocation(null);
  };

  const renderFilterChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap,
  ) => (
    <TouchableOpacity
      key={label}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.filterChip, selected && styles.filterChipActive]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? "#FFFFFF" : colors.textSecondary}
        />
      ) : null}

      <Text
        style={[styles.filterChipText, selected && styles.filterChipTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.page}>
        {/* Page heading */}
        <View style={styles.pageHeader}>
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>CAMPUS COMMUNITY</Text>
            <Text style={styles.pageTitle}>Find your item</Text>
            <Text style={styles.pageSubtitle}>
              Search lost and found reports around campus.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="search" size={27} color={colors.primary} />
          </View>
        </View>

        {/* Search input */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color={colors.primary} />

            <TextInput
              style={styles.searchInput}
              placeholder="Search name, color, brand..."
              placeholderTextColor={colors.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
              accessibilityLabel="Search lost and found items"
            />

            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm("")}
                accessibilityLabel="Clear search text"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.sortButton}
            activeOpacity={0.75}
            onPress={() =>
              setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
            }
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortOrder === "desc" ? "oldest" : "newest"} first`}
          >
            <Ionicons
              name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
              size={21}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Lost / Found filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse reports</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {renderFilterChip(
              "All items",
              selectedType === "ALL",
              () => setSelectedType("ALL"),
              "apps-outline",
            )}

            {renderFilterChip(
              "Lost",
              selectedType === "LOST",
              () => setSelectedType("LOST"),
              "search-outline",
            )}

            {renderFilterChip(
              "Found",
              selectedType === "FOUND",
              () => setSelectedType("FOUND"),
              "checkmark-circle-outline",
            )}
          </ScrollView>
        </View>

        {/* Category filters */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {renderFilterChip(
                "All categories",
                selectedCategory === null,
                () => setSelectedCategory(null),
                "grid-outline",
              )}

              {categories.map((category: any) =>
                renderFilterChip(
                  category.name,
                  selectedCategory === category.id,
                  () =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id,
                    ),
                  "pricetag-outline",
                ),
              )}
            </ScrollView>
          </View>
        )}

        {/* Location filters */}
        {locations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campus locations</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {renderFilterChip(
                "All locations",
                selectedLocation === null,
                () => setSelectedLocation(null),
                "location-outline",
              )}

              {locations.map((location: any) =>
                renderFilterChip(
                  location.name,
                  selectedLocation === location.id,
                  () =>
                    setSelectedLocation(
                      selectedLocation === location.id ? null : location.id,
                    ),
                  "pin-outline",
                ),
              )}
            </ScrollView>
          </View>
        )}

        {/* Results heading */}
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Search results</Text>
            <Text style={styles.resultsSubtitle}>
              {isLoading
                ? "Looking for matching items..."
                : `${totalCount} ${totalCount === 1 ? "item" : "items"} found`}
            </Text>
          </View>

          <View style={styles.sortBadge}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.sortBadgeText}>
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Text>
          </View>
        </View>

        {/* Active filters */}
        {hasActiveFilters && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText}>Filters applied</Text>

            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.danger}
              />
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Item results */}
        <FlatList
          key={
            isWideScreen
              ? "three-columns"
              : isTablet
                ? "two-columns"
                : "one-column"
          }
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={isWideScreen ? 3 : isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <View
              style={
                isTablet
                  ? [styles.itemWrapper, isWideScreen && styles.wideItemWrapper]
                  : undefined
              }
            >
              <ItemCard
                item={item}
                onPress={() => router.push(`/items/${item.id}` as any)}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: horizontalPadding },
            items.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.stateContainer}>
                <LoadingSpinner message="Searching campus inventory..." />
              </View>
            ) : isError ? (
              <View style={styles.stateContainer}>
                <ErrorState
                  message={(error as any)?.message || "Search failed"}
                  onRetry={() => refetch()}
                />
              </View>
            ) : (
              <View style={styles.stateContainer}>
                <EmptyState
                  title="No matching items"
                  description="Try another keyword or adjust your filters to find what you are looking for."
                  icon="search-outline"
                  actionTitle={
                    hasActiveFilters ? "Clear all filters" : undefined
                  }
                  onAction={clearFilters}
                />
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  pageHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  eyebrow: {
    ...typography.captionBold,
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 21,
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E6ECF8",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 10,
    outlineStyle: "none",
  } as any,
  sortButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginBottom: 10,
    paddingHorizontal: spacing.md,
    fontSize: 13,
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.captionBold,
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF5",
    marginTop: 2,
  },
  resultsTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  resultsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sortBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6ECF8",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sortBadgeText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  activeFilters: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  activeFiltersText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
  },
  clearButtonText: {
    ...typography.captionBold,
    color: colors.danger,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 36,
    flexGrow: 1,
  },
  columnWrapper: {
    gap: 16,
    alignItems: "flex-start",
  },
  itemWrapper: {
    flex: 1,
    minWidth: 0,
    marginBottom: 16,
  },
  wideItemWrapper: {
    flexBasis: "31%",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  stateContainer: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
});
