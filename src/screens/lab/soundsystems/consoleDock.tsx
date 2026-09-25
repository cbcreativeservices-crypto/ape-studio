/**
 * Console controls for the Rack Unit dock — the dB faders ROUTE and OPERATE
 * bind to the shared lane (a channel fader, a send pot, a DCA, a wedge send).
 * The lane is 0..1; these own the dB mapping, the 1 dB snap and the OFF
 * floor the console engine uses.
 */
import type { DockParam } from '../rack/rackTypes';
import { lanePos, laneVal } from './rackLayout';

export const fmtDb = (db: number): string => (db <= -60 ? 'OFF' : `${db > 0 ? '+' : ''}${db}`);

/** A dB fader on the lane. Values at or below −60 read OFF (the engine's
 *  floor); `home` is the honest neutral (unity for a fader, 0 dB for a send). */
export function dbFader(opts: {
  id: string;
  label: string;
  db: number;
  min: number;
  max: number;
  onChange: (db: number) => void;
  /** Unity / nominal, in dB. Omit when the control has no honest home. */
  home?: number;
  level?: boolean;
  tint?: string;
  /** Suffix for the full readout, e.g. "to the wedge". */
  of?: string;
  chooser?: Extract<DockParam, { kind: 'fader' }>['chooser'];
}): DockParam {
  const snap = (p: number) => laneVal(p, opts.min, opts.max, 1);
  return {
    kind: 'fader',
    id: opts.id,
    label: opts.label,
    value: lanePos(opts.db, opts.min, opts.max),
    onChange: (p) => {
      const db = snap(p);
      if (db !== opts.db) opts.onChange(db);
    },
    format: (p) => `${fmtDb(snap(p))}${snap(p) <= -60 ? '' : ' dB'}${opts.of ? ` ${opts.of}` : ''}${opts.home != null && snap(p) === opts.home ? ' · unity' : ''}`,
    formatShort: (p) => (snap(p) <= -60 ? 'OFF' : `${fmtDb(snap(p))} dB`),
    home: opts.home != null ? lanePos(opts.home, opts.min, opts.max) : undefined,
    level: opts.level,
    tint: opts.tint,
    chooser: opts.chooser,
  };
}
