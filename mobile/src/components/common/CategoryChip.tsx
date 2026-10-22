import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing } from '../../theme';

interface CategoryChipProps {
  label: string;
  iconName?: string;
  isSelected: boolean;
  onPress: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  iconName,
  isSelected,
  onPress
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        isSelected ? styles.selectedChip : styles.unselectedChip
      ]}
    >
      {iconName && (
        <MaterialCommunityIcons
          name={iconName as any}
          size={16}
          color={isSelected ? colors.textInverse : colors.primary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          isSelected ? styles.selectedLabel : styles.unselectedLabel
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1
  },
  unselectedChip: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  icon: {
    marginRight: 6
  },
  label: {
    ...typography.captionBold
  },
  unselectedLabel: {
    color: colors.textPrimary
  },
  selectedLabel: {
    color: colors.textInverse
  }
});
