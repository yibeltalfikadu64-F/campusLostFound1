import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { useAuth } from '../../src/features/auth/AuthContext';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { CustomButton } from '../../src/components/common/CustomButton';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ErrorState } from '../../src/components/common/ErrorState';
import { BASE_URL } from '../../src/api/client';

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isStaff } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: itemData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['item-details', id],
    queryFn: () => api.items.getById(id!)
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.items.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      Alert.alert('Item Removed', 'The item report has been removed.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not delete item');
    }
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to remove this item report from the campus directory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading item details..." />;
  }

  if (isError || !itemData?.data) {
    return (
      <ErrorState
        message={(error as any)?.message || 'Item could not be found'}
        onRetry={refetch}
      />
    );
  }

  const item = itemData.data;
  const isOwner = user?.id === item.reporterId;
  const canClaim = !isOwner && item.status === 'OPEN';
  const isFound = item.type === 'FOUND';

  const images: Array<{ imageUrl: string }> = item.images || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Image Gallery */}
      {images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.galleryContainer}
        >
          {images.map((img, idx) => {
            const resolvedUrl = img.imageUrl.startsWith('http')
              ? img.imageUrl
              : `${BASE_URL.replace('/api/v1', '')}${img.imageUrl}`;
            return (
              <Image
                key={idx}
                source={{ uri: resolvedUrl }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={isFound ? 'sparkles-outline' : 'help-circle-outline'}
            size={56}
            color={colors.textMuted}
          />
          <Text style={styles.noPhotoText}>No photo provided for this report</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Type & Status Header */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: item.type === 'LOST' ? colors.lostTag : colors.foundTag }
            ]}
          >
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {/* Location & Date */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.metaText}>
              Campus Location: <Text style={styles.metaVal}>{item.location?.name || 'General Campus'}</Text>
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.metaText}>
              Incident Date: <Text style={styles.metaVal}>{new Date(item.dateEvent).toLocaleDateString()}</Text>
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="pricetag" size={18} color={colors.primary} />
            <Text style={styles.metaText}>
              Category: <Text style={styles.metaVal}>{item.category?.name || 'General'}</Text>
            </Text>
          </View>
          {item.keptAt && (
            <View style={styles.metaRow}>
              <Ionicons name="shield" size={18} color={colors.secondary} />
              <Text style={styles.metaText}>
                Custody: <Text style={styles.metaVal}>{item.keptAt.replace(/_/g, ' ')}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>

        {/* Attributes: Brand & Color */}
        {(item.brand || item.color) && (
          <View style={styles.attributesRow}>
            {item.brand ? (
              <View style={styles.attrPill}>
                <Text style={styles.attrLabel}>Brand: </Text>
                <Text style={styles.attrVal}>{item.brand}</Text>
              </View>
            ) : null}
            {item.color ? (
              <View style={styles.attrPill}>
                <Text style={styles.attrLabel}>Color: </Text>
                <Text style={styles.attrVal}>{item.color}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Secret Verification Detail (Only shown if authorized) */}
        {item.hiddenDetail && (
          <View style={styles.secretBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="eye-off-outline" size={16} color={colors.primary} />
              <Text style={styles.secretHeading}>Hidden Verification Clue (Private to Staff/Reporter)</Text>
            </View>
            <Text style={styles.secretContent}>{item.hiddenDetail}</Text>
          </View>
        )}

        {/* Reporter info */}
        <View style={styles.reporterBox}>
          <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.reporterName}>
              Reported by {isOwner ? 'You' : item.reporter?.fullName || 'Campus Member'}
            </Text>
            <Text style={styles.reporterDept}>
              {item.reporter?.department || 'Injibara University'}
            </Text>
          </View>
        </View>

        {/* Primary Action: Claim Button */}
        {canClaim && (
          <CustomButton
            title="Claim This Item (Prove Ownership)"
            onPress={() => router.push(`/claims/new?itemId=${item.id}&title=${encodeURIComponent(item.title)}` as any)}
            variant="secondary"
            size="lg"
            style={styles.claimButton}
          />
        )}

        {/* Edit / Delete actions for owner or staff */}
        {(isOwner || isStaff) && (
          <View style={styles.ownerActions}>
            <CustomButton
              title="Remove Report"
              onPress={handleDelete}
              variant="outline"
              loading={deleteMutation.isPending}
              style={{ flex: 1 }}
              textStyle={{ color: colors.danger }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingBottom: spacing.xxl
  },
  galleryContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#E2E8F0'
  },
  galleryImage: {
    width: 380,
    height: 250
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  noPhotoText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8
  },
  content: {
    padding: spacing.md
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginRight: 8
  },
  typeText: {
    ...typography.captionBold,
    color: '#FFFFFF'
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 8
  },
  metaVal: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  section: {
    marginBottom: spacing.md
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 6
  },
  descriptionText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24
  },
  attributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md
  },
  attrPill: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: 8,
    marginBottom: 6
  },
  attrLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  attrVal: {
    ...typography.captionBold,
    color: colors.primary
  },
  secretBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: spacing.md
  },
  secretHeading: {
    ...typography.captionBold,
    color: colors.primary,
    marginLeft: 6
  },
  secretContent: {
    ...typography.body,
    color: '#1E3A8A',
    marginTop: 4
  },
  reporterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg
  },
  reporterName: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  reporterDept: {
    ...typography.caption,
    color: colors.textSecondary
  },
  claimButton: {
    marginBottom: spacing.md
  },
  ownerActions: {
    flexDirection: 'row',
    marginTop: spacing.sm
  }
});
