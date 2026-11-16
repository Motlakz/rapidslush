'use client';
// The home page's stage: the Slush Line in 3D, framed on one tap and one cup. First screen: hold the cup to pour with
// the game's own physics (the flow speeds up, it drips on after you let go; land in the band); each cup is judged,
// lidded and carried off, and the next brings another flavour. Scrolling pins the stage and GSAP drives the camera
// through one layered order: Blue Razz, then Berry, then served Perfect.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef, useState } from 'react';

import { POUR } from '@/lib/art';
import { game } from '@/lib/site';
import { PlayButton } from '../PlayButton';
import { CUP_H, NOZZLE_Y, R1, STATION_FLAVOURS, SW, TRAVEL, buildWorld, levelY, type CupObj, type World } from './scene';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Status = 'open' | 'perfect' | 'nice' | 'miss' | 'spilled';
interface Cup { o: CupObj | null; f: number; target: number; level: number; status: Status; poured: boolean; quiet: number; at: number }
const SLIDE = 0.8, TAP = 1, X = SW[TAP];
const STEPS = [
  { h: 'Pour to the line', p: 'Hold a tap and the flow speeds up. It keeps dripping after you let go, so stop a little early.' },
  { h: 'Stack the layers', p: 'From level 20, orders come layered: one flavour, then the next, each up to its own mark.' },
  { h: 'Serve it Perfect', p: 'Land near the middle of the band. A streak of Perfects multiplies your score up to three times.' },
];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The camera for a screen shape. t 0 = the hero (one tap, its hopper and cup beside the words), 1 = the story's
 *  close-up of the cup at `cx`. On a wide screen the cup sits right of the words, then left of the steps. */
function frame(aspect: number, t: number, cx: number) {
  const wide = aspect >= 1.2, phone = aspect < 0.75;
  const fov = phone ? 34 : 30, tan = Math.tan((fov * Math.PI) / 360);
  const d = lerp(wide ? 5.0 : phone ? 6.4 : 5.2, wide ? 2.3 : phone ? 3.4 : 2.9, t);
  const H = 2 * d * tan, W = H * aspect;
  const x = wide ? cx + lerp(-0.2, 0.17, t) * W : cx;
  const y = wide ? lerp(0.95, 0.42, t) : (phone ? lerp(-1.05, -0.5, t) : lerp(-0.55, -0.2, t)) + H / 2;
  return { fov, x, y, d };
}

