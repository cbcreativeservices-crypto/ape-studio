/**
 * gainEngine — the signal-chain model behind the Gain Staging Lab (owner spec
 * 2026-08-07). A source level enters a chain of stages; each stage adds gain;
 * the level propagates and — crucially — once a stage OVERLOADS, the distortion
 * is baked in and rides downstream even if a later fader pulls the level back
 * down. That single fact is the lab's core lesson.
 *
 * Principle-first (owner ruling): the early lessons show REGIONS, not exact
 * dBFS targets. Internally levels are dB on a relative scale where 0 = the
 * overload ceiling (full scale) and the "healthy operating range" is a
 * comfortable band below it with headroom — no magic −18 rule is taught.
 */

/** Overload ceiling — a stage output at/above this clips (relative full scale). */
export const CLIP_CEIL = 0;
/** Above here the signal is HOT (little headroom left). */
export const HOT_EDGE = -6;
/** Below here the signal is TOO LOW (sinking toward the noise floor). */
export const LOW_EDGE = -24;

// Noise model (teaching values): the source arrives with its own hiss, and
// every stage adds a little self-noise on top of amplifying what it is fed.
const SOURCE_NOISE = -52;
const STAGE_SELF_NOISE = -48;
/** Power-sum of two dB values. */
function addDb(a: number, b: number): number {
  return 10 * Math.log10(Math.pow(10, a / 10) + Math.pow(10, b / 10));
}

// Meter scale — a touch of room above the ceiling and well below the floor.
const METER_LO = -40;
const METER_HI = 6;

export type Region = 'low' | 'healthy' | 'hot' | 'clip';

export function regionFor(level: number): Region {
  if (level >= CLIP_CEIL) return 'clip';
  if (level >= HOT_EDGE) return 'hot';
  if (level >= LOW_EDGE) return 'healthy';
  return 'low';
}

/** 0..1 meter fill for a level (also feeds the MIDI colour, so bar height and
 *  colour agree: blue=low → green=healthy → yellow/red=hot/overload). */
export function meterFill(level: number): number {
  return Math.max(0, Math.min(1, (level - METER_LO) / (METER_HI - METER_LO)));
}

// Zone boundaries as fill fractions, for drawing the too-low / healthy / hot
// backgrounds behind the meter.
export const ZONE_LOW_FILL = meterFill(LOW_EDGE);
export const ZONE_HOT_FILL = meterFill(HOT_EDGE);
export const ZONE_CLIP_FILL = meterFill(CLIP_CEIL);

export type StageKind = 'source' | 'preamp' | 'processor' | 'comp' | 'eq' | 'fader' | 'bus' | 'output';

export type Stage = {
  key: string;
  name: string;
  kind: StageKind;
  /** Gain in dB this stage adds. */
  gain: number;
  min: number;
  max: number;
  adjustable: boolean;
};

export type ChainNode = {
  key: string;
  name: string;
  kind: StageKind;
  /** Level at this node's OUTPUT (dB), capped at the ceiling when it overloads. */
  level: number;
  region: Region;
  /** THIS stage overloaded (its raw output reached the ceiling). */
  stageClipped: boolean;
  /** Distortion introduced at or upstream of this node is baked in. */
  distorted: boolean;
  /** Cumulative noise floor at this node's output (dB rel). Every stage
   *  amplifies the noise it is handed and injects a little of its own — the
   *  reason gain EARLY beats gain LATE (learning pass 2026-08-31: the lab's
   *  too-low story had no visual referent). Teaching model, not a spec. */
  noise: number;
};

/**
 * Propagate `sourceLevel` through `stages`. Returns one node per point in the
 * chain (source first). A stage that would exceed the ceiling clips: its output
 * is capped at CLIP_CEIL and `distorted` latches true for it and everything
 * after — a later fader lowers the LEVEL but never clears the distortion.
 */
