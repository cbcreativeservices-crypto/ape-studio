/**
 * THE SIGNAL PATH of an amplified string instrument, as data (Lab 4's
 * amplified-chain lessons): the AIR path a mic hears, drawn apart from the
 * ELECTRICAL taps a DI or an amp's direct output take. Pure; tested.
 *
 *   air     instrument → (pedals) → amp → SPEAKER CABLE → speaker → air → mic → desk
 *   di      a DI box between the instrument and the amp: THRU on to the amp,
 *           its balanced output to the desk (a separate, electrical source)
 *   amp     the amp's own direct / line output (pre or post its tone
 *           circuits — the model's manual says which) to the desk
 *
 * PATCH RULES (the lessons' electrical safety, in one place): a SPEAKER
 * output goes to a speaker cabinet ONLY, by a speaker cable — never to a mic
 * input, a line input or an ordinary DI (CORRECTIONS_LOG EG/BA/PS); a level
 * mismatch that is not dangerous is a CHECK (read the manual); a matching
 * level is OK.
 */

export type NodeKind = 'instrument' | 'bass' | 'steel' | 'pedals' | 'volume' | 'di' | 'amp' | 'head' | 'cab' | 'combo' | 'mic' | 'desk' | 'keys' | 'keysAmp' | 'lidSpeakers';
export type ChainNode = { id: string; kind: NodeKind; lane: 'air' | 'di' | 'amp'; col: number };
export type LinkKind = 'instrument' | 'speaker' | 'air' | 'mic' | 'balanced' | 'line';
export type ChainLink = { from: string; to: string; kind: LinkKind };

export type ChainSpec = {
  /** Something between the instrument and the amp (pedals; a steel's volume pedal). */
  pedals: 'pedals' | 'volume' | null;
  /** The amp and speaker in one box (combo) or a head and a cabinet. */
  rig: 'combo' | 'stack';
  /** A DI box between the instrument and the amp. */
  diBox: boolean;
  /** Where the DI sits: right after the instrument (default), or after the
   *  pedals — a steel's VOLUME pedal comes first, so its swells reach the DI
   *  (owner decision 2026-10-21: steel → volume pedal → DI → amp). */
  diAfter?: 'instrument' | 'pedals';
  /** The amp's own direct / line output. */
  ampDirect: boolean;
  /** R3-MK-04: that output is an unbalanced jack (a reed piano's AUX OUT), so
   *  it reaches the desk through a DI box on its own lane: AUX OUT → DI → desk. */
  ampDirectDi?: boolean;
  /** A node drawn as another object (Lab 2's electric pianos, 2026-10-05):
   *  the instrument as a keyboard, an amplifier and speakers built into it. */
  icons?: Partial<Record<string, NodeKind>>;
};

/** The nodes and links for a chain (air-lane columns left → right). */
export function buildChain(c: ChainSpec): { nodes: ChainNode[]; links: ChainLink[] } {
  const air: { id: string; kind: NodeKind }[] = [{ id: 'player', kind: 'instrument' }];
  if (c.pedals) air.push({ id: 'pedals', kind: c.pedals });
  air.push({ id: 'amp', kind: c.rig === 'combo' ? 'combo' : 'head' }, { id: 'cab', kind: 'cab' }, { id: 'mic', kind: 'mic' }, { id: 'desk', kind: 'desk' });
  const nodes: ChainNode[] = air.map((a, i) => ({ ...a, lane: 'air', col: i }));
  const links: ChainLink[] = [];
  // The node the DI box follows: the instrument, or the pedals (diAfter).
  const before = c.diBox && c.diAfter === 'pedals' && c.pedals ? 'pedals' : 'player';
  const bi = air.findIndex((a) => a.id === before);
  for (let i = 0; i + 1 < air.length; i++) {
    const from = air[i].id;
    const to = air[i + 1].id;
    if (c.diBox && from === before) continue; // the DI box sits in between
    links.push({ from, to, kind: to === 'cab' ? 'speaker' : to === 'mic' ? 'air' : to === 'desk' ? 'mic' : 'instrument' });
  }
  if (c.diBox) {
    nodes.push({ id: 'dibox', kind: 'di', lane: 'di', col: bi + 0.6 });
    links.push({ from: before, to: 'dibox', kind: 'instrument' }, { from: 'dibox', to: air[bi + 1].id, kind: 'instrument' }, { from: 'dibox', to: 'desk', kind: 'balanced' });
  }
  if (c.ampDirect) {
    const ampCol = nodes.find((n) => n.id === 'amp')!.col;
    nodes.push({ id: 'ampdi', kind: 'di', lane: 'amp', col: ampCol });
    links.push({ from: 'amp', to: 'ampdi', kind: 'line' });
    if (c.ampDirectDi && !c.diBox) {
      // The unbalanced jack's lead into a DI box, the DI's XLR to the desk.
      nodes.push({ id: 'dibox', kind: 'di', lane: 'amp', col: ampCol + 1.5 });
      links.push({ from: 'ampdi', to: 'dibox', kind: 'instrument' }, { from: 'dibox', to: 'desk', kind: 'balanced' });
    } else links.push({ from: 'ampdi', to: 'desk', kind: 'balanced' });
  }
  if (c.icons) for (const n of nodes) n.kind = c.icons[n.id] ?? n.kind;
  return { nodes, links };
}

