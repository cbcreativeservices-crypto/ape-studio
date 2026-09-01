/**
 * Workspace: Compressor Math (owner 2026-08-10) — the static (post-attack)
 * transfer of a hard-knee downward compressor: threshold, ratio, input level →
 * output level and gain reduction, with reverse solves for the ratio and the
 * threshold. Authored to the WS_WAVE exemplar: every direction is its own
 * explicit function with worked, number-substituted steps.
 *
 * HONESTY: this is the STEADY-STATE, HARD-KNEE model — the gain the compressor
 * settles to once attack has finished, with an abrupt corner at the threshold.
 * Real compressors add a soft knee (gradual onset near the threshold), attack
 * and release timing (so momentary gain reduction differs during transients),
 * and program-dependent behaviour. The math here is the backbone every one of
 * those refinements bends around.
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const WS_COMPRESSOR: Workspace = {
  id: 'compressor',
  name: 'Compressor Math',
  tagline: 'Threshold · ratio · input → output & gain reduction',
  section: 'levels',
  reportPrefix: 'CMP',
  intro:
    'What a ratio actually does to a level. Above the threshold, a compressor lets only 1/ratio ' +
    'of every extra decibel through; below it, the signal passes untouched. Enter threshold, ' +
    'ratio and an input level and the lab returns the output level and the exact gain reduction — ' +
    'and solves backwards for the ratio or threshold you would need to hit a target.',
  whyItMatters:
    'Ratio and threshold are abstract until you can predict the number on the meter. Knowing that ' +
    'a −8 dBFS peak, 12 dB over a −20 threshold at 4:1, lands at −17 dBFS (9 dB of gain reduction) ' +
    'is what lets you set a compressor deliberately instead of by ear-and-hope — and what makes ' +
    'gain staging into and out of the processor predictable.',
  example:
    'Threshold −20 dBFS, ratio 4:1, input −8 dBFS. The signal is 12 dB above threshold, so only ' +
    '12 ÷ 4 = 3 dB gets through above the threshold: output = −20 + 3 = −17 dBFS. Only 3 of the 12 dB ' +
    'of overshoot survived, so that is 9 dB of gain reduction — the number the GR meter would settle ' +
    'on once the attack has finished.',
  mistakes: [
    'Applying the ratio to the WHOLE level instead of only the part ABOVE threshold — a 4:1 ratio does not make a −8 dBFS signal −2 dBFS; it acts on the 12 dB of overshoot, not the full level.',
    'Reading the settled (steady-state) gain reduction as the peak reduction — attack time means transients briefly get LESS reduction than this static math predicts; release means it lingers after the signal drops.',
    'Forgetting a signal below threshold is untouched — no ratio does anything until the level crosses the threshold.',
    'Confusing gain reduction with makeup gain — GR is how much the loud parts are pushed DOWN; makeup gain is a separate, opposite move to bring the whole signal back up afterward.',
    'Treating a hard-knee number as exact on a soft-knee unit — a soft knee starts compressing gently BELOW the nominal threshold, so real gain reduction near the corner is less than this model shows.',
  ],
  warnings:
    'Static hard-knee model: output = threshold + (input − threshold) / ratio for levels at or ' +
    'above the threshold, and output = input below it. It ignores knee shape, attack/release ' +
    'timing, and any program-dependent (auto) behaviour — so it predicts the SETTLED gain, not ' +
    'the moment-to-moment gain reduction during a transient.',
  glossary: ['Compression', 'Threshold', 'Ratio', 'Gain Reduction', 'Makeup Gain', 'Dynamic Range'],
  fields: [
    { key: 'thr', name: 'THRESHOLD', quantity: 'db', placeholder: '-20', help: 'The level (dBFS) above which compression begins. Below it, the signal is untouched.' },
    { key: 'ratio', name: 'RATIO (n:1)', quantity: 'number', placeholder: '4', help: 'How many dB must go IN above threshold for 1 dB to come OUT above it. 4 means 4:1.', warn: { test: (x) => x < 1, msg: 'Ratio must be at least 1:1 (1:1 is no compression).' } },
    { key: 'inLvl', name: 'INPUT LEVEL', quantity: 'db', placeholder: '-8', help: 'The incoming signal level (dBFS) whose compressed output you want.' },
    { key: 'targetOut', name: 'TARGET OUTPUT', quantity: 'db', placeholder: '-17', help: 'The output level (dBFS) you want a given input to land on.' },
    { key: 'targetGr', name: 'TARGET GAIN REDUCTION', quantity: 'db', placeholder: '3', help: 'How many dB of gain reduction you want on a given input.', warn: { test: (x) => x < 0, msg: 'Gain reduction is a positive number of dB.' } },
  ],
  functions: [
    {
      key: 'outFromRatio',
      name: 'Output & gain reduction from threshold, ratio, input',
      inputs: ['thr', 'ratio', 'inLvl'],
      formula: 'out = thr + (in − thr)/ratio · GR = in − out',
      plainFormula:
        'The output equals the threshold plus the input’s amount above the threshold divided by the ratio; the gain reduction equals the input minus the output.',
      explain:
        'Above the threshold a compressor lets only one part in “ratio” of each extra decibel through. It takes how far the input sits above the threshold, divides that overshoot by the ratio, and adds it back onto the threshold — that is the output. Gain reduction is just how far the output landed below the input. A signal below the threshold passes untouched.',
      keySymbols: ['−', '/'],
      note: 'Settled hard-knee gain. A signal below threshold passes at unity (0 dB reduction).',
      compute: (v) => {
        const thr = n(v.thr);
        const r = n(v.ratio);
        const inp = n(v.inLvl);
        const above = inp - thr;
        const out = above > 0 ? thr + above / r : inp;
        const gr = inp - out;
        return [
          { label: 'OUTPUT LEVEL', value: out, quantity: 'db' },
          { label: 'GAIN REDUCTION', value: gr, quantity: 'db', chainable: false },
          { label: 'INPUT ABOVE THRESHOLD', value: Math.max(0, above), quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const thr = n(v.thr);
        const r = n(v.ratio);
        const inp = n(v.inLvl);
        const above = inp - thr;
        if (above <= 0) {
          return [
            `The input (${fmt(inp)} dBFS) is at or below the threshold (${fmt(thr)} dBFS), so the compressor does nothing.`,
            `Output = input = ${fmt(inp)} dBFS, gain reduction = 0 dB.`,
          ];
        }
        const out = thr + above / r;
        return [
          `Only the part ABOVE threshold is compressed: ${fmt(inp)} − (${fmt(thr)}) = ${fmt(above)} dB over.`,
          `At ${fmt(r)}:1, that ${fmt(above)} dB becomes ${fmt(above)} ÷ ${fmt(r)} = ${fmt(above / r)} dB above threshold.`,
          `Output = threshold + that = ${fmt(thr)} + ${fmt(above / r)} = ${fmt(out)} dBFS.`,
          `Gain reduction = input − output = ${fmt(inp)} − (${fmt(out)}) = ${fmt(inp - out)} dB.`,
        ];
      },
    },
    {
      key: 'ratioForOut',
      name: 'Ratio needed for a target output (reverse)',
      inputs: ['thr', 'inLvl', 'targetOut'],
      formula: 'ratio = (in − thr) / (out − thr)',
      plainFormula:
        'The ratio equals the input’s amount above the threshold divided by the wanted output’s amount above the threshold.',
      explain:
        'Works backwards from a target. It compares how far the input sits above the threshold with how far you want the output to sit above it — the bigger that gap, the higher the ratio needed. If the target output is below the threshold, no downward ratio can reach it; only makeup gain or a lower threshold would.',
      keySymbols: ['−', '/'],
      note: 'Requires the input to be above threshold and the target output to sit between threshold and input.',
      compute: (v) => {
        const thr = n(v.thr);
        const inp = n(v.inLvl);
        const out = n(v.targetOut);
        const above = inp - thr;
        const outAbove = out - thr;
        const ratio = above / outAbove;
        return [
          { label: 'REQUIRED RATIO (n:1)', value: ratio, quantity: 'number' },
          { label: 'GAIN REDUCTION IT GIVES', value: inp - out, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const thr = n(v.thr);
        const inp = n(v.inLvl);
        const out = n(v.targetOut);
        const above = inp - thr;
        const outAbove = out - thr;
        return [
          `Input above threshold: ${fmt(inp)} − (${fmt(thr)}) = ${fmt(above)} dB.`,
          `Wanted output above threshold: ${fmt(out)} − (${fmt(thr)}) = ${fmt(outAbove)} dB.`,
          `ratio = in-above ÷ out-above = ${fmt(above)} ÷ ${fmt(outAbove)} = ${fmt(above / outAbove)} → ${fmt(above / outAbove)}:1.`,
          `(If the target output is below the threshold, no downward-compression ratio can reach it — only makeup gain or a lower threshold would.)`,
        ];
      },
    },
    {
      key: 'thrForGr',
      name: 'Threshold for a target gain reduction (reverse)',
      inputs: ['inLvl', 'ratio', 'targetGr'],
      formula: 'thr = in − GR·ratio/(ratio − 1)',
      plainFormula:
        'The threshold equals the input minus the gain reduction times the ratio, divided by the ratio minus one.',
      explain:
        'Sets the threshold so a known input gets exactly the gain reduction you want. It converts your target gain reduction into how far above the threshold the input must sit (which depends on the ratio), then drops the threshold that far below the input. At 1:1 there is no gain reduction, so no threshold can produce the target.',
      keySymbols: ['−', '·', '/'],
      note: 'How low to set the threshold so a known input gets exactly the gain reduction you want.',
      compute: (v) => {
        const inp = n(v.inLvl);
        const r = n(v.ratio);
        const gr = n(v.targetGr);
        const above = r > 1 ? (gr * r) / (r - 1) : Infinity;
        const thr = inp - above;
        return [
          { label: 'SET THRESHOLD TO', value: thr, quantity: 'db' },
          { label: 'INPUT WILL SIT ABOVE IT BY', value: above, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const inp = n(v.inLvl);
        const r = n(v.ratio);
        const gr = n(v.targetGr);
        if (r <= 1) {
          return [`At 1:1 the compressor makes no gain reduction, so no threshold produces ${fmt(gr)} dB — raise the ratio first.`];
        }
        const above = (gr * r) / (r - 1);
        return [
          `Gain reduction relates to how far the input sits above threshold: GR = above × (1 − 1/ratio).`,
          `Solve for "above": above = GR ÷ (1 − 1/ratio) = ${fmt(gr)} ÷ (1 − 1/${fmt(r)}) = ${fmt(gr)} ÷ ${fmt(1 - 1 / r)} = ${fmt(above)} dB.`,
          `Threshold = input − above = ${fmt(inp)} − ${fmt(above)} = ${fmt(inp - above)} dBFS.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_DYNAMICS: Workspace[] = [WS_COMPRESSOR];
