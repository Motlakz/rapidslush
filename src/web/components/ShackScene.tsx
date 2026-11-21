'use client';
// The shack's window, pinned while the scroll pours the day away: noon, golden hour, sunset,
// then night — the sun sets and reddens, clouds thin out, stars and the moon arrive, the string
// lights and the window's warm glow come on. A sailboat drifts by on its own.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PHASES = [
  { sky: ['#3eb9f6', '#8fdcff', '#d6f3ff'], sea: ['#189ad8', '#4fc6f2'], sun: '#ffe27a', sunY: 130, glow: .9, sand: '#f2dfa6', wall: '#ff8f5e', palm: '#2e7d4f', trunk: '#8a5a34', stars: 0, moon: 0, bulbs: 0, bglow: 0, win: 0, clouds: 1 },
  { sky: ['#ffae5f', '#ffd9a0', '#ffedcb'], sea: ['#2e9fd8', '#5fc8ee'], sun: '#ffab3d', sunY: 185, glow: .8, sand: '#eacb96', wall: '#e2684d', palm: '#256b45', trunk: '#7a4a2c', stars: 0, moon: 0, bulbs: .25, bglow: .3, win: .25, clouds: .7 },
  { sky: ['#ff7b93', '#ffa46b', '#ffd08a'], sea: ['#7a6fd1', '#a48fe0'], sun: '#ff5e5e', sunY: 232, glow: .7, sand: '#c9a284', wall: '#a4446e', palm: '#5c3560', trunk: '#5e3a2e', stars: .35, moon: 0, bulbs: .6, bglow: .6, win: .55, clouds: .4 },
  { sky: ['#241c4f', '#43346e', '#7a68a0'], sea: ['#1c2c4f', '#3a5378'], sun: '#ff5e5e', sunY: 232, glow: 0, sand: '#6e6390', wall: '#4a2b57', palm: '#1f1436', trunk: '#241a2e', stars: 1, moon: 1, bulbs: 1, bglow: 1, win: 1, clouds: 0 },
];
const CAPTIONS = [
  ['Levels 1–30 · Noon', 'Plastic cups, then clear ones', 'Scroll, and watch the sun work'],
  ['From level 31 · Golden hour', 'Frosted soda glasses arrive', 'The light turns honey'],
  ['From level 61 · Sunset', 'Milkshake glasses, the sun dips', 'The sea goes purple'],
  ['From level 91 · Night', 'String lights after dark', 'The window glows warm'],
];
const BULB_C = ['#ffe08a', '#ff8fb0', '#8fe3ff', '#c7f08a'];

const palm = (x: number, y: number, flip: number) => (
  <g key={x}>
    <path className="palmT" d={`M${x} 440Q${x + flip * 22} 362 ${x + flip * 30} 302`} stroke="#8a5a34" strokeWidth="13" fill="none" strokeLinecap="round" />
    <g className="palmF" fill="#2e7d4f">
      {[-176, -146, -116, -86, -56, -26].map(a => (
        <path key={a} d="M0 0Q44 -26 92 12Q44 -4 0 0Z" transform={`translate(${x + flip * 30} 302) rotate(${a})`} />
      ))}
    </g>
  </g>
);

