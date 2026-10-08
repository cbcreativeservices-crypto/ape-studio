/**
 * FEEDS AND ROUTING FOR SPEECH IN SPORT — Lab 7b group 1 (B09 commentators,
 * B11 athletes, coaches and officials; B17 may reuse it). Pure: no React
 * (test/mikingLab7bSpeech.test.ts). The diagram is Lab 7's RoutingPanel
 * (routing.ts is the signal-flow record); this file adds the controls a
 * commentary position and an official's mic have, as STATES of a plan:
 *
 *   MIC KEY        a commentator's mic ON AIR (program, the recorder and
 *                  their own headphones' sidetone), COUGH (the mic cut from
 *                  everything while the key is held) or TALKBACK (the mic to
 *                  the producer only — off the program);
 *   RETURN         what the commentator hears back from production: the
 *                  program MINUS their own voice (mix-minus — they hear
 *                  themselves only directly, in the sidetone) or the whole
 *                  program, their own voice coming back late;
 *   IFB            the producer's cues interrupt that return (the producer's
 *                  talkback goes to the earpiece/return, never to air);
 *   CROWD          the crowd bed on its OWN channel into the program, or
 *                  missing (the commentary mic is not the crowd mic);
 *   OFFICIAL'S MIC an official's public-announcement mic: OFF, to the PA, or
 *                  to the PA and the program (only with explicit permission);
 *   PRIVATE        the officials' private circuit: drawn CLOSED, outside the
 *                  mixer. It can never be routed to program, the PA or the
 *                  recorder in this tool — a request to do so is REFUSED and
 *                  explained, never carried out.
 * A pure signal-flow record — no levels, no simulated feedback.
 */
import { routeProblems, type DestId, type RouteProblem, type RouteSource, type RoutingPlan } from './routing.ts';

export type MicKey = 'onAir' | 'cough' | 'talkback';
export type ReturnMode = 'mixMinus' | 'full';
export type CrowdMode = 'own' | 'none';
export type OfficialMic = 'off' | 'pa' | 'paProgram';
export type PrivateMode = 'closed' | 'tryAir';

export type FeedState = { key: MicKey; ret: ReturnMode; crowd: CrowdMode; official: OfficialMic; priv: PrivateMode };
export const FEED_HOME: FeedState = { key: 'onAir', ret: 'mixMinus', crowd: 'own', official: 'pa', priv: 'closed' };

/** The destinations an on-air signal reaches (the ones the private circuit
 *  may never reach). */
export const ON_AIR: readonly DestId[] = ['program', 'stream', 'pa', 'recorder', 'pressBox'];

/** What a feed plan is built from: the commentators' mics (the first one is
 *  the keyed one), the crowd bed, the producer's talkback, an official's
 *  announcement mic — any may be absent — and the destinations shown. */
export type FeedSpec = {
  commentators: readonly { id: string; label: string; short: string }[];
  crowd?: { id: string; label: string; short: string };
  producer?: { id: string; label: string; short: string };
  official?: { id: string; label: string; short: string };
  dests: readonly DestId[];
};

/** The plan a state makes (RoutingPanel draws it). The private circuit is
 *  never a source here: it does not enter the mixer. */
export function feedPlan(spec: FeedSpec, s: FeedState): RoutingPlan {
  const sources: RouteSource[] = [];
  const sends: Record<string, DestId[]> = {};
  spec.commentators.forEach((c, i) => {
    sources.push({ id: c.id, label: c.label, short: c.short, kind: 'mic', level: 'mic' });
    const key = i === 0 ? s.key : 'onAir';
    const air: DestId[] = ['program', 'recorder', 'phones'];
    sends[c.id] = key === 'onAir' ? [...air, ...(s.ret === 'full' ? (['ifb'] as DestId[]) : [])] : key === 'talkback' ? ['talkback'] : [];
  });
  if (spec.crowd) {
    sources.push({ id: spec.crowd.id, label: spec.crowd.label, short: spec.crowd.short, kind: 'ambience', level: 'mic' });
    sends[spec.crowd.id] = s.crowd === 'own' ? ['program', 'recorder', 'ifb'] : [];
  }
  if (spec.producer) {
    sources.push({ id: spec.producer.id, label: spec.producer.label, short: spec.producer.short, kind: 'talkback', level: 'mic' });
    sends[spec.producer.id] = ['ifb'];
  }
  if (spec.official) {
    sources.push({ id: spec.official.id, label: spec.official.label, short: spec.official.short, kind: 'mic', level: 'mic' });
    sends[spec.official.id] = s.official === 'off' ? [] : s.official === 'pa' ? ['pa'] : ['pa', 'program', 'recorder'];
  }
  const needs: Partial<Record<DestId, readonly string[]>> = {};
  if (spec.crowd && spec.dests.includes('program')) needs.program = [spec.crowd.id];
  return { sources, dests: spec.dests.filter((d) => d !== 'ifb' || spec.producer || s.ret === 'full'), sends, needs };
}

