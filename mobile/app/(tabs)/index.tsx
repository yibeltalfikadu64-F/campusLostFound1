import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../src/theme";
import { api } from "../../src/api/endpoints";
import { useAuth } from "../../src/features/auth/AuthContext";
import { useI18n } from "../../src/i18n";
import { ItemCard, ItemCardData } from "../../src/components/common/ItemCard";
import { CategoryChip } from "../../src/components/common/CategoryChip";
import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { EmptyState } from "../../src/components/common/EmptyState";
import { ErrorState } from "../../src/components/common/ErrorState";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isWideScreen = width >= 900;
  const isTablet = width >= 600 && width < 900;
  const horizontalPadding = width >= 900 ? 36 : width >= 600 ? 24 : 16;

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["items", selectedCategory],
    queryFn: () =>
      api.items.list({
        limit: 20,
        categoryId: selectedCategory || undefined,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => api.items.list({ limit: 1 }),
    staleTime: 60000,
  });

  const categories = categoriesData?.data || [];
  const items: ItemCardData[] = itemsData?.data || [];
  const totalCount =
    statsData?.meta?.total ?? itemsData?.meta?.total ?? items.length;

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Student";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        key={isWideScreen ? "wide" : isTablet ? "tablet" : "mobile"}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.itemWrapper,
              isWideScreen && styles.itemWrapperWide,
              isTablet && styles.itemWrapperTablet,
            ]}
          >
            <ItemCard
              item={item}
              onPress={() => router.push(`/items/${item.id}` as any)}
            />
          </View>
        )}
        numColumns={isWideScreen ? 3 : isTablet ? 2 : 1}
        columnWrapperStyle={width >= 600 ? styles.itemRow : undefined}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={[styles.content, isWideScreen && styles.contentWide]}>
            {/* Welcome header */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <Ionicons name="school-outline" size={25} color="#FFFFFF" />
                </View>

                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandName}>Injibara University</Text>
                  <Text style={styles.brandSubtitle}>CAMPUS LOST & FOUND</Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.avatarButton}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={38}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Welcome banner */}
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <View style={styles.heroEyebrow}>
                  <Ionicons name="heart-outline" size={14} color="#D7E9FF" />
                  <Text style={styles.heroEyebrowText}>
                    OUR CAMPUS, OUR COMMUNITY
                  </Text>
                </View>

                <Text style={styles.heroTitle}>Hello, {firstName}! 👋</Text>

                <Text style={styles.heroDescription}>
                  Lost something or found an item? Let’s help it find its way
                  home.
                </Text>

                <View style={styles.heroActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => router.push("/(tabs)/report")}
                    style={styles.heroPrimaryButton}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={19}
                      color={colors.primary}
                    />
                    <Text style={styles.heroPrimaryText}>Report an item</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => router.push("/(tabs)/search")}
                    style={styles.heroSecondaryButton}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.heroSecondaryText}>Browse items</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.heroIllustration}>
                <View style={styles.heroCircle}>
                  <Ionicons name="search-outline" size={48} color="#FFFFFF" />
                  <View style={styles.heroCheck}>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Search shortcut */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Search lost and found items"
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/search")}
              style={styles.searchBar}
            >
              <Ionicons
                name="search-outline"
                size={21}
                color={colors.textSecondary}
              />
              <Text style={styles.searchPlaceholder}>
                Search phones, bags, keys...
              </Text>
              <View style={styles.filterIcon}>
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            {/* Statistics */}
            <View style={styles.statsSection}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionTitle}>Campus overview</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>Community</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#EAF1FF" }]}
                  >
                    <Ionicons
                      name="documents-outline"
                      size={21}
                      color="#2859B8"
                    />
                  </View>
                  <Text style={styles.statNumber}>{totalCount}</Text>
                  <Text style={styles.statLabel}>Total reports</Text>
                </View>

                <View style={styles.statCard}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#FFF0E9" }]}
                  >
                    <Ionicons name="search-outline" size={21} color="#C45B2C" />
                  </View>
                  <Text style={styles.statActionTitle}>Lost something?</Text>
                  <Text style={styles.statActionDescription}>
                    Report it to campus
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/report")}
                    style={styles.statActionLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statActionLinkText}>Report lost</Text>
                    <Ionicons name="arrow-forward" size={14} color="#C45B2C" />
                  </TouchableOpacity>
                </View>

                <View style={styles.statCard}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#E4F8EE" }]}
                  >
                    <Ionicons
                      name="hand-left-outline"
                      size={21}
                      color="#168455"
                    />
                  </View>
                  <Text style={styles.statActionTitle}>Found something?</Text>
                  <Text style={styles.statActionDescription}>
                    Help reunite its owner
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/report")}
                    style={styles.statActionLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.foundActionText}>Report found</Text>
                    <Ionicons name="arrow-forward" size={14} color="#168455" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.categorySection}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionTitle}>{t.items.categories}</Text>
                <Ionicons
                  name="grid-outline"
                  size={19}
                  color={colors.textSecondary}
                />
              </View>

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
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === cat.id ? null : cat.id,
                      )
                    }
                  />
                ))}
              </ScrollView>
            </View>

            {/* Recent items */}
            <View style={styles.feedHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{t.items.recentItems}</Text>
                <Text style={styles.feedSubtitle}>
                  The latest items reported on campus
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/search")}
                style={styles.seeAllButton}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>{t.common.seeAll}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner message="Loading campus items..." />
          ) : isError ? (
            <ErrorState
              message={
                (error as any)?.message ||
                "Could not connect to the campus server."
              }
              onRetry={refetch}
            />
          ) : (
            <EmptyState
              title="No Items Reported Yet"
              description="Be the first to report a lost or found item across Injibara University campus."
              icon="cube-outline"
              actionTitle="Report an Item"
              onAction={() => router.push("/(tabs)/report")}
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
    backgroundColor: "#F5F7FC",
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 36,
  },
  content: {
    width: "100%",
    alignSelf: "center",
  },
  contentWide: {
    maxWidth: 1400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTextContainer: {
    flexShrink: 1,
  },
  brandName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172B4D",
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: colors.secondary,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  hero: {
    backgroundColor: "#173D79",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    ...shadows.md,
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  heroEyebrowText: {
    color: "#D7E9FF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#E1EBFC",
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 460,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPrimaryButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  heroPrimaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#173D79",
  },
  heroSecondaryButton: {
    minHeight: 42,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroSecondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroIllustration: {
    width: 105,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  heroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#315B96",
    borderWidth: 1,
    borderColor: "#6F90C0",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCheck: {
    position: "absolute",
    right: -1,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#B9F3D4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#173D79",
  },
  searchBar: {
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E8F1",
    borderRadius: 15,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    gap: 11,
    ...shadows.sm,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#8995A8",
    fontSize: 13,
  },
  filterIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EDF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statsSection: {
    marginBottom: 27,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#172B4D",
    letterSpacing: -0.4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E6F7EE",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#168455",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#168455",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 145,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    borderRadius: 18,
    padding: 15,
    minHeight: 150,
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: "#172B4D",
  },
  statLabel: {
    fontSize: 11,
    color: "#738097",
    marginTop: 3,
  },
  statActionTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#263852",
  },
  statActionDescription: {
    fontSize: 10,
    lineHeight: 15,
    color: "#738097",
    marginTop: 3,
  },
  statActionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },
  statActionLinkText: {
    color: "#C45B2C",
    fontSize: 11,
    fontWeight: "800",
  },
  foundActionText: {
    color: "#168455",
    fontSize: 11,
    fontWeight: "800",
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryScroll: {
    paddingRight: 8,
    gap: 8,
  },
  feedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  feedSubtitle: {
    color: "#8290A4",
    fontSize: 11,
    marginTop: 5,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  itemRow: {
    alignItems: "stretch",
    gap: 14,
  },
  itemWrapper: {
    width: "100%",
    marginBottom: 14,
  },
  itemWrapperTablet: {
    flex: 1,
    minWidth: 0,
  },
  itemWrapperWide: {
    flex: 1,
    minWidth: 0,
  },
});
