/**
 * The CIRCLE MENU's places (owner-approved design, 2026-11-20): what each of
 * the twelve circles is, where it sits on the clock face, and where it goes.
 *
 * PURE ON PURPOSE: no imports, so node tests read it directly and the app-start
 * graph does not grow (the panel that uses it loads after the first frame).
 *
 * Clock order (owner's FINAL order, 2026-11-20, with Help and Settings
 * swapped the same day): 12 Glossary, 1 Audio Tools, 2 Labs, 3 Study
 * Dashboard, 4 Enrollment, 5 Progress, 6 Home, 7 Settings, 8 Help,
 * 9 Community, 10 Profile, 11 Calculator Lab.
 */

export type PlaceKey =
  | 'gloss'
  | 'tools'
  | 'labs'
  | 'study'
  | 'enroll'
  | 'prog'
  | 'home'
  | 'set'
  | 'help'
  | 'comm'
  | 'prof'
  | 'calc';

/** Where a circle's word sits: below it (''), above it ('up'), or beside it
 *  on its left ('sl') / right ('sr'). Per SLOT, as in the approved mockup, so
 *  nothing touches at 390 pt. */
export type LabelPos = '' | 'up' | 'sl' | 'sr';

/** How a place is reached. `tab` places are the four old bottom tabs; `root`
 *  places are root-stack screens pushed over the tabs. */
export type Destination =
  | { kind: 'tab'; tab: 'Home' | 'Study' | 'Achievements' | 'Profile'; root?: string }
  | { kind: 'glossary' }
  | { kind: 'root'; route: string; params?: Record<string, unknown> }
  | { kind: 'community' };

export type Place = {
  key: PlaceKey;
  /** Clock hour 1…12. */
  hour: number;
  /** The words drawn under the circle ('\n' = second line). */
  label: string;
  /** The name a screen reader says. */
  name: string;
  /** The place's own colour (ring, glow and lit label). */
  color: string;
  dest: Destination;
};

/** Owner's final clock order, 2026-11-20 (Help 8, Settings 7). */
export const CLOCK_ORDER: Readonly<Record<number, PlaceKey>> = {
  12: 'gloss',
  1: 'tools',
  2: 'labs',
  3: 'study',
  4: 'enroll',
  5: 'prog',
  6: 'home',
  7: 'set',
  8: 'help',
  9: 'comm',
  10: 'prof',
  11: 'calc',
};

/** Label side per clock SLOT (the mockup's LABEL_POS). */
export const LABEL_POS: Readonly<Record<number, LabelPos>> = {
  1: 'up',
  2: 'sl',
  3: 'sl',
  4: 'sl',
  5: 'sr',
  6: 'up',
  7: 'sl',
  8: 'sr',
  9: 'sr',
  10: 'sr',
  11: 'up',
  12: '',
};

const PLACES: Readonly<Record<PlaceKey, Omit<Place, 'hour'>>> = {
  gloss: { key: 'gloss', label: 'GLOSSARY', name: 'Glossary', color: '#7fd4ff', dest: { kind: 'glossary' } },
  tools: { key: 'tools', label: 'AUDIO\nTOOLS', name: 'Audio Tools', color: '#ff5a48', dest: { kind: 'root', route: 'ToolsHub' } },
  // Labs wears the blue headphones and Study Dashboard the orange card and
  // bulb (owner's final icon choice, 2026-11-20): their colours swapped with them.
  labs: { key: 'labs', label: 'LABS', name: 'Labs', color: '#2f9bff', dest: { kind: 'root', route: 'AudioLearning' } },
  study: {
    key: 'study',
    label: 'STUDY\nDASHBOARD',
    name: 'Study Dashboard',
    color: '#ff8a1e',
    dest: { kind: 'tab', tab: 'Study', root: 'Dashboard' },
  },
  enroll: {
    key: 'enroll',
    label: 'ENROLLMENT',
    name: 'Enrollment',
    color: '#3fd3e6',
    dest: { kind: 'root', route: 'Awards', params: { category: 'enrollment' } },
  },
  prog: {
    key: 'prog',
    label: 'PROGRESS',
    name: 'Progress',
    color: '#e6e6e6',
    dest: { kind: 'tab', tab: 'Achievements', root: 'AchievementsHome' },
  },
  home: { key: 'home', label: 'HOME', name: 'Home', color: '#ffc64d', dest: { kind: 'tab', tab: 'Home' } },
  set: { key: 'set', label: 'SETTINGS', name: 'Settings', color: '#b9bec8', dest: { kind: 'root', route: 'Settings' } },
  help: { key: 'help', label: 'HELP', name: 'Help', color: '#c4a2ff', dest: { kind: 'root', route: 'Help' } },
  comm: { key: 'comm', label: 'COMMUNITY', name: 'Community', color: '#ff7a9c', dest: { kind: 'community' } },
  prof: { key: 'prof', label: 'PROFILE', name: 'Profile', color: '#37e05f', dest: { kind: 'tab', tab: 'Profile' } },
  calc: { key: 'calc', label: 'CALCULATOR\nLAB', name: 'Calculator Lab', color: '#b45bff', dest: { kind: 'root', route: 'CalcLab' } },
};

/**
 * The circles to draw, clockwise from 12 (the order a screen reader walks
 * them). `communityVisible` is config/communityVisible's switch: while it is
 * off the Community circle is not drawn and its slot stays empty, so every
 * other circle keeps its place on the clock.
 */
