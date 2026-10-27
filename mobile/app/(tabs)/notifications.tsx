
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedItemId?: string | null;
  createdAt: string;
};

type NotificationTheme = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  primary: string;
  unreadBackground: string;
  unreadBorder: string;
  iconBackground: string;
  headerBackground: string;
  success: string;
  danger: string;
  purple: string;
  accent: string;
  dot: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();

  const isTablet = width >= 700;
  const isWideScreen = width >= 1100;

  const theme: NotificationTheme = {
    background: isDark ? '#0B1120' : '#F4F7FB',
    card: isDark ? '#151F32' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#172033',
    secondaryText: isDark ? '#A5B4CC' : '#64748B',
    mutedText: isDark ? '#8492A8' : '#94A3B8',
    border: isDark ? '#2A3850' : '#E2E8F0',
    primary: isDark ? '#8BB4FF' : colors.primary,
    unreadBackground: isDark ? '#182A40' : '#EFF7FF',
    unreadBorder: isDark ? '#345477' : '#C7E3FF',
    iconBackground: isDark ? '#223149' : '#F1F5F9',
    headerBackground: isDark ? '#111B2D' : '#FFFFFF',
    success: isDark ? '#4ADE80' : colors.success,
    danger: isDark ? '#FB7185' : colors.danger,
    purple: isDark ? '#C4A0FF' : '#9333EA',
    accent: isDark ? '#FBBF24' : colors.accent,
    dot: isDark ? '#8BB4FF' : colors.secondary,
  };

  const styles = createStyles(theme, isTablet);

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: NotificationItem[] = notificationsData?.data || [];

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    if (notification.relatedItemId) {
      router.push(`/items/${notification.relatedItemId}` as any);
    }
  };

  const getIconConfig = (
    type: string,
  ): {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    background: string;
  } => {
    switch (type) {
      case 'CLAIM_APPROVED':
        return {
          name: 'checkmark-circle',
          color: theme.success,
          background: isDark ? '#173A30' : '#DCFCE7',
        };

      case 'CLAIM_REJECTED':
        return {
          name: 'close-circle',
          color: theme.danger,
          background: isDark ? '#40202B' : '#FEE2E2',
        };

      case 'HANDOVER_SCHEDULED':
        return {
          name: 'calendar',
          color: theme.purple,
          background: isDark ? '#302344' : '#F3E8FF',
        };

      case 'MATCH_FOUND':
        return {
          name: 'sparkles',
          color: theme.accent,
          background: isDark ? '#3B3220' : '#FEF3C7',
        };

      case 'CLAIM_SUBMITTED':
        return {
          name: 'document-text',
          color: theme.primary,
          background: isDark ? '#203452' : '#DBEAFE',
        };

      default:
        return {
          name: 'notifications',
          color: theme.primary,
          background: theme.iconBackground,
        };
    }
  };

  const formatNotificationDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNotification = ({
    item,
  }: {
    item: NotificationItem;
  }) => {
    const iconConfig = getIconConfig(item.type);

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.isRead ? 'Read' : 'Unread'}`}
        accessibilityHint={
          item.relatedItemId
            ? 'Opens the related item'
            : 'Marks the notification as read'
        }
        activeOpacity={0.75}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notificationCard,
          !item.isRead && styles.notificationCardUnread,
        ]}
      >
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: iconConfig.background },
          ]}
        >
          <Ionicons
            name={iconConfig.name}
            size={24}
            color={iconConfig.color}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text
              style={[
                styles.notificationTitle,
                !item.isRead && styles.notificationTitleUnread,
              ]}
            >
              {item.title}
            </Text>

            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notificationBody}>{item.body}</Text>

          <View style={styles.notificationFooter}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.mutedText}
            />
            <Text style={styles.notificationTime}>
              {formatNotificationDate(item.createdAt)}
            </Text>

            {item.relatedItemId ? (
              <View style={styles.viewItemHint}>
                <Text style={styles.viewItemText}>View item</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={theme.primary}
                />
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.listHeaderLeft}>
        <Text style={styles.listHeaderTitle}>Recent activity</Text>
        <Text style={styles.listHeaderSubtitle}>
          {notifications.length}{' '}
          {notifications.length === 1 ? 'notification' : 'notifications'}
        </Text>
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <View style={styles.unreadBadgeDot} />
          <Text style={styles.unreadBadgeText}>
            {unreadCount} unread
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <LoadingSpinner message="Loading notifications..." />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={34}
              color={theme.danger}
            />
          </View>
          <Text style={styles.stateTitle}>Couldn't load notifications</Text>
          <Text style={styles.stateDescription}>
            {(error as Error)?.message ||
              'Check your connection and try again.'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <EmptyState
          title="No Notifications Yet"
          description="You will receive alerts here when claims are submitted, reviewed, or potential matches are discovered on campus."
          icon="notifications-outline"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderInner}>
          <View style={styles.pageHeaderTop}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.eyebrow}>CAMPUS UPDATES</Text>
              <Text style={styles.pageTitle}>Notifications</Text>
              <Text style={styles.pageSubtitle}>
                Stay up to date with your lost and found activity.
              </Text>
            </View>

            <View style={styles.pageHeaderIcon}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color={theme.primary}
              />
              {unreadCount > 0 && (
                <View style={styles.headerCountBadge}>
                  <Text style={styles.headerCountText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name={
                  unreadCount > 0
                    ? 'mail-unread-outline'
                    : 'checkmark-done-circle-outline'
                }
                size={23}
                color={theme.primary}
              />
            </View>

            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryTitle}>
                {unreadCount > 0 ? 'You have unread updates' : "You're all caught up"}
              </Text>
              <Text style={styles.summarySubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} ${
                      unreadCount === 1 ? 'notification needs' : 'notifications need'
                    } your attention.`
                  : 'You have no unread notifications right now.'}
              </Text>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.75}
                disabled={markAllReadMutation.isPending}
                onPress={() => markAllReadMutation.mutate()}
                style={[
                  styles.markAllButton,
                  markAllReadMutation.isPending && styles.disabledButton,
                ]}
              >
                <Text style={styles.markAllButtonText}>
                  {markAllReadMutation.isPending ? 'Saving...' : 'Read all'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Notification list */}
      <FlatList
        key={isWideScreen ? 'wide' : isTablet ? 'tablet' : 'mobile'}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListHeaderComponent={
          notifications.length > 0 ? renderListHeader : null
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.card}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </View>
  );
}

