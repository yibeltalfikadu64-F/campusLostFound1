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
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../src/theme';
import { api } from '../../src/api/endpoints';
import { FormInput } from '../../src/components/common/FormInput';
import { CustomButton } from '../../src/components/common/CustomButton';

type ReportType = 'LOST' | 'FOUND';
type KeptAt = 'WITH_FINDER' | 'SECURITY_OFFICE' | 'STUDENT_SERVICES';
type ContactPreference = 'IN_APP' | 'PHONE' | 'EMAIL';

export default function ReportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Automatically follow the device's light/dark appearance.
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  const theme = {
    background: isDark ? '#090E1A' : '#F4F7FC',
    surface: isDark ? '#151D2E' : '#FFFFFF',
    surfaceAlt: isDark ? '#1C2940' : '#EDF2FA',
    text: isDark ? '#F1F5F9' : '#14213D',
    muted: isDark ? '#A4B1C5' : '#64748B',
    border: isDark ? '#334155' : '#DCE4F0',
    primary: isDark ? '#8BA9FF' : '#315CF5',
    primaryText: '#FFFFFF',
    input: isDark ? '#111827' : '#FFFFFF',
    errorBg: isDark ? '#3B1D29' : '#FFF1F2',
    errorBorder: isDark ? '#7F3347' : '#FECDD3',
    lost: '#E85D75',
    found: '#159A72',
    shadow: isDark ? '#000000' : '#64748B',
  };

  // Form state
  const [type, setType] = useState<ReportType>('LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [hiddenDetail, setHiddenDetail] = useState('');
  const [keptAt, setKeptAt] = useState<KeptAt>('WITH_FINDER');
  const [contactPreference, setContactPreference] =
    useState<ContactPreference>('IN_APP');

  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load categories and campus locations.
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  });

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.list(),
  });

  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];

  // Image selection and compression.
  const processAndAddImage = async (uri: string) => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      );

      setImages((previous) =>
        previous.length < 3 ? [...previous, result.uri] : previous,
      );
    } catch {
      setImages((previous) =>
        previous.length < 3 ? [...previous, uri] : previous,
      );
    }
  };

  const handlePickImage = () => {
    if (images.length >= 3) {
      Alert.alert(
        'Photo limit reached',
        'You can attach up to three photos to each report.',
      );
      return;
    }

    const openCamera = async () => {
      try {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Allow camera access to take an item photo.',
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]?.uri) {
          await processAndAddImage(result.assets[0].uri);
        }
      } catch {
        Alert.alert('Camera unavailable', 'Unable to open the camera.');
      }
    };

    const openGallery = async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Allow photo library access to select an item photo.',
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]?.uri) {
          await processAndAddImage(result.assets[0].uri);
        }
      } catch {
        Alert.alert('Gallery unavailable', 'Unable to open your photos.');
      }
    };

    Alert.alert('Add item photos', 'Choose how you want to add a photo.', [
      { text: 'Take a photo', onPress: openCamera },
      { text: 'Choose from gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, i) => i !== index));
  };

  // Submit the report using your existing API.
  const reportMutation = useMutation({
    mutationFn: async () => {
      let uploadedUrls: string[] = [];

      if (images.length > 0) {
        setIsUploadingImages(true);

        try {
          const formData = new FormData();

          images.forEach((uri, index) => {
            const filename =
              uri.split('/').pop() || `item-photo-${index}.jpg`;
            const extension = /\.(\w+)$/.exec(filename);
            const mimeType =
              extension?.[1]?.toLowerCase() === 'png'
                ? 'image/png'
                : 'image/jpeg';

            formData.append(
              'images',
              {
                uri,
                name: filename,
                type: mimeType,
              } as any,
            );
          });

          const uploadResponse = await api.items.uploadImages(formData);
          uploadedUrls = uploadResponse.data?.imageUrls || [];
        } finally {
          setIsUploadingImages(false);
        }
      }

      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationId,
        dateEvent: new Date().toISOString(),
        color: color.trim() || undefined,
        brand: brand.trim() || undefined,
        hiddenDetail:
          type === 'FOUND' ? hiddenDetail.trim() || undefined : undefined,
        keptAt: type === 'FOUND' ? keptAt : undefined,
        contactPreference,
        imageUrls: uploadedUrls,
      };

      return api.items.create(payload);
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['my-activity'] });

      Alert.alert(
        'Report published!',
        `Your ${type.toLowerCase()} item report has been submitted successfully.`,
        [
          {
            text: 'View item',
            onPress: () =>
              router.replace(`/items/${response.data.id}` as any),
          },
          {
            text: 'Done',
            style: 'cancel',
          },
        ],
      );

      resetForm();
    },

    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to submit your report. Please try again.';

      setFormError(message);
      Alert.alert('Submission failed', message);
    },

    onSettled: () => {
      setIsUploadingImages(false);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setLocationId('');
    setColor('');
    setBrand('');
    setHiddenDetail('');
    setKeptAt('WITH_FINDER');
    setContactPreference('IN_APP');
    setImages([]);
    setFormError(null);
  };

  const handleSubmit = () => {
    if (title.trim().length < 3) {
      setFormError('Enter an item title with at least 3 characters.');
      return;
    }

    if (!categoryId) {
      setFormError('Please select an item category.');
      return;
    }

    if (!locationId) {
      setFormError('Please select the campus location.');
      return;
    }

    if (description.trim().length < 10) {
      setFormError('Describe the item using at least 10 characters.');
      return;
    }

    setFormError(null);
    reportMutation.mutate();
  };

  const busy = reportMutation.isPending || isUploadingImages;

  const styles = createStyles(theme);

  const renderSelector = (
    label: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    options: any[],
    selectedId: string,
    onSelect: (id: string) => void,
    loading: boolean,
    failed: boolean,
    retry: () => void,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.required}>Required</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.mutedText}>Loading options...</Text>
        </View>
      ) : failed ? (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={retry}
          accessibilityRole="button"
        >
          <Ionicons name="refresh-outline" size={18} color={theme.primary} />
          <Text style={styles.retryText}>Could not load. Tap to retry.</Text>
        </TouchableOpacity>
      ) : options.length === 0 ? (
        <Text style={styles.mutedText}>
          No options available yet.
        </Text>
      ) : (
        <View style={styles.pillContainer}>
          {options.map((option: any) => {
            const selected = selectedId === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pill,
                  selected && styles.pillSelected,
                ]}
                onPress={() => {
                  onSelect(option.id);
                  setFormError(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color="#FFFFFF"
                  />
                )}
                <Text
                  style={[
                    styles.pillText,
                    selected && styles.pillTextSelected,
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="megaphone-outline"
                size={25}
                color={theme.primary}
              />
            </View>

            <View style={styles.heroBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.heroBadgeText}>Campus community</Text>
            </View>
          </View>

          <Text style={styles.pageTitle}>Report an item</Text>
          <Text style={styles.pageSubtitle}>
            Help reunite lost belongings with their owners at Injibara
            University.
          </Text>
        </View>

        {/* Lost / Found selection */}
        <View style={styles.typeCard}>
          <Text style={styles.cardTitle}>What happened?</Text>
          <Text style={styles.cardSubtitle}>
            Select the type of report you want to publish.
          </Text>

          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'LOST' && styles.lostSelected,
              ]}
              onPress={() => {
                setType('LOST');
                setFormError(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: type === 'LOST' }}
            >
              <View
                style={[
                  styles.typeIcon,
                  type === 'LOST' && styles.typeIconSelected,
                  type === 'LOST' && { backgroundColor: '#FFFFFF25' },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={21}
                  color={type === 'LOST' ? '#FFFFFF' : theme.lost}
                />
              </View>
              <Text
                style={[
                  styles.typeTitle,
                  type === 'LOST' && styles.typeTitleSelected,
                ]}
              >
                I lost something
              </Text>
              <Text
                style={[
                  styles.typeDescription,
                  type === 'LOST' && styles.typeDescriptionSelected,
                ]}
              >
                Find my belonging
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'FOUND' && styles.foundSelected,
              ]}
              onPress={() => {
                setType('FOUND');
                setFormError(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: type === 'FOUND' }}
            >
              <View
                style={[
                  styles.typeIcon,
                  type === 'FOUND' && { backgroundColor: '#FFFFFF25' },
                ]}
              >
                <Ionicons
                  name="hand-left-outline"
                  size={21}
                  color={type === 'FOUND' ? '#FFFFFF' : theme.found}
                />
              </View>
              <Text
                style={[
                  styles.typeTitle,
                  type === 'FOUND' && styles.typeTitleSelected,
                ]}
              >
                I found something
              </Text>
              <Text
                style={[
                  styles.typeDescription,
                  type === 'FOUND' && styles.typeDescriptionSelected,
                ]}
              >
                Help its owner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form error */}
        {formError && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={theme.lost}
            />
            <Text style={styles.errorText}>{formError}</Text>
            <TouchableOpacity
              onPress={() => setFormError(null)}
              accessibilityLabel="Dismiss error"
            >
              <Ionicons name="close" size={19} color={theme.lost} />
            </TouchableOpacity>
          </View>
        )}

        {/* Basic item details */}
        <View style={styles.formCard}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.headingIcon}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.cardTitle}>Item details</Text>
              <Text style={styles.cardSubtitle}>
                Provide enough detail to identify the item.
              </Text>
            </View>
          </View>

          <FormInput
            label="Item title *"
            placeholder="e.g. Blue Samsung phone"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setFormError(null);
            }}
            leftIcon="pricetag-outline"
          />

          {renderSelector(
            'Category',
            'grid-outline',
            categories,
            categoryId,
            setCategoryId,
            categoriesLoading,
            categoriesError,
            () => void refetchCategories(),
          )}

          {renderSelector(
            'Campus location',
            'location-outline',
            locations,
            locationId,
            setLocationId,
            locationsLoading,
            locationsError,
            () => void refetchLocations(),
          )}

          <View style={styles.descriptionHeading}>
            <Text style={styles.label}>Detailed description *</Text>
            <Text style={styles.optionalHint}>At least 10 characters</Text>
          </View>

          <FormInput
            placeholder="Describe the item's appearance, identifying marks, condition, or other details..."
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              setFormError(null);
            }}
            multiline
            numberOfLines={4}
            containerStyle={styles.descriptionInput}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormInput
                label="Color"
                placeholder="e.g. Navy blue"
                value={color}
                onChangeText={setColor}
              />
            </View>

            <View style={styles.halfField}>
              <FormInput
                label="Brand / model"
                placeholder="e.g. Samsung"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
          </View>
        </View>

        {/* Private verification details for found items */}
        {type === 'FOUND' && (
          <View style={styles.secretCard}>
            <View style={styles.secretHeader}>
              <View style={styles.secretIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={theme.primary}
                />
              </View>
              <View style={styles.headingCopy}>
                <Text style={styles.cardTitle}>Owner verification</Text>
                <Text style={styles.cardSubtitle}>
                  Keep one identifying detail private.
                </Text>
              </View>
              <Ionicons
                name="lock-closed"
                size={17}
                color={theme.primary}
              />
            </View>

            <Text style={styles.secretHint}>
              Add a detail only the real owner is likely to know. Do not
              include it in the public description.
            </Text>

            <FormInput
              label="Private verification detail"
              placeholder="e.g. A sticker on the back of the phone"
              value={hiddenDetail}
              onChangeText={setHiddenDetail}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Where is the item being kept?</Text>

            <View style={styles.keptAtList}>
              {(
                [
                  ['WITH_FINDER', 'With the finder', 'person-outline'],
                  ['SECURITY_OFFICE', 'Security office', 'shield-outline'],
                  ['STUDENT_SERVICES', 'Student services', 'business-outline'],
                ] as const
              ).map(([value, label, icon]) => {
                const selected = keptAt === value;

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.keptAtButton,
                      selected && styles.keptAtButtonSelected,
                    ]}
                    onPress={() => setKeptAt(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={icon}
                      size={18}
                      color={selected ? theme.primary : theme.muted}
                    />
                    <Text
                      style={[
                        styles.keptAtText,
                        selected && styles.keptAtTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={19}
                      color={selected ? theme.primary : theme.muted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Contact preference */}
        <View style={styles.formCard}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.headingIcon}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.cardTitle}>Contact preference</Text>
              <Text style={styles.cardSubtitle}>
                Choose how you prefer to coordinate.
              </Text>
            </View>
          </View>

          <View style={styles.contactOptions}>
            {(
              [
                ['IN_APP', 'In-app', 'chatbubble-ellipses-outline'],
                ['PHONE', 'Phone', 'call-outline'],
                ['EMAIL', 'Email', 'mail-outline'],
              ] as const
            ).map(([value, label, icon]) => {
              const selected = contactPreference === value;

              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.contactOption,
                    selected && styles.contactOptionSelected,
                  ]}
                  onPress={() => setContactPreference(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={icon}
                    size={21}
                    color={selected ? theme.primary : theme.muted}
                  />
                  <Text
                    style={[
                      styles.contactText,
                      selected && styles.contactTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.smallNote}>
            Choose a preference supported by your campus account and
            contact settings.
          </Text>
        </View>

        {/* Image attachments */}
        <View style={styles.formCard}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.headingIcon}>
              <Ionicons
                name="images-outline"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.cardTitle}>Item photos</Text>
              <Text style={styles.cardSubtitle}>
                Add clear photos to help identify the item.
              </Text>
            </View>
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{images.length}/3</Text>
            </View>
          </View>

          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  accessibilityLabel={`Remove photo ${index + 1}`}
                >
                  <Ionicons name="close" size={17} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.imageNumber}>
                  <Text style={styles.imageNumberText}>{index + 1}</Text>
                </View>
              </View>
            ))}

            {images.length < 3 && (
              <TouchableOpacity
                style={styles.addImageBox}
                onPress={handlePickImage}
                accessibilityRole="button"
              >
                <View style={styles.addImageIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={25}
                    color={theme.primary}
                  />
                </View>
                <Text style={styles.addImageText}>Add photo</Text>
                <Text style={styles.addImageSubtext}>Camera or gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.smallNote}>
            Up to 3 photos. Images are resized to reduce upload time.
          </Text>
        </View>

        {/* Submit */}
        <View style={styles.submitArea}>
          <View style={styles.privacyNote}>
            <Ionicons
              name="lock-closed-outline"
              size={17}
              color={theme.muted}
            />
            <Text style={styles.privacyText}>
              Check your details before publishing your report.
            </Text>
          </View>

          <CustomButton
            title={
              busy
                ? 'Publishing report...'
                : `Publish ${type === 'LOST' ? 'lost' : 'found'} item`
            }
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={busy}
            disabled={busy}
            style={styles.submitButton}
          />

          {busy && (
            <Text style={styles.uploadHint}>
              {isUploadingImages
                ? 'Uploading your photos...'
                : 'Submitting your report...'}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="heart-outline"
            size={15}
            color={theme.muted}
          />
          <Text style={styles.footerText}>
            Helping the Injibara campus community, one item at a time.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  input: string;
  errorBg: string;
  errorBorder: string;
  lost: string;
  found: string;
  shadow: string;
}) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 18,
      paddingBottom: 36,
      maxWidth: 900,
      width: '100%',
      alignSelf: 'center',
    },

    hero: {
      marginBottom: 20,
      paddingTop: 4,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 30,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.found,
    },
    heroBadgeText: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    pageTitle: {
      fontSize: 29,
      fontWeight: '800',
      letterSpacing: -0.7,
      color: theme.text,
      marginBottom: 7,
    },
    pageSubtitle: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.muted,
      maxWidth: 540,
    },

    typeCard: {
      backgroundColor: theme.surface,
      borderRadius: 22,
      padding: 17,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    cardSubtitle: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.muted,
      marginTop: 4,
    },
    typeToggleRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 17,
    },
    typeButton: {
      flex: 1,
      minWidth: 0,
      padding: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    lostSelected: {
      backgroundColor: theme.lost,
      borderColor: theme.lost,
    },
    foundSelected: {
      backgroundColor: theme.found,
      borderColor: theme.found,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    typeIconSelected: {
      backgroundColor: '#FFFFFF25',
    },
    typeTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 5,
    },
    typeTitleSelected: {
      color: '#FFFFFF',
    },
    typeDescription: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    typeDescriptionSelected: {
      color: '#FFFFFFE0',
    },

    formCard: {
      padding: 17,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    cardHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    headingIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headingCopy: {
      flex: 1,
    },
    section: {
      marginTop: 20,
    },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 11,
    },
    sectionIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      marginRight: 9,
    },
    label: {
      ...typography.captionBold,
      color: theme.text,
      fontSize: 13,
      flexShrink: 1,
    },
    required: {
      marginLeft: 'auto',
      color: theme.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingVertical: 12,
    },
    mutedText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
    },
    retryText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    pillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 30,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 2,
    },
    pillSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    pillText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '600',
    },
    pillTextSelected: {
      color: '#FFFFFF',
    },
    descriptionHeading: {
      marginTop: 22,
      marginBottom: 7,
    },
    optionalHint: {
      color: theme.muted,
      fontSize: 10,
      marginTop: 4,
    },
    descriptionInput: {
      marginTop: 0,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    halfField: {
      flex: 1,
      minWidth: 0,
    },

    secretCard: {
      padding: 17,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.primary,
      marginBottom: 16,
    },
    secretHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    secretIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    secretHint: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
      marginBottom: 18,
    },
    keptAtList: {
      gap: 9,
      marginTop: 12,
    },
    keptAtButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 13,
      backgroundColor: theme.surfaceAlt,
    },
    keptAtButtonSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.surface,
    },
    keptAtText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: theme.muted,
    },
    keptAtTextSelected: {
      color: theme.text,
    },

    contactOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    contactOption: {
      flex: 1,
      minWidth: 0,
      minHeight: 83,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
    },
    contactOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.surface,
    },
    contactText: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    contactTextSelected: {
      color: theme.text,
    },
    smallNote: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 12,
    },

    photoCount: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.surfaceAlt,
    },
    photoCountText: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: '800',
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    imageContainer: {
      width: 96,
      height: 104,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.surfaceAlt,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
    },
    removeImageButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: '#101827D9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageNumber: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      minWidth: 22,
      height: 22,
      paddingHorizontal: 5,
      borderRadius: 11,
      backgroundColor: '#101827D9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageNumberText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    addImageBox: {
      width: 124,
      minHeight: 104,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      backgroundColor: theme.surfaceAlt,
    },
    addImageIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },
    addImageText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '800',
    },
    addImageSubtext: {
      color: theme.muted,
      fontSize: 9,
      marginTop: 4,
      textAlign: 'center',
    },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      marginBottom: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.errorBorder,
      backgroundColor: theme.errorBg,
    },
    errorText: {
      flex: 1,
      color: theme.lost,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 18,
    },
    submitArea: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 18,
    },
    privacyNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginBottom: 14,
    },
    privacyText: {
      color: theme.muted,
      fontSize: 11,
      flexShrink: 1,
      textAlign: 'center',
    },
    submitButton: {
      marginTop: 0,
    },
    uploadHint: {
      color: theme.muted,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 10,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    footerText: {
      color: theme.muted,
      fontSize: 10,
      textAlign: 'center',
      flexShrink: 1,
    },
  });
}
