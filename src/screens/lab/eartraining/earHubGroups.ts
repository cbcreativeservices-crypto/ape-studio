/**
 * The Ear Training hub's module groups and opening words (beginner waves 1-3,
 * owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan items ET-02 and
 * ET-04).
 *
 * The hub listed fourteen modules in one flat list under MODULES, opened on a
 * technical paragraph about analyzers and adaptive levels, and nothing said
 * which module to try first. Now four labeled groups (by the registry's own
 * `family`), a "start here" mark on module 1, and one plain opening line.
 * Every module stays open; no order is enforced, and the module numbers and
 * the registry order (used by the end screen) are unchanged.
 *
 * Pure data, no imports, so the test reads it directly. [MD:D62]
 */

/** The registry families (features/ear/modules/registry.ts EarFamily). */
export type EarHubFamily = 'tone' | 'dynamics' | 'time' | 'space' | 'defect' | 'pitch';

export const EAR_HUB_GROUPS: readonly { title: string; families: readonly EarHubFamily[] }[] = [
  { title: 'TONE', families: ['tone'] },
  { title: 'LEVEL AND DYNAMICS', families: ['dynamics'] },
  { title: 'TIME AND SPACE', families: ['space', 'time'] },
  { title: 'FAULTS AND PITCH', families: ['defect', 'pitch'] },
];

/** The module the hub marks as the place to begin. */
export const EAR_START_ID = 'frequency';
/** The mark on that module's row. */
export const EAR_START_MARK = 'START HERE';

/** The hub's opening line (ET-04): a picture, then where to begin. The audit
 *  suggested "Play all three first"; a Frequency Recognition trial plays one,
 *  two or three clips (tone.ts m1NameTheBand / m1HigherLower / m1FindTarget),
 *  so the line says "every clip", which is what the drill's lock asks for. */
export const EAR_HUB_OPENING = 'Ear training is like learning to name colors, but for sound. Start with Frequency Recognition. Play every clip first, then answer.';

/**
 * The modules of one group, in the registry's order. Inside TIME AND SPACE
 * that order is Stereo 6, Delay 8, Reverb 9, Polarity 12, Comb 13, so Comb
 * Filtering comes after the two modules it builds on.
 */
export function modulesInGroup<T extends { family: EarHubFamily }>(all: readonly T[], families: readonly EarHubFamily[]): T[] {
  return all.filter((m) => families.includes(m.family));
}
