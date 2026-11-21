import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { analytics, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Delete your data',
  description: 'How to delete everything Rapid Slush keeps on your phone, and what happens to its anonymous statistics.',
};

export default function DeleteData() {
  return (
    <DocPage title="Delete your data" lead="Everything Rapid Slush keeps about your game is on your phone, so you can delete it yourself in under a minute.">
      <Part id="in-game" title="Delete it in the game">
        <ol>
          <li>Open Rapid Slush and tap the settings button at the top right of the home screen.</li>
          <li>Tap Reset progress, then tap it again to confirm.</li>
        </ol>
        <p>
          This erases your progress, lives, coins and their history, your unlocked cups and skins, and your settings on that phone. It also
          gives the app a new anonymous analytics ID, so nothing from then on links to your earlier play. It cannot be undone.
        </p>
      </Part>

      <Part id="uninstall" title="Or uninstall the app">
        <p>Uninstalling Rapid Slush deletes everything it stored on your phone.</p>
      </Part>

      <Part id="statistics" title="Anonymous statistics">
        <p>
          The usage statistics and crash reports the app sends to {analytics.provider} carry only a random ID, never your name, email or an
          account, so we cannot pick out which ones are yours. We use them only to improve the game and delete them when they are no longer
          needed for that.
        </p>
        <p>
          Resetting your progress or uninstalling the app removes the ID from your phone, and after that the statistics already sent can no
          longer be connected to it. For any question about them, write to the developer email on our{' '}
          <a className="link" href={site.playUrl} rel="noopener">Google Play page</a>.
        </p>
      </Part>

      <Part id="servers" title="Other data on our servers">
        <p>The game keeps no accounts and no saved games on our servers, so there is nothing else for us to delete.</p>
      </Part>
    </DocPage>
  );
}
