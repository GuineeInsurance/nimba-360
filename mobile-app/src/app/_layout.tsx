import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FavoritesProvider } from '@/context/favorites-context';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="business/[id]"
          options={{
            title: 'Établissement',
            headerBackTitle: 'Retour',
            headerTintColor: '#10232D',
          }}
        />
      </Stack>
    </FavoritesProvider>
  );
}
