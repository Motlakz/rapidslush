// The candy shack home: a dispenser pours the hero cup full, the flavours run across a berry
// band, the shack's numbers count up on a mango band, the two machines sit in polaroid frames,
// the rush is a bento of candy cards, the shack's day passes under a pinned scroll, and questions.
import { AtGlance } from '@/components/AtGlance';
import { CandyMotion } from '@/components/CandyMotion';
import { RushBento } from '@/components/RushBento';
import { ShackScene } from '@/components/ShackScene';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { Ticker } from '@/components/Ticker';
import { PlayButton } from '@/components/PlayButton';
import { game, lives } from '@/lib/site';

const FAQ = [
  ['Is Rapid Slush free?', 'Yes, all of it. There is nothing to buy: no packs, no shop, no paid extras.'],
  ['What are lives?', `You hold up to ${lives.max}. Failing a level you haven't beaten yet costs one, and winning costs nothing. One comes back every ${lives.refillMinutes} minutes.`],
  ['What if I run out?', `Wait for the next one, refill every heart with ${lives.refillCoins} coins earned on shift, or replay levels you've already beaten: those are always free.`],
  ['Does it need the internet?', 'No. Rounds play offline, and your progress saves on your phone.'],
  ['Are there ads?', 'No. Not in a round, not in a menu, not between levels.'],
] as const;

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        {/* HERO: the game's name, what it is, and a real round at golden hour */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <div className="hero__kicker-row">
                <span className="chip"><span className="dot" style={{ background: 'var(--berry)' }} />Free on Google Play</span>
                <span className="chip"><span className="dot" style={{ background: 'var(--lime)' }} />No ads, nothing to buy</span>
              </div>
              <h1 id="hero-h">Rapid Slush<span className="hero__h1-sub">the beach-shack slush game</span></h1>
              <p className="hero__lead">Hold the tap, let go on the line, and get every order out before the belt moves on. {game.beltLevels + game.spinLevels} levels on two machines, from noon until the string lights come on.</p>
              <div className="hero__cta">
                <PlayButton xl />
                <a className="btn btn--mango" href="#machines">See the machines</a>
              </div>
              <p className="hero__note">{lives.max} lives, one back every {lives.refillMinutes} minutes. Replaying a level you've beaten is always free.</p>
            </div>
            <div className="hero__art">
              <span className="blob blob--razz" aria-hidden="true" />
              <span className="blob blob--mango" aria-hidden="true" />
              <span className="blob blob--lime" aria-hidden="true" />
              <div className="device">
                <img src="/img/shift-golden.webp" width={1600} height={760} alt="A round of Rapid Slush at golden hour: berry, lime and grape taps over a belt of cups, one layered and topped with whip" />
                <span className="device__sticker" aria-hidden="true">Perfect!</span>
              </div>
            </div>
          </div>
        </section>

        <Ticker />

        <AtGlance />

        {/* MACHINES */}
        <section id="machines" aria-labelledby="machines-h">
          <div className="wrap">
            <p className="kicker" style={{ color: 'var(--razz-deep)' }}>01 · The machines</p>
            <h2 id="machines-h" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Two machines, one rush</h2>
            <div className="machines__grid">
              <article className="pol">
                <h3>The Slush Line</h3>
                <p>A conveyor, up to three taps, and a queue that never blinks. Pour to the line and send the cups out before the belt moves on.</p>
                <div className="pol__shot">
                  <span className="pol__tag">{game.beltLevels} levels</span>
                  <img src="/img/machine-line.webp" alt="The Slush Line at golden hour: mango, grape and cola taps over a belt of cups" loading="lazy" />
                </div>
              </article>
              <article className="pol">
                <h3>The Spin Bar</h3>
                <p>{game.spinLevels} levels on a turntable, open from level {game.spinUnlock}: pick the flavour while the cup spins past. Five ways to get it wrong.</p>
                <div className="pol__shot">
                  <span className="pol__tag pol__tag--grape">Opens at level {game.spinUnlock}</span>
                  <img src="/img/machine-spin.webp" alt="The Spin Bar at night: five flavour hoppers feeding one nozzle over a turntable" loading="lazy" />
                </div>
              </article>
            </div>
          </div>
        </section>

        <RushBento />

        <ShackScene />

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h">
          <div className="wrap faq__grid">
            <div className="faq__intro">
              <p className="kicker" style={{ color: 'var(--lime-deep)' }}>04 · Questions</p>
              <h2 id="faq-h" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Before your first shift</h2>
              <p style={{ marginTop: '1rem', lineHeight: 1.6, opacity: .85 }}>The short answers. Everything else you learn on the line.</p>
            </div>
            <div className="faq__list">
              {FAQ.map(([q, a], i) => (
                <details key={q} open={i === 0}>
                  <summary>{q} <span className="plus">+</span></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="close" aria-labelledby="close-h">
          <div className="wrap">
            <h2 id="close-h">Your shift starts now</h2>
            <svg className="close__mark" viewBox="0 0 64 72" aria-hidden="true">
              <path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" fill="#fff6e5" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
              <path d="M14 34h36l-3 24a8 8 0 0 1-8 6H25a8 8 0 0 1-8-6z" fill="#ffc226" />
              <path d="M40 14l8-10" stroke="#4a0e33" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="close__word" id="closeWord">Rapid Slush</p>
            <PlayButton xl paper />
          </div>
        </section>
      </main>
      <SiteFooter />
      <CandyMotion />
    </>
  );
}
