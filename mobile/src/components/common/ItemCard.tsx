import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, typography, spacing } from '../../theme';
import { StatusBadge } from './StatusBadge';
import { BASE_URL } from '../../api/client';

export interface ItemCardData {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  description: string;
  status: string;
  dateEvent: string;
  createdAt: string;
  category?: { name: string; icon?: string };
  location?: { name: string };
  images?: Array<{ imageUrl: string }>;
  _count?: { claims: number };
}

interface ItemCardProps {
  item: ItemCardData;
  onPress: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress }) => {
  const isLost = item.type === 'LOST';
  const rawImage = item.images && item.images.length > 0 ? item.images[0].imageUrl : null;
  // Resolve relative URLs to host server URL
  const imageUrl = rawImage
    ? rawImage.startsWith('http')
      ? rawImage
      : `${BASE_URL.replace('/api/v1', '')}${rawImage}`
    : null;

  const formattedDate = new Date(item.dateEvent).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name={isLost ? 'help-circle-outline' : 'sparkles-outline'}
              size={36}
              color={colors.textMuted}
            />
          </View>
        )}
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isLost ? colors.lostTag : colors.foundTag }
          ]}
        >
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category?.name || 'General'}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location?.name || 'Campus'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        </View>

        {item._count?.claims !== undefined && item._count.claims > 0 && (
          <View style={styles.claimsRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.secondary} />
            <Text style={styles.claimsText}>
              {item._count.claims} {item._count.claims === 1 ? 'claim' : 'claims'} submitted
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#F1F5F9',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0'
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm
  },
  typeText: {
    ...typography.captionBold,
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.5
  },
  content: {
    padding: spacing.md
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  categoryText: {
    ...typography.captionBold,
    color: colors.primary,
    flex: 1,
    marginRight: 8
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 8
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%'
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4
  },
  claimsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  claimsText: {
    ...typography.captionBold,
    color: colors.secondary,
    marginLeft: 4
  }
});
