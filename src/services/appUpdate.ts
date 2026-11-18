// Update plumbing, two layers:
//  - EAS OTA (expo-updates): JS-only fixes ship past the store. Checked on every launch; fetched quietly and applied
//    on the next cold start — never reloaded mid-session, so a round can't be interrupted.
//  - Google Play in-app updates (expo-in-app-updates): new native binaries via Play's own update sheet. Android
//    store builds only; a silent no-op in dev, on web and on sideloaded APKs (where Play has nothing to offer).
import { Platform } from 'react-native';
import * as InAppUpdates from 'expo-in-app-updates';
import * as Updates from 'expo-updates';

import { toast } from '@/game/ui-store';

export async function checkOta() {
  if (__DEV__ || Platform.OS === 'web') return;
  try {
    if (!(await Updates.checkForUpdateAsync()).isAvailable) return;
    await Updates.fetchUpdateAsync();
    toast('Update downloaded. It applies the next time you open Rapid Slush');
  } catch {
    // offline or EAS unreachable: the embedded bundle keeps working
  }
}

export async function checkStoreUpdate() {
  if (__DEV__ || Platform.OS !== 'android') return;
  try {
    await InAppUpdates.checkAndStartUpdate();
  } catch {
    // sideloaded APK or Play unavailable: there is no store update to offer
  }
}
