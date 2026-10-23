import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { AppIcon, AppIconName } from '@/components/app-icon';
import { Colors } from '@/constants/colors';

const icon = (name: AppIconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    const iconColor = typeof color === 'string' ? color : Colors.muted;
    return <AppIcon accent={iconColor} color={iconColor} filled={focused} name={name} size={22} />;
  };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: 'transparent',
          height: 72,
          paddingBottom: 9,
          paddingTop: 8,
          shadowColor: Colors.navy,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 14,
          maxWidth: 520,
          width: '100%',
          alignSelf: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Recherche', tabBarIcon: icon('search') }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: 'Favoris', tabBarIcon: icon('heart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: icon('profile') }}
      />
    </Tabs>
  );
}
