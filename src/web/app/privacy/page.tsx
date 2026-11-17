import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What the Rapid Slush game and website keep about you, where it stays and how to remove it.',
};

export default function Privacy() {
  return (
    <DocPage title="Privacy policy" lead="Rapid Slush keeps your game on your phone. This page says what that covers and what would change it.">
      <Part id="who" title="Who we are">
        <p>Rapid Slush is made by {site.operator} (&ldquo;we&rdquo;). This policy covers the Rapid Slush app for Android and this website.</p>
        <p>For a privacy question, write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a>.</p>
      </Part>

      <Part id="app" title="What the app keeps">
        <p>The first time you open the game it creates a random player number. Alongside it, the game keeps:</p>
        <ul>
          <li>your progress: levels, stars, best scores and player level;</li>
          <li>your token and coin balances, with a history of what added or spent them;</li>
          <li>the cups and machine skins you have unlocked, and today&rsquo;s challenge;</li>
          <li>your settings: sound, volume, vibration and reduced effects.</li>
        </ul>
        <p>All of this is stored on your phone. This version of the app does not send it to us or to anyone else.</p>
      </Part>

      <Part id="not" title="What the app does not collect">
        <p>
          There is no account and no sign-in. The app does not ask for or read your name, email address, contacts, location, photos, camera,
          microphone, files or advertising ID. It asks Android only for internet access, sound settings and vibration.
        </p>
      </Part>

      <Part id="purchases" title="Purchases">
        <p>In the current test version the token shop is a demonstration: nothing is charged.</p>
        <p>
          When real purchases start, Google Play will take the payment. We will receive a confirmation of what you bought, when, and its order
          number, never your card details. We will update this policy, naming any service that checks purchases for us, before purchases go live.
        </p>
      </Part>

      <Part id="analytics" title="Analytics and crash reports">
        <p>This version sends no analytics and no crash reports. Before we add either, we will update this policy and name the provider.</p>
      </Part>

      <Part id="website" title="This website">
        <p>
          The website has no accounts, forms, cookies or analytics. The server that hosts the pages keeps
          basic request logs, such as IP address and time, to keep the site running.
        </p>
      </Part>

      <Part id="children" title="Children">
        <p>Rapid Slush is not directed at children under 13, and we do not knowingly collect anything about them.</p>
      </Part>

      <Part id="rights" title="Your choices and rights">
        <p>
          Because the game&rsquo;s data stays on your phone, you control it: reset your progress in the game&rsquo;s Settings, or uninstall the
          app. The <a className="link" href="/delete-data/">Delete your data</a> page has the steps.
        </p>
        <p>
          Depending on where you live, laws such as South Africa&rsquo;s Protection of Personal Information Act or the GDPR give you the right to
          ask what we hold about you, to correct it and to have it deleted, and to complain to your data protection authority. In South Africa
          that is the Information Regulator.
        </p>
      </Part>

      <Part id="changes" title="Changes to this policy">
        <p>When this policy changes, we update the date at the top of the page. A change that adds a new use of your data is published before that feature reaches you.</p>
      </Part>
    </DocPage>
  );
}
