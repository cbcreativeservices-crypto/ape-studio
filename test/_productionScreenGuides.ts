/**
 * Shared harness for the two production-lab Screen Guide receipts
 * (test/screenGuide_preprod_20261031.test.ts, test/screenGuide_postprod_20261031.test.ts).
 *
 * Both labs draw the same four screens from one engine, so the checks are the
 * same: every screen the learner reaches has a guide, every quoted name is
 * really on the screen or in the lab's data, and every TRY THIS outcome is
 * what the engine (readStage / readProject / checkActivity) produces for those
 * answers. Each test file supplies its lab's experiments as data.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
export const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
export const code = (p: string) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const P = '../src/features/production/';
const { LABS } = await import(P + 'labs.ts');
const { resolveLab, labHiddenKeys, hiddenKeys, hiddenNoteText } = await import(P + 'schema.ts');
const { readStage, readProject, stageSignal, projectLeftItems, nextOutstanding } = await import(P + 'readiness.ts');
const { newProject } = await import(P + 'projectStore.ts');
const { checkActivity, seedActivityProject, ACTIVITY_CHECKS } = await import(P + 'activities.ts');
const { buildPacketModel } = await import(P + 'packet.ts');
const { PATHWAY_LABEL, LAUNCH_PATHWAYS, VERDICT_LABEL } = await import(P + 'types.ts');
const G = await import('../src/screens/lab/production/productionScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

export { LABS, PATHWAY_LABEL, LAUNCH_PATHWAYS, VERDICT_LABEL, ACTIVITY_CHECKS, G, hiddenNoteText };

type Guide = Record<string, string[]>;
type Values = Record<string, unknown>;
export type Lab = 'preprod' | 'postprod';
export type Pw = 'music' | 'podcast' | 'live';
const PWS: Pw[] = ['music', 'podcast', 'live'];

const SECTION_KEYS: string[] = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
export const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
/** Curly apostrophes in copy, straight ones in code: compare on one form. */
export const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

// ── the engine, the way the screens call it ─────────────────────────────────

export function project(lab: Lab, pw: Pw, values: Values = {}) {
  const p = newProject(lab, pw, 'Guide check');
  Object.assign(p.values, values);
  return p;
}

/** One stage as ProductionStageScreen reads it: findings, signal, hidden notes. */
export function stageState(lab: Lab, pw: Pw, values: Values, stageId: string) {
  const p = project(lab, pw, values);
  const resolved = resolveLab(LABS[lab].stages, pw, p.values);
  const st = resolved.find((s: { stageId: string }) => s.stageId === stageId);
  const r = readStage(st, p, Date.now(), labHiddenKeys(resolved));
  return {
    titles: r.findings.map((f: { title: string }) => f.title) as string[],
    blockers: r.blockers.map((f: { title: string }) => f.title) as string[],
    signal: stageSignal(r).text as string,
    hidden: st.sections.flatMap((s: { hiddenBecause?: unknown[] }) => s.hiddenBecause ?? []),
    stage: st,
  };
}

/** The lab home's PRODUCTION READINESS and NEXT OUTSTANDING for a project. */
export function homeState(lab: Lab, p: ReturnType<typeof project>) {
  const resolved = resolveLab(LABS[lab].stages, p.pathway, p.values);
  const rep = readProject(resolved, p);
  const left = projectLeftItems(resolved, rep, p);
  return { rep, left, next: nextOutstanding(left), resolved };
}

export function packetModel(lab: Lab, p: ReturnType<typeof project>) {
  const { rep, resolved } = homeState(lab, p);
  return buildPacketModel({ project: p, stages: resolved, report: rep });
}

/** A field's resolved label on one pathway, or undefined where it is not asked. */
export function labelOf(lab: Lab, pw: Pw, stageId: string, fieldId: string): string | undefined {
  const st = resolveLab(LABS[lab].stages, pw, {}).find((s: { stageId: string }) => s.stageId === stageId);
  return st.sections.flatMap((s: { fields: { fieldId: string; label: string }[] }) => s.fields).find((f: { fieldId: string }) => f.fieldId === fieldId)?.label;
}

