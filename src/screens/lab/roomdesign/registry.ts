/**
 * Room Design & Monitoring Lab — module registry (owner spec 2026-10-01).
 * Pure data (no React) so the completion/visit stores and the node tests can
 * read it. The order IS the app flow: create the room → add the monitoring
 * setup → explore placement → add treatment → review.
 */
export type RoomModuleId = 'intro' | 'create' | 'monitoring' | 'explore' | 'treatment' | 'review';

export const ROOM_LAB_ID = 'roomdesign';

export const ROOM_MODULES: { id: RoomModuleId; num: string; title: string; blurb: string; rack: boolean }[] = [
  { id: 'intro', num: '1', title: 'What a room model can tell you', blurb: 'Calculated, estimated, measured — the three kinds of number in this lab, and why none of them is a verdict.', rack: false },
  { id: 'create', num: '2', title: 'Create the room', blurb: 'Dimensions, shape, ceiling, doors and windows, surfaces, furniture — drag the corners or type the numbers.', rack: true },
  { id: 'monitoring', num: '3', title: 'Monitoring setup', blurb: 'Stereo, stereo + sub or multichannel; speaker and listener positions, heights and toe-in; symmetry and distance checks.', rack: true },
  { id: 'explore', num: '4', title: 'Explore placement', blurb: 'Drag speakers and listener; reflections, modal pressure and boundary distances update live. Save and compare positions.', rack: true },
  { id: 'treatment', num: '5', title: 'Add treatment', blurb: 'Absorbers at the reflection points, bass traps, a ceiling cloud, diffusers, a rug, gobos — compare with and without each.', rack: true },
  { id: 'review', num: '6', title: 'Review the room', blurb: 'Room and layout · likely acoustic behaviour · suggested next steps. Observations, not a score.', rack: false },
];

export const ROOM_UNITS: readonly string[] = ROOM_MODULES.map((m) => m.id);
