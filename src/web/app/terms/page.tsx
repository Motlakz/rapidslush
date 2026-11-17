import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { economy, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The rules for playing Rapid Slush: tokens, coins, purchases, fair play and what happens to your progress.',
};

export default function Terms() {
  return (
    <DocPage title="Terms of use" lead="The rules for playing Rapid Slush, in plain words.">
      <Part id="agreement" title="Agreeing to these terms">
        <p>
          By playing Rapid Slush or using this website you agree to these terms. If you are under the age of majority where you live, a parent or
          guardian must agree to them for you. The game is made by {site.operator}.
        </p>
      </Part>

      <Part id="game" title="The game">
        <p>
          Rapid Slush is free to play. Test versions are still being built: levels, prices and balances may change, and a test version may have
          bugs. The game is provided as it is.
        </p>
      </Part>

      <Part id="tokens" title="Tokens and coins">
        <ul>
          <li>Tokens and coins are items inside the game. They have no cash value and cannot be sold, transferred or exchanged for money.</li>
          <li>A round costs {economy.roundCost} tokens, taken when the round starts. Leaving a round partway still uses them.</li>
          <li>If the app closes before a round has run five seconds, its tokens are returned the next time you open the game.</li>
          <li>Free tokens refill once a day, up to a balance of {economy.freeCap}. Rounds use free tokens before bought ones.</li>
          <li>Bought tokens never expire.</li>
          <li>Coins are earned by playing and unlock cups and machine skins. They change how the game looks, never how it plays.</li>
        </ul>
      </Part>

      <Part id="purchases" title="Purchases">
        <p>
          Token packs are bought through your app store, which shows the price before you pay and whose own terms also apply. Refunds are covered
          on the <a className="link" href="/purchases/">Purchases and refunds</a> page.
        </p>
      </Part>

      <Part id="fair-play" title="Fair play">
        <p>
          Do not cheat, modify the app, use automated play or exploit bugs for tokens, coins or scores. We may remove what was gained that way.
        </p>
      </Part>

      <Part id="progress" title="Your progress">
        <p>Your progress is stored on your phone. Uninstalling the app or resetting your progress deletes it, and we cannot restore it.</p>
      </Part>

      <Part id="changes" title="Changes and ending the game">
        <p>
          We may change the game and these terms. Changes that matter are announced in the app or on this website before they apply. If we ever
          stop running the game, we will say beforehand how unused bought tokens are handled.
        </p>
      </Part>

      <Part id="law" title="Your rights and the law">
        <p>
          Nothing in these terms limits rights you have under consumer law, such as South Africa&rsquo;s Consumer Protection Act. These terms are
          governed by the law of South Africa.
        </p>
      </Part>

      <Part id="contact" title="Contact">
        <p>Write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a>.</p>
      </Part>
    </DocPage>
  );
}