export function circlePlaces(communityVisible: boolean): Place[] {
  const out: Place[] = [];
  for (const hour of [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    const key = CLOCK_ORDER[hour];
    if (key === 'comm' && !communityVisible) continue;
    out.push({ ...PLACES[key], hour });
  }
  return out;
}

/** A place's own colour (its ring, glow and lit word), for screens that
 *  draw the same place elsewhere (the Explore hero's spokes). */
export function placeColor(key: PlaceKey): string {
  return PLACES[key].color;
}

/** The lit circle: where the person is now. `tab` is the focused bottom-tab
 *  route; `nested` the focused screen inside it (Study and Progress stacks). */
export function currentPlace(tab: string | undefined, nested: string | undefined): PlaceKey | null {
  switch (tab) {
    case 'Home':
      return 'home';
    case 'Study':
      return nested === 'Glossary' ? 'gloss' : 'study';
    case 'Achievements':
      return 'prog';
    case 'Profile':
      return 'prof';
    default:
      return null;
  }
}


// ── geometry (points) ────────────────────────────────────────────────────

/** 50 pt (owner 2026-11-20: "13% smaller, keeping it tucked into the
 *  corner"; it was 58). Same left inset and bottom edge, so it shrinks toward
 *  the corner; still a ≥ 44 pt touch target. */
export const MENU_BUTTON = 50;
export const MENU_BUTTON_LEFT = 18;
/** The button's bottom edge sits this far above the bottom safe-area inset. */
export const MENU_BUTTON_LIFT = 4;
export const CIRCLE = 54;
export const RING_R = 150;
/** Gap kept between the button's top and the last line a tab screen scrolls to. */
const CLEAR_GAP = 12;

/** How much a tab screen's scrolling content must end above the screen
 *  bottom so its last item can be scrolled clear of the MENU button. */
export function menuClearance(insetBottom: number): number {
  return insetBottom + MENU_BUTTON_LIFT + MENU_BUTTON + CLEAR_GAP;
}

export type RingGeometry = {
  /** Panel top when open (screen y). */
  openTop: number;
  cx: number;
  cy: number;
  r: number;
  /** The button's centre (screen coords). */
  fabX: number;
  fabY: number;
};

/**
 * The open panel and the clock ring for a w × h area. The design is set on a
 * 390 × 844 phone (inset 34): the panel rises to exactly half the screen and
 * the ring's centre sits 178 pt above the bottom inset, so Home (6 o'clock)
 * clears the swipe-home strip. Smaller areas keep every circle on screen: the
 * ring narrows to the width, and the panel rises higher than half when the
 * ring needs it (never above the top inset).
 */
export function ringGeometry(w: number, h: number, insetTop: number, insetBottom: number): RingGeometry {
  const fabX = MENU_BUTTON_LEFT + MENU_BUTTON / 2;
  const fabY = h - insetBottom - MENU_BUTTON_LIFT - MENU_BUTTON / 2;
  const half = CIRCLE / 2;
  // Width: a circle plus a little air each side of the ring.
  let r = Math.min(RING_R, Math.floor((w - CIRCLE - 24) / 2));
  // Height: Home's bottom edge at the inset line, Glossary's top 33 below the
  // panel's top edge (room for the grip), the panel top below the top inset.
  const bottomLine = h - insetBottom - 1;
  const maxR = Math.floor((bottomLine - (insetTop + 8 + 33) - 2 * half) / 2);
  r = Math.max(60, Math.min(r, maxR));
  const cy = bottomLine - half - r;
  const openTop = Math.max(insetTop + 8, Math.min(Math.round(h / 2), cy - r - half - 33));
  return { openTop, cx: w / 2, cy, r, fabX, fabY };
}

/** A slot's circle centre on the ring. */
export function slotCentre(g: RingGeometry, hour: number): { x: number; y: number } {
  const a = ((90 - hour * 30) * Math.PI) / 180;
  return { x: g.cx + g.r * Math.cos(a), y: g.cy - g.r * Math.sin(a) };
}

/** Spread order: the circle nearest the corner button flies out first (rank 0)
 *  and folds back last, as in the mockup. Returns hour → rank. */
export function spreadRanks(g: RingGeometry, hours: readonly number[]): Record<number, number> {
  const d = hours
    .map((hour) => {
      const p = slotCentre(g, hour);
      return { hour, dist: Math.hypot(p.x - g.fabX, p.y - g.fabY) };
    })
    .sort((a, b) => a.dist - b.dist);
  const out: Record<number, number> = {};
  d.forEach((it, rank) => {
    out[it.hour] = rank;
  });
  return out;
}

/** One circle's flight at panel progress `pr` (0 closed … 1 open, may
 *  run a hair past on a drag): the mockup's curve, exactly. */
export function flight(pr: number, rank: number): { q: number; scale: number; opacity: number; label: number } {
  'worklet';
  const dl = 0.028 * rank;
  const q = Math.max(0, Math.min(1.06, (pr - dl) / (1 - dl)));
  const q1 = Math.min(q, 1);
  return {
    q,
    scale: 0.45 + 0.55 * q1,
    opacity: Math.max(0, Math.min(1, q * 1.8)),
    label: Math.max(0, Math.min(1, (q1 - 0.7) / 0.3)),
  };
}

/** Where a released drag settles: a flick (|v| > 450 pt/s) wins, otherwise
 *  the nearer end. `top` is the panel's top edge, `v` its speed (down +). */
export function settleOpen(top: number, v: number, openTop: number, closedTop: number): boolean {
  'worklet';
  if (v < -450) return true;
  if (v > 450) return false;
  return top < (openTop + closedTop) / 2;
}

/** The drag's panel top: firm resistance past half height, a hair past closed. */
export function dragTop(raw: number, openTop: number, closedTop: number): number {
  'worklet';
  if (raw < openTop) {
    const over = openTop - raw;
    return openTop - 22 * (1 - Math.exp(-over / 80));
  }
  if (raw > closedTop) return closedTop + Math.min(4, (raw - closedTop) * 0.06);
  return raw;
}
