import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { lives, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The rules for playing Rapid Slush: lives, coins, fair play and what happens to your progress.',
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
          Rapid Slush is free, and nothing in it is for sale. The game is still being built: levels, rewards and balances may change, and a
          version may have bugs. The game is provided as it is.
        </p>
      </Part>

      <Part id="lives" title="Lives and coins">
        <ul>
          <li>You hold up to {lives.max} lives. Winning a level costs nothing, and replaying a level you have already beaten is always free.</li>
          <li>A level you have not beaten yet takes a life when it starts and gives it back if you win. Quitting or closing the app during that round still uses it.</li>
          <li>If the app closes in the first five seconds of a round, its life is returned the next time you open the game.</li>
          <li>One life comes back every {lives.refillMinutes} minutes. Setting your phone&rsquo;s clock back restarts that wait.</li>
          <li>Coins are earned by playing. They refill every life at once for {lives.refillCoins} coins and unlock cups and machine skins, which change how the game looks, never how it plays.</li>
          <li>Lives and coins are items inside the game. They have no cash value and cannot be bought, sold, transferred or exchanged for money.</li>
        </ul>
      </Part>

      <Part id="fair-play" title="Fair play">
        <p>
          Do not cheat, modify the app, use automated play or exploit bugs for lives, coins or scores. We may remove what was gained that way.
        </p>
      </Part>

      <Part id="progress" title="Your progress">
        <p>Your progress is stored on your phone. Uninstalling the app or resetting your progress deletes it, and we cannot restore it.</p>
      </Part>

      <Part id="changes" title="Changes and ending the game">
        <p>
          We may change the game and these terms. Changes that matter are announced in the app or on this website before they apply. If we
          ever add anything for sale, these terms will cover it before it reaches you.
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
