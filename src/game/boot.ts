// Startup (plan §1: playing within 30 seconds). Load the save and every sound (behind the loading screen, which
// shows `onProgress`), recover interrupted sessions, then either drop a new player straight into Level 1 or show Home.
import { track } from '@/services/analytics';
import { checkOta, checkStoreUpdate } from '@/services/appUpdate';
import { Sound } from '@/services/feedback';
import { posthogLogger } from '@/services/posthogLogger';
import { isFirstLaunch, loadSave } from '@/services/save';
import { Server } from '@/services/server';
import { SHOWCASE, newAttract } from './controller';
import type { Overlay } from './ui-store';
import { show, toast } from './ui-store';

export async function boot(onProgress?: (f: number) => void) {
  await loadSave();
  onProgress?.(0.1);
  await Sound.load(f => onProgress?.(0.1 + 0.9 * f));
  const first = isFirstLaunch();
  const { refunded } = Server.bootstrap();
  newAttract();
  if (SHOWCASE) { // dev capture mode: the game alone, or one named panel over it
    show(SHOWCASE.ui ? ({ name: SHOWCASE.ui } as Overlay) : { name: 'none' });
    return;
  }
  track('app_opened', { first });
  posthogLogger.info('game_boot_completed', {
    first_launch: first,
    interrupted_session_refunded: refunded,
  });
  if (first) {
    track('tutorial_started');
    show({ name: 'intro', n: 1, m: 'belt' });
  } else {
    show({ name: 'home' });
    if (refunded) toast('Your last round was interrupted before it began. Its life is back');
  }
  // Updates run in the background; the Play sheet waits a beat so it never pops over the first paint.
  void checkOta();
  setTimeout(() => { void checkStoreUpdate(); }, 4000);
}
