// Analytics facade (plan §13). Events are kept in a ring buffer for the dev panel; PostHog plugs in here later.
export interface TrackedEvent { t: string; name: string; props: Record<string, unknown> }

const LOG: TrackedEvent[] = [];

export function track(name: string, props: Record<string, unknown> = {}) {
  LOG.push({ t: new Date().toISOString().slice(11, 19), name, props });
  if (LOG.length > 200) LOG.shift();
  if (__DEV__) console.debug('[track]', name, props);
}

export const recentEvents = (n = 14) => LOG.slice(-n).reverse();