export function ShackScene() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(scope);
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, ctx => {
      // string lights: bulbs sampled along the wire
      const wire = document.getElementById('wire') as unknown as SVGPathElement | null;
      const bulbs = document.getElementById('bulbs') as unknown as SVGGElement | null;
      const glows = document.getElementById('bulbGlows') as unknown as SVGGElement | null;
      if (wire && bulbs && glows) {
        const L = wire.getTotalLength();
        for (let k = 0; k <= 15; k++) {
          const p = wire.getPointAtLength((k / 15) * L), c = BULB_C[k % 4];
          const mk = (r: number, fill: string, extra: Record<string, string> = {}) => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            el.setAttribute('cx', String(p.x)); el.setAttribute('cy', String(p.y + 8));
            el.setAttribute('r', String(r)); el.setAttribute('fill', fill);
            for (const [k2, v] of Object.entries(extra)) el.setAttribute(k2, v);
            return el;
          };
          glows.appendChild(mk(13, c));
          bulbs.appendChild(mk(5.5, c, { stroke: '#4a0e33', 'stroke-width': '1.5' }));
        }
      }
      if (ctx.conditions?.still) return;
      // Smoothness: the page scrolls the window (Lenis drives native scroll), so the pin is the default
      // position: fixed. A transform pin was applied a frame after the scroll painted, which made the
      // whole frame shudder. Lenis already smooths the wheel, so the scrub lag stays short. Every
      // change below is a tween on the one timeline, so nothing switches at a threshold.
      const tl = gsap.timeline({
        defaults: { ease: 'sine.inOut', duration: 1 },
        scrollTrigger: { trigger: scope.current, start: 'top top', end: '+=260%', scrub: .4, pin: true },
      });
      // the caption crossfades mid-change and the progress bar fills with the scroll
      const caps = q('.shack__cap');
      gsap.set(caps, { autoAlpha: (k: number) => (k ? 0 : 1), y: (k: number) => (k ? 12 : 0) });
      tl.fromTo(q('.shack__bar i'), { scaleX: 0 }, { scaleX: 1, duration: 3.35, ease: 'none' }, 0);
      caps.forEach((c, k) => {
        if (!k) return;
        tl.to(caps[k - 1], { autoAlpha: 0, y: -12, duration: .25, ease: 'power1.in' }, k - 1 + .3)
          .to(c, { autoAlpha: 1, y: 0, duration: .25, ease: 'power1.out' }, k - 1 + .5);
      });
      PHASES.forEach((p, i) => {
        if (!i) return;
        const at = i - 1;
        tl.to(q('#sky0'), { attr: { 'stop-color': p.sky[0] } }, at)
          .to(q('#sky1'), { attr: { 'stop-color': p.sky[1] } }, at)
          .to(q('#sky2'), { attr: { 'stop-color': p.sky[2] } }, at)
          .to(q('#sea0'), { attr: { 'stop-color': p.sea[0] } }, at)
          .to(q('#sea1'), { attr: { 'stop-color': p.sea[1] } }, at)
          .to(q('#sun'), { attr: { fill: p.sun, cy: p.sunY } }, at)
          .to(q('#sunGlow'), { attr: { cy: p.sunY }, opacity: p.glow }, at)
          .to(q('#sand'), { attr: { fill: p.sand } }, at)
          .to(q('#wall'), { attr: { fill: p.wall } }, at)
          .to(q('.palmF'), { attr: { fill: p.palm } }, at)
          .to(q('.palmT'), { attr: { stroke: p.trunk } }, at)
          .to(q('#stars'), { opacity: p.stars }, at)
          .to(q('#moon'), { opacity: p.moon, y: p.moon ? 0 : -40 }, at)
          .to(q('#clouds'), { opacity: p.clouds }, at)
          .to(q('#bulbs'), { opacity: p.bulbs }, at)
          .to(q('#bulbGlows'), { opacity: p.bglow }, at)
          .to(q('#winGlow'), { opacity: p.win }, at);
      });
      tl.to(q('#sun'), { opacity: 0 }, 2).to({}, { duration: .35 }, 3);
      // life on its own clock: the lights breathe, the boat drifts, the sea shimmers
      gsap.utils.toArray<SVGCircleElement>('#bulbs circle').forEach((b, i) =>
        gsap.to(b, { opacity: .55, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .17 }));
      gsap.fromTo(q('#boat'), { x: -80 }, { x: 160, duration: 14, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to(q('#shimmer'), { opacity: .25, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  }, { scope });

  const moonY = -40;
  return (
    <section ref={scope} className="shack" id="shack" aria-labelledby="shack-h">
      <div className="shack__pin">
        <div className="wrap">
          <p className="kicker" style={{ color: 'var(--mango-deep)' }}>03 · The shack</p>
          <h2 id="shack-h" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.4rem)' }}>Scroll, and the day goes by</h2>
          <div className="shack__frame">
            <div className="shack__sky" aria-label="The shack's window as the day passes: noon, golden hour, sunset, then night with string lights">
              <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" role="img">
                <defs>
                  <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                    <stop id="sky0" offset="0" stopColor="#3eb9f6" />
                    <stop id="sky1" offset=".55" stopColor="#8fdcff" />
                    <stop id="sky2" offset="1" stopColor="#d6f3ff" />
                  </linearGradient>
                  <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
                    <stop id="sea0" offset="0" stopColor="#189ad8" />
                    <stop id="sea1" offset="1" stopColor="#4fc6f2" />
                  </linearGradient>
                  <radialGradient id="sunGlowG">
                    <stop offset="0" stopColor="#ffe27a" stopOpacity=".85" />
                    <stop offset="1" stopColor="#ffe27a" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="warmGlowG">
                    <stop offset="0" stopColor="#ffd36b" stopOpacity=".9" />
                    <stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="winG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#bfeaff" />
                    <stop offset="1" stopColor="#eaf9ff" />
                  </linearGradient>
                  <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
                    <stop offset=".4" stopColor="#ffffff" stopOpacity=".1" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity=".4" />
                  </linearGradient>
                </defs>

                <rect width="1200" height="420" fill="url(#skyG)" />
                <g id="stars" opacity="0" fill="#fff8e0">
                  <circle cx="90" cy="60" r="2.4" /><circle cx="180" cy="40" r="1.8" /><circle cx="300" cy="80" r="2.2" />
                  <circle cx="420" cy="36" r="1.6" /><circle cx="520" cy="70" r="2.4" /><circle cx="700" cy="50" r="2" />
                  <circle cx="760" cy="96" r="1.7" /><circle cx="250" cy="110" r="1.6" /><circle cx="600" cy="44" r="1.9" />
                  <circle cx="660" cy="120" r="1.5" /><circle cx="840" cy="30" r="2.1" /><circle cx="1000" cy="66" r="1.8" />
                  <circle cx="1090" cy="110" r="2.3" /><circle cx="140" cy="130" r="1.7" /><circle cx="370" cy="130" r="1.5" />
                  <circle cx="470" cy="96" r="1.6" /><circle cx="580" cy="150" r="1.4" /><circle cx="930" cy="140" r="1.6" />
                </g>
                <g id="moon" opacity="0" transform={`translate(0 ${moonY})`}>
                  <circle cx="300" cy="150" r="46" fill="#f3ecd2" />
                  <circle cx="286" cy="138" r="8" fill="#ddd4b6" />
                  <circle cx="312" cy="162" r="6" fill="#ddd4b6" />
                  <circle cx="296" cy="170" r="4" fill="#ddd4b6" />
                </g>
                <g id="clouds" opacity="1" fill="#ffffff">
                  <ellipse cx="210" cy="90" rx="64" ry="18" opacity=".9" />
                  <ellipse cx="258" cy="74" rx="42" ry="14" opacity=".9" />
                  <ellipse cx="560" cy="60" rx="52" ry="15" opacity=".8" />
                  <ellipse cx="604" cy="74" rx="34" ry="11" opacity=".8" />
                </g>
                <circle id="sunGlow" cx="900" cy="130" r="130" fill="url(#sunGlowG)" />
                <circle id="sun" cx="900" cy="130" r="52" fill="#ffe27a" />
                <rect y="360" width="1200" height="80" fill="url(#seaG)" />
                <g id="boat">
                  <path d="M180 396h56l-10 14h-38z" fill="#4a0e33" />
                  <path d="M208 396v-34l22 34z" fill="#fff6e5" stroke="#4a0e33" strokeWidth="2.5" />
                </g>
                <g id="shimmer" opacity=".55" fill="#fff">
                  <ellipse cx="300" cy="392" rx="46" ry="3" />
                  <ellipse cx="760" cy="406" rx="60" ry="3" />
                  <ellipse cx="540" cy="398" rx="34" ry="2.4" />
                </g>
                <rect id="sand" y="432" width="1200" height="26" fill="#f2dfa6" />

                {palm(150, 440, -1)}
                {palm(1052, 440, 1)}

                {/* the shack front */}
                <rect id="wall" y="452" width="1200" height="188" fill="#ff8f5e" />
                <g stroke="rgba(0,0,0,.07)" strokeWidth="2">
                  <line x1="0" y1="490" x2="1200" y2="490" /><line x1="0" y1="528" x2="1200" y2="528" />
                  <line x1="0" y1="566" x2="1200" y2="566" /><line x1="0" y1="604" x2="1200" y2="604" />
                </g>
                {/* awning: berry and cream scallops */}
                <g>
                  <rect y="452" width="1200" height="34" fill="#fff6e5" />
                  {Array.from({ length: 15 }, (_, k) => (
                    <path key={k} d={`M${k * 80} 486a40 26 0 0 0 80 0z`} fill={k % 2 ? '#fff6e5' : '#ff4d8d'} />
                  ))}
                  <rect y="450" width="1200" height="6" fill="#4a0e33" opacity=".55" />
                </g>

                {/* the window: glass, warm glow at night, the machine on the counter */}
                <g>
                  <rect x="330" y="506" width="540" height="110" rx="18" fill="url(#winG)" stroke="#4a0e33" strokeWidth="6" />
                  <circle id="winGlow" cx="600" cy="561" r="130" fill="url(#warmGlowG)" opacity="0" />
                  <g id="machine">
                    <rect x="500" y="524" width="200" height="62" rx="10" fill="#e8eef2" stroke="#4a0e33" strokeWidth="4" />
                    <rect x="512" y="508" width="52" height="26" rx="8" fill="#ff4d8d" stroke="#4a0e33" strokeWidth="4" />
                    <rect x="574" y="508" width="52" height="26" rx="8" fill="#35b6f5" stroke="#4a0e33" strokeWidth="4" />
                    <rect x="636" y="508" width="52" height="26" rx="8" fill="#ffc226" stroke="#4a0e33" strokeWidth="4" />
                    <rect x="500" y="580" width="200" height="10" rx="5" fill="#4a0e33" opacity=".8" />
                  </g>
                  <rect x="330" y="506" width="540" height="110" rx="18" fill="url(#glassG)" opacity=".35" />
                </g>

                {/* string lights */}
                <path id="wire" d="M0 500 Q 300 548 600 500 T 1200 500" fill="none" stroke="#4a0e33" strokeWidth="2.5" opacity=".45" />
                <g id="bulbs" />
                <g id="bulbGlows" opacity="0" />
              </svg>
            </div>
            <div className="shack__caption">
              <ol className="shack__caps">
                {CAPTIONS.map(([lv, name, sub]) => (
                  <li className="shack__cap" key={lv}>
                    <span>{lv}</span>
                    <b>{name}</b>
                    <span className="shack__sub">{sub}</span>
                  </li>
                ))}
              </ol>
              <div className="shack__bar" aria-hidden="true"><i /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
