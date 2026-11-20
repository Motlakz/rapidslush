// PostHog client, set up the same way as Slush Rush. Screens never call it directly: events go through track() in
// ./analytics and logs through ./posthogLogger.
import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra as
  | { posthogProjectToken?: string; posthogHost?: string; posthogDev?: boolean }
  | undefined;
const projectToken = extra?.posthogProjectToken;
const host = extra?.posthogHost;
/**
 * Where analytics runs: native release builds. Dev builds only with POSTHOG_DEV=1 in .env (then with debug
 * logging), so test sessions stay out of the real numbers. Never on web: the game ships on mobile, and web
 * can't report the app version/build PostHog needs.
 */
const enabled = Platform.OS !== 'web' && (!__DEV__ || !!extra?.posthogDev);

if (enabled && (!projectToken || !host) && __DEV__) {
  // Warn, never throw: analytics must not be able to take the game down. Usual cause: .env changed while
  // the dev server was running (Expo reads it at startup), so restart with `bunx expo start -c`.
  const variable = !projectToken ? 'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN' : 'EXPO_PUBLIC_POSTHOG_HOST';
  console.warn(`[posthog] ${variable} is missing, so analytics is off. Set it in .env (and EAS env vars) and restart the dev server with a clean cache.`);
}

const client = enabled && projectToken && host
  ? new PostHog(projectToken, {
      host,
      captureAppLifecycleEvents: true,
      // anonymous by design: the app never calls identify(), so no person profiles
      personProfiles: 'identified_only',
      logs: {
        serviceName: 'rapid-slush-mobile',
        environment: __DEV__ ? 'development' : 'production',
        serviceVersion: Constants.expoConfig?.version,
      },
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
    })
  : undefined;

// debug logging is a method in posthog-react-native 4 (not a constructor option)
if (__DEV__) client?.debug(true);

export const posthog = client;
