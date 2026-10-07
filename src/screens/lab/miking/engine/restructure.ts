/**
 * THE 2026-10-06 RESTRUCTURE — how the 79 lessons written for the nine-page
 * journey are served as the eight-page journey (docs/labs/miking/
 * LESSON_JOURNEY.md). Pure; tested in node. Engine-level: no lesson file
 * changes its words to be served this way.
 *
 * Owner, 2026-10-06: "We need to be careful with this whole idea of 'where it
 * sits' … it is too generic and is more about stage position than mic
 * position. The labs need to be about miking."
 *
 *   MEET IT — WHERE THE SOUND COMES FROM   = the lesson's ORIENT page (start,
 *       what it is, its parts) + its HOW IT SOUNDS page TRIMMED to where the
 *       sound leaves: the physics-only steps (vibration shapes, the air
 *       column, the valves, the pickup's string …) are left out
 *       (`meetKeep`). Its credit = HOW IT SOUNDS's checks, less any check
 *       about a step that is no longer shown (`RETIRED`).
 *   STARTING SETUPS = real mic setups drawn on the instrument (engine/
 *       setups.ts, built from the lesson's own zones and two-mic data) + the
 *       lesson's "before any mic" step, which carries the old setting page's
 *       checks (`setupsKeep`: its last step, and an amplified source's
 *       signal path — a mic decision). Its credit = those checks + looking at
 *       every setup. The plan steps (the stage, the studio, the neighbours'
 *       positions) are gone; the neighbours that bleed into the mic and the
 *       live / studio difference are said as mic decisions on the setups page.
 *
 * A lesson written to the new journey gives `pages.meet` / `pages.setups`
 * itself and is served as written.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SourcePageId } from './model/types.ts';
import { journeyPageOf, QUICK_CHECK_SIZE } from './journey.ts';

/** HOW IT SOUNDS steps MEET IT leaves out (physics that does not say where the
 *  sound leaves). The page's LAST step is always kept: it carries the checks. */
export const MEET_DROP: ReadonlySet<string> = new Set(['shapes', 'air', 'symp', 'column', 'pipe', 'head', 'valves', 'keepsGoing', 'string', 'mech', 'pipes']);

/** Which of a HOW IT SOUNDS page's steps MEET IT shows. */
export function meetKeep(key: string, i: number, n: number): boolean {
  return i === n - 1 || !MEET_DROP.has(key);
}

/** Which of a SETTING page's steps STARTING SETUPS shows: the last ("before
 *  any mic", with the checks), and an amplified source's signal path (mic or
 *  DI — a miking decision). The plans of the stage and the studio are gone. */
export function setupsKeep(key: string, i: number, n: number): boolean {
  return i === n - 1 || key === 'path';
}

/**
 * Checks and quick-check items about a step MEET IT no longer shows (the
 * vibration shapes, the air column, a pickup under the string …): retired
 * from the page and its credit, by lesson. A retired QUICK CHECK item is
 * replaced by one of the lesson's own MEET IT checks (`quickCheckOf`).
 * Reviewed one by one on 2026-10-06 (CORRECTIONS_LOG.md, "R-06").
 */
export const RETIRED: Readonly<Record<string, readonly string[]>> = {
  M01: ['k.snd.2', 'q.3', 'q.4'],
  M02: ['sn.snd.2', 'q.3'],
  M03: ['tm.snd.3', 'q.4'],
  M09: ['oh.snd.3'],
  M04a: ['cg.snd.2', 'q.3'],
  M04b: ['bg.snd.1', 'bg.snd.3', 'q.4'],
  M04c: ['tb.snd.2'],
  M06: ['tp.snd.1', 'tp.snd.2', 'tp.q.3', 'tp.q.4'],
  M07a: ['cbd.snd.1', 'cbd.snd.3', 'cbd.q.3'],
  M07b: ['cs.snd.2', 'cs.q.3', 'cs.q.4'],
  M12: ['tb.snd.1', 'tb.snd.2', 'q.3'],
  C01: ['ag.snd.2', 'ag.snd.3', 'q.3'],
  C02: ['eg.snd.1', 'q.3'],
  C03: ['rs.snd.2', 'q.3'],
  C04: ['ps.snd.1', 'ps.snd.2', 'q.3'],
  C05A: ['bj.snd.2', 'q.3'],
  C05B: ['md.snd.2', 'q.3'],
  C05C: ['uk.snd.2', 'q.3'],
  C06a: ['ubp.snd.2'],
  C07: ['ab.snd.2', 'q.3'],
  C09a: ['vn.snd.3'],
  C09c: ['vc.snd.3'],
  C10: ['q.4'],
  C11: ['q.4'],
  C12: ['q.4'],
  C13: ['oud.snd.2', 'q.3'],
  C14: ['st.snd.2', 'q.3'],
  C15: ['vn.snd.3', 'q.4'],
  I01b: ['rd.snd.3'],
  I01d: ['sp.snd.3'],
  I06a: ['tri.snd.1', 'tri.q.3'],
  I06b: ['fc.snd.3'],
  I06c: ['bc.snd.2', 'bc.q.3'],
  I07: ['vb.snd.1'],
  I08: ['mr.snd.3', 'mr.q.4'],
  I11a: ['rh.snd.1'],
  I11b: ['wu.snd.1', 'q.3'],
  I12: ['gg.snd.1', 'gg.snd.2', 'gg.q.4'],
  A03: ['hn.snd.2'],
  A04b: ['eu.snd.3'],
  A08a: ['cl.snd.2'],
  A09a: ['ob.snd.2', 'q.4'],
  A10: ['hm.q.4'],
  A12: ['org.snd.1', 'org.q.3'],
};

