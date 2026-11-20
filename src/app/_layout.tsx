import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { LexendDeca_700Bold } from '@expo-google-fonts/lexend-deca';
import { Quicksand_600SemiBold, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';

import { boot } from '@/game/boot';
import { Loading } from '@/ui/Loading';
import { posthog } from '@/services/posthog';
import { C } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

/** A beat on the finished drink before the game appears. */
const HOLD_MS = 350;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Caprasimo_400Regular, Quicksand_600SemiBold, Quicksand_700Bold, LexendDeca_700Bold });
  const [progress, setProgress] = useState(0);
  const [booted, setBooted] = useState(false);
  const [poured, setPoured] = useState(false); // the loading screen finished its pour and topping
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { boot(setProgress).finally(() => { setProgress(1); setBooted(true); }); }, []);
  // the game appears once everything has loaded and the loading screen has served its drink
  useEffect(() => {
    if (!booted) return;
    // fallback: if the animation never reports back (a throttled background tab), never strand the player
    const t = setTimeout(() => setLoaded(true), poured ? HOLD_MS : 6000);
    return () => clearTimeout(t);
  }, [booted, poured]);

  // The native splash only covers font loading; the loading screen (same cup, same spot) takes over from there.
  const fontsReady = fontsLoaded || !!fontError;
  useEffect(() => { if (fontsReady) SplashScreen.hideAsync(); }, [fontsReady]);
  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.stageBg }}>
      <SafeAreaProvider>
        <StatusBar hidden />
        {loaded && (posthog ? (
          <PostHogProvider client={posthog}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.stageBg }, animation: 'fade' }} />
          </PostHogProvider>
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.stageBg }, animation: 'fade' }} />
        ))}
        {!loaded && (
          <Animated.View exiting={FadeOut.duration(350)} style={StyleSheet.absoluteFill}>
            <Loading progress={progress} onDone={() => setPoured(true)} />
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
