import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/context/auth-context';
import { BusinessProvider } from '@/context/business-context';

import { FavoritesProvider } from '@/context/favorites-context';

export default function RootLayout() {
  return (
    <AuthProvider><BusinessProvider><FavoritesProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="register-business" options={{ title: 'Mes entreprises', headerBackTitle: 'Retour', headerTintColor: '#10232D' }} />
        <Stack.Screen
          name="business/[id]"
          options={{
            title: 'Établissement',
            headerBackTitle: 'Retour',
            headerTintColor: '#10232D',
          }}
        />
      </Stack>
    </FavoritesProvider></BusinessProvider></AuthProvider>
  );
}
