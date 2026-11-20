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

/** Keep the loader opaque this long after the topping lands, with the game already mounted underneath, so the
 *  game's first (heaviest) frames happen out of sight and the fade-out stays smooth. */
const HOLD_MS = 450;
/** If the loader never reports back (a throttled background tab), show the game anyway. */
const FALLBACK_MS = 6000;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Caprasimo_400Regular, Quicksand_600SemiBold, Quicksand_700Bold, LexendDeca_700Bold });
  const [progress, setProgress] = useState(0);
  const [booted, setBooted] = useState(false);
  const [poured, setPoured] = useState(false); // the loading screen finished its pour and topping
  const [covered, setCovered] = useState(true); // the loader is still over the game

  // Progress in steps of 5% at most: each step re-renders the loader, and ~30 sounds report in.
  useEffect(() => {
    boot(f => setProgress(p => (f >= 1 || f - p >= 0.05 ? f : p))).finally(() => { setProgress(1); setBooted(true); });
  }, []);
  const gameMounted = booted && poured;
  useEffect(() => {
    if (gameMounted) { const t = setTimeout(() => setCovered(false), HOLD_MS); return () => clearTimeout(t); }
    if (booted) { const t = setTimeout(() => { setPoured(true); }, FALLBACK_MS); return () => clearTimeout(t); }
  }, [booted, gameMounted]);

  // The native splash covers font loading, then hands over to the loader once its first frame is on screen.
  const fontsReady = fontsLoaded || !!fontError;
  if (!fontsReady) return null;

  const stack = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.stageBg }, animation: 'fade' }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.stageBg }}>
      <SafeAreaProvider>
        <StatusBar hidden />
        {gameMounted && (posthog ? <PostHogProvider client={posthog}>{stack}</PostHogProvider> : stack)}
        {covered && (
          <Animated.View exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFill}>
            <Loading progress={progress} onReady={() => { SplashScreen.hideAsync().catch(() => {}); }} onDone={() => setPoured(true)} />
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
