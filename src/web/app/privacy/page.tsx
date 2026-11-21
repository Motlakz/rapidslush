import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { analytics, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What the Rapid Slush game and website keep, what the app sends for anonymous analytics, and how to remove it.',
};

export default function Privacy() {
  return (
    <DocPage title="Privacy policy" lead="Rapid Slush keeps your game on your phone and sends anonymous play statistics, never anything that names you. This page says exactly what that covers.">
      <Part id="who" title="Who we are">
        <p>Rapid Slush is made by {site.operator} (&ldquo;we&rdquo;). This policy covers the Rapid Slush app for Android and this website.</p>
        <p>For a privacy question, write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a>.</p>
      </Part>

      <Part id="app" title="What the app keeps on your phone">
        <p>The first time you open the game it creates a random player number. Alongside it, the game keeps:</p>
        <ul>
          <li>your progress: levels, stars, best scores and player level;</li>
          <li>your lives and coins, with a history of what earned or spent your coins;</li>
          <li>the cups and machine skins you have unlocked, and today&rsquo;s challenge;</li>
          <li>your settings: sound, volume, vibration and reduced effects.</li>
        </ul>
        <p>This stays on your phone. The player number is never sent anywhere.</p>
      </Part>

      <Part id="analytics" title="Anonymous analytics and crash reports">
        <p>
          To see which levels are too hard and to fix crashes, the app sends usage statistics to {analytics.provider}, an analytics service that
          stores them for us in {analytics.region}. They are tied to a random ID that {analytics.provider} creates on your phone, not to your name,
          email or any account. Resetting your progress in the game starts a new ID.
        </p>
        <p>The app sends:</p>
        <ul>
          <li>what happens in play: a level started, won or lost, a life spent or refilled, a spill, a setting changed, an item unlocked;</li>
          <li>when the app is installed, updated, opened or sent to the background;</li>
          <li>crash and error reports, and short technical logs, when something goes wrong;</li>
          <li>your phone&rsquo;s model, Android version, language, screen size and the app&rsquo;s version.</li>
        </ul>
        <p>
          Like any internet service, {analytics.provider} receives your phone&rsquo;s IP address when the app connects, and uses it to estimate
          your country. We use these statistics only to improve the game. We do not sell them, use them for advertising or combine them with
          other data. {analytics.provider}&rsquo;s own <a className="link" href={analytics.privacyUrl} rel="noopener">privacy policy</a> covers how it
          handles them.
        </p>
      </Part>

      <Part id="updates" title="Game updates">
        <p>
          When the app opens it asks Expo, the service that delivers our small updates, whether a newer version of the game is ready, and Google
          Play whether a store update is waiting. Those checks send the app&rsquo;s version and your phone&rsquo;s platform, nothing about your game.
        </p>
      </Part>

      <Part id="not" title="What the app does not collect">
        <p>
          There is no account and no sign-in. The app does not ask for or read your name, email address, contacts, location, photos, camera,
          microphone, files or advertising ID, and it shows no ads. It asks Android only for network access, sound settings and vibration.
        </p>
      </Part>

      <Part id="purchases" title="Purchases">
        <p>The game sells nothing, so it handles no payments or card details. If that ever changes, we will update this policy before it does.</p>
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
          Your game data is on your phone, so you control it: reset your progress in the game&rsquo;s Settings, or uninstall the app. The{' '}
          <a className="link" href="/delete-data/">Delete your data</a> page has the steps, and explains what happens to the anonymous statistics.
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
