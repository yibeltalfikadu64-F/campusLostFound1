import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { FormInput } from '../../src/components/common/FormInput';
import { CustomButton } from '../../src/components/common/CustomButton';

export default function ReportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [hiddenDetail, setHiddenDetail] = useState('');
  const [keptAt, setKeptAt] = useState<'WITH_FINDER' | 'SECURITY_OFFICE' | 'STUDENT_SERVICES'>('WITH_FINDER');
  const [contactPreference, setContactPreference] = useState<'IN_APP' | 'PHONE' | 'EMAIL'>('IN_APP');

  // Images state (local URIs and uploaded server URLs)
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Categories & Locations for dropdowns
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list()
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.list()
  });

  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];

  // Pick Image from Camera or Gallery with Permission check & Compression
  const handlePickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 3 photos per item.');
      return;
    }

    Alert.alert(
      'Attach Item Photo',
      'Choose a photo source for this campus item report:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to photograph items.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0].uri) {
              await processAndAddImage(result.assets[0].uri);
            }
          }
        },
        {
          text: 'Photo Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0].uri) {
              await processAndAddImage(result.assets[0].uri);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Compress & resize image to 1024px width max
  const processAndAddImage = async (uri: string) => {
    try {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      setImages((prev) => [...prev, manipResult.uri]);
    } catch {
      setImages((prev) => [...prev, uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Create report mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      // 1. Upload images if any
      let uploadedUrls: string[] = [];
      if (images.length > 0) {
        setIsUploadingImages(true);
        const formData = new FormData();
        images.forEach((imgUri, idx) => {
          const filename = imgUri.split('/').pop() || `photo-${idx}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const ext = match ? `image/${match[1]}` : 'image/jpeg';
          // @ts-ignore
          formData.append('images', { uri: imgUri, name: filename, type: ext });
        });

        const uploadRes = await api.items.uploadImages(formData);
        uploadedUrls = uploadRes.data?.imageUrls || [];
        setIsUploadingImages(false);
      }

      // 2. Submit report
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationId,
        dateEvent: new Date().toISOString(),
        color: color.trim() || undefined,
        brand: brand.trim() || undefined,
        hiddenDetail: type === 'FOUND' ? hiddenDetail.trim() || undefined : undefined,
        keptAt: type === 'FOUND' ? keptAt : undefined,
        contactPreference,
        imageUrls: uploadedUrls
      };

      return api.items.create(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      Alert.alert(
        'Report Submitted',
        `Your ${type.toLowerCase()} item report has been published across the campus network.`,
        [
          {
            text: 'View Item',
            onPress: () => router.replace(`/items/${data.data.id}` as any)
          }
        ]
      );
      resetForm();
    },
    onError: (err: any) => {
      setIsUploadingImages(false);
      const msg = err.response?.data?.message || err.message || 'Failed to submit report';
      setFormError(msg);
      Alert.alert('Submission Error', msg);
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setColor('');
    setBrand('');
    setHiddenDetail('');
    setImages([]);
    setFormError(null);
  };

  const handleSubmit = () => {
    if (!title.trim() || title.trim().length < 3) {
      setFormError('Item title must be at least 3 characters');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a category for this item');
      return;
    }
    if (!locationId) {
      setFormError('Please select the campus location where it was lost or found');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Please describe the item in at least 10 characters');
      return;
    }

    setFormError(null);
    reportMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Toggle Lost / Found */}
        <View style={styles.typeToggleRow}>
          <TouchableOpacity
            style={[
              styles.typeToggleButton,
              type === 'LOST' && styles.typeToggleActiveLost
            ]}
            onPress={() => setType('LOST')}
          >
            <Ionicons
              name="help-circle"
              size={18}
              color={type === 'LOST' ? '#FFFFFF' : colors.lostTag}
            />
            <Text
              style={[
                styles.typeToggleText,
                type === 'LOST' && styles.typeToggleTextActive
              ]}
            >
              I Lost Something
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeToggleButton,
              type === 'FOUND' && styles.typeToggleActiveFound
            ]}
            onPress={() => setType('FOUND')}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={type === 'FOUND' ? '#FFFFFF' : colors.foundTag}
            />
            <Text
              style={[
                styles.typeToggleText,
                type === 'FOUND' && styles.typeToggleTextActive
              ]}
            >
              I Found Something
            </Text>
          </TouchableOpacity>
        </View>

        {formError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        {/* Basic Information */}
        <FormInput
          label="Item Title *"
          placeholder="e.g. Blue Samsung Galaxy A54, Brown leather wallet"
          value={title}
          onChangeText={(v) => { setTitle(v); setFormError(null); }}
          leftIcon="text-outline"
        />

        {/* Category Selector */}
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {categories.map((cat: any) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.selectorPill,
                categoryId === cat.id && styles.selectorPillActive
              ]}
              onPress={() => { setCategoryId(cat.id); setFormError(null); }}
            >
              <Text
                style={[
                  styles.selectorPillText,
                  categoryId === cat.id && styles.selectorPillTextActive
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Location Selector */}
        <Text style={styles.label}>Campus Location *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {locations.map((loc: any) => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.selectorPill,
                locationId === loc.id && styles.selectorPillActive
              ]}
              onPress={() => { setLocationId(loc.id); setFormError(null); }}
            >
              <Text
                style={[
                  styles.selectorPillText,
                  locationId === loc.id && styles.selectorPillTextActive
                ]}
              >
                📍 {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FormInput
          label="Detailed Description *"
          placeholder="Include identifying marks, condition, brand, color, case..."
          value={description}
          onChangeText={(v) => { setDescription(v); setFormError(null); }}
          multiline
          numberOfLines={4}
          containerStyle={{ marginTop: spacing.md }}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <FormInput
              label="Color (Optional)"
              placeholder="e.g. Navy Blue"
              value={color}
              onChangeText={setColor}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <FormInput
              label="Brand / Model (Optional)"
              placeholder="e.g. Samsung / Apple"
              value={brand}
              onChangeText={setBrand}
            />
          </View>
        </View>

        {/* Secret Verification Detail (FOUND items only) */}
        {type === 'FOUND' && (
          <View style={styles.secretDetailBox}>
            <View style={styles.secretHeader}>
              <Ionicons name="lock-closed" size={18} color={colors.primary} />
              <Text style={styles.secretTitle}>Secret Verification Detail</Text>
            </View>
            <Text style={styles.secretHint}>
              Private feature known only to the true owner (e.g. Lockscreen wallpaper image, serial code, sticker, cash amount inside). This will NOT be shown publicly!
            </Text>
            <FormInput
              placeholder="e.g. Lockscreen shows a dog; 200 Birr inside slot #2"
              value={hiddenDetail}
              onChangeText={setHiddenDetail}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Where is the item currently kept?</Text>
            <View style={styles.keptAtRow}>
              {(['WITH_FINDER', 'SECURITY_OFFICE', 'STUDENT_SERVICES'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.keptAtButton,
                    keptAt === opt && styles.keptAtButtonActive
                  ]}
                  onPress={() => setKeptAt(opt)}
                >
                  <Text
                    style={[
                      styles.keptAtText,
                      keptAt === opt && styles.keptAtTextActive
                    ]}
                  >
                    {opt === 'WITH_FINDER' ? 'With Finder' : opt === 'SECURITY_OFFICE' ? 'Security Office' : 'Student Services'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Photos Section */}
        <Text style={styles.label}>Photos (Up to 3 images)</Text>
        <View style={styles.imageGrid}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imagePreviewContainer}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(idx)}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity style={styles.addImageBox} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <CustomButton
          title={
            reportMutation.isPending || isUploadingImages
              ? 'Submitting Report...'
              : `Publish ${type} Item Report`
          }
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          loading={reportMutation.isPending || isUploadingImages}
          disabled={reportMutation.isPending || isUploadingImages}
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
  typeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md
  },
  typeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md
  },
  typeToggleActiveLost: {
    backgroundColor: colors.lostTag
  },
  typeToggleActiveFound: {
    backgroundColor: colors.foundTag
  },
  typeToggleText: {
    ...typography.button,
    color: colors.textPrimary,
    marginLeft: 6
  },
  typeToggleTextActive: {
    color: '#FFFFFF'
  },
  label: {
    ...typography.captionBold,
    color: colors.textPrimary,
    marginBottom: 6
  },
  selectorScroll: {
    marginBottom: spacing.sm
  },
  selectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  selectorPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectorPillText: {
    ...typography.captionBold,
    color: colors.textPrimary
  },
  selectorPillTextActive: {
    color: '#FFFFFF'
  },
  row: {
    flexDirection: 'row'
  },
  secretDetailBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginVertical: spacing.sm
  },
  secretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  secretTitle: {
    ...typography.bodyBold,
    color: colors.primary,
    marginLeft: 6
  },
  secretHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16
  },
  keptAtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  keptAtButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginHorizontal: 3
  },
  keptAtButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  keptAtText: {
    ...typography.captionBold,
    color: colors.textSecondary,
    fontSize: 11
  },
  keptAtTextActive: {
    color: '#FFFFFF'
  },
  imageGrid: {
    flexDirection: 'row',
    marginBottom: spacing.lg
  },
  imagePreviewContainer: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addImageBox: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addImageText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4
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
  submitButton: {
    marginTop: spacing.sm
  }
});
