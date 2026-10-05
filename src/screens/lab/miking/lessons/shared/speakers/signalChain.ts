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

export type NodeKind = 'instrument' | 'pedals' | 'volume' | 'di' | 'amp' | 'head' | 'cab' | 'combo' | 'mic' | 'desk' | 'keys' | 'keysAmp' | 'lidSpeakers';
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
