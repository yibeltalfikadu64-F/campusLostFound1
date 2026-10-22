import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list()
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleNotificationPress = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.relatedItemId) {
      router.push(`/items/${notif.relatedItemId}` as any);
    }
  };

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'CLAIM_APPROVED':
        return { name: 'checkmark-circle', color: colors.success };
      case 'CLAIM_REJECTED':
        return { name: 'close-circle', color: colors.danger };
      case 'HANDOVER_SCHEDULED':
        return { name: 'calendar', color: '#9333EA' };
      case 'MATCH_FOUND':
        return { name: 'sparkles', color: colors.accent };
      case 'CLAIM_SUBMITTED':
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadHeader}>
            {unreadCount > 0 ? `${unreadCount} Unread Alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const iconConfig = getIconConfig(item.type);
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              activeOpacity={0.8}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
              </View>

              <View style={styles.notifContent}>
                <View style={styles.notifRow}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody}>{item.body}</Text>
                <Text style={styles.notifTime}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingSpinner message="Loading alerts..." />
          ) : (
            <EmptyState
              title="No Notifications Yet"
              description="You will receive alerts here when claims are submitted, reviewed, or potential matches are discovered on campus."
              icon="notifications-outline"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  unreadHeader: {
    ...typography.captionBold,
    color: colors.textSecondary
  },
  markAllText: {
    ...typography.captionBold,
    color: colors.secondary
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  notifCardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD'
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  notifContent: {
    flex: 1
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  notifTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    flex: 1
  },
  notifTitleUnread: {
    color: colors.primary
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginLeft: 6
  },
  notifBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6
  },
  notifTime: {
    ...typography.caption,
    color: colors.textMuted
  }
});
