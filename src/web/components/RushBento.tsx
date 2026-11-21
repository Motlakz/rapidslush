// "The rush": the game's hooks as a bento of candy cards, each with its own small living
// picture — the pour loop, the ×3 thump, the toppings cycling, the cups bobbing (CandyMotion).
import { game } from '@/lib/site';

export function RushBento() {
  return (
    <section id="rush" aria-labelledby="rush-h">
      <div className="wrap">
        <p className="kicker" style={{ color: 'var(--berry-deep)' }}>02 · The rush</p>
        <h2 id="rush-h" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Easy to pour, hard to put down</h2>
        <div className="rush__grid">
          <article className="card c--berry sp-7">
            <span className="card__ix">01</span>
            <h3>Pour to the line</h3>
            <p>Hold the tap and the flow speeds up. It keeps dripping after you let go — stop a little early and land it in the band.</p>
            <svg className="card__art" viewBox="0 0 200 150" aria-hidden="true">
              <defs><clipPath id="pc"><path d="M62 52h56l-9 88a8 8 0 0 1-8 7H79a8 8 0 0 1-8-7z" /></clipPath></defs>
              <rect x="82" y="4" width="8" height="26" rx="4" fill="#4a0e33" opacity=".5" />
              <path id="stream" d="M86 30v14" stroke="#ff4d8d" strokeWidth="6" strokeLinecap="round" />
              <g clipPath="url(#pc)"><rect id="poolFill" x="62" y="52" width="56" height="38" fill="#ff4d8d" /></g>
              <path d="M62 52h56l-9 88a8 8 0 0 1-8 7H79a8 8 0 0 1-8-7z" fill="none" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
              <rect x="62" y="84" width="56" height="3" fill="#4a0e33" />
            </svg>
          </article>
          <article className="card c--mango sp-5">
            <span className="card__ix">02</span>
            <h3>Streaks pay triple</h3>
            <p>Perfects stack. Keep the band centred and the score climbs up to three times.</p>
            <div id="x3" style={{ marginTop: 'auto', alignSelf: 'end', fontFamily: 'var(--disp)', fontSize: '4.6rem', color: 'var(--mango-deep)' }}>×3</div>
          </article>
          <article className="card c--razz sp-4">
            <span className="card__ix">03</span>
            <h3>Layered orders</h3>
            <p>From level 20, one flavour under the next, each up to its own mark.</p>
            <svg className="card__art" viewBox="0 0 160 110" aria-hidden="true">
              <defs><clipPath id="lc"><path d="M42 30h76l-10 70a7 7 0 0 1-7 6H59a7 7 0 0 1-7-6z" /></clipPath></defs>
              <g clipPath="url(#lc)">
                <rect x="42" y="78" width="76" height="28" fill="#35b6f5" />
                <rect x="42" y="60" width="76" height="18" fill="#a06bf5" />
                <rect x="42" y="44" width="76" height="16" fill="#8ed94a" />
              </g>
              <path d="M42 30h76l-10 70a7 7 0 0 1-7 6H59a7 7 0 0 1-7-6z" fill="none" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </article>
          <article className="card c--lime sp-4">
            <span className="card__ix">04</span>
            <h3>Top it off</h3>
            <p>{game.toppings[0]}, {game.toppings[1]}, {game.toppings[2]} or {game.toppings[3].toLowerCase()} — the window asks, you add it before the cups go out.</p>
            <div className="badges" style={{ marginTop: 'auto' }}>
              {game.toppings.map(t => <span className="badge rush-chip" key={t}>{t}</span>)}
            </div>
          </article>
          <article className="card c--grape sp-4">
            <span className="card__ix">05</span>
            <h3>Make it yours</h3>
            <p>{game.cups} cup designs and {game.skins} machine skins. Unlock the extras with coins you earn on shift.</p>
            <svg className="card__art" viewBox="0 0 180 96" aria-hidden="true">
              <defs><clipPath id="cc"><path d="M0 18h30l-5 56a5 5 0 0 1-5 4h-15a5 5 0 0 1-5-4z" /></clipPath></defs>
              <g className="cuprow">
                <g transform="translate(10 0)"><g clipPath="url(#cc)"><rect y="50" width="30" height="30" fill="#ff4d8d" /></g><path d="M0 18h30l-5 56a5 5 0 0 1-5 4h-15a5 5 0 0 1-5-4z" fill="none" stroke="#4a0e33" strokeWidth="3.5" strokeLinejoin="round" /></g>
                <g transform="translate(56 0)" opacity=".55"><g clipPath="url(#cc)"><rect y="50" width="30" height="30" fill="#35b6f5" /></g><path d="M0 18h30l-5 56a5 5 0 0 1-5 4h-15a5 5 0 0 1-5-4z" fill="none" stroke="#4a0e33" strokeWidth="3.5" strokeLinejoin="round" /></g>
                <g transform="translate(102 0)" opacity=".55"><g clipPath="url(#cc)"><rect y="50" width="30" height="30" fill="#ffc226" /></g><path d="M0 18h30l-5 56a5 5 0 0 1-5 4h-15a5 5 0 0 1-5-4z" fill="none" stroke="#4a0e33" strokeWidth="3.5" strokeLinejoin="round" /></g>
                <g transform="translate(148 0)" opacity=".55"><g clipPath="url(#cc)"><rect y="50" width="30" height="30" fill="#8ed94a" /></g><path d="M0 18h30l-5 56a5 5 0 0 1-5 4h-15a5 5 0 0 1-5-4z" fill="none" stroke="#4a0e33" strokeWidth="3.5" strokeLinejoin="round" /></g>
              </g>
            </svg>
          </article>
          <article className="card card--wide sp-12">
            <div>
              <span className="card__ix">06</span>
              <h3>Made for the shift</h3>
              <p>Plays offline, saves on your phone, never shows an ad, and has nothing for sale. Beaten levels replay free, forever.</p>
            </div>
            <div className="badges">
              <span className="badge badge--lime">Offline</span>
              <span className="badge badge--razz">No ads</span>
              <span className="badge badge--mango">Nothing to buy</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
