// Analytics facade (plan §13): the one place events go. Each is kept in a ring buffer for the dev panel and
// forwarded to PostHog (anonymous; native release builds only, see ./posthog).
import { posthog } from './posthog';

type PostHogProperties = NonNullable<Parameters<NonNullable<typeof posthog>['capture']>[1]>;

export interface TrackedEvent { t: string; name: string; props: Record<string, unknown> }

const LOG: TrackedEvent[] = [];

export function track(name: string, props: Record<string, unknown> = {}) {
  LOG.push({ t: new Date().toISOString().slice(11, 19), name, props });
  if (LOG.length > 200) LOG.shift();
  try { posthog?.capture(name, props as PostHogProperties); } catch { /* analytics must never take the game down */ }
  if (__DEV__) console.debug('[track]', name, props);
}

export const recentEvents = (n = 14) => LOG.slice(-n).reverse();
