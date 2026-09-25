/**
 * Sound Systems Lab — identifiers shared by the hub and its five modes.
 * Pure data (no React) so the hub's WHAT-IS-LEFT summary and any boot-loaded
 * store can import it freely.
 *
 * Each mode is its own PagedLab, so each persists its pages under its own
 * `ape:<id>:v1` key. The understanding check is attached to LEARN.
 */
export const SS_LEARN_ID = 'sound-systems-learn';
export const SS_BUILD_ID = 'sound-systems-build';
export const SS_ROUTE_ID = 'sound-systems-route';
export const SS_OPERATE_ID = 'sound-systems-operate';
export const SS_TROUBLESHOOT_ID = 'sound-systems-troubleshoot';

/** Page counts — the hub reads these without importing the page arrays
 *  (which pull in SVG and React). Each mode's screen dev-checks its real
 *  array against the number here. */
export const SS_PAGE_COUNTS = {
  learn: 22,
  build: 11,
  route: 8,
  operate: 5,
  troubleshoot: 6,
} as const;

export const SS_MODES = [
  { id: 'learn', title: 'LEARN', name: 'Learn', route: 'SoundSystemsLearn', labId: SS_LEARN_ID, blurb: 'Fourteen chapters: the complete system, its types, output configurations, routing, subwoofers, monitors, wiring, amplification, deployment, gain, coverage, tuning, feedback and fault-finding.' },
  { id: 'build', title: 'BUILD', name: 'Build', route: 'SoundSystemsBuild', labId: SS_BUILD_ID, blurb: 'An empty venue and a parts bin. Place the gear, connect it — every link checked for level and safety — then ten capstone systems graded live.' },
  { id: 'route', title: 'ROUTE', name: 'Route', route: 'SoundSystemsRoute', labId: SS_ROUTE_ID, blurb: 'The console: pre and post-fader sends, subgroups, DCAs, mute groups, matrices and the output patch — and which one to reach for.' },
  { id: 'operate', title: 'OPERATE', name: 'Operate', route: 'SoundSystemsOperate', labId: SS_OPERATE_ID, blurb: 'Power sequence, line check, gain structure from microphone to loudspeaker, ring-out and shutdown.' },
  { id: 'troubleshoot', title: 'TROUBLESHOOT', name: 'Troubleshoot', route: 'SoundSystemsTroubleshoot', labId: SS_TROUBLESHOOT_ID, blurb: 'Twenty-two faults on the bench. Probe from the source forward, read every station, name the fault.' },
] as const;

export type SsModeId = (typeof SS_MODES)[number]['id'];