export type Out = 'speakerOut' | 'diOut' | 'lineOut' | 'instrumentOut';
export type In = 'cabinet' | 'micIn' | 'lineIn' | 'diIn' | 'ampIn';
export type PatchVerdict = 'ok' | 'check' | 'stop';

/** Is this connection safe? (The lessons' electrical rule, in one place.) */
export function patchVerdict(from: Out, to: In): PatchVerdict {
  if (from === 'speakerOut') return to === 'cabinet' ? 'ok' : 'stop';
  if (to === 'cabinet') return 'stop';
  if (from === 'diOut') return to === 'micIn' ? 'ok' : 'check';
  if (from === 'lineOut') return to === 'lineIn' ? 'ok' : 'check';
  return to === 'diIn' || to === 'ampIn' ? 'ok' : 'check';
}

export const OUTS: readonly Out[] = ['speakerOut', 'diOut', 'lineOut', 'instrumentOut'];
export const INS: readonly In[] = ['cabinet', 'micIn', 'lineIn', 'diIn', 'ampIn'];

/* ── THE DRAWING'S GEOMETRY (DiPath.tsx), px — pure, so the tests reach it ──
 * Round-2 wiring fixes (2026-10-21):
 *   R2-MK-01  every electrical link has its OWN lane into the desk: when both
 *             taps are drawn, the amp's direct out runs on the UPPER lane and
 *             turns up on the inner vertical; the DI runs on the LOWER lane and
 *             turns up on the outer one — nested, never crossing, never shared.
 *             The amp's drop is short (it never reaches the DI lane) and runs
 *             clear of the amp's own label.
 *   R2-MK-02  a COMBO is ONE body: the amp and its speaker in one cabinet, no
 *             speaker cable outside it. The speaker stays its own tappable item,
 *             found behind the combo's grille (its label sits above the combo).
 */
export type XY = { x: number; y: number };
export type PathSeg = { kind: 'line'; pts: XY[] } | { kind: 'cubic'; p0: XY; c1: XY; c2: XY; p3: XY };
export type DiPathLink = {
  l: ChainLink;
  seg: PathSeg | null;
  arcs?: { x0: number; x1: number; y: number };
  /** R3-MK-01/02/04: drawn OVER the icons, its plug seated in a jack on the
   *  icon's visible face (each point a plug, seen end-on). */
  over?: boolean;
  plugs?: XY[];
};
export type DiPathGeom = {
  S: number;
  /** The combo's drawn size (one body, a little larger than a plain icon). */
  SC: number;
  /** The combo is drawn as one body holding its speaker (no outside speaker cable). */
  merged: boolean;
  colW: number;
  pad: number;
  lanes: { air: number; di: number; amp: number };
  nodes: ChainNode[];
  /** Where each node's drawing is centred (merged: 'cab' = the speaker's centre, no drawing of its own). */
  pos: Record<string, XY>;
  /** Where a tap picks each node. */
  tapAt: Record<string, XY>;
  /** Each node's label anchor (centre-aligned). */
  label: Record<string, XY>;
  /** The drawn half-width of each node's body. */
  halfW: Record<string, number>;
  /** Merged: the speaker's circle (the highlight ring). */
  speaker: { x: number; y: number; r: number } | null;
  links: DiPathLink[];
  /** The struck-out SPEAKER OUT → DESK patch; its words' row (inside the glass). */
  bad: { p0: XY; c1: XY; c2: XY; p3: XY; mid: XY; labelY: number };
  /** The ELECTRICAL lane caption's row. */
  elY: number;
  /** The AIR lane caption's row (raised above a combo's SPEAKER label). */
  airY: number;
};

