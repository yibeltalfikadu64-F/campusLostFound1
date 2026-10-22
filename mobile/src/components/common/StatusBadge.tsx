import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../../theme';

interface StatusBadgeProps {
  status: string;
  type?: 'item' | 'claim';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return { label: 'Open', bg: colors.infoBg, text: colors.info, border: '#BFDBFE' };
      case 'CLAIM_PENDING':
      case 'PENDING':
        return { label: 'Pending Review', bg: colors.warningBg, text: colors.warning, border: '#FDE68A' };
      case 'APPROVED':
        return { label: 'Approved', bg: colors.successBg, text: colors.success, border: '#A7F3D0' };
      case 'HANDOVER_SCHEDULED':
        return { label: 'Handover Ready', bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' };
      case 'RETURNED':
        return { label: 'Returned', bg: colors.successBg, text: colors.success, border: '#A7F3D0' };
      case 'REJECTED':
        return { label: 'Rejected', bg: colors.dangerBg, text: colors.danger, border: '#FECACA' };
      case 'CLOSED':
        return { label: 'Closed', bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
      default:
        return { label: status, bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    ...typography.captionBold,
    textTransform: 'capitalize'
  }
});
