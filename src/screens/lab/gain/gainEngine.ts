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
