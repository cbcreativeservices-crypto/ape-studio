/**
 * THE LAB 5 WORKSHEET (group 5) — the big-band lesson's observation sheet
 * (source_text/Jazz-Big-Band-Miking-Technique.txt, its sheet at the end;
 * jazz_big_band/GEOMETRY_PROPOSAL.md "becomes the shared Lab 5 worksheet")
 * generalised for every Lab 5 ensemble lesson. Pure; tested
 * (test/mikingLab5Sections.test.ts).
 *
 *   the goal and the listener, the reference passage, the SEATING SKETCH
 *   (exported from the seating builder as words: rows from the front, each
 *   left to right as the conductor faces them), doubles and movement;
 *   a TWO-POSITION COMPARISON — the same rows for position A and position B
 *   (what it covers, the mic type and pattern, distance and height, aim, the
 *   one variable changed, articulation and blend, spill and room, the peak
 *   and headroom check, mono with any support, clearance and live margin);
 *   the approach chosen and why, the PA, monitor and recording or stream
 *   channels, and the compromise that remains.
 *
 * The sheet is optional and never gates credit (observations.ts). The
 * engine's practice page lists `practice.fields` in order; a field id stays
 * under 32 characters (the store's sanitiser).
 */
import type { Lesson } from '../../../engine/model/types.ts';
import type { Seating } from './seating.ts';

export type SheetField = Lesson['practice']['fields'][number];

/** The two-position rows (the big-band sheet's, in its order). */
export const COMPARE_ROWS: readonly { id: string; label: string }[] = [
  { id: 'target', label: 'What it covers: the target and the players' },
  { id: 'mic', label: 'Mic type and pickup pattern' },
  { id: 'dist', label: 'Distance to the target, and height' },
  { id: 'aim', label: 'Aim or angle, and how the mic is turned' },
  { id: 'change', label: 'The one variable you changed' },
  { id: 'blend', label: 'Articulation and blend' },
  { id: 'spill', label: 'Spill and how much room' },
  { id: 'peak', label: 'Full peak and headroom check' },
  { id: 'mono', label: 'Mono, with any support mic in' },
  { id: 'clear', label: 'Player clearance and live margin' },
];

/** The seating as words: rows from the front (downstage), each left to right
 *  as the conductor faces the players — the sketch the builder exports. */
export function seatingSketch(s: Seating): string {
  const players = s.seats.filter((q) => q.kind !== 'conductor');
  const byZ = [...players].sort((a, b) => b.p.z - a.p.z);
  const rows: (typeof players)[] = [];
  for (const q of byZ) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].p.z - q.p.z) <= 700) last.push(q);
    else rows.push([q]);
  }
  const label = (sec: string) => s.sections.find((x) => x.id === sec)?.label ?? sec;
  const words = rows.map((r) => {
    const names: string[] = [];
    for (const q of [...r].sort((a, b) => a.p.x - b.p.x)) {
      const n = label(q.section);
      if (names[names.length - 1] !== n) names.push(n);
    }
    return names.join(', ');
  });
  const tag = (i: number) => (i === 0 ? 'front' : i === words.length - 1 ? 'back' : 'then');
  return `${words.map((w, i) => `${words.length > 1 ? `${tag(i)}: ` : ''}${w}`).join(' · ')}`;
}

/**
 * The worksheet's fields for a lesson: `seating` gives the sketch (as drawn,
 * to be corrected to the real band's), `noun` the ensemble ("band",
 * "section", "group").
 */
export function lab5Worksheet(o: { seating: Seating; noun: string }): SheetField[] {
  return [
    { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'reinforcement', 'both'] },
    { id: 'listener', label: 'The goal and the listener: who hears it, where', kind: 'text' },
    { id: 'ref', label: 'Reference passage and its musical role', kind: 'text' },
    { id: 'sketch', label: `Seating sketch — as drawn here: ${seatingSketch(o.seating)}. Your ${o.noun}’s, as the conductor faces it:`, kind: 'text' },
    { id: 'moves', label: 'Doubles, mutes, solos and movement checked', kind: 'text' },
    ...(['a', 'b'] as const).flatMap((p) => COMPARE_ROWS.map((r) => ({ id: `${p}.${r.id}`, label: `POSITION ${p.toUpperCase()} · ${r.label}`, kind: 'text' as const }))),
    { id: 'choice', label: 'The approach you chose, and why', kind: 'text' },
    { id: 'pa', label: 'PA channels', kind: 'text' },
    { id: 'mon', label: 'Monitor sends', kind: 'text' },
    { id: 'rec', label: 'Recording or stream channels', kind: 'text' },
    { id: 'notes', label: 'The compromise that remains (in words)', kind: 'text' },
  ];
}