export function SlushStage() {
  const scope = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tap = useRef<HTMLButtonElement>(null);
  const floatEl = useRef<HTMLDivElement>(null);
  const storyFloat = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState({ served: 0, streak: 0 });
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [said, setSaid] = useState('');
  const [tried, setTried] = useState(false);
  const [flavour, setFlavour] = useState(TAP);
  // what the scroll drives (GSAP tweens these numbers; the frame loop reads them)
  const story = useRef({ out: 0, x: TRAVEL, l1: 0, l2: 0, serve: 0, close: 0 });
  const holding = useRef(false);
  const mutedRef = useRef(false);
  const audio = useRef<{ ctx: AudioContext; buf: Record<string, AudioBuffer>; pour: GainNode } | null>(null);

  const sfx = (name: string, vol = 0.7) => {
    const a = audio.current;
    if (!a || mutedRef.current || !a.buf[name]) return;
    const src = a.ctx.createBufferSource(), g = a.ctx.createGain();
    src.buffer = a.buf[name]; g.gain.value = vol;
    src.connect(g).connect(a.ctx.destination); src.start();
  };
  const wakeAudio = async () => {
    if (audio.current) { if (audio.current.ctx.state === 'suspended') audio.current.ctx.resume(); return; }
    const ctx = new AudioContext(), pour = ctx.createGain();
    pour.gain.value = 0; pour.connect(ctx.destination);
    audio.current = { ctx, buf: {}, pour };
    await Promise.all(['pour_loop', 'perfect', 'serve', 'miss', 'spill_minor', 'slide'].map(async n => {
      try { audio.current!.buf[n] = await ctx.decodeAudioData(await (await fetch(`/sfx/${n}.wav`)).arrayBuffer()); } catch { /* stays silent */ }
    }));
    if (!audio.current?.buf.pour_loop) return;
    const loop = ctx.createBufferSource();
    loop.buffer = audio.current.buf.pour_loop; loop.loop = true; loop.connect(pour); loop.start();
  };

  useEffect(() => {
    try { const m = localStorage.getItem('rs.muted') === '1'; mutedRef.current = m; setMuted(m); } catch { /* sound on */ }
  }, []);

  // the world and its frame loop
  useEffect(() => {
    const cv = canvas.current, section = scope.current;
    if (!cv || !section) return;
    let w: World | null = null, raf = 0, alive = true, visible = true, last = performance.now(), now = 0;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    let flow = 0, holdT = 0, phase: 'in' | 'hold' = 'in', phaseT = 0, cupsServed = 1;
    let cup: Cup, prev: Cup | null = null, storyCup: CupObj | null = null;
    let vec: import('three').Vector3 | null = null;

    const project = (x: number, y: number) => {
      const v = vec!.set(x, y, 0).project(w!.camera), r = cv.getBoundingClientRect();
      return { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height };
    };
    const newCup = (prevF?: number): Cup => {
      const pool = [0, 1, 2, 3, 4].filter(f => f !== prevF);
      const f = prevF === undefined ? TAP : pool[Math.floor(Math.random() * pool.length)];
      return { o: null, f, target: 55 + 5 * Math.floor(Math.random() * 7), level: 0, status: 'open', poured: false, quiet: 0, at: 0 };
    };

    const judge = () => {
      const c = cup, err = c.level - c.target;
      const st: Status = c.level >= POUR.cap ? 'spilled' : Math.abs(err) <= POUR.tol * POUR.perfectShare ? 'perfect' : Math.abs(err) <= POUR.tol ? 'nice' : 'miss';
      c.status = st; c.at = now;
      const label = st === 'perfect' ? 'Perfect!' : st === 'nice' ? 'Nice' : st === 'spilled' ? 'Spilled' : err < 0 ? 'Too little' : 'Too much';
      const el = floatEl.current;
      if (el && w) {
        const p = project(X, CUP_H + 0.32);
        el.textContent = label; el.dataset.tone = st === 'perfect' ? 'perfect' : st === 'nice' ? 'ok' : 'miss';
        gsap.set(el, { left: p.x, top: p.y });
        gsap.fromTo(el, { autoAlpha: 0, scale: 0.4, yPercent: 30 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 0.45, ease: 'back.out(2.4)', overwrite: true });
        gsap.to(el, { autoAlpha: 0, yPercent: -80, delay: 1.1, duration: 0.35 });
      }
      setSaid(`${STATION_FLAVOURS[c.f].name}: ${label} ${Math.round(c.level)} of ${c.target}.`);
      setScore(s => ({ served: s.served + (st === 'perfect' || st === 'nice' ? 1 : 0), streak: st === 'perfect' ? s.streak + 1 : st === 'nice' ? s.streak : 0 }));
      if ((st === 'perfect' || st === 'nice') && c.o) {
        sfx(st === 'perfect' ? 'perfect' : 'serve', 0.6);
        c.o.lid.visible = true; c.o.straw.visible = true;
        gsap.fromTo(c.o.lid.position, { y: CUP_H + 0.45 }, { y: CUP_H, duration: 0.45, ease: 'bounce.out' });
        gsap.fromTo(c.o.straw.position, { y: CUP_H + 0.78 }, { y: CUP_H + 0.08, duration: 0.55, delay: 0.08, ease: 'bounce.out' });
      } else sfx(st === 'spilled' ? 'spill_minor' : 'miss', 0.5);
    };

    const place = (c: Cup, x: number) => {
      if (!w) return;
      if (!c.o) c.o = w.makeCup(c.target, POUR.tol);
      c.o.g.position.x = x;
      w.fill(c.o, [[c.f, 0, c.level]]);
      if (c.status === 'spilled') {
        const t = Math.min(1, (now - c.at) * 1.4);
        c.o.dome.scale.set(R1 * 1.04, 0.05, R1 * 1.04); c.o.dome.position.y = CUP_H - 0.01;
        c.o.drips.forEach((d, k) => { d.visible = true; d.scale.set(1, 0.3 + t * (1.2 - k * 0.25), 1); d.position.y = CUP_H - 0.06 - t * (0.12 + k * 0.03); });
        c.o.puddle.visible = true; c.o.puddle.scale.set(0.05 + 0.28 * t, 1, 0.05 + 0.2 * t);
        c.o.key = '';
      }
    };

    const fit = () => {
      if (!w) return;
      const r = cv.getBoundingClientRect();
      w.renderer.setSize(r.width, r.height, false);
      w.camera.aspect = r.width / r.height;
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!w || !visible) return;
      now += dt;
      const S = story.current, playing = S.out < 0.02;
      if (section.classList.contains('is-story') === playing) section.classList.toggle('is-story', !playing);

      // ---- the one playable cup (the game's stepFlow) ----
      phaseT += dt;
      if (phase === 'in' && phaseT >= SLIDE) { phase = 'hold'; phaseT = 0; }
      const open = phase === 'hold' && cup.status === 'open' && playing;
      if (holding.current && open) {
        holdT += dt;
        flow += (Math.min(POUR.flowMax, POUR.base + holdT * POUR.accel) - flow) * Math.min(1, dt * POUR.ramp);
      } else {
        holdT = 0;
        flow *= Math.exp(-dt * POUR.decay);
        if (flow < 0.5) flow = 0;
      }
      if (open && flow > 0) {
        cup.level = Math.min(POUR.cap, cup.level + flow * dt);
        cup.poured = true;
        if (cup.level >= POUR.cap) { flow = 0; holding.current = false; judge(); }
      }
      if (open && cup.status === 'open' && cup.poured && !holding.current && flow === 0) { cup.quiet += dt; if (cup.quiet > 0.25) judge(); } else cup.quiet = 0;
      const pour = open ? flow : 0;
      if (phase === 'hold' && cup.status !== 'open' && now - cup.at > 1.3) {
        prev = cup; cup = newCup(cup.f); phase = 'in'; phaseT = 0; cupsServed++;
        setFlavour(cup.f); sfx('slide', 0.3);
      }
      const inP = phase === 'in' ? 1 - Math.pow(1 - Math.min(1, phaseT / SLIDE), 3) : 1;
      const shift = -S.out * TRAVEL;
      place(cup, X + (1 - inP) * TRAVEL + shift);
      if (prev) {
        place(prev, X - inP * TRAVEL + shift);
        if (inP >= 1) { if (prev.o) w.dropCup(prev.o); prev = null; }
      }

      // ---- the scroll's story cup: Blue Razz at the middle tap, Berry at the left, served past the machine ----
      if (!playing) { w.setStation(1, 1); w.setStation(0, 0); } else w.setStation(TAP, cup.f);
      if (S.out > 0.001) {
        if (!storyCup) storyCup = w.makeCup(70, POUR.tol * 0.6, [35]);
        storyCup.g.visible = true;
        storyCup.g.position.x = S.x;
        w.fill(storyCup, [[1, 0, S.l1], [0, S.l1, S.l2 > 35.2 ? S.l2 : S.l1]]);
        storyCup.lid.visible = storyCup.straw.visible = S.serve > 0.01;
        storyCup.lid.position.y = CUP_H + (1 - S.serve) * 0.45;
        storyCup.straw.position.y = CUP_H + 0.08 + (1 - S.serve) * 0.7;
      } else if (storyCup) storyCup.g.visible = false;
      // the story pours: station 1 the first layer, station 0 the second
      const storyAt = playing ? [0, 0, 0] : [S.l2 > 35.3 && S.l2 < 69.7 ? 30 : 0, S.l1 > 0.3 && S.l1 < 34.7 ? 30 : 0, 0];

      // the belt moves with everything on it
      w.beltTex.offset.x = ((TRAVEL - S.x) + S.out * TRAVEL + (cupsServed - 1 + inP) * TRAVEL) / 0.6;

      // taps: levers, streams, the hoppers' slow churn
      w.stations.forEach((s, i) => {
        const f = playing ? (i === TAP ? pour : 0) : storyAt[i];
        const down = f > 0 || (playing && i === TAP && holding.current && open);
        s.lever.rotation.x += ((down ? 0.45 : -0.35) - s.lever.rotation.x) * Math.min(1, dt * 15);
        const tank = 0.8 + Math.sin(now * 1.4 + i) * 0.008;
        s.slush.scale.y = tank; s.slush.position.y = 1.27 + 0.3 * tank;
        s.stream.visible = f > 0;
        if (f > 0) {
          const lvl = playing ? cup.level : i === 1 ? S.l1 : S.l2;
          const bottom = levelY(lvl) + 0.015, len = NOZZLE_Y - bottom, rr = (0.007 + (f / 85) * 0.02) * (1 + 0.08 * Math.sin(now * 38 + i));
          s.stream.position.set(SW[i], bottom + len / 2, 0); s.stream.scale.set(rr, len, rr);
        }
      });

      // camera: from the hero's one tap into the story's close-up, following the story cup once it arrives
      const fr = frame(w.camera.aspect, S.close, Math.min(S.x, 0));
      w.camera.fov = fr.fov;
      w.camera.position.set(fr.x, fr.y + fr.d * 0.09, fr.d);
      w.camera.lookAt(fr.x, fr.y, 0);
      w.camera.updateProjectionMatrix();

      // the hit area follows the cup and its tap
      const b = tap.current;
      if (b) {
        const top = project(X, NOZZLE_Y + 0.12), bot = project(X, -0.1), side = project(X + R1 * 1.8, 0);
        const hw = Math.max(44, side.x - bot.x);
        b.style.transform = `translate(${bot.x - hw}px, ${top.y}px)`;
        b.style.width = `${hw * 2}px`; b.style.height = `${Math.max(88, bot.y - top.y)}px`;
      }

      const a = audio.current;
      if (a) a.pour.gain.setTargetAtTime(mutedRef.current ? 0 : Math.min(0.5, (pour + storyAt[0] + storyAt[1]) / 110), a.ctx.currentTime, 0.04);

      w.renderer.render(w.scene, w.camera);
    };

    (async () => {
      const fam = getComputedStyle(document.documentElement).getPropertyValue('--rs-display').trim() || 'serif';
      try { await document.fonts.load(`64px ${fam}`); } catch { /* the label falls back */ }
      if (!alive) return;
      w = await buildWorld(cv, fam, small);
      if (!alive) { w.dispose(); return; }
      vec = new w.T.Vector3();
      cup = newCup();
      fit();
      setReady(true);
      raf = requestAnimationFrame(tick);
    })();

    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
    io.observe(section);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); w?.dispose(); audio.current?.ctx.close(); audio.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the intro and the scroll story
  useGSAP(() => {
    const q = gsap.utils.selector(scope);
    const S = story.current;
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, ctx => {
      if (ctx.conditions?.still) return;
      const title = SplitText.create(q('.stage__title'), { type: 'words,chars', mask: 'words' });
      gsap.set(title.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' });
      gsap.timeline({ delay: 0.15 })
        .fromTo(title.chars, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.018 })
        .fromTo(q('.stage__lead, .stage__hero .btn-row, .stage__hint'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09 }, 0.45)
        .fromTo(q('.stage__canvas'), { scale: 1.06, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0);

      const stepTitles = q('.stage__step h2').map(h => {
        const s = SplitText.create(h, { type: 'words', mask: 'words' });
        gsap.set(s.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' });
        return s;
      });
      gsap.set(q('.stage__step'), { autoAlpha: 0 });
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: scope.current, start: 'top top', end: '+=320%', scrub: 1, pin: true, anticipatePin: 1 },
      });
      // the hero's words leave as one block (a per-letter scrub stutters)
      tl.to(q('.stage__hero'), { yPercent: -18, autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, 0)
        .to(q('.stage__hud'), { autoAlpha: 0, duration: 0.4 }, 0)
        .to(S, { out: 1, duration: 1.4 }, 0)
        .to(S, { x: 0, duration: 1.4, ease: 'power3.out' }, 0.2)
        .to(S, { close: 1, duration: 1.5 }, 0.1);
      const step = (i: number, at: number) => {
        tl.set(q('.stage__step')[i], { autoAlpha: 1, y: 0 }, at)
          .fromTo(stepTitles[i].words, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, at)
          .fromTo(q('.stage__step p')[i], { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, at + 0.2);
        if (i > 0) tl.to(q('.stage__step')[i - 1], { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in' }, at - 0.45);
      };
      step(0, 1.2);
      tl.to(S, { l1: 35, duration: 2, ease: 'none' }, 1.5).to(S, { x: -1.1, duration: 1 }, 3.8);
      step(1, 4);
      tl.fromTo(S, { l2: 35 }, { l2: 70, duration: 2, ease: 'none' }, 5).to(S, { x: -2.3, duration: 1 }, 7.3);
      step(2, 7.5);
      tl.to(S, { serve: 1, duration: 0.6, ease: 'bounce.out' }, 8.3)
        .fromTo(storyFloat.current, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)' }, 8.6)
        .to({}, { duration: 0.8 }, 9.2);
      return () => { title.revert(); stepTitles.forEach(s => s.revert()); };
    });
  }, { scope });

  const press = (on: boolean) => {
    if (on) { wakeAudio(); setTried(true); }
    holding.current = on;
  };
  const toggleMute = () => {
    const m = !mutedRef.current;
    mutedRef.current = m; setMuted(m);
    try { localStorage.setItem('rs.muted', m ? '1' : '0'); } catch { /* not remembered */ }
  };

  return (
    <section ref={scope} className={`stage${ready ? ' is-ready' : ''}`} id="top-stage" aria-labelledby="hero-h">
      <canvas ref={canvas} className="stage__canvas" aria-hidden="true" />
      <div className="stage__hero wrap">
        <h1 className="stage__title" id="hero-h">Rapid Slush, a slush arcade game</h1>
        <p className="stage__lead">Pour to the line and serve before the belt moves on. {game.beltLevels + game.spinLevels} levels on two machines, free on Google Play.</p>
        <div className="btn-row"><PlayButton /></div>
        <p className={`stage__hint${tried ? ' is-done' : ''}`}><span className="stage__dot" aria-hidden="true" />Hold the cup to pour. Let go on the line.</p>
      </div>
      <div className="stage__taps">
        <button
          ref={tap}
          type="button"
          className={`stage__tap${tried ? '' : ' is-cue'}`}
          aria-label={`Hold to pour ${STATION_FLAVOURS[flavour].name}`}
          onPointerDown={e => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } press(true); }}
          onPointerUp={() => press(false)}
          onPointerCancel={() => press(false)}
          onLostPointerCapture={() => press(false)}
          onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(true); } }}
          onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(false); } }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>
      <div ref={floatEl} className="stage__float" aria-hidden="true" />
      <div className="stage__hud">
        <span>Served <b>{score.served}</b></span>
        <span>Perfect streak <b>{score.streak}</b></span>
        <button type="button" className="stage__mute" onClick={toggleMute} aria-pressed={muted}>{muted ? 'Sound off' : 'Sound on'}</button>
      </div>
      <div className="stage__steps" id="play">
        {STEPS.map((s, i) => (
          <div key={s.h} className="stage__step">
            <span className="stage__n">0{i + 1}</span>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </div>
      <div ref={storyFloat} className="stage__float stage__float--story" data-tone="perfect" aria-hidden="true">Perfect! +250</div>
      <p className="sr-only" role="status" aria-live="polite">{said}</p>
    </section>
  );
}
