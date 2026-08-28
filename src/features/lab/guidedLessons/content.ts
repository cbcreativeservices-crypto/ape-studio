/**
 * Guided-Lesson content — all 16 audio labs (v4 MASTER §7).
 *
 * Authored verbatim-in-spirit from the two Booth-approved companion specs:
 *   • docs/APE_LAB_CONTROLS_AND_COMMON_MISTAKES_5LABS_2026_07_26_v1_DRAFT.md
 *     (Flanger·Phaser·Gate·Limiter·Stereo — full per-control ranges/defaults)
 *   • docs/APE_LAB_COMMON_MISTAKES_11LABS_2026_07_26_v1_DRAFT.md
 *     (the other 11 labs — per-lab mistakes/tips/formula + control lists)
 *
 * Standard signal-processing fundamentals (high confidence). Ranges/defaults are
 * the companions' industry-conventional proposals — confirm/override per house
 * style; they are not locked engine values. NOTHING here is invented requirement.
 */
import type { LabId, LabLesson } from './types';

/** Convenience: name-only controls (labs whose per-control prose isn't authored
 *  yet — they inherit the lab-level lesson). */
const names = (list: string[]) => list.map((name) => ({ key: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name }));

export const LAB_LESSONS: Record<LabId, LabLesson> = {
  // ─────────────────────────────────────────────────────────── LAB 1 · EQ ──
  eq: {
    id: 'eq',
    num: 1,
    name: 'Equalizer',
    tier: 'T1',
    tagline: 'Shape the balance of frequencies.',
    whatItIs:
      'An equalizer boosts or cuts chosen frequency bands to shape tone — from broad ' +
      'musical moves to surgical notches. Filter type (shelf / bell / pass) decides which ' +
      'part of the band is affected; Q sets how wide.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The response curve is the exact filter you built — boost/cut (dB) versus frequency, left→right = low→high. The flat line is the reference (no EQ); the amber curve is what your audio actually passes through." },
      { key: 'filter_type', name: 'Filter type', definition: 'Chooses the SHAPE of the move: a bell boosts/cuts around a center; shelves lift or lower everything past a corner; high-pass/low-pass remove one whole end.' },
      { key: 'frequency', name: 'Frequency', definition: 'WHERE on the spectrum the band sits — the center of a bell, or the corner of a shelf/pass filter. This is the part of the sound you’re affecting.', range: '~20 Hz – 20 kHz' },
      { key: 'gain', name: 'Gain', definition: 'How much you boost (+) or cut (−) the band, in dB. Cutting is usually cleaner than boosting — it preserves headroom.', range: '−12 … +12 dB' },
      { key: 'q', name: 'Q (bandwidth)', definition: 'How WIDE the band is. Low Q = a broad, musical move; high Q = a narrow, surgical notch. Q = center frequency ÷ bandwidth.', range: '0.7 wide … 8 narrow' },
    ],
    commonMistakes: [
      'Boost-sweep to FIND, then forgetting to CUT — the narrow-boost sweep is diagnostic only; the fix is usually a cut.',
      'Boosting when you should cut — subtractive EQ preserves headroom and avoids piling up phase problems.',
      'Narrow Q for tonal shaping — surgical Q is for notches/hum; musical moves need wide Q, or they ring.',
      'Forgetting minimum-phase EQ shifts phase — heavy EQ on multi-mic sources combs.',
      'Not high-passing non-bass sources — subsonic rumble eats headroom and muddies the mix.',
      'EQ’ing in solo — a track shaped alone often clashes or vanishes in the mix; judge in context.',
      'Chasing a flat analyzer — "flat" is not the goal; the meter informs, ears decide.',
      'Static cut for sibilance — a fixed high cut dulls everything; sibilance is dynamic → use a de-esser.',
      'One wide cut for hum — hum is 50/60 Hz PLUS harmonics; notch the harmonic series, not one band.',
      'Recipe EQ — "3 kHz presence / 250 Hz mud" by rote without listening; every source differs.',
    ],
    proTips: [
      'Cut first to clean up, then boost sparingly to flatter — level-match before/after, since boosts trick the ear into "better".',
      'Teach Q with pink noise: the same +6 dB boost at Q=0.7 vs Q=8 — hear "tone" vs "ring".',
    ],
    formula: 'Q ≈ Fc / bandwidth. Filter slope = 6/12/18/24 dB per octave (1/2/3/4-pole). Shelf vs bell vs pass = which part of the band is affected.',
  },

  // ──────────────────────────────────────────────────────── LAB 2 · Delay ──
  delay: {
    id: 'delay',
    num: 2,
    name: 'Delay',
    tier: 'T2',
    tagline: 'Discrete repeats in time.',
    whatItIs:
      'A delay records the signal and plays it back one or more times after a set interval. ' +
      'Feedback sets how many repeats; filtering makes them recede. Distinct from reverb — ' +
      'delay makes separable echoes, not a diffuse wash.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The timeline shows the echo pattern: horizontal spacing = delay time, each repeat’s shrinking height = feedback, left/right offset = ping-pong. Every mark is one repeat placed in time." },
      { key: 'delay_time', name: 'Delay time', definition: 'The gap between repeats. Short (≈60–150 ms) = slapback; longer, tempo-matched values (a quarter-note) lock the echoes to the groove.', range: '~1 ms – 2 s' },
      { key: 'feedback', name: 'Feedback', definition: 'How much of each echo is fed back to make the NEXT one — sets how many repeats you get. Near 100% runs away into self-oscillation.', range: '0 – ~100%' },
      { key: 'wet_dry', name: 'Wet / Dry', definition: 'The balance of dry signal vs echoes. Low keeps the delay behind the source; 100% wet is echoes only.' },
      { key: 'ping_pong', name: 'Ping-pong', definition: 'Bounces the repeats left↔︎right across the stereo image. Always mono-check — hard-panned repeats can thin out in mono.' },
      { key: 'filtering', name: 'Repeat damping', definition: 'Rolls the highs (and often lows) off each repeat, so echoes recede into the background instead of stacking into harsh clutter.' },
    ],
    commonMistakes: [
      'Feedback too high → runaway/self-oscillation — finding that threshold is the lesson; don’t trip it by accident.',
      'Delay time fighting the tempo — un-synced repeats smear the groove; sync to note values or tap tempo.',
      '"Slapback" set too long — true slapback ≈ 60–150 ms, single repeat, low feedback; longer becomes a distinct echo.',
      'Wet too loud on a lead vocal — buries intelligibility; delays usually sit behind the dry.',
      'Unfiltered repeats — full-range feedback stacks harsh clutter; roll off highs (often lows) so repeats recede.',
      'Wide/ping-pong delay that cancels in mono — always mono-check.',
      'Confusing delay with reverb — discrete repeats vs a diffuse wash; different tools, different purpose.',
    ],
    proTips: [
      'Start 1/8-dotted synced, feedback ~25%, wet low, highs rolled off — instantly musical.',
      'Use Freeze / Peak-Hold to let students predict the next echo before it lands.',
    ],
    formula: 'Delay for a note (ms) = (60000 / BPM) × note-fraction. Quarter-note ms = 60000 / BPM.',
  },

  // ─────────────────────────────────────────────────────── LAB 3 · Reverb ──
  reverb: {
    id: 'reverb',
    num: 3,
    name: 'Reverb',
    tier: 'T3',
    tagline: 'The sound of a space.',
    whatItIs:
      'Reverb simulates the dense field of reflections in a room — early reflections give ' +
      'spatial cues, the late tail gives size and decay. Pre-delay separates the dry source ' +
      'from the wash; damping shapes the tail’s tone.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The curve is the decay — level falling over time after the sound stops. RT60 is WHERE it crosses −60 dB (a time, not an amount). The flat gap before it starts is pre-delay." },
      { key: 'decay', name: 'RT60 (decay time)', definition: 'How long the tail takes to fade 60 dB — short = a small room, long = a hall or cavern. It’s a TIME, not an amount of reverb.', range: '0.4 s booth … 6 s cavern' },
      { key: 'pre_delay', name: 'Pre-delay', definition: 'The short pause before the wash arrives after the dry sound — it keeps the source clear and hints at room size. 0 glues the tail to the source.', range: '0 – 60 ms' },
      { key: 'hf_damping', name: 'HF damping', definition: 'How fast the highs fade within the tail. More damping = a darker, softer room (soft surfaces); less = a bright, live space.' },
      { key: 'mix', name: 'Mix', definition: 'Dry vs reverb balance. A little sits the source in a space; too much pushes it far away and washes out clarity.' },
    ],
    commonMistakes: [
      'Too much reverb — washes the mix, pushes sources back, kills clarity; less is usually more.',
      'No pre-delay → source glued to the tail — a little pre-delay (~10–40 ms) keeps vocals upfront.',
      'Muddy tail (no HPF / LF damping) — high-pass the reverb return and add LF damping.',
      'Confusing room size with decay time — a large room can decay quickly and a small room slowly; separate controls.',
      'Decay fighting the tempo/space — long tails on fast, busy material turn to mush.',
      'One reverb on everything — kills depth; varied pre-delay/decay build front-to-back layering.',
      'Reverb before fixing source problems — it amplifies sibilance/boxiness already present.',
      'Sending sub/bass to reverb — rumbly, unstable tail; high-pass the send.',
    ],
    proTips: [
      'Compare hall vs plate on the same vocal to hear diffusion/density differences.',
      'Duck the reverb under the dry vocal phrase, let it bloom in the gaps.',
    ],
    formula: 'RT60 = time to decay 60 dB. Sabine: RT60 = 0.161·V / A (V = volume m³, A = total absorption in sabins) — links to the Wave-Physics Absorption module.',
  },

  // ─────────────────────────────────────────────────────── LAB 4 · Chorus ──
  chorus: {
    id: 'chorus',
    num: 4,
    name: 'Chorus',
    tier: 'T2',
    tagline: 'Why "wide" sounds wide.',
    whatItIs:
      'Chorus mixes the dry signal with detuned, LFO-modulated delayed copies (~15–35 ms), ' +
      'so multiple slightly out-of-tune "voices" beat against each other for a thick, wide tone.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The comb curve shows the notches the delayed voice carves into the spectrum; the faint ghost curves show where the LFO sweeps them. Chorus uses a longer delay, so you hear movement rather than a hard comb." },
      { key: 'rate', name: 'Rate', definition: 'How fast the pitch/delay wobbles — the LFO speed. Slow = a gentle shimmer; fast = a seasick warble.', range: '~0.1 – 3 Hz' },
      { key: 'depth', name: 'Depth', definition: 'How far the wobble swings — the amount of detune/movement. More depth = a thicker, more obvious effect.' },
      { key: 'delay', name: 'Voice delay', definition: 'The base delay of the doubled voice (≈15–35 ms) — long enough to sound like a second player, not the tight comb of a flanger.', range: '15 – 35 ms' },
      { key: 'mix', name: 'Mix', definition: 'Dry vs the wobbling copy. Around 50% is classic chorus; 100% wet removes the dry voice entirely and becomes vibrato.' },
    ],
    commonMistakes: [
      'Rate/Depth too high → seasick, out-of-tune warble; excess modulation reads as detuning, not lushness.',
      'Confusing chorus with flanger/vibrato — chorus = longer delay + detuned voices; short delay + feedback = flanger; 100% wet = vibrato.',
      '100% wet kills the effect — chorus needs the dry voice to beat against the detuned copies.',
      'Wide stereo chorus that thins/cancels in mono — mono-check.',
      'Using it purely as a width tool — it widens but adds phasey comb filtering; verify mono.',
      'Chorusing the bass — modulated pitch/comb on lows is unstable and muddy; keep bass dry/mono.',
    ],
    proTips: [
      '2–3 voices, gentle depth, delay ~20 ms, mix ~30–40% = classic lush without detune artifacts.',
      'Show the Lissajous while widening so students see the stereo decorrelation.',
    ],
    formula: 'Chorus = dry + LFO-modulated, slightly pitch-shifted delayed copies (~15–35 ms). Beating between detuned voices = the "wide/thick" perception; summing exposes comb filtering (worst in mono).',
  },

  // ────────────────────────────────────────────────────── LAB 5 · Flanger ──
  flanger: {
    id: 'flanger',
    num: 5,
    name: 'Flanger',
    tier: 'T2',
    tagline: 'Sweeping comb-filter notches.',
    whatItIs:
      'A flanger sums a short, LFO-modulated delay (~0.1–10 ms) with the dry signal, producing ' +
      'evenly-spaced (harmonic) comb notches that sweep as the delay time modulates. Feedback ' +
      'deepens the notches. Evenly-spaced sweeping notches are its signature vs the phaser.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "Evenly spaced comb notches whose spacing = 1 ÷ delay-time; the ghost curves show the LFO’s sweep range. Even spacing is the flanger fingerprint — compare the phaser’s uneven notches." },
      { key: 'rate', name: 'Rate (LFO speed)', range: '0.05–10 Hz · default ~0.2 Hz', definition: 'How fast the notches sweep up/down the spectrum. Slow = classic jet sweep.' },
      { key: 'depth', name: 'Depth (sweep range)', range: '0–100% · default ~50%', definition: 'How far the delay time is modulated → how far the notches travel.' },
      { key: 'manual', name: 'Manual / Delay time (center)', range: '0.1–10 ms · default ~2 ms', definition: 'The base delay the LFO modulates around; sets notch spacing (spacing = 1/delay).' },
      { key: 'feedback', name: 'Feedback / Regeneration', range: '−95…+95% · default ~40%', definition: 'Feeds output back to input; deepens notches. Negative feedback shifts the notch pattern and gives the hollow "through-a-tube" tone.' },
      { key: 'mix', name: 'Mix (Wet/Dry)', range: '0–100% · default 50%', definition: 'Comb notches are deepest at 50% (equal dry+wet).' },
      { key: 'lfo_wave', name: 'LFO Waveform', range: 'Triangle (default) / Sine / Log', definition: 'Shape of the sweep motion.' },
      { key: 'stereo_offset', name: 'Stereo width / LFO phase offset', range: '0–180° · default 90°', definition: 'Offsets the L vs R LFO for a stereo sweep.' },
      { key: 'tzf', name: 'Through-Zero (TZF)', range: 'on/off · default off', definition: 'A second delay line lets the notch pass through 0 ms for the dramatic "reverse jet" flange.', advanced: true },
    ],
    commonMistakes: [
      'Calling it a flanger when it’s really a chorus — delay too long (>~10–15 ms) with little feedback stops the sweeping comb; keep the delay short and add feedback.',
      'Running 100% wet — with a single delay line, full-wet removes the dry reference the comb needs; classic flange lives near 50%.',
      'Too much feedback — high regeneration rings metallically and fatigues fast.',
      'Rate too fast — a fast LFO turns the sweep into a warble; the educational "moving notches" are clearest slow.',
      'Testing on a pure sine — a sine has energy at one frequency, so the comb reveals nothing; use pink noise or a rich source.',
      'Ignoring mono — heavy stereo flanging can partially cancel when summed to mono; mono-check.',
    ],
    proTips: [
      'Start dry=wet, feedback ~40%, rate slow, then sweep Manual to hear notch spacing change.',
      'Negative feedback + short delay = the hollow, resonant "jet"; positive feedback = brighter, more present comb.',
    ],
    formula: 'Comb notches at f = (2k−1) / (2·τ), k = 1,2,3…, where τ = delay time. Notch spacing = 1/τ; as τ modulates, every notch sweeps together (evenly-spaced, harmonic).',
  },

  // ─────────────────────────────────────────────────────── LAB 6 · Phaser ──
  phaser: {
    id: 'phaser',
    num: 6,
    name: 'Phaser',
    tier: 'T2',
    tagline: 'Uneven notches from all-pass phase.',
    whatItIs:
      'A phaser cascades all-pass filter stages (each shifts phase without changing magnitude) ' +
      'and sums with the dry signal. Cancellation notches appear where the phase hits 180°, ' +
      'unevenly spaced and fewer (≈ one per two stages) — the defining contrast with the flanger.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "A few UNEVEN notches placed by all-pass phase shift (not a delay). Their count ≈ stages ÷ 2. That uneven spacing is exactly what separates a phaser from a flanger." },
      { key: 'rate', name: 'Rate (LFO speed)', range: '0.05–10 Hz · default ~0.3 Hz', definition: 'Sweeps the all-pass corner frequencies (moves the notches).' },
      { key: 'depth', name: 'Depth', range: '0–100% · default ~60%', definition: 'Modulation range of the sweep.' },
      { key: 'stages', name: 'Stages / Poles', range: '2 / 4 / 6 / 8 / 12 · default 4', definition: 'More stages = more notches = thicker. Notch count ≈ stages ÷ 2.' },
      { key: 'feedback', name: 'Feedback / Resonance', range: '0–95% · default ~30%', definition: 'Sharpens and deepens the notches.' },
      { key: 'center', name: 'Center Frequency / Manual', range: '~100 Hz–8 kHz · default ~1 kHz', definition: 'Base frequency the sweep centers on.' },
      { key: 'mix', name: 'Mix (Wet/Dry)', range: '0–100% · default 50%', definition: 'Notches deepest near 50%.' },
      { key: 'lfo_wave', name: 'LFO Waveform', range: 'Sine (default) / Triangle', definition: 'Shape of the sweep motion.' },
      { key: 'stereo_offset', name: 'Stereo spread / LFO phase offset', range: '0–180° · default 90°', definition: 'L/R offset for stereo motion.' },
    ],
    commonMistakes: [
      'Expecting flanger-style even notches — phaser notches are unevenly spaced and fewer; that is the defining difference.',
      'Too many stages on a busy source — 8–12 stages on a full mix smears into mud; fewer reads as more musical.',
      '100% wet — kills the dry reference the notches depend on.',
      'Cranking resonance — excess feedback whistles/rings and fatigues.',
      'Thinking a phaser is a delay — all-pass stages change phase, not time; there is no echo.',
      'Testing on a sine — needs broadband material to reveal the notches.',
    ],
    proTips: [
      '4 stages = subtle vintage vibe; 8+ = lush, obvious sweep.',
      'Sweep Manual with the LFO OFF first, so students see notches as a position before adding motion.',
    ],
    formula: 'A first-order all-pass has |H(f)| = 1 at every frequency but phase from 0° to −180°. Two cascaded stages create one 180° cancellation notch on sum; notch count ≈ stages ÷ 2 (uneven spacing).',
  },

  // ────────────────────────────────────────────────── LAB 7 · Compression ──
  compression: {
    id: 'compression',
    num: 7,
    name: 'Compression',
    tier: 'T3',
    tagline: 'Control and glue dynamics.',
    whatItIs:
      'A compressor reduces gain above a threshold by a set ratio, shrinking dynamic range. ' +
      'Attack/Release set how fast it reacts and recovers; makeup gain restores level. Used ' +
      'for control, punch, and glue.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The transfer curve maps input (x) to output (y): below the threshold it stays 1:1; above it, the line bends by the ratio. The GR meter below is the LIVE, measured gain reduction." },
      { key: 'threshold', name: 'Threshold', definition: 'The level above which the compressor works. Only signal louder than this gets turned down — lower it to compress more of the signal.', range: '−40 … −10 dBFS' },
      { key: 'ratio', name: 'Ratio', definition: 'How hard it squeezes above the threshold: 2:1 is gentle glue, 8:1+ acts like a limiter. For every N dB in, 1 dB comes out.', range: '2:1 … 20:1' },
      { key: 'attack', name: 'Attack', definition: 'How fast it clamps down once the sound crosses the threshold. Fast tames transients; slow lets the initial punch through first.', range: '0.5 – 100 ms' },
      { key: 'release', name: 'Release', definition: 'How fast the gain returns after the level drops back. Too fast pumps; too slow keeps the level held down too long.', range: '30 – 500 ms' },
      { key: 'makeup_gain', name: 'Makeup gain', definition: 'Turns the whole signal back up after compression lowered it — so the compressed track sits as loud (or louder) than before.' },
      { key: 'gain_reduction', name: 'Gain reduction (meter)', definition: 'The LIVE, measured amount the compressor is turning the signal down RIGHT NOW, in dB — this is a real reading from the engine, not a drawing. It moves only while the signal is over the threshold; more reduction = harder compression.' },
    ],
    commonMistakes: [
      'Attack too fast → transients killed — clamps the initial hit; to preserve transients, slow the attack so the transient passes first.',
      'Release too fast → distortion/pumping (worst on bass); too slow → never recovers, over-compresses.',
      'Ratio / GR too high — squashes the life out; 2–4:1 for glue, higher only for control.',
      'Makeup-gain "louder = better" bias — level-match bypass vs active to judge honestly.',
      'Watching the GR meter instead of listening — a big number isn’t the goal.',
      'Ignoring the knee — hard knee = obvious/controlling, soft knee = transparent.',
      'No sidechain HPF on the bus → bass pumps the whole mix; filter the detector.',
      'Stacking compressor → limiter to death — multiple squashers destroy dynamics.',
    ],
    proTips: [
      'Dial threshold for ~3–6 dB GR on peaks, then attack for punch and release for the groove; makeup last, then A/B level-matched.',
      'Fast attack + slow release "glues"; slow attack + fast release "punches".',
    ],
    formula: 'Above threshold, gain reduction = (input − threshold) × (1 − 1/ratio). Attack/Release = envelope-detector time constants; Knee softens the ratio around the threshold.',
  },

  // ───────────────────────────────────────────────────────── LAB 8 · Gate ──
  gate: {
    id: 'gate',
    num: 8,
    name: 'Gate',
    tier: 'T2',
    tagline: 'Silence below a threshold.',
    whatItIs:
      'A noise gate (downward expander) attenuates signal below a threshold and passes signal ' +
      'above it — for removing bleed/noise between notes, tightening drums, and controlling ambience.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The transfer curve shows the cliff: below the threshold the output falls toward the floor; above it, sound passes through. The GR meter below is the LIVE, measured reduction." },
      { key: 'threshold', name: 'Threshold', range: '−80…0 dB · default ~−40 dB', definition: 'Level the signal must exceed to open the gate.' },
      { key: 'attack', name: 'Attack', range: '0.01–100 ms · default ~1 ms', definition: 'Time to open once threshold is crossed. Fast preserves transients.' },
      { key: 'hold', name: 'Hold', range: '0–500 ms · default ~10 ms', definition: 'Minimum open time after the signal drops below threshold, before release — the primary anti-chatter control.' },
      { key: 'release', name: 'Release', range: '5 ms–2 s · default ~100 ms', definition: 'Time to close after the signal falls below threshold. Too fast = chatter; too slow = bleed.' },
      { key: 'range', name: 'Range / Depth (Floor)', range: '−∞…−6 dB · default ~−40 dB', definition: 'How much attenuation when "closed". A partial range is gentler and more natural (expander-like).' },
      { key: 'hysteresis', name: 'Hysteresis', range: '0–25 dB · default ~3 dB', definition: 'Separate open vs close thresholds to stop chatter near the threshold.' },
      { key: 'lookahead', name: 'Lookahead', range: '0–5 ms · default 0', definition: 'Delays the audio so the gate can open before a transient, preserving the attack.', advanced: true },
      { key: 'sidechain', name: 'Sidechain / Key input', definition: 'External trigger source (e.g. gate a pad from the kick).' },
      { key: 'key_filter', name: 'Key filter (HPF/LPF on detector)', definition: 'Band-limits the detector so only the intended band opens the gate.' },
      { key: 'sc_listen', name: 'Sidechain Listen / Monitor', definition: 'Audition the (filtered) detector signal to tune it.' },
      { key: 'gain_reduction', name: 'Gain reduction (meter)', definition: 'The LIVE, measured amount the gate is pulling the signal DOWN right now, in dB — a real engine reading, not a drawing. It reads deep (toward the floor) when the gate is closed on quiet material and 0 when the gate is open.' },
    ],
    commonMistakes: [
      'Threshold too high — chops off note tails, word endings, cymbal/reverb decays; choppy and unnatural.',
      'Threshold too low — bleed and noise sail through; the gate does nothing useful.',
      'Release too fast → chatter/stutter — the gate flickers near threshold; fix with Hold, slower Release, or Hysteresis.',
      'Attack too slow on percussion — opens after the transient; soft, dull hits. Use a fast attack (or lookahead).',
      'Range at −∞ — full silence between hits is abrupt and exposes the gating; a moderate floor is usually more natural.',
      'No key filter → false triggering — gating a tom off the whole kit lets snare/hat open it; filter the sidechain.',
      'Gating the life out of a source — over-gating strips natural room/ambience and sustain.',
    ],
    proTips: [
      'Set Threshold first with the Release exaggerated so you can hear it work, then dial Hold/Release/Hysteresis to remove chatter, then relax Range.',
      'On toms/snare: fast attack + short hold + medium release + key-filtered sidechain is the reliable start.',
    ],
    formula: 'A gate is downward expansion below threshold: below it, gain is reduced toward the Range floor; above it, gain = 0 dB (open). Attack/Hold/Release smooth the gain envelope.',
  },

  // ────────────────────────────────────────────────────── LAB 9 · Limiter ──
  limiter: {
    id: 'limiter',
    num: 9,
    name: 'Limiter',
    tier: 'T3',
    tagline: 'A hard ceiling on peaks.',
    whatItIs:
      'A brickwall/peak limiter is effectively a compressor with infinite ratio and a fixed ' +
      'ceiling — output never exceeds the set level. Used at the end of a chain for peak control ' +
      'and loudness; true-peak mode guards inter-sample peaks.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The flat shelf is the brickwall: output can never pass the ceiling no matter how hard you push in. The GR meter below is the LIVE, measured reduction while you hit it." },
      { key: 'ceiling', name: 'Ceiling (Output ceiling)', range: '−12…0 dBTP · default −1.0 dBTP', definition: 'Absolute maximum output. −1.0 dBTP is safe for streaming/lossy encodes.' },
      { key: 'drive', name: 'Threshold / Input Gain (Drive)', range: '0…+24 dB drive · default 0', definition: 'How hard you push into the limiter → how much gain reduction/loudness.' },
      { key: 'release', name: 'Release', range: '1 ms–1 s · default ~100 ms / Auto', definition: 'Recovery time. Too fast → distortion/pumping (esp. bass); too slow → dulls dynamics.' },
      { key: 'attack', name: 'Attack', range: '0–5 ms · near-instant', definition: 'A hair of attack lets transient "punch" through before catching it.', advanced: true },
      { key: 'lookahead', name: 'Lookahead', range: '0–5 ms · default ~1.5 ms', definition: 'Delays audio so peaks are caught before they occur → no overshoot without audible distortion.' },
      { key: 'true_peak', name: 'True-Peak / ISP mode', range: 'on/off · default on', definition: 'Oversampled detection to catch inter-sample peaks that exceed the ceiling after D/A or lossy encode.' },
      { key: 'character', name: 'Character / Style', range: 'Transparent … Aggressive', definition: 'Algorithm flavor.', advanced: true },
      { key: 'dither', name: 'Dither', range: 'off / TPDF / shaped', definition: 'Apply when the limiter is the last step before bit-depth reduction.', advanced: true },
      { key: 'gain_reduction', name: 'Gain reduction (meter)', definition: 'The LIVE, measured amount the limiter is holding the signal DOWN right now, in dB — a real engine reading, not a drawing. Constant, heavy reduction means you’re slamming the ceiling; brief flickers mean it’s just catching peaks.' },
    ],
    commonMistakes: [
      'Pushing for loudness → squashing — flattens dynamics, kills punch, adds distortion (the loudness-war trap). A few dB GR is plenty.',
      'Ignoring inter-sample peaks — 0 dBFS looks safe but clips on D/A and after MP3/AAC; set ~−1.0 dBTP and enable True-Peak.',
      'Release too fast — causes distortion and pumping, most audibly on bass.',
      'No lookahead — fast transients overshoot and clip.',
      'Using the limiter as a compressor — a limiter catches peaks; a compressor shapes dynamics. Reaching for the limiter to "compress" over-squashes.',
      'Limiting too early in the chain — a brickwall belongs at/near the end of the master chain.',
      'Forgetting dither on the final 24→16-bit export step.',
    ],
    proTips: [
      'Gain-stage INTO the limiter with the input/drive; leave the ceiling fixed at −1.0 dBTP and judge by GR + ears, not the number.',
      'Compare Attack 0 vs a hair of attack to hear transient punch return.',
    ],
    formula: 'Limiter ≈ compressor with ratio → ∞. True-peak estimation needs ≥4× oversampling to reconstruct inter-sample peaks. Ceiling is a hard cap: out ≤ ceiling always.',
  },

  // ─────────────────────────────────────────────────── LAB 10 · Distortion ──
  distortion: {
    id: 'distortion',
    num: 10,
    name: 'Distortion',
    tier: 'T2',
    tagline: 'Add harmonics with nonlinearity.',
    whatItIs:
      'Distortion/saturation reshapes the waveform through a nonlinearity, generating new ' +
      'harmonics. Symmetric shaping adds odd harmonics (hollow/harsh); asymmetric adds even ' +
      '(warm). Aliasing is both a hazard and a teaching target here.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The waveshape curve is how the input wave gets bent — the SHAPE decides the harmonics. Symmetric clipping makes odd harmonics; asymmetry (a tube) adds even ones too." },
      { key: 'hard_clip', name: 'Type (clip shape)', definition: 'The shaping curve. Symmetric clipping (hard/soft) chops top and bottom the SAME → odd harmonics; the tube’s asymmetry adds EVEN harmonics — the “warm” signature.' },
      { key: 'saturation', name: 'Drive', definition: 'How hard you push the signal into the shaper. More drive = more of the wave reshaped = more harmonics and grit.', range: '+6 … +36 dB' },
      { key: 'oversampling', name: 'Oversampling', definition: 'Processes at a higher internal rate so aliasing artifacts land above hearing, then filters them out. OFF lets you HEAR the aliasing distortion creates.' },
      { key: 'mix', name: 'Mix', definition: 'Blends the distorted signal with the clean dry — parallel (≈50%) keeps clarity while adding grit underneath.' },
    ],
    commonMistakes: [
      'No oversampling → aliasing — nonlinearity creates harmonics above Nyquist that fold back as inharmonic harshness. Oversample — but aliasing is also a teaching target, so make oversampling a toggle.',
      'Confusing loudness with distortion — drive raises level; level-match to judge character, not "more".',
      'Too much drive — a touch adds harmonics/glue; excess buries clarity and intelligibility.',
      'Not distinguishing odd vs even harmonics — symmetric (hard) clip → odd (hollow/harsh); asymmetric (tube) → even (warm).',
      'Bit-crush vs sample-reduction confusion — bit reduction = quantization noise; sample-rate reduction = aliasing/downsampling. Different mechanisms.',
      'Distorting the full range — often better to band-limit (drive the mids, keep lows/highs clean) to avoid fizz/mud.',
      'DC offset from asymmetric shaping — builds up → click/headroom loss; HPF after the shaper.',
    ],
    proTips: [
      'A/B hard-clip vs tube on a sine and read the FFT: odd-only vs odd+even harmonic stacks.',
      'Push a high sine with oversampling OFF to show aliasing (inharmonic partials), then ON to remove it.',
    ],
    formula: 'A nonlinearity y = f(x) expands a sine into a harmonic series; symmetric f → odd, asymmetric f → even. Any harmonic above fs/2 aliases to fs − f. THD = harmonic energy ÷ fundamental energy.',
  },

  // ──────────────────────────────────────────────────────── LAB 11 · Noise ──
  noise: {
    id: 'noise',
    num: 11,
    name: 'Noise',
    tier: 'T1',
    tagline: 'Colors, floor, and masking.',
    whatItIs:
      'Noise sources differ by spectral slope ("color"). White has equal energy per Hz (bright); ' +
      'pink has equal energy per octave (balanced). The lab also covers real-world noise: hum, ' +
      'buzz, RF, ground loops — distinguished on the spectrogram.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The slope chart is each color’s idealized spectrum tilt — flat (white), −3 dB/oct (pink), −6 (brown), and the bright rising slopes (blue/violet). Analytic — drawn from the model, not a live measurement." },
      { key: 'white', name: 'White', definition: 'Equal energy per Hz — a flat spectrum. Sounds bright/hissy because each higher octave holds twice the bandwidth.' },
      { key: 'pink', name: 'Pink', definition: 'Equal energy per octave (−3 dB/oct). Sounds tonally balanced to the ear — the standard test noise for rooms and speakers.' },
      { key: 'brown', name: 'Brown', definition: 'Also called red — −6 dB/oct. Deep, rumbly, ocean-like; energy concentrated in the lows.' },
      { key: 'blue', name: 'Blue', definition: '+3 dB/oct — the mirror of pink. Energy rises with frequency; thin and hissy.' },
      { key: 'violet', name: 'Violet', definition: '+6 dB/oct — the mirror of brown. Almost all energy in the top octaves; used in dither shaping.' },
      { key: 'grey', name: 'Grey', definition: 'Noise shaped by an equal-loudness contour so every band sounds equally loud to the ear (psychoacoustically flat).' },
      ...names(['Speech noise', 'HVAC', 'Traffic', 'Wind', 'Hum', 'Buzz', 'RF', 'Crackle', 'Static', 'Ground loop']),
    ],
    commonMistakes: [
      'Expecting white noise to sound "neutral/flat" — white has equal energy per Hz, so it sounds bright/hissy; pink (equal per octave) sounds balanced.',
      'Mixing up the colors — white (flat), pink (−3), brown/red (−6), blue (+3), violet (+6 dB/oct). The spectrum settles it.',
      'Judging level across colors by loudness — equal-RMS noises of different colors sound very different.',
      'Not reasoning about the noise floor / SNR — calling a signal "clean" without checking how far it sits above the floor.',
      'Misreading hum vs buzz vs ground loop — hum = tonal 50/60 Hz + low harmonics; buzz = richer/spikier; ground loop = wiring-loop hum. The spectrogram distinguishes them.',
      'Forgetting masking — a noise can be inaudible when masked by louder nearby content; SNR alone doesn’t predict audibility.',
    ],
    proTips: [
      'Put white and pink side-by-side on the spectrum and let students hear both — the "why does white sound brighter?" moment.',
      'Use the spectrogram to identify a mystery noise (hum vs buzz vs RF) as a challenge.',
    ],
    formula: 'Color = spectral slope (dB/octave); pink ∝ 1/f power. SNR (dB) = 20·log₁₀(signal/noise). Masking threshold rises with masker level within the critical band.',
  },

  // ──────────────────────────────────────────────────────── LAB 12 · Phase ──
  phase: {
    id: 'phase',
    num: 12,
    name: 'Phase',
    tier: 'T2',
    tagline: 'Polarity vs phase, made intuitive.',
    whatItIs:
      'This lab separates polarity (flip the whole waveform, 180° at all frequencies) from ' +
      'phase (a frequency-dependent time/angle shift), and shows how each affects mono ' +
      'compatibility on the correlation meter and Lissajous.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The Lissajous plots left against right; the correlation reads +1 (mono-safe) down to −1 (cancels in mono). A polarity flip or inter-channel delay shows up here as tilt or spread." },
      { key: 'invert_polarity', name: 'Polarity (invert)', definition: 'Flips the whole waveform upside-down — 180° at EVERY frequency. Against its original it cancels completely in mono.' },
      { key: 'delay_one_channel', name: 'Delay one channel', definition: 'Delays one channel by a few ms — a frequency-dependent PHASE shift (not a simple flip). In mono this combs, and no polarity flip can fix it.', range: '0 – 10 ms' },
      { key: 'mono_fold', name: 'Mono-fold', definition: 'Sums L+R to mono — the acid test. Anything out of phase cancels or combs here, which is exactly what a mono listener hears.' },
    ],
    commonMistakes: [
      'Confusing polarity with phase — polarity flips the whole waveform (the "Ø" button); phase is a frequency-dependent shift. Not interchangeable.',
      'Assuming a polarity flip always fixes cancellation — it fixes a simple inversion; time-delay comb filtering needs time alignment.',
      'Not checking mono — content that’s wide/phasey in stereo can cancel in mono.',
      'Misreading the Lissajous/correlation — vertical line = mono/in-phase (+1); horizontal = anti-phase (−1, cancels); a ball = wide/decorrelated.',
      'Treating any negative correlation as "bad" — some width uses controlled decorrelation; sustained −1 on key elements is the real problem.',
      'Delaying one channel for width without mono-checking — introduces comb filtering.',
    ],
    proTips: [
      'Sum two identical signals, flip polarity on one → silence (pure cancellation); then delay one → comb, showing polarity ≠ phase.',
      'Keep the correlation meter on screen for every width move.',
    ],
    formula: 'Polarity invert = ×(−1) (broadband 180°). A time delay τ gives φ(f) = −2πfτ (phase grows with frequency → comb notches). Correlation = normalized cross-correlation of L/R (+1 / 0 / −1).',
  },

  // ────────────────────────────────────────────────────── LAB 13 · Harmonic ──
  harmonic: {
    id: 'harmonic',
    num: 13,
    name: 'Harmonic',
    tier: 'T1',
    tagline: 'Build tone from partials.',
    whatItIs:
      'The Harmonic lab builds and dissects waveforms by their partials. Sine = fundamental only; ' +
      'square = odd harmonics; saw = all; triangle = odd (steeper rolloff). The FFT/harmonic ' +
      'analyzer shows the content the oscilloscope shape cannot.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "Three linked views of the SAME harmonics: the bar/heatmap (level of each harmonic), the piano gutter (which note each lands on), and the waveform (their summed shape). ANALYTIC = drawn from the model; REAL = your live mic." },
      { key: 'wave_shape', name: 'Wave shape / Preset', definition: 'The chosen waveform — sine (fundamental only), square (odd harmonics), sawtooth (all harmonics), triangle (odd, steep rolloff), pulse/PWM. Each carries a characteristic harmonic series.' },
      { key: 'frequency', name: 'Frequency (fundamental)', definition: 'The fundamental pitch in Hz. Every harmonic is an integer multiple of it (2f, 3f, 4f…), so moving the fundamental shifts the whole series up or down together.' },
      { key: 'amplitude', name: 'Amplitude', definition: 'Overall level. Raising it scales every partial equally — it does NOT add harmonics (a common confusion).' },
      { key: 'duty_cycle', name: 'Duty cycle (PWM)', definition: 'The high/low ratio of a pulse wave. It changes timbre and nulls specific harmonics (amplitude ∝ sin(nπd)/(nπ)) but does NOT change the pitch.' },
      { key: 'add_remove_harmonics', name: 'Add / Remove harmonics', definition: 'Toggle or drag individual partials to build a waveform from its Fourier components — e.g. stack the odd harmonics one at a time to approach a square.' },
      { key: 'harmonic_phase', name: 'Harmonic phase', definition: 'The phase of each partial. Changing phases redraws the waveform shape dramatically, yet a steady tone sounds nearly identical (the ear’s phase-deafness).' },
      { key: 'view', name: 'View (MODEL / LIVE)', definition: 'Switches the display between MODEL — the analytic harmonic recipe you’re editing, drawn exactly from the math — and LIVE, the real spectrum captured from the mic. MODEL is exact and editable; LIVE is measured and labeled uncalibrated.' },
      { key: 'axis', name: 'Axis (LOG ♪ / LIN)', definition: 'Switches the frequency axis. LOG (♪) spaces the octaves evenly, matching how we hear pitch; LIN spaces the Hz evenly, so the harmonics line up at equal intervals. Same data — only the horizontal spacing changes.' },
      { key: 'crest', name: 'Crest factor (readout)', definition: 'The gap between the wave’s PEAK and its RMS (average) level, in dB. A pure sine is ~3 dB; spiky, peaky waves read higher. It shows how much headroom the peaks demand versus the perceived loudness. Computed from the model, not a live measurement.' },
      { key: 'slope', name: 'Envelope slope (readout)', definition: 'How fast the harmonic levels fall off going up the series, in dB per octave. A steeper (more negative) slope sounds darker/duller; a shallow slope keeps the highs and sounds brighter. Fit to the model’s harmonic envelope.' },
    ],
    commonMistakes: [
      'Not knowing which wave has which harmonics — sine = fundamental; square = odd (∝1/n); saw = all (∝1/n); triangle = odd (∝1/n²).',
      'Reading the oscilloscope for spectrum — the scope shows the time-domain shape; harmonic content is on the FFT/analyzer.',
      'Expecting duty cycle to change pitch — PWM changes timbre/harmonic content (and nulls certain harmonics), not the fundamental.',
      'Thinking a real square/saw is "perfect" — ideal versions need infinite harmonics; band-limited/naïve digital ones differ and can alias.',
      'Amplitude vs harmonic-amplitude confusion — overall level up ≠ "adding harmonics".',
      'Ignoring harmonic phase — same amplitudes, different phases → very different waveform shape but nearly identical steady-tone sound (the ear’s phase-deafness).',
    ],
    proTips: [
      'Build a square by adding odd harmonics one at a time (1st, 3rd, 5th…) and watch the scope approach a square — Fourier synthesis made visible.',
      'Sweep PWM duty and watch harmonics null and reappear on the analyzer.',
    ],
    formula: 'Fourier series: square = Σ odd n, amplitude 1/n · saw = Σ all n, 1/n · triangle = Σ odd n, 1/n². Pulse (duty d): harmonic amplitude ∝ sin(nπd)/(nπ) → nulls where n·d is an integer.',
  },

  // ─────────────────────────────────────────────────── LAB 14 · Oscillator ──
  oscillator: {
    id: 'oscillator',
    num: 14,
    name: 'Oscillator',
    tier: 'T1',
    tagline: 'Waveforms, FM, AM, aliasing.',
    whatItIs:
      'The Oscillator lab generates classic waveforms plus FM and AM synthesis, and shows why ' +
      'naïve digital saw/square alias. FM modulates frequency (rich sidebands); AM modulates ' +
      'amplitude (tremolo).',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The strip shows one cycle of the wave’s SHAPE; the bars show its harmonic recipe — how much of each overtone the shape contains. Both are analytic, drawn from the waveform, not measured." },
      { key: 'sine', name: 'Sine', definition: 'The pure tone — one partial, the fundamental only. Every other waveform is a stack of sines (Fourier); the sine is the building block.' },
      { key: 'square', name: 'Square', definition: 'Odd harmonics only, amplitudes falling ∝1/n. Hollow, clarinet-like. A perfect square needs infinite harmonics — real generators band-limit it.' },
      { key: 'saw', name: 'Saw', definition: 'ALL harmonics, amplitudes ∝1/n. The brightest classic wave — buzzy, brassy, the subtractive-synth workhorse.' },
      { key: 'triangle', name: 'Triangle', definition: 'Odd harmonics with a steep ∝1/n² rolloff — much mellower than a square despite sharing the odd-only series.' },
      { key: 'pulse', name: 'Pulse', definition: 'A rectangular wave with adjustable duty cycle. Duty shapes the harmonic content (nulls where n·d is an integer) — it changes timbre, not pitch.' },
      { key: 'frequency', name: 'Frequency', definition: 'The fundamental pitch in Hz. All harmonics move with it; near Nyquist even band-limited waves run out of harmonics and thin out.' },
      { key: 'noise', name: 'Noise', definition: 'Aperiodic signal with a continuous spectrum instead of discrete harmonics — see the Noise lab for the colors.' },
      { key: 'fm', name: 'FM', definition: 'Frequency modulation — the modulator wobbles the carrier’s frequency, creating sidebands at fc ± n·fm (Bessel amplitudes). Rich, bell-like; pitch stays at the carrier.' },
      { key: 'am', name: 'AM', definition: 'Amplitude modulation — the modulator rides the carrier’s level, creating one sideband pair at fc ± fm (tremolo at slow rates). Ring mod is AM with the carrier suppressed.' },
    ],
    commonMistakes: [
      'Naïve digital waveforms alias — direct-math saw/square generate harmonics above Nyquist that fold back; band-limited generation (wavetable/BLEP) fixes it.',
      'Confusing FM and AM — FM modulates frequency → sidebands at fc ± n·fm (rich/bell-like); AM modulates amplitude → fc ± fm (tremolo).',
      'AM vs ring modulation — AM keeps the carrier; ring mod (balanced) suppresses it, leaving only sidebands (metallic).',
      'Expecting FM depth to change pitch — increasing the modulation index changes timbre/richness; perceived pitch stays at the carrier.',
      'Fundamental set near Nyquist — even band-limited oscillators run out of harmonics up high → thin/dull tone.',
      'DC offset from pulse/asymmetric waves — clicks/headroom loss; center it or HPF.',
    ],
    proTips: [
      'Sweep a saw’s pitch upward with band-limiting OFF to hear aliasing descend against the rising tone, then ON to fix it.',
      'Compare FM vs AM at the same rate/depth on the FFT to see sideband structure differences.',
    ],
    formula: 'AM: carrier + sidebands at fc ± fm. FM: components at fc ± n·fm with Bessel-function amplitudes (index β = Δf/fm). Aliased component of f > fs/2 appears at fs − f.',
  },

  // ───────────────────────────────────────────────────────── LAB 15 · Stereo ──
  stereo: {
    id: 'stereo',
    num: 15,
    name: 'Stereo Imaging',
    tier: 'T2',
    tagline: 'Place and widen — keep mono safe.',
    whatItIs:
      'Stereo imaging places and shapes sound in the stereo field — pan, width, and Mid/Side ' +
      'balance — with a constant eye on mono compatibility (what survives when L and R sum).',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The Lissajous plots left against right: a vertical line = mono, a wide cloud = wide. The correlation number below is your mono-compatibility gauge (+1 safe, −1 cancels)." },
      { key: 'pan', name: 'Pan / Balance', range: 'L100…C…R100 · default C', definition: 'Places the source (or shifts the center) left/right.' },
      { key: 'width', name: 'Width', range: '0% (mono)…100%…200% · default 100%', definition: 'Narrows or widens the field by scaling the Side component vs the Mid.' },
      { key: 'mid', name: 'Mid gain (M)', range: '±12 dB · default 0', definition: 'Level of the center/mono component (vocals, kick, snare, bass usually live here).' },
      { key: 'side', name: 'Side gain (S)', range: '±12 dB · default 0', definition: 'Level of the difference/stereo component. Raising S widens.' },
      { key: 'mono_fold', name: 'Mono-fold / Mono button', definition: 'Sums to mono to check compatibility — the single most important check in this lab.' },
      { key: 'bass_mono', name: 'Bass-Mono / Mono-maker', range: 'off…300 Hz · default ~120 Hz', definition: 'Collapses everything below the crossover to mono (vinyl/PA/phase safety).' },
      { key: 'multiband_width', name: 'Frequency-dependent (multiband) width', definition: 'Per-band width — keep lows mono, widen highs.', advanced: true },
      { key: 'rotation', name: 'Rotation / Image balance', definition: 'Rotates the stereo image.', advanced: true },
      { key: 'haas', name: 'Haas / L-R micro-delay', range: '0–30 ms', definition: 'Widens via arrival-time difference — powerful but the biggest mono-compatibility risk.', advanced: true },
    ],
    commonMistakes: [
      'Over-widening → phase cancellation/mono collapse — huge on headphones, hollow or silent in mono; check mono-fold + correlation.',
      'Widening the bass — wide lows are phasey and unstable; keep everything below ~100–150 Hz mono.',
      'Confusing "louder" with "wider" — boosting Side raises level; level-match before judging width.',
      'Haas/delay widening abuse — large L/R delays comb-filter in mono and smear localization; use tiny amounts.',
      'Ignoring the correlation meter — sustained negative correlation = out-of-phase content that will cancel.',
      'No center anchor — panning everything wide loses the phantom center (lead vocal, kick, snare, bass usually belong centered).',
      'Using width to "fix" a dull or cluttered mix — width doesn’t fix arrangement or EQ problems.',
    ],
    proTips: [
      'Workflow: set Bass-Mono first, then Width, then mono-check and read correlation, then level-match A/B.',
      'Teach with pink noise + a centered vocal: widen and watch the vocal stay put while the sides balloon, then hit mono and hear the sides fold.',
    ],
    formula: 'M/S encode: M = (L + R)/√2, S = (L − R)/√2. Decode: L = (M + S)/√2, R = (M − S)/√2. Width = scaling S relative to M. Correlation = normalized cross-correlation of L and R (+1 / 0 / −1).',
  },

  // ───────────────────────────────────────────────── LAB 16 · Harmonograph ──
  harmonograph: {
    id: 'harmonograph',
    num: 16,
    name: 'Harmonograph',
    tier: 'T1',
    tagline: 'See musical intervals as figures.',
    whatItIs:
      'A virtual harmonograph: damped sinusoids drive a pen to draw deterministic figures set by ' +
      'frequency ratios, phase, and damping. Driven by two oscillators, students hear the interval ' +
      'while watching the figure — simple ratios draw stable closed loops.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The figure is drawn straight from the two damped oscillations. A simple whole-number ratio closes into a stable shape; a slightly detuned ratio slowly rotates — that drift IS beating, made visible." },
      { key: 'ratio_lock', name: 'Ratio-lock', definition: 'Snaps the two frequencies to a simple integer ratio — 2:1 octave, 3:2 fifth, 4:3 fourth, 5:4 major third. Simple ratios draw stable closed figures; a near-miss slowly precesses, and that drift IS beating.' },
      { key: 'frequencies', name: 'Frequencies (f₁–f₄)', definition: 'The pendulum frequencies. Their RATIO sets the pattern — the interval made visible. Changing frequency changes the figure; changing amplitude only changes its size.' },
      { key: 'amplitude', name: 'Amplitude', definition: 'Pendulum swing size — scales the figure. It does not change the pattern (a classic confusion with frequency).' },
      { key: 'phase', name: 'Phase', definition: 'The starting angle of each pendulum. Same ratio, different phase → a rotated/different figure (line vs ellipse vs circle in the 2-pendulum Lissajous case).' },
      { key: 'damping', name: 'Damping', definition: 'The decay envelope e^(−dt) that spirals the figure inward. None = it never resolves; too much = it dies before drawing. The decay is what creates the classic spiral look.' },
      { key: 'mode', name: 'Lateral / Rotary', definition: 'Lateral drives X and Y from separate pendulums (the Lissajous case). Rotary sums two circular motions — flower-petal figures whose petal count follows the ratio.' },
      { key: 'drive_from_oscillators', name: 'Drive from oscillators', definition: 'Links the figure to two real tones so you HEAR the interval while watching it — a consonant ratio yields both a stable figure and a consonant sound.' },
    ],
    commonMistakes: [
      'Thinking the figure is random art — every figure is deterministic; simple integer ratios draw stable closed figures.',
      'Expecting complex/irrational ratios to close — only simple ratios (2:1, 3:2, 4:3) close cleanly; near-but-inexact ratios drift/precess, and that drift is beating.',
      'Confusing amplitude with frequency — amplitude changes figure size; frequency changes the pattern.',
      'Ignoring phase — same ratio, different phase → a rotated/different figure (line vs ellipse vs circle in the 2-pendulum case).',
      'Damping extremes — none = it never resolves; too much = it dies before drawing. The decay envelope creates the spiral look.',
      'Viewing it silently — the payoff is driving it from two oscillators: a consonant ratio yields a stable figure AND a consonant sound.',
    ],
    proTips: [
      'Ratio-lock to 2:1, 3:2, 4:3, 5:4 and hear each interval as the figure snaps to a stable shape — intervals made visible + audible.',
      'Detune slightly off a locked ratio and watch the figure slowly precess = seeing beats.',
    ],
    formula: 'x(t) = A₁sin(f₁t+φ₁)e^(−d₁t) + A₂sin(f₂t+φ₂)e^(−d₂t) (similarly y). Ratio f₁:f₂ = musical interval; the undamped 2-pendulum case = a Lissajous figure; a small detune Δ makes the figure precess at a rate ∝ Δ.',
  },

  // ──────────────────────────────── CAPSTONE · Signal Chain Builder (§8) ──
  chain: {
    id: 'chain',
    num: 17,
    name: 'Signal Chain Builder',
    tier: 'T3',
    tagline: 'Effects interact — order matters.',
    whatItIs:
      'The capstone: a full processing chain — Source → EQ → Compressor → Gate → Distortion → ' +
      'Modulation → Delay → Reverb → Stereo → Limiter → Output. Single labs teach each effect ' +
      'alone; the chain teaches how they INTERACT: what each module feeds the next changes what ' +
      'the next one does.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The diagram is the actual signal path, Source → … → Output. Each pill is a module you can toggle on/off; the GR meters below show what the dynamics stages are doing to the level." },
      { key: 'module_toggle', name: 'Module enable/bypass', definition: 'Each module can be switched in or out of the chain. A bypassed module still occupies its slot — the chain order is the canonical studio order.' },
      { key: 'chain_order', name: 'Chain order', definition: 'The fixed, canonical order. EQ before compression changes what the compressor reacts to; a limiter anywhere but last voids its ceiling guarantee.' },
      { key: 'gain_staging', name: 'Gain staging', definition: 'The level each stage hands the next. Run stages too hot and the final limiter over-works and squashes — watch the live GR meters between modules.' },
      { key: 'gain_reduction', name: 'Gain-reduction meters', definition: 'The LIVE, measured dB each dynamics module (compressor / gate / limiter) is pulling the signal down by RIGHT NOW — real engine readings, not drawings. Comparing them across the chain shows how each stage feeds the next: a hot compressor makes the limiter work harder.' },
    ],
    commonMistakes: [
      'Not understanding EQ→comp vs comp→EQ — EQ BEFORE compression changes what the compressor reacts to (boost lows → it pumps on bass); EQ after shapes the already-compressed tone.',
      'Gate placement — gate BEFORE compression is usually right; compressing first raises the noise floor, making the gate threshold impossible to set cleanly.',
      'Time-based FX before dynamics — compressing a reverb/delay tail pumps it; reverb/delay usually go after dynamics (or on sends).',
      'Distortion placement blindness — before EQ (shape the new harmonics after) vs after EQ (drive specific bands); before compression it adds harmonics the comp then reacts to.',
      'Delay→reverb vs reverb→delay — the order changes the resulting space/decay character; a deliberate choice, not random.',
      'Gain-staging into the limiter — running each stage too hot makes the final limiter over-work and squash; watch levels between modules.',
      'Stacking dynamics without gain-matching — cumulative squashing you can’t hear because each stage is louder.',
      'Limiter not last — a brickwall limiter anywhere but the end voids the true-ceiling guarantee.',
      'Judging by cumulative only — not comparing per-module vs whole-chain leads to blaming the wrong module for a problem.',
      'Bypass ≠ remove — a bypassed module still occupies the chain order for A/B reasoning.',
    ],
    proTips: [
      'Build the same idea in two orders mentally (EQ→comp vs comp→EQ) and A/B the result — the GR meter tells you what the compressor is reacting to.',
      'Turn modules on ONE at a time and listen to what each adds — then all together. The difference between the sum and the parts is the interaction.',
    ],
    formula: 'Canonical chain: Source → EQ → Comp → Gate → Distortion → Modulation → Delay → Reverb → Stereo → Limiter → Output. Each stage’s output is the next stage’s input — that composition IS the lesson.',
  },

  // ─────────────────────────────── EXPANSION · Bass Guitar Lab (2026-07-26) ──
  bass: {
    id: 'bass',
    num: 18,
    name: 'Bass Guitar',
    tier: 'T1',
    tagline: 'Strings make fractions audible.',
    whatItIs:
      'A vibrating string is physics you can touch: fretting shortens the vibrating length, ' +
      'and pitch rises in exact proportion. Halve the string (12th fret) and the frequency ' +
      'doubles — an octave. The simple fractions ARE the consonant intervals: ≈2/3 of the ' +
      'string (7th fret) is a perfect fifth (3:2), ≈3/4 (5th fret) a perfect fourth (4:3). ' +
      'Touching (not pressing) a node point instead forces a natural harmonic — only the ' +
      'modes with a node there survive.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The fretboard is drawn at true geometry — frets crowd toward the bridge by the 17.817 rule. The highlighted span is the vibrating portion; the readout gives the exact string fraction, pitch, interval, and wavelength." },
      { key: 'string', name: 'String (E · A · D · G)', definition: 'Standard bass tuning — E1 41.2 Hz, A1 55 Hz, D2 73.4 Hz, G2 98 Hz. Same physics on each string; only the open frequency (mass/tension/length) differs.' },
      { key: 'fret', name: 'Fret', definition: 'Fret n leaves 2^(−n/12) of the string vibrating — each fret multiplies the frequency by the same ratio (≈1.0595), which is WHY frets get closer together toward the bridge.', range: '0–12 · open string default' },
      { key: 'harmonic_node', name: 'Harmonic node (½ · ⅓ · ¼ · ⅕)', definition: 'Touch lightly at 1/n of the length: every mode without a node there is damped, leaving harmonics n, 2n, 3n… You hear n× the open-string frequency.' },
      { key: 'pluck_tone', name: 'Pluck tone', definition: 'The played tone is an additive model of a plucked string (harmonic amplitudes ≈ 1/n). Real strings vary with pluck position and pickup — this is the idealized teaching model.' },
    ],
    commonMistakes: [
      'Thinking frets are evenly spaced — each fret is the same RATIO (2^(1/12)), not the same distance; equal ratios make shrinking spacings.',
      'Confusing the 7th-fret FRETTED note with the 7th-fret HARMONIC — fretting ≈2/3 length gives a fifth UP; touching the 1/3 node gives harmonic 3 = an octave PLUS a fifth.',
      'Expecting the harmonic at the fret line — node points (1/3, 1/4, 1/5) only APPROXIMATELY align with frets 7/5/4; the node is a fraction of the string, not a fret.',
      'Forgetting the string’s wavelength is fixed by its length (λ = 2L for the fundamental) — the SOUND wavelength in air is a different number (λ = c/f).',
      'Assuming louder = lower — low bass notes need MORE energy to hear at equal loudness; small speakers can’t reproduce E1’s 41 Hz fundamental at all (you hear its harmonics).',
      'Treating intervals as arbitrary — the consonant intervals are the SIMPLE fractions of a string; that is the physical basis Pythagoras measured.',
    ],
    proTips: [
      'Play open E, then the 12th-fret octave, then the 12th-fret harmonic — same pitch two ways: half the LENGTH or half the MODES.',
      'Walk the harmonic series up one string (½ → ⅓ → ¼ → ⅕) and name each interval — it is the same series the Harmonic Lab draws.',
    ],
    formula: 'f = f₀ · 2^(n/12) (fret n) · vibrating length = L · 2^(−n/12). Fundamental on a string: f₀ = v/2L (λ = 2L). Harmonic at node 1/n: f = n·f₀. 3:2 = perfect fifth, 4:3 = perfect fourth, 2:1 = octave.',
  },

  // ──────────────────────────────── EXPANSION · Autotune Lab (2026-07-26) ──
  autotune: {
    id: 'autotune',
    num: 19,
    name: 'Autotune',
    tier: 'T1',
    tagline: 'Pull pitch onto the grid.',
    whatItIs:
      'Pitch correction measures a note’s pitch, finds the nearest target on a scale grid, ' +
      'and retunes the note toward it. Two controls do most of the work: CORRECTION AMOUNT ' +
      '(how far toward the grid the note is pulled) and RETUNE SPEED (how fast it gets ' +
      'there). Slow speed preserves natural glides and vibrato; instant speed snaps every ' +
      'note — the deliberate robotic "hard-tune" effect.',
    controls: [
      { key: 'correction', name: 'Correction amount', definition: 'Scales how far the pitch is pulled toward the grid target: 0% leaves it untouched, 100% lands exactly on pitch. Partial correction keeps some human character.', range: '0–100% · default 100%' },
      { key: 'retune_speed', name: 'Retune speed', definition: 'The time constant of the pull. Fast (≈25 ms) = audible snap/robotic; slow (≈400 ms) = a natural-sounding glide that can leave short notes under-corrected.', range: '≈25–400 ms' },
      { key: 'cents_grid', name: 'Cents grid', definition: 'The vertical target lines — one per semitone (100 cents apart). A note’s error is read in cents from the nearest line; ±5–10 cents reads as "in tune" to most ears.' },
    ],
    commonMistakes: [
      'Retune speed too fast on everything — instant snap flattens vibrato and phrasing into the robotic effect even when you didn’t want it.',
      'Retune speed too slow on short notes — the note ends before the correction arrives, so fast passages stay out of tune.',
      'Correcting to the wrong grid — chromatic mode pulls to the nearest of ALL 12 semitones; a note bent between scale tones can be "corrected" to a note not in the song’s key.',
      'Thinking correction is free — the further a note is pulled (deep cents error, 100% amount), the more audible the artifact; correction polishes, it does not replace singing in tune.',
      'Confusing cents with Hz — a cent is 1/100 of a semitone, a RATIO (about 0.06%); the same 20-cent error is a different Hz offset at every pitch.',
      'Using the robotic snap by accident — hard-tune is a produced EFFECT (a creative choice), not transparent correction.',
    ],
    proTips: [
      'A/B the same off-pitch phrase at 0% → 50% → 100% correction, then fast vs slow retune — hear "polish" become "effect".',
      'Watch the graph while you listen: the corrected trace bending onto the gridline IS what you hear; the gap that remains at 50% is the remaining cents error.',
    ],
    formula: 'Error(cents) = 1200·log₂(f/f_target). Correction target = f_sung shifted by amount × error. Retune: f(t) approaches the target exponentially with time constant τ (retune speed). 100 cents = 1 semitone.',
  },

  // ─────────────────────────────────── EXPANSION · FM Synth Lab (2026-07-26) ──
  fm: {
    id: 'fm',
    num: 20,
    name: 'FM Synth',
    tier: 'T2',
    tagline: 'Two sine waves, infinite timbres.',
    whatItIs:
      'FM synthesis modulates the PHASE of one sine (the carrier) with another (the ' +
      'modulator). That simple act sprays energy into sidebands at carrier ± k×modulator, ' +
      'with amplitudes given by Bessel functions of the modulation index. Ratio sets WHERE ' +
      'the sidebands land (harmonic vs inharmonic); index sets HOW MANY are audible ' +
      '(brightness). Put an envelope on the index and brightness moves over time — the ' +
      'classic FM bell and electric piano.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "Each stick is an FM sideband at carrier ± k×modulator, drawn at its true Bessel height — the actual spectrum the voice plays. Green = carrier, amber = sidebands, red dashed = folded (aliased) partials." },
      { key: 'carrier', name: 'Carrier frequency', definition: 'The base oscillator being modulated — the perceived pitch anchor (for harmonic ratios).', range: '110–880 Hz in this lab' },
      { key: 'ratio', name: 'Modulator ratio', definition: 'Modulator frequency = ratio × carrier. INTEGER ratios put sidebands on a harmonic series (pitched, brassy/organ-like); NON-INTEGER ratios land them between harmonics (inharmonic — bells, metallic).', range: '0.5–8 · default 2' },
      { key: 'index', name: 'Modulation index (I)', definition: 'Peak phase deviation in radians. I=0 is a pure sine; raising I activates more sideband pairs (≈ I+1 audible pairs) — the brightness control of FM.', range: '0–8 in this lab' },
      { key: 'index_env', name: 'Index envelope', definition: 'An exponential decay on the index per strike: bright attack fading to pure tone — the classic FM pluck/bell behavior. SUSTAIN holds the index static.' },
    ],
    commonMistakes: [
      'Thinking FM adds harmonics like distortion — FM places sidebands SYMMETRICALLY around the carrier at ±k·fm; the spectrum is a Bessel pattern, not a rolloff.',
      'Expecting louder sidebands with higher index everywhere — Bessel amplitudes OSCILLATE: a given sideband can get quieter as the index rises (and the carrier itself can vanish, J₀=0 near I≈2.4).',
      'Using a non-integer ratio and wondering why the pitch is unclear — inharmonic sidebands don’t form a harmonic series, so the ear loses the fundamental (that IS the bell sound).',
      'Cranking index at high ratios — Carson bandwidth ≈ 2·fm·(I+1) can cross Nyquist and alias (digital FM is not band-limited by construction).',
      'Confusing FM with vibrato — vibrato is SLOW frequency modulation (a few Hz, hear the wobble); audio-rate modulation is heard as TIMBRE, not pitch movement.',
      'Ignoring the index envelope — static-index FM sounds like an organ; the movement of brightness over time is what makes FM instruments live.',
    ],
    proTips: [
      'Hold ratio 2 and step the index 0→1→2→4→8 while watching the sideband graph — you can SEE brightness being added pair by pair.',
      'A/B ratio 2 vs ratio 1.41 at the same index: same bandwidth, harmonic vs bell — placement, not amount, decides the character.',
    ],
    formula: 'y(t) = sin(2π·fc·t + I·sin(2π·fm·t)), fm = ratio·fc. Sideband amplitude at fc±k·fm = J_k(I) (Bessel). Carson bandwidth ≈ 2·fm·(I+1).',
  },

  // ────────────────────────────── EXPANSION · Binaural Panner Lab (2026-07-26) ──
  binaural: {
    id: 'binaural',
    num: 21,
    name: 'Binaural Panner',
    tier: 'T2',
    tagline: 'Two ears, one 3-D world.',
    whatItIs:
      'Your brain locates sound with TWO ear signals: the interaural time difference (ITD — ' +
      'the far ear hears later, up to ~0.7 ms) and the interaural level difference (ILD — the ' +
      'head shadows high frequencies at the far ear). This lab synthesizes those cues ' +
      'directly: place up to three sources around your head and hear them localize in a ' +
      'binaural HEADPHONE mix. It uses a simplified spherical-head model — real ears also use ' +
      'pinna/HRTF spectral cues (which this model deliberately does not fake).',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "An overhead view of the stage: your head at center, each dot a sound object. Angle around you = azimuth, distance from center = how far away. Drag a dot to move it; the readout shows the resulting ITD/ILD cues." },
      { key: 'azimuth', name: 'Azimuth', definition: 'The source’s angle around your head: 0° = front, ±90° = hard side, ±180° = behind. Drives ITD (delay) and ILD/shadow (level + tone) together, as physics does.', range: '−180°..+180°' },
      { key: 'distance', name: 'Distance', definition: 'Inverse-distance level (−6 dB per doubling, re 1 m). Distance perception also uses reflections/air absorption — not modeled here (stated).', range: '0.5–4 m' },
      { key: 'source_type', name: 'Source type', definition: 'Sine, white or pink noise per object. Noise localizes much more strongly than a pure tone — broadband content feeds BOTH cues at every frequency.' },
      { key: 'objects', name: 'Sound objects (up to 3)', definition: 'Independent sources mixed to one binaural bus. The bus is peak-bounded (norm shown when attenuating).' },
      { key: 'tone_freq', name: 'Tone frequency', definition: 'Sets the pitch of the selected object’s sine test tone, in Hz. Localization changes with frequency: LOW tones are located mainly by ITD (timing between the ears), HIGH tones by ILD (the head shadows the far ear). Below ~800 Hz a pure tone is hard to place — switch it to noise to hear the difference.', range: 'preset steps' },
    ],
    commonMistakes: [
      'Listening on speakers — binaural cues require HEADPHONES; on speakers the two channels mix in the air (crosstalk) and the illusion collapses.',
      'Expecting elevation — this model does azimuth + distance only; up/down cues come from pinna filtering (HRTF), which a time/level model cannot produce.',
      'Testing with a low sine and hearing nothing move — ITD phase cues get ambiguous and ILD nearly vanishes at low frequencies; use noise or a higher tone to hear the effect clearly.',
      'Front/back confusion — time and level are (nearly) symmetric front-to-back; without personal HRTF cues the brain guesses. The gentle rear darkening here is a hint, not a solution.',
      'Confusing binaural with stereo panning — pan pots change LEVEL only; binaural adds the TIME and SHADOW cues your ears actually use.',
      'Assuming this is an HRTF renderer — it is deliberately a simplified physics model (badged); measured-HRTF localization is sharper, especially outside the front arc.',
    ],
    proTips: [
      'Drag a pink-noise source in a slow circle with your eyes closed — notice the side positions snap hard while front/back stays vague. That boundary IS the limit of time/level cues.',
      'Park one source at −90° and A/B sine 250 Hz vs pink noise: the noise images sharply, the low sine barely moves — cue strength is frequency-dependent.',
    ],
    formula: 'ITD (Woodworth sphere) = (r/c)·(θ + sin θ), r ≈ 8.75 cm → max ≈ 0.66 ms. ILD grows with sin θ (to ~8 dB here) + head-shadow low-pass on the far ear. Distance: gain ∝ 1/d.',
  },

  // ─────────────────────────────── EXPANSION · Modular Synth Lab (2026-07-26) ──
  modular: {
    id: 'modular',
    num: 22,
    name: 'Modular Synth',
    tier: 'T2',
    tagline: 'Signal flow IS the instrument.',
    whatItIs:
      'The canonical subtractive voice: an oscillator (VCO) makes a bright wave, a filter ' +
      '(VCF) sculpts its harmonics, an amplifier (VCA) shapes its loudness — and the MOD ' +
      'sources (envelope, LFO, sequencer) automate those controls over time. Every classic ' +
      'synth sound is a ROUTING decision: what modulates what. The patch diagram in this lab ' +
      'is the actual signal flow of the audio you hear.',
    controls: [
      { key: 'display', name: 'What the display shows', definition: "The patch diagram is the signal path: VCO (pitch) → VCF (filter) → VCA (loudness) → OUT, with LFO / ENV / SEQ as modulators feeding in. Tap any box for what that module does; the cables show what drives what." },
      { key: 'vco', name: 'VCO (oscillator)', definition: 'The tone source: saw (every harmonic, 1/n), square (odd harmonics), triangle (odd, 1/n² — mellow), sine (fundamental only — nothing for the filter to remove!).' },
      { key: 'vcf', name: 'VCF (filter)', definition: 'A resonant low-pass: cutoff sets how many harmonics survive; resonance boosts right at the cutoff, giving the honk/squelch. Subtractive synthesis = start bright, carve away.', range: 'cutoff 60 Hz–14 kHz · resonance 0–1' },
      { key: 'envelope', name: 'ADSR envelope', definition: 'Attack·Decay·Sustain·Release — the loudness contour of each note (always on the VCA). Routed to the filter (env→cutoff) it makes each note open bright and close dark: the classic synth pluck.' },
      { key: 'lfo', name: 'LFO', definition: 'A low-frequency oscillator too slow to hear as a tone — it WIGGLES a destination instead: pitch = vibrato, cutoff = wah/wobble, amp = tremolo. One modulator, three different classic effects.', range: '0.05–30 Hz' },
      { key: 'sequencer', name: 'Step sequencer', definition: '8 steps of semitone offsets; each active step retunes the VCO and retriggers the envelope. A rest step releases. Rate sets the tempo — the melody is a control signal too.' },
      { key: 'vca', name: 'VCA (amplifier)', definition: 'The output amplifier — it sets the voice’s LOUDNESS over time. The envelope (ADSR) always drives it, so the VCA is what makes a note fade in and out.' },
      { key: 'out', name: 'Output', definition: 'The end of the voice: VCO → VCF → VCA → OUT. A gentle saturation stage here adds analog-style warmth and keeps peaks in check before the sound leaves.' },
      { key: 'patch_drone', name: 'Patch · Raw Drone', definition: 'The starting point: VCO → wide-open VCF → VCA, nothing modulating anything. An unshaped, steady tone — the blank canvas every other patch carves from by adding a routing.' },
      { key: 'patch_bass', name: 'Patch · Acid Bass', definition: 'Envelope → cutoff with a fast decay, driven by the sequencer: every note snaps open bright and slams shut. The signature “squelch” is the FILTER envelope, not the oscillator — proof that timbre is shaped after the VCO.' },
      { key: 'patch_wobble', name: 'Patch · Wobble', definition: 'LFO → cutoff: the filter sweeps rhythmically while the pitch holds still — movement without melody. The classic dubstep wobble is just one LFO on one destination.' },
      { key: 'patch_vibrato', name: 'Patch · Vibrato Lead', definition: 'LFO → pitch at low depth: a gentle, singing wobble in the note itself. It’s the SAME LFO as the wobble patch, only re-routed to pitch instead of cutoff — one modulator, a different destination.' },
      { key: 'patch_tremolo', name: 'Patch · Tremolo', definition: 'LFO → amp: the loudness pulses while pitch and tone stay put — the third classic LFO destination. Pitch → cutoff → amp are the three places one control signal can go.' },
    ],
    commonMistakes: [
      'Filtering a sine and hearing nothing change — the filter can only REMOVE harmonics; a sine has none above the fundamental. Subtractive synthesis needs a bright source.',
      'Confusing the VCA envelope with the filter envelope — one shapes LOUDNESS, the other BRIGHTNESS; the classic pluck needs env→cutoff, not just a fast amp decay.',
      'LFO destination mix-ups — the SAME LFO is vibrato on pitch, wobble on cutoff, tremolo on amp; if the effect sounds wrong, check the routing before the rate.',
      'LFO rate into audio range — past ~20 Hz modulation stops sounding like movement and starts creating sidebands (that’s FM territory, a different lab).',
      'Resonance masking the real cutoff — high resonance rings at the cutoff so hard it reads as "the sound"; set it to 0 first, place the cutoff, then add resonance.',
      'Sequencer without envelope retrigger — steps that only retune (no new envelope) smear into a glide; the per-step retrigger is what articulates notes.',
      'Ignoring gain staging into the output stage — a full-resonance peak drives the saturating output stage harder (audible grit); that is analog-style behavior, not a bug.',
    ],
    proTips: [
      'Build the classic bass in order: saw → cutoff ~800 Hz → resonance up → env→cutoff positive with fast decay → sequencer on. Listen after EACH patch step — that is the whole synthesis lesson.',
      'Set LFO depth to max and switch destinations pitch → cutoff → amp at the same rate: one control signal, three famous effects.',
    ],
    formula: 'Signal: VCO → VCF → VCA → out. Modulation: ADSR → VCA (always) and optionally → cutoff; LFO → pitch | cutoff | amp; SEQ → pitch + envelope retrigger. f(step) = f₀·2^(semis/12).',
  },

  // ──────────────────────── FOUNDATIONS · Foundations of Sound (2026-07-26) ──
  foundations: {
    id: 'foundations',
    num: 23,
    name: 'Foundations of Sound',
    tier: 'T1',
    tagline: 'Understand what you’re hearing.',
    whatItIs:
      'The prerequisite mental model: sound is moving air — molecules repeatedly compressing ' +
      'and spreading — pictured three ways at once (the speaker that makes it, the air that ' +
      'carries it, the graph engineers draw of it). Amplitude is the SIZE of the vibration; ' +
      'everything else in audio builds on this picture.',
    controls: [
      { key: 'air', name: 'Air particles', definition: 'What actually exists: molecules rocking back and forth around a home position. The pattern of squeezes travels; the air itself stays put.' },
      { key: 'pressure_graph', name: 'Pressure graph', definition: 'Pressure at one point plotted over time. It is a GRAPH — not the shape of the sound. Above the zero line = compression, below = rarefaction, zero = atmospheric.' },
      { key: 'speaker_cone', name: 'Speaker cone', definition: 'The source: electricity → motion → air. Forward strokes compress, backward strokes rarefy.' },
      { key: 'amplitude', name: 'Amplitude', definition: 'How FAR the vibration travels — bigger swings mean bigger pressure changes mean louder sound. Not the same thing as how FAST it vibrates (that is frequency).' },
      // Playground controls (each drives every view at once).
      { key: 'frequency', name: 'Frequency', definition: 'How FAST the air vibrates — cycles per second (Hz). More cycles = a higher pitch, and the compression bands sit closer together.', range: '55 Hz – 3.5 kHz' },
      { key: 'waveform', name: 'Waveform', definition: 'The SHAPE of one cycle. A sine is pure; square/saw/triangle add harmonics — extra sine waves stacked on top that change the timbre.' },
      { key: 'harmonics', name: 'Harmonic richness', definition: 'How many of those stacked overtones are kept. Fewer = purer/duller; all of them = the full bright character of the wave.' },
      { key: 'phase', name: 'Phase', definition: 'WHERE the wave is in its cycle. On one sound alone it’s inaudible — it only matters when two copies meet (that’s the Phase lab).' },
      { key: 'polarity', name: 'Polarity', definition: 'Flips the whole wave upside-down. Silent on its own; against a copy it cancels. A drawing change you can’t hear until two signals combine.' },
      { key: 'noise', name: 'Noise color', definition: 'Every frequency at once (no single pitch). White = equal per Hz; pink = −3 dB/oct; brown = −6 dB/oct — progressively darker.' },
      { key: 'sweep', name: 'Sweep', definition: 'Slides the frequency smoothly across the range so you HEAR pitch rise and SEE the spacing tighten as it climbs.' },
      { key: 'stereo_balance', name: 'Stereo balance', definition: 'Sends more of the sound to the left or right channel — where it sits between your ears (level only, not the 3-D cues of the Binaural lab).' },
      { key: 'delay', name: 'Delay', definition: 'Adds a spaced repeat of the sound — the simplest time effect. Longer = a distinct echo; short = it fuses with the original.' },
      { key: 'eq', name: 'EQ (low-pass)', definition: 'Removes frequencies above a cutoff, making the sound darker. The drawn spectrum shows exactly which harmonics get taken away.' },
      { key: 'filter_q', name: 'Filter Q', definition: 'How sharp the cutoff is. Higher Q rings and emphasizes right at the corner; lower Q rolls off gently.' },
      { key: 'readouts', name: 'Frequency · wavelength · period', definition: 'Three names for the same vibration. FREQUENCY = cycles per second (Hz, the pitch). PERIOD = seconds for one cycle = 1 ÷ frequency. WAVELENGTH = how far one cycle spans in air = speed of sound (343 m/s) ÷ frequency. Higher pitch → shorter period AND shorter wavelength.' },
      // Modules 5–13 (2026-07-29) — one key per bespoke display/control.
      { key: 'rate', name: 'Rate comparator (M5)', definition: 'Two identical sources that differ ONLY in vibration rate. Each orbit dial completes one lap per cycle — count laps to count cycles per second. Faster rate = higher pitch; the size of the motion (amplitude) is the same on both sides.' },
      { key: 'wavelength_room', name: 'Wavelength ruler (M6)', definition: 'The wave laid across a real 7 m room — the horizontal scale is true meters (ticks every 1 m). The amber bracket is exactly one wavelength, λ = 343 ÷ frequency: lower notes stretch it toward the whole room, higher notes shrink it toward centimeters.' },
      { key: 'domain_link', name: 'One wave, two questions (M7)', definition: 'THE ROOM (top) is a camera flash — pressure at EVERY point at one instant, ruler in meters; THE MIC’S OUTPUT (bottom) is pressure at the mic ONLY, drawn over time into the MIC INPUT on the NOW line, ruler in milliseconds. The PROBE’s two green dots are the SAME spot on the wave: what the mic drew moments ago now sits that far PAST it down the room — distance = speed × time ties the two rulers together.' },
      { key: 'octave_spiral', name: 'Octave spiral (M8)', definition: 'Frequency drawn the way hearing perceives it: one full turn = one octave = a DOUBLING in Hz. Drag around the spiral to glide pitch. Dots on the upward ray mark 110 · 220 · 440 · 880 Hz — equal musical steps are equal angles even though the Hz jumps grow.' },
      { key: 'loudness_curve', name: 'Ear-sensitivity curve (M9)', definition: 'A SIMPLIFIED illustration of the ear’s frequency response (inspired by equal-loudness contours — not measured data): most sensitive in the few-kHz speech region, much less sensitive at low frequencies. The dot rides the curve at your tone’s frequency: same amplitude ≠ same loudness.' },
      { key: 'phase_sum', name: 'Phase overlay & sum (M10)', definition: 'Two identical waves (gray + blue) at an adjustable phase offset, with their exact mathematical SUM drawn below in amber. At 0° they add to double; at 180° every push meets an equal pull and the sum flattens to silence. The audio demo uses two REAL tones — their audible slow beating is phase alignment cycling.' },
      { key: 'harmonic_stack', name: 'Harmonic stacker (M11)', definition: 'Six sine layers at whole-number multiples of 220 Hz (weights 1/n, like a sawtooth series). Toggle layers in and out — the drawn SUM and the REAL additive engine follow the same recipe. Pitch never moves; only the character (timbre) changes.' },
      { key: 'fourier_morph', name: 'Fourier unmix lens (M12)', definition: 'One complex wave pulled apart into its sine ingredients. The UNMIX slider morphs between the summed waveform and its separated components + spectrum “recipe card”. Analytic — computed from the model recipe; the RTA and Spectrogram do the measured version on live sound.' },
      { key: 'tool_map', name: 'Tool map (M13)', definition: 'Each card is one question the course raised, wired to the REAL measurement tool that answers it — live mic, real engine, honest units. SPL = how loud · Frequency Counter = what pitch · RTA = the recipe now · Spectrogram = the recipe over time · Waveform = pressure over time · RT60 = how long the room rings · Signal Generator = a known test source.' },
    ],
    commonMistakes: [
      'Thinking the wavy line IS the sound — the line is a graph of pressure vs time; nothing in the air is ever shaped like it.',
      'Thinking air travels from the speaker to your ear — each molecule only oscillates around its home; the PATTERN travels, the medium stays.',
      'Thinking sound is electricity — the electrical signal is an instruction to a speaker; sound only exists once air is moving.',
      'Confusing amplitude with frequency — amplitude is the SIZE of the vibration (loudness); frequency is its RATE (pitch). A cone moving farther is louder; moving faster is higher.',
      'Expecting to “see” real air motion — a 440 Hz cycle lasts ~2.3 ms; every animation of sound is a slowed conceptual model (ours says so on-screen).',
      'Treating transverse drawings as literal — sound in air is LONGITUDINAL: particles move along the direction of travel, not up and down.',
    ],
    proTips: [
      'Whenever a graph confuses you, translate it back to air: “what are the molecules doing right now?” If you can answer that, the graph is just bookkeeping.',
      'Watch the three windows and pick one moment: cone forward = dense particles = graph peak. If you can point to all three at once, the model has landed.',
    ],
    formula: 'v = f·λ (speed = frequency × wavelength, ~343 m/s in air). Pressure swings above/below atmospheric; amplitude sets their size, frequency their rate.',
  },

  // ───────────────── MIC & SPEAKER · Microphone Principles (2026-07-29) ──
  mic: {
    id: 'mic',
    num: 24,
    name: 'Microphone Principles',
    tier: 'T1',
    tagline: 'How microphones capture sound.',
    whatItIs:
      'A visual-first lab on microphone behavior: pickup patterns, distance and the room, ' +
      'proximity effect, off-axis response, plosives and wind, handling noise, stereo pairs, ' +
      'and — the star — what your HAND does to a handheld mic. Every display is an ' +
      'illustrative model drawn from the standard equations, never a measurement.',
    controls: [
      { key: 'capsule', name: 'Inside the capsule (generator)', definition: 'A dynamic mic is a tiny generator: sound moves a coil of wire through a magnetic gap, and motion becomes voltage — e = B·l·v. Output tracks the coil’s VELOCITY, not its position, so the voltage peaks as the coil moves fastest and REVERSES each half-cycle (watch the ⊗/⊙ current markers flip). Travel is exaggerated ~1,000× and the motion is a simplified model — a real cardioid is mass-controlled, with the diaphragm running ~180° behind the front pressure (stated on the drawing).' },
      { key: 'polar_pattern', name: 'Polar pattern viewer', definition: 'The pattern is the mic’s sensitivity map by direction — r(θ) = |A + B·cosθ| drawn exactly. Drag the green source around the mic and read its pickup; switch OMNI · CARDIOID · SUPER · HYPER · FIGURE-8 to move the nulls.' },
      { key: 'distance', name: 'Mic distance', definition: 'Slides the mic away from the source. Direct sound falls ~6 dB per doubling of distance while the room stays roughly constant — the direct-to-room ratio IS what “close” sounds like. Typical speech working distance: 4–12 inches.' },
      { key: 'proximity', name: 'Proximity effect', definition: 'Directional (pressure-gradient) mics grow a low shelf as you move in — from ~+1 dB at 12 in to ~+10 dB at 1 in (illustrative). Omnis are pure pressure mics: no ports, no gradient, no proximity effect. Radio warmth and mud both live here.' },
      { key: 'off_axis', name: 'Off-axis response', definition: 'Rotating the mic away from the source loses level (the polar equation) AND treble — the drawn curve adds a growing high-frequency rolloff with angle. Off-axis sound is duller, not just quieter.' },
      { key: 'pop_filter', name: 'Plosives & wind protection', definition: '“P” and “B” fire a jet of MOVING AIR at the diaphragm. The pop filter, foam, and shotgun windshield all do one thing: break up the airflow while the sound wave passes. The meter shows how much blast still reaches the capsule (conceptual).' },
      { key: 'shock_mount', name: 'Handling noise & isolation', definition: 'Vibration travels through solids — stand, boom, cable — into the capsule as low-frequency thumps. A shock mount is a soft spring between stand and mic: the shake stays in the stand. Compare RIGID vs SHOCK and watch how much motion reaches the body.' },
      { key: 'stereo_pair', name: 'Stereo techniques', definition: 'XY = coincident cardioids (level-only stereo, mono-safe). ORTF = 17 cm at 110° (level + time, wider). AB = spaced omnis (time-based, big but mono-risky). MID-SIDE = cardioid + figure-8 in one spot (width decided in the mix, fully mono-safe).' },
      { key: 'hand_position', name: 'Hand placement (cupping)', definition: 'Drag the hand up the mic. On the handle, the mic performs as designed. Near the grille, the ports start to block. Cupping collapses the cardioid toward OMNI, colors the response with peaks and dips, and erases the feedback-rejecting null — the classic stage mistake, drawn live in three synced panels.' },
      { key: 'cupping_why', name: 'Why cupping breaks it (cutaway)', definition: 'A cardioid is a pressure-GRADIENT design: sound reaches the diaphragm from the front and, through rear ports, from behind — timed so rear sound cancels. Cover the ports and only the front path remains: an omni with a resonant hand-cavity stuck on it.' },
      { key: 'mistakes', name: 'Common handheld mistakes', definition: 'The field guide: correct grip · holding the grille · cupping · pointing away from the mouth · working too far away · covering the switch · blocking a wireless transmitter antenna. One good habit each.' },
    ],
    commonMistakes: [
      'Cupping the grille for “tone” or volume — it collapses the pattern toward omni, invites feedback, and muddies the sound.',
      'Singing across or past the capsule — the most sensitive axis misses the mouth (off-axis = quieter AND duller).',
      'Blaming the mic for boomy vocals when it’s proximity effect — back off an inch or engage the high-pass.',
      'Expecting proximity bass from an omni — no gradient, no proximity effect.',
      'Skipping the pop filter in the studio — one hard “P” ruins an otherwise perfect take.',
      'Rigid-mounting a mic on a hollow stage — every footstep arrives as a low-frequency thump.',
      'Choosing a spaced pair (AB) for material that must fold to mono — time-based stereo combs when summed.',
      'Aiming a cardioid’s NULL carelessly — the null is a tool; point it at the monitor wedge, not the audience.',
    ],
    proTips: [
      'Live vocals: cardioid null at the wedge, grille a hand-width from the mouth, hand on the handle — that trio wins most feedback fights before the EQ does.',
      'Use proximity effect deliberately: close in for radio warmth on a thin voice, back off for clarity on a boomy one.',
    ],
    formula: 'Polar family: r(θ) = |A + B·cosθ| (omni 1+0 · cardioid .5+.5 · fig-8 0+1). Direct level ≈ −6 dB per doubling of distance; the room stays — their ratio is “closeness”.',
  },

  // ──────────────── MIC & SPEAKER · Speaker Placement & Coverage (2026-07-29) ──
  speaker: {
    id: 'speaker',
    num: 25,
    name: 'Speaker Placement & Coverage',
    tier: 'T1',
    tagline: 'How loudspeakers distribute sound.',
    whatItIs:
      'A visual-first lab on getting sound TO people: dispersion, aiming, mounting height, ' +
      'coverage overlap, hot spots, dead zones, front fills, and the delay-speaker concept. ' +
      'The coverage map is a conceptual teaching model (within-pattern × distance falloff in ' +
      'four color bands) — never an SPL prediction.',
    controls: [
      { key: 'top_view', name: 'Top view (what the display shows)', definition: 'The room from above: stage strip at top, audience below, colored per seat-area — GREEN ideal, YELLOW acceptable, RED excessive (hot spot/overlap), GRAY insufficient (dead zone). Conceptual model, not SPL.' },
      { key: 'position', name: 'Speaker position', definition: 'Slides the selected cabinet along the stage line. Position decides WHERE the pattern lands — center clusters cover evenly but can leave sides gray; left/right pairs cover wide but overlap in the middle.' },
      { key: 'aim', name: 'Aim', definition: 'Rotates the cabinet. The pattern is a beam: aim it at the seats, not the walls. A few degrees moves the whole green zone — aiming is free; extra speakers are not.' },
      { key: 'dispersion', name: 'Dispersion (H° × V°)', definition: 'The nominal wedge a cabinet controls — 60°×40° throws far and narrow, 120°×60° covers wide and close. Narrower patterns need more careful aim; wider ones fall off faster with distance.' },
      { key: 'second_speaker', name: 'Second speaker', definition: 'Adds the other main. Watch the middle: where both patterns land, the map turns RED — energy piles up, and in the real world the two arrivals comb. Real designs minimize or carefully control overlap.' },
      { key: 'front_fills', name: 'Front fills', definition: 'Small speakers on the stage lip covering the first rows that flown or raised mains pass over — they rescue the gray strip at the front without touching the rest of the map.' },
      { key: 'side_view', name: 'Side view (what the display shows)', definition: 'The room in profile: stage, speaker on its height, the vertical pattern as a wedge, and audience heads colored by whether the wedge reaches them. Raise + tilt until every head is green.' },
      { key: 'height_tilt', name: 'Height & down-tilt', definition: 'The core move of system design: aim the LOUD center of the vertical pattern at the FAR seats and let the pattern edge graze the near ones — distance and pattern cancel, front and back hear alike. That is why speakers fly.' },
      { key: 'room_shape', name: 'Room shape (stage · ceiling · depth · slope)', definition: 'Stage height changes where the speaker can sit; ceiling limits how high you can fly; audience depth decides whether one box can cover at all; sloped seating lifts the rear rows INTO the pattern — the room is half the design.' },
      { key: 'delay_speaker', name: 'Delay speaker (concept)', definition: 'A second cabinet deeper in the room covering the seats the mains cannot reach. Concept only here — in practice it is time-ALIGNED to the mains so both arrivals fuse into one sound (that alignment is the “delay”).' },
      { key: 'coverage_legend', name: 'Reading the coverage map', definition: 'GREEN = in the pattern at a workable level. YELLOW = pattern edge, getting quiet. RED = too much — point-blank seats or heavy overlap. GRAY = the pattern never arrives. The goal of every placement decision: maximum green, zero gray, minimum red.' },
    ],
    commonMistakes: [
      'Aiming speakers AT the room instead of AT the audience — walls don’t buy tickets; they only reflect.',
      'Mounting mains low “so people can hear them” — the front row gets blasted while the pattern skims heads and dies before the back.',
      'Ignoring overlap in the center — two mains both covering the middle seats comb and turn rough.',
      'Choosing wide-dispersion boxes for a deep room — width is not throw; the rear rows stay gray.',
      'Fixing a dead zone with the master fader — everywhere else gets louder first.',
      'Forgetting the first rows under flown mains — that gray strip is exactly what front fills exist for.',
      'Adding a rear speaker WITHOUT time alignment — two arrivals, one echo (the delay in “delay speaker” is the whole point).',
    ],
    proTips: [
      'Design order: pick dispersion for the room shape → set height/tilt for depth → aim → then fills and delays for whatever is still gray.',
      'Walk the room in the map: check the worst seat (far corner, front edge, under-balcony) — if those are green, the middle takes care of itself.',
    ],
    formula: 'Conceptual coverage: level ∝ (within-dispersion gain) × 1/dⁿ, classified GREEN/YELLOW/RED/GRAY. Direct level falls ~6 dB per doubling of distance — height + tilt equalize front-to-back by geometry.',
  },

  // ──────────────── ELECTRONICS · Vacuum Tube Fundamentals (2026-07-29) ──
  tube: {
    id: 'tube',
    num: 26,
    name: 'Vacuum Tube Fundamentals',
    tier: 'T1',
    tagline: 'How a tube amplifies by controlling electron flow.',
    whatItIs:
      'A visual-first lab on what actually happens inside a vacuum tube: the parts, the ' +
      'warm-up, the electron stream, and the control grid — a whisper of voltage gating a ' +
      'river of current, which IS amplification. Then bias, saturation, tube types, and why ' +
      'the classic bottles matter. The Electron View toggle connects the glowing glass on ' +
      'the outside to the invisible physics inside. Every drawing is a schematic illustrative ' +
      'model, never measured tube data.',
    controls: [
      { key: 'electron_view', name: 'Electron View toggle', definition: 'Two mental models of the SAME tube. PHYSICAL VIEW: what you can see — glass, metal electrodes, the filament glow. ⚡ ELECTRON VIEW: what you cannot — the blue space-charge cloud, the streaming electrons, and the grid’s repelling field. Flip it often; connecting the two views is the whole game.' },
      { key: 'cutaway', name: 'The cutaway (what the display shows)', definition: 'A schematic side cross-section, drawn as a pentode (the fullest version). From the center out: heater filament → cathode sleeve → control grid → screen grid → suppressor grid → plate — all sealed in a vacuum inside the glass. The chips below run in BUILD order: glass + vacuum, then heat → cathode → plate establish the current (a working diode), then each grid manages that flow. Tap a chip to REMOVE its part and watch what the electrons do without it — the readout names what broke and which part to add back next.' },
      { key: 'warm_up', name: 'Warm-up (electron flow)', definition: 'The slider walks the start-up story: the heater glows → the hot cathode BOILS OFF electrons (thermionic emission) → they loiter as an invisible cloud (space charge) → the positive plate pulls them across the vacuum → current flows. No heat, no electrons, no sound — that is why tube gear needs warm-up time.' },
      { key: 'grid_voltage', name: 'Grid voltage', definition: 'The heart of the lab. The control grid is a sparse wire spiral held slightly NEGATIVE: its field pushes electrons back toward the cathode. Make it more negative and the stream starves; less negative and the stream swells. A tiny voltage change controlling a large current is the definition of amplification.' },
      { key: 'amplification', name: 'Signal amplification (what the display shows)', definition: 'A small waveform wiggles the grid; the plate delivers a LARGE copy. Drawn ~×7 and INVERTED — the flip is real tube behavior: more input drives more current, which drags the plate voltage DOWN. Every tube preamp, guitar amp and compressor is this one picture repeated.' },
      { key: 'high_voltage', name: 'Supply voltage (B+)', definition: 'Compare a small supply against a proper high-voltage B+ rail. Weak plate voltage barely attracts the cloud — few, slow electrons and no headroom. Hundreds of volts pull a dense, fast stream with room for the signal to swing. It is also why tube chassis deserve respect: capacitors store that voltage after power-down.' },
      { key: 'tube_types', name: 'Tube types (triode · tetrode · pentode)', definition: 'One grid = TRIODE: simple and linear, but the plate’s field reaches back through the grid. Adding the SCREEN grid (tetrode) shields it for higher gain — but electrons knock SECONDARY electrons off the plate, which the screen steals. Adding the SUPPRESSOR grid (pentode) turns those strays back. Each grid fixes the last one’s problem.' },
      { key: 'bias', name: 'Bias', definition: 'The idle point — where the tube rests with no signal, set on the transfer curve. Too negative: the stream is already cut off and the bottom of the wave flatlines (CUTOFF). Correct: the whole swing rides the straight middle (LINEAR). Too positive: the top slams into the ceiling (SATURATION). “Biasing your amp” means parking this dot mid-curve.' },
      { key: 'saturation', name: 'Drive & saturation', definition: 'Push the signal past the straight region and the curve ROUNDS the peaks instead of chopping them — SOFT clipping. Rounding compresses the loudest moments (tube “give”) and adds harmonics related to the note, which the ear hears as warmth and grit rather than fizz. That gentle bend is most of what “tube sound” means.' },
      { key: 'tube_vs_transistor', name: 'Tube vs transistor', definition: 'Same job, different physics. Tube: electrons crossing a VACUUM, gated by a grid’s field, at hundreds of volts. Transistor: charge carriers crossing SEMICONDUCTOR junctions, gated by a tiny base current, at a few volts. The transistor won on size, cost and reliability; the tube survives wherever its soft overload IS the sound.' },
      { key: 'classic_tubes', name: 'Classic audio tubes', definition: 'Eight bottles cover most of audio history. Preamp (voltage) tubes: 12AX7 high gain, 12AU7 clean, 12AT7 in between. Power (current) tubes: EL34 British crunch, EL84 chime, 6L6GC American clean, KT88 and 6550 big clean power. Small bottles amplify voltage up front; big bottles move current into speakers.' },
    ],
    commonMistakes: [
      'Memorizing cathode/grid/plate as vocabulary without the picture — the lab exists because the parts only make sense as a path electrons travel.',
      'Thinking the grid physically blocks electrons like a shutter — it is a sparse spiral; its FIELD does the gating, not the wire.',
      'Expecting a tube amp to sound right the instant it is switched on — no warm-up, no emission, no current.',
      'Treating bias as tweaky folklore — it is just where the idle point sits on the curve, and mis-setting it kills one side of the wave first.',
      'Confusing tube saturation with hard clipping — the rounded shoulder (compression + related harmonics) is the opposite of a chopped-off square edge.',
      'Assuming “more voltage = louder” — B+ sets the attraction and the headroom; loudness is the signal swinging within it.',
      'Opening a tube amp chassis casually — filter capacitors hold hundreds of volts long after power-down.',
      'Arguing tube vs transistor as better/worse — they are different physics with different failure sounds; pick by the job.',
    ],
    proTips: [
      'Use the Electron View on the grid slider and watch the field arrows grow as the grid goes negative — once you SEE the field gating the stream, the rest of tube lore falls into place.',
      'Map the sections onto a real amp: preamp tubes (12AX7) live where the signal is small, power tubes (EL34/6L6) where it drives the speaker — same physics, different bottle size.',
    ],
    formula: 'Illustrative transfer curve: plate current ≈ (tanh(4.2·(V_grid − 0.52)) + 1)/2, normalized — cutoff floor, linear middle, saturation ceiling. Drawn gain ~×7, output inverted (real tube behavior).',
  },

  // ────────── DIGITAL AUDIO SAMPLING & CONVERSION LAB (2026-07-29) ──────────
  digital: {
    id: 'digital',
    num: 27,
    name: 'Digital Audio Sampling & Conversion',
    tier: 'T1',
    tagline: 'How analog sound becomes digital data — and digital data becomes sound again.',
    whatItIs:
      'A standalone laboratory tracing the complete chain: acoustic sound → microphone → analog ' +
      'voltage → anti-aliasing filter → sampling → quantization → binary data → processing → ' +
      'reconstruction → sound. Eight modules make the invisible visible WITHOUT the classic ' +
      'myths: digital audio is not stair steps, sample rate is not "smoothness", bit depth is ' +
      'not frequency response, and floating point does not un-clip a converter.',
    controls: [
      { key: 'source', name: 'Source signal', definition: 'The reference signal being converted — sine, square, triangle, saw, impulse, or noise. Everything downstream (samples, codes, spectra) is computed from this exact waveform.' },
      { key: 'waveform_view', name: 'Analog waveform view', definition: 'Three synchronized pictures of ONE event: air pressure at the source, the mic diaphragm riding it, and the continuous voltage leaving the preamp. The microphone creates a continuously varying voltage — no numbers exist yet.' },
      { key: 'sample_rate', name: 'Sample rate', definition: 'How many times per second the converter measures the voltage. 48 kHz = one measurement every 20.833 µs. It sets the audio BANDWIDTH available (up to Nyquist) — it does not set loudness resolution.' },
      { key: 'samples_per_cycle', name: 'Samples per cycle', definition: 'Sample rate ÷ signal frequency. A 1 kHz tone at 48 kHz gets 48 samples per cycle; at 3 samples per cycle the drawn dots look sparse but still describe the sine uniquely — until you pass 2.' },
      { key: 'nyquist', name: 'Nyquist frequency', definition: 'Half the sample rate — the highest frequency the sampled data can represent. Approach it and samples-per-cycle approaches 2; pass it and the samples describe a DIFFERENT, lower frequency (an alias).' },
      { key: 'aliasing', name: 'Aliasing', definition: 'When the input exceeds Nyquist, the sample points fit a lower-frequency sinusoid exactly — the alias, folded around Nyquist: f_alias = |f − nearest multiple of fs|. The lab plays the input AND the predicted alias so you hear the fold.' },
      { key: 'aa_filter', name: 'Anti-aliasing filter', definition: 'A low-pass BEFORE the sampler that removes content above Nyquist so it can never fold down. Off: aliases land in-band, permanently. On: highs near Nyquist are attenuated, and everything above is gone before measurement.' },
      { key: 'bit_depth', name: 'Bit depth', definition: 'How many binary digits store each measurement: N bits = 2ᴺ levels (16-bit = 65,536). It sets amplitude resolution and theoretical dynamic range (≈ 6.02·N + 1.76 dB) — it has nothing to do with frequency response.' },
      { key: 'quant_levels', name: 'Quantization levels', definition: 'The horizontal rungs the sampled voltage must round to. At 3 bits (8 levels) the rounding is visible and audible; at 24 bits (16.7 million) the steps are far below any analog noise floor.' },
      { key: 'quant_error', name: 'Quantization error', definition: 'Original sample value − stored value: the small rounding residue. ERROR-ONLY view isolates it. With healthy signals it behaves like noise; with tiny undithered signals it becomes correlated distortion — the reason dither exists.' },
      { key: 'dither', name: 'Dither', definition: 'A controlled trace of noise added before reducing bit depth. It LINEARIZES quantization: the correlated error becomes a benign noise floor, and low-level detail survives statistically over time — at the cost of that small added noise. It is not "extra resolution" magic.' },
      { key: 'noise_shaping', name: 'Noise shaping', definition: 'Dither\'s companion: pushes the added noise energy toward frequencies where hearing is least sensitive, buying audibly quieter results at the same bit depth. Applied at final fixed-point output — not repeatedly.' },
      { key: 'binary_sample', name: 'Sample inspector', definition: 'One stored sample, every way at once: decimal, binary, hex, normalized amplitude, % of full scale and dBFS. Sample 24,001 = 12,486 = 0011000011000110 = +0.381 = −8.4 dBFS — same number, five costumes.' },
      { key: 'bit_toggle', name: 'Bit toggling', definition: 'Flip any bit and watch the value move: the MSB carries half the full scale (and the sign in two\'s complement), the LSB carries one quantization step. Bit significance made physical.' },
      { key: 'twos_complement', name: 'Two\'s complement', definition: 'How signed PCM stores negatives: the top bit carries negative weight. It gives one extra negative code (−32,768 vs +32,767 at 16-bit) and makes binary arithmetic seamless across zero.' },
      { key: 'adc_chain', name: 'ADC signal flow', definition: 'Mic → preamp → analog gain → anti-aliasing filter → sample-and-hold → quantizer → encoder → PCM stream. Tap any block for its job, its failure modes, and what those failures sound like.' },
      { key: 'sample_hold', name: 'Sample-and-hold', definition: 'The converter freezes the instantaneous voltage long enough to measure it. A converter operation — NOT what the final analog output of a DAC looks like.' },
      { key: 'gain_staging', name: 'Gain staging into the ADC', definition: 'Set analog gain BEFORE conversion. Too low: the signal lives near the analog noise. Right: healthy SNR with safe peaks. Too high: clipping — flattened peaks whose information is gone forever. Analog overload and digital full-scale are tracked separately because they happen at different points.' },
      { key: 'float_vs_int', name: 'Integer vs floating point', definition: 'Fixed-point integers have a hard ceiling at full scale. Floating point (sign · exponent · mantissa) has an enormous internal range — great for mixing headroom — but it cannot restore anything clipped BEFORE it, and it must come back to a fixed range at the output.' },
      { key: 'gain_above_zero', name: 'Above 0 dBFS in float', definition: 'Push a mix over 0 dBFS inside a float path, then trim it down before output: intact. Render the same over-zero signal straight to fixed point: clipped. The modern DAW lesson in one exercise.' },
      { key: 'reconstruction', name: 'Reconstruction', definition: 'The DAC + reconstruction filter turn stored values into a CONTINUOUS analog waveform via band-limited interpolation — not stair steps, not straight lines between dots. The samples uniquely describe one band-limited signal; the filter produces it.' },
      { key: 'zoh', name: 'Zero-order hold', definition: 'The stepped intermediate voltage a DAC element produces before filtering. A real stage in the chain and a useful model — but calling it "what digital audio looks like" is the myth this lab exists to kill.' },
      { key: 'spectral_images', name: 'Spectral images', definition: 'Sampling creates copies of the audio spectrum around every multiple of the sample rate. The reconstruction filter\'s whole job is removing those images so only the baseband remains.' },
      { key: 'oversampling', name: 'Oversampling', definition: 'Running the converter at a multiple of the base rate pushes the spectral images far from the audio band, so a gentle, well-behaved analog filter finishes the job. It relaxes the filter — it does not add information beyond the original band.' },
      { key: 'isp', name: 'Inter-sample peaks', definition: 'Two samples can sit below 0 dBFS while the reconstructed waveform between them rises ABOVE it. Sample meters say "no clip"; the DAC or a downstream encoder can still overload. This is why true-peak meters oversample.' },
      { key: 'jitter', name: 'Clock & jitter', definition: 'Jitter is timing deviation of the sampling instants — not value rounding. Its audibility depends on magnitude, spectrum, signal content and converter design; buffered/reclocked playback can remove it entirely. Beware sweeping cable-audiophile claims.' },
      { key: 'data_rate', name: 'Data rate & storage', definition: 'Rate = sample rate × bit depth × channels. 48 kHz × 24-bit × 2 = 2.304 Mbit/s ≈ 17.3 MB/min. The full calculator (with storage planning) lives in the Calculator Laboratory.' },
      { key: 'myths', name: 'Myth vs reality', definition: 'The permanent misconception panel: stair steps, "more samples = smoother", bit depth vs frequency, 144 dB from 24 bits, float un-clipping recordings, hot-to-0 dBFS recording. Each myth paired with what is actually true.' },
    ],
    commonMistakes: [
      'Believing DAC output is a staircase — sample values describe a band-limited signal; the reconstruction filter outputs a continuous waveform.',
      'Thinking higher sample rates make waveforms "smoother" — reconstruction is band-limited interpolation, not connect-the-dots; more rate buys BANDWIDTH, not smoothness.',
      'Assigning frequency response to bit depth or loudness resolution to sample rate — time and amplitude are separate axes with separate settings.',
      'Expecting 144 dB of usable range from every 24-bit recording — analog noise, clocking and converter linearity set the real (ENOB) limit well below theory.',
      'Recording as hot as possible "for resolution" — modern converters have headroom to spare; clipped peaks are unrecoverable, quiet ones are fine.',
      'Converting a clipped file to 32-bit float to repair it — float cannot restore information destroyed before or during conversion.',
      'Applying dither after every operation, or never — it belongs at the final fixed-point bit-depth reduction.',
      'Treating every clock/cable swap as audible — jitter matters when it is large, in-band, and uncorrected; buffering and reclocking exist.',
    ],
    proTips: [
      'Anchor everything to two numbers: samples per cycle (fs ÷ f) for time, and levels (2ᴺ) for amplitude — every myth in this lab dies against one of those two.',
      'Track with peaks around −18 to −10 dBFS: converter noise is far below you, and no transient ever reaches the cliff.',
    ],
    formula: 'Nyquist = fs/2 · alias = |f − n·fs| (nearest n) · levels = 2ᴺ · DR ≈ 6.02·N + 1.76 dB (theoretical) · data rate = fs × N × channels.',
  },

  // ─────────────── WAVE PHYSICS LABORATORY (Pillar C, 2026-07-29) ───────────
  wave: {
    id: 'wave',
    num: 28,
    name: 'Wave Physics Laboratory',
    tier: 'T2',
    tagline: 'One room engine — reflection, interference, modes, coverage, alignment.',
    whatItIs:
      'Spatial acoustics, live: place sources and a listener in a room, change walls and ' +
      'materials, and watch wavefronts, interference fields, reflections, standing waves, ' +
      'coverage and delay alignment evolve. All fifteen modules are presets of ONE Room ' +
      'Builder engine — geometric image-source math plus analytic wave superposition, drawn ' +
      'honestly as illustrative models (the real-time pressure-field simulation is a future ' +
      'native release).',
    controls: [
      { key: 'room_builder', name: 'Room Builder', definition: 'The engine itself: a room in meters, wall materials, sources you drag, a listener you place. Every module preconfigures this same scene — nothing here is a special case.' },
      { key: 'layers', name: 'Visual layers', definition: 'PRESSURE = animated wavefronts from every source (and its wall reflections). HEAT = the steady interference field as an SPL color map. RAYS = image-source reflection paths. ARRIVALS = when each copy of the sound reaches the listener. Same physics, four instruments.' },
      { key: 'arrivals', name: 'Arrivals', definition: 'The ARRIVALS layer marks WHEN each copy of the sound reaches the listener — the direct sound first, then each reflection, spaced by its extra path length ÷ the speed of sound. Reading the gaps between arrivals is how you predict echoes, comb notches and the room’s early-reflection pattern.' },
      { key: 'reflection', name: 'Reflection', definition: 'Angle in = angle out — measured from the surface NORMAL, not the surface. Each bounce loses energy to the material (√(1−α) in pressure). The reflected path behaves exactly like a mirror-image source behind the wall — a modeling trick, not a real second source.' },
      { key: 'image_source', name: 'Image source', definition: 'Mirror the source across a wall and the reflection becomes a straight line from the image. It predicts path length, arrival time and level in one construction — and it is why moving a wall moves a comb notch.' },
      { key: 'absorption', name: 'Absorption', definition: 'Each material converts part of every reflection to heat — α from 0 (mirror) to 1 (open window). α is FREQUENCY-DEPENDENT: porous materials eat highs and pass lows, which is why bass needs thickness, depth or tuned traps.' },
      { key: 'materials', name: 'Wall materials', definition: 'Concrete, glass, drywall, curtains, carpet, foam, fiberglass, wood, audience — textbook teaching α tables (NOT ISO 354 product data). Swap a wall and watch RT and the reflections change together.' },
      { key: 'diffusion', name: 'Diffusion', definition: 'A diffuser SCATTERS a reflection in many directions instead of one — energy is preserved, not removed (that is absorption\'s job). Depth sets the lowest frequency it can scatter.' },
      { key: 'diffusion_depth', name: 'Diffuser depth', definition: 'How deep the diffuser’s wells are, in meters — the ONE control that sets its lowest scattered frequency: roughly c ÷ (2 × depth). Deeper wells scatter lower notes; below that limit the surface behaves like a plain flat wall and reflects one specular ray. Depth changes the reach, never the amount of energy returned.' },
      { key: 'refraction', name: 'Refraction', definition: 'Temperature gradients bend sound: warm-over-cold (evening inversion) curves it back DOWN — why sound carries at night and over water; cold-over-warm curves it up and away. Wind shear adds the upwind/downwind asymmetry.' },
      { key: 'diffraction', name: 'Diffraction', definition: 'Waves bend around obstacles comparable to their wavelength: a wall shadows the highs but 80 Hz (λ ≈ 4.3 m) wraps right around. The shadow zone is attenuation — mostly of highs — never silence. (Maekawa knife-edge model.)' },
      { key: 'interference', name: 'Interference', definition: 'Two sources: where path lengths differ by whole wavelengths they ADD (+6 dB coherent); by half-wavelengths they CANCEL. Nulls and lobes are position-AND-frequency specific — move the listener and the map changes.' },
      { key: 'comb', name: 'Comb filtering', definition: 'Direct sound + one delayed reflection = notches at (2k+1)/2Δt. It is a GEOMETRY problem, not a tone problem: EQ cannot fix it, but moving the mic six inches can.' },
      { key: 'standing_wave', name: 'Standing waves', definition: 'At mode frequencies the room\'s reflections stack into a stationary pressure pattern: pressure maxima at walls/corners, nulls partway across. Axial (2 walls), tangential (4), oblique (6) — dimension-driven, dominating below the Schroeder frequency.' },
      { key: 'coverage_pattern', name: 'Coverage & directivity', definition: 'A loudspeaker\'s pattern NARROWS as frequency rises — lows spill everywhere, highs beam. Aim the HF pattern at the audience, not the cabinet at the room.' },
      { key: 'line_array', name: 'Line array', definition: 'Stacked boxes couple into one tall source: length ≥ wavelength gives vertical control (beaming highs, coupling lows); per-box splay shapes coverage — wrong splay tears holes or fires lobes.' },
      { key: 'delay_align', name: 'Delay alignment', definition: 'Sub and main arriving at different times carve a null through the crossover. Delay one until the wavefronts land together and the null becomes +6 dB — align in TIME, and check more than one seat.' },
      { key: 'cardioid_sub', name: 'Cardioid subwoofer', definition: 'Two subs, spacing + delay + polarity chosen so their outputs cancel BEHIND and add IN FRONT. Get the delay wrong and the null flips to the audience side. One sub alone can never do this.' },
      { key: 'beam_steer', name: 'Beam steering', definition: 'Progressive DSP delays across an array tilt its wavefront — the beam moves, the boxes don\'t. Steer too far and grating lobes spray energy where you didn\'t ask.' },
      { key: 'echo', name: 'Echo vs reflection', definition: 'A reflection arriving within ~50 ms fuses with the direct sound (precedence/Haas); later and louder, it reads as a discrete ECHO. Distance decides: a wall 10 m away returns at ~58 ms — audible slap.' },
      { key: 'reverb_field', name: 'Reverberant field', definition: 'Direct → first reflections → early reflections → dense late tail: reverberation is a BUILDUP, not a single thing. Early reflections carry spatial cues; the diffuse tail carries "the room". RT60 describes the tail\'s decay, not everything.' },
    ],
    commonMistakes: [
      'Measuring reflection angles from the surface instead of the normal.',
      'Thinking absorption and diffusion do the same job — one removes energy, the other redistributes it.',
      'Trying to EQ away comb filtering or a modal null — both are geometry, fix position/timing.',
      'Expecting a barrier to block bass — long wavelengths diffract around anything smaller than themselves.',
      'Believing two sources always sum +6 dB everywhere — only where they arrive in phase.',
      'Aligning a sub by tape measure alone — processing latency is invisible to the tape.',
      'Treating the image source as a real loudspeaker rather than a construction that predicts reflections.',
      'Expecting room modes to matter at 5 kHz — they dominate below the Schroeder frequency.',
    ],
    proTips: [
      'Toggle HEAT and PRESSURE on the same scene: the still heat map is the time-average of the moving wavefronts — connecting those two views IS understanding interference.',
      'In every module, move the LISTENER before touching any other control — position is the cheapest, most powerful acoustic tool there is.',
    ],
    formula: 'Image source: reflection = straight path from the mirrored source. Field: p = Σ (g/r)·e^{i(kr+ωt₀)}. Modes: f = (c/2)·√((n/L)² + (m/W)²). Maekawa: ≈10·log(3+20N), N = 2δ/λ. Sabine: RT60 = 0.161·V/A.',
  },

  // ────────────── VISUAL AUDIO ANALYSIS LAB (Meter Interpretation, 2026-07-29) ──
  meter: {
    id: 'meter',
    num: 29,
    name: 'Visual Audio Analysis',
    tier: 'T1',
    tagline: 'How to READ professional meters — not just open them.',
    whatItIs:
      'Every experienced engineer reads displays the way musicians read notation — but almost ' +
      'nobody is taught how. Eleven modules build that visual pattern recognition: waveforms, ' +
      'peak meters, the classic VU needle, LUFS loudness, spectrum shapes, spectrograms, the ' +
      'waterfall, phase and stereo displays, the oscilloscope — ending with the Signal ' +
      'Detective, where you diagnose problems from the picture alone. Displays run on ' +
      'synthesized teaching signals (badged); the Academy\'s measurement tools then show you the ' +
      'same pictures on real sound.',
    controls: [
      { key: 'waveform_read', name: 'Reading a waveform', definition: 'Height = amplitude, symmetry = polarity balance, flat tops = clipping, flat line = silence, sharp spikes = transients. One glance tells you level, dynamics and damage before you press play.' },
      { key: 'dc_offset', name: 'DC offset', definition: 'The whole waveform riding above or below the center line — a constant voltage that steals headroom and thumps on edits. The picture: silence that isn\'t drawn AT zero.' },
      { key: 'transients', name: 'Transients', definition: 'The tall, thin spikes at the start of drum hits and plucks — huge peak, almost no average energy. They are why peak meters and your ears disagree.' },
      { key: 'clipping_view', name: 'Clipping on the waveform', definition: 'Peaks sliced flat at full scale. Analog clipping rounds; digital clipping shears. Once the top of the wave is gone, no fader brings it back.' },
      { key: 'dynamic_range_view', name: 'Dynamic range in the picture', definition: 'The distance between the loudest peaks and the quiet detail. A healthy take breathes; an over-compressed one is a solid brick of ink.' },
      { key: 'peak_meter', name: 'Peak meter', definition: 'Tracks the instantaneous maximum, sample by sample — the "will it clip?" meter. It says nothing about loudness: a snare crack and a sine at the same peak read identically here and sound wildly different.' },
      { key: 'peak_hold', name: 'Peak hold & OVER lamp', definition: 'The floating bar that lingers at the highest recent peak, and the latch that trips at full scale. Hold lets you mix without staring; the OVER lamp is the tattletale that something already hit the ceiling.' },
      { key: 'vu_meter', name: 'The classic VU', definition: 'A mechanical needle with ~300 ms of inertia — it physically CANNOT reach a transient before it\'s over. That "flaw" is the feature: it ignores peaks and reads average level, which tracks perceived loudness. 0 VU = nominal operating level, not clipping.' },
      { key: 'ballistics', name: 'Meter ballistics', definition: 'How fast a meter attacks and releases. Peak meters: microseconds up, slow fall for readability. VU: ~300 ms both ways. Loudness meters: defined windows (400 ms / 3 s). Same signal, three different stories — by design.' },
      { key: 'rms_vs_peak', name: 'Peak vs RMS (crest factor)', definition: 'A snare peaks at −6 dBFS with an RMS near −30: crest factor ~24 dB. A sustained organ peaks at −6 with RMS −9: crest 3 dB. Same peak, ~20 dB apart in loudness — the single most important metering lesson.' },
      { key: 'lufs', name: 'LUFS', definition: 'Loudness Units relative to Full Scale — a perception-weighted average (K-weighted) that broadcast and streaming platforms use to match program loudness. Unlike dBFS, two programs at the same LUFS should FEEL equally loud.' },
      { key: 'integrated', name: 'Integrated loudness', definition: 'One number for the whole program — gated so silence doesn\'t drag it down. Streaming targets (e.g. −14 LUFS) and broadcast specs (−23/−24) are integrated values.' },
      { key: 'short_momentary', name: 'Momentary & short-term', definition: 'Momentary = 400 ms window (what\'s loud RIGHT NOW); short-term = 3 s (the current section). Watch momentary dance while integrated barely moves — different windows, different questions.' },
      { key: 'lra', name: 'Loudness Range (LRA)', definition: 'The statistical spread between the program\'s soft and loud sections (in LU). A movie might span 20+; a pop master 4–6. It quantifies "how dynamic is this program" — not how loud.' },
      { key: 'true_peak_meter', name: 'True peak (dBTP)', definition: 'The reconstructed analog waveform can rise ABOVE the highest sample between samples. True-peak meters oversample to catch it — why platforms ask for −1 dBTP ceilings, and why "no clipped samples" isn\'t "no clipping".' },
      { key: 'spectrum_read', name: 'Reading a spectrum', definition: 'Left = lows, right = highs, height = energy. Ask three things: where is the energy centered, is the shape smooth or spiky, and is anything sticking up that shouldn\'t be?' },
      { key: 'spectral_patterns', name: 'Spectrum patterns', definition: 'Speech = formant humps 200 Hz–3 kHz. Kick = LF mound + click bump. Cymbal = dense HF wash. Hum = needle spikes at exact mains harmonics. Feedback = ONE towering narrow spike. Pink noise = smooth −3 dB/octave ramp. Learn seven shapes and you can read most sessions.' },
      { key: 'spectrogram_axes', name: 'Spectrogram axes', definition: 'Time runs HORIZONTAL, frequency VERTICAL, level is COLOR. It is a spectrum filmed over time — the most misread display in audio because people try to read it like a waveform.' },
      { key: 'spectrogram_patterns', name: 'Spectrogram patterns', definition: 'Speech = stacked formant bands with pitch striations. Birdsong = rising/falling thin chirps. Cymbal = bright HF wash fading right. Feedback = one horizontal line getting brighter. Whistle = a single thin steady line. White noise = uniform confetti.' },
      { key: 'waterfall_axes', name: 'Waterfall axes (CSD)', definition: 'Frequency across, level up, TIME receding into the picture: each ridge slice is the spectrum a moment later. The front edge is "now"; the mountain range behind is history decaying.' },
      { key: 'waterfall_decay', name: 'Reading decay', definition: 'A healthy room/speaker collapses evenly — the whole range settles together. Anything still standing tall while its neighbors are gone is RINGING: a room mode, a resonant driver, a high-Q filter.' },
      { key: 'room_ring', name: 'Room resonances in the waterfall', definition: 'One frequency\'s ridge stretches far back while everything nearby has died: that frequency is ringing — the room (or cabinet) stores and releases energy there. EQ can tame its level; only treatment/damping shortens its decay.' },
      { key: 'damping', name: 'Damping materials', definition: 'Slide concrete → curtains → carpet → panels and watch the mountain\'s tail shorten — highs first (porous absorption), lows last (they need thickness). The waterfall shows what the RT60 number only summarizes.' },
      { key: 'eq_ridge', name: 'EQ in the waterfall', definition: 'Boost 250 Hz and its mountain grows TALLER — but decay stays the same length: EQ changes level, not ring time. A high-Q boost adds a narrow ridge that also RINGS — the filter itself stores energy. That is why surgical boosts can sound "resonant".' },
      { key: 'reverb_tails', name: 'Reverb tails compared', definition: 'Room = short, warm slope. Plate = long, bright, even sheet. Hall = long with lows outlasting highs. Spring = narrow bouncy ridges. You can identify the reverb type from the waterfall before you ever hear it.' },
      { key: 'phase_meter', name: 'Correlation meter', definition: '+1 = identical channels (mono), 0 = unrelated (wide), −1 = opposite polarity (cancellation in mono). Healthy stereo lives between ~+0.3 and +1. Sitting near −1 means the mono bus — and many phones — will eat your mix.' },
      { key: 'goniometer', name: 'Goniometer / vectorscope', definition: 'The dot cloud: a vertical line = mono, a fat ball = wide, a HORIZONTAL line = pure anti-phase. Lean left/right = channel imbalance. It\'s the correlation meter with a picture attached.' },
      { key: 'stereo_width', name: 'Stereo width displays', definition: 'Mono, narrow, wide, hard-L/R and mid-side are POSITIONS of energy, not qualities. Mid = what both speakers share; Side = what they disagree about. Width is the M/S ratio made visible.' },
      { key: 'oscilloscope', name: 'Oscilloscope', definition: 'Voltage vs time, the rawest view: sine = smooth wave, square = shelves, saw = ramps, speech = bursts. If the scope shows flat-topping, clipping is happening RIGHT THERE, whatever the meters claim.' },
      { key: 'lissajous', name: 'X-Y / Lissajous', definition: 'Left channel drives X, right drives Y: identical channels draw a 45° line, anti-phase draws the opposite diagonal, stereo draws a cloud, and pure tones at related frequencies draw the classic curves. Instant phase literacy.' },
      { key: 'detective', name: 'Signal Detective', definition: 'The graduation exercise: an unlabeled display with a problem in it. Name the meter, read the story, spot the fault, prescribe the processor. Wrong guesses teach as much as right ones — every answer explains WHY.' },
    ],
    commonMistakes: [
      'Mixing by peak meters and wondering why loudness is wrong — peaks protect converters; averages track ears.',
      'Expecting a VU needle to show a snare hit — 300 ms of inertia is the point, not a defect.',
      'Reading a spectrogram left-to-right as "low-to-high" — time is horizontal; frequency is vertical.',
      'Treating "no clipped samples" as "no clipping" — true peaks live between the samples.',
      'EQ-cutting a ringing frequency and expecting the DECAY to shorten — level and ring time are different axes (the waterfall shows both).',
      'Ignoring the correlation meter until the mono PA/phone playback collapses the mix.',
      'Chasing streaming loudness with limiting alone — integrated LUFS responds to the whole program, not the ceiling.',
      'Reading meters without knowing their ballistics — the same signal reads differently on purpose.',
    ],
    proTips: [
      'Learn the seven spectrum shapes (speech/kick/cymbal/guitar/hum/feedback/pink) until naming them is reflex — that reflex IS what experienced engineers call "seeing the problem".',
      'On any new display, find the three axes first (what\'s across, what\'s up, what\'s color/depth) — every meter confusion in audio is an axis confusion.',
    ],
    formula: 'Crest factor = peak dB − RMS dB · VU ≈ 300 ms average · momentary/short-term = 400 ms / 3 s windows · correlation = Σlr/√(Σl²·Σr²) · waterfall slice(f,t) = spectrum(f) − 60·t/RT60(f).',
  },
};

/** Lab lessons in spec order (1..16) — for menus/indexes. */
export const LAB_LESSON_LIST: LabLesson[] = Object.values(LAB_LESSONS).sort((a, b) => a.num - b.num);

/** Look up a lab lesson by id. */
export function getLabLesson(id: LabId): LabLesson {
  return LAB_LESSONS[id];
}

/** Look up a single control lesson within a lab (undefined if not authored). */
export function getControlLesson(id: LabId, controlKey: string) {
  return LAB_LESSONS[id].controls.find((c) => c.key === controlKey);
}
