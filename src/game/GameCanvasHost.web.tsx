// Web: Skia runs on CanvasKit (WASM, served from /canvaskit.wasm), which must finish loading before any module
// that touches Skia is evaluated. So the canvas module is imported only after LoadSkiaWeb resolves.
import type { StageGeo } from './GameCanvas';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export default function GameCanvasHost({ geo }: { geo: StageGeo }) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./GameCanvas')}
      componentProps={{ geo }}
      opts={{ locateFile: (file: string) => `/${file}` }}
    />
  );
}
