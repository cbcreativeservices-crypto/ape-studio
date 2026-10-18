/**
 * boothGeometry — WHERE everything is, in millimetres (charter §2: the
 * geometry layer). Pure TypeScript, no React Native; test/djLab.test.ts checks
 * that every anchor sits inside its device and that no two parts collide.
 *
 * COORDINATES: x to the right, y AWAY from the DJ is up the page (the top
 * view, y-down on screen: y = 0 is the far edge of the table). Units are mm.
 * Every device is authored in its own local box (origin = its top-left corner)
 * and placed on the table by an offset; labels, hit areas, highlights and the
 * camera views are all derived from these anchors.
 *
 * DIMENSIONS are typical of each generic device class (docs/labs/dj/SOURCES.md
 * "Drawings"): a club-class media player 320 × 410 mm (jog Ø 206 mm, a 7-inch
 * screen 155 × 87 mm, a 100 mm tempo fader), a two-channel club mixer
 * 270 × 390 mm (60 mm channel faders, 46 mm crossfader), a direct-drive
 * turntable 453 × 353 mm (platter Ø 332 mm; a tonearm of 230 mm effective
 * length whose pivot stands 215 mm from the spindle).
 */

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/* ── the two-channel mixer, top view (270 × 390) ──────────────────────── */

export const MIXER_W = 270;
export const MIXER_D = 390;

/** Channel strip centre lines. */
export const STRIP_X = { 1: 50, 2: 220 } as const;

export const MIXER = {
  inputSel: { y: 24, w: 32, h: 9 },
  trim: { y: 58, d: 17 },
  hi: { y: 94, d: 19 },
  mid: { y: 128, d: 19 },
  lo: { y: 162, d: 19 },
  filter: { y: 202, d: 20 },
  cue: { y: 232, w: 26, h: 12 },
  fader: { top: 262, len: 60, capW: 13, capL: 22 },
  assign: { y: 344, w: 32, h: 9 },
  // the centre column
  busOver: { x: 135, y: 24 },
  meters: { y: 36, h: 100, w: 6, xs: [107, 124, 146, 163] as const },
  master: { x: 113, y: 166, d: 20 },
  booth: { x: 157, y: 166, d: 20 },
  cueMix: { x: 113, y: 210, d: 17 },
  phones: { x: 157, y: 210, d: 17 },
  split: { x: 121, y: 236, w: 28, h: 9 },
  resonance: { x: 135, y: 272, d: 14 },
  curve: { x: 117, y: 306, w: 36, h: 9 },
  xfader: { y: 368, left: 112, len: 46, capW: 12, capL: 20 },
  // the front edge (the headphone jacks sit on it)
  front: { y: 384, phones635: 66, phones35: 88 },
} as const;

/* ── the media player, top view (320 × 410) ───────────────────────────── */

export const PLAYER_W = 320;
export const PLAYER_D = 410;

export const PLAYER = {
  /** A 7-inch 16:9 screen: 155 × 87 mm of glass. */
  screen: { x: 82.5, y: 18, w: 155, h: 87 },
  browse: { x: 30, y: 52, d: 22 },
  load: { x: 18, y: 86, w: 24, h: 10 },
  back: { x: 18, y: 102, w: 24, h: 10 },
  slots: { usb: { x: 278, y: 30, w: 26, h: 8 }, sd: { x: 278, y: 44, w: 26, h: 5 } },
  hotCues: { y: 120, h: 18, xs: [58, 111, 164, 217] as const, w: 46 },
  loop: { x: 14, y: 182, w: 34, h: 13, gap: 17 },
  jump: { x: 14, y: 250, w: 34, h: 12, gap: 15 },
  jog: { cx: 160, cy: 272, d: 206, displayD: 72 },
  cue: { cx: 30, cy: 318, d: 34 },
  play: { cx: 30, cy: 366, d: 34 },
  sync: { x: 276, y: 176, w: 34, h: 13 },
  masterBtn: { x: 276, y: 194, w: 34, h: 11 },
  quantize: { x: 276, y: 150, w: 34, h: 11 },
  /** A 100 mm tempo fader (the cap's travel). */
  tempo: { x: 293, top: 228, len: 100, capW: 20, capL: 11 },
  tempoRange: { x: 276, y: 352, w: 34, h: 10 },
} as const;

/* ── the booth table: player A · mixer · player B ─────────────────────── */

export const GAP = 18;
export const BOOTH_LAYOUT = {
  A: { x: 0, y: 0 },
  mixer: { x: PLAYER_W + GAP, y: 10 },
  B: { x: PLAYER_W + GAP + MIXER_W + GAP, y: 0 },
} as const;
export const BOOTH_W = PLAYER_W * 2 + MIXER_W + GAP * 2;
export const BOOTH_D = PLAYER_D;

/** A point on the mixer, in booth coordinates. */
export const onMixer = (x: number, y: number): Pt => ({ x: BOOTH_LAYOUT.mixer.x + x, y: BOOTH_LAYOUT.mixer.y + y });
/** A point on a player, in booth coordinates. */
export const onPlayer = (deck: 'A' | 'B', x: number, y: number): Pt => ({ x: BOOTH_LAYOUT[deck].x + x, y: BOOTH_LAYOUT[deck].y + y });

/* ── the turntable, top view (453 × 353) ──────────────────────────────── */

