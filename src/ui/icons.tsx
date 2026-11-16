import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C } from './theme';

export const TokenIcon = ({ s = 22 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={11} fill={C.berry} />
    <Circle cx={12} cy={12} r={7.5} fill="none" stroke="#fff" strokeWidth={2} />
    <Path d="M12 7.5v9M9.5 9.5h3.8a1.6 1.6 0 010 3.2h-2.6a1.6 1.6 0 000 3.2H14.5" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CoinIcon = ({ s = 22 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={11} fill={C.mango} />
    <Circle cx={12} cy={12} r={7.5} fill="#FFDD8A" stroke={C.mangoD} strokeWidth={1.5} />
    <Path d="M12 8.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill={C.mangoD} />
  </Svg>
);

export const StarIcon = ({ on, s = 34 }: { on: boolean; s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill={on ? C.mango : '#E7DECF'} stroke={on ? C.mangoD : '#D3C8B5'} strokeWidth={1.5} strokeLinejoin="round" />
  </Svg>
);

export const Stars = ({ n, s = 34 }: { n: number; s?: number }) => (
  <>{[1, 2, 3].map(k => <StarIcon key={k} on={k <= n} s={s} />)}</>
);

export const GearIcon = ({ c = C.ink }: { c?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round">
    <Circle cx={12} cy={12} r={3.2} />
    <Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </Svg>
);

export const CloseIcon = ({ c = C.ink }: { c?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export const LockIcon = ({ c = C.ink3, s = 18 }: { c?: string; s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round">
    <Rect x={5} y={11} width={14} height={10} rx={3} />
    <Path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);
