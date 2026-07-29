// Design tokens lifted from the Roster slide deck (the lamp-lit "study at night"
// palette). Kept in one place so the app reads as one object.

export const colors = {
  night: '#0C0F1B', // page void
  ground: '#171B2E', // primary surface
  panel: '#1E2440', // raised surface
  panelHi: '#242B4D',
  bone: '#ECE7DD', // primary text
  muted: '#98A0C0', // secondary text / rails
  lamp: '#E9B44C', // the light — highlight, "cleared", primary action
  lampSoft: 'rgba(233,180,76,0.14)',
  verdigris: '#86B8A1', // the good outcome — graduated, approved
  verdigrisSoft: 'rgba(134,184,161,0.14)',
  line: 'rgba(236,231,221,0.14)',
  lineStrong: 'rgba(236,231,221,0.24)',
  danger: '#D98A7B',
} as const;

export const font = {
  // Palatino-family display on the slides; on device we fall back gracefully.
  display: 'Palatino',
  body: 'System',
  mono: 'Courier',
} as const;

export const space = (n: number) => n * 8;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const type = {
  wordmark: { fontSize: 15, letterSpacing: 4, fontWeight: '600' as const },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: '600' as const },
  h1: { fontSize: 30, fontWeight: '600' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 19 },
  tiny: { fontSize: 11, letterSpacing: 1 },
} as const;
