// The Slush Line in 3D, ported from the prototype (design/3d_prototype.html): the same studio lighting, brushed steel,
// glass hoppers of iced slush, levers, transmissive cups, lids and striped straws. Built once per page; the stage
// component drives it each frame through `World`.
import type * as THREE_NS from 'three';

type T = typeof THREE_NS;

export const SW = [-1.1, 0, 1.1];
export const CUP_H = 0.44, INNER = 0.42, R0 = 0.1, R1 = 0.15, NOZZLE_Y = 0.66, TRAVEL = 4.6;
export const cupR = (y: number) => R0 + ((R1 - R0) * y) / CUP_H;
export const levelY = (pct: number) => 0.004 + (INNER * Math.min(100, pct)) / 100;

/** The game's flavours, in its colours; the three taps start as Berry, Blue Razz and Mango. */
export const STATION_FLAVOURS = [
  { name: 'Berry', color: '#FF6B8A' },
  { name: 'Blue Razz', color: '#45C6F2' },
  { name: 'Mango', color: '#FFC857' },
  { name: 'Lime', color: '#A7D95B' },
  { name: 'Grape', color: '#A78BFA' },
];

export interface CupObj {
  g: THREE_NS.Group;
  layers: THREE_NS.Mesh[];
  dome: THREE_NS.Mesh;
  lid: THREE_NS.Mesh;
  straw: THREE_NS.Mesh;
  target: THREE_NS.Mesh;
  band: THREE_NS.Mesh[];
  drips: THREE_NS.Mesh[];
  puddle: THREE_NS.Mesh;
  key: string;
}

export interface Station {
  slush: THREE_NS.Mesh;
  lever: THREE_NS.Group;
  stream: THREE_NS.Mesh;
  parts: THREE_NS.Mesh[];
  label: THREE_NS.Mesh;
  flavour: number;
}

export interface World {
  T: T;
  renderer: THREE_NS.WebGLRenderer;
  scene: THREE_NS.Scene;
  camera: THREE_NS.PerspectiveCamera;
  beltTex: THREE_NS.CanvasTexture;
  stations: Station[];
  slushMats: THREE_NS.MeshPhysicalMaterial[];
  makeCup: (target: number, tol: number, extra?: number[]) => CupObj;
  /** Sets a cup's liquid: `layers` = [[flavour, from %, to %], ...], bottom first. */
  fill: (o: CupObj, layers: [number, number, number][]) => void;
  dropCup: (o: CupObj) => void;
  /** Refills a tap with another flavour: its hopper, lever, stream and label. */
  setStation: (i: number, f: number) => void;
  dispose: () => void;
}