export function computeChain(sourceLevel: number, stages: Stage[]): ChainNode[] {
  const nodes: ChainNode[] = [];
  let level = Math.min(sourceLevel, CLIP_CEIL);
  let distorted = sourceLevel >= CLIP_CEIL;
  nodes.push({
    key: 'source',
    name: 'Source',
    kind: 'source',
    level,
    region: regionFor(sourceLevel),
    stageClipped: sourceLevel >= CLIP_CEIL,
    distorted,
    noise: SOURCE_NOISE,
  });
  let noise = SOURCE_NOISE;
  for (const st of stages) {
    const raw = level + st.gain;
    const stageClipped = raw >= CLIP_CEIL;
    if (stageClipped) distorted = true;
    level = Math.min(raw, CLIP_CEIL);
    noise = Math.min(addDb(noise + st.gain, STAGE_SELF_NOISE), CLIP_CEIL);
    nodes.push({
      key: st.key,
      name: st.name,
      kind: st.kind,
      level,
      region: regionFor(raw),
      stageClipped,
      distorted,
      noise,
    });
  }
  return nodes;
}

/** Plain-language verdict for a node — used by the meters and the exercises. */
export function verdictFor(node: ChainNode): string {
  if (node.stageClipped) return 'OVERLOADED — clipping here';
  if (node.distorted) return 'DISTORTED — clipped upstream, baked in';
  switch (node.region) {
    case 'low':
      return 'TOO LOW — near the noise floor';
    case 'hot':
      return 'HOT — little headroom left';
    case 'healthy':
      return 'HEALTHY — good operating level';
    default:
      return 'OVERLOADED';
  }
}

/** True when every STAGE sits in the healthy band with no distortion — the
 *  goal state for the balance exercises. The raw source is exempt: a quiet
 *  source is exactly why the chain has gain stages. */
export function chainIsHealthy(nodes: ChainNode[]): boolean {
  return nodes.every((n) => !n.distorted && (n.kind === 'source' || n.region === 'healthy'));
}

// ───────────────────────────────────────── field redesign (2026-09-20) ──────
// The lab used to show the STATE of a model; in the field you are handed
// EVIDENCE and must interpret it (design of record:
// 2026-09-20_GAIN_LAB_FIELD_REDESIGN.md). Everything below is additive —
// computeChain and verdictFor keep their signatures; the modules build on
// them. No new physics: the noise floor was already modelled, so signal-to-
// noise at any node is simply `level - noise`.

/** Signal-to-noise at a node's output (dB). */
export function snrFor(node: ChainNode): number {
  return node.level - node.noise;
}

/** How much SNR the chain has thrown away between the source and the
 *  output. A chain that takes its gain EARLY loses under a dB; one that
 *  starves the preamp and makes the level up later loses several. */
export function snrLossDb(nodes: ChainNode[]): number {
  if (nodes.length < 2) return 0;
  return snrFor(nodes[0]) - snrFor(nodes[nodes.length - 1]);
}

/** Above this much SNR thrown away, the hiss is audible between phrases. */
export const HISS_LOSS_DB = 3;

export type Symptom = {
  /** What a colleague in the room would say. Never an enum word. */
  line: string;
  /** The second line: which stage, and why. Shown after the learner has had
   *  a chance to judge the line for themselves. */
  cause: string;
};

/**
 * The chain reported the way a colleague in the room would speak — the
 * symptom first, the stage that caused it second. Priority follows what an
 * engineer hears first: overload beats hiss beats "a bit warm", and only a
 * chain with none of those gets called clean. Companion to verdictFor, which
 * stays the correct technical verdict for a meter.
 */
