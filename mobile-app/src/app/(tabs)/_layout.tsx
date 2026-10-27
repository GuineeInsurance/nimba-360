import { Tabs } from 'expo-router';
import { ColorValue, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, AppIconName } from '@/components/app-icon';
import { Colors } from '@/constants/colors';

const icon = (name: AppIconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    const iconColor = typeof color === 'string' ? color : Colors.muted;
    return <AppIcon accent={iconColor} color={iconColor} filled={focused} name={name} size={22} />;
  };

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 9);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable
            {...props}
            android_ripple={{ color: '#CE11261A', radius: 28 }}
          />
        ),
        tabBarItemStyle: { borderRadius: 14, overflow: 'hidden' },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: 'transparent',
          height: 63 + bottomInset,
          paddingBottom: bottomInset,
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
        options={{ title: 'Explorer', tabBarIcon: icon('home') }}
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
