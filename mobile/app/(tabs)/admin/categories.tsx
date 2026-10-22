import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { api } from '../../../src/api/endpoints';
import { FormInput } from '../../../src/components/common/FormInput';
import { CustomButton } from '../../../src/components/common/CustomButton';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';

export default function AdminCategoriesScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('cube-outline');

  const {
    data: categoriesData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.categories.list({ includeInactive: true })
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalVisible(false);
      setName('');
      setDescription('');
      Alert.alert('Created', 'New category created successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not create category');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Alert.alert('Category Deleted', 'Category removed or deactivated.');
    }
  });

  const categories = categoriesData?.data || [];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.headerTitle}>{categories.length} Categories</Text>
        <CustomButton
          title="+ Add Category"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={(item.icon || 'cube-outline') as any} size={22} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.catName}>{item.name}</Text>
              <Text style={styles.catDesc}>{item.description || 'No description'}</Text>
              <Text style={styles.itemCount}>{item._count?.items || 0} items reported</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Delete Category',
                  `Remove or deactivate category "${item.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }
                  ]
                )
              }
              style={styles.deleteBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
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
          isLoading ? <LoadingSpinner message="Loading categories..." /> : null
        }
      />

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <FormInput
              label="Category Name *"
              placeholder="e.g. Laptops & Tablets"
              value={name}
              onChangeText={setName}
            />
            <FormInput
              label="Description"
              placeholder="e.g. All computing and tablet hardware"
              value={description}
              onChangeText={setDescription}
            />
            <FormInput
              label="Icon (MaterialCommunityIcons name)"
              placeholder="e.g. laptop-outline"
              value={icon}
              onChangeText={setIcon}
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title="Create"
                onPress={() => {
                  if (!name.trim()) return Alert.alert('Required', 'Name is required');
                  createMutation.mutate({ name: name.trim(), description: description.trim() || undefined, icon });
                }}
                variant="primary"
                loading={createMutation.isPending}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    ...typography.h3,
    color: colors.primary
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  cardContent: {
    flex: 1
  },
  catName: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  catDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemCount: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: 2
  },
  deleteBtn: {
    padding: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.md
  }
});
