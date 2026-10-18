/**
 * ink — the DJ Systems Lab's drawing palette (house language: upper-left
 * light, gradients for form, rim highlights; amber #ffc64d accent, blue
 * #6fa8ff energy, green #5bff85 good, red #ff6b5e problem; peak red #ff5a48).
 * Every piece of gear is GENERIC: no brand likeness, no trade dress, no logos.
 */
export const INK = {
  // chassis (anodised graphite, lit from the upper left)
  bodyHi: '#33363d',
  bodyMid: '#202227',
  bodyLo: '#121316',
  bevel: 'rgba(255,255,255,0.13)',
  bevelDark: 'rgba(0,0,0,0.55)',
  inlay: '#0d0e11',
  inlayEdge: '#2a2c32',
  seam: '#08090b',
  shadow: 'rgba(0,0,0,0.55)',
  // silk-screen
  print: '#b9bdc6',
  printDim: '#6f737c',
  // knobs
  knobRubberHi: '#3a3c42',
  knobRubberLo: '#0c0d0f',
  capHi: '#e6e9ee',
  capMid: '#9aa0a9',
  capLo: '#4a4f57',
  indicator: '#f4f6f8',
  // metal
  metalHi: '#d8dce2',
  metalMid: '#8a9099',
  metalLo: '#3c4048',
  // displays
  lcdHi: '#0f2233',
  lcdLo: '#050c14',
  lcdGlass: 'rgba(120,170,220,0.10)',
  // lit things
  amber: '#ffc64d',
  amberDim: '#5a4618',
  green: '#5bff85',
  greenDim: '#1c4a2a',
  blue: '#6fa8ff',
  red: '#ff6b5e',
  peak: '#ff5a48',
  white: '#f4f6f8',
  ledOff: '#1d1f24',
  // rubber
  padHi: '#2f3136',
  padLo: '#16171a',
  // vinyl
  vinyl: '#0a0a0c',
  vinylGroove: '#1b1c20',
  slipmat: '#141518',
  // floor / table
  table: '#0b0b0d',
  tableEdge: '#1a1a1e',
  // cables (the jacket colours; every cable is ALSO labelled and patterned)
  cableBlack: '#1a1b1f',
  cableHi: 'rgba(255,255,255,0.22)',
  rcaWhite: '#e9e9ec',
  rcaRed: '#e2463a',
  coaxOrange: '#f08a2c',
  usbGrey: '#8e939b',
  lanBlue: '#3c78d8',
} as const;

/** Hot cue pad colours (pads 1–4). */
export const CUE_COLOURS = ['#ff5a48', '#ffc64d', '#5bff85', '#6fa8ff'] as const;
