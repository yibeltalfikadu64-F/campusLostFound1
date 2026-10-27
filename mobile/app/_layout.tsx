import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../src/api/query-client';
import { AuthProvider } from '../src/features/auth/AuthContext';
import { I18nProvider } from '../src/i18n';
import { OfflineBanner } from '../src/components/common/OfflineBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <StatusBar style="light" />
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8FAFC' }
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="items/[id]"
                options={{
                  headerShown: true,
                  title: 'Item Details',
                  headerStyle: { backgroundColor: '#0F2C59' },
                  headerTintColor: '#FFFFFF'
                }}
              />
              <Stack.Screen
                name="claims/new"
                options={{
                  headerShown: true,
                  title: 'Claim Ownership',
                  headerStyle: { backgroundColor: '#0F2C59' },
                  headerTintColor: '#FFFFFF'
                }}
              />
            </Stack>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
