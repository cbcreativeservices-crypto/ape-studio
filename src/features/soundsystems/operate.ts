/**
 * Sound Systems Lab — OPERATE mode models (chapters 9 and 10).
 *
 * The professional setup sequence, the power-up and power-down orders, and a
 * gain-structure chain from source to loudspeaker. The chain is a TEACHING
 * MODEL (illustrative numbers, stated as such on the page): it shows why a
 * quiet preamp with a loud fader is hiss, why a hot preamp with a quiet fader
 * is distortion, and why unity through the middle with headroom at every
 * stage is the professional target. It is not a meter.
 */

/* ── chapter 9: the setup sequence ───────────────────────────────────────── */

export type SetupStep = { n: number; title: string; why: string };

export const SETUP_SEQUENCE: readonly SetupStep[] = [
  { n: 1, title: 'Assess the venue and production requirements', why: 'Who performs, who listens, where, how loud, and what the room does to sound — every later decision is a consequence of this one.' },
  { n: 2, title: 'Determine audience coverage and required SPL', why: 'Which seats must be covered, and how loud at the furthest of them. This sets the loudspeaker count before any brand is named.' },
  { n: 3, title: 'Select appropriate loudspeakers and subwoofers', why: 'Coverage angle, output and low-frequency extension to match step 2 — and the amplification they need.' },
  { n: 4, title: 'Determine loudspeaker placement and aiming', why: 'Height, position and angle decide coverage, feedback and alignment before a cable is pulled.' },
  { n: 5, title: 'Establish electrical power distribution', why: 'Adequate, properly grounded circuits for audio, separate from lighting where possible — designed and approved by licensed people.' },
  { n: 6, title: 'Position front-of-house and stage equipment', why: 'The console where the engineer can hear the room; the racks where the cable runs are shortest and safe.' },
  { n: 7, title: 'Run and secure cables', why: 'Signal away from power, strain relief at every connector, nothing where feet or doors can reach it.' },
  { n: 8, title: 'Patch inputs and outputs', why: 'Every source to its channel, every output to its destination — documented as it is done.' },
  { n: 9, title: 'Verify routing before powering loudspeakers', why: 'A wrong output at full level destroys drivers. Check on meters and headphones first, with the amplifiers off.' },
  { n: 10, title: 'Power the system in the correct sequence', why: 'Sources and console first, amplifiers last — so no turn-on transient reaches a loudspeaker at full gain.' },
  // One common show-day order: the PA is checked and tuned on playback and
  // measurement BEFORE the band's line check — you need a verified PA to
  // line-check into. Festival stages tune the day before; small gigs fold
  // 11–13 into one pass.
  { n: 11, title: 'PA check and system tune', why: 'Every output plays its loudspeaker on pink noise or playback; crossovers, EQ, delay and polarity measured and listened to, for consistency across the seats.' },
  { n: 12, title: 'Line check every input', why: 'Each source lands on the RIGHT channel — scratch the mic, tap the head, play the keyboard — and each wedge plays its own mix. Nothing is assumed.' },
  { n: 13, title: 'Establish gain structure', why: 'Preamps set at soundcheck level, faders near unity, headroom at every stage, the amplifiers the last thing to clip — the quietest, cleanest path.' },
  { n: 14, title: 'Conduct soundcheck', why: 'The performers, at show level, with monitors — the first time the system meets its real signal.' },
  { n: 15, title: 'Document the final configuration', why: 'Patch lists, scenes, processor presets — so the next person can rebuild it and the show can be recalled.' },
  { n: 16, title: 'Shut down in the correct sequence', why: 'Amplifiers first, then processing, console and sources — the mirror of power-up, for the same reason.' },
];

/* ── power sequence ──────────────────────────────────────────────────────── */

/** `short` is the button label — the full title lands in the ordered list. */
export type PowerStep = { id: string; short: string; title: string; why: string };

export const POWER_UP: readonly PowerStep[] = [
  { id: 'verify', short: 'Verify routing — amps OFF', title: 'Loudspeakers and amplifiers OFF — verify routing and mutes', why: 'Nothing can be damaged while nothing can play.' },
  { id: 'sources', short: 'Stage devices', title: 'Stage devices: wireless, DIs, playback', why: 'Their turn-on noise happens into a console that is not yet passing anything.' },
  { id: 'console', short: 'Console', title: 'Console', why: 'It boots and settles with every output still dark downstream.' },
  { id: 'processor', short: 'Processor', title: 'Loudspeaker processor', why: 'Its outputs come up muted or at their last state — with the amplifiers still off, either is safe.' },
  { id: 'amps', short: 'Amps and powered boxes — LAST', title: 'Amplifiers and powered loudspeakers — LAST', why: 'Every upstream transient has already happened. The amplifiers wake into silence.' },
  { id: 'raise', short: 'Un-mute and bring up', title: 'Un-mute the processor outputs and bring the system up', why: 'Only now is there gain from source to cone — and the console mains stay down until the line check. Touring amplifiers are set once and protected by the processor limiters; they are not ridden per show.' },
];