/** The 1 × 12 combo's own drawing (chainIcons ComboIcon), mm: front 622 × 445,
 *  the strap handle 24 above the top, the speaker 60 right of center and 255
 *  below the top, frame Ø ≈ 304. The icon is centred 13 mm below the box centre. */
export const COMBO_ART = { W: 622, H: 445, handle: 24, spk: { dx: 60, dy: 255, r: 152 } } as const;
export const comboScale = (SC: number) => Math.min(SC / COMBO_ART.W, (SC * 0.92) / (COMBO_ART.H + 26));
const comboY0 = -(COMBO_ART.H - 26) / 2;
/** The desk icon (DeskIcon): 1.04 S wide, its front edge 0.348 S below its centre. */
const DESK_HALF_H = 0.348;
/** The amp direct-out panel (AmpOutIcon): its top 0.22 S above its centre. */
const AMPOUT_HALF_H = 0.22;

/* R3-MK-01/02 (2026-10-21): the steel's cables are seated in real jacks.
 * VolumeIcon (k = 0.0035 S per mm, drawn 0.32 S low): its side jacks at
 * x −60 (IN) and +20 (OUT), 21 mm up the base. SteelIcon (k = 1.25 S / 940,
 * drawn 0.46 S low): the OUTPUT JACK on the body's underside at the changer
 * end (u 420, right of the leg); the cable leaves from it. Fractions of S
 * from the node's centre — chainIcons.tsx draws from the same numbers. */
export const VOL_ART = { k: 0.0035, dy: 0.32, inX: -60, outX: 20, jackY: -21 } as const;
export const STEEL_ART = { k: 1.25 / 940, dy: 0.46, jackU: 420, bodyBottom: -610, plugTail: -562 } as const;
export const volJack = (S: number, which: 'in' | 'out'): XY => ({ x: (which === 'in' ? VOL_ART.inX : VOL_ART.outX) * VOL_ART.k * S, y: (VOL_ART.dy + VOL_ART.jackY * VOL_ART.k) * S });
export const steelJack = (S: number): XY => ({ x: STEEL_ART.jackU * STEEL_ART.k * S, y: (STEEL_ART.dy + STEEL_ART.bodyBottom * STEEL_ART.k) * S });

/* R6 (2026-10-21, grade R5-MIK-01): the tine piano's OUTPUT JACK on its case
 * front, in the left end block (KeyboardIcon 'rhodes': 988 wide, the top seen
 * ×0.55 deep + a 70 front, k = S / 988). The keys → DI cord leaves from it. */
export const KEYS_ART = { W: 988, D: 563, f: 0.55, front: 70, cheek: 71, jackY: 0.72 } as const;
const keysK = () => Math.min(1 / KEYS_ART.W, 0.9 / (KEYS_ART.D * KEYS_ART.f + KEYS_ART.front));
export const keysJack = (S: number): XY => {
  const tall = KEYS_ART.D * KEYS_ART.f + KEYS_ART.front;
  return { x: (-KEYS_ART.W / 2 + KEYS_ART.cheek / 2) * keysK() * S, y: (-tall / 2 + KEYS_ART.D * KEYS_ART.f + KEYS_ART.front * KEYS_ART.jackY) * keysK() * S };
};
/* R6 (MIK-03): the bass head's three-quarter drawing (HeadIcon): front 330 ×
 * 75, its top/side 250 deep seen ×0.45 at 30°. The direct out's drop leaves
 * from the FRONT's underside, left of the side face the speaker cable leaves. */
export const HEAD_ART = { W: 330, H: 75, depth: 250 * 0.45 } as const;
export const headFront = (S: number): { x1: number; bottom: number } => {
  const dx = HEAD_ART.depth * Math.cos(Math.PI / 6);
  const dy = HEAD_ART.depth * Math.sin(Math.PI / 6);
  const tall = HEAD_ART.H + dy + 14;
  const k = Math.min(1 / (HEAD_ART.W + dx), 0.85 / tall) * S;
  return { x1: (-(HEAD_ART.W + dx) / 2 + HEAD_ART.W) * k, bottom: (tall / 2 - 7) * k };
};

/** Points along a drawn link (px). */
export function sampleSeg(seg: PathSeg, n = 40): XY[] {
  if (seg.kind === 'line') return seg.pts;
  const { p0, c1, c2, p3 } = seg;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return { x: a * p0.x + b * c1.x + c * c2.x + d * p3.x, y: a * p0.y + b * c1.y + c * c2.y + d * p3.y };
  });
}

