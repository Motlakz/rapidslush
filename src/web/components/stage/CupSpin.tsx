'use client';
// One served cup in 3D (the prototype's cup, lid and striped straw), standing on the closing wordmark. It turns with
// the scroll and leans toward the pointer; a tap pours a fresh pair of layers.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

import { CUP_H, R0, R1, STATION_FLAVOURS, cupR, levelY } from './scene';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function CupSpin() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ spin: 0, leanX: 0, leanY: 0, fill: 1, pair: [0, 1] as [number, number], swap: 0 });

  useEffect(() => {
    const cv = canvas.current, el = box.current;
    if (!cv || !el) return;
    let alive = true, raf = 0, visible = false, dispose = () => {};
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' });
    io.observe(el);

    (async () => {
      const T = await import('three');
      if (!alive) return;
      const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      r.toneMapping = T.ACESFilmicToneMapping;
      const scene = new T.Scene();
      const pm = new T.PMREMGenerator(r), env = new T.Scene();
      env.add(new T.Mesh(new T.BoxGeometry(14, 9, 14), new T.MeshBasicMaterial({ color: '#2a2640', side: T.BackSide })));
      const panel = (w: number, h: number, p: [number, number, number], rot: [number, number, number], k: number, c = '#ffffff') => {
        const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), side: T.DoubleSide }));
        m.position.set(...p); m.rotation.set(...rot); env.add(m);
      };
      panel(7, 1.6, [0, 4.4, 0.5], [Math.PI / 2, 0, 0], 5);
      panel(1.4, 5, [-6.9, 1.5, 1.5], [0, Math.PI / 2, 0], 3, '#ffd0dc');
      panel(1.4, 5, [6.9, 1.5, -1], [0, -Math.PI / 2, 0], 2.4, '#c4ecff');
      scene.environment = pm.fromScene(env, 0.035).texture;
      scene.add(new T.HemisphereLight(0xfff4e6, 0x2a2640, 0.6));
      const key = new T.DirectionalLight(0xfff0dc, 2.2); key.position.set(2, 4, 3); scene.add(key);
      const rim = new T.DirectionalLight(0xff8fb0, 1.4); rim.position.set(-3, 2, -2); scene.add(rim);

      const camera = new T.PerspectiveCamera(26, 1, 0.1, 20);
      camera.position.set(0, 0.42, 2.1); camera.lookAt(0, 0.27, 0);

      // ice texture for the slush, as in the prototype
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d')!;
      x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
      let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      for (let i = 0; i < 2600; i++) { const g = rnd() * 255; x.fillStyle = `rgba(${g},${g},${g},.55)`; x.beginPath(); x.arc(rnd() * 256, rnd() * 256, 0.6 + rnd() * 2.2, 0, 7); x.fill(); }
      const ice = new T.CanvasTexture(c); ice.wrapS = ice.wrapT = T.RepeatWrapping; ice.repeat.set(3, 3);
      const stripeC = document.createElement('canvas'); stripeC.width = 64; stripeC.height = 256;
      const sx = stripeC.getContext('2d')!;
      sx.fillStyle = '#f9f4ed'; sx.fillRect(0, 0, 64, 256); sx.fillStyle = '#ff6b8a';
      for (let y = -64; y < 256; y += 48) { sx.beginPath(); sx.moveTo(0, y); sx.lineTo(64, y + 32); sx.lineTo(64, y + 52); sx.lineTo(0, y + 20); sx.fill(); }
      const stripe = new T.CanvasTexture(stripeC); stripe.colorSpace = T.SRGBColorSpace;

      const mats = STATION_FLAVOURS.map(f => {
        const col = new T.Color(f.color);
        return new T.MeshPhysicalMaterial({ color: col, roughness: 0.42, bumpMap: ice, bumpScale: 1.2, clearcoat: 0.75, clearcoatRoughness: 0.35, sheen: 0.8, sheenRoughness: 0.45, sheenColor: col.clone().lerp(new T.Color('#ffffff'), 0.6) });
      });
      const cupMat = new T.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.07, thickness: 0.012, ior: 1.42, side: T.DoubleSide, envMapIntensity: 1.3 });
      const g = new T.Group(); scene.add(g);
      g.add(new T.Mesh(new T.LatheGeometry([new T.Vector2(0, 0.003), new T.Vector2(R0 - 0.012, 0.003), new T.Vector2(R0, 0.012), new T.Vector2(R1, CUP_H)], 64), cupMat));
      const rimM = new T.Mesh(new T.TorusGeometry(R1 + 0.002, 0.006, 10, 64), new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.15, transmission: 0.6, thickness: 0.01 }));
      rimM.position.y = CUP_H; rimM.rotation.x = Math.PI / 2; g.add(rimM);
      const lid = new T.Mesh(new T.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.1, thickness: 0.01, side: T.DoubleSide }));
      lid.scale.set(R1 + 0.006, 0.07, R1 + 0.006); lid.position.y = CUP_H; g.add(lid);
      const straw = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.52, 16), new T.MeshPhysicalMaterial({ map: stripe, roughness: 0.3, clearcoat: 0.6 }));
      straw.position.set(0.045, CUP_H + 0.08, 0.02); straw.rotation.z = -0.22; g.add(straw);
      const layers = [0, 1].map(() => { const m = new T.Mesh(new T.BufferGeometry(), mats[0]); g.add(m); return m; });
      let fillKey = '';
      const pour = (a: number, b: number, fA: number, fB: number) => {
        const k = `${a.toFixed(3)}|${b.toFixed(3)}|${fA}|${fB}`;
        if (k === fillKey) return; fillKey = k;
        [[fA, 0, a], [fB, a, b]].forEach(([f, p0, p1], i) => {
          const m = layers[i], y0 = i ? levelY(p0) : 0.004, y1 = levelY(p1), h = y1 - y0;
          m.visible = h > 0.002;
          if (!m.visible) return;
          m.geometry.dispose();
          m.geometry = new T.CylinderGeometry(cupR(y1) - 0.006, i ? cupR(y0) - 0.006 : R0 - 0.008, h, 48).translate(0, y0 + h / 2, 0);
          m.material = mats[f];
        });
      };

      const fit = () => {
        const b = cv.getBoundingClientRect();
        r.setSize(b.width, b.height, false);
        camera.aspect = b.width / b.height; camera.updateProjectionMatrix();
      };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(cv);

      let t0 = performance.now();
      const tick = (t: number) => {
        raf = requestAnimationFrame(tick);
        if (!visible) { t0 = t; return; }
        const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
        const s = state.current;
        g.rotation.y += dt * 0.35;
        g.rotation.x += (s.leanY * 0.25 - g.rotation.x) * Math.min(1, dt * 5);
        g.rotation.z += (-s.leanX * 0.2 - g.rotation.z) * Math.min(1, dt * 5);
        g.position.y = Math.sin(t / 900) * 0.012;
        const f = Math.max(0, Math.min(1, s.fill));
        pour(Math.min(f, 0.5) * 66, 33 + Math.max(0, f - 0.5) * 2 * 45, s.pair[0], s.pair[1]);
        straw.visible = lid.visible = f > 0.98;
        scene.rotation.y = s.spin;
        r.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);
      dispose = () => { ro.disconnect(); r.dispose(); pm.dispose(); };
      if (!alive) dispose();
    })();
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); dispose(); };
  }, []);

  useGSAP(() => {
    const s = state.current;
    gsap.to(s, { spin: Math.PI * 1.5, ease: 'none', scrollTrigger: { trigger: box.current, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  }, { scope: box });

  const lean = (e: React.PointerEvent) => {
    const b = box.current!.getBoundingClientRect();
    state.current.leanX = ((e.clientX - b.left) / b.width - 0.5) * 2;
    state.current.leanY = ((e.clientY - b.top) / b.height - 0.5) * 2;
  };
  const refill = () => {
    const s = state.current;
    const pool = [0, 1, 2, 3, 4];
    const a = pool[Math.floor(Math.random() * 5)], b = pool.filter(f => f !== a)[Math.floor(Math.random() * 4)];
    gsap.timeline()
      .to(s, { fill: 0, duration: 0.35, ease: 'power2.in' })
      .add(() => { s.pair = [a, b]; })
      .to(s, { fill: 1, duration: 1.4, ease: 'power1.inOut' });
  };

  return (
    <div ref={box} className="cup-spin" onPointerMove={lean} onPointerLeave={() => { state.current.leanX = state.current.leanY = 0; }}>
      <canvas ref={canvas} aria-hidden="true" />
      <button type="button" className="cup-spin__btn" onClick={refill} aria-label="Pour a fresh layered slush" />
    </div>
  );
}
