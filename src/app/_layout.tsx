import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { LexendDeca_700Bold } from '@expo-google-fonts/lexend-deca';
import { Quicksand_600SemiBold, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { boot } from '@/game/boot';
import { C } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Caprasimo_400Regular, Quicksand_600SemiBold, Quicksand_700Bold, LexendDeca_700Bold });
  const [saveReady, setSaveReady] = useState(false);

  useEffect(() => { boot().finally(() => setSaveReady(true)); }, []);

  const ready = (fontsLoaded || !!fontError) && saveReady;
  useEffect(() => { if (ready) SplashScreen.hideAsync(); }, [ready]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.stageBg }}>
      <SafeAreaProvider>
        <StatusBar hidden />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.stageBg }, animation: 'fade' }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
