import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SessionProvider, useSession } from '../hooks/useSession';
import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import TabBar from '@/components/TabBar';

import { useColorScheme } from '@/hooks/useColorScheme';

function AppLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/dashboard');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/signin');
    }
  }, [session, isLoading, segments, router]);

  return (
    <Tabs tabBar={() => <TabBar />}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="myrequests" options={{ title: 'My Requests' }} />
      <Tabs.Screen name="needdonor" options={{ title: 'Need Donor' }} />
      <Tabs.Screen name="newdonor" options={{ title: 'New Donor' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppLayout />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SessionProvider>
  );
}
