/*
  type: software (site-kind gaming)
  The stage: the prototype's 3D Slush Line (three.js), playable on the first screen and pinned through the scroll,
  where GSAP drives the camera through one layered order. Then the two machines (in-engine captures opening from a
  clip), the shack's day from noon to night (scroll-driven) and questions.
*/
import { ActionBar } from '@/components/ActionBar';
import { DayToNight } from '@/components/DayToNight';
import { Motion } from '@/components/Motion';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { SlushStage } from '@/components/stage/SlushStage';
import { economy, game } from '@/lib/site';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        <SlushStage />

        {/* MACHINES: the two machines, real in-engine captures opening into their frames */}
        <section className="section ground-inverse machines" id="machines" aria-labelledby="machines-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="machines-h" data-split>Two machines, one rush</h2>
              <p>The Slush Line runs {game.beltLevels} levels on a conveyor with up to three taps. Clear level {game.spinUnlock} and the Spin Bar opens: {game.spinLevels} levels on a turntable with one nozzle and five flavours.</p>
            </div>
            <div className="grid machines__grid">
              <figure className="frame frame--photo span-7 machines__frame" data-reveal>
                <img className="frame__img" src="/img/machine-line.webp" alt="The Slush Line at golden hour: Mango, Grape and Cola taps over a belt of soda glasses" loading="lazy" data-source="client" data-subject="in-engine capture" />
              </figure>
              <figure className="frame frame--photo span-5 machines__frame machines__frame--tall" data-reveal>
                <img className="frame__img" src="/img/machine-spin.webp" alt="The Spin Bar at night: five flavour hoppers feeding one nozzle over a turntable of milkshake glasses" loading="lazy" data-source="client" data-subject="in-engine capture" />
              </figure>
            </div>
          </div>
        </section>

        <DayToNight />

        {/* FAQ: every answer open */}
        <section className="section" id="faq" aria-labelledby="faq-h">
          <div className="wrap grid grid--top">
            <div className="span-5 stack-4">
              <h2 id="faq-h" data-split>Questions</h2>
              <p className="muted">The short answers before your first shift.</p>
            </div>
            <div className="faq span-7" data-rise>
              <div className="faq__item"><h3>Is Rapid Slush free?</h3><p>Yes. You get {economy.dailyFree} free tokens every day and a round costs {economy.roundCost}. Token packs are optional.</p></div>
              <div className="faq__item"><h3>Do bought tokens expire?</h3><p>No. They stay until you use them, and the daily refill never touches them.</p></div>
              <div className="faq__item"><h3>What if the app closes mid-round?</h3><p>If the round had run under five seconds, its tokens come back the next time you open the game.</p></div>
              <div className="faq__item"><h3>Does it need the internet?</h3><p>No. Rounds play offline.</p></div>
              <div className="faq__item"><h3>Where is my progress saved?</h3><p>On your phone. Uninstalling the game deletes it.</p></div>
              <div className="faq__item"><h3>Are there ads?</h3><p>No forced ads, in any round or menu.</p></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
      <Motion />
    </>
  );
}
