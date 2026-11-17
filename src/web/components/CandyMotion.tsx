'use client';
// Every move on the site, in one place: the loader curtain, the dispenser pouring the hero cup
// full, the idle loops (bubbles, drips, sheen sweeps, sparkles), pointer tilts, scroll reveals,
// the counting stats, the rush's little machines and the closing wordmark. Nothing here runs when
// the visitor prefers reduced motion, and any failure leaves the whole page usable.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const fail = () => {
  document.documentElement.classList.add('gsap-off');
  document.querySelector('.loader')?.remove();
  document.documentElement.style.overflow = '';
};

export function CandyMotion() {
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fail(); return; }
    try {
      // a missing anchor means the section isn't on this page, so no tweens for it
      const has = (sel: string) => document.querySelector(sel) !== null;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // smooth scrolling, driven by GSAP's ticker so pinned scenes and the scroll share one frame
        const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
        lenis.on('scroll', ScrollTrigger.update);
        const raf = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        const onAnchor = (e: MouseEvent) => {
          const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
          if (!a || a.getAttribute('href') === '#') return;
          const el = document.querySelector(a.getAttribute('href')!);
          if (!el) return;
          e.preventDefault();
          lenis.scrollTo(el as HTMLElement, { offset: -90 });
        };
        document.addEventListener('click', onAnchor);

        // ---------- the loader curtain, then everything the shack owns ----------
        if (has('.loader')) {
          gsap.timeline()
            .to('#ldfill', { scaleY: 1, duration: .8, ease: 'power2.inOut' }, .1)
            .to('#ldword span', { yPercent: 0, duration: .65, ease: 'expo.out', stagger: .045 }, .25)
            .to('.loader__inner', { autoAlpha: 0, y: -26, duration: .3, ease: 'power2.in' }, 1.15)
            .to('.loader', { yPercent: -100, duration: .75, ease: 'expo.inOut' }, 1.35)
            .add(() => { document.querySelector('.loader')?.remove(); document.documentElement.style.overflow = ''; });
        } else {
          document.documentElement.style.overflow = '';
        }

        // hero entrance: the dispenser drops in, pours, the cup fills, straw goes in
        if (has('#disp')) {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.fromTo('#disp', { y: -70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8 }, .2)
            .fromTo('#cupShadow', { autoAlpha: 0, scaleX: .4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scaleX: 1, duration: .7 }, .3)
            .fromTo('#cupBob', { y: 90 }, { y: 0, duration: 1 }, .3)
            .fromTo('#pourGroup', { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: .45, ease: 'power2.out' }, .75)
            .fromTo(['#layM', '#layR', '#layB'], { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .9, ease: 'back.out(1.1)', stagger: .3 }, .9)
            .to('#pourGroup', { scaleY: 0, duration: .35, ease: 'power2.in' }, 2.2)
            .fromTo('#straw', { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: 'back.out(1.6)' }, 2.35)
            .fromTo('#face', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .5, ease: 'back.out(2)' }, 2.6)
            .fromTo('.hero__copy > *', { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, stagger: .09 }, .45)
            .fromTo('.blob', { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(1.8)', stagger: .1 }, .8);

          // idle life: a gentle bob, bubbles, drips, sheen sweeps, sparkles, blobs drift
          gsap.to('#cupBob', { y: -4, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          gsap.to('#cupShadow', { scaleX: .96, autoAlpha: .85, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          gsap.to('#straw', { rotation: 2.5, transformOrigin: '50% 90%', duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          ['#bub1', '#bub2', '#bub3', '#bub4'].forEach((b, i) =>
            gsap.to(b, { y: -26 - i * 4, autoAlpha: 0, duration: 2 + i * .5, ease: 'power1.in', repeat: -1, delay: i * .7 }));
          gsap.utils.toArray<SVGCircleElement>('#drips circle').forEach((d, i) =>
            gsap.to(d, { y: 26 + i * 6, autoAlpha: 0, duration: 3.2 + i * .6, ease: 'power1.in', repeat: -1, delay: 1 + i * .9 }));
          gsap.fromTo('#sheen', { x: -120 }, { x: 340, duration: 1.6, ease: 'power1.inOut', repeat: -1, repeatDelay: 2.6 });
          gsap.to('.sparkle path', { scale: 1.25, transformOrigin: '50% 50%', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: .4 });
          gsap.utils.toArray<HTMLElement>('.blob').forEach((b, i) =>
            gsap.to(b, { y: i % 2 ? 9 : -9, duration: 2.6 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

          // every few seconds: a top-up pour — the lever drops, the tank dips, the cup rises;
          // then the cup ships out and the tank refills
          gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 6 })
            .to('#lever', { rotation: 26, transformOrigin: '50% 15%', duration: .18, ease: 'power2.out' }, 0)
            .to('#pourGroup', { scaleY: 1, duration: .3, ease: 'power2.out' }, .05)
            .to('#topLayer', { y: -13, duration: 1.6, ease: 'sine.inOut' }, .1)
            .to('#tankLvl', { attr: { height: 48, y: 56 }, duration: 1.6, ease: 'sine.inOut' }, .1)
            .to('#pourGroup', { scaleY: 0, duration: .3, ease: 'power2.in' }, 2.05)
            .to('#lever', { rotation: 0, duration: .22 }, 2.05)
            .to('#topLayer', { y: 0, duration: .45, ease: 'power2.in' }, 3.2)
            .to('#tankLvl', { attr: { height: 60, y: 44 }, duration: .45 }, 3.2);
        }

        // the cup leans toward the pointer — true 3D tilt on the stage
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          gsap.set('#cup3d', { transformPerspective: 1100 });
          const rx = gsap.quickTo('#cup3d', 'rotationX', { duration: .5, ease: 'power3.out' });
          const ry = gsap.quickTo('#cup3d', 'rotationY', { duration: .5, ease: 'power3.out' });
          const art = document.getElementById('heroArt');
          const move = (e: PointerEvent) => {
            if (!art) return;
            const r = art.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - .5) * 10);
            rx(-((e.clientY - r.top) / r.height - .5) * 7);
          };
          const leave = () => { rx(0); ry(0); };
          art?.addEventListener('pointermove', move);
          art?.addEventListener('pointerleave', leave);

          // the machine polaroids lean too
          gsap.utils.toArray<HTMLElement>('.tilt').forEach(el => {
            gsap.set(el, { transformPerspective: 900 });
            const prx = gsap.quickTo(el, 'rotationX', { duration: .5, ease: 'power3.out' });
            const pry = gsap.quickTo(el, 'rotationY', { duration: .5, ease: 'power3.out' });
            const pmove = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              pry(((e.clientX - r.left) / r.width - .5) * 7);
              prx(-((e.clientY - r.top) / r.height - .5) * 5);
            };
            const pleave = () => { prx(0); pry(0); };
            el.addEventListener('pointermove', pmove);
            el.addEventListener('pointerleave', pleave);
          });
          return () => {
            art?.removeEventListener('pointermove', move);
            art?.removeEventListener('pointerleave', leave);
          };
        }
        return () => { /* tilt handlers live on elements that never unmount */ };
      });

      // ---------- scroll-driven pieces (outside the matchMedia: reduced motion keeps them still) ----------
      // reveals
      gsap.utils.toArray<HTMLElement>('.io').forEach(el => {
        gsap.fromTo(el, { y: 44, autoAlpha: 0, rotate: parseFloat(el.style.getPropertyValue('--rot')) || 0 },
          { y: 0, autoAlpha: 1, rotate: parseFloat(el.style.getPropertyValue('--rot')) || 0, duration: .9, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      });
      // stats count up
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach(el => {
        const end = Number(el.dataset.count), o = { n: 0 };
        gsap.to(o, {
          n: end, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => { el.textContent = String(Math.round(o.n)); },
        });
      });
      // the rush's little machines, running
      if (has('#stream')) {
        gsap.to('#stream', { scaleY: .35, transformOrigin: '50% 0%', duration: .5, ease: 'sine.in', yoyo: true, repeat: -1, repeatDelay: .9 });
        gsap.to('#poolFill', { attr: { height: 30 }, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        gsap.to('#x3', { scale: 1.12, transformOrigin: '80% 60%', duration: .7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        const chips = gsap.utils.toArray<HTMLElement>('.rush-chip');
        if (chips.length) {
          gsap.set(chips, { autoAlpha: (i: number) => (i < 1 ? 1 : 0), yPercent: (i: number) => (i < 1 ? 0 : 40) });
          gsap.timeline({ repeat: -1, repeatDelay: .6 })
            .to(chips, { autoAlpha: 0, yPercent: -40, duration: .28, ease: 'power2.in', stagger: .07 }, 2)
            .set(chips, { yPercent: 40 })
            .to(chips, { autoAlpha: 1, yPercent: 0, duration: .35, ease: 'back.out(1.8)', stagger: .07 });
        }
        gsap.utils.toArray<SVGGElement>('.cuprow > g').forEach((g, i) =>
          gsap.to(g, { y: -5, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .25 }));
      }
      // the closing wordmark lands
      if (has('#closeWord')) {
        gsap.fromTo('#closeWord', { yPercent: 60, autoAlpha: 0 }, {
          yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: '.close', start: 'top 70%', once: true },
        });
      }
      // late fonts/images shift the layout: re-measure once everything is in
      window.addEventListener('load', () => ScrollTrigger.refresh());
      return () => { mm.revert(); };
    } catch {
      fail();
    }
  });
  return null;
}
