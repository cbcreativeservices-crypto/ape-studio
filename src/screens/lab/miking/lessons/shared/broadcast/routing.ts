/**
 * WHERE EACH MIC GOES — the broadcast routing model (Lab 7; panels_press/
 * GEOMETRY_PROPOSAL.md §4, "ROUTING panel (used by B01–B08)"). Built once by
 * group 1; group 3 adds the crowd-mic rule's lesson (B08), group 2 the camera
 * and body-mic feeds. Pure: no React (test/mikingLab7Broadcast.test.ts). The
 * diagram is RoutingPanel.tsx.
 *
 * A pure SIGNAL-FLOW record — no levels beyond "mic" and "line", no
 * simulated feedback. Every lesson builds a RoutingPlan: its SOURCES (the
 * mics, a remote guest's return line, playback, an ambience mic, the
 * producer's talkback), the DESTINATIONS it uses, and which source is sent
 * where. The checks say in words what a real system would do:
 *
 *   echo            a remote contributor's own voice sent back to them in
 *                   their return: they hear themselves late. Their return is
 *                   the program MINUS their own voice (mix-minus);
 *   speakerLoop     the remote return (or the program) played on a nearby
 *                   loudspeaker while a studio mic is open: the mic picks it
 *                   up again — use headphones;
 *   missing         a source the brief needs is not in a destination (the
 *                   audience question absent from the stream or the press
 *                   feed — "a press feed is only the mix routed into it");
 *   ambienceInPa    an ambience or crowd mic sent to the local PA (it is for
 *                   broadcast and the recording: B08, S-CHURCH "Don't mic the
 *                   congregation for sound reinforcement");
 *   talkbackOnAir   the producer's talkback on the program or the PA.
 * And one connection rule (the press feed box, PSC-TRAIN: a line-level
 * input, isolated mic-level outputs):
 *   connect(out, input)  line into a mic input overloads; mic into a line
 *                   input is too quiet; phantom power never into a feed port
 *                   whose policy is not verified.
 */

export type DestId = 'pa' | 'monitor' | 'phones' | 'program' | 'stream' | 'recorder' | 'ifb' | 'talkback' | 'pressBox' | 'remoteReturn';
export type DestKind = 'room' | 'people' | 'feed';

/** Each destination: who or what hears it, in plain words. */
export const DESTINATIONS: Readonly<Record<DestId, { label: string; short: string; kind: DestKind; words: string }>> = {
  pa: { label: 'PA loudspeakers', short: 'PA', kind: 'room', words: 'The audience in the room hears it as it happens — and every open mic hears the PA too.' },
  monitor: { label: 'a monitor loudspeaker', short: 'MONITOR', kind: 'room', words: 'A loudspeaker near a talker so they can hear: an open mic nearby picks it up again.' },
  phones: { label: 'headphones', short: 'PHONES', kind: 'people', words: 'Only the wearer hears it: the usual way for a studio talker to hear the program.' },
  program: { label: 'the program mix', short: 'PROGRAM', kind: 'feed', words: 'The mix the listeners get: the broadcast, the podcast, the edit.' },
  stream: { label: 'the stream or broadcast', short: 'STREAM', kind: 'feed', words: 'The program sent out live — it may differ from the room’s PA mix.' },
  recorder: { label: 'the recorder', short: 'RECORDER', kind: 'feed', words: 'Each mic on its own track, plus the mix: for the edit and a backup.' },
  ifb: { label: 'an earpiece (IFB)', short: 'EARPIECE', kind: 'people', words: 'A talker’s earpiece: the program, with the producer’s cues when they talk.' },
  talkback: { label: 'talkback', short: 'TALKBACK', kind: 'people', words: 'The producer speaking to the talent and the crew — kept off the air.' },
  pressBox: { label: 'the press feed box', short: 'PRESS FEED', kind: 'feed', words: 'A box that takes one line-level mix and gives each reporter an isolated mic-level output: a copy of the mix, not another mic.' },
  remoteReturn: { label: 'the remote guest’s return', short: 'RETURN', kind: 'people', words: 'What a remote guest hears: the program MINUS their own voice (mix-minus), or they hear themselves late.' },
};

export type SourceKind = 'mic' | 'remote' | 'playback' | 'ambience' | 'talkback';
export type RouteSource = { id: string; label: string; short: string; kind: SourceKind; level: 'mic' | 'line' };

/** A lesson's routing: its sources, the destinations it shows, the sends. */
export type RoutingPlan = {
  sources: readonly RouteSource[];
  dests: readonly DestId[];
  sends: Readonly<Record<string, readonly DestId[]>>;
  /** Studio mics that are OPEN (a loudspeaker playing the return or the
   *  program then loops back into them). */
  openMics?: readonly string[];
  /** The sources each destination MUST carry for this brief. */
  needs?: Partial<Record<DestId, readonly string[]>>;
};

