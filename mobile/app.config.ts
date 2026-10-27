
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Injibara Campus Lost & Found',
  slug: 'injibara-lost-found',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'injibaracampus',
  userInterfaceStyle: 'automatic',

  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'et.edu.injibara.lostfound',
  },

  android: {
    package: 'et.edu.injibara.lostfound',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
  },

  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission:
          'The app needs access to your photos to upload pictures of lost or found items.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'The app uses your campus location to help specify where the item was lost or found.',
      },
    ],
  ],
});
