import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { FormInput } from '../../src/components/common/FormInput';
import { CustomButton } from '../../src/components/common/CustomButton';

export default function NewClaimScreen() {
  const { itemId, title } = useLocalSearchParams<{ itemId: string; title: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [proofDescription, setProofDescription] = useState('');
  const [verificationAnswers, setVerificationAnswers] = useState('');
  const [lostLocation, setLostLocation] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handlePickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to attach proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets[0].uri) {
      setProofImage(result.assets[0].uri);
    }
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      let uploadedUrl: string | undefined;
      if (proofImage) {
        const formData = new FormData();
        const filename = proofImage.split('/').pop() || 'proof.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('images', { uri: proofImage, name: filename, type: ext });
        const uploadRes = await api.items.uploadImages(formData);
        uploadedUrl = uploadRes.data?.imageUrls?.[0];
      }

      return api.items.submitClaim(itemId!, {
        proofDescription: proofDescription.trim(),
        verificationAnswers: verificationAnswers.trim() || undefined,
        lostLocation: lostLocation.trim() || undefined,
        proofImageUrl: uploadedUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['my-claims'] });
      Alert.alert(
        'Claim Submitted Successfully',
        'Your evidence has been sent directly to Injibara University campus security for verification. You can track progress under My Activity.',
        [
          {
            text: 'Track in My Activity',
            onPress: () => router.replace('/(tabs)/my-activity')
          }
        ]
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit claim';
      setFormError(msg);
      Alert.alert('Error', msg);
    }
  });

  const handleSubmit = () => {
    if (!proofDescription.trim() || proofDescription.trim().length < 15) {
      setFormError('Please provide a detailed explanation of ownership (at least 15 characters)');
      return;
    }
    setFormError(null);
    claimMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Item Header Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerSubtitle}>Submitting Claim for:</Text>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {decodeURIComponent(title || 'Campus Item')}
          </Text>
        </View>

        <View style={styles.instructions}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.instructionsText}>
            Provide specific evidence to convince campus security reviewers that you are the lawful owner.
          </Text>
        </View>

        {formError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <FormInput
          label="Detailed Explanation of Ownership *"
          placeholder="Explain where and how you lost this item, serial numbers, content details, receipt information..."
          value={proofDescription}
          onChangeText={(v) => { setProofDescription(v); setFormError(null); }}
          multiline
          numberOfLines={4}
        />

        <FormInput
          label="Verification Details & Answers"
          placeholder="If this item has passcode patterns, stickers, or specific contents, specify here..."
          value={verificationAnswers}
          onChangeText={setVerificationAnswers}
          multiline
          numberOfLines={3}
          helperText="These answers will only be viewed by authorized security officers."
        />

        <FormInput
          label="Where Did You Misplace It? (Optional)"
          placeholder="e.g. Central Library 2nd floor, Cafeteria table #4"
          value={lostLocation}
          onChangeText={setLostLocation}
          leftIcon="location-outline"
        />

        {/* Proof Photo Attachment */}
        <Text style={styles.label}>Supporting Photo / Proof (Optional)</Text>
        <Text style={styles.sublabel}>
          Attach purchase receipt, previous photo with item, warranty card, or student ID.
        </Text>

        {proofImage ? (
          <View style={styles.proofPreviewContainer}>
            <Image source={{ uri: proofImage }} style={styles.proofImage} />
            <TouchableOpacity
              style={styles.removeProofButton}
              onPress={() => setProofImage(null)}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadProofBox} onPress={handlePickProofImage}>
            <Ionicons name="document-attach-outline" size={28} color={colors.primary} />
            <Text style={styles.uploadProofText}>Attach Evidence Photo</Text>
          </TouchableOpacity>
        )}

        <CustomButton
          title={claimMutation.isPending ? 'Verifying & Submitting...' : 'Submit Claim for Verification'}
          onPress={handleSubmit}
          variant="secondary"
          size="lg"
          loading={claimMutation.isPending}
          disabled={claimMutation.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    paddingBottom: spacing.xxl
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  bannerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.primary,
    marginTop: 2
  },
  instructions: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  instructionsText: {
    ...typography.caption,
    color: '#1E3A8A',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  errorText: {
    ...typography.captionBold,
    color: colors.danger,
    marginLeft: 8,
    flex: 1
  },
  label: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  sublabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8
  },
  uploadProofBox: {
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  uploadProofText: {
    ...typography.captionBold,
    color: colors.primary,
    marginTop: 4
  },
  proofPreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg
  },
  proofImage: {
    width: '100%',
    height: '100%'
  },
  removeProofButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButton: {
    marginTop: spacing.sm
  }
});