export function reaches(plan: RoutingPlan, src: string, dest: DestId): boolean {
  return !!plan.sends[src]?.includes(dest);
}
/** The sources heard in a destination. */
export function feeds(plan: RoutingPlan, dest: DestId): RouteSource[] {
  return plan.sources.filter((s) => reaches(plan, s.id, dest));
}

export type RouteProblem =
  | { code: 'echo'; source: string }
  | { code: 'speakerLoop'; dest: 'monitor' | 'pa'; source: string }
  | { code: 'missing'; dest: DestId; source: string }
  | { code: 'ambienceInPa'; source: string }
  | { code: 'talkbackOnAir'; dest: DestId };

/** Everything the plan gets wrong, in a stable order. */
export function routeProblems(plan: RoutingPlan): RouteProblem[] {
  const out: RouteProblem[] = [];
  const kind = (id: string) => plan.sources.find((s) => s.id === id)?.kind;
  for (const s of plan.sources) {
    if (s.kind === 'remote' && reaches(plan, s.id, 'remoteReturn')) out.push({ code: 'echo', source: s.id });
    if (s.kind === 'ambience' && reaches(plan, s.id, 'pa')) out.push({ code: 'ambienceInPa', source: s.id });
  }
  // A remote voice or the program on a loudspeaker near an open studio mic.
  if ((plan.openMics ?? []).length) {
    for (const s of plan.sources) {
      if (s.kind !== 'remote' && s.kind !== 'playback') continue;
      if (reaches(plan, s.id, 'monitor')) out.push({ code: 'speakerLoop', dest: 'monitor', source: s.id });
    }
  }
  for (const s of plan.sources) {
    if (kind(s.id) !== 'talkback') continue;
    for (const d of ['program', 'stream', 'pa', 'pressBox'] as const) if (reaches(plan, s.id, d)) out.push({ code: 'talkbackOnAir', dest: d });
  }
  for (const [d, ids] of Object.entries(plan.needs ?? {}) as [DestId, readonly string[]][]) for (const id of ids) if (!reaches(plan, id, d)) out.push({ code: 'missing', dest: d, source: id });
  return out;
}

/** Plain words for a problem (learner-facing). */
export function problemWords(plan: RoutingPlan, p: RouteProblem): string {
  const name = (id: string) => plan.sources.find((s) => s.id === id)?.label ?? id;
  switch (p.code) {
    case 'echo':
      return `${name(p.source)} is sent back in their own return: they hear their own voice late. Give them the program MINUS their own voice.`;
    case 'speakerLoop':
      return `${name(p.source)} plays on ${DESTINATIONS[p.dest].label} next to an open mic: the mic picks it up again. Use headphones or an earpiece.`;
    case 'missing':
      return `${name(p.source)} does not reach ${DESTINATIONS[p.dest].label}: those listeners never hear it, even if the room did.`;
    case 'ambienceInPa':
      return `${name(p.source)} goes to the PA: an ambience mic is for the broadcast and the recording, not the room’s loudspeakers.`;
    case 'talkbackOnAir':
      return `The producer’s talkback reaches ${DESTINATIONS[p.dest].label}: talkback is for the talent and the crew, kept off the air.`;
  }
}

/** A plan with one source's sends changed (the panel's switches). */
export function withSends(plan: RoutingPlan, src: string, dests: readonly DestId[]): RoutingPlan {
  return { ...plan, sends: { ...plan.sends, [src]: dests } };
}

/* ── the press feed box (PSC-TRAIN: a +4 line input, isolated mic-level outputs) ── */

export type Level = 'mic' | 'line';
/** The box: one LINE-level input (the event mixer's program), a row of
 *  transformer-isolated MIC-level outputs (one per reporter). The count is
 *  the example product's (12) — a drawing, not a rule. */
export const PRESS_BOX = { input: 'line' as Level, output: 'mic' as Level, isolated: true, outputsDrawn: 12 } as const;

/** Plugging an output of one level into an input set for another. */
export function connect(out: Level, input: Level): 'ok' | 'overload' | 'tooQuiet' {
  if (out === input) return 'ok';
  return out === 'line' ? 'overload' : 'tooQuiet';
}
export const CONNECT_WORDS: Readonly<Record<'ok' | 'overload' | 'tooQuiet', string>> = {
  ok: 'Matched: the recorder’s input is set for the level the port gives.',
  overload: 'A line-level feed into a mic input: far too hot — it distorts. Set the input for line, or use a mic-level port.',
  tooQuiet: 'A mic-level feed into a line input: far too quiet — the noise comes up with it. Set the input for mic.',
};
