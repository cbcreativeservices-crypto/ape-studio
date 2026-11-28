/**
 * gaCapstone — page 22 ("Capstone and free play"). Pure TypeScript, no React
 * Native (test/gameAudioChECapstone.test.ts).
 *
 * THE SEVEN REQUIREMENTS are predicates over (state, facts-since-visit).
 * Each is true when the scene REALLY did the thing during this visit: the
 * model counted it (model/gaModel `facts`), or the state shows it. None is
 * true because a key was pressed. With sound off the model still runs, so
 * every requirement can be met unheard.
 *
 * FACTS SINCE THE VISIT. `GaVisit` remembers the fact counts when the page
 * opened; `gaVisitSince` is "how much each count went up". Six requirements
 * read the model's own facts (the zone crossing reads `zoneCrossFade`, which
 * the model counts only when a crossing really cross-faded a playing bed).
 * One needs to know that two things were true IN THE SAME CHANGE of the
 * scene, which a count alone cannot say:
 *
 *   cap:musicOnBar      a music change was applied, and the boundary it was
 *                       asked for was the BAR (not "now", a beat or a phrase)
 *
 * `gaVisitStep(visit, next)` looks at each new state beside the one before
 * it and counts that as a witness fact. CLEAN SCENE resets the model's
 * counts to zero; the visit sees the log number go back and starts counting
 * again from zero, so nothing reads negative.
 *
 * NO "LEFT BY AN EARLIER PAGE" CHECK. Every page opens on a CLEAN SCENE
 * (the model's `enterPage`, sent by GaRack: nothing playing, the door
 * closed, YOU at the start, the standard settings, an empty log; the fact
 * counts are kept). So nothing from an earlier page can stand in the way of
 * a requirement, and every requirement can be met from that clean scene
 * with the keys of page 22 (the test's reference run starts there).
 *
 * The platform and listening lists are page 3's (data/gaPlatforms): one
 * list, two pages. They are choices recorded for the summary. They change
 * nothing in the sound.
 *
 * A BRIEF, NOT A SCRIPT (audit 2, L-04; lead's decision 14). The page states
 * what to build and the seven goals are the evidence, so a goal chip names
 * a RESULT ("A door with its second layer"), never the keys that make it.
 * Each requirement carries one optional HINT, which does name the keys: the
 * page shows a hint only when the learner asks for one, for the first goal
 * not met yet. Every key a hint names is a label on page 22 (the test holds
 * it), and the hints together are the test's reference run.
 */
import { GA_SURFACES } from '../../sounds/gaSynth.ts';
import { gaPlaying, type GaState } from '../../model/gaModel.ts';
import { gaListening, gaPlatform, type GaListeningId, type GaPlatformId } from './gaPlatforms.ts';

/* ── the visit ──────────────────────────────────────────────────────────── */

export const CAP_MUSIC_BAR = 'cap:musicOnBar';

export type GaFacts = Readonly<Record<string, number>>;

export type GaVisit = {
  /** The model's fact counts when the visit (or the clean scene) began. */
  base: GaFacts;
  /** Witness facts counted during the visit. */
  seen: GaFacts;
  /** The last state looked at. */
  last: GaState;
};

export const gaVisitOpen = (s: GaState): GaVisit => ({ base: { ...s.facts }, seen: {}, last: s });

/** What the change from `prev` to `next` proves, as witness fact names. */
export function gaCapstoneWitness(prev: GaState, next: GaState): string[] {
  const up = (k: string) => (next.facts[k] ?? 0) > (prev.facts[k] ?? 0);
  const out: string[] = [];
  if (up('musicApplied')) {
    // A change that WAITED carries the boundary it was asked for (heard, the
    // engine reports it applied; unheard, the conductor does, on scene time).
    // A change asked for and applied in the SAME step did not wait: it took
    // the option as it is now, which is then "now", never the bar.
    const boundary = up('musicQueued') ? next.options.musicBoundary : prev.music.pending?.boundary;
    if (boundary === 'bar') out.push(CAP_MUSIC_BAR);
  }
  return out;
}

export function gaVisitStep(v: GaVisit, next: GaState): GaVisit {
  if (next === v.last) return v;
  // a clean scene: the model's counts restarted from zero
  if (next.logN < v.last.logN || next.seq < v.last.seq) return { base: {}, seen: {}, last: next };
  const seen: Record<string, number> = { ...v.seen };
  for (const k of gaCapstoneWitness(v.last, next)) seen[k] = (seen[k] ?? 0) + 1;
  return { base: v.base, seen, last: next };
}

