/**
 * Workspaces — Loudness (owner buildout 2026-08-07):
 * Loudness Normalization · Loudness & True-Peak (ITU-R BS.1770-5 mechanics).
 * Section 'levels'. Same pattern as wave.ts.
 *
 * LUFS / LU / dBTP have no dedicated QuantityKind; they ride 'number' fields
 * whose LABELS carry the unit, while gain CHANGES use 'db' (1 LU = 1 dB).
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const LOUDNORM: Workspace = {
  id: 'loudnorm',
  name: 'Loudness Normalization',
  tagline: 'Match a target LUFS & keep true peak safe',
  section: 'levels',
  reportPrefix: 'LUFS',
  intro:
    'Streaming and broadcast normalize everything to a loudness target in LUFS. This finds the gain ' +
    'change to hit a target from your measured integrated loudness, then checks whether that move ' +
    'pushes your true peak past a safe ceiling.',
  whyItMatters:
    'Master too loud and the platform turns you DOWN (and your dynamics were crushed for nothing); ' +
    'too quiet and you’re turned up but sit weak next to others. Normalization is level, not tone — ' +
    'the goal is to land on target with peaks under the ceiling so no limiter fires on playback.',
  example:
    'A master at −9 LUFS aimed at Spotify’s −14 LUFS needs −5 dB of gain. A −0.5 dBTP true peak then ' +
    'moves to −5.5 dBTP — comfortably under a −1 dBTP ceiling, so no extra limiting is needed.',
  mistakes: [
    'Mastering hotter than the target "to be safe" — the platform just attenuates it, so you lost loudness AND dynamics for nothing.',
    'Forgetting true peak moves WITH the gain — lowering loudness also lowers peaks; RAISING loudness can push peaks over the ceiling.',
    'Confusing LUFS (a loudness average) with dBTP (a peak) — you must satisfy both the loudness target and the peak ceiling.',
  ],
  warnings:
    'Level-only model: gain = target − measured (1 LU = 1 dB); resulting true peak = old TP + gain. ' +
    'Real integrated loudness is the gated K-weighted BS.1770 measurement of the whole program — ' +
    'this assumes you already measured it correctly.',
  glossary: ['LUFS', 'True Peak', 'Loudness', 'Dynamic Range', 'Gain Staging'],
  fields: [
    { key: 'measured', name: 'MEASURED LOUDNESS (LUFS)', quantity: 'number', placeholder: '-9', help: 'Your program’s integrated loudness, in LUFS.' },
    { key: 'target', name: 'TARGET LOUDNESS (LUFS)', quantity: 'number', placeholder: '-14', help: 'The platform’s loudness target, in LUFS.' },
    { key: 'truePeak', name: 'CURRENT TRUE PEAK (dBTP)', quantity: 'number', placeholder: '-0.5', help: 'Your master’s measured true-peak level, in dBTP.' },
    { key: 'ceiling', name: 'TRUE-PEAK CEILING (dBTP)', quantity: 'number', placeholder: '-1', help: 'The maximum true peak you’ll allow, in dBTP.' },
  ],
  functions: [
    {
      key: 'normalize',
      name: 'Gain to hit a target & peak check',
      inputs: ['measured', 'target', 'truePeak', 'ceiling'],
      formula: 'gain = target − measured · new TP = TP + gain',
      plainFormula:
        'The gain change equals the target loudness minus your measured loudness; the new true peak equals the old true peak plus that same gain.',
      explain:
        'Streaming and broadcast normalize everything to a loudness target in LUFS, where one LU equals one dB. This finds the level move to reach the target from your measured integrated loudness, then adds that same move to your true peak to confirm it stays under the ceiling. It changes level, not tone.',
      keySymbols: ['−'],
      compute: (v) => {
        const gain = n(v.target) - n(v.measured);
        const newTP = n(v.truePeak) + gain;
        const over = newTP - n(v.ceiling);
        return [
          { label: 'GAIN CHANGE', value: gain, quantity: 'db' },
          { label: 'RESULTING TRUE PEAK (dBTP)', value: newTP, quantity: 'number', chainable: false },
          { label: over > 0 ? 'LIMITING NEEDED' : 'HEADROOM TO CEILING', value: Math.abs(over), quantity: 'db', chainable: false },
        ];
      },
      table: () => ({
        title: 'COMMON LOUDNESS TARGETS',
        cols: ['Platform', 'Target (LUFS)', 'Ceiling (dBTP)'],
        rows: [
          ['Spotify / Amazon / YouTube', '−14', '−1'],
          ['Apple Music', '−16', '−1'],
          ['Broadcast (EBU R128)', '−23', '−1'],
          ['Broadcast (ATSC A/85)', '−24', '−2'],
        ],
      }),
      steps: (v) => {
        const gain = n(v.target) - n(v.measured);
        const newTP = n(v.truePeak) + gain;
        const over = newTP - n(v.ceiling);
        return [
          `Gain = ${fmt(n(v.target))} − (${fmt(n(v.measured))}) = ${fmt(gain)} dB (${gain >= 0 ? 'turn up' : 'turn down'}).`,
          `True peak moves to ${fmt(n(v.truePeak))} + ${fmt(gain)} = ${fmt(newTP)} dBTP.`,
          over > 0
            ? `That is ${fmt(over)} dB OVER the ${fmt(n(v.ceiling))} dBTP ceiling — limit or lower before export.`
            : `That leaves ${fmt(-over)} dB under the ${fmt(n(v.ceiling))} dBTP ceiling — safe.`,
        ];
      },
    },
  ],
};

const LOUDTP: Workspace = {
  id: 'loudtp',
  name: 'Loudness & True-Peak (BS.1770-5)',
  tagline: 'Windows, LU differences & true-peak margin',
  section: 'levels',
  reportPrefix: 'BS1770',
  intro:
    'ITU-R BS.1770-5 defines how loudness is actually measured: K-weighting, gating, and fixed ' +
    'time windows, with true peak found by oversampling. This workspace makes the mechanics ' +
    'concrete — window sizes, what an LU difference means, and how much margin true peak needs.',
  whyItMatters:
    'Understanding the measurement stops the guesswork: why momentary and short-term meters react at ' +
    'different speeds, why 10 LU sounds roughly twice as loud, and why a track that reads −0.1 dBFS ' +
    'on a sample meter can still clip a converter or codec on the true-peak meter.',
  example:
    'At 48 kHz the momentary (400 ms) window is 19,200 samples and the short-term (3 s) window is ' +
    '144,000. A section 6 LU louder than another sounds about 2^(6/10) ≈ 1.5× as loud.',
  mistakes: [
    'Trusting a sample-peak meter for delivery — inter-sample peaks can ride up to ~3 dB higher; only a true-peak (oversampled) meter catches them.',
    'Treating momentary, short-term, and integrated readings as one number — they use different windows and gating and answer different questions.',
    'Assuming +6 dB is "twice as loud" — the rough psychoacoustic doubling is about +10 LU, not +6.',
  ],
  warnings:
    'Teaching mechanics only. Window lengths: momentary 400 ms, short-term 3 s (75% overlap). ' +
    'Perceived-loudness doubling ≈ +10 LU is a psychoacoustic rule of thumb. Real BS.1770 loudness ' +
    'requires the full gated K-weighted algorithm on the audio; true peak requires ≥4× oversampling.',
  glossary: ['LUFS', 'True Peak', 'K-weighting', 'Loudness', 'Gating'],
  fields: [
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'Sample rate, to size the measurement windows.', warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'lufsA', name: 'LOUDNESS A (LUFS)', quantity: 'number', placeholder: '-14', help: 'First loudness value to compare, in LUFS.' },
    { key: 'lufsB', name: 'LOUDNESS B (LUFS)', quantity: 'number', placeholder: '-20', help: 'Second loudness value to compare, in LUFS.' },
    { key: 'samplePeak', name: 'SAMPLE PEAK (dBFS)', quantity: 'number', placeholder: '-0.1', help: 'The peak read by a sample-based meter, in dBFS.' },
    { key: 'lossy', name: 'LOSSY DELIVERY?', quantity: 'number', placeholder: '0', help: 'Enter 1 if the target is a lossy codec (MP3/AAC), 0 if lossless.' },
  ],
  functions: [
    {
      key: 'windows',
      name: 'Measurement window sizes',
      inputs: ['sr'],
      formula: 'momentary = 0.4 s · short-term = 3 s (× sample rate)',
      plainFormula:
        'The momentary window is 0.4 seconds and the short-term window is 3 seconds, each multiplied by the sample rate to get a length in samples.',
      explain:
        'BS.1770 measures loudness over fixed time windows. This turns those windows — 400 ms for the fast momentary meter and 3 s for the smoothed short-term meter — into a count of samples at your sample rate, and shows the 100 ms block step (75% overlap) that makes the two meters react at different speeds.',
      keySymbols: ['×'],
      compute: (v) => {
        return [
          { label: 'MOMENTARY WINDOW (400 ms)', value: 0.4 * n(v.sr), quantity: 'samples', chainable: false },
          { label: 'SHORT-TERM WINDOW (3 s)', value: 3 * n(v.sr), quantity: 'samples', chainable: false },
          { label: 'BLOCK STEP (75% overlap)', value: 0.1 * n(v.sr), quantity: 'samples', chainable: false },
        ];
      },
      steps: (v) => [
        `Momentary = 0.4 s × ${fmt(n(v.sr))} = ${fmt(0.4 * n(v.sr))} samples; short-term = 3 s × ${fmt(n(v.sr))} = ${fmt(3 * n(v.sr))} samples.`,
        `Blocks overlap 75%, stepping every 100 ms (${fmt(0.1 * n(v.sr))} samples) — why the momentary meter reacts fast and the short-term meter smooths.`,
      ],
    },
    {
      key: 'loudnessDelta',
      name: 'Loudness difference & perceived ratio',
      inputs: ['lufsA', 'lufsB'],
      formula: 'ΔLU = A − B · perceived ≈ 2^(ΔLU/10)',
      plainFormula:
        'The loudness difference in LU equals A minus B; the perceived loudness ratio is about two raised to that difference divided by ten.',
      explain:
        'Compares two loudness values (one LU equals one dB) and estimates how much louder one sounds. Because a change of roughly ten LU is heard as about twice as loud, the perceived ratio is two raised to the difference over ten — a psychoacoustic rule of thumb, not an exact law.',
      keySymbols: ['Δ', '−', '/', '≈', 'x²'],
      compute: (v) => {
        const d = n(v.lufsA) - n(v.lufsB);
        return [
          { label: 'DIFFERENCE (LU)', value: d, quantity: 'number' },
          { label: 'PERCEIVED LOUDNESS RATIO', value: Math.pow(2, Math.abs(d) / 10), quantity: 'ratio', chainable: false },
        ];
      },
      steps: (v) => {
        const d = n(v.lufsA) - n(v.lufsB);
        return [
          `ΔLU = ${fmt(n(v.lufsA))} − (${fmt(n(v.lufsB))}) = ${fmt(d)} LU (1 LU = 1 dB).`,
          `Rough perceived ratio ≈ 2^(${fmt(Math.abs(d))}/10) = ${fmt(Math.pow(2, Math.abs(d) / 10))}× — the +10 LU ≈ twice-as-loud rule of thumb.`,
        ];
      },
    },
    {
      key: 'truePeakMargin',
      name: 'True-peak ceiling & sample-peak margin',
      inputs: ['samplePeak', 'lossy'],
      formula: 'ceiling = −1 dBTP (lossless) or −2 dBTP (lossy)',
      plainFormula:
        'The recommended true-peak ceiling is minus one dBTP for lossless delivery, or minus two dBTP for lossy delivery.',
      explain:
        'Picks a safe true-peak ceiling and shows your margin to it. A sample-peak meter can under-read: true inter-sample peaks can sit up to about 3 dB higher, and lossy encoding (MP3/AAC) adds overshoot — so lossy delivery drops the ceiling from −1 to −2 dBTP. Measure true peak with an oversampling meter to be sure.',
      keySymbols: ['−'],
      note: 'Inter-sample peaks can exceed the sample peak by up to ~3 dB; lossy encoding adds overshoot, so drop the ceiling.',
      compute: (v) => {
        const ceiling = n(v.lossy) >= 1 ? -2 : -1;
        return [
          { label: 'RECOMMENDED CEILING (dBTP)', value: ceiling, quantity: 'number', chainable: false },
          { label: 'SAMPLE-PEAK HEADROOM TO 0 dBFS', value: -n(v.samplePeak), quantity: 'db', chainable: false },
          { label: 'MARGIN TO CEILING', value: ceiling - n(v.samplePeak), quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const ceiling = n(v.lossy) >= 1 ? -2 : -1;
        return [
          `${n(v.lossy) >= 1 ? 'Lossy' : 'Lossless'} delivery → recommended true-peak ceiling ${fmt(ceiling)} dBTP.`,
          `Your sample peak of ${fmt(n(v.samplePeak))} dBFS is ${fmt(-n(v.samplePeak))} dB below full scale — but true peak can sit up to ~3 dB higher.`,
          `Margin from sample peak to the ceiling = ${fmt(ceiling - n(v.samplePeak))} dB; measure true peak with an oversampling meter to be sure.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_LOUDNESS: Workspace[] = [LOUDNORM, LOUDTP];