export function diPathLayout(spec: ChainSpec, w: number, h: number, ts: number, labelW: (id: string) => number): DiPathGeom {
  const { nodes, links } = buildChain(spec);
  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const amp0 = byId('amp');
  const cab0 = byId('cab');
  const merged = spec.rig === 'combo' && amp0.kind === 'combo' && cab0.kind === 'cab';
  const colOf = (n: ChainNode) => (merged && n.lane === 'air' && n.col >= cab0.col ? (n.id === 'cab' ? amp0.col : n.col - 1) : n.col);
  const nAir = nodes.filter((n) => n.lane === 'air').length - (merged ? 1 : 0);
  const pad = Math.max(30, w * 0.07);
  const colW = (w - 2 * pad) / Math.max(1, nAir - 1);
  const both = spec.diBox && spec.ampDirect;
  const lanes = both ? { air: h * 0.27, amp: h * 0.5, di: h * 0.72 } : { air: h * 0.27, di: h * 0.6, amp: h * 0.7 };
  const S = Math.max(26, Math.min(colW * 0.6, h * 0.17));
  const SC = merged ? S * 1.3 : S;
  const kc = comboScale(SC);
  const halfW: Record<string, number> = {};
  for (const n of nodes) halfW[n.id] = S * 0.5;
  if (merged) halfW.amp = (COMBO_ART.W / 2) * kc;
  const pos: Record<string, XY> = {};
  for (const n of nodes) pos[n.id] = { x: pad + colOf(n) * colW, y: lanes[n.lane] };
  const amp = pos.amp;
  // The amp's drop to its direct out: clear of the amp's label, inside its body.
  const ampLabelHalf = labelW('amp') / 2;
  // R6 MIK-03: a bass HEAD's drop leaves from its front's underside, well left
  // of the side face its speaker cable leaves from (never on that cable).
  const head = amp0.kind === 'head' ? headFront(S) : null;
  const dropDx = Math.min(head ? head.x1 - S * 0.08 : halfW.amp - 2, ampLabelHalf + 6);
  if (spec.ampDirect) pos.ampdi = { x: amp.x + dropDx, y: lanes.amp };
  const speaker = merged ? { x: amp.x + COMBO_ART.spk.dx * kc, y: amp.y + (comboY0 + COMBO_ART.spk.dy) * kc, r: COMBO_ART.spk.r * kc } : null;
  if (speaker) pos.cab = { x: speaker.x, y: speaker.y };
  const tapAt: Record<string, XY> = { ...pos };
  /** A label's row stays inside the glass (its words 7·ts above the row, ≥ 9 pt). */
  const topRow = 7 * ts + 2;
  const bottomRow = h - 7 * ts - 2;
  if (merged) tapAt.amp = { x: amp.x - halfW.amp * 0.45, y: amp.y + comboY0 * kc * 0.6 };
  const labelRow = (y: number) => y + S * 0.5 + 14 * ts;
  const label: Record<string, XY> = {};
  for (const n of nodes) label[n.id] = { x: pos[n.id].x, y: labelRow(pos[n.id].y) };
  if (merged) {
    label.amp = { x: amp.x, y: amp.y + Math.max(S * 0.5, (comboY0 + COMBO_ART.H) * kc) + 14 * ts };
    label.cab = { x: amp.x, y: amp.y + (comboY0 - COMBO_ART.handle) * kc - 10 * ts };
  }
  // A label wider than the body: nudge it left so the drop keeps 5 px clear.
  if (spec.ampDirect && ampLabelHalf + 5 > dropDx) label.amp = { ...label.amp, x: amp.x - (ampLabelHalf + 5 - dropDx) };
  // The direct out's words sit LEFT of its panel, on its lane (clear of the DI lane below at any height).
  // R6 MIK-02: with a DI box the THRU climbs past that side — the words go UNDER the panel instead.
  if (spec.ampDirect) label.ampdi = spec.diBox ? { x: pos.ampdi.x, y: lanes.amp + S * AMPOUT_HALF_H + 12 * ts } : { x: pos.ampdi.x - S * 0.5 - 4 - labelW('ampdi') / 2, y: lanes.amp + 3 * ts };
  // The desk's label sits ABOVE it: its underside takes the electrical lanes.
  const desk = pos.desk;
  label.desk = { x: desk.x, y: desk.y - S * DESK_HALF_H - 10 * ts };
  const deskIn = desk.y + S * (DESK_HALF_H - 0.02);
  const inner = desk.x - S * 0.22;
  const outer = desk.x + S * 0.1;
  const single = desk.x - S * 0.14;
  const out: DiPathLink[] = links.map((l) => {
    const a = pos[l.from];
    const b = pos[l.to];
    if (l.kind === 'speaker' && merged) return { l, seg: null }; // inside the one body
    if (l.kind === 'air') {
      const x0 = (merged ? amp.x + halfW.amp : a.x + S * 0.55) + S * 0.02;
      return { l, seg: null, arcs: { x0, x1: b.x - S * 0.4, y: merged ? amp.y : a.y } };
    }
    if (l.to === 'desk' && l.kind === 'balanced') {
      const vx = both ? (l.from === 'ampdi' ? inner : outer) : single;
      return { l, seg: { kind: 'line', pts: [{ x: a.x + S * 0.5, y: a.y }, { x: vx, y: a.y }, { x: vx, y: deskIn }] } };
    }
    if (l.from === 'amp' && l.to === 'ampdi') {
      return { l, seg: { kind: 'line', pts: [{ x: b.x, y: a.y + (head ? head.bottom : 0) }, { x: b.x, y: b.y - S * AMPOUT_HALF_H + 1 }] } };
    }
    if (l.from === 'ampdi' && l.to === 'dibox') {
      // R3-MK-04: the AUX OUT's lead, seated in the panel's jack, into the DI's input end.
      const p0 = { x: a.x, y: a.y };
      const p3 = { x: b.x - S * 0.5, y: b.y + S * 0.12 };
      return { l, seg: { kind: 'cubic', p0, c1: { x: a.x + S * 0.6, y: a.y }, c2: { x: p3.x - S * 0.3, y: p3.y }, p3 }, over: true, plugs: [p0] };
    }
    if (a.y === b.y && byId(l.from).kind === 'steel' && byId(l.to).kind === 'volume') {
      // R3-MK-02: from the steel's body jack (its output, on the body), down to the floor, into the pedal's IN jack.
      const t = steelJack(S);
      const j = volJack(S, 'in');
      const p0 = { x: a.x + t.x, y: a.y + t.y };
      const p3 = { x: b.x + j.x, y: b.y + j.y };
      return { l, seg: { kind: 'cubic', p0, c1: { x: p0.x, y: p0.y + (p3.y - p0.y) * 0.9 }, c2: { x: p3.x - S * 0.3, y: p3.y }, p3 }, over: true, plugs: [p3] };
    }
    if (a.y === b.y) return { l, seg: { kind: 'line', pts: [{ x: a.x + halfW[l.from], y: a.y }, { x: b.x - halfW[l.to], y: b.y }] } };
    if (b.y > a.y && l.to === 'dibox' && byId(l.from).kind === 'volume') {
      // R3-MK-01: from the plug in the volume pedal's OUT jack, down into the DI's input end.
      const j = volJack(S, 'out');
      const p0 = { x: a.x + j.x, y: a.y + j.y };
      return { l, seg: { kind: 'cubic', p0, c1: { x: p0.x, y: p0.y + (b.y - p0.y) * 0.5 }, c2: { x: b.x - S * 0.8, y: b.y + S * 0.1 }, p3: { x: b.x - S * 0.5, y: b.y + S * 0.1 } }, over: true, plugs: [p0] };
    }
    if (b.y > a.y && l.to === 'dibox' && byId(l.from).kind === 'keys') {
      // R6 (R5-MIK-01): from the plug in the tine piano's OUTPUT JACK on its case front, down into the DI's input end.
      const j = keysJack(S);
      const p0 = { x: a.x + j.x, y: a.y + j.y };
      return { l, seg: { kind: 'cubic', p0, c1: { x: p0.x, y: p0.y + (b.y - p0.y) * 0.5 }, c2: { x: b.x - S * 0.8, y: b.y + S * 0.1 }, p3: { x: b.x - S * 0.5, y: b.y + S * 0.1 } }, over: true, plugs: [p0] };
    }
    if (b.y > a.y && l.to === 'dibox') {
      // Down into the DI box's input jack, at its far (left) end.
      return { l, seg: { kind: 'cubic', p0: { x: a.x, y: a.y + S * 0.5 }, c1: { x: a.x, y: a.y + S * 0.5 + (b.y - a.y) * 0.4 }, c2: { x: b.x - S * 0.8, y: b.y + S * 0.1 }, p3: { x: b.x - S * 0.5, y: b.y + S * 0.1 } } };
    }
    if (l.from === 'dibox' && l.kind === 'instrument') {
      // The DI's THRU, from the same end as its input, up to the next box.
      // R6 MIK-02: it rises at once (staying right of the input cord, never
      // crossing it) — the input's words sit above their drawing (below).
      const bx = b.x - halfW[l.to];
      return { l, seg: { kind: 'cubic', p0: { x: a.x - S * 0.5, y: a.y }, c1: { x: a.x - S * 0.55, y: a.y - (a.y - b.y) * 0.45 }, c2: { x: bx - S * 0.45, y: b.y + S * 0.35 }, p3: { x: bx, y: b.y + S * 0.1 } } };
    }
    // Any other link between lanes (none in the lessons' chains today).
    return { l, seg: { kind: 'cubic', p0: { x: a.x, y: a.y + S * 0.5 }, c1: { x: a.x, y: (a.y + b.y) / 2 }, c2: { x: b.x, y: (a.y + b.y) / 2 }, p3: { x: b.x, y: b.y - S * 0.42 } } };
  });
  // SPEAKER OUT → DESK (struck out): from the amp's upper right, clear of the
  // labels above the combo and the desk.
  const p0 = merged ? { x: amp.x + halfW.amp * 0.8, y: amp.y + comboY0 * kc * 0.7 } : { x: amp.x + S * 0.3, y: amp.y - S * 0.6 };
  const p3 = { x: desk.x - S * 0.42, y: desk.y - S * 0.3 };
  // Its words (R2 follow-up): never above the glass — at a short height the
  // row comes down and the curve's crest (the struck-out X) comes with it.
  const labelY = Math.max(topRow, amp.y - S * 1.25 - 16 * ts);
  const crest = labelY + 16 * ts;
  const cy = (8 * crest - p0.y - p3.y) / 6; // the cubic's t = 1/2 passes through the crest
  const c1 = { x: amp.x + colW, y: cy };
  const c2 = { x: desk.x - colW * 0.5, y: cy };
  const bad = { p0, c1, c2, p3, mid: { x: (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8, y: crest }, labelY };
  const elY = Math.min(bottomRow, (spec.diBox ? lanes.di : lanes.amp) + S * 0.5 + 34 * ts);
  // The cord that drops into the DI — from the instrument or (R3-MK-01) from
  // whichever node feeds the DI, a steel's volume pedal.
  const cordLink = out.find((k) => k.l.to === 'dibox' && k.l.kind === 'instrument' && pos[k.l.from].y < pos.dibox.y);
  const thru = out.find((k) => k.l.from === 'dibox' && k.l.kind === 'instrument');
  // R6 MIK-02: with a THRU, two cords run under the feeding node (its cord
  // down, the THRU back up past it) — its words sit ABOVE its drawing, so no
  // cord crosses them at any width; the AIR caption keeps above them.
  const feedRow = cordLink?.seg && thru ? pos[cordLink.l.from].y - S * 0.5 - 4 * ts : null;
  const airY = Math.max(topRow, Math.min(lanes.air - S * 0.5 - 18 * ts, merged ? label.cab.y - 16 * ts : Infinity, feedRow != null ? feedRow - 14 * ts : Infinity));
  if (cordLink && feedRow != null) label[cordLink.l.from] = { x: pos[cordLink.l.from].x, y: feedRow };
  else if (cordLink?.seg) {
    // (no THRU) that node's words move right of the cord, where it crosses their row.
    const id = cordLink.l.from;
    const row = label[id].y;
    const pts = sampleSeg(cordLink.seg, 60).filter((p) => p.y >= row - 7 * ts - 2 && p.y <= row + 5 * ts + 2);
    const cx = Math.max(pos[id].x, ...pts.map((p) => p.x));
    label[id] = { x: cx + 4 + labelW(id) / 2, y: row };
    // ...and the next word along the row steps right if it would touch them.
    const next = nodes.filter((n) => n.lane === 'air' && n.id !== id && label[n.id].x > pos[id].x && Math.abs(label[n.id].y - row) < 1).sort((a, b) => label[a.id].x - label[b.id].x)[0];
    if (next) {
      const gap = label[next.id].x - labelW(next.id) / 2 - (label[id].x + labelW(id) / 2);
      if (gap < 6) label[next.id] = { ...label[next.id], x: label[next.id].x + (6 - gap) };
    }
  }
  return { S, SC, merged, colW, pad, lanes, nodes, pos, tapAt, label, halfW, speaker, links: out, bad, elY, airY };
}