function createStyles(theme: NotificationTheme, isTablet: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    pageHeader: {
      backgroundColor: theme.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    pageHeaderInner: {
      width: '100%',
      maxWidth: 1000,
      alignSelf: 'center',
      paddingHorizontal: isTablet ? 28 : spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },

    pageHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
      gap: spacing.md,
    },

    pageHeaderText: {
      flex: 1,
      minWidth: 0,
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
      fontSize: isTablet ? 32 : 28,
    },

    pageSubtitle: {
      ...typography.body,
      color: theme.secondaryText,
      marginTop: 5,
      lineHeight: 21,
    },

    pageHeaderIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: theme.iconBackground,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    headerCountBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 21,
      height: 21,
      borderRadius: 11,
      paddingHorizontal: 5,
      backgroundColor: theme.danger,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.headerBackground,
    },

    headerCountText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: spacing.md,
      borderRadius: 18,
      backgroundColor: theme.unreadBackground,
      borderWidth: 1,
      borderColor: theme.unreadBorder,
    },

    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryTextContainer: {
      flex: 1,
      minWidth: 0,
    },

    summaryTitle: {
      ...typography.bodyBold,
      color: theme.text,
    },

    summarySubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 4,
      lineHeight: 18,
    },

    markAllButton: {
      backgroundColor: theme.primary,
      borderRadius: 11,
      paddingHorizontal: 13,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    markAllButtonText: {
      ...typography.captionBold,
      color: '#FFFFFF',
    },

    disabledButton: {
      opacity: 0.55,
    },

    listContent: {
      width: '100%',
      maxWidth: 1000,
      alignSelf: 'center',
      paddingHorizontal: isTablet ? 28 : spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
    },

    listContentEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
    },

    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },

    listHeaderLeft: {
      flex: 1,
    },

    listHeaderTitle: {
      ...typography.h3,
      color: theme.text,
    },

    listHeaderSubtitle: {
      ...typography.caption,
      color: theme.secondaryText,
      marginTop: 3,
    },

    unreadBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      paddingHorizontal: 11,
      paddingVertical: 7,
      backgroundColor: theme.unreadBackground,
      borderWidth: 1,
      borderColor: theme.unreadBorder,
    },

    unreadBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.dot,
    },

    unreadBadgeText: {
      ...typography.captionBold,
      color: theme.primary,
    },

    itemSeparator: {
      height: 10,
    },

    notificationCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: theme.card,
      borderRadius: 17,
      padding: isTablet ? 20 : spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.035)' }
        : {
            elevation: 1,
          }),
    },

    notificationCardUnread: {
      backgroundColor: theme.unreadBackground,
      borderColor: theme.unreadBorder,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },

    notificationIcon: {
      width: isTablet ? 52 : 46,
      height: isTablet ? 52 : 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    notificationContent: {
      flex: 1,
      minWidth: 0,
    },

    notificationTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6,
    },

    notificationTitle: {
      ...typography.bodyBold,
      color: theme.text,
      flex: 1,
      flexShrink: 1,
    },

    notificationTitleUnread: {
      color: theme.primary,
    },

    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.dot,
      marginTop: 5,
      flexShrink: 0,
    },

    notificationBody: {
      ...typography.body,
      color: theme.secondaryText,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 10,
    },

    notificationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },

    notificationTime: {
      ...typography.caption,
      color: theme.mutedText,
      flexShrink: 1,
    },

    viewItemHint: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      gap: 2,
      paddingLeft: 8,
    },

    viewItemText: {
      ...typography.captionBold,
      color: theme.primary,
    },

    stateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      paddingHorizontal: spacing.md,
    },

    stateIcon: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },

    stateTitle: {
      ...typography.h3,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },

    stateDescription: {
      ...typography.body,
      color: theme.secondaryText,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 400,
    },

    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
      marginTop: spacing.lg,
    },

    retryButtonText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
    },

    emptyStateContainer: {
      paddingVertical: spacing.lg,
    },
  });
}