export const POWER_DOWN: readonly PowerStep[] = [
  { id: 'lower', short: 'Mute the outputs', title: 'Mute the processor outputs (or pull the system master)', why: 'Take the gain out of the loudspeakers before anything upstream changes.' },
  { id: 'amps', short: 'Amps and powered boxes — FIRST', title: 'Amplifiers and powered loudspeakers — FIRST', why: 'Nothing that is switched off later can send a thump through an amplifier that is already off.' },
  { id: 'processor', short: 'Processor', title: 'Loudspeaker processor', why: 'Its power-down transient meets a dead amplifier.' },
  { id: 'console', short: 'Console — save first', title: 'Console', why: 'Save the show first; then it goes dark into a silent system.' },
  { id: 'sources', short: 'Stage devices — last', title: 'Stage devices last', why: 'Wireless, DIs and playback are switched off when nothing can hear them.' },
];

/** Is `order` a correct ordering of the given sequence? */
export function isSequenceCorrect(order: readonly string[], sequence: readonly { id: string }[]): boolean {
  return order.length === sequence.length && order.every((id, i) => id === sequence[i].id);
}

/** First step out of place, paired with the step it must follow. */
export function firstSequenceError(order: readonly string[], sequence: readonly { id: string }[]): { id: string; mustFollow: string } | null {
  const want = (id: string) => sequence.findIndex((s) => s.id === id);
  for (let i = 0; i < order.length; i++) {
    let best: string | null = null;
    let bestWant = Infinity;
    for (let j = i + 1; j < order.length; j++) {
      const w = want(order[j]);
      if (w < want(order[i]) && w < bestWant) {
        best = order[j];
        bestWant = w;
      }
    }
    if (best) return { id: order[i], mustFollow: best };
  }
  return null;
}

/* ── chapter 10: the gain-structure chain ────────────────────────────────── */

export type GainStageId = 'source' | 'preamp' | 'fader' | 'main' | 'procIn' | 'procOut' | 'amp' | 'speaker';

export type GainStageSpec = {
  id: GainStageId;
  label: string;
  /** Control range in dB (null = no control at this stage). */
  min: number | null;
  max: number | null;
  /** The level, in dBu, at which this stage clips. */
  clipDbu: number;
  /** The stage's own noise floor, dBu (illustrative model values). */
  noiseDbu: number;
  /** The control's nominal / unity position. */
  unity: number;
};

export const GAIN_STAGES: readonly GainStageSpec[] = [
  { id: 'source', label: 'Source (vocal mic)', min: null, max: null, clipDbu: 10, noiseDbu: -110, unity: 0 },
  // The preamp's own noise is its EIN (≈ −128 dBu) lifted by its gain — see
  // computeGainChain — so a starved preamp sits close to its floor.
  { id: 'preamp', label: 'Preamp gain', min: 0, max: 60, clipDbu: 20, noiseDbu: -95, unity: 40 },
  // Later stages have fixed floors around −90…−95 dBu (console buses, DSP,
  // an amplifier's input). Gain placed AFTER them lifts those floors along
  // with the signal — that is the lesson, not that they are worse.
  { id: 'fader', label: 'Channel fader', min: -60, max: 10, clipDbu: 22, noiseDbu: -90, unity: 0 },
  { id: 'main', label: 'Main fader', min: -60, max: 10, clipDbu: 22, noiseDbu: -90, unity: 0 },
  { id: 'procIn', label: 'Processor input', min: -20, max: 20, clipDbu: 20, noiseDbu: -95, unity: 0 },
  { id: 'procOut', label: 'Processor output', min: -20, max: 20, clipDbu: 20, noiseDbu: -95, unity: 0 },
  // A pro amplifier reaches full output at about +4 dBu in with its attenuator
  // wide open; the console and processor peak at +20. So the attenuator sits
  // around −12 at "unity" — the amplifier must be the LAST stage to clip.
  { id: 'amp', label: 'Amplifier input attenuator', min: -40, max: 0, clipDbu: 4, noiseDbu: -95, unity: -12 },
  { id: 'speaker', label: 'Loudspeaker', min: null, max: null, clipDbu: 4, noiseDbu: -95, unity: 0 },
];