export const TT_W = 453;
export const TT_D = 353;
export const TT = {
  platter: { cx: 190, cy: 182, d: 332 },
  record: { d: 302, label: 100 },
  /** The tonearm's vertical pivot: 215 mm from the spindle. */
  armPivot: { x: 384, y: 88 },
  /** Effective length (pivot → stylus) and the headshell's offset angle. */
  arm: { effective: 230, offsetDeg: 22, tube: 8.5, stub: 58 },
  /** The arm rest post (holds the tube; the headshell clears the pitch fader). */
  armRest: { x: 384, y: 236 },
  /** The cue (lift) lever on its own base. */
  lift: { x: 414, y: 146 },
  /** The stylus at the record's lead-in groove (computed from the arm). */
  stylusPlay: { x: 282.9, y: 294.6 },
  counterweight: { x: 384, y: 32 },
  startStop: { x: 26, y: 300, w: 46, h: 30 },
  speed33: { x: 82, y: 312, w: 26, h: 12 },
  speed45: { x: 114, y: 312, w: 26, h: 12 },
  pitch: { x: 425, top: 186, len: 110, capW: 18, capL: 10 },
  targetLight: { x: 28, y: 36 },
  strobe: { cx: 30, cy: 236 },
} as const;

/**
 * The stylus position (plinth mm) when the arm turns `ang` radians about its
 * pivot (0 = the arm points straight down the page, toward the DJ; positive
 * swings the head LEFT, over the record). A rigid arm: its length never
 * changes (charter §5).
 */
export function stylusAt(ang: number): Pt {
  const L = TT.arm.effective;
  return { x: TT.armPivot.x - Math.sin(ang) * L, y: TT.armPivot.y + Math.cos(ang) * L };
}
/** The arm angle that sets the stylus on a groove `r` mm from the spindle. */
export function armAngleFor(r: number): number {
  // bisection on the arc (monotonic over the swing the arm can make)
  let lo = 0;
  let hi = 1.2;
  const dist = (a: number) => {
    const s = stylusAt(a);
    return Math.hypot(s.x - TT.platter.cx, s.y - TT.platter.cy);
  };
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (dist(m) > r) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
/** The arm at rest: along the rest post (pointing down the page). */
export const ARM_REST_ANGLE = 0;
/** The lead-in (outermost music) and run-out grooves, mm from the spindle. */
export const GROOVE = { leadIn: 146, runOut: 62 } as const;

/* ── rear panels, face-on (width × height) ────────────────────────────── */

export const PLAYER_REAR = { w: 320, h: 106 } as const;
export const MIXER_REAR = { w: 270, h: 108 } as const;

/** Player rear sockets (face-on, origin top-left of the panel). */
export const PLAYER_REAR_JACKS = {
  outL: { x: 70, y: 56 },
  outR: { x: 94, y: 56 },
  digital: { x: 128, y: 56 },
  lan: { x: 154, y: 49 },
  usb: { x: 190, y: 50 },
  power: { x: 222, y: 46 },
  ac: { x: 252, y: 48 },
} as const;

/** Mixer rear sockets (face-on). */
export const MIXER_REAR_JACKS = {
  'ch2.phono.L': { x: 22, y: 40 }, 'ch2.phono.R': { x: 22, y: 64 },
  'ch2.line.L': { x: 44, y: 40 }, 'ch2.line.R': { x: 44, y: 64 },
  gnd: { x: 66, y: 52 },
  'ch1.phono.L': { x: 88, y: 40 }, 'ch1.phono.R': { x: 88, y: 64 },
  'ch1.line.L': { x: 110, y: 40 }, 'ch1.line.R': { x: 110, y: 64 },
  'booth.L': { x: 138, y: 40 }, 'booth.R': { x: 138, y: 70 },
  // seen from behind the mixer is mirrored: MASTER R on the left, L on the right
  'master.R': { x: 170, y: 46 }, 'master.L': { x: 200, y: 46 },
  usb: { x: 222, y: 76 },
  ac: { x: 236, y: 34 },
} as const;

/* ── camera views ─────────────────────────────────────────────────────── */

export type ViewName = 'booth' | 'mixer' | 'mixerUpper' | 'mixerLower' | 'deckA' | 'deckB' | 'jogs' | 'deckBWide';

/** Each view's frame in booth mm (padding included). */
export const VIEWS: Record<ViewName, Box> = {
  booth: { x: -12, y: -14, w: BOOTH_W + 24, h: BOOTH_D + 28 },
  mixer: { x: BOOTH_LAYOUT.mixer.x - 12, y: -2, w: MIXER_W + 24, h: MIXER_D + 24 },
  mixerUpper: { x: BOOTH_LAYOUT.mixer.x - 6, y: 0, w: MIXER_W + 12, h: 252 },
  mixerLower: { x: BOOTH_LAYOUT.mixer.x - 6, y: 214, w: MIXER_W + 12, h: 196 },
  deckA: { x: -10, y: -10, w: PLAYER_W + 20, h: PLAYER_D + 20 },
  deckB: { x: BOOTH_LAYOUT.B.x - 10, y: -10, w: PLAYER_W + 20, h: PLAYER_D + 20 },
  jogs: { x: 120, y: 150, w: BOOTH_W - 240, h: 262 },
  /** Deck B whole (the Screen 10 glass; deck A and the mixer come as insets). */
  deckBWide: { x: BOOTH_LAYOUT.B.x - 8, y: -8, w: PLAYER_W + 16, h: PLAYER_D + 16 },
};

/** Fit a frame into a w × h box (points), centred; returns the scale (pt per
 *  mm) and the offset. */
export function fitView(v: Box, w: number, h: number, pad = 4): { s: number; ox: number; oy: number } {
  const s = Math.min((w - pad * 2) / v.w, (h - pad * 2) / v.h);
  const ox = (w - v.w * s) / 2 - v.x * s;
  const oy = (h - v.h * s) / 2 - v.y * s;
  return { s, ox, oy };
}
