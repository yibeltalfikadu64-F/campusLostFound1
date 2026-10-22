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
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { api } from '../../../src/api/endpoints';
import { FormInput } from '../../../src/components/common/FormInput';
import { CustomButton } from '../../../src/components/common/CustomButton';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';

export default function AdminLocationsScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const {
    data: locationsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => api.locations.list({ includeInactive: true })
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.locations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setModalVisible(false);
      setName('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      Alert.alert('Success', 'Campus location added.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not create location');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.locations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      Alert.alert('Location Removed', 'Location removed or deactivated.');
    }
  });

  const locations = locationsData?.data || [];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.headerTitle}>{locations.length} Campus Locations</Text>
        <CustomButton
          title="+ Add Location"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={22} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.locName}>{item.name}</Text>
              <Text style={styles.locDesc}>{item.description || 'No description'}</Text>
              {item.latitude && item.longitude ? (
                <Text style={styles.coords}>
                  GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              ) : null}
              <Text style={styles.itemCount}>{item._count?.items || 0} incidents reported</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Remove Location',
                  `Remove location "${item.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }
                  ]
                )
              }
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
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
          isLoading ? <LoadingSpinner message="Loading campus locations..." /> : null
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
            <Text style={styles.modalTitle}>Add Campus Location</Text>
            <FormInput
              label="Location Name *"
              placeholder="e.g. Postgraduate Library Block"
              value={name}
              onChangeText={setName}
            />
            <FormInput
              label="Description"
              placeholder="e.g. Near West Gate pathway"
              value={description}
              onChangeText={setDescription}
            />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <FormInput
                  label="Latitude (Optional)"
                  placeholder="10.9782"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <FormInput
                  label="Longitude (Optional)"
                  placeholder="36.9281"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title="Save Location"
                onPress={() => {
                  if (!name.trim()) return Alert.alert('Required', 'Name is required');
                  createMutation.mutate({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    latitude: latitude ? parseFloat(latitude) : undefined,
                    longitude: longitude ? parseFloat(longitude) : undefined
                  });
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
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  cardContent: {
    flex: 1
  },
  locName: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  locDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  coords: {
    ...typography.caption,
    color: colors.primary,
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
