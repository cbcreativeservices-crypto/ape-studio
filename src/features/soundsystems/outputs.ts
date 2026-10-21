/**
 * Sound Systems Lab — the console's OUTPUTS (finding WF-SS-02, owner go
 * 2026-10-20: "cables from the console carry WHICH output (main L/R, aux
 * 1–8), so the lab can check a wedge is fed from an aux and stereo is wired
 * L/R").
 *
 * Seventeen outputs: MAIN L, MAIN R and the MAIN MONO sum, Aux 1–10 and Matrix
 * 1–4. The aux purposes come from the lab console itself (`bandConsole()`),
 * so the BUILD check and the ROUTE pages can never disagree about what Aux 6
 * is for. Pure data — no React.
 */
import { bandConsole, type AuxPurpose } from './console';
import type { ConsoleOut } from './types';

export const CONSOLE_OUTS: readonly ConsoleOut[] = [
  'mainL',
  'mainR',
  'mainMono',
  'aux1',
  'aux2',
  'aux3',
  'aux4',
  'aux5',
  'aux6',
  'aux7',
  'aux8',
  'aux9',
  'aux10',
  'mtx1',
  'mtx2',
  'mtx3',
  'mtx4',
];

export type OutFamily = 'main' | 'aux' | 'mtx';

export function outFamily(o: ConsoleOut): OutFamily {
  return o.startsWith('main') ? 'main' : o.startsWith('aux') ? 'aux' : 'mtx';
}

/** The stereo in-ear pair (round-3 grade R3-SS-01, owner: a dedicated
 *  in-ear pair): Aux 9 · In-ears L and Aux 10 · In-ears R, used for nothing
 *  else. A pack fed two auxes passes as stereo ONLY on this pair — never on
 *  Aux 7, the announce feed for the lobby matrix. */
export const IEM_PAIR: readonly [ConsoleOut, ConsoleOut] = ['aux9', 'aux10'];

/** Is this pair of outputs the stereo in-ear pair? */
export function isIemPair(pair: readonly ConsoleOut[] | undefined | null): boolean {
  return !!pair && pair.length === 2 && pair.includes(IEM_PAIR[0]) && pair.includes(IEM_PAIR[1]);
}

/** The console matrix each MTX output is (console.ts ids). */
export const MTX_MATRIX: Record<'mtx1' | 'mtx2' | 'mtx3' | 'mtx4', string> = {
  mtx1: 'mx-subs',
  mtx2: 'mx-fills',
  mtx3: 'mx-lobby',
  mtx4: 'mx-rec',
};

const MTX_WORD: Record<keyof typeof MTX_MATRIX, string> = { mtx1: 'SUBS', mtx2: 'FILLS', mtx3: 'LOBBY', mtx4: 'REC' };

const CONSOLE = bandConsole();

/** What an aux is for on the lab console; null for a main or a matrix. */
export function auxPurpose(o: ConsoleOut): AuxPurpose | null {
  if (outFamily(o) !== 'aux') return null;
  return CONSOLE.auxes.find((a) => a.id === o)?.purpose ?? null;
}

/** The short tag the plot prints beside a loudspeaker: "MAIN L", "AUX 2",
 *  "MTX 1". Short on purpose — neighbouring wedges stand 40 units apart. */
export function outTag(o: ConsoleOut): string {
  if (o === 'mainL') return 'MAIN L';
  if (o === 'mainR') return 'MAIN R';
  if (o === 'mainMono') return 'MONO';
  return outFamily(o) === 'aux' ? `AUX ${o.slice(3)}` : `MTX ${o.slice(3)}`;
}

/** The label a list or card prints: "MAIN L", "MAIN MONO", "AUX 2",
 *  "MTX 1 · SUBS". */
export function outLabel(o: ConsoleOut): string {
  if (o === 'mainMono') return 'MAIN MONO';
  if (outFamily(o) === 'mtx') return `${outTag(o)} · ${MTX_WORD[o as keyof typeof MTX_WORD]}`;
  return outTag(o);
}

/** The full name, with what it is for on this console: "Aux 2 · Wedge 2",
 *  "Matrix 1 · Subs", "Main L". */
export function outName(o: ConsoleOut): string {
  if (o === 'mainL') return 'Main L';
  if (o === 'mainR') return 'Main R';
  if (o === 'mainMono') return 'Main mono (L + R summed)';
  if (outFamily(o) === 'aux') return CONSOLE.auxes.find((a) => a.id === o)?.name ?? `Aux ${o.slice(3)}`;
  return CONSOLE.matrices.find((m) => m.id === MTX_MATRIX[o as keyof typeof MTX_MATRIX])?.name ?? `Matrix ${o.slice(3)}`;
}

/** What the output is for, in one plain line (the OUTPUT tray). */
export function outUse(o: ConsoleOut): string {
  if (o === 'mainL') return 'The house mix, left side.';
  if (o === 'mainR') return 'The house mix, right side.';
  if (o === 'mainMono') return 'The house mix with left and right summed — the same signal everywhere.';
  if (outFamily(o) === 'mtx') return `${outName(o)}: whole buses mixed again, with their own level and delay.`;
  switch (auxPurpose(o)) {
    case 'monitor':
      return `${outName(o)}: a monitor mix for one position.`;
    case 'iem':
      return IEM_PAIR.includes(o)
        ? `${outName(o)}: one side of the stereo in-ear pair. Send Aux 9 and Aux 10 to the transmitter together.`
        : `${outName(o)}: the in-ear mix, for the transmitter.`;
    case 'fx':
      return `${outName(o)}: the effects send — it feeds the reverb, not a loudspeaker.`;
    case 'sub':
      return `${outName(o)}: the sub feed, the low sources only.`;
    default:
      return `${outName(o)}: the announce feed for the lobby matrix.`;
  }
}

/** The tag for a loudspeaker whose cable carries no single output. */
export const OUT_UNSET = 'OUT ?';

export function isConsoleOut(v: unknown): v is ConsoleOut {
  return typeof v === 'string' && (CONSOLE_OUTS as readonly string[]).includes(v);
}