/** Every fact that went up during the visit, with how much, plus the
 *  witness facts. A fact that did not go up is absent. */
export function gaVisitSince(v: GaVisit, s: GaState): GaFacts {
  const out: Record<string, number> = { ...v.seen };
  for (const k of Object.keys(s.facts)) {
    const d = (s.facts[k] ?? 0) - (v.base[k] ?? 0);
    if (d > 0) out[k] = d;
  }
  return out;
}

/* ── the requirements ───────────────────────────────────────────────────── */

export type GaCapstoneReq = {
  id: 'steps' | 'speed' | 'zone' | 'rattle' | 'duck' | 'music' | 'cue';
  /** The goal chip: the RESULT the scene must show, in the learner's words.
   *  It names no key (the hint does). */
  chip: string;
  /** One optional hint: the keys of page 22 that make this result. */
  hint: string;
  /** What was wired, as the learning summary lists it. */
  label: string;
  /** What it proves, in one line (shown in the learning summary). */
  why: string;
  met: (s: GaState, since: GaFacts) => boolean;
};

const n = (since: GaFacts, k: string): number => since[k] ?? 0;

/** How many different footstep takes played on each surface this visit. */
export function gaStepTakes(since: GaFacts): Record<string, number> {
  const out: Record<string, number> = {};
  for (const surface of GA_SURFACES) {
    out[surface] = Object.keys(since).filter((k) => k.startsWith(`take:footstep:${surface}:`)).length;
  }
  return out;
}

export const GA_CAPSTONE: readonly GaCapstoneReq[] = [
  {
    id: 'steps',
    chip: 'Footsteps on two surfaces, two takes on one',
    hint: 'MOVE: press STEP FORWARD twice on the stone path. Then choose GO: GRAVEL and press STEP FORWARD again.',
    label: 'Footsteps on two surfaces, two takes on one',
    why: 'One footstep event served every surface. A switch chose the surface and a random choice chose the take.',
    met: (_s, since) => {
      const takes = Object.values(gaStepTakes(since));
      return takes.filter((t) => t >= 1).length >= 2 && takes.some((t) => t >= 2);
    },
  },
  {
    id: 'speed',
    chip: 'A generator whose speed changes while it runs',
    hint: 'SOUNDS: switch GENERATOR 1 on. Close the tray, then move the slider while the generator runs.',
    label: 'Generator running, speed changed as it played',
    why: 'Speed is a parameter. The value is kept on the generator, and the instance already playing followed it. Nothing restarted.',
    met: (s, since) => gaPlaying(s, 'generator') && n(since, 'speedWhilePlaying') > 0,
  },
  {
    id: 'zone',
    chip: 'One crossfade at the doorway',
    hint: 'SOUNDS: switch SCENE on and press OPEN DOOR. Then MOVE: choose GO: WORKSHOP.',
    label: 'One zone crossing with the beds running',
    why: 'The ambience beds follow the listener. One crossing gave one crossfade, not a new loop.',
    met: (_s, since) => n(since, 'zoneCrossFade') > 0,
  },
  {
    id: 'rattle',
    chip: 'A door with its second layer',
    hint: 'SOUNDS: press OPEN DOOR. The latch rattle follows one second later.',
    label: 'A door event with its rattle layer',
    why: 'One event can play several layers. The door played, and its loose latch followed one second later.',
    met: (_s, since) => n(since, 'take:door_open::door_rattle') > 0,
  },
  {
    id: 'duck',
    chip: 'A line that ducks the mix',
    hint: 'SOUNDS: press GUIDE LINE. The log prints DUCK on while the line speaks.',
    label: 'A guide line that ducked the mix',
    why: 'Dialogue has its own bus. While the line spoke, music, ambience and effects were turned down, then came back.',
    met: (_s, since) => n(since, 'duck') > 0,
  },
  {
    id: 'music',
    chip: 'A music change that lands on a bar',
    hint: 'MUSIC: switch MUSIC on, then choose ALERT. The change waits for the next bar line.',
    label: 'One music change applied on a bar',
    why: 'The change was asked for immediately and applied on the next bar line, so the music stayed in time.',
    met: (_s, since) => n(since, CAP_MUSIC_BAR) > 0,
  },
  {
    id: 'cue',
    chip: 'A warning the player can also see',
    hint: 'SOUNDS: switch VISUAL CUE on, then switch ALARM on.',
    label: 'Overheat alarm running, visual cue on',
    why: 'An important sound has a second way to reach the player: a sign in the picture as well as the alarm.',
    met: (s, since) => gaPlaying(s, 'alarm') && s.options.visualCue && n(since, 'alarmOn') + n(since, 'option:visualCue:true') > 0,
  },
];

