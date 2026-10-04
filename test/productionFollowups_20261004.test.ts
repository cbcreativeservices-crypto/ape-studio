/**
 * productionFollowups — receipts for the owner's rulings of 2026-10-04 on the
 * Audio Pre-/Post-Production labs ("we are a learning app"), after the
 * independent review of commit 6c2a147e.
 *
 *   1. Show the power sign-off and every learning moment: the 26 showWhen gates
 *      re-audited (power_signoff, freeze_date and automation_checked changed),
 *      the hidden note names the question and the answer, an access-services
 *      advisory, and help that teaches load, shared circuits and ground-supported
 *      structures.
 *   2. WHAT'S LEFT lists the actual open items by name, grouped by stage,
 *      blockers first, each one opening its stage at that question.
 *   3. Each export raises the packet revision — recorded only after the export
 *      succeeded, and shown only from the store's write result.
 *   4. A duplicate never inherits accepted conditions, and says so.
 *   Plus the cheap review items: one stage vocabulary, an accurate "Not
 *   started", BLOCKED before 99, next outstanding, a muted stale verdict, and
 *   the unused Alert import gone.
 *
 * Every block fails on HEAD (13941277).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(ROOT + p, 'utf8').replace(/\r\n/g, '\n');

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const schema = (await import('../src/features/production/schema.ts')) as Record<string, Any>;
const readiness = (await import('../src/features/production/readiness.ts')) as Record<string, Any>;
const packet = (await import('../src/features/production/packet.ts')) as Record<string, Any>;
const { createProjectStore, memoryStore, newProject } = (await import('../src/features/production/projectStore.ts')) as Record<string, Any>;
const { LABS } = (await import('../src/features/production/labs.ts')) as Record<string, Any>;

const PRE = LABS.preprod.stages;
const POST = LABS.postprod.stages;
const NOW = Date.parse('2026-10-04T12:00:00Z');

const proj = (lab: 'preprod' | 'postprod', pathway: 'music' | 'podcast' | 'live', values: Record<string, unknown> = {}): Any => ({
  ...newProject(lab, pathway, 'Receipt'),
  values,
});
const fieldDef = (stages: Any[], key: string): Any => {
  const [sid, fid] = key.split('.');
  return stages.find((s: Any) => s.stageId === sid).sections.flatMap((s: Any) => s.fields).find((f: Any) => f.fieldId === fid);
};
const visibleKeys = (stages: Any[], pw: string, values: Any): string[] =>
  schema.resolveLab(stages, pw, values).flatMap((s: Any) => s.sections.flatMap((sec: Any) => sec.fields.map((f: Any) => `${s.stageId}.${f.fieldId}`)));
const findingIds = (stages: Any[], p: Any): string[] => readiness.readProject(schema.resolveLab(stages, p.pathway, p.values), p, NOW).findings.map((f: Any) => f.ruleId);

// ── 1 · the gates, re-audited ────────────────────────────────────────────────

describe('ruling 1 — the power sign-off is shown, optional, and teaches', () => {
  const shows = (source: string) => visibleKeys(PRE, 'live', { 'people.power_source': source }).includes('readiness.power_signoff');

  it('shown for venue distribution and a generator used directly; hidden only for wall outlets', () => {
    assert.equal(shows('house_distro'), true, 'venue power: the venue electrician signs');
    assert.equal(shows('generator_direct'), true, 'a small generator: earthing and GFCI are the lesson');
    assert.equal(shows('temporary_distro'), true);
    assert.equal(shows('existing_outlets'), false);
  });

  it('optional — never a blocker for venue power or a direct generator — and still a blocker for temporary distribution', () => {
    assert.equal(fieldDef(PRE, 'readiness.power_signoff').required, false);
    for (const source of ['house_distro', 'generator_direct']) {
      assert.ok(shows(source), `${source}: in view`);
      assert.ok(!findingIds(PRE, proj('preprod', 'live', { 'people.power_source': source })).includes('readiness-power-not-signed'), source);
    }
    assert.ok(findingIds(PRE, proj('preprod', 'live', { 'people.power_source': 'temporary_distro' })).includes('readiness-power-not-signed'));
  });

  it('the help names the signer and the standards, and no longer says "not required"', () => {
    const help: string = fieldDef(PRE, 'readiness.power_signoff').help;
    assert.doesNotMatch(help, /Not required for/);
    assert.match(help, /optional here/);
    assert.match(help, /the signer is the venue's electrician/);
    assert.match(help, /BS 7909/);
    assert.match(help, /NEC Articles 520, 525 and 590/);
    assert.match(help, /ANSI E1\.19/);
    assert.match(help, /inspected, tested and certified whoever connects it/);
    assert.match(help, /GFCI or RCD/);
  });
});

describe('ruling 1 — the other gates the audit changed', () => {
  it('the freeze date is asked when NOT frozen yet (set the date it will be); hidden only with no software', () => {
    const shows = (v: string) => visibleKeys(PRE, 'music', { 'readiness.change_freeze': v }).includes('readiness.freeze_date');
    assert.equal(shows('not_frozen'), true);
    assert.equal(shows('frozen'), true);
    assert.equal(shows('not_applicable'), false);
    assert.match(fieldDef(PRE, 'readiness.freeze_date').help, /Not frozen yet\? Set the date it will be/);
  });

  it('"Automation checked for" stays in view when nothing was automated — stray written data is the lesson — and never nags', () => {
    assert.ok(visibleKeys(POST, 'music', { 'mix.automation_used': ['none'] }).includes('mix.automation_checked'));
    assert.match(fieldDef(POST, 'mix.automation_checked').help, /Even when nothing was automated on purpose, check for unintended written data/);
    assert.ok(!findingIds(POST, proj('postprod', 'music', { 'mix.automation_used': ['none'] })).includes('mix-automation-unchecked'));
  });

  /** The audit's outcome, pinned: re-gating anything is a deliberate act. */
  it('the gates after the audit: 25 kept or changed, 1 removed', () => {
    const gates: string[] = [];
    for (const [lab, stages] of [['pre', PRE], ['post', POST]] as const) {
      for (const s of stages) for (const sec of s.sections) for (const f of sec.fields) {
        if (f.showWhen) gates.push(`${lab} ${s.stageId}.${f.fieldId} ${f.showWhen.field} ${f.showWhen.equals ? '=' : '≠'} ${(f.showWhen.equals ?? f.showWhen.notEquals).join('|')}`);
      }
    }
    assert.deepEqual(gates, [
      'pre deliver.timecode_notes timecode_required ≠ no',
      'pre people.rigger rigging_required ≠ no',
      'pre people.electrician power_source ≠ existing_outlets',
      'pre people.mix_engineer define.services = mixing',
      'pre people.mastering_engineer define.services = mastering',
      'pre technical.timecode_plan deliver.timecode_required ≠ no',
      'pre readiness.rigging_signoff people.rigging_required ≠ no',
      'pre readiness.power_signoff people.power_source ≠ existing_outlets',
      'pre readiness.freeze_date change_freeze ≠ not_applicable',
      'post brief.start_timecode frame_rate ≠ none',
      'post media.verify_owner verify_coverage ≠ none',
      'post media.verify_findings verify_coverage ≠ none',
      'post session.drift_action drift_diagnosis ≠ none',
      'post build.cue_list replacement_needed ≠ no',
      'post build.match_plan replacement_needed ≠ no',
      'post build.match_verified replacement_needed ≠ no',
      'post build.correction_scope correction_decision ≠ none_needed',
      'post build.correction_target correction_decision ≠ none_needed|prohibited',
      'post build.correction_amount correction_decision ≠ none_needed|prohibited',
      'post build.correction_guards correction_decision ≠ none_needed|prohibited',
      'post build.correction_compared correction_decision ≠ none_needed|prohibited',
      'post mix.recombination_difference recombination_test = close|differs',
      'post finish.collection_checks collection_context ≠ standalone',
      'post finish.access_status access_deliverables ≠ none',
      'post finish.access_timing_checked access_deliverables ≠ none',
    ]);
  });
});

