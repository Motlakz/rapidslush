// Native: Skia is ready at startup, so the canvas loads directly.
import GameCanvas, { type StageGeo } from './GameCanvas';

export default function GameCanvasHost({ geo }: { geo: StageGeo }) {
  return <GameCanvas geo={geo} />;
}