/**
 * Review 2026-10-07 (labs 1–2, R12-L01): the quick-check items about the two
 * heads coupled through the air (M01 q.4, M03 q.4, M07a cbd.q.3 and its MEET IT check cbd.snd.1, M07b cs.q.4)
 * test the 'air' step MEET IT leaves out, so they are retired above too. And
 * a replacement never repeats an item the check already asks in other words
 * (M02: two items on what makes the buzz; I11b: two on the vibrato; M07a: two on where the sound leaves): these
 * MEET IT checks count as repeats when a replacement is chosen (the same
 * rule as `sameQuestion` below: taken only when nothing else is left).
 */
export const QUICK_AVOID: Readonly<Record<string, readonly string[]>> = {
  M02: ['sn.snd.1'],
  I11b: ['wu.snd.2'],
  M07a: ['cbd.snd.2'],
};

export function isRetired(lessonId: string, itemId: string): boolean {
  return !!RETIRED[lessonId]?.includes(itemId);
}

/** The checks a learner meets (retired ones left out). */
export function liveScenarios(lesson: Lesson): MikingScenario[] {
  return lesson.scenarios.filter((s) => !isRetired(lesson.id, s.id));
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function meetContent(lesson: Lesson): PageContent {
  const src = lesson.pages.instrument;
  const snd = lesson.pages.sound;
  const scenarios = [...(src?.credit.scenarios ?? []), ...(snd?.credit.scenarios ?? [])].filter((id) => !isRetired(lesson.id, id));
  const noun = lesson.noun.subject ?? lesson.noun.one;
  return {
    title: 'Meet it — where the sound comes from',
    goal: `Meet the ${noun} in brief — what it is and its parts — and see where its sound leaves it: those are the places a mic can hear it best. Shown, never played.`,
    credit: {
      scenarios,
      note: scenarios.length ? `Answer the ${scenarios.length === 1 ? 'check' : `${scenarios.length} checks`} on where the sound leaves.` : 'Credited when you move on from the last step — explore as much as you like.',
    },
    takeaway: snd?.takeaway ?? src?.takeaway ?? '',
  };
}

function setupsContent(lesson: Lesson): PageContent {
  const set = lesson.pages.setting;
  const scenarios = (set?.credit.scenarios ?? []).filter((id) => !isRetired(lesson.id, id));
  return {
    title: 'Starting setups',
    goal: `See real mic setups on the ${lesson.noun.subject ?? lesson.noun.one}, drawn where the mic goes — its type, its aim and its distance — one at a time. Then what to settle before any mic goes up.`,
    credit: {
      scenarios,
      interactive: 'setupsSeen',
      note: `Look at every setup on the drawing${scenarios.length ? `, and answer the ${scenarios.length} ${plural(scenarios.length, 'check', 'checks')}` : ''}.`,
    },
    takeaway: set?.takeaway ?? 'A starting setup is a place to begin: put the mic up, listen, and move it.',
  };
}

const cache = new WeakMap<Lesson, Partial<Record<'meet' | 'setups', PageContent>>>();

/** A journey page's words and credit: as written, or built from the source
 *  pages (MEET IT from orient + how it sounds; STARTING SETUPS from the
 *  setting page's checks). */
export function pageOf(lesson: Lesson, id: PageId): PageContent {
  if (id !== 'meet' && id !== 'setups') return lesson.pages[id];
  const own = lesson.pages[id];
  if (own) return own;
  let c = cache.get(lesson);
  if (!c) {
    c = {};
    cache.set(lesson, c);
  }
  if (!c[id]) c[id] = id === 'meet' ? meetContent(lesson) : setupsContent(lesson);
  return c[id]!;
}

/** The scenarios a journey page credits, wherever they were written. */
export function scenariosOnPage(lesson: Lesson, id: PageId): MikingScenario[] {
  return liveScenarios(lesson).filter((s) => journeyPageOf(s.page) === id);
}

/** A scenario turned into a quick-check item (same words, same reasons). */
function asQuickItem(s: MikingScenario): DiagnosticItem {
  return { id: `qc.${s.id}`, covers: s.page, prompt: s.prompt, options: s.options, correct: s.correct, explain: s.explain, why: s.why };
}

const quickCache = new WeakMap<Lesson, readonly DiagnosticItem[]>();

const stemWords = (s: string): Set<string> =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.replace(/(ing|ed|es|s)$/, '').replace(/([bdgmnpt])\1$/, '$1')),
  );
