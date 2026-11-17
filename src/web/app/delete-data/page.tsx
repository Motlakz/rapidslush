import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Delete your data',
  description: 'How to delete everything Rapid Slush keeps: reset it in the game or uninstall the app.',
};

export default function DeleteData() {
  return (
    <DocPage title="Delete your data" lead="Everything Rapid Slush keeps is on your phone, so you can delete it yourself in under a minute.">
      <Part id="in-game" title="Delete it in the game">
        <ol>
          <li>Open Rapid Slush and tap the settings button at the top right of the home screen.</li>
          <li>Tap Reset progress, then tap it again to confirm.</li>
        </ol>
        <p>
          This erases your progress, token and coin balances, their history, your unlocked cups and skins, and your settings on that phone,
          including any bought tokens. It cannot be undone.
        </p>
      </Part>

      <Part id="uninstall" title="Or uninstall the app">
        <p>Uninstalling Rapid Slush deletes everything it stored on your phone.</p>
      </Part>

      <Part id="servers" title="Data on our servers">
        <p>
          The current version stores nothing on our servers, so there is nothing for us to delete. When the game starts keeping anything online,
          this page will explain how to ask us to delete it and list anything the law requires us to keep, such as purchase records.
        </p>
      </Part>
    </DocPage>
  );
}
