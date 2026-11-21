'use client';
// Every move on the site, in one place: smooth scrolling, the hero's entrance, the counting stats
// and the rush cards' little loops. The shack's day-to-night scene runs its own timeline
// (ShackScene). Nothing here runs when the visitor prefers reduced motion, and any failure leaves
// the whole page usable.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// a phone's address bar showing and hiding resizes the viewport: don't re-measure the pin for that
ScrollTrigger.config({ ignoreMobileResize: true });

export function CandyMotion() {
  useGSAP(() => {
    const shown = () => document.documentElement.classList.remove('enter');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { shown(); return; }
    const has = (sel: string) => document.querySelector(sel) !== null;
    try {
      // Smooth scrolling on GSAP's ticker, so Lenis, the pinned scene and the scrub all move in the
      // same frame. ScrollTrigger updates from Lenis's own scroll event, never a second listener.
      const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9 });
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

      // the hero enters once: the words rise in, the shift slides up, the sticker pops on
      // (layout.tsx's head script holds these hidden from the first paint, so they never flash in and out)
      if (has('.hero')) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hero__copy > *', { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .08 }, .1)
          .fromTo('.device', { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9 }, .25)
          .fromTo('.blob', { scale: 0 }, { scale: 1, duration: .55, ease: 'back.out(1.8)', stagger: .08 }, .6)
          .fromTo('.device__sticker', { scale: 0, rotate: -20 }, { scale: 1, rotate: -6, duration: .5, ease: 'back.out(2.2)' }, 1);
        document.documentElement.classList.remove('enter');
        gsap.utils.toArray<HTMLElement>('.blob').forEach((b, i) =>
          gsap.to(b, { y: i % 2 ? 9 : -9, duration: 2.6 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      }

      // the stats count up once, when they come into view
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
          gsap.timeline({ repeat: -1, repeatDelay: .6 })
            .to(chips, { autoAlpha: 0, yPercent: -40, duration: .28, ease: 'power2.in', stagger: .07 }, 2)
            .set(chips, { yPercent: 40 })
            .to(chips, { autoAlpha: 1, yPercent: 0, duration: .35, ease: 'back.out(1.8)', stagger: .07 });
        }
        gsap.utils.toArray<SVGGElement>('.cuprow > g').forEach((g, i) =>
          gsap.to(g, { y: -5, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .25 }));
      }

      // late fonts and images change the page's height: re-measure the pin once they're in
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);
      window.addEventListener('load', refresh);
      return () => {
        document.removeEventListener('click', onAnchor);
        window.removeEventListener('load', refresh);
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    } catch {
      shown(); // the page is complete without motion
    }
  });
  return null;
}