export const gaCapstoneMet = (s: GaState, since: GaFacts): boolean[] => GA_CAPSTONE.map((r) => r.met(s, since));

/** The hint for the first goal not met yet (in the goals' order), or null
 *  when all seven are met. `done` is the page's latched goals. */
export function gaCapstoneNextHint(done: readonly boolean[]): { id: GaCapstoneReq['id']; chip: string; hint: string } | null {
  const i = GA_CAPSTONE.findIndex((_, k) => !done[k]);
  if (i < 0) return null;
  const r = GA_CAPSTONE[i];
  return { id: r.id, chip: r.chip, hint: r.hint };
}

/* ── one test for each choice ───────────────────────────────────────────── */

/** One relevant test per listening setup (page 3's list has none of its own). */
export const GA_LISTENING_TEST: Readonly<Record<GaListeningId, string>> = {
  speaker: 'Play the busiest moment on the small speaker. Confirm the warning and the speech are still clear with weak low notes.',
  headphones: 'Walk around one source. Confirm it moves smoothly between left and right, and that speech stays clear at a low level.',
  tv: 'Listen from across a room that has some noise in it. Confirm every spoken line can be understood.',
  soundbar: 'Play the scene with the soundbar’s widening on, then off. Confirm speech stays clear in both.',
  headset: 'Play a busy moment while someone talks on voice chat. Confirm the chat and the game’s speech can both be understood.',
};

export const gaPlatformTest = (id: GaPlatformId | null): string | null => gaPlatform(id)?.test ?? null;
export const gaListeningTest = (id: GaListeningId | null): string | null => (id ? GA_LISTENING_TEST[id] : null);

/* ── the learning summary ───────────────────────────────────────────────── */

export const GA_SUMMARY_TITLE = 'Game Audio Lab: learning summary';
export const GA_SUMMARY_FOOT = 'This is a record of lab practice. It is not a qualification.';
const NOT_CHOSEN = 'not chosen yet';

export type GaSummaryLine = { kind: 'head' | 'item' | 'detail' | 'foot'; text: string };

/** The summary as lines (the card draws them; the share text joins them).
 *  "Connected", not "wired" (audit 2, L-32): the page asks the learner to
 *  connect the ideas. */
export function gaCapstoneSummaryLines(platform: GaPlatformId | null, listening: GaListeningId | null, done: readonly boolean[]): GaSummaryLine[] {
  const p = gaPlatform(platform);
  const l = gaListening(listening);
  const lines: GaSummaryLine[] = [{ kind: 'head', text: 'Platform' }, { kind: 'item', text: p ? p.name : NOT_CHOSEN }];
  const pt = gaPlatformTest(platform);
  if (pt) lines.push({ kind: 'detail', text: `One test: ${pt}` });
  lines.push({ kind: 'head', text: 'Listening setup' }, { kind: 'item', text: l ? titleCase(l.label) : NOT_CHOSEN });
  const lt = gaListeningTest(listening);
  if (lt) lines.push({ kind: 'detail', text: `One test: ${lt}` });
  lines.push({ kind: 'head', text: 'Connected in the scene' });
  const wired = GA_CAPSTONE.filter((_, i) => done[i]);
  if (!wired.length) lines.push({ kind: 'item', text: 'Nothing yet.' });
  for (const r of wired) lines.push({ kind: 'item', text: `Done: ${r.label}` }, { kind: 'detail', text: r.why });
  const left = GA_CAPSTONE.filter((_, i) => !done[i]);
  if (left.length && wired.length) {
    lines.push({ kind: 'head', text: 'Still to connect' });
    for (const r of left) lines.push({ kind: 'item', text: r.label });
  }
  lines.push({ kind: 'foot', text: GA_SUMMARY_FOOT });
  return lines;
}

/** The plain text that SHARE SUMMARY shares. */
export function gaCapstoneSummary(platform: GaPlatformId | null, listening: GaListeningId | null, done: readonly boolean[]): string {
  const body = gaCapstoneSummaryLines(platform, listening, done).map((ln) => (ln.kind === 'head' ? `\n${ln.text.toUpperCase()}` : ln.kind === 'detail' ? `  ${ln.text}` : ln.kind === 'foot' ? `\n${ln.text}` : `- ${ln.text}`));
  return [GA_SUMMARY_TITLE, ...body].join('\n');
}

function titleCase(caps: string): string {
  return caps
    .toLowerCase()
    .replace(/\btv\b/, 'TV')
    .replace(/^\w/, (c) => c.toUpperCase());
}
