'use client';
// "Noon to night": the shack's window, pinned while the scroll turns the game's four skies (day, golden hour, sunset,
// night): the sun sets and reddens, the moon rises, stars and the string lights come on, the glassware upgrades.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

import { SKIES } from '@/lib/art';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STAGES = [
  { level: 'Levels 1 to 30', glass: 'Plastic cups, then clear cups' },
  { level: 'From level 31', glass: 'Frosted soda glasses' },
  { level: 'From level 61', glass: 'Milkshake glasses' },
  { level: 'From level 91', glass: 'String lights after dark' },
];
const W = 1200, H = 620;
// stable star field
const r1 = (n: number) => Math.round(n * 10) / 10;
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: r1((Math.sin(i * 91.7) * 0.5 + 0.5) * W), y: r1((Math.sin(i * 37.1) * 0.5 + 0.5) * 300), r: r1(0.6 + ((i * 13) % 10) / 6) }));
const BULBS = ['#FFE08A', '#FF8FB0', '#8FE3FF', '#C7F08A'];

export function DayToNight() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(scope);
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, ctx => {
      const paint = (i: number, at: number | null, tl?: gsap.core.Timeline) => {
        const S = SKIES[i], to = (sel: string, vars: gsap.TweenVars) => (tl && at !== null ? tl.to(q(sel), { ...vars, duration: 1 }, at) : gsap.set(q(sel), vars));
        to('.dn-sky0', { attr: { 'stop-color': S.sky[0] } }); to('.dn-sky1', { attr: { 'stop-color': S.sky[1] } }); to('.dn-sky2', { attr: { 'stop-color': S.sky[2] } });
        to('.dn-sea0', { attr: { 'stop-color': S.sea[0] } }); to('.dn-sea1', { attr: { 'stop-color': S.sea[1] } });
        to('.dn-sand', { attr: { fill: S.sand } }); to('.dn-wall', { attr: { fill: S.wall } });
        to('.dn-leaf', { attr: { fill: S.foliage } }); to('.dn-trunk', { attr: { stroke: S.trunk } });
        to('.dn-sun', { attr: { fill: S.sun, cy: [160, 230, 300, 400][i] } }); to('.dn-glow', { attr: { fill: S.glow, cy: [160, 230, 300, 400][i] } });
        to('.dn-moon', { autoAlpha: i === 3 ? 1 : 0, y: i === 3 ? 0 : 160 });
        to('.dn-stars', { autoAlpha: [0, 0, 0.25, 1][i] });
        to('.dn-bulb-glow', { autoAlpha: [0, 0.35, 0.7, 1][i] });
        to('.dn-stage', { autoAlpha: (k: number) => (k === i ? 1 : 0) });
      };
      if (ctx.conditions?.still) { paint(3, null); gsap.set(q('.dn-stage'), { autoAlpha: 1 }); return; }
      paint(0, null);
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: scope.current, start: 'top top', end: '+=240%', scrub: 0.8, pin: true, anticipatePin: 1 } });
      paint(1, 0.3, tl); paint(2, 1.6, tl); paint(3, 2.9, tl);
      tl.to({}, { duration: 0.6 }, 3.9);
      // the lights twinkle on their own (time, not scroll)
      gsap.to(q('.dn-bulb'), { opacity: 0.55, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.17, from: 'random' } });
    });
  }, { scope });

  const S = SKIES[0];
  const palm = (x: number, lean: number) => (
    <g>
      <path className="dn-trunk" d={`M${x} 330Q${x + lean * 0.4} 238 ${x + lean} 158`} stroke={S.trunk} strokeWidth="14" strokeLinecap="round" fill="none" />
      {Array.from({ length: 7 }, (_, k) => (
        <path key={k} className="dn-leaf" d="M0 0Q44 -26 92 12Q44 -4 0 0Z" fill={S.foliage} transform={`translate(${x + lean} 158) rotate(${-180 + k * 30 + 3})`} />
      ))}
    </g>
  );

  return (
    <section ref={scope} className="day-night" id="shack" aria-labelledby="shack-h">
      <svg className="day-night__art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img"
        aria-label="The shack's window as the day passes: blue noon sky, golden hour, a pink sunset, then night with a moon, stars and string lights.">
        <defs>
          <linearGradient id="dn-sky" x1="0" y1="0" x2="0" y2="1">
            <stop className="dn-sky0" offset="0" stopColor={S.sky[0]} /><stop className="dn-sky1" offset="0.62" stopColor={S.sky[1]} /><stop className="dn-sky2" offset="1" stopColor={S.sky[2]} />
          </linearGradient>
          <linearGradient id="dn-sea" x1="0" y1="0" x2="0" y2="1"><stop className="dn-sea0" offset="0" stopColor={S.sea[0]} /><stop className="dn-sea1" offset="1" stopColor={S.sea[1]} /></linearGradient>
        </defs>
        <rect width={W} height="340" fill="url(#dn-sky)" />
        <g className="dn-stars" opacity="0">{STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(255,255,240,.9)" />)}</g>
        <circle className="dn-glow" cx="980" cy="160" r="110" fill={S.glow} />
        <circle className="dn-sun" cx="980" cy="160" r="54" fill={S.sun} />
        <g className="dn-moon" opacity="0"><circle cx="300" cy="140" r="40" fill="#F3EFCF" /><circle cx="288" cy="132" r="7" fill="rgba(200,195,170,.5)" /><circle cx="310" cy="150" r="5" fill="rgba(200,195,170,.5)" /></g>
        <rect y="250" width={W} height="90" fill="url(#dn-sea)" />
        <rect className="dn-sand" y="326" width={W} height="34" fill={S.sand} />
        {palm(150, -26)}{palm(1080, 30)}
        <rect className="dn-wall" y="356" width={W} height={H - 356} fill={S.wall} />
        {Array.from({ length: 10 }, (_, k) => <rect key={k} y={382 + k * 26} width={W} height="2" fill="rgba(0,0,0,.08)" />)}
        {Array.from({ length: 15 }, (_, k) => (
          <g key={k}><rect x={k * 80} y="0" width="80" height="34" fill={k % 2 ? '#FFF9F1' : '#FF5A7E'} /><path d={`M${k * 80} 34A40 40 0 0 0 ${k * 80 + 80} 34Z`} fill={k % 2 ? '#FFF9F1' : '#FF5A7E'} /></g>
        ))}
        <path d={`M0 58${Array.from({ length: 61 }, (_, i) => `L${i * 20} ${r1(58 + Math.abs(Math.sin(((i * 20) / W) * Math.PI * 4)) * 14)}`).join('')}`} stroke="rgba(37,35,58,.5)" strokeWidth="1.5" fill="none" />
        {Array.from({ length: 31 }, (_, k) => {
          const x = 20 + k * 38, y = r1(66 + Math.abs(Math.sin((x / W) * Math.PI * 4)) * 14), c = BULBS[k % 4];
          return <g key={k}><circle className="dn-bulb-glow" cx={x} cy={y} r="13" fill={c} opacity="0" style={{ mixBlendMode: 'screen' }} /><circle className="dn-bulb" cx={x} cy={y} r="4.5" fill={c} /></g>;
        })}
      </svg>
      <div className="wrap day-night__copy">
        <h2 id="shack-h">Noon to night</h2>
        <p className="day-night__lead">The shack&rsquo;s day follows your progress, and the glassware gets fancier as it goes.</p>
        <div className="day-night__stages">
          {STAGES.map((s, i) => (
            <p key={s.level} className="dn-stage" style={{ opacity: i ? 0 : 1 }}><span>{s.level}</span><b>{SKIES[i].name}</b><span>{s.glass}</span></p>
          ))}
        </div>
      </div>
    </section>
  );
}
