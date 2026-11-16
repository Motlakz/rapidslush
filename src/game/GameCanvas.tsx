'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// The arcade stage: one Skia picture view covering the whole window, redrawn every frame from the controller.
// Each frame is recorded into an SkPicture (imperative drawing, no React re-render) and handed straight to the view.
// The stage (world + screen-shaped extensions, see layoutStage) sits at (left, top) × scale.
import { ClipOp, Skia, SkiaPictureView, useTypeface, type ISkiaViewApi, type SkPicture } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector, PointerType, useManualGesture } from 'react-native-gesture-handler';

import { pointerDown, pointerMove, pointerUp, tick } from '@/game/controller';
import { invalidateBackgrounds } from '@/game/render/background';
import type { StageLayout } from '@/game/layout';
import { Painter, setTypefaces } from '@/game/render/painter';
import { renderScene } from '@/game/render/scene';

const WEB_VIEW_ID = 917_431; // web views register under the nativeID we pass; native views allocate their own

/** The stage layout plus the window it sits in (points). */
export type StageGeo = StageLayout & { winW: number; winH: number };

export default function GameCanvas({ geo }: { geo: StageGeo }) {
  const viewRef = useRef<SkiaPictureView | null>(null);
  const geoRef = useRef(geo);
  useEffect(() => { geoRef.current = geo; }, [geo]);

  // Skia draws its own text, so it needs the typefaces itself (separate from the RN font registry).
  const head = useTypeface(require('@expo-google-fonts/caprasimo/400Regular/Caprasimo_400Regular.ttf'));
  const body = useTypeface(require('@expo-google-fonts/quicksand/700Bold/Quicksand_700Bold.ttf'));
  const num = useTypeface(require('@expo-google-fonts/lexend-deca/700Bold/LexendDeca_700Bold.ttf'));
  useEffect(() => {
    if (!head && !body && !num) return;
    setTypefaces(head, body, num);
    invalidateBackgrounds();
  }, [head, body, num]);

  useEffect(() => {
    const painter = new Painter();
    const api = (globalThis as unknown as { SkiaViewApi: ISkiaViewApi }).SkiaViewApi; // installed by Skia at startup
    let raf = 0, last = 0, prev: SkPicture | null = null;
    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? (ts - last) / 1000 : 0;
      last = ts;
      const f = tick(dt);
      const L = geoRef.current, { scale: s, left, top } = L;
      const id = Platform.OS === 'web' ? WEB_VIEW_ID : viewRef.current?.nativeId;
      if (!f || id === undefined || s <= 0) return;
      const rec = Skia.PictureRecorder();
      const canvas = rec.beginRecording({ x: 0, y: 0, width: L.winW, height: L.winH });
      painter.begin(canvas);
      if (left > 0.5 || top > 0.5) painter.fillRect(0, 0, L.winW, L.winH, '#17152A'); // beyond the stage caps only
      canvas.translate(left, top);
      canvas.scale(s, s);
      canvas.clipRect({ x: 0, y: 0, width: L.SW, height: L.SH }, ClipOp.Intersect, true);
      renderScene(painter, f.r, f.dt, f.t, f.ctx, L);
      const pic = rec.finishRecordingAsPicture();
      painter.end();
      rec.dispose();
      api.setJsiProperty(id, 'picture', pic);
      api.requestRedraw(id);
      prev?.dispose(); // the view now holds the new picture; the old one is ours to release
      prev = pic;
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); prev?.dispose(); };
  }, []);

  // Every finger is tracked on its own, so two taps can pour at once.
  const gesture = useManualGesture({
    runOnJS: true,
    onTouchesDown: e => {
      const { scale: s, left, top } = geoRef.current, touch = e.pointerType !== PointerType.MOUSE;
      for (const t of e.changedTouches) pointerDown(String(t.id), (t.x - left) / s, (t.y - top) / s, touch);
    },
    onTouchesMove: e => {
      const { scale: s, left, top } = geoRef.current;
      for (const t of e.changedTouches) pointerMove(String(t.id), (t.x - left) / s, (t.y - top) / s);
    },
    onTouchesUp: e => { for (const t of e.changedTouches) pointerUp(String(t.id)); },
    onTouchesCancel: e => { for (const t of e.changedTouches) pointerUp(String(t.id)); },
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} collapsable={false}>
        <SkiaPictureView
          ref={viewRef}
          style={StyleSheet.absoluteFill}
          opaque
          {...(Platform.OS === 'web' ? { nativeID: String(WEB_VIEW_ID) } : null)}
        />
      </View>
    </GestureDetector>
  );
}
