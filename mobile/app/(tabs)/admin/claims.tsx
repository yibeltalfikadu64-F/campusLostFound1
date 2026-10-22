import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  RefreshControl
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { api } from '../../../src/api/endpoints';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { CustomButton } from '../../../src/components/common/CustomButton';
import { FormInput } from '../../../src/components/common/FormInput';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { BASE_URL } from '../../../src/api/client';

export default function AdminClaimsScreen() {
  const queryClient = useQueryClient();

  // Handover modal state
  const [handoverModalVisible, setHandoverModalVisible] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [handoverLocation, setHandoverLocation] = useState('Campus Central Security Office');
  const [handoverNote, setHandoverNote] = useState('');

  const {
    data: claimsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['admin-claims-queue'],
    queryFn: () => api.admin.listClaims()
  });

  const approveMutation = useMutation({
    mutationFn: ({ claimId, note }: { claimId: string; note?: string }) =>
      api.claims.approve(claimId, { reviewNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Success', 'Claim approved! Item status updated.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not approve claim');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason: string }) =>
      api.claims.reject(claimId, { reviewNote: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Success', 'Claim rejected.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not reject claim');
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ claimId, location, note }: { claimId: string; location: string; note?: string }) =>
      api.claims.scheduleHandover(claimId, {
        handoverLocation: location,
        handoverAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        note
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims-queue'] });
      setHandoverModalVisible(false);
      Alert.alert('Handover Scheduled', 'Claimant notified to bring their ID card.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not schedule handover');
    }
  });

  const confirmReturnMutation = useMutation({
    mutationFn: (claimId: string) => api.claims.confirmReturn(claimId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Item Returned', 'Item marked returned and handover recorded in university audit logs.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not confirm return');
    }
  });

  const handleApprove = (claim: any) => {
    Alert.alert(
      'Approve Claim',
      `Are you sure evidence verifies that "${claim.item?.title}" belongs to ${claim.claimant?.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveMutation.mutate({ claimId: claim.id, note: 'Evidence verified by security.' })
        }
      ]
    );
  };

  const handleReject = (claim: any) => {
    Alert.prompt
      ? Alert.prompt('Reject Claim', 'Enter reason for rejection:', (reason) => {
          if (reason) rejectMutation.mutate({ claimId: claim.id, reason });
        })
      : Alert.alert('Reject Claim', 'Evidence insufficient to establish ownership.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => rejectMutation.mutate({ claimId: claim.id, reason: 'Evidence provided did not match item attributes.' })
          }
        ]);
  };

  const claims = claimsData?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        renderItem={({ item: claim }) => {
          const rawProofImg = claim.proofImageUrl;
          const proofImgUrl = rawProofImg
            ? rawProofImg.startsWith('http')
              ? rawProofImg
              : `${BASE_URL.replace('/api/v1', '')}${rawProofImg}`
            : null;

          return (
            <View style={styles.claimCard}>
              <View style={styles.claimHeader}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {claim.item?.title || 'Reported Item'}
                </Text>
                <StatusBadge status={claim.status} />
              </View>

              {/* Claimant Details */}
              <View style={styles.claimantBox}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={styles.claimantText}>
                  Claimant: <Text style={styles.bold}>{claim.claimant?.fullName}</Text> ({claim.claimant?.universityId || 'No ID'})
                </Text>
              </View>
              <Text style={styles.claimantContact}>
                📞 {claim.claimant?.phone || 'No phone'} • ✉️ {claim.claimant?.email || 'No email'}
              </Text>

              {/* Submitted Proof Description */}
              <Text style={styles.proofHeading}>Claimant's Proof Statement:</Text>
              <Text style={styles.proofText}>"{claim.proofDescription}"</Text>

              {/* Verification Answers */}
              {claim.verificationAnswers ? (
                <View style={styles.answersBox}>
                  <Text style={styles.answersHeading}>Secret Clue Answers Provided:</Text>
                  <Text style={styles.answersText}>{claim.verificationAnswers}</Text>
                </View>
              ) : null}

              {/* Proof Image */}
              {proofImgUrl && (
                <View style={styles.proofImgContainer}>
                  <Text style={styles.proofImgHeading}>Attached Evidence Photo:</Text>
                  <Image source={{ uri: proofImgUrl }} style={styles.proofImage} resizeMode="cover" />
                </View>
              )}

              {/* Action Buttons based on status */}
              <View style={styles.actionsRow}>
                {claim.status === 'PENDING' && (
                  <>
                    <CustomButton
                      title="Approve"
                      onPress={() => handleApprove(claim)}
                      variant="primary"
                      size="sm"
                      loading={approveMutation.isPending}
                      style={{ flex: 1, marginRight: 6 }}
                    />
                    <CustomButton
                      title="Reject"
                      onPress={() => handleReject(claim)}
                      variant="danger"
                      size="sm"
                      loading={rejectMutation.isPending}
                      style={{ flex: 1, marginLeft: 6 }}
                    />
                  </>
                )}

                {claim.status === 'APPROVED' && (
                  <CustomButton
                    title="Schedule Handover"
                    onPress={() => {
                      setSelectedClaimId(claim.id);
                      setHandoverModalVisible(true);
                    }}
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                )}

                {claim.status === 'HANDOVER_SCHEDULED' && (
                  <CustomButton
                    title="Confirm Handover Completed"
                    onPress={() =>
                      Alert.alert(
                        'Confirm Return',
                        `Confirm that item "${claim.item?.title}" was handed over to ${claim.claimant?.fullName}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Confirm Returned', onPress: () => confirmReturnMutation.mutate(claim.id) }
                        ]
                      )
                    }
                    variant="primary"
                    size="sm"
                    loading={confirmReturnMutation.isPending}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </View>
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
            <LoadingSpinner message="Loading claim queue..." />
          ) : (
            <EmptyState
              title="Claims Queue Empty"
              description="No pending ownership claims currently awaiting verification."
              icon="shield-checkmark-outline"
            />
          )
        }
      />

      {/* Handover Modal */}
      <Modal
        visible={handoverModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHandoverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Schedule Item Handover</Text>
            <FormInput
              label="Collection Location *"
              placeholder="e.g. Central Campus Security Gate / Office #102"
              value={handoverLocation}
              onChangeText={setHandoverLocation}
            />
            <FormInput
              label="Instruction Note (Optional)"
              placeholder="e.g. Bring Student ID and receipt"
              value={handoverNote}
              onChangeText={setHandoverNote}
            />
            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancel"
                onPress={() => setHandoverModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title="Confirm & Notify"
                onPress={() => {
                  if (selectedClaimId) {
                    scheduleMutation.mutate({
                      claimId: selectedClaimId,
                      location: handoverLocation,
                      note: handoverNote
                    });
                  }
                }}
                variant="primary"
                loading={scheduleMutation.isPending}
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
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  itemTitle: {
    ...typography.h3,
    color: colors.primary,
    flex: 1,
    marginRight: 8
  },
  claimantBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  claimantText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 6
  },
  bold: {
    ...typography.bodyBold,
    color: colors.textPrimary
  },
  claimantContact: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8
  },
  proofHeading: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginTop: 6
  },
  proofText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 8
  },
  answersBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: 8
  },
  answersHeading: {
    ...typography.captionBold,
    color: colors.primary
  },
  answersText: {
    ...typography.body,
    color: '#1E3A8A',
    marginTop: 2
  },
  proofImgContainer: {
    marginVertical: 8
  },
  proofImgHeading: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: 4
  },
  proofImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md
  }
});
