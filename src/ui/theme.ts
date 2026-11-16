// Design tokens (plan §7.3) as semantic names, so alternate themes can swap values without touching components.
export const C = {
  berry: '#FF6B8A', berryD: '#D93D63', razz: '#45C6F2', razzD: '#1B8FC0', lime: '#A7D95B', limeD: '#6E9F2B',
  mango: '#FFC857', mangoD: '#E09A1E', grape: '#A78BFA', grapeD: '#7356D8',
  ink: '#25233A', ink2: '#4A4766', ink3: '#8A87A6', cream: '#FFF9F1', cream2: '#F6EEDF', line: 'rgba(37,35,58,0.12)',
  stageBg: '#17152A', scrim: 'rgba(23,21,42,0.55)',
} as const;

// Caprasimo for headings and buttons (shared with Heart Loop), Quicksand for everything you read, Lexend Deca for numbers.
export const F = {
  display: 'Caprasimo_400Regular',
  head: 'Quicksand_700Bold',
  headSemi: 'Quicksand_600SemiBold',
  num: 'LexendDeca_700Bold',
} as const;

export const R = { lg: 28, md: 18 } as const;

export const shadow = {
  shadowColor: '#141228', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 12,
} as const;