export function symptomFor(nodes: ChainNode[]): Symptom {
  if (nodes.length === 0) return { line: 'Nothing on the line.', cause: 'No signal path to judge.' };
  const last = nodes[nodes.length - 1];
  const firstClip = nodes.find((n) => n.stageClipped);

  if (firstClip) {
    if (firstClip.kind === 'source') {
      return {
        line: 'Crunching before it even reaches the desk — that is not you, that is the source.',
        cause: 'The source arrives already over the ceiling. No stage after it can help: pad it, or back the singer off the mic.',
      };
    }
    if (firstClip === last) {
      return {
        line: 'Fizzy on the top end — that is the converter, not warmth.',
        cause: `The ${last.name} is the stage overloading — digital clipping at the very last gain stage. Bring the output down; nothing upstream is at fault.`,
      };
    }
    const isFader = firstClip.kind === 'fader' || firstClip.kind === 'bus';
    return {
      line: 'Fine until she pushes, then it crunches.',
      cause: `The ${firstClip.name} is where it clips. Everything after inherits the damage${
        isFader ? ' — and a fader that overloads is still an overload' : ''
      }; the fix is there, not further down.`,
    };
  }

  const loss = snrLossDb(nodes);
  if (last.region === 'low') {
    return {
      line: 'Bit thin, and you can hear hiss between the phrases.',
      cause: `The ${last.name} is running too low. There is not enough level coming off the chain, and the floor is right under it.`,
    };
  }
  if (loss > HISS_LOSS_DB) {
    const starved = nodes.slice(1).find((n) => n.region === 'low');
    return {
      line: 'Bit thin, and you can hear hiss between the phrases.',
      cause: `${starved ? `The ${starved.name} is starved` : 'The gain is being made up late'} and a later stage is making up the level — every stage amplifies the hiss it was handed. Get the gain early, at the preamp.`,
    };
  }
  if (last.region === 'hot') {
    return {
      line: 'Loud, and there is nowhere left to go — one push and it goes over.',
      cause: `The ${last.name} is sitting right under the ceiling. It is not clipping tonight; the chorus will find it.`,
    };
  }
  const hotStage = nodes.slice(1).find((n) => n.region === 'hot');
  if (hotStage) {
    return {
      line: 'Sounds right for now, but it is running warmer than it looks.',
      cause: `The ${hotStage.name} is close to its ceiling even though the output reads fine. Headroom is decided at the hottest stage, not the last one.`,
    };
  }
  return {
    line: 'Clean. Sits where it should, and there is room over it.',
    cause: 'Every stage is inside its band and nothing upstream has clipped.',
  };
}

// ───────────────────────────────────────── latching (the clip LED you catch) ─
/** Per-stage memory of what the chain has DONE, not what it is doing: the
 *  highest level reached and how many separate times each stage clipped. A
 *  real clip LED blinks once and goes out — the latch is how the learner
 *  finds out it happened. Keyed by node key. */
export type LatchState = {
  peak: Record<string, number>;
  clips: Record<string, number>;
  /** Was the stage clipping on the previous step — for edge detection. */
  clipping: Record<string, boolean>;
};

export const EMPTY_LATCH: LatchState = { peak: {}, clips: {}, clipping: {} };

/** Fold one chain snapshot into the latch. A clip is COUNTED on its rising
 *  edge only: a stage that stays clipped for ten frames clipped once. */
export function latchAdvance(prev: LatchState, nodes: ChainNode[]): LatchState {
  const peak = { ...prev.peak };
  const clips = { ...prev.clips };
  const clipping = { ...prev.clipping };
  for (const n of nodes) {
    const p = peak[n.key];
    if (p == null || n.level > p) peak[n.key] = n.level;
    if (n.stageClipped && !clipping[n.key]) clips[n.key] = (clips[n.key] ?? 0) + 1;
    clipping[n.key] = n.stageClipped;
  }
  return { peak, clips, clipping };
}

/** How many times the chain clipped — what the bezel shows. A clip cascades,
 *  so every stage after the culprit latches too (the same cascade the
 *  Troubleshoot module teaches); summing them would report six events for
 *  one, so this is the count at the worst single stage. It is a NUMBER, not
 *  a stage name: the learner scans the rack to find which. */
export function latchClipEvents(latch: LatchState): number {
  return Object.values(latch.clips).reduce((a, b) => Math.max(a, b), 0);
}

