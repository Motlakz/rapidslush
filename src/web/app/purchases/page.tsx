import type { Metadata } from 'next';

import { DocPage, Part } from '@/components/DocPage';
import { economy, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Purchases and refunds',
  description: 'Rapid Slush token packs, what each holds, how tokens are added and how to ask for a refund.',
};

export default function Purchases() {
  return (
    <DocPage title="Purchases and refunds" lead="Token packs are optional. Here is what each holds, how they are added and how refunds work.">
      <Part id="status" title="During the test">
        <p>In the current test version the token shop is a demonstration: tapping a pack adds test tokens and nothing is charged.</p>
      </Part>

      <Part id="packs" title="Token packs">
        <table>
          <thead><tr><th scope="col">Pack</th><th scope="col">Tokens</th><th scope="col">Price</th></tr></thead>
          <tbody>
            {economy.packs.map(p => (
              <tr key={p.name}><td>{p.name}</td><td className="num">{p.tokens}</td><td className="num">{p.price}</td></tr>
            ))}
          </tbody>
        </table>
        <p>Prices are in US dollars. Your app store shows the price in your currency, with any tax, before you pay.</p>
        <p>Your first purchase adds {economy.firstPurchaseBonus} bonus tokens, once.</p>
      </Part>

      <Part id="added" title="How tokens are added">
        <ul>
          <li>Tokens are added only after the store confirms the payment, and each purchase is added once.</li>
          <li>A payment the store is still processing shows as pending until it completes.</li>
          <li>Bought tokens never expire and are used after your free tokens.</li>
        </ul>
      </Part>

      <Part id="refunds" title="Refunds">
        <p>
          For a purchase made through Google Play, ask for a refund in Google Play&rsquo;s order history within 48 hours. After that, write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a> with
          the order number (it starts with GPA) and we will look at it.
        </p>
        <p>When a purchase is refunded, the tokens it added are removed from your bought tokens.</p>
      </Part>

      <Part id="problems" title="Missing tokens">
        <p>
          If a pack was charged but its tokens did not arrive, close and reopen the game. If they are still missing, write to the developer email on our <a className="link" href={site.playUrl} rel="noopener">Google Play page</a> with the order number
          and the player number from the bottom of the Wallet screen.
        </p>
      </Part>
    </DocPage>
  );
}
