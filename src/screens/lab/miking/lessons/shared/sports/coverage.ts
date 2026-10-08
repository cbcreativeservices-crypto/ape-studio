/**
 * THE COVERAGE PLANNER — Lab 7 part 2, group 3 (lab7-g6;
 * docs/labs/miking/crowd_complete/GEOMETRY_PROPOSAL.md §3). Built once here
 * (B17; B15 and B16 can reuse it). Pure; tested
 * (test/mikingLab7SportsG3.test.ts).
 *
 * A role table — commentary, action, the main ambience, audience spots — and
 * two layouts from the lesson (B17 L16–L34): the MINIMAL stereo example (one
 * commentary mic, one approved action sector, one stereo audience pair) and
 * the EXTENSIVE example (two commentators, four action sectors, a
 * four-channel main ambience and two stereo audience spots). Every count is
 * COMPUTED from the inputs — never typed into a sentence (correction B17-01):
 * the minimal layout comes to four mic channels, the extensive to fourteen
 * (2 + 4 + 4 + 4), line feeds, communications and spares not included.
 *
 * The FAILURE DRILL (L37, L218): lose one input — which input now carries its
 * role? Another input of the same role first; else the role's named fallback
 * (action → the audience spots → the main ambience; a spot → the main
 * ambience; the main ambience → the spots); else an honest gap.
 */

export type RoleId = 'commentary' | 'action' | 'main' | 'spots';
export type LayoutId = 'minimal' | 'extensive';

export const ROLES: Readonly<Record<RoleId, { label: string; short: string; job: string }>> = {
  commentary: { label: 'Commentary', short: 'COMM', job: 'Speech in the program: close, independent inputs with their own cough and mute.' },
  action: { label: 'Action', short: 'ACTION', job: 'Selected detail of the play from approved sectors, one dominant feed or a handoff at a time.' },
  main: { label: 'Main ambience', short: 'MAIN', job: 'The stable venue bed from a useful permitted viewpoint — it carries the event when detail is lost.' },
  spots: { label: 'Audience spots', short: 'SPOTS', job: 'Local audience sectors where the main ambience leaves a real gap — never one shouting spectator.' },
};
export const ROLE_IDS: readonly RoleId[] = ['commentary', 'action', 'main', 'spots'];

/** One input in a layout: a mic or an array, its role and its channel count. */
export type CoverageInput = { id: string; role: RoleId; label: string; short: string; channels: number };

export const LAYOUTS: Readonly<Record<LayoutId, { label: string; short: string; blurb: string; inputs: readonly CoverageInput[] }>> = {
  minimal: {
    label: 'Minimal stereo',
    short: 'MINIMAL',
    blurb: 'One commentary mic, one approved action sector and one stereo audience pair — speech, action and ambience each on its own fader.',
    inputs: [
      { id: 'c1', role: 'commentary', label: 'the commentary mic', short: 'COMM', channels: 1 },
      { id: 'a1', role: 'action', label: 'the action mic', short: 'ACTION', channels: 1 },
      { id: 'pair', role: 'main', label: 'the stereo audience pair', short: 'PAIR', channels: 2 },
    ],
  },
  extensive: {
    label: 'Extensive',
    short: 'EXTENSIVE',
    blurb: 'Two commentators on their own inputs, four action sectors with a named dominant feed, a four-channel main ambience and two stereo audience spots where the main array leaves real gaps.',
    inputs: [
      { id: 'c1', role: 'commentary', label: 'commentator 1', short: 'COMM 1', channels: 1 },
      { id: 'c2', role: 'commentary', label: 'commentator 2', short: 'COMM 2', channels: 1 },
      { id: 'a1', role: 'action', label: 'action sector 1', short: 'ACT 1', channels: 1 },
      { id: 'a2', role: 'action', label: 'action sector 2', short: 'ACT 2', channels: 1 },
      { id: 'a3', role: 'action', label: 'action sector 3', short: 'ACT 3', channels: 1 },
      { id: 'a4', role: 'action', label: 'action sector 4', short: 'ACT 4', channels: 1 },
      { id: 'main4', role: 'main', label: 'the four-channel main ambience', short: 'MAIN ×4', channels: 4 },
      { id: 'spotA', role: 'spots', label: 'audience spot A (a stereo pair)', short: 'SPOT A', channels: 2 },
      { id: 'spotB', role: 'spots', label: 'audience spot B (a stereo pair)', short: 'SPOT B', channels: 2 },
    ],
  },
};
export const LAYOUT_IDS: readonly LayoutId[] = ['minimal', 'extensive'];

/** The mic channels a layout uses (line feeds, communications and spares not counted). */
export const channelCount = (l: LayoutId): number => LAYOUTS[l].inputs.reduce((a, q) => a + q.channels, 0);
/** The mic channels one role uses in a layout. */
export const roleChannels = (l: LayoutId, r: RoleId): number => LAYOUTS[l].inputs.filter((q) => q.role === r).reduce((a, q) => a + q.channels, 0);
/** "2 + 4 + 4 + 4" — the count's parts, role by role, for the roles in use. */
export const countParts = (l: LayoutId): number[] => ROLE_IDS.map((r) => roleChannels(l, r)).filter((n) => n > 0);

/** Where a lost role goes when no input of its own role is left. */
const FALLBACK: Readonly<Record<RoleId, readonly RoleId[]>> = {
  commentary: [],
  action: ['spots', 'main'],
  spots: ['main'],
  main: ['spots'],
};

export type Carry = { kind: 'same' | 'fallback' | 'gap'; by: CoverageInput | null; words: string };

/** The failure drill: `lost` is muted — who carries its role now? */
export function carrierFor(l: LayoutId, lost: string): Carry {
  const ins = LAYOUTS[l].inputs;
  const gone = ins.find((q) => q.id === lost);
  if (!gone) return { kind: 'same', by: null, words: 'Nothing is lost: every input is up.' };
  const same = ins.find((q) => q.role === gone.role && q.id !== gone.id);
  if (same) return { kind: 'same', by: same, words: `${cap(same.label)} carries ${ROLES[gone.role].label.toLowerCase()} on its own: bring it up smoothly, no jump in level.` };
  for (const r of FALLBACK[gone.role]) {
    const by = ins.find((q) => q.role === r);
    if (by) return { kind: 'fallback', by, words: `No other ${ROLES[gone.role].label.toLowerCase()} input: ${by.label} carries the event — the venue stays, the detail is gone. Plan the level so the change is not a jump.` };
  }
  return { kind: 'gap', by: null, words: `Nothing in this layout replaces ${gone.label}: a known gap. Keep the bed steady, fix or swap the mic in a safe moment — and decide in advance whether a spare is worth an input.` };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