// ───────────────────────────────────────── SOUNDCHECK — the take ────────────
/**
 * A performance, not a level: source offsets in dB relative to the VERSE
 * nominal. Quiet verse with a little movement, one unscripted laugh ~40% of
 * the way through that peaks ~6 dB above everything else, then the chorus
 * about 8–10 dB over the verse. You set the preamp during the verse — as you
 * always do — and the chorus finds out whether you left headroom.
 */
export const SOUNDCHECK_TAKE: readonly number[] = [
  // verse — 19 frames, quiet, moving a couple of dB
  0, -1, 1, 0, -2, 0, 2, 1, -1, 0, 1, -1, 0, 2, 0, -1, 1, 0, -2,
  // the laugh — a single peak
  9, 16, 11,
  // verse tail
  0, -1, 1, 0, -1,
  // chorus — 21 frames, +7…+10, with breaths between lines
  7, 9, 10, 8, 9, 6, 8, 10, 9, 7, 9, 10, 8, 5, 8, 9, 10, 9, 8, 10, 7,
];

/** Index of the take's loudest frame (the laugh). */
export const TAKE_LAUGH_INDEX = SOUNDCHECK_TAKE.indexOf(Math.max(...SOUNDCHECK_TAKE));

export type TakeResult = {
  /** One chain snapshot per frame of the take. */
  frames: ChainNode[][];
  /** The latch after the whole take: peak-hold and clip counts per stage. */
  latch: LatchState;
  /** Per-node worst case: peak level, clipped/distorted if EVER, noise as run. */
  worst: ChainNode[];
  /** Per-node quietest case — the verse, where hiss is judged. */
  quiet: ChainNode[];
  /** True if any frame reached the output distorted. */
  distorted: boolean;
};

/**
 * Run a take — a list of source levels — through the chain. ADDITIVE: it
 * calls computeChain per frame and folds the results; computeChain's
 * signature is untouched. The clip counts follow the latch rule (rising
 * edges), so a chorus that clips on every loud line counts every line.
 */
export function computeTake(levels: readonly number[], stages: Stage[]): TakeResult {
  const frames = levels.map((lv) => computeChain(lv, stages));
  let latch = EMPTY_LATCH;
  for (const f of frames) latch = latchAdvance(latch, f);
  const n = frames[0]?.length ?? 0;
  const worst: ChainNode[] = [];
  const quiet: ChainNode[] = [];
  for (let i = 0; i < n; i++) {
    let w = frames[0][i];
    let q = frames[0][i];
    let clipped = false;
    let distorted = false;
    for (const f of frames) {
      const node = f[i];
      if (node.level > w.level) w = node;
      if (node.level < q.level) q = node;
      clipped = clipped || node.stageClipped;
      distorted = distorted || node.distorted;
    }
    worst.push({ ...w, stageClipped: clipped, distorted, region: clipped ? 'clip' : w.region });
    quiet.push({ ...q, stageClipped: false, distorted, region: q.region });
  }
  const distorted = frames.some((f) => f[f.length - 1]?.distorted);
  return { frames, latch, worst, quiet, distorted };
}

/** The symptom for a whole take: overload is judged on the loudest moment,
 *  hiss on the quietest — that is how you hear it in the room. */
export function takeSymptom(take: TakeResult): Symptom {
  if (take.worst.length === 0) return symptomFor([]);
  if (take.worst.some((n) => n.stageClipped)) return symptomFor(take.worst);
  const quiet = symptomFor(take.quiet);
  if (quiet.line.startsWith('Bit thin')) return quiet;
  const peak = symptomFor(take.worst);
  // A steady signal parked in the hot band has no headroom left. A TAKE whose
  // loudest moment lands there is the opposite: the headroom did its job.
  const last = take.worst[take.worst.length - 1];
  if (last.region === 'hot') {
    return {
      line: 'Clean — she pushed and it held. The laugh got close, and that is what the headroom was for.',
      cause: `The ${last.name} peaked just under the ceiling on the loudest moment and never touched it. The verse sat where you set it; the chorus had room.`,
    };
  }
  return peak;
}