export async function buildWorld(canvas: HTMLCanvasElement, displayFont: string, small: boolean): Promise<World> {
  const T: T = await import('three');
  const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(small ? 1.5 : 2, window.devicePixelRatio || 1));
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true;
  r.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color('#e8d9c1');
  scene.fog = new T.Fog('#e8d9c1', 9, 22);

  const tex = (w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void, rep?: [number, number], data?: boolean) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = data ? T.NoColorSpace : T.SRGBColorSpace;
    t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };
  const rrect = (x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, rad: number) => { x.beginPath(); x.roundRect(px, py, w, h, rad); };
  const rbox = (w: number, h: number, d: number, rad: number) => {
    const b = Math.min(0.025, d / 4), W = w - 2 * b, H = h - 2 * b, rr = Math.min(rad, W / 2, H / 2), s = new T.Shape();
    s.moveTo(-W / 2 + rr, -H / 2); s.lineTo(W / 2 - rr, -H / 2); s.absarc(W / 2 - rr, -H / 2 + rr, rr, -Math.PI / 2, 0, false);
    s.lineTo(W / 2, H / 2 - rr); s.absarc(W / 2 - rr, H / 2 - rr, rr, 0, Math.PI / 2, false);
    s.lineTo(-W / 2 + rr, H / 2); s.absarc(-W / 2 + rr, H / 2 - rr, rr, Math.PI / 2, Math.PI, false);
    s.lineTo(-W / 2, -H / 2 + rr); s.absarc(-W / 2 + rr, -H / 2 + rr, rr, Math.PI, Math.PI * 1.5, false);
    const g = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 10 });
    g.center();
    return g;
  };
  const mesh = (geo: THREE_NS.BufferGeometry, mat: THREE_NS.Material, pos?: [number, number, number], opts: { cast?: boolean; receive?: boolean } = {}) => {
    const m = new T.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    scene.add(m);
    return m;
  };

  // environment: studio softboxes, so the glass and steel have something to reflect
  const pm = new T.PMREMGenerator(r), env = new T.Scene();
  env.add(new T.Mesh(new T.BoxGeometry(14, 9, 14), new T.MeshBasicMaterial({ color: new T.Color('#c4b6a2'), side: T.BackSide })));
  const panel = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number, col = '#ffffff') => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  panel(7, 1.6, [0, 4.4, 0.5], [Math.PI / 2, 0, 0], 5);
  panel(1.4, 5, [-6.9, 1.5, 1.5], [0, Math.PI / 2, 0], 3, '#ffe2c2');
  panel(1.4, 5, [6.9, 1.5, -1], [0, -Math.PI / 2, 0], 2);
  panel(5, 1.8, [0, 1.8, 6.9], [0, Math.PI, 0], 2.4, '#fff4e4');
  scene.environment = pm.fromScene(env, 0.035).texture;

  const camera = new T.PerspectiveCamera(30, 16 / 9, 0.1, 60);

  scene.add(new T.HemisphereLight(0xfff4e6, 0x8a6a4a, 0.45));
  const key = new T.DirectionalLight(0xfff0dc, 2.3);
  key.position.set(2.2, 5.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 3.5, bottom: -1.5, near: 1, far: 16 });
  key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new T.DirectionalLight(0xe4ecff, 0.9);
  rim.position.set(-3.5, 3, -2.5);
  scene.add(rim);

  // textures (seeded noise, so every visit looks the same)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const tiles = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#cdbb9f'; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      const tx = col * 128 + (row % 2 ? 64 : 0) + 3, ty = row * 64 + 3, v = rnd() * 10;
      const gr = x.createLinearGradient(0, ty, 0, ty + 58);
      gr.addColorStop(0, `rgb(${248 - v},${240 - v},${226 - v})`); gr.addColorStop(1, `rgb(${236 - v},${224 - v},${204 - v})`);
      x.fillStyle = gr; rrect(x, tx, ty, 122, 58, 8); x.fill();
    }
  }, [6, 3]);
  const brushed = tex(512, 512, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const g = 90 + rnd() * 90; x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 200, 1); } }, [2, 2], true);
  const ice = tex(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const g = rnd() * 255; x.fillStyle = `rgba(${g},${g},${g},.55)`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 2.2, 0, 7); x.fill(); } }, [3, 3], true);
  const beltTex = tex(256, 64, (x, w, h) => { x.fillStyle = '#34302a'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 32) { x.fillStyle = '#4a443b'; x.fillRect(i, 0, 10, h); x.fillStyle = '#2a2722'; x.fillRect(i + 10, 0, 2, h); } }, [14, 1]);
  const brand = tex(1024, 256, (x, w, h) => {
    x.fillStyle = '#c67139'; rrect(x, 8, 8, w - 16, h - 16, 120); x.fill();
    x.strokeStyle = '#f5ead8'; x.lineWidth = 8; rrect(x, 28, 28, w - 56, h - 56, 100); x.stroke();
    x.fillStyle = '#f9f4ed'; x.font = `120px ${displayFont}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Rapid Slush', w / 2, h / 2 + 8);
  });
  const stripe = tex(64, 256, (x, w, h) => { x.fillStyle = '#f9f4ed'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff6b8a'; for (let y = -64; y < h; y += 48) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + 32); x.lineTo(w, y + 52); x.lineTo(0, y + 20); x.fill(); } });
  const labelTex = STATION_FLAVOURS.map(f => tex(512, 128, (x, w, h) => {
    x.fillStyle = '#f9f4ed'; rrect(x, 4, 4, w - 8, h - 8, 60); x.fill();
    x.fillStyle = f.color; x.beginPath(); x.arc(66, h / 2, 34, 0, 7); x.fill();
    x.fillStyle = '#201e1d'; x.font = `64px ${displayFont}`; x.textBaseline = 'middle'; x.fillText(f.name, 122, h / 2 + 4);
  }));

  // materials
  const steel = new T.MeshPhysicalMaterial({ color: '#e4e0da', metalness: 0.85, roughness: 0.3, roughnessMap: brushed, clearcoat: 0.2 });
  const plastic = new T.MeshPhysicalMaterial({ color: '#f7f2ea', roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const accent = new T.MeshPhysicalMaterial({ color: '#c67139', roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const glass = new T.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.03, thickness: 0.06, ior: 1.5, metalness: 0, specularIntensity: 1, envMapIntensity: 1.2 });
  const cupMat = new T.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.07, thickness: 0.012, ior: 1.42, side: T.DoubleSide, envMapIntensity: 1.3 });
  const rimMat = new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.15, transmission: 0.6, thickness: 0.01 });
  const inkMat = new T.MeshStandardMaterial({ color: '#2e2b25', roughness: 0.5 });
  const brimMat = new T.MeshStandardMaterial({ color: '#b2622d', roughness: 0.3, metalness: 0.4 });
  const lidMat = new T.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.1, thickness: 0.01, side: T.DoubleSide });
  const strawMat = new T.MeshPhysicalMaterial({ map: stripe, roughness: 0.3, clearcoat: 0.6 });
  const slushMats = STATION_FLAVOURS.map(f => {
    const c = new T.Color(f.color);
    return new T.MeshPhysicalMaterial({ color: c, roughness: 0.42, bumpMap: ice, bumpScale: 1.2, clearcoat: 0.75, clearcoatRoughness: 0.35, sheen: 0.8, sheenRoughness: 0.45, sheenColor: c.clone().lerp(new T.Color('#ffffff'), 0.6) });
  });

  // room
  mesh(new T.PlaneGeometry(30, 9), new T.MeshStandardMaterial({ map: tiles, roughness: 0.45 }), [0, 2.3, -1.3], { cast: false });
  (tiles.repeat as THREE_NS.Vector2).set(13, 4);
  mesh(new T.BoxGeometry(30, 0.12, 2.4), new T.MeshPhysicalMaterial({ color: '#efe4d2', roughness: 0.32, clearcoat: 0.5 }), [0, -0.12, -0.1], { cast: false });
  mesh(new T.BoxGeometry(30, 1.6, 0.1), accent, [0, -0.98, 1.08], { cast: false });
  mesh(new T.BoxGeometry(30, 0.05, 0.12), steel, [0, -0.17, 1.1], { cast: false });

  // conveyor
  beltTex.repeat.set(40, 1);
  mesh(new T.BoxGeometry(24, 0.05, 0.56), new T.MeshStandardMaterial({ map: beltTex, roughness: 0.75 }), [0, -0.025, 0], { cast: false });
  [-0.3, 0.3].forEach(z => mesh(rbox(24, 0.09, 0.05, 0.02), steel, [0, -0.005, z]));

  // machine
  mesh(rbox(3.7, 1.24, 0.74, 0.09), steel, [0, 0.56, -0.7]);
  mesh(rbox(3.8, 0.08, 0.84, 0.04), accent, [0, 1.22, -0.7]);
  const plate = new T.Mesh(new T.PlaneGeometry(1.0, 0.25), new T.MeshPhysicalMaterial({ map: brand, transparent: true, roughness: 0.3, clearcoat: 0.8 }));
  plate.position.set(0, 0.99, -0.325);
  scene.add(plate);
  const stations: Station[] = SW.map((x, i) => {
    mesh(rbox(0.9, 0.74, 0.64, 0.13), glass, [x, 1.63, -0.7], { cast: false });
    const slush = mesh(rbox(0.82, 0.6, 0.56, 0.1), slushMats[i], [x, 1.5, -0.7]);
    mesh(rbox(0.94, 0.1, 0.68, 0.05), plastic, [x, 2.05, -0.7]);
    const label = new T.Mesh(new T.PlaneGeometry(0.56, 0.14), new T.MeshPhysicalMaterial({ map: labelTex[i], transparent: true, roughness: 0.35, clearcoat: 0.6 }));
    label.position.set(x, 1.88, -0.37);
    scene.add(label);
    mesh(rbox(0.2, 0.16, 0.4, 0.06), plastic, [x, 0.8, -0.16]);
    mesh(new T.CylinderGeometry(0.035, 0.028, 0.1, 24), plastic, [x, 0.7, 0]);
    const lever = new T.Group();
    lever.position.set(x, 0.86, 0.0);
    scene.add(lever);
    const handle = new T.Mesh(rbox(0.07, 0.3, 0.06, 0.03), slushMats[i]);
    handle.receiveShadow = true;
    handle.position.y = 0.15; handle.castShadow = true; lever.add(handle);
    const knob = new T.Mesh(new T.SphereGeometry(0.05, 24, 16), slushMats[i]);
    knob.position.y = 0.31; knob.castShadow = true; lever.add(knob);
    lever.rotation.x = -0.35;
    const stream = mesh(new T.CylinderGeometry(1, 1, 1, 20), slushMats[i], [x, 0.4, 0], { receive: false });
    stream.visible = false;
    return { slush, lever, stream, parts: [slush, handle, knob, stream], label, flavour: i };
  });
  const setStation = (i: number, f: number) => {
    const s = stations[i];
    if (s.flavour === f) return;
    s.flavour = f;
    s.parts.forEach(m => { m.material = slushMats[f]; });
    const lm = s.label.material as THREE_NS.MeshPhysicalMaterial;
    lm.map = labelTex[f]; lm.needsUpdate = true;
  };

  // cups
  const cupGeo = new T.LatheGeometry([new T.Vector2(0, 0.003), new T.Vector2(R0 - 0.012, 0.003), new T.Vector2(R0, 0.012), new T.Vector2(R1, CUP_H)], 56);
  const rimGeo = new T.TorusGeometry(R1 + 0.002, 0.006, 10, 56);
  const domeGeo = new T.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const dripGeo = new T.CapsuleGeometry(0.016, 0.22, 6, 12);
  const puddleGeo = new T.CylinderGeometry(1, 1, 0.008, 40);
  const strawGeo = new T.CylinderGeometry(0.012, 0.012, 0.52, 16);

  const makeCup = (target: number, tol: number, extra: number[] = []): CupObj => {
    const g = new T.Group();
    const add = (geo: THREE_NS.BufferGeometry, mat: THREE_NS.Material, cast = true) => { const m = new T.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };
    add(cupGeo, cupMat);
    const rimM = add(rimGeo, rimMat); rimM.position.y = CUP_H; rimM.rotation.x = Math.PI / 2;
    const ring = (pct: number, mat: THREE_NS.Material, w: number) => {
      const y = levelY(pct), m = add(new T.TorusGeometry(cupR(y) + 0.003, w, 8, 56), mat, false);
      m.position.y = y; m.rotation.x = Math.PI / 2; return m;
    };
    const targetRing = ring(target, inkMat, 0.0045);
    const band = [ring(target - tol, brimMat, 0.0025), ring(target + tol, brimMat, 0.0025), ...extra.map(e => ring(e, inkMat, 0.0045))];
    const layers = [0, 1].map(() => { const m = add(new T.BufferGeometry(), slushMats[0]); m.visible = false; return m; });
    const dome = add(domeGeo, slushMats[0]);
    dome.visible = false;
    const lid = add(domeGeo, lidMat, false);
    lid.scale.set(R1 + 0.006, 0.07, R1 + 0.006); lid.position.y = CUP_H; lid.visible = false;
    const straw = add(strawGeo, strawMat);
    straw.position.set(0.045, CUP_H + 0.08, 0.02); straw.rotation.z = -0.22; straw.visible = false;
    const drips = [-0.55, 0.15, 0.75].map((a, k) => { const d = add(dripGeo, slushMats[0], false); d.position.set(Math.sin(a) * 0.14, CUP_H - 0.12 - k * 0.03, Math.cos(a) * 0.14); d.visible = false; return d; });
    const puddle = add(puddleGeo, slushMats[0], false);
    puddle.position.y = 0.004; puddle.visible = false;
    scene.add(g);
    return { g, layers, dome, lid, straw, target: targetRing, band, drips, puddle, key: '' };
  };

  const fill = (o: CupObj, spec: [number, number, number][]) => {
    const key = spec.map(s => s.map(v => v.toFixed(1)).join(',')).join('|');
    if (key === o.key) return;
    o.key = key;
    let top = 0, topF = 0;
    o.layers.forEach((m, k) => {
      const s = spec[k];
      if (!s || s[2] - s[1] < 0.3) { m.visible = false; return; }
      const [f, a, b] = s, y0 = k === 0 ? 0.004 : levelY(a), y1 = levelY(b), h = Math.max(0.001, y1 - y0);
      m.geometry.dispose();
      m.geometry = new T.CylinderGeometry(cupR(y1) - 0.006, k === 0 ? R0 - 0.008 : cupR(y0) - 0.006, h, 48).translate(0, y0 + h / 2, 0);
      m.material = slushMats[f];
      m.visible = true;
      top = Math.max(top, b); topF = f;
    });
    const vis = top > 0.5, rt = cupR(levelY(top)) - 0.006;
    o.dome.visible = vis;
    o.dome.material = slushMats[topF];
    o.dome.scale.set(rt, 0.012 + 0.025 * Math.min(1, top / 30), rt);
    o.dome.position.y = levelY(top);
    o.drips.forEach(d => { d.material = slushMats[topF]; });
    o.puddle.material = slushMats[topF];
  };

  const dropCup = (o: CupObj) => {
    scene.remove(o.g);
    o.layers.forEach(m => m.geometry.dispose());
    [o.target, ...o.band].forEach(m => m.geometry.dispose());
  };

  const dispose = () => {
    r.dispose();
    pm.dispose();
    scene.traverse(obj => {
      const m = obj as THREE_NS.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  };

  return { T, renderer: r, scene, camera, beltTex, stations, slushMats, makeCup, fill, dropCup, setStation, dispose };
}