const overlap = (a: Set<string>, b: Set<string>): number => {
  const both = [...a].filter((x) => b.has(x)).length;
  const all = new Set([...a, ...b]).size;
  return all ? both / all : 0;
};
/** Two items ask the same thing: their answers share most of their words,
 *  or the question and answer together do. */
export function sameQuestion(a: { prompt: string; correct: string }, b: { prompt: string; correct: string }): boolean {
  return overlap(stemWords(a.correct), stemWords(b.correct)) >= 0.4 || overlap(stemWords(`${a.prompt} ${a.correct}`), stemWords(`${b.prompt} ${b.correct}`)) >= 0.35;
}

/**
 * The QUICK CHECK the learner meets: the lesson's six items, each counting
 * for the journey page built from the page it was written for; a retired
 * item (about a step MEET IT no longer shows) is replaced by one of the
 * lesson's own MEET IT checks — then, if it has none left, a STARTING SETUPS
 * one — so the check stays six items and still covers both foundations.
 */
export function quickCheckOf(lesson: Lesson): readonly DiagnosticItem[] {
  const hit = quickCache.get(lesson);
  if (hit) return hit;
  const kept = lesson.diagnostic.filter((d) => !isRetired(lesson.id, d.id));
  const need = Math.max(0, Math.min(QUICK_CHECK_SIZE, lesson.diagnostic.length) - kept.length);
  const used = new Set(kept.map((d) => d.prompt));
  const avoid = QUICK_AVOID[lesson.id] ?? [];
  const pool = [...scenariosOnPage(lesson, 'meet'), ...scenariosOnPage(lesson, 'setups')].filter((s) => !used.has(s.prompt));
  // ONE no-repeat rule (reviews 2026-10-07, labs 1–2 and 3–4): a replacement
  // that asks the same thing as an item already in the check — by the word
  // rule (`sameQuestion`: "the carved top, driven through the floating
  // bridge" twice in six), or as a reviewer recorded it in QUICK_AVOID where
  // the words differ — is taken only when nothing else is left: one idea must
  // not count twice towards the pass.
  const taken: { prompt: string; correct: string }[] = [...kept];
  const fresh: MikingScenario[] = [];
  const dupes: MikingScenario[] = [];
  for (const s of pool) {
    if (avoid.includes(s.id) || taken.some((d) => sameQuestion(d, s))) dupes.push(s);
    else {
      fresh.push(s);
      taken.push(s);
    }
  }
  const extra = [...fresh, ...dupes].slice(0, need).map(asQuickItem);
  // Keep the authored order: a replacement takes the retired item's place.
  const out: DiagnosticItem[] = [];
  let e = 0;
  for (const d of lesson.diagnostic) {
    if (!isRetired(lesson.id, d.id)) out.push(d);
    else if (e < extra.length) out.push(extra[e++]);
  }
  quickCache.set(lesson, out);
  return out;
}

const served = new WeakMap<Lesson, Lesson>();

/**
 * The lesson as the journey serves it: retired checks gone (so a family's
 * own page, which lists its checks by `page`, shows only live ones), the
 * quick check as `quickCheckOf`, MEET IT and STARTING SETUPS in `pages`.
 */
export function restructureLesson(lesson: Lesson): Lesson {
  const hit = served.get(lesson);
  if (hit) return hit;
  const out: Lesson = {
    ...lesson,
    scenarios: liveScenarios(lesson),
    diagnostic: quickCheckOf(lesson),
    pages: { ...lesson.pages, meet: pageOf(lesson, 'meet'), setups: pageOf(lesson, 'setups') },
  };
  served.set(lesson, out);
  served.set(out, out);
  return out;
}

/** The source page a family's own page component is registered under, for a
 *  journey page built from it (MEET IT's two halves, STARTING SETUPS' checks). */
export const SOURCE_PARTS: Readonly<Partial<Record<PageId, readonly SourcePageId[]>>> = { meet: ['instrument', 'sound'], setups: ['setting'] };
