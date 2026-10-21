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
  /** The amp's own direct / line output. */
  ampDirect: boolean;
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
  for (let i = 0; i + 1 < air.length; i++) {
    const from = air[i].id;
    const to = air[i + 1].id;
    if (c.diBox && from === 'player') continue; // the DI box sits in between
    links.push({ from, to, kind: to === 'cab' ? 'speaker' : to === 'mic' ? 'air' : to === 'desk' ? 'mic' : 'instrument' });
  }
  if (c.diBox) {
    nodes.push({ id: 'dibox', kind: 'di', lane: 'di', col: 0.6 });
    links.push({ from: 'player', to: 'dibox', kind: 'instrument' }, { from: 'dibox', to: air[1].id, kind: 'instrument' }, { from: 'dibox', to: 'desk', kind: 'balanced' });
  }
  if (c.ampDirect) {
    const ampCol = nodes.find((n) => n.id === 'amp')!.col;
    nodes.push({ id: 'ampdi', kind: 'di', lane: 'amp', col: ampCol });
    links.push({ from: 'amp', to: 'ampdi', kind: 'line' }, { from: 'ampdi', to: 'desk', kind: 'balanced' });
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
export type DiPathLink = { l: ChainLink; seg: PathSeg | null; arcs?: { x0: number; x1: number; y: number } };
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
  /** The struck-out SPEAKER OUT → DESK patch. */
  bad: { p0: XY; c1: XY; c2: XY; p3: XY; mid: XY };
  /** The ELECTRICAL lane caption's row. */
  elY: number;
  /** The AIR lane caption's row (raised above a combo's SPEAKER label). */
  airY: number;
};

/** The 1 × 12 combo's own drawing (chainIcons ComboIcon), mm: front 622 × 445,
 *  the strap handle 24 above the top, the speaker 60 right of centre and 255
 *  below the top, frame Ø ≈ 304. The icon is centred 13 mm below the box centre. */
export const COMBO_ART = { W: 622, H: 445, handle: 24, spk: { dx: 60, dy: 255, r: 152 } } as const;
export const comboScale = (SC: number) => Math.min(SC / COMBO_ART.W, (SC * 0.92) / (COMBO_ART.H + 26));
const comboY0 = -(COMBO_ART.H - 26) / 2;
/** The desk icon (DeskIcon): 1.04 S wide, its front edge 0.348 S below its centre. */
const DESK_HALF_H = 0.348;
/** The amp direct-out panel (AmpOutIcon): its top 0.22 S above its centre. */
const AMPOUT_HALF_H = 0.22;

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
  const dropDx = Math.min(halfW.amp - 2, ampLabelHalf + 6);
  if (spec.ampDirect) pos.ampdi = { x: amp.x + dropDx, y: lanes.amp };
  const speaker = merged ? { x: amp.x + COMBO_ART.spk.dx * kc, y: amp.y + (comboY0 + COMBO_ART.spk.dy) * kc, r: COMBO_ART.spk.r * kc } : null;
  if (speaker) pos.cab = { x: speaker.x, y: speaker.y };
  const tapAt: Record<string, XY> = { ...pos };
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
      return { l, seg: { kind: 'line', pts: [{ x: b.x, y: a.y }, { x: b.x, y: b.y - S * AMPOUT_HALF_H + 1 }] } };
    }
    if (a.y === b.y) return { l, seg: { kind: 'line', pts: [{ x: a.x + halfW[l.from], y: a.y }, { x: b.x - halfW[l.to], y: b.y }] } };
    if (b.y > a.y && l.to === 'dibox') {
      // Down into the DI box's input jack, at its far (left) end.
      return { l, seg: { kind: 'cubic', p0: { x: a.x, y: a.y + S * 0.5 }, c1: { x: a.x, y: a.y + S * 0.5 + (b.y - a.y) * 0.4 }, c2: { x: b.x - S * 0.8, y: b.y + S * 0.1 }, p3: { x: b.x - S * 0.5, y: b.y + S * 0.1 } } };
    }
    if (l.from === 'dibox' && l.kind === 'instrument') {
      // The DI's THRU, from the same end as its input, up to the next box.
      const bx = b.x - halfW[l.to];
      return { l, seg: { kind: 'cubic', p0: { x: a.x - S * 0.5, y: a.y }, c1: { x: a.x - S * 0.95, y: a.y - S * 0.15 }, c2: { x: bx - S * 0.45, y: b.y + S * 0.35 }, p3: { x: bx, y: b.y + S * 0.1 } } };
    }
    // Any other link between lanes (none in the lessons' chains today).
    return { l, seg: { kind: 'cubic', p0: { x: a.x, y: a.y + S * 0.5 }, c1: { x: a.x, y: (a.y + b.y) / 2 }, c2: { x: b.x, y: (a.y + b.y) / 2 }, p3: { x: b.x, y: b.y - S * 0.42 } } };
  });
  // SPEAKER OUT → DESK (struck out): from the amp's upper right, clear of the
  // labels above the combo and the desk.
  const p0 = merged ? { x: amp.x + halfW.amp * 0.8, y: amp.y + comboY0 * kc * 0.7 } : { x: amp.x + S * 0.3, y: amp.y - S * 0.6 };
  const p3 = { x: desk.x - S * 0.42, y: desk.y - S * 0.3 };
  const bad = { p0, c1: { x: amp.x + colW, y: amp.y - S * 1.6 }, c2: { x: desk.x - colW * 0.5, y: desk.y - S * 1.6 }, p3, mid: { x: (amp.x + desk.x) / 2, y: amp.y - S * 1.25 } };
  const elY = (spec.diBox ? lanes.di : lanes.amp) + S * 0.5 + 34 * ts;
  const airY = Math.min(lanes.air - S * 0.5 - 18 * ts, merged ? label.cab.y - 16 * ts : Infinity);
  return { S, SC, merged, colW, pad, lanes, nodes, pos, tapAt, label, halfW, speaker, links: out, bad, elY, airY };
}