export type GainNode = {
  id: GainStageId;
  label: string;
  /** Peak level after this stage, dBu. */
  levelDbu: number;
  /** Headroom to this stage's clip point. Negative = clipping. */
  headroomDb: number;
  clipped: boolean;
  /** Distortion has already happened upstream and cannot be undone here. */
  inheritedClip: boolean;
  /** Signal above the accumulated noise, dB. */
  snrDb: number;
};

export type GainSettings = Partial<Record<GainStageId, number>>;

/** A loud close vocal on a dynamic microphone peaks around −20…−30 dBu;
 *  this illustrative model uses −30. */
export const SOURCE_PEAK_DBU = -30;

/** A good preamp’s equivalent input noise, dBu. */
export const PREAMP_EIN_DBU = -128;

/** Propagate a peak through the chain. Noise accumulates: a stage that adds
 *  gain raises everything before it — the hiss from a starved preamp cannot
 *  be removed by a fader later. */
export function computeGainChain(settings: GainSettings, sourcePeakDbu = SOURCE_PEAK_DBU): GainNode[] {
  const out: GainNode[] = [];
  let level = sourcePeakDbu;
  let noise = GAIN_STAGES[0].noiseDbu;
  let clipped = false;
  for (const st of GAIN_STAGES) {
    const g = st.min == null ? 0 : Math.max(st.min, Math.min(st.max ?? 0, settings[st.id] ?? st.unity));
    if (st.id !== 'source') {
      level += g;
      // Noise: the earlier noise is amplified by this stage; the stage adds
      // its own. A preamp's own floor is its EIN lifted by its gain (never
      // better than the stage's fixed floor).
      const own = st.id === 'preamp' ? Math.max(PREAMP_EIN_DBU + g, st.noiseDbu) : st.noiseDbu;
      noise = 10 * Math.log10(Math.pow(10, (noise + g) / 10) + Math.pow(10, own / 10));
    }
    const here = level > st.clipDbu;
    const inherited = clipped;
    if (here) {
      clipped = true;
      level = st.clipDbu; // the peak is flattened at the rail
    }
    out.push({
      id: st.id,
      label: st.label,
      levelDbu: level,
      headroomDb: st.clipDbu - level,
      clipped: here || inherited,
      inheritedClip: inherited && !here,
      snrDb: level - noise,
    });
  }
  return out;
}

export type GainVerdict = 'clipping' | 'noisy' | 'quiet' | 'ok';

/** Signal-to-noise at the loudspeaker below which the chain reads NOISY. */
export const SNR_TARGET_DB = 70;

/** The professional target: no stage clipped, enough level at the
 *  loudspeaker, and the signal at least SNR_TARGET_DB above the noise there.
 *  Order matters: a chain that throws its level away after the preamp is
 *  QUIET first — its poor signal-to-noise is a consequence, and the fix is
 *  the opposite of the one the NOISY verdict recommends. */
export function gainVerdict(chain: GainNode[]): GainVerdict {
  if (chain.some((n) => n.clipped)) return 'clipping';
  const last = chain[chain.length - 1];
  if (last.levelDbu < -24) return 'quiet';
  if (last.snrDb < SNR_TARGET_DB) return 'noisy';
  return 'ok';
}

export function gainVerdictCopy(v: GainVerdict, chain: GainNode[]): string {
  const first = chain.find((n) => n.clipped && !n.inheritedClip);
  switch (v) {
    case 'clipping':
      return `Clipping at the ${first?.label.toLowerCase() ?? 'chain'}. Every stage after it inherits the distortion — turning a later control down makes it quieter, not cleaner.`;
    case 'noisy':
      return 'Too much of the gain is late in the chain. A starved preamp sits close to its noise floor, and every later stage amplifies that hiss along with the signal. Raise the preamp, lower what follows.';
    case 'quiet':
      return 'Not enough level reaches the amplifier — a stage after the preamp is throwing signal away, and the stages after THAT add their own noise to what is left. Bring the faders and trims back toward unity before you touch the amplifier attenuator.';
    default:
      return 'Unity through the middle, headroom at every stage, the preamp doing the work, the amplifier attenuated so it is the last thing to clip: this is the structure a professional system is set to.';
  }
}
