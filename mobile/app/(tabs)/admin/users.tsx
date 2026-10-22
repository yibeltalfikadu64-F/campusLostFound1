import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { api } from '../../../src/api/endpoints';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../../src/components/common/EmptyState';

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const {
    data: usersData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.admin.listUsers({ search: search.trim() || undefined })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.admin.updateUserStatus(userId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Status Updated', 'User account status has been updated.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not update user');
    }
  });

  const users = usersData?.data || [];

  const handleToggle = (userItem: any) => {
    const action = userItem.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `Confirm ${action.toUpperCase()}`,
      `Are you sure you want to ${action} account for ${userItem.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.toUpperCase(),
          style: userItem.isActive ? 'destructive' : 'default',
          onPress: () => toggleStatusMutation.mutate({ userId: userItem.id, isActive: !userItem.isActive })
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, ID or email..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item: u }) => (
          <View style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInitials}>
                <Text style={styles.initialsText}>{u.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{u.fullName}</Text>
                <Text style={styles.userSubtitle}>
                  {u.universityId || 'No ID'} • {u.department || 'Injibara Univ'}
                </Text>
                <Text style={styles.userContact}>{u.phone} • {u.email || 'No email'}</Text>
              </View>
              <View style={[styles.roleBadge, u.role === 'ADMIN' && styles.roleAdmin]}>
                <Text style={styles.roleText}>{u.role}</Text>
              </View>
            </View>

            <View style={styles.userFooter}>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Reports: <Text style={styles.statVal}>{u._count?.items || 0}</Text></Text>
                <Text style={styles.statLabel}>Claims: <Text style={styles.statVal}>{u._count?.claims || 0}</Text></Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  u.isActive ? styles.btnDeactivate : styles.btnActivate
                ]}
                onPress={() => handleToggle(u)}
              >
                <Text style={[styles.toggleText, u.isActive ? styles.textDeactivate : styles.textActivate]}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            <LoadingSpinner message="Loading campus users..." />
          ) : (
            <EmptyState
              title="No Users Found"
              description="No registered students or staff matching your query."
              icon="people-outline"
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 8
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  initialsText: {
    ...typography.h3,
    color: colors.primary
  },
  userMeta: {
    flex: 1
  },
  userName: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  userSubtitle: {
    ...typography.caption,
    color: colors.textSecondary
  },
  userContact: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full
  },
  roleAdmin: {
    backgroundColor: '#FEF3C7'
  },
  roleText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.textPrimary
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  statsRow: {
    flexDirection: 'row'
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: 12
  },
  statVal: {
    ...typography.captionBold,
    color: colors.textPrimary
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm
  },
  btnDeactivate: {
    backgroundColor: colors.dangerBg
  },
  btnActivate: {
    backgroundColor: colors.successBg
  },
  toggleText: {
    ...typography.captionBold,
    fontSize: 11
  },
  textDeactivate: {
    color: colors.danger
  },
  textActivate: {
    color: colors.success
  }
});
