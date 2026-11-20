import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C } from './theme';

/** A life: a berry heart with an ink outline and a shine; hollow when spent. */
export const HeartIcon = ({ s = 30, on = true }: { s?: number; on?: boolean }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M12 20.6C7.4 17.4 3 13.9 3 9.4 3 6.6 5.1 4.6 7.6 4.6c1.8 0 3.3 1 4.4 2.6 1.1-1.6 2.6-2.6 4.4-2.6 2.5 0 4.6 2 4.6 4.8 0 4.5-4.4 8-9 11.2Z"
      fill={on ? C.berry : '#E7DECF'} stroke={on ? C.ink : '#C9BFAE'} strokeWidth={1.8} strokeLinejoin="round" />
    {on && <Path d="M6.4 8.6c.3-1.2 1.2-2 2.3-2.1" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.85} />}
  </Svg>
);

export const CoinIcon = ({ s = 30 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={11} fill={C.mango} />
    <Circle cx={12} cy={12} r={7.5} fill="#FFDD8A" stroke={C.mangoD} strokeWidth={1.5} />
    <Path d="M12 8.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill={C.mangoD} />
  </Svg>
);

export const StarIcon = ({ on, s = 42 }: { on: boolean; s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill={on ? C.mango : '#E7DECF'} stroke={on ? C.mangoD : '#D3C8B5'} strokeWidth={1.5} strokeLinejoin="round" />
  </Svg>
);

export const Stars = ({ n, s = 42 }: { n: number; s?: number }) => (
  <>{[1, 2, 3].map(k => <StarIcon key={k} on={k <= n} s={s} />)}</>
);

export const GearIcon = ({ c = C.ink }: { c?: string }) => (
  <Svg width={32} height={32} viewBox="0 0 24 24">
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
      fill={c}
    />
  </Svg>
);

export const CloseIcon = ({ c = C.ink }: { c?: string }) => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export const LockIcon = ({ c = C.ink3, s = 26 }: { c?: string; s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round">
    <Rect x={5} y={11} width={14} height={10} rx={3} />
    <Path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);
