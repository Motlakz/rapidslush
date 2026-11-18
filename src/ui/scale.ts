// Scale for the menu layer (React views over the canvas). Menus are laid out in the same stage units as the
// playfield, but they never scale below 1.0: the smallest text is 16 units, and 16 units must render at 16pt —
// anything under that is unreadable on phones, where the stage fit can shrink to ~0.5. Panels adapt instead:
// they clamp to the safe area (see Panel) and scroll when their content runs taller than the screen.
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layoutStage } from '@/game/layout';

export const MIN_UI_SCALE = 1.0;

export function useUi() {
  const { width, height } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const stage = layoutStage(width, height, ins);
  const ui = Math.max(stage.scale, MIN_UI_SCALE);
  return {
    ui,
    /** usable space in ui units, safe area already removed */
    availW: Math.max(0, (width - ins.left - ins.right) / ui),
    availH: Math.max(0, (height - ins.top - ins.bottom) / ui),
    /** safe-area insets in ui units */
    safe: { top: ins.top / ui, right: ins.right / ui, bottom: ins.bottom / ui, left: ins.left / ui },
  };
}
