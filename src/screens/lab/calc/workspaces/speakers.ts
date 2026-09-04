/**
 * Workspaces: Speakers & Amplification — SPL/power feasibility · impedance
 * combinations · speaker-cable loss · constant-voltage (70 V / 100 V) lines.
 * Follows the wave.ts exemplar (owner spec 2026-07-29).
 */
import type { Workspace } from '../calcTypes';
import { fmt, fmtInt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const arr = (v: number | number[]) => (typeof v === 'number' ? [v] : v);

/* ------------------------------------------------------------------ */
/* 1 · Loudspeaker SPL & Amplifier Power                              */
/* ------------------------------------------------------------------ */

const WS_SPEAKERPOWER: Workspace = {
  id: 'speakerpower',
  name: 'Loudspeaker SPL & Amplifier Power',
  tagline: 'Sensitivity · power · distance · headroom → will it be loud enough?',
  section: 'speakers',
  reportPrefix: 'SPL',
  intro:
    'The feasibility math of loudness: a speaker’s sensitivity rating, the power you feed it, ' +
    'and the distance to the listener predict SPL — or, run backwards, tell you how much ' +
    'amplifier a target level actually demands. Pick the direction you need.',
  whyItMatters:
    'Every doubling of amplifier power buys only +3 dB, and every doubling of distance costs ' +
    '−6 dB. Doing this arithmetic BEFORE the gig tells you whether a rig can hit the target ' +
    'level with headroom to spare — or whether no amplifier on earth will save an insensitive ' +
    'box at the back of the room.',
  example:
    'A 97 dB (1W/1m) box, target 105 dB SPL at 10 m with 6 dB of headroom. Distance costs ' +
    '20·log10(10) = 20 dB, so the speaker must produce 105 + 20 + 6 = 131 dB referenced to 1 m. ' +
    'That is 131 − 97 = 34 dB above 1 W: P = 10^(34/10) ≈ 2500 W. One box cannot do that — ' +
    'which is exactly the answer this workspace exists to give you before load-in, not after.',
  mistakes: [
    'Buying double the amplifier power expecting double the loudness — 2× power is +3 dB, a just-noticeable step; "twice as loud" needs roughly +10 dB (10× power).',
    'Ignoring power compression: voice coils heat up and real boxes give back 2–4 dB less than the cold-spec math at full tilt.',
    'Quoting the 1 m sensitivity spec at FOH distance — a 97 dB/W/m box is doing 71 dB at 20 m on 1 watt.',
    'Treating the multi-speaker +10·log10(N) bonus as guaranteed — it assumes uncorrelated sources; coupled/arrayed boxes behave differently.',
  ],
  warnings:
    'Sensitivity specs vary in method — 2.83 V vs 1 W (identical only into 8 Ω), half-space vs ' +
    'free-field — so two "97 dB" boxes may not match. Power compression eats 2–4 dB at full ' +
    'output and is not modeled. This is inverse-square feasibility math (IEC 60268-4 governs the ' +
    'formal measurements), not an array or room prediction.',
  glossary: ['Sensitivity', 'Headroom', 'Inverse square law', 'Power', 'Sound pressure level'],
  fields: [
    {
      key: 'sens',
      name: 'SENSITIVITY',
      quantity: 'sensitivity',
      placeholder: '97',
      help: 'SPL the speaker produces at 1 m from 1 W input (per its spec sheet).',
      warn: { test: (x) => x < 80 || x > 115, msg: 'Typical passive boxes rate 84–102 dB (1W/1m) — check the spec sheet.' },
    },
    {
      key: 'power',
      name: 'AMPLIFIER POWER',
      quantity: 'power',
      placeholder: '500',
      help: 'Continuous power delivered to the speaker (not peak marketing watts).',
    },
    {
      key: 'dist',
      name: 'LISTENING DISTANCE',
      quantity: 'length',
      placeholder: '10',
      help: 'Speaker to listener. Sensitivity is referenced to 1 m, so distance loss is 20·log10(d/1).',
      warn: { test: (x) => x < 1, msg: 'Inside 1 m the point-source model (and the 1 m reference) breaks down.' },
    },
    {
      key: 'target',
      name: 'TARGET SPL',
      quantity: 'spl',
      placeholder: '105',
      help: 'The continuous level you need AT the listener, before headroom.',
    },
    {
      key: 'headroom',
      name: 'HEADROOM',
      quantity: 'db',
      placeholder: '6',
      help: 'Extra dB kept in reserve for peaks — subtracted from prediction, added to demand.',
    },
    {
      key: 'nspk',
      name: 'NUMBER OF SPEAKERS',
      quantity: 'number',
      placeholder: '1',
      help: 'Identical boxes covering the same listener. Bonus assumes UNCORRELATED sources.',
      warn: { test: (x) => x < 1 || !Number.isInteger(x), msg: 'Enter a whole number of speakers, 1 or more.' },
    },
  ],
  functions: [
    {
      key: 'predictspl',
      name: 'Predicted SPL at the listener',
      inputs: ['sens', 'power', 'dist', 'headroom', 'nspk'],
      formula: 'SPL = sens + 10·log10(P) − 20·log10(d) − headroom',
      plainFormula:
        'The predicted SPL equals the speaker’s sensitivity, plus ten times the base-ten log of the power, minus twenty times the base-ten log of the distance, minus the headroom.',
      explain:
        'The feasibility math of loudness: from a speaker’s 1 W / 1 m sensitivity, the power fed to it, and the listening distance, it predicts the level at the listener. Every doubling of power adds only 3 dB; every doubling of distance costs 6 dB. Extra boxes add 10·log of their count, assuming uncorrelated sources.',
      keySymbols: ['·', 'log₁₀', '−'],
      note: 'Free-field inverse-square model; rooms add reverberant support this does not count.',
      primaryResultLabel: 'PREDICTED SPL (one speaker, after headroom)',
      compute: (v) => {
        const sens = n(v.sens);
        const p = n(v.power);
        const d = n(v.dist);
        const hr = n(v.headroom);
        const N = Math.max(1, Math.floor(n(v.nspk)));
        const one = sens + 10 * Math.log10(p) - 20 * Math.log10(d) - hr;
        const out = [
          { label: 'PREDICTED SPL (one speaker, after headroom)', value: one, quantity: 'spl' as const },
          { label: 'SPL AT 1 m (before distance loss)', value: sens + 10 * Math.log10(p) - hr, quantity: 'spl' as const, chainable: false },
        ];
        if (N > 1) {
          out.push({
            label: `WITH ${N} SPEAKERS (multiple uncorrelated sources, +10·log10(N))`,
            value: one + 10 * Math.log10(N),
            quantity: 'spl' as const,
          });
        }
        return out;
      },
      steps: (v) => {
        const sens = n(v.sens);
        const p = n(v.power);
        const d = n(v.dist);
        const hr = n(v.headroom);
        const N = Math.max(1, Math.floor(n(v.nspk)));
        const gain = 10 * Math.log10(p);
        const loss = 20 * Math.log10(d);
        const one = sens + gain - loss - hr;
        const s = [
          `Power gain over 1 W: 10·log10(${fmt(p)}) = ${fmt(gain)} dB.`,
          `Distance loss from the 1 m reference: 20·log10(${fmt(d)}) = ${fmt(loss)} dB.`,
          `SPL = ${fmt(sens)} + ${fmt(gain)} − ${fmt(loss)} − ${fmt(hr)} (headroom) = ${fmt(one)} dB SPL.`,
        ];
        if (N > 1) {
          s.push(
            `${N} uncorrelated sources add 10·log10(${N}) = ${fmt(10 * Math.log10(N))} dB → ${fmt(one + 10 * Math.log10(N))} dB SPL. Real arrays couple and steer — treat this as an upper-hand estimate.`
          );
        }
        return s;
      },
    },
    {
      key: 'reqpower',
      name: 'Required amplifier power for a target SPL (reverse)',
      inputs: ['sens', 'target', 'dist', 'headroom', 'nspk'],
      formula: 'P = 10^((target + 20·log10(d) − sens + headroom) / 10)',
      plainFormula:
        'The required power equals ten raised to the quantity: target SPL plus twenty times the log of distance, minus sensitivity, plus headroom, all divided by ten.',
      explain:
        'Runs the SPL prediction backwards: how much amplifier power a target level actually demands at a given distance. One speaker carries the whole target; with several uncorrelated boxes the demand splits. It exposes when no single amplifier can save an insensitive box at the back of the room.',
      keySymbols: ['x²', '·', 'log₁₀', '−', '/'],
      note: 'Solves the SPL prediction backwards for power — one speaker carries the whole target; with N speakers the demand is split.',
      compute: (v) => {
        const sens = n(v.sens);
        const t = n(v.target);
        const d = n(v.dist);
        const hr = n(v.headroom);
        const N = Math.max(1, Math.floor(n(v.nspk)));
        const dBover = t + 20 * Math.log10(d) - sens + hr;
        const p = Math.pow(10, dBover / 10);
        const out = [
          { label: 'REQUIRED POWER (one speaker)', value: p, quantity: 'power' as const },
          { label: 'dB ABOVE THE 1 W REFERENCE', value: dBover, quantity: 'db' as const, chainable: false },
        ];
        if (N > 1) {
          out.push({
            label: `POWER PER SPEAKER (${N} uncorrelated speakers sharing the target)`,
            value: p / N,
            quantity: 'power' as const,
          });
        }
        return out;
      },
      steps: (v) => {
        const sens = n(v.sens);
        const t = n(v.target);
        const d = n(v.dist);
        const hr = n(v.headroom);
        const N = Math.max(1, Math.floor(n(v.nspk)));
        const loss = 20 * Math.log10(d);
        const dBover = t + loss - sens + hr;
        const p = Math.pow(10, dBover / 10);
        const s = [
          `Distance loss: 20·log10(${fmt(d)}) = ${fmt(loss)} dB, so the box must make ${fmt(t)} + ${fmt(loss)} = ${fmt(t + loss)} dB at 1 m.`,
          `Add ${fmt(hr)} dB headroom and subtract sensitivity: ${fmt(t + loss)} + ${fmt(hr)} − ${fmt(sens)} = ${fmt(dBover)} dB above the 1 W reference.`,
          `P = 10^(${fmt(dBover)}/10) = ${fmt(p)} W.`,
        ];
        if (N > 1) {
          s.push(`Split across ${N} uncorrelated speakers: ${fmt(p)} ÷ ${N} = ${fmt(p / N)} W each.`);
        }
        return s;
      },
    },
    {
      key: 'maxspl',
      name: 'Maximum SPL from a given amplifier',
      inputs: ['sens', 'power', 'dist'],
      formula: 'SPLmax = sens + 10·log10(P) − 20·log10(d)',
      plainFormula:
        'The maximum SPL equals the sensitivity, plus ten times the log of the power, minus twenty times the log of the distance.',
      explain:
        'The loudest a given amplifier and speaker can reach at a distance — the same prediction with no headroom reserve. It is a cold-spec ceiling: real drivers give back 2–4 dB to power compression as the voice coils heat at full output.',
      keySymbols: ['·', 'log₁₀', '−'],
      note: 'Cold-spec ceiling — real drivers lose 2–4 dB to power compression before reaching it.',
      compute: (v) => {
        const sens = n(v.sens);
        const p = n(v.power);
        const d = n(v.dist);
        const max = sens + 10 * Math.log10(p) - 20 * Math.log10(d);
        return [
          { label: 'MAX SPL AT THE LISTENER', value: max, quantity: 'spl' },
          { label: 'MAX SPL AT 1 m', value: sens + 10 * Math.log10(p), quantity: 'spl', chainable: false },
          {
            label: 'REALITY CHECK',
            text: `Expect roughly ${Math.round(max - 4)}–${Math.round(max - 2)} dB SPL sustained once power compression (2–4 dB) sets in.`,
          },
        ];
      },
      steps: (v) => {
        const sens = n(v.sens);
        const p = n(v.power);
        const d = n(v.dist);
        return [
          `At 1 m: ${fmt(sens)} + 10·log10(${fmt(p)}) = ${fmt(sens + 10 * Math.log10(p))} dB SPL.`,
          `At ${fmt(d)} m: subtract 20·log10(${fmt(d)}) = ${fmt(20 * Math.log10(d))} dB → ${fmt(sens + 10 * Math.log10(p) - 20 * Math.log10(d))} dB SPL, ceiling before compression.`,
        ];
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 2 · Speaker Impedance Combinations                                 */
/* ------------------------------------------------------------------ */

const WS_IMPEDANCE: Workspace = {
  id: 'impedance',
  name: 'Speaker Impedance Combinations',
  tagline: 'Parallel · series · series-parallel — what load does the amp see?',
  section: 'speakers',
  intro:
    'Wire speakers together and the amplifier sees ONE combined load. Parallel wiring lowers ' +
    'impedance (more current demanded), series raises it (less power delivered). This workspace ' +
    'combines the NOMINAL values and flags loads an amplifier will not like.',
  whyItMatters:
    'An amplifier rated to 4 Ω that gets shown 2.7 Ω of paralleled boxes will run hot, ' +
    'current-limit, or shut down mid-show. And when mismatched boxes share an amp, the LOWER ' +
    'impedance takes MORE of the power — the level balance is decided by the wiring before you ' +
    'touch a fader.',
  example:
    'Two 8 Ω boxes in parallel: 1/(1/8 + 1/8) = 4 Ω — fine on most amps. Add a third 8 Ω box ' +
    'and the load drops to 2.67 Ω, below a typical 4 Ω rating. Mix a 4 Ω and an 8 Ω box in ' +
    'parallel instead: Ztot = 2.67 Ω AND the 4 Ω box takes two-thirds of the power — louder by ' +
    '3 dB with no fader involved.',
  mistakes: [
    'Paralleling boxes until the amplifier current-limits — every added parallel speaker LOWERS the load; check the amp’s minimum-impedance rating first.',
    'Mixing 4 Ω and 8 Ω boxes expecting equal power share — parallel branches share the same voltage, so the 4 Ω box draws double the power of the 8 Ω box.',
    'Wiring speakers in series "for safety" — the raised impedance also puts the speakers’ own impedance between the amp and each driver, degrading damping and letting one failed voice coil silence the whole string.',
  ],
  warnings:
    'Nominal impedance is a label, not a measurement — a real "8 Ω" box swings with frequency ' +
    'and may dip near 5 Ω at some frequencies. These results combine NOMINAL values; the ' +
    'amplifier lives with the dips.',
  glossary: ['Impedance', 'Parallel circuit', 'Series circuit', 'Damping Factor', 'Nominal impedance'],
  fields: [
    {
      key: 'zlist',
      name: 'SPEAKER IMPEDANCES',
      quantity: 'list',
      placeholder: '8, 8, 4',
      help: 'Nominal impedance of each speaker in ohms, comma-separated (e.g. "8, 8, 4").',
    },
    {
      key: 'z4',
      name: 'FOUR IMPEDANCES (2×2)',
      quantity: 'list',
      placeholder: '8, 8, 8, 8',
      help: 'Exactly four values: speakers 1+2 form one parallel pair, 3+4 the other; the pairs go in series.',
    },
  ],
  functions: [
    {
      key: 'parallel',
      name: 'Parallel combination',
      inputs: ['zlist'],
      formula: 'Ztot = 1 / Σ(1/Zi)',
      plainFormula:
        'The total parallel impedance equals one divided by the sum of the reciprocals of each speaker’s impedance.',
      explain:
        'Wiring speakers in parallel lowers the load the amplifier sees — always below the lowest single box — so it demands more current. All branches share the amp’s voltage, so the lowest-impedance speaker draws the biggest power share. Below about 4 Ω many amplifiers run hot or current-limit.',
      keySymbols: ['/', 'Σ', 'Z', 'x₁'],
      note: 'Parallel branches all see the amplifier’s full voltage — lower impedances draw a bigger power share.',
      compute: (v) => {
        const zs = arr(v.zlist).filter((z) => z > 0);
        if (zs.length < 1) return [{ label: 'INPUT', text: 'Enter at least one impedance (e.g. "8, 8").' }];
        const ztot = 1 / zs.reduce((s, z) => s + 1 / z, 0);
        const shares = zs.map((z) => (ztot / z) * 100);
        const out: ReturnType<Workspace['functions'][number]['compute']> = [
          { label: 'TOTAL PARALLEL IMPEDANCE', value: ztot, quantity: 'impedance' },
          {
            label: 'POWER SHARE PER SPEAKER',
            text: zs.map((z, i) => `${fmt(z)} Ω → ${fmt(shares[i] ?? 0, 3)}%`).join(' · '),
          },
        ];
        if (ztot < 3) {
          out.push({
            label: 'AMPLIFIER LOAD WARNING',
            text: `Ztot = ${fmt(ztot)} Ω is below most amplifiers’ 4 Ω rating — check the amp before wiring this.`,
          });
        }
        return out;
      },
      steps: (v) => {
        const zs = arr(v.zlist).filter((z) => z > 0);
        if (zs.length < 1) return ['Enter at least one impedance to combine.'];
        const inv = zs.reduce((s, z) => s + 1 / z, 0);
        return [
          `Sum the reciprocals: ${zs.map((z) => `1/${fmt(z)}`).join(' + ')} = ${fmt(inv)} S.`,
          `Ztot = 1 ÷ ${fmt(inv)} = ${fmt(1 / inv)} Ω — always lower than the lowest branch.`,
          `All branches share the amp’s voltage, so each speaker’s power share is Ztot/Zi — the lowest impedance takes the biggest slice.`,
        ];
      },
    },
    {
      key: 'series',
      name: 'Series combination',
      inputs: ['zlist'],
      formula: 'Ztot = ΣZi',
      plainFormula: 'The total series impedance equals the sum of each speaker’s impedance.',
      explain:
        'Wiring speakers in series raises the load — always above the highest single box — so the amplifier delivers less total power. The same current flows through every speaker, so one open voice coil silences the whole string, and the raised impedance degrades the amp’s damping of each driver.',
      keySymbols: ['Σ', 'Z', 'x₁'],
      note: 'Series speakers share the amplifier’s current; the amp delivers LESS total power into the raised load.',
      compute: (v) => {
        const zs = arr(v.zlist).filter((z) => z > 0);
        if (zs.length < 1) return [{ label: 'INPUT', text: 'Enter at least one impedance (e.g. "8, 8").' }];
        const ztot = zs.reduce((s, z) => s + z, 0);
        return [
          { label: 'TOTAL SERIES IMPEDANCE', value: ztot, quantity: 'impedance' },
          {
            label: 'NOTE',
            text: 'In series the same current flows through every speaker — power divides in proportion to each impedance, and one open voice coil silences the whole string.',
          },
        ];
      },
      steps: (v) => {
        const zs = arr(v.zlist).filter((z) => z > 0);
        if (zs.length < 1) return ['Enter at least one impedance to combine.'];
        return [`Ztot = ${zs.map((z) => fmt(z)).join(' + ')} = ${fmt(zs.reduce((s, z) => s + z, 0))} Ω — always higher than the highest single speaker.`];
      },
    },
    {
      key: 'seriesparallel',
      name: 'Series-parallel 2×2 (four speakers)',
      inputs: ['z4'],
      formula: 'Ztot = (Z1∥Z2) + (Z3∥Z4)',
      plainFormula:
        'The total impedance equals speaker one in parallel with speaker two, plus speaker three in parallel with speaker four.',
      explain:
        'The classic four-speaker wiring: two parallel pairs placed in series. Four 8-ohm boxes land back at 8 ohms — a load-friendly way to run four speakers off one amplifier. Each parallel pair halves, and the two pairs in series add back up.',
      keySymbols: ['∥', 'Z', 'x₁'],
      note: 'The classic four-speaker wiring: two parallel pairs placed in series — four 8 Ω boxes land back at 8 Ω.',
      compute: (v) => {
        const zs = arr(v.z4).filter((z) => z > 0);
        if (zs.length !== 4) {
          return [{ label: 'INPUT', text: `This wiring needs exactly FOUR impedances (you entered ${zs.length}). Example: "8, 8, 8, 8".` }];
        }
        const [z1, z2, z3, z4] = zs as [number, number, number, number];
        const pairA = (z1 * z2) / (z1 + z2);
        const pairB = (z3 * z4) / (z3 + z4);
        const ztot = pairA + pairB;
        const out: ReturnType<Workspace['functions'][number]['compute']> = [
          { label: 'TOTAL IMPEDANCE', value: ztot, quantity: 'impedance' },
          { label: 'PAIR A (Z1 ∥ Z2)', value: pairA, quantity: 'impedance', chainable: false },
          { label: 'PAIR B (Z3 ∥ Z4)', value: pairB, quantity: 'impedance', chainable: false },
        ];
        if (ztot < 3) {
          out.push({
            label: 'AMPLIFIER LOAD WARNING',
            text: `Ztot = ${fmt(ztot)} Ω is below most amplifiers’ 4 Ω rating — check the amp before wiring this.`,
          });
        }
        return out;
      },
      steps: (v) => {
        const zs = arr(v.z4).filter((z) => z > 0);
        if (zs.length !== 4) return ['Enter exactly four impedances — speakers 1+2 make one parallel pair, 3+4 the other.'];
        const [z1, z2, z3, z4] = zs as [number, number, number, number];
        const pairA = (z1 * z2) / (z1 + z2);
        const pairB = (z3 * z4) / (z3 + z4);
        return [
          `Pair A: ${fmt(z1)} Ω ∥ ${fmt(z2)} Ω = (${fmt(z1)}×${fmt(z2)}) ÷ (${fmt(z1)}+${fmt(z2)}) = ${fmt(pairA)} Ω.`,
          `Pair B: ${fmt(z3)} Ω ∥ ${fmt(z4)} Ω = ${fmt(pairB)} Ω.`,
          `The two pairs sit in series: Ztot = ${fmt(pairA)} + ${fmt(pairB)} = ${fmt(pairA + pairB)} Ω.`,
        ];
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 3 · Speaker Cable Loss                                             */
/* ------------------------------------------------------------------ */

/**
 * Copper resistance per meter of a SINGLE conductor, by AWG (Ω/m at ~20 °C).
 * Only these gauges are supported; entered gauges are rounded to the nearest
 * listed one in compute (no interpolation — real cable comes in these sizes).
 */
const AWG_OHM_PER_M: Record<number, number> = {
  10: 0.00328,
  12: 0.00521,
  14: 0.00829,
  16: 0.01318,
  18: 0.02095,
};
const AWG_LIST = [10, 12, 14, 16, 18];

const nearestAwg = (g: number): number =>
  AWG_LIST.reduce((best, a) => (Math.abs(a - g) < Math.abs(best - g) ? a : best), 10);

const WS_CABLE: Workspace = {
  id: 'cable',
  name: 'Speaker Cable Loss',
  tagline: 'Gauge · length · impedance → dB lost and watts burned in the wire',
  section: 'speakers',
  intro:
    'Speaker cable is a resistor in series with the speaker. The longer and thinner it is, the ' +
    'more level and damping it steals. This workspace turns gauge and length into dB, watts, ' +
    'and a maximum run — before you buy the drum of wire.',
  whyItMatters:
    'The loss is invisible until you do the math: a long thin run can quietly burn 10% of the ' +
    'amplifier’s power warming copper, shave nearly a dB off the top, and cap the system ' +
    'damping factor — the amp’s grip on the woofer — at a number the amplifier spec never ' +
    'promised you.',
  example:
    '30 m of 16 AWG into an 8 Ω box: loop resistance = 2 × 30 × 0.01318 = 0.79 Ω. Level loss = ' +
    '20·log10(8 / 8.79) ≈ −0.83 dB, and about 9% of the amplifier’s power is dissipated in ' +
    'the cable. The cable alone limits system damping factor to about 8/0.79 ≈ 10 — no matter ' +
    'how stiff the amplifier is.',
  mistakes: [
    'Judging a cable by the thickness of its insulation — only the copper cross-section (gauge) sets the resistance.',
    'Using instrument (guitar) cable for speakers — its thin conductor wastes power and its shield adds nothing; speaker runs need heavy unshielded pairs.',
    'Thinking a gauge number halved means resistance halved — AWG is logarithmic: −3 gauge numbers ≈ half the resistance (12 AWG is ~half of 15, not of 24).',
  ],
  warnings:
    'Copper values are for a single conductor at ~20 °C; resistance rises ~0.4%/°C. Connector ' +
    'and terminal resistance is not modeled. Entered gauges are rounded to the nearest listed ' +
    'size (10, 12, 14, 16, 18 AWG) — real cable comes in these sizes, so no interpolation.',
  glossary: ['Damping Factor', 'Impedance', 'Resistance', 'AWG'],
  fields: [
    {
      key: 'len',
      name: 'CABLE LENGTH (one-way)',
      quantity: 'length',
      placeholder: '30',
      help: 'Amp to speaker, one direction — the round trip (×2) is applied for you.',
    },
    {
      key: 'awg',
      name: 'WIRE GAUGE',
      quantity: 'number',
      placeholder: '16',
      help: '10–18 AWG typical. Smaller number = thicker wire. Rounded to the nearest listed gauge.',
      warn: { test: (x) => x < 10 || x > 18, msg: 'Only 10–18 AWG is tabulated — the entry will be rounded into that range.' },
    },
    {
      key: 'z',
      name: 'LOAD IMPEDANCE',
      quantity: 'impedance',
      placeholder: '8',
      help: 'Nominal impedance of the speaker (or combined load) at the far end.',
    },
    {
      key: 'pamp',
      name: 'AMPLIFIER POWER',
      quantity: 'power',
      placeholder: '500',
      help: 'Power the amplifier delivers into the total (cable + speaker) load.',
    },
    {
      key: 'maxloss',
      name: 'MAX ACCEPTABLE LOSS',
      quantity: 'db',
      placeholder: '0.5',
      help: 'Your loss budget — 0.5 dB is the common install target.',
    },
  ],
  functions: [
    {
      key: 'loss',
      name: 'Loss from a given gauge and length',
      inputs: ['len', 'awg', 'z', 'pamp'],
      formula: 'Rloop = 2·L·R/m · loss = 20·log10(Z/(Z+Rloop))',
      plainFormula:
        'The loop resistance equals two times the length times the resistance per metre; the level loss is twenty times the log of the load impedance divided by the load plus the loop resistance.',
      explain:
        'Speaker cable is a resistor in series with the speaker, and the current travels out and back (hence ×2). This turns gauge and length into the level lost, the share of amplifier power burned heating copper, and the ceiling it puts on system damping factor — the amp’s grip on the woofer.',
      keySymbols: ['·', 'R', '/', 'log₁₀', 'Z'],
      compute: (v) => {
        const L = n(v.len);
        const g = nearestAwg(n(v.awg));
        const rpm = AWG_OHM_PER_M[g] ?? NaN;
        const z = n(v.z);
        const p = n(v.pamp);
        const rloop = 2 * L * rpm;
        const frac = z / (z + rloop);
        const lossDb = 20 * Math.log10(frac);
        const lostPct = (1 - frac) * 100;
        return [
          { label: `LOOP RESISTANCE (${g} AWG)`, value: rloop, quantity: 'impedance' },
          { label: 'LEVEL LOSS', value: lossDb, quantity: 'db' },
          { label: 'POWER LOST IN THE CABLE', value: lostPct, quantity: 'percent', chainable: false },
          { label: 'WATTS HEATING THE CABLE', value: (p * lostPct) / 100, quantity: 'power', chainable: false },
          {
            label: 'DAMPING-FACTOR CEILING',
            text: `The cable alone limits system damping factor to ~${fmt(z / rloop, 3)} — regardless of the amplifier’s rating.`,
          },
        ];
      },
      steps: (v) => {
        const L = n(v.len);
        const gIn = n(v.awg);
        const g = nearestAwg(gIn);
        const rpm = AWG_OHM_PER_M[g] ?? NaN;
        const z = n(v.z);
        const rloop = 2 * L * rpm;
        const frac = z / (z + rloop);
        const s: string[] = [];
        if (g !== Math.round(gIn)) s.push(`Gauge rounded to the nearest listed size: ${fmt(gIn)} → ${g} AWG.`);
        s.push(
          `Current travels out AND back: Rloop = 2 × ${fmt(L)} m × ${rpm} Ω/m = ${fmt(rloop)} Ω.`,
          `The speaker gets Z/(Z+Rloop) = ${fmt(z)}/${fmt(z + rloop)} = ${fmt(frac)} of the voltage → 20·log10(${fmt(frac)}) = ${fmt(20 * Math.log10(frac))} dB.`,
          `Power lost = 1 − ${fmt(frac)} = ${fmt((1 - frac) * 100, 3)}% of the amplifier’s output, spent heating copper.`
        );
        return s;
      },
    },
    {
      key: 'maxlen',
      name: 'Maximum cable length for a loss budget (reverse)',
      inputs: ['awg', 'z', 'maxloss'],
      formula: 'Rloop_max = Z·(10^(loss/20) − 1) · Lmax = Rloop_max / (2·R/m)',
      plainFormula:
        'The maximum loop resistance equals the impedance times (ten raised to the loss over twenty, minus one); the maximum length is that resistance divided by twice the resistance per metre.',
      explain:
        'The level-loss formula solved backwards for length: the longest one-way cable run of a given gauge that stays within your loss budget. A thicker gauge (lower AWG number) or a higher load impedance both allow a longer run.',
      keySymbols: ['Z', '·', 'x²', '/', '−', 'R'],
      note: 'The level-loss formula solved backwards for length.',
      compute: (v) => {
        const g = nearestAwg(n(v.awg));
        const rpm = AWG_OHM_PER_M[g] ?? NaN;
        const z = n(v.z);
        const dB = Math.abs(n(v.maxloss));
        const rloopMax = z * (Math.pow(10, dB / 20) - 1);
        const lmax = rloopMax / (2 * rpm);
        return [
          { label: `MAX ONE-WAY LENGTH (${g} AWG)`, value: lmax, quantity: 'length' },
          { label: 'LOOP RESISTANCE AT THE LIMIT', value: rloopMax, quantity: 'impedance', chainable: false },
        ];
      },
      steps: (v) => {
        const g = nearestAwg(n(v.awg));
        const rpm = AWG_OHM_PER_M[g] ?? NaN;
        const z = n(v.z);
        const dB = Math.abs(n(v.maxloss));
        const rloopMax = z * (Math.pow(10, dB / 20) - 1);
        return [
          `Loss of ${fmt(dB)} dB means the divider ratio (Z+Rloop)/Z = 10^(${fmt(dB)}/20) = ${fmt(Math.pow(10, dB / 20))}.`,
          `Invert for the resistance: Rloop_max = ${fmt(z)} × (10^(${fmt(dB)}/20) − 1) = ${fmt(rloopMax)} Ω.`,
          `Length: Lmax = ${fmt(rloopMax)} ÷ (2 × ${rpm} Ω/m) = ${fmt(rloopMax / (2 * rpm))} m one-way for ${g} AWG.`,
        ];
      },
    },
    {
      key: 'recgauge',
      name: 'Recommended gauge for a run (reverse)',
      inputs: ['len', 'z', 'maxloss'],
      formula: 'smallest listed gauge with 20·log10(Z/(Z+2·L·R/m)) within budget',
      plainFormula:
        'The recommended gauge is the thinnest listed wire whose level loss — twenty times the log of the load over the load plus the loop resistance — stays within the budget.',
      explain:
        'Scans the standard cable gauges and recommends the thinnest (highest AWG number) that keeps the run within your loss budget. Thicker always works; it just costs more copper. If even the heaviest listed gauge fails, the run is too long — shorten it, relax the budget, or switch to a 70 V line.',
      keySymbols: ['·', 'log₁₀', 'Z', '/', 'R'],
      compute: (v) => {
        const L = n(v.len);
        const z = n(v.z);
        const dB = Math.abs(n(v.maxloss));
        const passing = AWG_LIST.filter((g) => {
          const rloop = 2 * L * (AWG_OHM_PER_M[g] ?? NaN);
          return -20 * Math.log10(z / (z + rloop)) <= dB;
        });
        // Highest AWG number = thinnest wire that still passes.
        const rec = passing.length ? Math.max(...passing) : undefined;
        if (rec === undefined) {
          return [
            {
              label: 'NO LISTED GAUGE PASSES',
              text: `Even 10 AWG exceeds the ${fmt(dB)} dB budget over ${fmt(L)} m into ${fmt(z)} Ω — shorten the run, raise the budget, or use a 70 V line.`,
            },
          ];
        }
        const rloop = 2 * L * (AWG_OHM_PER_M[rec] ?? NaN);
        return [
          { label: 'RECOMMENDED GAUGE', text: `${rec} AWG — the thinnest listed gauge meeting the ${fmt(dB)} dB budget.` },
          { label: 'ITS LOSS ON THIS RUN', value: 20 * Math.log10(z / (z + rloop)), quantity: 'db' },
        ];
      },
      table: (v) => {
        const L = n(v.len);
        const z = n(v.z);
        const dB = Math.abs(n(v.maxloss));
        return {
          title: `All listed gauges over ${fmt(L)} m into ${fmt(z)} Ω (budget ${fmt(dB)} dB)`,
          cols: ['AWG', 'Loop Ω', 'Loss dB', 'Power lost', 'Verdict'],
          rows: AWG_LIST.map((g) => {
            const rloop = 2 * L * (AWG_OHM_PER_M[g] ?? NaN);
            const frac = z / (z + rloop);
            const loss = -20 * Math.log10(frac);
            return [
              String(g),
              fmt(rloop, 3),
              fmt(loss, 3),
              `${((1 - frac) * 100).toFixed(1)}%`,
              loss <= dB ? 'PASS' : 'FAIL',
            ];
          }),
        };
      },
      steps: (v) => {
        const L = n(v.len);
        const z = n(v.z);
        return [
          `For each listed gauge: Rloop = 2 × ${fmt(L)} m × (Ω/m), then loss = 20·log10(${fmt(z)}/(${fmt(z)}+Rloop)).`,
          'The table marks each gauge PASS or FAIL against your budget; the recommendation is the thinnest (highest AWG number) that passes — thicker always works, it just costs more copper.',
        ];
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 4 · Constant-Voltage (70 V / 100 V) Systems                        */
/* ------------------------------------------------------------------ */

const WS_CV70: Workspace = {
  id: 'cv70',
  name: 'Constant-Voltage (70 V / 100 V) Systems',
  tagline: 'Tap settings · line load · amp capacity for distributed speakers',
  section: 'speakers',
  intro:
    'Distributed systems (ceiling speakers, paging, background music) run a high-voltage line ' +
    'and give each speaker a transformer with TAP settings in watts. Budgeting is simple ' +
    'addition: sum the taps, keep headroom, and never exceed the amplifier.',
  whyItMatters:
    'Constant-voltage lines exist to make long multi-speaker runs practical — high voltage means ' +
    'low current, so thin cable and dozens of speakers per line work. But the amplifier’s ' +
    'wattage is a hard budget: overload the line and the whole zone distorts or trips, not just ' +
    'one speaker.',
  example:
    '12 ceiling speakers tapped at 10 W each on a 250 W / 70 V amplifier: load = 120 W. With a ' +
    '2 dB headroom factor the recommended amp is ≥ 120 × 10^(2/10) ≈ 190 W — the 250 W amp ' +
    'passes with 130 W (52%) to spare, line current ≈ 120/70.7 ≈ 1.7 A, and 13 more 10 W ' +
    'speakers could join before the amp is fully allocated.',
  mistakes: [
    'Loading an amplifier to 100% of its rating — distributed amps want ~20–25% held in reserve for transformer losses, line loss, and program peaks.',
    'Summing speaker RATINGS instead of TAP settings — a "32 W" ceiling speaker tapped at 5 W puts 5 W on the line, not 32.',
    'Running long 8 Ω low-impedance lines where a 70 V system belongs — the cable loss math (see Speaker Cable Loss) turns brutal past ~20–30 m.',
  ],
  warnings:
    'Keep roughly 20–25% headroom on distributed lines. Transformer insertion loss (~0.5–1 dB ' +
    'per speaker) is NOT modeled here — it makes real levels slightly lower than the tap math. ' +
    'Low-frequency content below a step-down transformer’s rated band can saturate it: ' +
    'high-pass distributed lines around 70–100 Hz unless the transformers are rated lower.',
  glossary: ['constant-voltage (70V / 100V) distribution', '70-volt system', 'Headroom', 'Transformer tap', 'Impedance'],
  fields: [
    {
      key: 'vline',
      name: 'LINE VOLTAGE',
      quantity: 'voltage',
      placeholder: '70.7',
      help: '70.7, 100, or 25. US systems are 70.7 V ("70 V"); 100 V is common internationally.',
      warn: {
        test: (x) => ![25, 70, 70.7, 100].some((s) => Math.abs(x - s) < 0.5),
        msg: 'Unusual line voltage — constant-voltage systems are normally 25, 70.7, or 100 V.',
      },
    },
    {
      key: 'taps',
      name: 'TAP SETTINGS',
      quantity: 'list',
      placeholder: '10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10',
      help: 'Every speaker’s selected tap wattage, comma-separated — the TAP, not the speaker’s power rating.',
    },
    {
      key: 'prated',
      name: 'AMPLIFIER RATED POWER',
      quantity: 'power',
      placeholder: '250',
      help: 'The distributed amplifier’s rated output at this line voltage.',
    },
    {
      key: 'hr',
      name: 'HEADROOM',
      quantity: 'db',
      placeholder: '2',
      help: 'Reserve factor: recommended amp = load × 10^(headroom/10). 1 dB ≈ 26% reserve, 2 dB ≈ 58%.',
    },
    {
      key: 'tapw',
      name: 'TAP PER ADDED SPEAKER',
      quantity: 'power',
      placeholder: '10',
      help: 'Tap wattage of the speakers you are thinking of adding.',
    },
  ],
  functions: [
    {
      key: 'load',
      name: 'System load, amp fit, and line current',
      inputs: ['taps', 'prated', 'vline', 'hr'],
      formula: 'load = Σtaps · amp ≥ Σtaps × 10^(headroom/10) · I = Σtaps / Vline',
      plainFormula:
        'The line load equals the sum of the tap settings; the recommended amplifier is at least that sum times ten raised to the headroom over ten; the line current is the load divided by the line voltage.',
      explain:
        'Budgeting a constant-voltage (70 V / 100 V) distributed line is simple addition: sum every speaker’s tap wattage. The amplifier’s rating is a hard ceiling — keep 20–25% in reserve. High line voltage means low current, which is exactly why these lines can run thin cable to dozens of speakers.',
      keySymbols: ['Σ', '≥', '×', 'x²', '/'],
      compute: (v) => {
        const taps = arr(v.taps).filter((t) => t > 0);
        if (taps.length < 1) return [{ label: 'INPUT', text: 'Enter at least one tap wattage (e.g. "10, 10, 10").' }];
        const load = taps.reduce((s, t) => s + t, 0);
        const prated = n(v.prated);
        const vline = n(v.vline);
        const hr = n(v.hr);
        const recommended = load * Math.pow(10, hr / 10);
        const remaining = prated - load;
        return [
          { label: `SYSTEM LOAD (${taps.length} speakers)`, value: load, quantity: 'power' },
          { label: `RECOMMENDED AMP ≥ (with ${fmt(hr)} dB headroom)`, value: recommended, quantity: 'power', chainable: false },
          { label: 'REMAINING AMP CAPACITY', value: remaining, quantity: 'power', chainable: false },
          { label: 'AMP USED', value: (load / prated) * 100, quantity: 'percent', chainable: false },
          { label: 'LINE CURRENT', value: load / vline, quantity: 'current' },
          ...(prated < recommended
            ? [
                {
                  label: prated < load ? 'OVERLOADED' : 'THIN HEADROOM',
                  text:
                    prated < load
                      ? `The taps (${fmt(load)} W) exceed the amplifier’s ${fmt(prated)} W rating — re-tap lower or split the zone across amps.`
                      : `The ${fmt(prated)} W amp carries the load but not the ${fmt(hr)} dB headroom target (${fmt(recommended)} W) — expect strain on peaks.`,
                },
              ]
            : []),
        ];
      },
      steps: (v) => {
        const taps = arr(v.taps).filter((t) => t > 0);
        if (taps.length < 1) return ['Enter the tap settings to sum.'];
        const load = taps.reduce((s, t) => s + t, 0);
        const hr = n(v.hr);
        const vline = n(v.vline);
        return [
          `Sum the taps: ${taps.map((t) => fmt(t)).join(' + ')} = ${fmt(load)} W on the line.`,
          `Headroom factor 10^(${fmt(hr)}/10) = ${fmt(Math.pow(10, hr / 10))} → recommended amp ≥ ${fmt(load * Math.pow(10, hr / 10))} W.`,
          `Line current at full allocation: ${fmt(load)} W ÷ ${fmt(vline)} V = ${fmt(load / vline)} A — the low current is exactly why constant-voltage lines can run thin cable.`,
        ];
      },
    },
    {
      key: 'morespeakers',
      name: 'How many more speakers fit (reverse)',
      inputs: ['taps', 'prated', 'tapw', 'hr'],
      formula: 'more = floor((Prated/10^(headroom/10) − Σtaps) / tap)',
      plainFormula:
        'The number of extra speakers is the whole-number part of: the usable budget (rated power divided by ten raised to the headroom over ten) minus the current tap total, all divided by the added tap wattage.',
      explain:
        'Reserves the headroom first, then fills what is left of the amplifier with speakers at a chosen tap. It answers “how many more can I add to this zone?” — the floor of the remaining budget divided by each speaker’s tap.',
      keySymbols: ['x²', '/', '−', 'Σ'],
      note: 'Reserves the headroom FIRST, then fills what is left with speakers at the given tap.',
      compute: (v) => {
        const taps = arr(v.taps).filter((t) => t > 0);
        const load = taps.reduce((s, t) => s + t, 0);
        const prated = n(v.prated);
        const tapw = n(v.tapw);
        const hr = n(v.hr);
        const usable = prated / Math.pow(10, hr / 10);
        const more = Math.max(0, Math.floor((usable - load) / tapw));
        return [
          {
            label: 'MORE SPEAKERS THAT FIT',
            text:
              more > 0
                ? `${fmtInt(more)} more speaker${more === 1 ? '' : 's'} at ${fmt(tapw)} W taps fit while keeping ${fmt(hr)} dB headroom (usable budget ${fmt(usable)} W, current load ${fmt(load)} W).`
                : `None — the ${fmt(load)} W already tapped leaves no room under the ${fmt(usable)} W usable budget (rated ${fmt(prated)} W minus ${fmt(hr)} dB headroom). Re-tap lower or add an amplifier.`,
          },
          { label: 'USABLE BUDGET AFTER HEADROOM', value: usable, quantity: 'power', chainable: false },
          { label: 'LOAD IF FILLED', value: load + more * tapw, quantity: 'power', chainable: false },
        ];
      },
      steps: (v) => {
        const taps = arr(v.taps).filter((t) => t > 0);
        const load = taps.reduce((s, t) => s + t, 0);
        const prated = n(v.prated);
        const tapw = n(v.tapw);
        const hr = n(v.hr);
        const usable = prated / Math.pow(10, hr / 10);
        return [
          `Usable budget = ${fmt(prated)} W ÷ 10^(${fmt(hr)}/10) = ${fmt(usable)} W after reserving headroom.`,
          `Room left = ${fmt(usable)} − ${fmt(load)} = ${fmt(usable - load)} W.`,
          `At ${fmt(tapw)} W per speaker: floor(${fmt(usable - load)} ÷ ${fmt(tapw)}) = ${fmtInt(Math.max(0, Math.floor((usable - load) / tapw)))} more speakers.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_SPEAKERS: Workspace[] = [WS_SPEAKERPOWER, WS_IMPEDANCE, WS_CABLE, WS_CV70];
