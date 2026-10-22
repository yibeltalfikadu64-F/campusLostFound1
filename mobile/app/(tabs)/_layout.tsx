import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useI18n } from '../../src/i18n';

export default function TabsLayout() {
  const { isStaff } = useAuth();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          ...typography.h3,
          color: '#FFFFFF'
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          ...typography.captionBold,
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t.tabs.search,
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: t.tabs.report,
          headerShown: true,
          headerTitle: 'Report Item',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={26} color={colors.secondary} />
          )
        }}
      />
      <Tabs.Screen
        name="my-activity"
        options={{
          title: t.tabs.activity,
          headerShown: true,
          headerTitle: 'My Activity',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t.tabs.notifications,
          headerShown: true,
          headerTitle: 'Campus Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          headerShown: true,
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t.tabs.admin,
          headerShown: false,
          href: isStaff ? '/admin' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