/** An option's label (a field's, or a table column's when `col` is given). */
export function optionLabel(lab: Lab, stageId: string, fieldId: string, value: string, col?: string): string {
  const stage = LABS[lab].stages.find((s: { stageId: string }) => s.stageId === stageId);
  const field = stage.sections.flatMap((s: { fields: unknown[] }) => s.fields).find((f: { fieldId: string }) => f.fieldId === fieldId);
  const opts = col ? field.columns.find((c: { columnId: string }) => c.columnId === col).options : field.options;
  const o = opts.find((x: { value: string }) => x.value === value);
  assert.ok(o, `${stageId}.${fieldId}${col ? '.' + col : ''} has no option ${value}`);
  return o.label;
}

export function columnLabel(lab: Lab, stageId: string, fieldId: string, col: string): string {
  const stage = LABS[lab].stages.find((s: { stageId: string }) => s.stageId === stageId);
  const field = stage.sections.flatMap((s: { fields: unknown[] }) => s.fields).find((f: { fieldId: string }) => f.fieldId === fieldId);
  return field.columns.find((c: { columnId: string }) => c.columnId === col).label;
}

export function activityState(lab: Lab, activityId: string, changes: Values = {}, pw?: Pw) {
  const stage = LABS[lab].stages.find((s: { activity?: { activityId: string } }) => s.activity?.activityId === activityId);
  const a = stage.activity;
  const p = seedActivityProject(lab, pw ?? a.onlyFor?.[0] ?? 'music', a);
  Object.assign(p.values, changes);
  const r = checkActivity(activityId, p, hiddenKeys(LABS[lab].stages, p.pathway, p.values));
  return { met: r.met.map((c: { label: string }) => c.label) as string[], unmet: r.unmet.map((c: { label: string }) => c.label) as string[], passed: r.passed, activity: a, stage };
}

// ── the experiments each lab supplies ────────────────────────────────────────

export type Step = {
  set: Values;
  /** The stage whose screen shows the result. */
  stage: string;
  in?: string[];
  out?: string[];
  /** The stage badge: 'BLOCKED', or not. */
  blocked?: boolean;
};
export type StageExperiment = {
  /** stageId + TRY THIS index. */
  guide: string;
  at: number;
  pathways?: Pw[];
  steps: Step[];
  /** Field labels the item quotes: [stageId, fieldId]. */
  labels?: [string, string][];
  /** Option labels the item names: [stageId, fieldId, value, column?]. */
  options?: [string, string, string, string?][];
  /** Any other text the item must contain (finding titles, numbers). */
  says?: string[];
};
export type ActivityExperiment = {
  activity: string;
  at: number;
  changes: Values;
  /** The criterion that turns ✓. */
  turns: string;
  labels?: [string, string][];
  options?: [string, string, string, string?][];
};

// ── the suite ────────────────────────────────────────────────────────────────

const SCREENS = {
  home: 'src/screens/lab/production/ProductionLabScreen.tsx',
  stage: 'src/screens/lab/production/ProductionStageScreen.tsx',
  activity: 'src/screens/lab/production/ProductionActivityScreen.tsx',
  packet: 'src/screens/lab/production/ProductionPacketScreen.tsx',
};
const SCREEN_SRC = [
  ...Object.values(SCREENS),
  'src/screens/lab/production/ReadinessMeter.tsx',
  'src/screens/lab/production/FieldRow.tsx',
  'src/screens/lab/production/AcceptConditionSheet.tsx',
  'src/features/production/packet.ts',
  'src/features/production/readiness.ts',
  'src/features/production/types.ts',
]
  .map(code)
  .join('\n');

/** Every string in a lab's data: labels, options, titles, findings, criteria. */
function corpus(lab: Lab): string {
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(LABS[lab]);
  for (const s of LABS[lab].stages) if (s.activity) for (const c of ACTIVITY_CHECKS[s.activity.activityId]) strings.push(c.label);
  for (const pw of PWS) for (const st of resolveLab(LABS[lab].stages, pw, {})) walk(st.sections);
  return norm(strings.join('\n'));
}

