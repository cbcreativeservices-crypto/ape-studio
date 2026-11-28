/**
 * PO-01 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan): Stage 3
 * (sample rate) and Stage 7 (loudness, true peak) of Audio Post-Production
 * judge the work against values set in Stage 1, with no view of them there.
 * Each of those two stages now shows ONE read-only line with the Stage 1
 * values it compares against. Pure: the stage screen and the F4 wave test
 * share it. Formatting only: no value is computed or converted.
 */
import { valueKey, type FieldValue } from '../../../features/production/types.ts';

const NOT_SET = 'not set';
const minus = (s: string) => s.replace(/^-/, '−');

function str(v: FieldValue | undefined): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : null;
  if (typeof v === 'string') return v.trim() ? v.trim() : null;
  return null;
}

function rate(v: FieldValue | undefined): string {
  const s = str(v);
  if (!s) return NOT_SET;
  if (s === 'unknown') return 'not yet specified';
  const n = Number(s);
  return Number.isFinite(n) ? `${n / 1000} kHz` : s;
}

function depth(v: FieldValue | undefined): string {
  const s = str(v);
  if (!s) return NOT_SET;
  if (s === 'unknown') return 'not yet specified';
  return s === '32f' ? '32-bit float' : `${s}-bit`;
}

function num(v: FieldValue | undefined, unit: string): string {
  const s = str(v);
  return s ? `${minus(s)} ${unit}` : NOT_SET;
}

/** The Stage 1 values a later Post-Production stage is checked against, or
 *  undefined for a stage that compares against none. */
export function stageBriefLine(lab: string, stageId: string, values: Readonly<Record<string, FieldValue>>): string | undefined {
  if (lab !== 'postprod') return undefined;
  const b = (f: string) => values[valueKey('brief', f)];
  if (stageId === 'session') {
    return `FROM STAGE 1 · delivery ${rate(b('target_sample_rate'))}, ${depth(b('target_bit_depth'))}`;
  }
  if (stageId === 'finish') {
    const tol = str(b('loudness_tolerance'));
    return `FROM STAGE 1 · loudness target ${num(b('loudness_target'), 'LUFS')}${tol ? ` ±${tol} LU` : ''} · true-peak ceiling ${num(b('true_peak_max'), 'dBTP')}`;
  }
  return undefined;
}
