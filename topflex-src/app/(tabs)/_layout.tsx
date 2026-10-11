import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navMuted,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10, marginBottom: Platform.OS === 'web' ? 8 : 0 },
        tabBarStyle: {
          height: Platform.OS === 'web' ? 84 : 74,
          paddingTop: 9,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          const names: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? 'home' : 'home-outline',
            transactions: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
            wallet: focused ? 'wallet' : 'wallet-outline',
            more: focused ? 'menu' : 'menu-outline',
          };
          return <Ionicons name={names[route.name] ?? 'ellipse-outline'} size={21} color={color} />;
        },
        tabBarBackground: () => <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.white }]} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
