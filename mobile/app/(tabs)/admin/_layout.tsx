import React from 'react';
import { Stack } from 'expo-router';
import { colors, typography } from '../../../src/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { ...typography.h3, color: '#FFFFFF' }
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Security Admin Portal' }} />
      <Stack.Screen name="claims" options={{ title: 'Claims Queue' }} />
      <Stack.Screen name="users" options={{ title: 'Campus Users' }} />
      <Stack.Screen name="categories" options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="locations" options={{ title: 'Campus Locations' }} />
    </Stack>
  );
}
