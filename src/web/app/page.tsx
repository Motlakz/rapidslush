// The candy shack home: a dispenser pours the hero cup full, the flavours run across a berry
// band, the shack's numbers count up on a mango band, the two machines sit in polaroid frames,
// the rush is a bento of candy cards, the shack's day passes under a pinned scroll, and questions.
import { AtGlance } from '@/components/AtGlance';
import { CandyMotion } from '@/components/CandyMotion';
import { HeroCup } from '@/components/HeroCup';
import { Loader } from '@/components/Loader';
import { RushBento } from '@/components/RushBento';
import { ShackScene } from '@/components/ShackScene';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { Ticker } from '@/components/Ticker';
import { PlayButton } from '@/components/PlayButton';
import { economy, game } from '@/lib/site';

const FAQ = [
  ['Is Rapid Slush free?', `Yes. You get ${economy.dailyFree} free tokens every day and a round costs ${economy.roundCost}. Token packs are optional.`],
  ['Do bought tokens expire?', 'No. They stay until you use them, and the daily refill never touches them.'],
  ['What if the app closes mid-round?', 'If the round had run under five seconds, its tokens come back the next time you open the game.'],
  ['Does it need the internet?', 'No. Rounds play offline, and your progress saves on your phone.'],
  ['Are there ads?', 'No forced ads, in any round or menu. The shack is an ad-free workplace.'],
] as const;

export default function Home() {
  return (
    <>
      <Loader />
      <SiteNav />
      <main id="top">
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <div className="hero__kicker-row">
                <span className="chip"><span className="dot" style={{ background: 'var(--berry)' }} />Free on Google Play</span>
                <span className="chip"><span className="dot" style={{ background: 'var(--razz)' }} />{game.beltLevels + game.spinLevels} levels · 2 machines</span>
                <span className="chip"><span className="dot" style={{ background: 'var(--lime)' }} />No ads, ever</span>
              </div>
              <h1 id="hero-h">Pour it.<br />Stack <span className="fz">it.</span><br />Serve it <span className="stroke">cold.</span></h1>
              <p className="hero__lead">A slush arcade game at a beach shack that never closes. Hold the tap, let go on the line, and keep the whole queue smiling — one perfect cup at a time.</p>
              <div className="hero__cta">
                <PlayButton xl />
                <a className="btn btn--mango" href="#machines">See the machines</a>
              </div>
              <p className="hero__note">{economy.dailyFree} free tokens every day. Bought tokens never expire.</p>
            </div>
            <HeroCup />
          </div>
        </section>

        <Ticker />

        <AtGlance />

        {/* MACHINES */}
        <section id="machines" aria-labelledby="machines-h">
          <div className="wrap">
            <p className="kicker io" style={{ color: 'var(--razz-deep)' }}>01 · The machines</p>
            <h2 id="machines-h" className="io" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Two machines, one rush</h2>
            <div className="machines__grid">
              <figure className="pol pol--wide io tilt" style={{ '--rot': '-1.2deg' } as React.CSSProperties}>
                <span className="pol__tag">{game.beltLevels} levels</span>
                <img src="/img/machine-line.webp" alt="The Slush Line at golden hour: mango, grape and cola taps over a belt of cups" loading="lazy" />
                <figcaption>
                  <h3>The Slush Line</h3>
                  <p>A conveyor, up to three taps, and a queue that never blinks. Pour to the line and send the cups out before the belt moves on.</p>
                </figcaption>
              </figure>
              <figure className="pol pol--tall io tilt" style={{ '--rot': '1.4deg' } as React.CSSProperties}>
                <span className="pol__tag">Opens at level {game.spinUnlock}</span>
                <img src="/img/machine-spin.webp" alt="The Spin Bar at night: five flavour hoppers feeding one nozzle over a turntable" loading="lazy" />
                <figcaption>
                  <h3>The Spin Bar</h3>
                  <p>{game.spinLevels} levels on a turntable: pick the flavour while the cup spins past, five ways to get it wrong.</p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <RushBento />

        <ShackScene />

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h">
          <div className="wrap faq__grid">
            <div className="faq__intro">
              <p className="kicker io" style={{ color: 'var(--lime-deep)' }}>04 · Questions</p>
              <h2 id="faq-h" className="io" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Before your first shift</h2>
              <p className="io" style={{ marginTop: '1rem', lineHeight: 1.6, opacity: .85 }}>The short answers. Everything else you learn on the line.</p>
            </div>
            <div className="faq__list">
              {FAQ.map(([q, a], i) => (
                <details className="io" key={q} open={i === 0}>
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
            <h2 id="close-h" className="io">Your shift starts now</h2>
            <svg className="close__mark io" viewBox="0 0 64 72" aria-hidden="true">
              <path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" fill="#fff6e5" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
              <path d="M14 34h36l-3 24a8 8 0 0 1-8 6H25a8 8 0 0 1-8-6z" fill="#ffc226" />
              <path d="M40 14l8-10" stroke="#4a0e33" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="close__word io" id="closeWord">Rapid Slush</p>
            <PlayButton xl paper />
          </div>
        </section>
      </main>
      <SiteFooter />
      <CandyMotion />
    </>
  );
}
