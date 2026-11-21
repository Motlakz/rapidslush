import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { lives, site } from '@/lib/site';

// The game sells nothing since lives replaced tokens (2026-11-20). The page keeps its address so older links
// (store listing, earlier policy versions) still land somewhere that answers the question.
export const metadata: Metadata = {
  title: 'Purchases',
  description: 'Rapid Slush sells nothing: there are no in-app purchases, and lives and coins are earned by playing.',
};

export default function Purchases() {
  return (
    <DocPage title="Purchases" lead="Rapid Slush has no in-app purchases. Everything in the game is earned by playing.">
      <Part id="nothing" title="Nothing is for sale">
        <p>
          There are no token packs, coin packs or paid extras. Lives come back on their own, one every {lives.refillMinutes} minutes, and the
          coins that refill them or unlock cups and machine skins are earned on shift: {lives.milestoneCoins} for the first clear of every fifth
          level, and {lives.challengeCoins} plus a life for the daily challenge.
        </p>
      </Part>

      <Part id="earlier" title="Earlier test versions">
        <p>
          Early test versions had a token shop as a demonstration. It never charged anyone, and it was removed when lives replaced tokens.
        </p>
      </Part>

      <Part id="charged" title="If you were charged">
        <p>
          Rapid Slush never takes payments, so a charge that names it is a mistake or another app. Check the order in Google Play&rsquo;s order
          history, and write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a> with what
          you see. We will help you sort it out.
        </p>
      </Part>
    </DocPage>
  );
}
