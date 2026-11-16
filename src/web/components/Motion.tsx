'use client';
// Page-wide scroll motion: headings rise word by word out of a mask ([data-split]), framed captures open from a
// tilted clip into the full frame while the picture settles ([data-reveal]), rows and answers follow ([data-rise]).
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function Motion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // smooth scrolling, driven by GSAP's ticker so the scrubbed scenes and the scroll move on the same frame
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
        lenis.scrollTo(el as HTMLElement, { offset: -64 });
      };
      document.addEventListener('click', onAnchor);
      const splits = gsap.utils.toArray<HTMLElement>('[data-split]').map(el => {
        const s = SplitText.create(el, { type: 'words', mask: 'words' });
        gsap.set(s.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' });
        gsap.fromTo(s.words, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 85%' } });
        return s;
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el, i) => {
        const img = el.querySelector('img');
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 25%', scrub: 0.6 } });
        tl.fromTo(el, { clipPath: i % 2 ? 'polygon(18% 8%, 92% 0%, 84% 92%, 6% 100%)' : 'polygon(8% 0%, 82% 8%, 94% 100%, 16% 92%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' });
        if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none' }, 0);
      });
      gsap.utils.toArray<HTMLElement>('[data-rise]').forEach(group => {
        gsap.fromTo(group.children, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: group, start: 'top 85%' } });
      });
      return () => { splits.forEach(s => s.revert()); gsap.ticker.remove(raf); lenis.destroy(); document.removeEventListener('click', onAnchor); };
    });
  });
  return null;
}