/** A feed problem: the routing record's own (routing.routeProblems), plus
 *  the commentary position's — the commentator hears their own voice late
 *  (the whole program in their return), the keyed mic left on talkback while
 *  the brief needs it on air. */
export type FeedProblem = RouteProblem | { code: 'lateSelf'; source: string } | { code: 'offAir'; source: string };

export function feedProblems(spec: FeedSpec, s: FeedState): FeedProblem[] {
  const plan = feedPlan(spec, s);
  const out: FeedProblem[] = [...routeProblems(plan)];
  if (s.ret === 'full' && spec.commentators.length) out.push({ code: 'lateSelf', source: spec.commentators[0].id });
  if (s.key === 'talkback' && spec.commentators.length) out.push({ code: 'offAir', source: spec.commentators[0].id });
  return out;
}

/** May a source be sent to a destination in this tool? The officials'
 *  private circuit: never to an on-air destination. */
export function canRoute(sourceId: string, dest: DestId, privateIds: readonly string[]): boolean {
  if (privateIds.includes(sourceId) && ON_AIR.includes(dest)) return false;
  return true;
}

/** Plain words for the commentary problems (learner-facing). */
export function feedProblemWords(spec: FeedSpec, plan: RoutingPlan, p: FeedProblem, routeWords: (plan: RoutingPlan, p: RouteProblem) => string): string {
  const name = (id: string) => [...spec.commentators, spec.crowd, spec.producer, spec.official].find((q) => q?.id === id)?.label ?? id;
  if (p.code === 'lateSelf') return `${name(p.source)} hears the whole program back — their own voice included, late, through the chain. Their return is the program MINUS their own voice; they hear themselves directly.`;
  if (p.code === 'offAir') return `${name(p.source)} is held on TALKBACK: they reach the producer, not the program. Release the key before the next call.`;
  return routeWords(plan, p);
}

/** What happens while a key is held, in words. */
export const KEY_WORDS: Readonly<Record<MicKey, string>> = {
  onAir: 'ON AIR: the mic goes to the program and the recorder, and back into the commentator’s own headphones directly (the sidetone).',
  cough: 'COUGH: while the key is held the mic is cut from everything — a cough, a sip, a word to a neighbour stays off the air.',
  talkback: 'TALKBACK: while the key is held the mic goes to the producer only, off the program.',
};

/** The officials' private circuit, refused: the words the tool says. */
export const PRIVATE_REFUSED =
  'Refused: the officials’ private circuit stays on its own approved route. This tool will not open it into the program, the PA or the recorder — no one does that by assumption. A public announcement goes through the official’s announcement mic, opened on purpose and muted again.';

/** A body-worn mic's chain to its approved destination, in order. */
export const BODY_CHAIN: readonly { id: string; label: string; words: string }[] = [
  { id: 'mic', label: 'MIC', words: 'The capsule where the approval says — clear of fabric, straps and protective gear.' },
  { id: 'tx', label: 'TRANSMITTER', words: 'The bodypack in its approved place, its antenna straight, the cable with a strain-relief loop.' },
  { id: 'rx', label: 'RECEIVER', words: 'On a frequency the venue’s radio coordinator assigned; watched for dropouts.' },
  { id: 'ch', label: 'ITS OWN CHANNEL', words: 'Isolated and labelled: one person, one channel, muted when it must be.' },
  { id: 'dest', label: 'THE APPROVED PATH', words: 'Only where permission says: live, delayed, recorded for review — or nowhere.' },
];
