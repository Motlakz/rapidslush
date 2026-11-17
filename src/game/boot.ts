// Startup (plan §1: playing within 30 seconds). Load the save, recover interrupted sessions, then either drop a new
// player straight into Level 1 with their welcome refill, or show Home.
import { track } from '@/services/analytics';
import { Sound } from '@/services/feedback';
import { isFirstLaunch, loadSave } from '@/services/save';
import { Server } from '@/services/server';
import { SHOWCASE, newAttract } from './controller';
import type { Overlay } from './ui-store';
import { show, toast } from './ui-store';

export async function boot() {
  await loadSave();
  const first = isFirstLaunch();
  const { refunded } = Server.bootstrap();
  newAttract();
  Sound.preload();
  if (SHOWCASE) { // dev capture mode: the game alone, or one named panel over it
    show(SHOWCASE.ui ? ({ name: SHOWCASE.ui } as Overlay) : { name: 'none' });
    return;
  }
  track('app_opened', { first });
  if (first) {
    const c = Server.claimDaily();
    track('tutorial_started');
    show({ name: 'intro', n: 1, m: 'belt' });
    if (c.amount) toast(`Welcome! +${c.amount} free tokens`);
  } else {
    show({ name: 'home' });
    if (refunded) toast(`Your last round was interrupted. ${refunded} tokens refunded`);
  }
}
