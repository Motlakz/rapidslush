// GameRenderer: composes one frame in stage units. The stage is the fixed 1280×720 world plus extensions shaped to the
// screen (see layoutStage). Spaces: stage (backdrop extensions) → world (the shack, cups, effects; offset ox/oy) →
// HUD (row at hudY) and controls (deck at ox, ctrlY).
import { BELT_Y, H, SPIN, W, type Round } from '@/engine';
import { clamp } from '@/engine/util';
import type { StageLayout } from '@/game/layout';
import { background, drawLights, drawStageBackdrop, drawTower, phaseFor } from './background';
import { drawCup, drawTicket } from './cup';
import { FX, drawFloats, drawParts, drawSpinStream, drawStreams } from './fx';
import { drawBanner, drawControls, drawCoach, drawCountdown, drawHUD } from './hud';
import { drawBelt, drawExitCurtain, drawMachine, drawPuddles, drawSpinMachine, drawTray } from './machine';
import type { Painter } from './painter';
import type { RenderCtx } from './view';

export const scenePhase = (r: Round, ctx: RenderCtx) => phaseFor(r.mode === 'spin' ? ctx.highest : r.n);

export function renderScene(g: Painter, r: Round, dt: number, t: number, ctx: RenderCtx, L: StageLayout) {
  FX.reduced = ctx.reduced;
  let sx = 0, sy = 0;
  if (FX.shake > 0 && !ctx.reduced) { sx = (Math.random() - 0.5) * FX.shake * 16; sy = (Math.random() - 0.5) * FX.shake * 10; }
  FX.shake = Math.max(0, FX.shake - dt * 3);
  const phase = scenePhase(r, ctx);

  // stage: everything around the world
  drawStageBackdrop(g, phase, L, t);

  // world
  g.save(); g.translate(L.ox + sx, L.oy + sy);
  const x0 = -L.ox, x1 = L.SW - L.ox; // the stage's horizontal extent in world units
  g.drawPicture(background(phase));
  drawLights(g, t, phase, x0, x1);
  drawTower(g, r);
  if (r.mode === 'spin') {
    drawSpinScene(g, r, t, dt, ctx);
  } else {
    drawMachine(g, r, t, ctx);
    drawPuddles(g, r);
    drawBelt(g, r, x0, x1);
    g.save(); g.rect(0, -200, W, H + 400); g.clip(); // cups leave through the exit curtain, not across the extension
    const cups = r.cups.filter(c => c.x > -80 && c.x < W + 80).sort((a, b) => a.x - b.x);
    for (const c of cups) drawTicket(g, c, r);
    for (const c of cups) drawCup(g, c, r, t, ctx);
    drawStreams(g, r, t, dt);
    g.restore();
    drawExitCurtain(g, t);
  }
  drawParts(g, dt);
  if (ctx.live) drawCoach(g, r, t, ctx, 'world');
  drawFloats(g, dt);
  if (ctx.live && r.phase === 'countdown') drawCountdown(g, r);
  g.restore();

  if (!ctx.live) return;
  // HUD row
  g.save(); g.translate(0, L.hudY);
  drawHUD(g, r, t, L.SW, L.safe.left, L.safe.right);
  const B = ctx.banner;
  if (B && r.phase === 'playing') {
    const a = clamp(Math.min(B.t * 4, (5 - B.t) * 2), 0, 1);
    if (a > 0) drawBanner(g, B.s, a, (L.safe.left + L.SW - L.safe.right) / 2);
  }
  g.restore();
  // control deck
  g.save(); g.translate(L.ox, L.ctrlY);
  drawControls(g, r, ctx);
  drawCoach(g, r, t, ctx, 'controls');
  g.restore();
}

function drawSpinScene(g: Painter, r: Round, t: number, dt: number, ctx: RenderCtx) {
  drawSpinMachine(g, r, t, ctx);
  drawPuddles(g, r);
  drawTray(g, r, t, ctx);
  const cups = r.cups.filter(c => c.p).sort((a, b) => a.p!.y - b.p!.y);
  const drawOne = (c: (typeof cups)[number]) => {
    const p = c.p!, ox = c.x;
    g.save(); g.translate(p.x, p.y); g.scale(p.s, p.s); g.translate(0, -BELT_Y);
    c.x = 0; // drawn in the cup's own frame; restored right after
    if (c === r.winCup) { g.beginPath(); g.ellipse(0, BELT_Y + 2, 58, 12, 0, 0, 7); g.fill('rgba(255,200,87,.45)'); }
    drawCup(g, c, r, t, ctx);
    if (Math.cos(p.th) > 0.15) drawTicket(g, c, r);
    c.x = ox;
    g.restore();
  };
  for (const c of cups) if (Math.cos(c.p!.th) < 0) drawOne(c);
  // nozzle tip sits between the back and front rows
  g.rr(624, SPIN.NOZ_Y - 14, 32, 16, 6); g.fill('#4A4766');
  for (const c of cups) if (Math.cos(c.p!.th) >= 0) drawOne(c);
  drawSpinStream(g, r, t, dt);
}
