/**
 * Workspaces: SPL, exposure & the electrical chain — distance falloff,
 * level summing, exposure/dose, mic output & preamp gain, limiter thresholds.
 * Follows the wave.ts exemplar (owner spec 2026-07-29).
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const arr = (v: number | number[]) => (Array.isArray(v) ? v : [v]);

/** Energy-sum a list of dB levels: 10·log10(Σ 10^(Li/10)). */
const dbSum = (levels: number[]) =>
  10 * Math.log10(levels.reduce((acc, L) => acc + Math.pow(10, L / 10), 0));

/** Allowable exposure time in MINUTES for a criterion (Tc hours at Lc, ER exchange). */
const allowMin = (L: number, Lc: number, ER: number, TcH = 8) =>
  TcH * 60 * Math.pow(2, -(L - Lc) / ER);

const V_REF_DBU = 0.775; // 0 dBu reference voltage (600 Ω / 1 mW legacy)

// ---------------------------------------------------------------------------
// 1 · SPL & Distance
// ---------------------------------------------------------------------------
const WS_SPL_DIST: Workspace = {
  id: 'spldist',
  name: 'SPL & Distance',
  tagline: 'Inverse square · line sources · custom falloff · required source level',
  section: 'spl',
  intro:
    'How level changes as you move toward or away from a source. Pick the falloff model, ' +
    'enter a known level at a known distance, and the lab shows what arrives somewhere else — ' +
    'or, in reverse, how loud the source must be to hit a target.',
  whyItMatters:
    'Every coverage question — will the back row hear it, how hot is the front row, where do I ' +
    'measure — is a distance-falloff question. Knowing that a point source loses 6 dB per ' +
    'doubling (and a line source only ~3 dB) is the difference between guessing and predicting.',
  example:
    'A speaker measures 100 dB SPL at 2 m. At 16 m (three doublings) the point-source model ' +
    'predicts 100 − 20·log10(16/2) = 100 − 18.1 ≈ 81.9 dB SPL. An idealized line-source array ' +
    'over the same throw would lose only ~9 dB — half the falloff, which is exactly why line ' +
    'arrays exist.',
  mistakes: [
    'Applying inverse-square indoors at distance — past critical distance the reverberant field takes over and level stops falling with the free-field law.',
    'Assuming doubling the distance halves the loudness — it drops the LEVEL 6 dB (point source), which is noticeably quieter but not "half" perceptually (≈ −10 dB is a halving of perceived loudness).',
    'Forgetting the reference distance: "the speaker does 100 dB" means nothing until you say at what distance it was measured.',
  ],
  warnings:
    'Free-field inverse-square is an idealization. Rooms, boundaries, source directivity, ' +
    'arrays, and limiting all bend the falloff — real venues sit between the point and line ' +
    'models and flatten in the reverberant field. Treat these results as the classroom model, ' +
    'never as a venue prediction.',
  glossary: ['Sound Pressure Level', 'Decibel', 'Inverse Square Law', 'Free field', 'Critical distance'],
  fields: [
    { key: 'l1', name: 'KNOWN LEVEL L₁', quantity: 'spl', placeholder: '100', help: 'The measured or specified level at the reference distance.' },
    { key: 'd1', name: 'REFERENCE DISTANCE d₁', quantity: 'length', placeholder: '1', help: 'The distance at which L₁ was measured (often 1 m on spec sheets).', warn: { test: (x) => x <= 0, msg: 'Reference distance must be greater than zero.' } },
    { key: 'd2', name: 'NEW DISTANCE d₂', quantity: 'length', placeholder: '8', help: 'The distance where you want to know (or set) the level.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'rate', name: 'FALLOFF PER DOUBLING', quantity: 'db', placeholder: '4.5', help: 'dB lost each time distance doubles: 6 = point source, 3 = ideal line source, real arrays land between.' },
    { key: 'lTarget', name: 'TARGET LEVEL AT d₂', quantity: 'spl', placeholder: '96', help: 'The level you want the listener at d₂ to receive.' },
  ],
  functions: [
    {
      key: 'point',
      name: 'SPL at a new distance — point source',
      inputs: ['l1', 'd1', 'd2'],
      formula: 'L₂ = L₁ − 20·log10(d₂/d₁)',
      plainFormula:
        'The new level equals the known level minus twenty times the base-ten log of the ratio of the two distances.',
      explain:
        'A free-field point source loses 6 dB every time the distance doubles. This predicts the level at a new distance from a known level at a known distance — the basis of every coverage question, from the back row to the front-row heat.',
      keySymbols: ['−', '·', 'log₁₀', '/', 'x₁'],
      note: 'Free-field point source: −6 dB per doubling of distance.',
      compute: (v) => {
        const drop = 20 * Math.log10(n(v.d2) / n(v.d1));
        return [
          { label: 'LEVEL AT d₂', value: n(v.l1) - drop, quantity: 'spl' },
          { label: 'CHANGE', value: -drop, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const r = n(v.d2) / n(v.d1);
        const drop = 20 * Math.log10(r);
        return [
          `Distance ratio d₂/d₁ = ${fmt(n(v.d2))} ÷ ${fmt(n(v.d1))} = ${fmt(r)}.`,
          `Point-source change = −20 × log10(${fmt(r)}) = ${fmt(-drop)} dB.`,
          `L₂ = ${fmt(n(v.l1))} + (${fmt(-drop)}) = ${fmt(n(v.l1) - drop)} dB SPL.`,
        ];
      },
    },
    {
      key: 'line',
      name: 'SPL at a new distance — idealized line source',
      inputs: ['l1', 'd1', 'd2'],
      formula: 'L₂ = L₁ − 10·log10(d₂/d₁)',
      plainFormula:
        'The new level equals the known level minus ten times the base-ten log of the ratio of the two distances.',
      explain:
        'An idealized (infinite) line source spreads cylindrically, so it loses only 3 dB per doubling of distance — half the falloff of a point source. Real line arrays only approximate this, and only in their near field, which is exactly why arrays throw farther.',
      keySymbols: ['−', '·', 'log₁₀', '/', 'x₁'],
      note: 'Idealized (infinite) line source: −3 dB per doubling. Real line arrays only approximate this, and only in their near field.',
      compute: (v) => {
        const drop = 10 * Math.log10(n(v.d2) / n(v.d1));
        return [
          { label: 'LEVEL AT d₂ (idealized line source)', value: n(v.l1) - drop, quantity: 'spl' },
          { label: 'CHANGE', value: -drop, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const r = n(v.d2) / n(v.d1);
        const drop = 10 * Math.log10(r);
        return [
          `Distance ratio = ${fmt(r)}; a line source spreads cylindrically, so level falls at 10·log10, not 20·log10.`,
          `L₂ = ${fmt(n(v.l1))} − 10 × log10(${fmt(r)}) = ${fmt(n(v.l1) - drop)} dB SPL — only ${fmt(drop)} dB lost vs ${fmt(2 * drop)} dB for a point source.`,
        ];
      },
    },
    {
      key: 'custom',
      name: 'SPL at a new distance — custom falloff rate',
      inputs: ['l1', 'd1', 'd2', 'rate'],
      formula: 'L₂ = L₁ − rate · log2(d₂/d₁)',
      plainFormula:
        'The new level equals the known level minus the per-doubling rate times the base-two log of the distance ratio (the number of doublings).',
      explain:
        'Uses a measured per-doubling falloff rate instead of the ideal 6 or 3 dB. Real arrays typically land between the two. The base-two log turns the distance ratio into a number of doublings, each costing the entered rate.',
      keySymbols: ['−', '·', '/', 'x₁'],
      note: 'Use a measured per-doubling rate — real arrays typically land between 3 and 6 dB per doubling.',
      compute: (v) => {
        const drop = n(v.rate) * Math.log2(n(v.d2) / n(v.d1));
        return [
          { label: 'LEVEL AT d₂', value: n(v.l1) - drop, quantity: 'spl' },
          { label: 'CHANGE', value: -drop, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const doublings = Math.log2(n(v.d2) / n(v.d1));
        const drop = n(v.rate) * doublings;
        return [
          `From ${fmt(n(v.d1))} m to ${fmt(n(v.d2))} m is ${fmt(doublings)} doublings of distance.`,
          `At ${fmt(n(v.rate))} dB per doubling: change = −${fmt(n(v.rate))} × ${fmt(doublings)} = ${fmt(-drop)} dB.`,
          `L₂ = ${fmt(n(v.l1))} + (${fmt(-drop)}) = ${fmt(n(v.l1) - drop)} dB SPL.`,
        ];
      },
    },
    {
      key: 'required',
      name: 'Required source SPL for a target (reverse)',
      inputs: ['lTarget', 'd1', 'd2'],
      formula: 'L₁ = L₂ + 20·log10(d₂/d₁)',
      plainFormula:
        'The required source level equals the target level plus twenty times the base-ten log of the distance ratio.',
      explain:
        'The reverse of the point-source law: how loud a source must be at the reference distance to deliver a target level farther away. It adds back the distance loss the target must overcome — sizing a system before the show.',
      keySymbols: ['·', 'log₁₀', '/', 'x₁'],
      note: 'Reverse of the point-source law: how loud must it be at the reference distance to deliver the target level at d₂.',
      compute: (v) => {
        const gain = 20 * Math.log10(n(v.d2) / n(v.d1));
        return [
          { label: 'REQUIRED LEVEL AT d₁', value: n(v.lTarget) + gain, quantity: 'spl' },
          { label: 'DISTANCE LOSS TO COVER', value: gain, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const gain = 20 * Math.log10(n(v.d2) / n(v.d1));
        return [
          `The point-source loss from ${fmt(n(v.d1))} m to ${fmt(n(v.d2))} m is 20 × log10(${fmt(n(v.d2) / n(v.d1))}) = ${fmt(gain)} dB.`,
          `To land ${fmt(n(v.lTarget))} dB SPL at d₂ the source must do ${fmt(n(v.lTarget))} + ${fmt(gain)} = ${fmt(n(v.lTarget) + gain)} dB SPL at d₁.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 2 · Adding Sound Sources
// ---------------------------------------------------------------------------
const WS_SPL_ADD: Workspace = {
  id: 'spladd',
  name: 'Adding Sound Sources',
  tagline: 'Energy summing · identical sources · sources for a target gain',
  section: 'spl',
  intro:
    'Decibels are logarithms, so levels never add arithmetically. This workspace converts ' +
    'levels back to energy ratios, sums the energy, and converts back — the only honest way ' +
    'to combine sources.',
  whyItMatters:
    'It answers the daily questions: what do two subs actually buy me, does the fourth box ' +
    'matter, and why did muting that quiet channel change nothing on the meter. Energy summing ' +
    'is also the backbone of exposure math and Leq.',
  example:
    'Two uncorrelated 95 dB SPL machines: 10·log10(10^9.5 + 10^9.5) = 95 + 10·log10(2) ' +
    '≈ 98 dB SPL — a 3 dB rise, not 190 dB. Add a third: ≈ 99.8 dB. Each new identical ' +
    'source buys less than the last.',
  mistakes: [
    'Adding decibels arithmetically — 95 + 95 = 190 is the classic. Two equal uncorrelated sources give +3 dB, never a doubling of the numbers.',
    'Expecting two subs to give +6 dB everywhere. Coherent (in-phase, same-signal) coupling can reach +6 dB at some positions, but uncorrelated or partially correlated summing gives +3 dB — and phase misalignment can give less, or cancellation. This tool computes the uncorrelated (energy) sum.',
    'Removing a much quieter source and expecting an audible change — anything more than ~10 dB below the loudest contributes under half a dB to the total.',
  ],
  warnings:
    'These are UNCORRELATED (energy) sums — the right model for independent noise sources and ' +
    'crowd/machine noise. Identical signals from identical speakers can sum coherently ' +
    '(up to +6 dB for two) at positions where they arrive in phase, and cancel where they do ' +
    'not. Real multi-speaker systems live between the two models and vary by position.',
  glossary: ['Sound Pressure Level', 'Decibel', 'Summation', 'Phase', 'Correlation'],
  fields: [
    { key: 'levels', name: 'SOURCE LEVELS', quantity: 'list', placeholder: '95, 92, 88', help: 'The individual levels in dB SPL, comma-separated — one per source.' },
    { key: 'lvl', name: 'LEVEL OF ONE SOURCE', quantity: 'spl', placeholder: '95', help: 'The level a single one of the identical sources produces at the listening position.' },
    { key: 'count', name: 'NUMBER OF SOURCES', quantity: 'number', placeholder: '4', help: 'How many identical, uncorrelated sources are running.', warn: { test: (x) => x < 1, msg: 'Need at least one source.' } },
    { key: 'delta', name: 'TARGET INCREASE', quantity: 'db', placeholder: '6', help: 'How many dB louder than ONE source you want the combined total to be.' },
    { key: 'la', name: 'LOUDER SOURCE', quantity: 'spl', placeholder: '95', help: 'Level of the first source at the listening position.' },
    { key: 'lb', name: 'QUIETER SOURCE', quantity: 'spl', placeholder: '84', help: 'Level of the second source at the listening position.' },
  ],
  functions: [
    {
      key: 'combine',
      name: 'Combine any number of levels',
      inputs: ['levels'],
      formula: 'Ltot = 10·log10(Σ 10^(Lᵢ/10))',
      plainFormula:
        'The combined level equals ten times the base-ten log of the sum of each level converted to an energy ratio (ten raised to the level over ten).',
      explain:
        'Decibels are logarithms, so levels never add arithmetically. This converts each level back to an energy ratio, sums the energy, and converts back — the only honest way to combine sources. It shows how much the total sits above the loudest single source.',
      keySymbols: ['·', 'log₁₀', 'Σ', 'x²', 'x₁'],
      compute: (v) => {
        const ls = arr(v.levels);
        const tot = dbSum(ls);
        const loudest = Math.max(...ls);
        return [
          { label: 'COMBINED LEVEL', value: tot, quantity: 'spl' },
          {
            label: 'INCREASE OVER LOUDEST',
            text: `The sum sits ${fmt(tot - loudest)} dB above the loudest single source (${fmt(loudest)} dB SPL).`,
          },
        ];
      },
      steps: (v) => {
        const ls = arr(v.levels);
        const energies = ls.map((L) => Math.pow(10, L / 10));
        const sum = energies.reduce((a, b) => a + b, 0);
        return [
          `Convert each level to an energy ratio: ${ls.map((L) => `10^(${fmt(L)}/10) = ${fmt(Math.pow(10, L / 10))}`).join(' · ')}.`,
          `Add the energies (this is the step decibels skip): Σ = ${fmt(sum)}.`,
          `Back to decibels: Ltot = 10 × log10(${fmt(sum)}) = ${fmt(10 * Math.log10(sum))} dB SPL.`,
        ];
      },
      table: (v) => {
        const ls = arr(v.levels);
        const sum = ls.reduce((a, L) => a + Math.pow(10, L / 10), 0);
        return {
          title: 'Contribution of each source to the energy sum',
          cols: ['Source', 'Level (dB SPL)', 'Share of total'],
          rows: ls.map((L, i) => [
            `#${i + 1}`,
            fmt(L),
            `${fmt((Math.pow(10, L / 10) / sum) * 100, 3)}%`,
          ]),
        };
      },
    },
    {
      key: 'identical',
      name: 'N identical (uncorrelated) sources',
      inputs: ['lvl', 'count'],
      formula: 'Ltot = L + 10·log10(N)',
      plainFormula:
        'The combined level equals one source’s level plus ten times the base-ten log of the number of sources.',
      explain:
        'N identical, uncorrelated sources add N times the energy, which is 10·log(N) of gain: two give +3 dB, four give +6 dB, ten give +10 dB. Each new identical source buys less than the last.',
      keySymbols: ['·', 'log₁₀'],
      compute: (v) => {
        const gain = 10 * Math.log10(n(v.count));
        return [
          { label: 'COMBINED LEVEL', value: n(v.lvl) + gain, quantity: 'spl' },
          { label: 'GAIN OVER ONE SOURCE', value: gain, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const N = n(v.count);
        return [
          `${fmt(N)} equal energies add to ${fmt(N)}× the energy of one source.`,
          `10 × log10(${fmt(N)}) = ${fmt(10 * Math.log10(N))} dB of gain.`,
          `Ltot = ${fmt(n(v.lvl))} + ${fmt(10 * Math.log10(N))} = ${fmt(n(v.lvl) + 10 * Math.log10(N))} dB SPL.`,
        ];
      },
    },
    {
      key: 'needed',
      name: 'Sources needed for a target increase (reverse)',
      inputs: ['delta'],
      formula: 'N = 10^(ΔdB/10)',
      plainFormula: 'The number of sources equals ten raised to the target increase in dB, divided by ten.',
      explain:
        'The reverse: how many uncorrelated sources a target increase over one source needs. Because doubling sources always buys just +3 dB, the price of each extra dB grows fast — a 6 dB gain needs four sources, 10 dB needs ten.',
      keySymbols: ['x²', 'Δ', '/'],
      note: 'Uncorrelated sum. Doubling sources always buys +3 dB — the price of each extra dB grows fast.',
      compute: (v) => {
        const N = Math.pow(10, n(v.delta) / 10);
        return [
          { label: 'EXACT SOURCE MULTIPLE', value: N, quantity: 'number', chainable: false },
          {
            label: 'PRACTICAL ANSWER',
            text: `You need ${fmt(Math.ceil(N), 6)} sources (next whole number above ${fmt(N)}×) to gain at least ${fmt(n(v.delta))} dB over one source.`,
          },
        ];
      },
      steps: (v) => {
        const d = n(v.delta);
        const N = Math.pow(10, d / 10);
        return [
          `A ${fmt(d)} dB increase is an energy ratio of 10^(${fmt(d)}/10) = ${fmt(N)}×.`,
          `Uncorrelated sources contribute equal energy, so you need ${fmt(N)}× the sources — round up to ${fmt(Math.ceil(N), 6)} in practice.`,
        ];
      },
    },
    {
      key: 'dominance',
      name: 'Two sources — combined level & dominance check',
      inputs: ['la', 'lb'],
      formula: 'Ltot = 10·log10(10^(La/10) + 10^(Lb/10))',
      plainFormula:
        'The combined level equals ten times the base-ten log of the sum of the two sources’ energy ratios.',
      explain:
        'Energy-sums two levels and checks which dominates. When one source is more than about 10 dB below the other, it adds under half a dB — muting it is inaudible on a meter. Within 10 dB, both matter. It is why removing a quiet channel often changes nothing.',
      keySymbols: ['·', 'log₁₀', 'x²'],
      compute: (v) => {
        const la = n(v.la);
        const lb = n(v.lb);
        const tot = dbSum([la, lb]);
        const diff = Math.abs(la - lb);
        const verdict =
          diff > 10
            ? `The quieter source is ${fmt(diff)} dB down — it adds only ${fmt(tot - Math.max(la, lb))} dB (<0.5 dB). The louder source dominates; muting the quiet one is inaudible on a meter.`
            : `The sources are within ${fmt(diff)} dB of each other, so both matter: the quieter one adds ${fmt(tot - Math.max(la, lb))} dB to the louder.`;
        return [
          { label: 'COMBINED LEVEL', value: tot, quantity: 'spl' },
          { label: 'VERDICT', text: verdict },
        ];
      },
      steps: (v) => {
        const la = n(v.la);
        const lb = n(v.lb);
        const ea = Math.pow(10, la / 10);
        const eb = Math.pow(10, lb / 10);
        return [
          `Energy ratios: 10^(${fmt(la)}/10) = ${fmt(ea)} and 10^(${fmt(lb)}/10) = ${fmt(eb)}.`,
          `Sum = ${fmt(ea + eb)}; Ltot = 10 × log10(${fmt(ea + eb)}) = ${fmt(10 * Math.log10(ea + eb))} dB SPL.`,
          `The quieter source holds ${fmt((Math.min(ea, eb) / (ea + eb)) * 100, 3)}% of the total energy.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 3 · Exposure & Allowable Time
// ---------------------------------------------------------------------------
const WS_DOSE: Workspace = {
  id: 'dose',
  name: 'Exposure & Allowable Time',
  tagline: 'Allowable time · daily dose · Leq — criterion always shown',
  section: 'spl',
  intro:
    'How long a given level can run before a published exposure criterion is used up, and how ' +
    'a day of mixed levels adds into a single dose. Every function names its criterion and ' +
    'exchange rate — the answer changes completely when they do.',
  whyItMatters:
    'Hearing damage is cumulative and painless until it is permanent. The exchange-rate math ' +
    'is brutally unintuitive: under a 3 dB exchange rate, turning it up just 3 dB HALVES the ' +
    'allowable time. Engineers who cannot run this math are guessing with their ears.',
  example:
    'A 4-hour show at 97 dBA under the NIOSH-style criterion (85 dBA, 3 dB exchange, 8 h): ' +
    'allowable time = 480 / 2^((97−85)/3) = 480 / 16 = 30 minutes. Four hours is 240 min, so ' +
    'dose = 240/30 = 800% — eight times the daily allowance from that one show.',
  mistakes: [
    'Averaging dB arithmetically over a day — (100 + 70)/2 is NOT 85 dBA of exposure. Leq is an energy average; loud intervals dominate it.',
    'Assuming one universal "safe" number exists — criteria differ by jurisdiction and purpose (85 vs 90 dBA criterion, 3 vs 5 dB exchange), and the same day scores wildly different doses under each.',
    'Ignoring the exchange rate: under a 3 dB exchange, +3 dB halves allowable time — 91 dBA allows 2 h, 94 dBA only 1 h.',
  ],
  warnings:
    'TEACHING calculations of published criterion formulas — NOT medical or legal advice, and ' +
    'not a compliance measurement. The criterion level and exchange rate are always displayed ' +
    'with every result. Peak/impulse limits (e.g. 140 dB peak) are a separate constraint this ' +
    'workspace does not evaluate. Real protection depends on the jurisdiction’s rules, the ' +
    'measurement method (dosimetry position, A-weighting, slow response), and hearing ' +
    'conservation programs — talk to a qualified professional for anything real.',
  glossary: ['Sound Pressure Level', 'Decibel', 'A weighting', 'Leq', 'Exposure', 'Exchange rate'],
  fields: [
    { key: 'lex', name: 'EXPOSURE LEVEL', quantity: 'spl', placeholder: '94', help: 'The A-weighted level (dBA) the person is exposed to.' },
    { key: 'doseLevels', name: 'INTERVAL LEVELS', quantity: 'list', placeholder: '85, 94, 100', help: 'A-weighted level (dBA) of each interval, comma-separated — paired by position with the durations below.' },
    { key: 'doseMins', name: 'INTERVAL DURATIONS', quantity: 'list', placeholder: '240, 90, 30', help: 'Duration of each interval in MINUTES, comma-separated — same order as the levels.' },
  ],
  functions: [
    {
      key: 'allowNiosh',
      name: 'Allowable time — NIOSH-style (85 dBA criterion, 3 dB exchange, 8 h)',
      inputs: ['lex'],
      formula: 'T = 480 min / 2^((L − 85)/3)',
      plainFormula:
        'The allowable time equals 480 minutes divided by two raised to the level minus 85, over three.',
      explain:
        'How long a level can run before the NIOSH-style criterion (85 dBA, 3 dB exchange, 8 hours) is used up. Every 3 dB above 85 halves the allowable time — brutally unintuitive, and why turning it up “just a little” matters so much. A teaching calculation, not medical or legal advice.',
      keySymbols: ['/', 'x²', '−'],
      note: 'Criterion 85 dBA · exchange rate 3 dB · reference duration 8 h. Recommended-practice style; not a legal limit.',
      compute: (v) => {
        const T = allowMin(n(v.lex), 85, 3);
        return [
          { label: 'ALLOWABLE TIME (85 dBA / 3 dB / 8 h)', value: T * 60, quantity: 'time', unit: 'min' },
          {
            label: 'CRITERION',
            text: 'Computed under: 85 dBA criterion · 3 dB exchange rate · 8 h reference. Every 3 dB above 85 halves the time.',
          },
        ];
      },
      steps: (v) => {
        const L = n(v.lex);
        const halvings = (L - 85) / 3;
        return [
          `Excess over the 85 dBA criterion: ${fmt(L)} − 85 = ${fmt(L - 85)} dB → ${fmt(halvings)} halvings at the 3 dB exchange rate.`,
          `T = 480 min ÷ 2^${fmt(halvings)} = ${fmt(allowMin(L, 85, 3))} minutes.`,
        ];
      },
    },
    {
      key: 'allowOsha',
      name: 'Allowable time — OSHA-style (90 dBA criterion, 5 dB exchange, 8 h)',
      inputs: ['lex'],
      formula: 'T = 480 min / 2^((L − 90)/5)',
      plainFormula:
        'The allowable time equals 480 minutes divided by two raised to the level minus 90, over five.',
      explain:
        'The same idea under the OSHA-style criterion (90 dBA, 5 dB exchange, 8 hours), where every 5 dB above 90 halves the time. It is more lenient than the 3 dB model at high levels — the same day scores a very different dose under each. Teaching only, not compliance.',
      keySymbols: ['/', 'x²', '−'],
      note: 'Criterion 90 dBA · exchange rate 5 dB · reference duration 8 h. Permissible-limit style; more lenient than the 3 dB model at high levels.',
      compute: (v) => {
        const T = allowMin(n(v.lex), 90, 5);
        return [
          { label: 'ALLOWABLE TIME (90 dBA / 5 dB / 8 h)', value: T * 60, quantity: 'time', unit: 'min' },
          {
            label: 'CRITERION',
            text: 'Computed under: 90 dBA criterion · 5 dB exchange rate · 8 h reference. Every 5 dB above 90 halves the time.',
          },
        ];
      },
      steps: (v) => {
        const L = n(v.lex);
        const halvings = (L - 90) / 5;
        return [
          `Excess over the 90 dBA criterion: ${fmt(L)} − 90 = ${fmt(L - 90)} dB → ${fmt(halvings)} halvings at the 5 dB exchange rate.`,
          `T = 480 min ÷ 2^${fmt(halvings)} = ${fmt(allowMin(L, 90, 5))} minutes.`,
        ];
      },
    },
    {
      key: 'doseNiosh',
      name: 'Daily dose from intervals — NIOSH-style (85 dBA, 3 dB exchange)',
      inputs: ['doseLevels', 'doseMins'],
      formula: 'dose% = Σ (tᵢ / Tᵢ) × 100 · Tᵢ = 480 / 2^((Lᵢ−85)/3)',
      plainFormula:
        'The daily dose in percent is the sum over intervals of each duration divided by its allowable time, times 100; each allowable time is 480 divided by two raised to the interval level minus 85, over three.',
      explain:
        'Adds a day of mixed levels into a single dose under the NIOSH criterion. Each interval spends a share of the daily allowance — its duration over the time allowed at that level — and 100% is the full day’s allowance. Loud intervals dominate.',
      keySymbols: ['Σ', '/', '×', 'x²', '−', 'x₁'],
      note: 'Intervals pair by position: first level with first duration. 100% = the full daily allowance under this criterion.',
      compute: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        let dose = 0;
        for (let i = 0; i < m; i++) dose += (ts[i]! / allowMin(ls[i]!, 85, 3)) * 100;
        return [
          // Mismatched lists used to truncate SILENTLY (QA night 2026-09-01)
          // — safety-adjacent, so the drop is now announced. Copy flagged.
          ...(ls.length !== ts.length
            ? [
                {
                  label: 'CHECK INPUTS',
                  text: `You entered ${ls.length} levels but ${ts.length} durations — only the first ${m} pairs are counted.`,
                },
              ]
            : []),
          { label: 'DAILY DOSE (85 dBA / 3 dB)', value: dose, quantity: 'percent', chainable: false },
          {
            label: 'READING',
            text:
              dose > 100
                ? `${fmt(dose)}% — this day exceeds the full allowance under the 85 dBA / 3 dB criterion by ${fmt(dose - 100)} points.`
                : `${fmt(dose)}% of the daily allowance under the 85 dBA / 3 dB criterion is used.`,
          },
        ];
      },
      steps: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        const parts: string[] = [];
        let dose = 0;
        for (let i = 0; i < m; i++) {
          const T = allowMin(ls[i]!, 85, 3);
          dose += (ts[i]! / T) * 100;
          parts.push(`${fmt(ts[i]!)} min at ${fmt(ls[i]!)} dBA (allowed ${fmt(T)} min) → ${fmt((ts[i]! / T) * 100)}%`);
        }
        return [
          `Each interval spends a share of the allowance: ${parts.join('; ')}.`,
          `Total dose = ${fmt(dose)}% under the 85 dBA criterion, 3 dB exchange, 8 h reference.`,
        ];
      },
      table: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        const rows: string[][] = [];
        for (let i = 0; i < m; i++) {
          const T = allowMin(ls[i]!, 85, 3);
          rows.push([`#${i + 1}`, `${fmt(ls[i]!)} dBA`, `${fmt(ts[i]!)} min`, `${fmt(T)} min`, `${fmt((ts[i]! / T) * 100)}%`]);
        }
        return {
          title: 'Intervals under the 85 dBA / 3 dB criterion',
          cols: ['Interval', 'Level', 'Duration', 'Allowable', 'Dose share'],
          rows,
        };
      },
    },
    {
      key: 'doseOsha',
      name: 'Daily dose from intervals — OSHA-style (90 dBA, 5 dB exchange)',
      inputs: ['doseLevels', 'doseMins'],
      formula: 'dose% = Σ (tᵢ / Tᵢ) × 100 · Tᵢ = 480 / 2^((Lᵢ−90)/5)',
      plainFormula:
        'The daily dose in percent is the sum over intervals of each duration divided by its allowable time, times 100; each allowable time is 480 divided by two raised to the interval level minus 90, over five.',
      explain:
        'The same day scored under the OSHA criterion (90 dBA, 5 dB exchange). Comparing it with the NIOSH result shows how much the criterion choice changes the answer — the same intervals can read safe under one and over-exposed under the other.',
      keySymbols: ['Σ', '/', '×', 'x²', '−', 'x₁'],
      note: 'Same intervals, different criterion — compare with the 85/3 result to see how much the criterion choice matters.',
      compute: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        let dose = 0;
        for (let i = 0; i < m; i++) dose += (ts[i]! / allowMin(ls[i]!, 90, 5)) * 100;
        return [
          ...(ls.length !== ts.length
            ? [
                {
                  label: 'CHECK INPUTS',
                  text: `You entered ${ls.length} levels but ${ts.length} durations — only the first ${m} pairs are counted.`,
                },
              ]
            : []),
          { label: 'DAILY DOSE (90 dBA / 5 dB)', value: dose, quantity: 'percent', chainable: false },
          {
            label: 'READING',
            text:
              dose > 100
                ? `${fmt(dose)}% — this day exceeds the full allowance under the 90 dBA / 5 dB criterion.`
                : `${fmt(dose)}% of the daily allowance under the 90 dBA / 5 dB criterion is used.`,
          },
        ];
      },
      steps: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        const parts: string[] = [];
        let dose = 0;
        for (let i = 0; i < m; i++) {
          const T = allowMin(ls[i]!, 90, 5);
          dose += (ts[i]! / T) * 100;
          parts.push(`${fmt(ts[i]!)} min at ${fmt(ls[i]!)} dBA (allowed ${fmt(T)} min) → ${fmt((ts[i]! / T) * 100)}%`);
        }
        return [
          `Each interval spends a share of the allowance: ${parts.join('; ')}.`,
          `Total dose = ${fmt(dose)}% under the 90 dBA criterion, 5 dB exchange, 8 h reference.`,
        ];
      },
      table: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        const rows: string[][] = [];
        for (let i = 0; i < m; i++) {
          const T = allowMin(ls[i]!, 90, 5);
          rows.push([`#${i + 1}`, `${fmt(ls[i]!)} dBA`, `${fmt(ts[i]!)} min`, `${fmt(T)} min`, `${fmt((ts[i]! / T) * 100)}%`]);
        }
        return {
          title: 'Intervals under the 90 dBA / 5 dB criterion',
          cols: ['Interval', 'Level', 'Duration', 'Allowable', 'Dose share'],
          rows,
        };
      },
    },
    {
      key: 'leq',
      name: 'Leq (energy average) from intervals',
      inputs: ['doseLevels', 'doseMins'],
      formula: 'Leq = 10·log10(Σ tᵢ·10^(Lᵢ/10) / Σ tᵢ)',
      plainFormula:
        'The equivalent level equals ten times the base-ten log of the time-weighted sum of each interval’s energy, divided by the total time.',
      explain:
        'The single steady level carrying the same total energy as the varying intervals. It weights each interval’s energy by its duration — criterion-free, pure energy math — so the loudest intervals dominate the average. Arithmetic dB averaging would badly under-read it.',
      keySymbols: ['·', 'log₁₀', 'Σ', 'x²', '/', 'x₁'],
      note: 'The single steady level that carries the same total energy as the varying intervals. Criterion-free — pure energy math.',
      compute: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        let e = 0;
        let tt = 0;
        for (let i = 0; i < m; i++) {
          e += ts[i]! * Math.pow(10, ls[i]! / 10);
          tt += ts[i]!;
        }
        return [
          ...(ls.length !== ts.length
            ? [
                {
                  label: 'CHECK INPUTS',
                  text: `You entered ${ls.length} levels but ${ts.length} durations — only the first ${m} pairs are counted.`,
                },
              ]
            : []),
          { label: 'Leq OVER THE INTERVALS', value: 10 * Math.log10(e / tt), quantity: 'spl' },
          { label: 'TOTAL DURATION', value: tt * 60, quantity: 'time', unit: 'min', chainable: false },
        ];
      },
      steps: (v) => {
        const ls = arr(v.doseLevels);
        const ts = arr(v.doseMins);
        const m = Math.min(ls.length, ts.length);
        let e = 0;
        let tt = 0;
        for (let i = 0; i < m; i++) {
          e += ts[i]! * Math.pow(10, ls[i]! / 10);
          tt += ts[i]!;
        }
        return [
          `Weight each interval’s energy by its time: Σ tᵢ·10^(Lᵢ/10) = ${fmt(e)} over ${fmt(tt)} min total.`,
          `Leq = 10 × log10(${fmt(e)} ÷ ${fmt(tt)}) = ${fmt(10 * Math.log10(e / tt))} dB — note how the loudest intervals dominate the average.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 4 · Mic Output & Preamp Gain
// ---------------------------------------------------------------------------
const WS_MIC_GAIN: Workspace = {
  id: 'micgain',
  name: 'Mic Output & Preamp Gain',
  tagline: 'Sensitivity → voltage → dBu → gain: the whole input chain',
  section: 'mics',
  intro:
    'From sound pressure at the capsule to volts on the wire to gain on the preamp. Enter the ' +
    'spec-sheet sensitivity and the source level, and the lab walks the whole chain — the ' +
    'foundation of gain staging.',
  whyItMatters:
    'Gain structure starts here: a dynamic mic on a quiet source can need 60+ dB while a ' +
    'condenser on a drum needs 10. Knowing the mic’s actual output voltage tells you how much ' +
    'gain to expect, when a pad is needed, and when a preamp will clip before the converter does.',
  example:
    'A 2 mV/Pa dynamic mic on a 94 dB SPL source: 94 dB SPL is exactly 1 Pa, so it outputs ' +
    '2 mV = 20·log10(0.002/0.775) ≈ −51.8 dBu. Reaching +4 dBu line level needs ≈ 56 dB of ' +
    'gain — right in the range where quality preamps earn their keep.',
  mistakes: [
    'Comparing condenser and dynamic "gain needs" without sensitivity — a 20 mV/Pa condenser starts 20 dB hotter than a 2 mV/Pa dynamic on the same source.',
    'Forgetting that louder sources need LESS gain: +10 dB SPL at the capsule is +10 dB at the mic output, so the preamp needs 10 dB less.',
    'Chasing meters to 0 dBFS — healthy tracking level leaves headroom; the "required gain" here targets a working level, not the clip point.',
  ],
  warnings:
    'IEC 60268-4 governs formal microphone measurement; published sensitivity varies with the ' +
    'measurement method (open-circuit vs loaded, tolerance ±dB) and real output depends on the ' +
    'load impedance. This workspace models the spec-sheet number at 94 dB SPL = 1 Pa exactly.',
  glossary: ['Sensitivity', 'Sound Pressure Level', 'Decibel', 'Gain Staging', 'Headroom', 'Preamplifier'],
  fields: [
    { key: 'sens', name: 'MIC SENSITIVITY', quantity: 'number', placeholder: '2', help: 'Millivolts out per pascal (94 dB SPL). Dynamics ≈ 1–3 mV/Pa; condensers ≈ 8–40 mV/Pa.', warn: { test: (x) => x <= 0, msg: 'Sensitivity must be greater than zero.' } },
    { key: 'spl', name: 'SOURCE SPL AT THE MIC', quantity: 'spl', placeholder: '94', help: 'The sound pressure level arriving at the capsule.' },
    { key: 'target', name: 'TARGET LEVEL', quantity: 'db', placeholder: '4', help: 'The output level you want after the preamp, in dBu (+4 dBu = pro line level).' },
    { key: 'headroom', name: 'HEADROOM', quantity: 'db', placeholder: '12', help: 'Safety margin left below the target for peaks — subtracted from the required gain.' },
    { key: 'maxIn', name: 'PREAMP MAX INPUT', quantity: 'db', placeholder: '10', help: 'The preamp input clip point in dBu (from its spec sheet).' },
  ],
  functions: [
    {
      key: 'micout',
      name: 'Mic output voltage from SPL',
      inputs: ['sens', 'spl'],
      formula: 'p = 10^((SPL−94)/20) Pa · V = sens/1000 × p',
      plainFormula:
        'The pressure equals ten raised to the SPL minus 94, over twenty, in pascals; the voltage equals the sensitivity over 1000 times that pressure.',
      explain:
        'From sound pressure at the capsule to volts on the wire. 94 dB SPL is exactly 1 pascal — the anchor every sensitivity spec hangs on — so the SPL sets the pressure, and the mic’s millivolts-per-pascal sets the output voltage, also shown in dBV and dBu.',
      keySymbols: ['x²', '−', '/', '×'],
      note: '94 dB SPL is exactly 1 pascal — the anchor every sensitivity spec hangs on.',
      compute: (v) => {
        const p = Math.pow(10, (n(v.spl) - 94) / 20);
        const volts = (n(v.sens) / 1000) * p;
        return [
          { label: 'OUTPUT VOLTAGE', value: volts, quantity: 'voltage', unit: 'mv' },
          { label: 'OUTPUT LEVEL (dBV)', value: 20 * Math.log10(volts), quantity: 'db', chainable: false },
          { label: 'OUTPUT LEVEL (dBu)', value: 20 * Math.log10(volts / V_REF_DBU), quantity: 'db' },
        ];
      },
      steps: (v) => {
        const p = Math.pow(10, (n(v.spl) - 94) / 20);
        const volts = (n(v.sens) / 1000) * p;
        return [
          `Pressure: ${fmt(n(v.spl))} dB SPL is ${fmt(n(v.spl))} − 94 = ${fmt(n(v.spl) - 94)} dB from 1 Pa → p = 10^(${fmt(n(v.spl) - 94)}/20) = ${fmt(p)} Pa.`,
          `Voltage: ${fmt(n(v.sens))} mV/Pa × ${fmt(p)} Pa = ${fmt(volts * 1000)} mV.`,
          `As levels: dBV = 20 × log10(${fmt(volts)}) = ${fmt(20 * Math.log10(volts))}; dBu = 20 × log10(${fmt(volts)}/0.775) = ${fmt(20 * Math.log10(volts / V_REF_DBU))}.`,
        ];
      },
    },
    {
      key: 'gain',
      name: 'Required preamp gain to a target level',
      inputs: ['sens', 'spl', 'target', 'headroom'],
      formula: 'gain = target dBu − mic dBu',
      plainFormula: 'The required gain equals the target output level in dBu minus the mic’s output level in dBu.',
      explain:
        'How much preamp gain a mic needs to reach a working level. Since the mic’s output tracks SPL dB-for-dB, a quiet source needs more gain and a loud one less. The recommended setting subtracts your headroom so peaks have somewhere to go.',
      keySymbols: ['−'],
      note: 'The recommended setting subtracts your headroom so peaks above the entered SPL have somewhere to go.',
      compute: (v) => {
        const p = Math.pow(10, (n(v.spl) - 94) / 20);
        const micDbu = 20 * Math.log10(((n(v.sens) / 1000) * p) / V_REF_DBU);
        const required = n(v.target) - micDbu;
        return [
          { label: 'GAIN TO HIT TARGET (dB)', value: required, quantity: 'db' },
          { label: `RECOMMENDED GAIN LEAVING ${fmt(n(v.headroom))} dB HEADROOM`, value: required - n(v.headroom), quantity: 'db' },
          {
            label: 'EXPECTED LEVELS',
            text: `Mic output ≈ ${fmt(micDbu)} dBu. At the recommended gain the average lands at ${fmt(n(v.target) - n(v.headroom))} dBu; peaks ${fmt(n(v.headroom))} dB above the entered SPL just reach the ${fmt(n(v.target))} dBu target.`,
          },
        ];
      },
      steps: (v) => {
        const p = Math.pow(10, (n(v.spl) - 94) / 20);
        const micDbu = 20 * Math.log10(((n(v.sens) / 1000) * p) / V_REF_DBU);
        const required = n(v.target) - micDbu;
        return [
          `Mic output at ${fmt(n(v.spl))} dB SPL: ${fmt(n(v.sens))} mV/Pa → ${fmt(micDbu)} dBu (see the voltage function for the working).`,
          `Gain = target − mic level = ${fmt(n(v.target))} − (${fmt(micDbu)}) = ${fmt(required)} dB.`,
          `Leaving ${fmt(n(v.headroom))} dB for peaks: set ≈ ${fmt(required - n(v.headroom))} dB.`,
        ];
      },
    },
    {
      key: 'maxspl',
      name: 'Max SPL before the preamp input clips (reverse)',
      inputs: ['sens', 'maxIn'],
      formula: 'SPLmax = 94 + maxIn dBu − mic dBu@94',
      plainFormula:
        'The maximum SPL equals 94 plus the preamp’s input clip level in dBu, minus the mic’s output level at 94 dB SPL.',
      explain:
        'Where the mic’s own output reaches the preamp’s input clip point — the SPL at which you should engage a pad. Because the output tracks SPL dB-for-dB, a hotter mic clips the preamp at a lower SPL. The mic also has its own max-SPL limit to respect.',
      keySymbols: ['−'],
      note: 'Where the MIC OUTPUT alone hits the preamp’s input clip point — engage a pad before this, and remember the mic has its own max-SPL limit too.',
      compute: (v) => {
        const sensDbu = 20 * Math.log10(n(v.sens) / 1000 / V_REF_DBU);
        return [
          { label: 'SPL AT PREAMP INPUT CLIP', value: 94 + n(v.maxIn) - sensDbu, quantity: 'spl' },
          { label: 'MIC LEVEL AT 94 dB SPL', value: sensDbu, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const sensDbu = 20 * Math.log10(n(v.sens) / 1000 / V_REF_DBU);
        return [
          `At 94 dB SPL this mic outputs ${fmt(n(v.sens))} mV = ${fmt(sensDbu)} dBu.`,
          `Mic output tracks SPL dB-for-dB, so it reaches the ${fmt(n(v.maxIn))} dBu clip point at 94 + ${fmt(n(v.maxIn))} − (${fmt(sensDbu)}) = ${fmt(94 + n(v.maxIn) - sensDbu)} dB SPL.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 5 · Limiter Threshold
// ---------------------------------------------------------------------------
const WS_LIMITER: Workspace = {
  id: 'limiter',
  name: 'Limiter Threshold',
  tagline: 'Speaker rating → max voltage → processor threshold',
  section: 'speakers',
  intro:
    'Working backwards from a speaker’s power rating to the voltage it can take, and from ' +
    'there — through the amplifier’s gain — to the threshold to set on the processor that ' +
    'feeds it.',
  whyItMatters:
    'A limiter set from math protects drivers on the worst night, not just the soundcheck. The ' +
    'same processor threshold means a different speaker voltage on every amp, because the amp’s ' +
    'voltage gain sits between them — skip that step and the "protection" is fiction.',
  example:
    'A 500 W / 8 Ω speaker: Vmax = √(500 × 8) ≈ 63.2 V ≈ 38.2 dBu at the speaker. Through an ' +
    'amp with 32 dB of voltage gain, the processor sees clip at 38.2 − 32 = 6.2 dBu; with a ' +
    '3 dB safety margin the RMS threshold starts at ≈ +3.2 dBu.',
  mistakes: [
    'Setting one limiter for both thermal and excursion protection — they need different time constants (slow RMS vs fast peak) and often different frequency ranges.',
    'Using the program (or peak) rating as if it were continuous — program is typically rated 3 dB above continuous, peak 6 dB; a threshold from the wrong rating over-drives the voice coil by that much.',
    'Forgetting amplifier gain when moving a processor between amps — a threshold computed for a 32 dB amp is 6 dB too hot on a 38 dB amp.',
  ],
  warnings:
    'An RMS/average protection STARTING POINT, not a tuned limiter. Thermal and excursion ' +
    'protection need different time constants — and excursion often needs frequency-dependent ' +
    'limiting the single threshold here cannot provide. Speaker rating types (AES, continuous, ' +
    'program, peak) are NOT interchangeable: the math trusts that the wattage you entered is a ' +
    'CONTINUOUS/RMS-style rating, and that is the user’s responsibility to verify. Note your ' +
    'processor’s reference level convention (dBu vs dBFS and its analog reference) before ' +
    'dialing in the result.',
  glossary: ['Limiter', 'Headroom', 'Gain Staging', 'Power', 'Impedance', 'Decibel'],
  fields: [
    { key: 'pwr', name: 'SPEAKER CONTINUOUS RATING', quantity: 'power', placeholder: '500', help: 'The CONTINUOUS (RMS/AES-style) power rating — not program, not peak.', warn: { test: (x) => x <= 0, msg: 'Power rating must be greater than zero.' } },
    { key: 'z', name: 'NOMINAL IMPEDANCE', quantity: 'impedance', placeholder: '8', help: 'The speaker’s nominal impedance; real impedance varies with frequency.', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
    { key: 'ampGain', name: 'AMPLIFIER VOLTAGE GAIN', quantity: 'db', placeholder: '32', help: 'The amp’s voltage gain in dB (spec sheet; 26–44 dB typical).' },
    { key: 'margin', name: 'SAFETY MARGIN', quantity: 'db', placeholder: '3', help: 'Extra dB below the computed clip-equivalent threshold — insurance for rating optimism and impedance dips.' },
  ],
  functions: [
    {
      key: 'maxv',
      name: 'Max continuous speaker voltage',
      inputs: ['pwr', 'z'],
      formula: 'V = √(P · Z)',
      plainFormula: 'The maximum voltage equals the square root of the power times the impedance.',
      explain:
        'Working back from a speaker’s continuous power rating to the RMS voltage that dissipates that power in its nominal impedance — the first step in setting a protection limiter. It also expresses that voltage as a level at the speaker terminals.',
      keySymbols: ['√', '·', 'Z'],
      compute: (v) => {
        const volts = Math.sqrt(n(v.pwr) * n(v.z));
        return [
          { label: 'MAX CONTINUOUS VOLTAGE', value: volts, quantity: 'voltage' },
          { label: 'AS A LEVEL', value: 20 * Math.log10(volts / V_REF_DBU), quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const volts = Math.sqrt(n(v.pwr) * n(v.z));
        return [
          `P = V²/Z rearranges to V = √(P × Z).`,
          `V = √(${fmt(n(v.pwr))} W × ${fmt(n(v.z))} Ω) = ${fmt(volts)} V RMS — the continuous voltage that dissipates the rated power in the nominal impedance.`,
          `As a level: 20 × log10(${fmt(volts)}/0.775) = ${fmt(20 * Math.log10(volts / V_REF_DBU))} dBu at the speaker terminals.`,
        ];
      },
    },
    {
      key: 'threshold',
      name: 'Processor limiter threshold',
      inputs: ['pwr', 'z', 'ampGain', 'margin'],
      formula: 'thr dBu = 20·log10(√(P·Z)/0.775) − ampGain − margin',
      plainFormula:
        'The threshold in dBu equals twenty times the base-ten log of the max speaker voltage (root of power times impedance) over 0.775, minus the amplifier gain, minus the safety margin.',
      explain:
        'Turns a speaker’s voltage limit into a processor threshold by removing the amplifier’s voltage gain and a safety margin. The same threshold means a different speaker voltage on every amp, because the amp’s gain sits between them — an RMS/average protection starting point, not a tuned limiter.',
      keySymbols: ['·', 'log₁₀', '√', '/', '−', 'Z'],
      note: 'RMS/average protection starting point. Verify the processor’s meter reference (dBu vs dBFS) before entering it.',
      compute: (v) => {
        const volts = Math.sqrt(n(v.pwr) * n(v.z));
        const spkDbu = 20 * Math.log10(volts / V_REF_DBU);
        const thr = spkDbu - n(v.ampGain) - n(v.margin);
        const thrV = V_REF_DBU * Math.pow(10, thr / 20);
        return [
          { label: 'THRESHOLD (dBu)', value: thr, quantity: 'db' },
          { label: 'THRESHOLD (dBV)', value: 20 * Math.log10(thrV), quantity: 'db', chainable: false },
          { label: 'THRESHOLD VOLTAGE', value: thrV, quantity: 'voltage', chainable: false },
          {
            label: 'WHAT THIS IS',
            text:
              'An RMS/average protection starting point: the processor level that — after the amp’s ' +
              `${fmt(n(v.ampGain))} dB of gain — keeps continuous voltage ${fmt(n(v.margin))} dB below the rating. ` +
              'Tune attack/release by driver type, and handle excursion separately.',
          },
        ];
      },
      steps: (v) => {
        const volts = Math.sqrt(n(v.pwr) * n(v.z));
        const spkDbu = 20 * Math.log10(volts / V_REF_DBU);
        const thr = spkDbu - n(v.ampGain) - n(v.margin);
        return [
          `Max speaker voltage: √(${fmt(n(v.pwr))} × ${fmt(n(v.z))}) = ${fmt(volts)} V = ${fmt(spkDbu)} dBu.`,
          `Remove the amp’s gain to move to the processor output: ${fmt(spkDbu)} − ${fmt(n(v.ampGain))} = ${fmt(spkDbu - n(v.ampGain))} dBu.`,
          `Subtract the ${fmt(n(v.margin))} dB safety margin: threshold = ${fmt(thr)} dBu (${fmt(V_REF_DBU * Math.pow(10, thr / 20))} V).`,
        ];
      },
    },
  ],
};

export const WORKSPACES_SPL: Workspace[] = [
  WS_SPL_DIST,
  WS_SPL_ADD,
  WS_DOSE,
  WS_MIC_GAIN,
  WS_LIMITER,
];