describe('ruling 1 — the hidden note names the question and the answer', () => {
  it('the exact wording, one and many, same stage and another stage', () => {
    assert.equal(
      schema.hiddenNoteText({ count: 1, question: 'Is anything flown or rigged?', answer: 'No' }),
      'One question is hidden because you answered “No” to “Is anything flown or rigged?” If that answer changes, it comes back with anything you wrote in it.',
    );
    assert.equal(
      schema.hiddenNoteText({ count: 3, question: 'Has correction been agreed', answer: 'Ruled out' }),
      '3 questions are hidden because you answered “Ruled out” to “Has correction been agreed”. If that answer changes, they come back with anything you wrote in them.',
    );
    assert.equal(
      schema.hiddenNoteText({ count: 1, question: 'Is anything flown or rigged?', answer: 'No', stageNum: 3 }),
      'One question is hidden because you answered “No” to “Is anything flown or rigged?” in stage 3. If that answer changes, it comes back with anything you wrote in it.',
    );
  });

  it('a resolved section carries the controlling question, its answer and its stage', () => {
    const values = { 'people.rigging_required': 'no', 'people.power_source': 'existing_outlets' };
    const lab = schema.resolveLab(PRE, 'live', values);
    const people = lab.find((s: Any) => s.stageId === 'people');
    const peopleNotes = people.sections.flatMap((s: Any) => s.hiddenBecause ?? []);
    assert.deepEqual(peopleNotes.map((r: Any) => `${r.count}|${r.question}|${r.answer}|${r.stageNum ?? '-'}`).sort(), [
      '1|How is the audio system powered?|Existing wall outlets only|-',
      '1|Is anything flown or rigged?|No, everything is ground-stacked or on stands|-',
    ]);
    const ready = lab.find((s: Any) => s.stageId === 'readiness');
    const readyNotes = ready.sections.flatMap((s: Any) => s.hiddenBecause ?? []);
    assert.ok(readyNotes.some((r: Any) => r.question === 'Is anything flown or rigged?' && r.stageNum === 3), 'another stage is named');
    // A multi-choice answer reads as its labels.
    const post = schema.resolveLab(POST, 'music', { 'build.correction_decision': 'prohibited' });
    const build = post.find((s: Any) => s.stageId === 'build').sections.flatMap((s: Any) => s.hiddenBecause ?? []);
    assert.ok(build.some((r: Any) => r.count === 4 && r.answer === 'Ruled out' && r.question === 'Has correction been agreed'));
  });

  it('the stage screen prints those words', () => {
    const s = read('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(s, /section\.hiddenBecause\.map\(\(r, i\) => \(/);
    assert.match(s, /\{hiddenNoteText\(r\)\}/);
  });
});

describe('ruling 1 — access services, power load and ground-supported structures', () => {
  const p = (type: string, needs: string[]) => proj('postprod', 'music', { 'finish.finish_type': type, 'finish.access_deliverables': needs });

  it('a programme or broadcast finish with "None required" gets an advisory to confirm in writing', () => {
    assert.ok(findingIds(POST, p('program_finish', ['none'])).includes('finish-access-none-unconfirmed'));
    assert.ok(findingIds(POST, p('broadcast', ['none'])).includes('finish-access-none-unconfirmed'));
    assert.ok(!findingIds(POST, p('music_master', ['none'])).includes('finish-access-none-unconfirmed'));
    assert.ok(!findingIds(POST, p('broadcast', ['captions'])).includes('finish-access-none-unconfirmed'));
    const rule = POST.flatMap((s: Any) => s.rules).find((r: Any) => r.ruleId === 'finish-access-none-unconfirmed');
    assert.equal(rule.severity, 'info', 'advisory: it never blocks and never costs score');
    assert.match(rule.title, /confirm that in writing/);
    for (const cite of ['47 CFR 79.1', 'CVAA', 'European Accessibility Act', 'Ofcom']) assert.ok(rule.detail.includes(cite), cite);
    assert.match(rule.fixHint, /keep their answer in writing/);
  });

  it('power help teaches the 80% continuous load, 1,440 W on 15 A 120 V, and dimmer hum', () => {
    const h: string = fieldDef(PRE, 'people.power_source').help;
    assert.match(h, /no more than 80% of its breaker's rating as a continuous load \(in the US, NEC 210\.20\(A\)\)/);
    assert.match(h, /about 1,440 W on a 15 A, 120 V circuit/);
    assert.match(h, /lighting dimmers, which can put a buzz into the sound system/);
    assert.equal(15 * 120 * 0.8, 1440);
  });

  it('rigging help names ground-supported structures (ANSI E1.21)', () => {
    assert.match(fieldDef(PRE, 'people.rigging_required').help, /Ground-supported structures count too: a truss tower, goalpost or ground-supported roof/);
    assert.match(fieldDef(PRE, 'people.rigging_required').help, /ANSI E1\.21/);
    assert.match(fieldDef(PRE, 'people.rigger').help, /ground-supported towers and roofs \(ANSI E1\.21 in the US\)/);
  });
});

// ── 2 · WHAT'S LEFT by name ──────────────────────────────────────────────────

describe('ruling 2 — WHAT\'S LEFT lists the actual open items', () => {
  const values = { 'people.power_source': 'temporary_distro', 'define.project_name': 'Night Train' };
  const p = proj('preprod', 'live', values);
  const stages = schema.resolveLab(PRE, 'live', values);
  const report = readiness.readProject(stages, p, NOW);
  const left = readiness.projectLeftItems(stages, report, p);

  it('stages holding a blocker come first, and the blocker leads each — by its title, with its field', () => {
    const blocked = (g: Any) => g.items.some((i: Any) => i.kind === 'blocker');
    // Stage 3 (no electrician named) and stage 6 (power not signed off) are
    // blocked; they lead, ahead of stage 1, in stage order.
    assert.deepEqual(left.filter(blocked).map((g: Any) => g.stageId), ['people', 'readiness']);
    assert.deepEqual(left.slice(0, 2).map((g: Any) => g.stageId), ['people', 'readiness']);
    const ready = left.find((g: Any) => g.stageId === 'readiness');
    assert.deepEqual(ready.items[0], { kind: 'blocker', text: 'Temporary power is in use and has not been signed off', fieldId: 'power_signoff' });
    for (const g of left.filter(blocked)) assert.equal(g.items[0].kind, 'blocker', g.stageId);
    const rest = left.slice(2).map((g: Any) => g.num);
    assert.ok(rest.length > 0 && rest[0] === 1);
    assert.deepEqual(rest, [...rest].sort((a, b) => a - b), 'the rest in stage order');
  });

  it('open required questions by their label (answered ones are not listed); findings by title', () => {
    const define = left.find((g: Any) => g.stageId === 'define');
    const req = define.items.filter((i: Any) => i.kind === 'required');
    assert.ok(req.some((i: Any) => i.text === 'Producer or project lead' && i.fieldId === 'project_lead'));
    assert.ok(!req.some((i: Any) => i.fieldId === 'project_name'), 'answered');
    const kinds = define.items.map((i: Any) => i.kind);
    assert.deepEqual(kinds, [...kinds].sort((a: string, b: string) => ['blocker', 'required', 'finding'].indexOf(a) - ['blocker', 'required', 'finding'].indexOf(b)));
    const titles = new Set(report.findings.filter((f: Any) => f.severity === 'attention').map((f: Any) => f.title));
    for (const g of left) for (const i of g.items) if (i.kind === 'finding') assert.ok(titles.has(i.text));
  });

  it('a question hidden by an earlier answer is never listed; a finished plan lists nothing', () => {
    const hidden = proj('preprod', 'live', { 'people.rigging_required': 'no' });
    const st = schema.resolveLab(PRE, 'live', hidden.values);
    const l = readiness.projectLeftItems(st, readiness.readProject(st, hidden, NOW), hidden);
    assert.ok(!l.some((g: Any) => g.items.some((i: Any) => i.fieldId === 'rigger' || i.fieldId === 'rigging_signoff')));
    const done = { ...report, stages: report.stages.map((s: Any) => ({ ...s, blockers: [], findings: [] })) };
    const allAnswered = { ...p, na: Object.fromEntries(stages.flatMap((s: Any) => s.sections.flatMap((sec: Any) => sec.fields.map((f: Any) => [`${s.stageId}.${f.fieldId}`, 'n/a'])))) };
    assert.deepEqual(readiness.projectLeftItems(stages, done, allAnswered), []);
  });

  it('next outstanding is the first item of that same list', () => {
    const n = readiness.nextOutstanding(left);
    assert.equal(n.stageId, 'people');
    assert.equal(n.num, 3);
    assert.equal(n.item.kind, 'blocker');
    assert.equal(n.item, left[0].items[0]);
    assert.equal(readiness.nextOutstanding([]), null);
  });

  it('the packet screen draws items by name, opens the stage AT the item, and keeps the honest empty text', () => {
    const s = read('src/screens/lab/production/ProductionPacketScreen.tsx');
    assert.match(s, /left: projectLeftItems\(stages, report, project\)/);
    assert.match(s, /focus: it\.fieldId \?\? 'findings',/);
    assert.match(s, /blocker: 'Blocker',\n  required: 'Required question',\n  finding: 'To look at',/);
    assert.match(s, /\{`STAGE \$\{g\.num\} · \$\{g\.title\.toUpperCase\(\)\}`\}/);
    assert.match(s, /Nothing is left that this plan requires/);
    assert.doesNotMatch(s, /stageLeftLine/);
  });

  it('the stage screen scrolls to the item it was opened for', () => {
    assert.match(read('src/navigation/types.ts'), /stageId: string;\n(?:.*\n){2}\s*focus\?: string;/);
    const s = read('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(s, /const \{ lab, projectId, stageId, focus \} = useRoute<R>\(\)\.params;/);
    assert.match(s, /scrollRef\.current\?\.scrollTo\(\{ y: Math\.max\(0, y - 12\), animated: false \}\);/);
    assert.match(s, /if \(field\.fieldId === focus\) tryFocus\(\);/);
    assert.match(s, /if \(focus === 'findings'\) tryFocus\(\);/);
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    assert.match(home, /NEXT OUTSTANDING/);
    assert.match(home, /focus: next\.item\.fieldId \?\? 'findings',/);
  });
});

// ── 3 · the revision number ──────────────────────────────────────────────────

describe('ruling 3 — each export raises the revision, recorded only by a write', () => {
  it('the export prints the next revision, dated now; nothing is stored by that', () => {
    const p = { ...newProject('preprod', 'music', 'R'), revision: 2, updatedAt: 1 };
    const next = packet.nextRevision(p, NOW);
    assert.equal(next.revision, 3);
    assert.equal(next.updatedAt, NOW);
    assert.equal(p.revision, 2, 'the input is untouched');
  });

  it('recordExport stores it, never lowers it, refuses nonsense, and a failed write claims nothing', async () => {
    const kv = memoryStore();
    const st = createProjectStore(kv);
    const p = newProject('preprod', 'music', 'R');
    await st.upsert(p);
    assert.equal((await st.recordExport('preprod', p.id, 1)).revision, 1);
    assert.equal((await st.recordExport('preprod', p.id, 2)).revision, 2);
    assert.equal((await st.recordExport('preprod', p.id, 1)).revision, 2, 'never lowers');
    assert.equal(await st.recordExport('preprod', p.id, 0), null);
    assert.equal(await st.recordExport('preprod', p.id, 1.5), null);
    const real = kv.setItem.bind(kv);
    kv.setItem = async () => {
      throw new Error('disk full');
    };
    assert.equal(await st.recordExport('preprod', p.id, 3), null);
    kv.setItem = real;
    assert.equal((await st.get('preprod', p.id)).revision, 2, 'not claimed without the write');
  });

  it('the document control shows it, and a never-exported packet says so', () => {
    const stages = schema.resolveLab(PRE, 'music', {});
    const p0 = newProject('preprod', 'music', 'R');
    const row = (p: Any) => packet.buildPacketModel({ project: p, stages, report: readiness.readProject(stages, p, NOW) }).control.find((r: Any) => r[0] === 'Revision')[1];
    assert.equal(row(p0), '0 — not exported yet');
    assert.equal(row({ ...p0, revision: 4 }), '4');
  });

  it('the packet screen records it after a successful export and shows it only from the write result', () => {
    const s = read('src/screens/lab/production/ProductionPacketScreen.tsx');
    const fn = s.slice(s.indexOf('const share = useLatchedPress('), s.indexOf('const labWord'));
    assert.match(fn, /const printed = nextRevision\(project\);/);
    assert.match(fn, /exportPacketPdf\(\{ project: printed,/);
    assert.ok(fn.indexOf('if (res.ok) {') < fn.indexOf('recordExport(lab, project.id, printed.revision)'));
    assert.match(fn, /if \(saved\) \{\n\s*setProject\(saved\);\n\s*setExportNote\(`This export is revision \$\{saved\.revision\}\. The next one will be revision \$\{saved\.revision \+ 1\}\.`\);/);
    assert.match(fn, /'Revision number not saved'/);
    assert.match(read('src/features/production/types.ts'), /recorded by `projectStore\.recordExport` only after\n\s*\* the export succeeded/);
  });
});

// ── 4 · duplicate ────────────────────────────────────────────────────────────

describe('ruling 4 — a duplicate never inherits accepted conditions', () => {
  it('the copy starts with none; the original keeps its own', async () => {
    const st = createProjectStore(memoryStore());
    const p = newProject('preprod', 'live', 'Job A');
    await st.upsert(p);
    await st.acceptCondition('preprod', p.id, { ruleId: 'readiness-power-not-signed', acceptedBy: 'Dana', reason: 'Venue confirmed by email', at: 1 });
    const copy = await st.duplicate('preprod', p.id);
    assert.deepEqual(copy.acceptedConditions, []);
    assert.deepEqual((await st.get('preprod', copy.id)).acceptedConditions, []);
    assert.equal((await st.get('preprod', p.id)).acceptedConditions.length, 1);
  });

  it('the lab home says so in one line, only when there were any', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    assert.match(home, /const hadConditions = project\.acceptedConditions\.length > 0;/);
    assert.match(home, /setDupNote\(hadConditions \? \{ id: copy\.id, text: 'Accepted conditions were not copied — review them on this project\.' \} : null\);/);
    assert.match(home, /\{dupNote && dupNote\.id === project\.id \? <Text style=\{styles\.sectionIntro\}>\{dupNote\.text\}<\/Text> : null\}/);
  });
});

// ── the cheap review items ───────────────────────────────────────────────────

describe('review items — one vocabulary, an honest "Not started", BLOCKED first', () => {
  const sr = (over: Any = {}): Any => ({
    stageId: 's', num: 1, title: 'S', state: 'attention', answeredRequired: 3, totalRequired: 6,
    answeredAll: 5, totalAll: 20, findings: [], blockers: [], fields: [], progress: 0.5, ...over,
  });

  it('one set of stage words for the row, the badge, the screen reader and the packet', () => {
    assert.deepEqual(readiness.STAGE_WORD, { complete: 'Complete', attention: 'Under way', missing: 'Not started', conflict: 'Blocked', na: 'Not applicable' });
    const m = read('src/screens/lab/production/ReadinessMeter.tsx');
    assert.doesNotMatch(m, /BADGE_WORD|READINESS_LABEL/);
    assert.match(m, /STAGE_WORD\[sig\.state\]\)\.toUpperCase\(\)/);
    assert.match(read('src/features/production/packet.ts'), /\$\{STAGE_WORD\[sr\.state\]\} — \$\{sr\.answeredRequired\} of/);
  });

  it('a stage with only optional answers is under way, not "not started"', () => {
    const st: Any = {
      stageId: 'x', num: 1, title: 'X', intro: '', whyItMatters: '', notices: [], rules: [],
      sections: [{ sectionId: 's', title: 'S', notices: [], fields: [
        { fieldId: 'req', label: 'R', kind: 'text', required: true },
        { fieldId: 'opt', label: 'O', kind: 'text', required: false },
      ] }],
    };
    const blank = proj('preprod', 'music', {});
    const someOptional = proj('preprod', 'music', { 'x.opt': 'a note' });
    assert.equal(readiness.readStage(st, blank, NOW).state, 'missing');
    assert.equal(readiness.readStage(st, someOptional, NOW).state, 'attention');
  });

  it('a blocked stage leads with BLOCKED, not 99', () => {
    const blocker = { severity: 'blocker', ruleId: 'b', fieldIds: [] };
    const s = readiness.stageSignal(sr({ state: 'conflict', progress: 1, answeredRequired: 6, blockers: [blocker], findings: [blocker] }));
    assert.equal(s.text, 'BLOCKED');
    assert.equal(s.pct, 99, 'the number is kept, behind the word');
    assert.equal(readiness.stageSignal(sr()).text, '50%');
    assert.match(read('src/screens/lab/production/ReadinessMeter.tsx'), /if \(stage\.blockers\.length > 0\) return `Blocked, \$\{blockerCount\(stage\)\}, \$\{counts\}`;/);
  });

  it('a stale packet\'s verdict is muted, and the unused Alert import is gone', () => {
    assert.match(read('src/screens/lab/production/ProductionPacketScreen.tsx'), /borderColor: stale \? colors\.textMuted : verdictTint\(built\.model\.verdict\)/);
    assert.doesNotMatch(read('src/screens/lab/production/ProductionLabScreen.tsx'), /import \{[^}]*\bAlert\b[^}]*\} from 'react-native'/);
  });
});