export function runProductionGuideSuite(opts: {
  lab: Lab;
  /** What the learner types in a TRY THIS (example input, not on-screen text). */
  exampleInputs: string[];
  stageExperiments: StageExperiment[];
  activityExperiments: ActivityExperiment[];
}) {
  const { lab } = opts;
  const def = LABS[lab];
  const g = G.PRODUCTION_SCREEN_GUIDES[lab];
  const all: [string, Guide][] = [
    ['start', g.start],
    ['home', g.home],
    ['packet', g.packet],
    ...Object.entries(g.stages as Record<string, Guide>).map(([k, v]) => [`stage:${k}`, v] as [string, Guide]),
    ...Object.entries(g.activities as Record<string, Guide>).map(([k, v]) => [`exercise:${k}`, v] as [string, Guide]),
  ];

  describe(`${def.title}: every screen the learner reaches has a complete guide`, () => {
    it('one guide per stage and per exercise — none missing, none for a stage or exercise that does not exist', () => {
      assert.deepEqual(Object.keys(g.stages).sort(), def.stages.map((s: { stageId: string }) => s.stageId).sort());
      const acts = def.stages.filter((s: { activity?: unknown }) => s.activity).map((s: { activity: { activityId: string } }) => s.activity.activityId);
      assert.equal(acts.length, def.stages.length, 'every stage carries an exercise');
      assert.deepEqual(Object.keys(g.activities).sort(), [...acts].sort());
    });
    for (const [id, gd] of all) {
      it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
        assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
        // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
        const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
        assert.ok(intro, `${id}: no intro`);
        assert.ok(intro.learning.trim().split(/\s+/).length <= 30, `${id}: intro.learning over 30 words`);
        assert.ok(intro.start.trim().split(/\s+/).length <= 40, `${id}: intro.start over 40 words`);
        for (const k of SECTION_KEYS) {
          assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k]?.length} bullets`);
          for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
        }
        assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
      });
    }
    it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no gear makers', () => {
      for (const [id, gd] of all) {
        const t = textOf(gd);
        assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\byou mastered\b|\bmastery\b|\bmaster (it|this|the art)\b|\byou will learn to\b/i, `${id}: claims a skill`);
        assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b(?<!0 \/ 100)/i, `${id}: an "N of total"`);
        assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
        assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|design review|bug hunt)\b/i, `${id}: a build note`);
        assert.doesNotMatch(t, /\b(Pro Tools|Logic Pro|Ableton|Avid|Shure|Sennheiser|Neumann|Yamaha|Behringer|Focusrite|iZotope|Dropbox|WeTransfer)\b/, `${id}: a maker or product name`);
      }
    });
  });

  describe(`${def.title}: every step fits its no-scroll budget`, () => {
    it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS ≤ tryItem', () => {
      const over: string[] = [];
      for (const [id, gd] of all) {
        for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
          if (s.place === 'strip') {
            for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
            continue;
          }
          const n = gd[s.key].join(' ').length;
          const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
          if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
        }
      }
      assert.deepEqual(over, []);
    });
  });

  describe(`${def.title}: each guide quotes the screen’s real names`, () => {
    const C = corpus(lab);
    const SRC = norm(SCREEN_SRC);
    const ALLOW = new Set(opts.exampleInputs.map(norm));
    it('every “quoted” phrase is a label, option, title or finding from the lab — or one of the screen’s own words', () => {
      const bad: string[] = [];
      for (const [id, gd] of all) {
        for (const m of textOf(gd).matchAll(/“([^”]+)”/g)) {
          const q = norm(m[1]);
          if (ALLOW.has(q) || C.includes(q) || SRC.includes(q)) continue;
          bad.push(`${id}: “${m[1]}”`);
        }
      }
      assert.deepEqual(bad, []);
    });
    it('each stage guide names that stage’s header kicker and every section the stage can show', () => {
      const word = def.title.replace(/^Audio /, '').toUpperCase();
      // The kicker the stage screen builds: lab title minus "Audio ", upper case, · STAGE n.
      assert.match(code(SCREENS.stage), /\.replace\(\/\^Audio \/, ''\)\.toUpperCase\(\)/);
      assert.match(code(SCREENS.stage), /` · STAGE \$\{stage\.num\}`/);
      for (const s of def.stages) {
        const gt = textOf(g.stages[s.stageId]);
        assert.ok(gt.includes(`${word} · STAGE ${s.num}`), `${s.stageId}: kicker`);
        for (const sec of s.sections) assert.ok(gt.includes(sec.title), `${s.stageId}: never names the section “${sec.title}”`);
      }
    });
    it('the stage, home, exercise and packet screens really carry the names the guides use', () => {
      const names = [
        'WHY THIS MATTERS', 'SEE THEM ↓', 'WHAT THIS PLAN IS STILL MISSING', 'WHAT THIS PROJECT IS STILL MISSING', '+ ADD ROW', 'Not applicable to this project', 'UNDO', 'SAVE',
        "WHAT'S LEFT IN THE WHOLE PLAN", "WHAT'S LEFT IN THE WHOLE PROJECT", 'START A PROJECT', '+ NEW PROJECT', 'DUPLICATE', 'DELETE', 'PICK UP WHERE YOU LEFT OFF', 'NEXT OUTSTANDING',
        'PRODUCTION READINESS', 'EXERCISES', 'ACCEPT A CONDITION', 'RECORD IT', 'PROCEEDING WITH ACCEPTED CONDITIONS', 'ONE THING BLOCKS THIS PROJECT',
        'OPEN THE PLAN AND FIX IT', 'OPEN THE PROJECT AND FIX IT', 'REVIEW YOUR WORK', 'READ THE REASONING', 'READ THE DEBRIEF', 'START AGAIN', 'SOLVED', ' · EXERCISE',
        "WHAT'S LEFT", 'SHARE AS PDF', 'MUST BE RESOLVED BEFORE PROCEEDING', 'ACCEPTED CONDITIONS', "'Revision'", "'Revision date'", "'Prepared by'",
        "'Status'", '0 — not exported yet', 'Unattributed', 'Not decided — required', 'Not applicable —', "'Blocker'", "'Required question'", "'To look at'",
        'BLOCKED', '/ 100',
      ];
      for (const n of names) assert.ok(SRC.includes(norm(n)), `“${n}” is no longer on the production screens — update the guides`);
      // Built on screen from the lab's data, so checked against the data.
      assert.match(code(SCREENS.home), /`THE \$\{NUMBER_WORD\[def\.outline\.length\] \?\? def\.outline\.length\} STAGES`/);
      assert.match(code(SCREENS.home), /`OPEN THE \$\{def\.packetName\.toUpperCase\(\)\}`/);
      // Post-Production says PROJECT, Pre-Production PLAN (owner 2026-11-09).
      assert.match(code(SCREENS.stage), /`\$\{lab === 'postprod' \? "WHAT'S LEFT IN THE WHOLE PROJECT" : "WHAT'S LEFT IN THE WHOLE PLAN"\} · \$\{\(labDef\(lab\)\?\.packetName \?\? 'packet'\)\.toUpperCase\(\)\} ›`/);
      const nWord = ({ 6: 'SIX', 8: 'EIGHT' } as Record<number, string>)[def.outline.length];
      for (const id of ['start', 'home'] as const) {
        const t = textOf(g[id]);
        if (id === 'home' || t.includes('STAGES')) assert.ok(t.includes(`THE ${nWord} STAGES`), `${id}: THE ${nWord} STAGES`);
      }
      assert.ok(textOf(g.home).includes(`OPEN THE ${def.packetName.toUpperCase()}`));
      for (const st of Object.values(g.stages as Record<string, Guide>)) assert.ok(st.control.join(' ').includes(`WHAT’S LEFT IN THE WHOLE ${lab === 'postprod' ? 'PROJECT' : 'PLAN'} · ${def.packetName.toUpperCase()}`));
      // The verdict words each guide uses are this lab's.
      const V = VERDICT_LABEL[lab];
      assert.ok(textOf(g.home).includes(V.not_ready) && textOf(g.home).includes(V.ready_with_conditions));
      // The three project types, as START A PROJECT lists them.
      for (const pw of LAUNCH_PATHWAYS) assert.ok(textOf(g.start).includes(PATHWAY_LABEL[pw]), PATHWAY_LABEL[pw]);
    });
    it('each exercise guide: its stage number, title, where it is offered, and its count of checks', () => {
      const offered = (only?: string[]) =>
        !only ? 'all three project types' : only.map((pw) => PATHWAY_LABEL[pw]).join(' and ') + ' projects';
      const WORD: Record<number, string> = { 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };
      for (const s of def.stages) {
        const a = s.activity;
        const gd = g.activities[a.activityId] as Guide;
        const seeing = gd.seeing.join(' ');
        assert.ok(seeing.includes(`STAGE ${s.num} · EXERCISE`), a.activityId);
        assert.ok(seeing.includes(`“${a.title}”`), `${a.activityId}: title`);
        assert.ok(seeing.includes(`offered on ${offered(a.onlyFor)}.`), `${a.activityId}: offered on`);
        // Course-navigation lines left WHAT THIS TEACHES (owner 2026-11-08); a "Practice for Stage n" kept in an intro names the right stage.
        assert.ok(!gd.teaches.join(' ').includes('Practice for Stage'), `${a.activityId}: navigation line in WHAT THIS TEACHES`);
        const pr = (gd as unknown as { intro?: { learning: string } }).intro?.learning.match(/Practice for Stage (\d+)/);
        if (pr) assert.equal(Number(pr[1]), s.num, `${a.activityId}: intro names the stage`);
        // A count quoted in TRY THIS ("All five checks start ○") is the real one.
        const n = ACTIVITY_CHECKS[a.activityId].length;
        const m = gd.tryThis.join(' ').match(/\b(All five|Five|Six|Seven|Eight) checks start ○/i);
        if (m) {
          assert.equal(m[1].replace(/^All /i, '').toLowerCase(), WORD[n], `${a.activityId}: ${n} checks`);
          assert.equal(activityState(lab, a.activityId).met.length, 0, `${a.activityId}: the fresh copy passes nothing`);
        }
      }
    });
  });

  describe(`${def.title}: every TRY THIS outcome is what the engine produces`, () => {
    for (const e of opts.stageExperiments) {
      const item = () => g.stages[e.guide].tryThis[e.at] as string;
      for (const pw of e.pathways ?? PWS) {
        it(`${e.guide} #${e.at + 1} on ${pw}`, () => {
          const values: Values = {};
          for (const [i, st] of e.steps.entries()) {
            Object.assign(values, st.set);
            const s = stageState(lab, pw, values, st.stage);
            for (const t of st.in ?? []) assert.ok(s.titles.includes(t), `step ${i + 1}: “${t}” should be listed; got ${s.titles.join(' | ')}`);
            for (const t of st.out ?? []) assert.ok(!s.titles.includes(t), `step ${i + 1}: “${t}” should be gone`);
            if (st.blocked !== undefined) assert.equal(s.signal === 'BLOCKED', st.blocked, `step ${i + 1}: badge ${s.signal}`);
          }
          for (const [sid, fid] of e.labels ?? []) {
            const l = labelOf(lab, pw, sid, fid);
            assert.ok(l, `${sid}.${fid} is not asked on ${pw}`);
            assert.ok(norm(item()).includes(norm(l)), `the item does not quote “${l}”`);
          }
          for (const [sid, fid, v, col] of e.options ?? []) assert.ok(item().includes(optionLabel(lab, sid, fid, v, col)), `option ${v}`);
          for (const t of e.says ?? []) assert.ok(item().includes(t), `the item does not say “${t}”`);
        });
      }
    }
    for (const e of opts.activityExperiments) {
      it(`exercise ${e.activity} #${e.at + 1}: “${e.turns}” turns ✓`, () => {
        const item = g.activities[e.activity].tryThis[e.at] as string;
        const before = activityState(lab, e.activity);
        const after = activityState(lab, e.activity, e.changes);
        assert.ok(before.unmet.includes(e.turns), 'starts ○');
        assert.ok(after.met.includes(e.turns), 'turns ✓');
        assert.equal(after.met.length, before.met.length + 1, 'only that check changes');
        const pw = before.activity.onlyFor?.[0] ?? 'music';
        for (const [sid, fid] of e.labels ?? []) assert.ok(norm(item).includes(norm(labelOf(lab, pw, sid, fid)!)), `quotes ${fid}`);
        for (const [sid, fid, v, col] of e.options ?? []) assert.ok(item.includes(optionLabel(lab, sid, fid, v, col)), `option ${v}`);
        // Either the criterion is quoted whole, or the item names it plainly.
        if (item.includes('“') && item.includes('” turns ✓')) assert.ok(item.includes(`“${e.turns}” turns ✓`), 'quotes the criterion as drawn');
      });
    }
  });

  describe(`${def.title}: wiring — ⓘ on every screen, the practice chip kept`, () => {
    it('each screen asks productionScreenGuides for its guide and wraps its content in a regions-off host', () => {
      const H = code(SCREENS.home);
      assert.match(H, /const guide = productionHomeGuide\(lab, project !== null\);/);
      assert.match(H, /<ScreenGuideHost regions=\{false\} resetKey=\{project \? 'project' : 'start'\}>/);
      const S = code(SCREENS.stage);
      assert.match(S, /const guide = productionStageGuide\(lab, stageId\);/);
      assert.match(S, /<ScreenGuideHost regions=\{false\} resetKey=\{stageId\}>/);
      const A = code(SCREENS.activity);
      assert.match(A, /const guide = productionActivityGuide\(lab, activityId\);/);
      assert.match(A, /<ScreenGuideHost regions=\{false\} resetKey=\{activityId\}>/);
      const K = code(SCREENS.packet);
      assert.match(K, /const guide = productionPacketGuide\(lab\);/);
      assert.match(K, /<ScreenGuideHost regions=\{false\}>/);
      for (const src of [H, S, A, K]) {
        assert.match(src, /<\/ScreenGuideHost>\s*<\/(View|KeyboardAvoidingView)>\s*\);\s*\}/, 'the host closes as the root’s last child');
        assert.match(src, /<ScreenGuideHintAnchor off=\{!guide\}>/);
      }
    });
    it('CHIP DECISION: the "practice" AccuracyNote stays on all four screens, and the ⓘ key comes right after it', () => {
      const pairs: [string, RegExp][] = [
        [SCREENS.home, /<AccuracyNote variant="practice" compact \/>\s*\{guide \? <ScreenGuideKey title=\{def\.title\.toUpperCase\(\)\} guide=\{guide\} \/> : null\}/],
        [SCREENS.stage, /<AccuracyNote variant="practice" compact \/>\s*\{guide && authored \? <ScreenGuideKey title=\{authored\.title\.toUpperCase\(\)\} guide=\{guide\} \/> : null\}/],
        [SCREENS.activity, /<AccuracyNote variant="practice" compact \/>\s*\{guide \? <ScreenGuideKey title=\{title\.toUpperCase\(\)\} guide=\{guide\} \/> : null\}/],
        [SCREENS.packet, /<AccuracyNote variant="practice" compact \/>\s*\{guide && def \? <ScreenGuideKey title=\{def\.packetName\.toUpperCase\(\)\} guide=\{guide\} \/> : null\}/],
      ];
      for (const [p, re] of pairs) assert.match(code(p), re, p);
    });
    it('the resolver: this lab’s guides, and nothing for an unknown lab, stage or exercise', () => {
      assert.equal(G.productionHomeGuide(lab, false), g.start);
      assert.equal(G.productionHomeGuide(lab, true), g.home);
      assert.equal(G.productionPacketGuide(lab), g.packet);
      for (const s of def.stages) {
        assert.equal(G.productionStageGuide(lab, s.stageId), g.stages[s.stageId]);
        assert.equal(G.productionActivityGuide(lab, s.activity.activityId), g.activities[s.activity.activityId]);
      }
      assert.equal(G.productionStageGuide(lab, 'constructor'), undefined);
      assert.equal(G.productionActivityGuide(lab, 'nope'), undefined);
      assert.equal(G.productionHomeGuide('nope' as Lab, true), undefined);
    });
  });
}

export { PWS };
