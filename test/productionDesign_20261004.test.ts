/**
 * productionDesign — receipts for the production labs' design review items
 * #1 (showWhen), #4 (progress signal) and #5 (the packet screen and owning the
 * project), completed 2026-10-04 at the owner's request.
 *
 * Review: Downloads/2026-09-18_BUGHUNT/design-production-labs.md.
 *
 * Every block here fails on HEAD (d0449070): the validator did not check
 * conditions at all, a condition could not name another stage, a hidden
 * field's emptiness still raised findings, there was no stage-level number,
 * a blocked project could read 100, the packet had no model to draw, no
 * WHAT'S LEFT list, no resume marker and no packet route.
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

const schema = (await import('../src/features/production/schema.ts')) as typeof import('../src/features/production/schema.ts') & Record<string, any>;
const { validateStage, validateStages, validateSeeds, resolveStage, findBannedCopy } = schema;
const readiness = (await import('../src/features/production/readiness.ts')) as Record<string, any>;
const { readProject } = readiness;
const packet = (await import('../src/features/production/packet.ts')) as Record<string, any>;
const activities = (await import('../src/features/production/activities.ts')) as Record<string, any>;
const types = (await import('../src/features/production/types.ts')) as Record<string, any>;
const { valueKey } = types;
const { createProjectStore, memoryStore, newProject, normaliseProject } = await import('../src/features/production/projectStore.ts');
const { LABS } = await import('../src/features/production/labs.ts');
const rulesMod = (await import('../src/features/production/rules.ts')) as Record<string, any>;

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const proj = (lab: 'preprod' | 'postprod', pathway: 'music' | 'podcast' | 'live', values: Record<string, unknown> = {}): Any => ({
  ...newProject(lab, pathway, 'Receipt'),
  values,
});

// ── #1 showWhen ──────────────────────────────────────────────────────────────

const base = (fields: Any[], sectionShowWhen?: Any): Any => ({
  stageId: 'st',
  num: 1,
  title: 'T',
  intro: '',
  whyItMatters: '',
  rules: [],
  sections: [{ sectionId: 'sec', title: 'S', fields, ...(sectionShowWhen ? { showWhen: sectionShowWhen } : {}) }],
});
const choice = { fieldId: 'ctrl', label: 'C', kind: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] };

describe('#1 the validator refuses a condition that could never work', () => {
  it('an unknown field, the field itself, a free-text controller, a misspelt value, and no values', () => {
    const errs = (f: Any) => validateStage(base([choice, { fieldId: 'other', label: 'O', kind: 'text' }, f]));
    assert.ok(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'nope', equals: ['yes'] } }).some((e: string) => /does not exist/.test(e)));
    assert.ok(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'd', equals: ['yes'] } }).some((e: string) => /names the field itself/.test(e)));
    assert.ok(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'other', equals: ['x'] } }).some((e: string) => /must be choice, multiChoice or status/.test(e)));
    assert.ok(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'ctrl', notEquals: ['nope'] } }).some((e: string) => /is not an option/.test(e)));
    assert.ok(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'ctrl' } }).some((e: string) => /needs "equals" or "notEquals"/.test(e)));
    assert.deepEqual(errs({ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'ctrl', notEquals: ['no'] } }), []);
  });

  it('a cycle is an error, in one stage and across stages', () => {
    const a = { fieldId: 'a', label: 'A', kind: 'choice', options: [{ value: 'x', label: 'X' }], showWhen: { field: 'b', equals: ['x'] } };
    const b = { fieldId: 'b', label: 'B', kind: 'choice', options: [{ value: 'x', label: 'X' }], showWhen: { field: 'a', equals: ['x'] } };
    assert.ok(validateStage(base([a, b])).some((e: string) => /showWhen cycle/.test(e)));

    const s1 = { ...base([{ ...a, showWhen: { field: 's2.b', equals: ['x'] } }]), stageId: 's1' };
    const s2 = { ...base([{ ...b, showWhen: { field: 's1.a', equals: ['x'] } }]), stageId: 's2' };
    assert.ok(validateStages([s1, s2]).some((e: string) => /showWhen cycle: s\d\.\w → s\d\.\w → s\d\.\w/.test(e)));
  });

  it('a cross-stage reference must exist, and a section may not hide its own controller', () => {
    const s1 = { ...base([{ fieldId: 'd', label: 'D', kind: 'text', showWhen: { field: 'ghost.field', equals: ['yes'] } }]), stageId: 's1' };
    assert.ok(validateStages([s1]).some((e: string) => /does not exist/.test(e)));
    assert.ok(validateStage(base([choice], { field: 'ctrl', equals: ['yes'] })).some((e: string) => /inside the section it hides/.test(e)));
  });

  it('every authored gate in both labs validates, seeds included, and the banned-copy check still runs', () => {
    for (const lab of ['preprod', 'postprod'] as const) {
      assert.deepEqual(validateStages(LABS[lab].stages), [], lab);
      assert.deepEqual(validateSeeds(LABS[lab].stages), [], lab);
      for (const s of LABS[lab].stages) assert.deepEqual(findBannedCopy(s), [], s.stageId);
    }
  });

  it('an exercise that hides its own seeded field is refused', () => {
    const st = {
      ...base([choice, { fieldId: 'dep', label: 'D', kind: 'text', showWhen: { field: 'ctrl', notEquals: ['no'] } }]),
      activity: { activityId: 'act', title: 'A', prompt: '', passWhen: '', debrief: '', seed: { 'st.ctrl': 'no', 'st.dep': 'x' } },
    };
    assert.ok(validateSeeds([st]).some((e: string) => /which its own seed hides/.test(e)));
  });
});

describe('#1 the conditions behave', () => {
  const pre = LABS.preprod.stages;
  const people = pre.find((s: Any) => s.stageId === 'people')!;
  const fieldsOf = (st: Any) => st.sections.flatMap((s: Any) => s.fields.map((f: Any) => f.fieldId));

  it('a condition can name ANOTHER stage: the mix engineer is asked only when mixing is in scope', () => {
    const vals = (services?: string[]) => (services ? { [valueKey('define', 'services')]: services } : {});
    assert.ok(!fieldsOf(resolveStage(people, 'music', vals(['recording']), pre)).includes('mix_engineer'));
    assert.ok(fieldsOf(resolveStage(people, 'music', vals(['recording', 'mixing']), pre)).includes('mix_engineer'));
    assert.ok(fieldsOf(resolveStage(people, 'music', vals(), pre)).includes('mix_engineer'), 'unanswered → shown');
  });

  it('a hidden controller hides its dependants (a chain)', () => {
    const chain = base([
      choice,
      { fieldId: 'mid', label: 'M', kind: 'choice', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }], showWhen: { field: 'ctrl', equals: ['yes'] } },
      { fieldId: 'leaf', label: 'L', kind: 'text', showWhen: { field: 'mid', equals: ['on'] } },
    ]);
    const r = resolveStage(chain, 'music', { 'st.ctrl': 'no', 'st.mid': 'on' });
    assert.deepEqual(fieldsOf(r), ['ctrl']);
    assert.deepEqual(r.hidden, ['st.mid', 'st.leaf']);
  });

  it('multi-choice notEquals: "none" alone hides; "none" beside a real answer keeps the question', () => {
    // (automation_checked was the example until 2026-10-04, when the owner's
    // "show every learning moment" ruling un-gated it — stray automation is
    // worth checking even when nothing was automated on purpose.)
    const finish = LABS.postprod.stages.find((s: Any) => s.stageId === 'finish')!;
    const shows = (needed: string[]) => fieldsOf(resolveStage(finish, 'music', { 'finish.access_deliverables': needed })).includes('access_status');
    assert.equal(shows(['none']), false);
    assert.equal(shows(['captions', 'none']), true);
    assert.equal(shows(['captions']), true);
  });

  it('a plain "watched field is empty" rule never reports a hidden field as missing', () => {
    // On HEAD the field was hidden on screen but the rule still counted it as
    // unanswered — a blocker about a question the learner could not see.
    const st = {
      ...base([choice, { fieldId: 'dep', label: 'D', kind: 'text', required: true, showWhen: { field: 'ctrl', notEquals: ['no'] } }]),
      rules: [{ ruleId: 'dep-empty', watches: ['st.dep'], severity: 'blocker', kind: 'missing', title: 'T', detail: 'D' }],
    };
    const hiddenP = proj('preprod', 'music', { 'st.ctrl': 'no' });
    const r = readProject([resolveStage(st, 'music', hiddenP.values)], hiddenP);
    assert.deepEqual(r.findings, []);
    assert.equal(r.verdict, 'ready');
    const shownP = proj('preprod', 'music', { 'st.ctrl': 'yes' });
    assert.deepEqual(readProject([resolveStage(st, 'music', shownP.values)], shownP).findings.map((f: Any) => f.ruleId), ['dep-empty']);
  });

  /**
   * THE INVARIANT. For every authored gate, on every pathway it exists on:
   * with the controller set to hide it, the dependant's stored answer changes
   * NOTHING — not one finding, not the score, not the verdict — and no finding
   * points at it. That is "a hidden field never blocks and never scores", and
   * "kept but not evaluated", for all of them at once.
   */
  it('a hidden field is never evaluated — every gate, both labs, every pathway', () => {
    let checked = 0;
    for (const lab of ['preprod', 'postprod'] as const) {
      const stages = LABS[lab].stages;
      for (const pw of ['music', 'podcast', 'live'] as const) {
        for (const st of stages) {
          for (const sec of st.sections) {
            for (const f of sec.fields as Any[]) {
              if (!f.showWhen) continue;
              if (f.onlyFor && !f.onlyFor.includes(pw)) continue;
              const ck = schema.showWhenKey(st.stageId, f.showWhen.field);
              const [csid, cfid] = ck.split('.');
              const ctrl = stages.find((s: Any) => s.stageId === csid)!.sections.flatMap((s: Any) => s.fields).find((x: Any) => x.fieldId === cfid);
              if (ctrl.onlyFor && !ctrl.onlyFor.includes(pw)) continue;
              const opts: string[] = ctrl.kind === 'status' ? ['Approved'] : ctrl.options.map((o: Any) => o.value);
              const hideWith = f.showWhen.notEquals ? f.showWhen.notEquals[0] : opts.find((o) => !f.showWhen.equals.includes(o));
              const v = ctrl.kind === 'multiChoice' ? [hideWith] : hideWith;
              const key = `${st.stageId}.${f.fieldId}`;
              const filled = f.kind === 'multiChoice' ? [f.options[0].value] : f.kind === 'table' ? [{ x: 'y' }] : f.kind === 'choice' ? f.options[0].value : f.kind === 'status' ? 'Approved' : 'something';
              const without = proj(lab, pw, { [ck]: v });
              const withIt = proj(lab, pw, { [ck]: v, [key]: filled });
              const now = Date.parse('2026-10-04T12:00:00Z');
              const rA = readProject(schema.resolveLab(stages, pw, without.values), without, now);
              const rB = readProject(schema.resolveLab(stages, pw, withIt.values), withIt, now);
              assert.ok(schema.labHiddenKeys(schema.resolveLab(stages, pw, withIt.values)).has(key), `${key} hidden by ${ck}=${hideWith}`);
              const ids = (r: Any) => r.findings.map((x: Any) => x.ruleId).sort();
              assert.deepEqual(ids(rB), ids(rA), `${lab}/${pw}: ${key}'s hidden answer changed the findings`);
              assert.equal(rB.score, rA.score, `${key}: score`);
              assert.equal(rB.verdict, rA.verdict, `${key}: verdict`);
              assert.ok(!rB.findings.some((x: Any) => x.stageId === st.stageId && x.fieldIds.includes(f.fieldId)), `${key}: a finding points at a hidden field`);
              checked++;
            }
          }
        }
      }
    }
    assert.ok(checked >= 50, `checked ${checked} gate × pathway cases`);
  });

  it('a hidden answer is kept, and comes back with the question', async () => {
    const st = createProjectStore(memoryStore());
    const p = newProject('postprod', 'music', 'keep');
    assert.equal(await st.upsert(p), true);
    await st.setValue('postprod', p.id, 'mix', 'recombination_test', 'differs');
    await st.setValue('postprod', p.id, 'mix', 'recombination_difference', 'reverb missing from stems');
    const hiddenNow = await st.setValue('postprod', p.id, 'mix', 'recombination_test', 'nulls');
    assert.equal(hiddenNow!.values['mix.recombination_difference'], 'reverb missing from stems', 'kept while hidden');
    const mix = LABS.postprod.stages.find((s: Any) => s.stageId === 'mix')!;
    assert.ok(!fieldsOf(resolveStage(mix, 'music', hiddenNow!.values)).includes('recombination_difference'));
    const back = await st.setValue('postprod', p.id, 'mix', 'recombination_test', 'close');
    assert.ok(fieldsOf(resolveStage(mix, 'music', back!.values)).includes('recombination_difference'));
    assert.equal(back!.values['mix.recombination_difference'], 'reverb missing from stems');
  });

  it('an exercise check never passes on a hidden answer', () => {
    activities.registerActivityChecks({ __receipt: [{ id: 'c', label: 'L', met: (c: Any) => c.answered('st', 'dep') }] });
    const p = proj('preprod', 'music', { 'st.dep': 'x' });
    assert.equal(activities.checkActivity('__receipt', p).passed, true);
    assert.equal(activities.checkActivity('__receipt', p, new Set(['st.dep'])).passed, false);
    delete activities.ACTIVITY_CHECKS.__receipt;
  });

  it('the stage screen resolves the whole lab and says when questions are hidden', () => {
    const s = read('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(s, /resolveLab\(all, project\.pathway, project\.values\)/);
    assert.match(s, /readStage\(stage, project, Date\.now\(\), hidden\)/);
    assert.match(s, /section\.hiddenCount \?/);
    assert.match(s, /comes back with anything you wrote in it/);
    assert.match(read('src/screens/lab/production/ProductionActivityScreen.tsx'), /checkActivity\(activityId, project, hiddenKeys\(/);
  });
});

// ── #4 the progress signal ───────────────────────────────────────────────────

describe('#4 a stage number, a state colour, a ceiling, and "—" for unread', () => {
  const sr = (over: Any = {}): Any => ({
    stageId: 's', num: 1, title: 'S', state: 'attention', answeredRequired: 3, totalRequired: 6,
    answeredAll: 5, totalAll: 20, findings: [], blockers: [], fields: [], progress: 0.5, ...over,
  });

  it('unreadable is "—", never 0%', () => {
    assert.deepEqual(readiness.stageSignal(null), { pct: null, text: '—', state: null });
    assert.deepEqual(readiness.stageSignal(undefined), { pct: null, text: '—', state: null });
  });

  it('nothing decided reads 0% (that IS read); half decided reads 50%', () => {
    assert.equal(readiness.stageSignal(sr({ state: 'missing', progress: 0, answeredRequired: 0, answeredAll: 0 })).text, '0%');
    assert.equal(readiness.stageSignal(sr()).pct, 50);
  });

  it('a stage with an open blocker never reads 100 — the blocker cannot be outscored', () => {
    const blocker = { severity: 'blocker', ruleId: 'b', fieldIds: [] };
    const s = readiness.stageSignal(sr({ state: 'conflict', progress: 1, answeredRequired: 6, blockers: [blocker], findings: [blocker] }));
    assert.equal(s.pct, readiness.BLOCKED_CEILING);
    assert.equal(s.state, 'conflict');
    assert.equal(readiness.stageSignal(sr({ state: 'complete', progress: 1, answeredRequired: 6 })).pct, 100);
  });

  it('the attention penalty is the project score\'s own: it can shrink progress, never erase it', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ severity: 'attention', ruleId: `a${i}`, fieldIds: [] }));
    const s = readiness.stageSignal(sr({ progress: 0.1, findings: many }));
    assert.ok(s.pct! > 0 && s.pct! < 10, `got ${s.pct}`);
  });

  it('the project score is held under 100 while a blocker is open', () => {
    const st: Any = {
      stageId: 'x', num: 1, title: 'X', intro: '', whyItMatters: '', notices: [],
      sections: [{ sectionId: 's', title: 'S', notices: [], fields: [{ fieldId: 'a', label: 'A', kind: 'text', required: true }] }],
      rules: [{ ruleId: 'always', watches: ['x.a'], severity: 'blocker', kind: 'unsafe', title: 'T', detail: 'D', needsLogic: true, logicIntent: 'i' }],
    };
    rulesMod.registerRuleLogic({ __receipt_always: () => true });
    st.rules[0].ruleId = '__receipt_always';
    const r = readProject([st], { ...newProject('preprod', 'music', 'b'), values: { 'x.a': 'done' } });
    delete rulesMod.RULE_LOGIC.__receipt_always;
    assert.equal(r.verdict, 'not_ready');
    assert.equal(r.score, 99, 'every required decision made, a blocker open: 99, never 100');
  });

  it('the stage list and the stage header carry the signal', () => {
    const m = read('src/screens/lab/production/ReadinessMeter.tsx');
    assert.match(m, /export function StageSignalBadge/);
    assert.match(m, /const sig = stageSignal\(unreadable \? null : stage\);/);
    assert.match(m, /\{\.\.\.fitValue\(17\)\}/);
    assert.match(read('src/screens/lab/production/ProductionStageScreen.tsx'), /<StageSignalBadge stage=\{report\} \/>/);
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    assert.match(home, /<StageProgressRow stage=\{sr \?\? null\} num=\{o\.num\} title=\{o\.title\} unreadable=\{readFailed\} \/>/);
    assert.match(home, /unreadable=\{readFailed\}/);
  });
});

// ── #5 the packet screen, and a project the learner owns ─────────────────────

describe('#5 the packet has a screen, drawn from the same model as the PDF', () => {
  const stages = schema.resolveLab(LABS.preprod.stages, 'music', {});
  const p = proj('preprod', 'music', { 'define.project_name': 'Night Train <EP>', 'define.services': ['recording'] });
  const report = readProject(stages, p);

  it('buildPacketModel carries every stage, section and field, and the HTML renders exactly that', () => {
    const m = packet.buildPacketModel({ project: p, stages, report });
    assert.equal(m.stages.length, stages.length);
    const html = packet.buildPacketHtml({ project: p, stages, report });
    for (const st of m.stages) {
      assert.ok(html.includes(`<h2>${st.num}. ${packet.escapeHtml(st.title)}</h2>`));
      for (const sec of st.sections) for (const f of sec.fields) assert.ok(html.includes(`${packet.escapeHtml(f.label)}:</span>`), f.label);
    }
    assert.ok(html.includes(packet.escapeHtml(m.verdictLine)));
    assert.ok(html.includes('Night Train &lt;EP&gt;'));
  });

  it('WHAT\'S LEFT lists exactly the stages with something outstanding, in plain words', () => {
    const left = readiness.projectLeft(report);
    assert.ok(left.length > 0 && left[0].missingRequired > 0);
    assert.match(readiness.stageLeftLine({ missingRequired: 2, blockers: 1, attention: 1 }), /^2 required decisions · 1 blocker · 1 thing to look at$/);
    const done = { ...report, stages: report.stages.map((s: Any) => ({ ...s, answeredRequired: s.totalRequired, blockers: [], findings: [] })) };
    assert.deepEqual(readiness.projectLeft(done), []);
  });

  it('the route exists, is lazy and members-only, and the share stays behind the honesty gate', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    assert.match(nav, /ProductionPacket: lazyScreen\(\(\) => withMembershipPreview\(require\('\.\.\/screens\/lab\/production\/ProductionPacketScreen'\)\.ProductionPacketScreen\)\)/);
    assert.match(nav, /<Stack\.Screen name="ProductionPacket" getComponent=\{MemberGated\.ProductionPacket\} \/>/);
    assert.match(read('src/navigation/types.ts'), /ProductionPacket: \{\s*\n\s*lab: import/);
    const scr = read('src/screens/lab/production/ProductionPacketScreen.tsx');
    assert.match(scr, /\{isPdfAvailable\(\) \? \(/);
    assert.match(scr, /buildPacketModel\(\{ project, stages, report \}\)/);
    assert.match(scr, /projectStore\(\)\.tryLoad\(lab\)/);
    assert.doesNotMatch(scr, /\bSaved\b/);
  });
});

describe('#5 rename, duplicate, delete, and pick up where you left off', () => {
  it('an answer records the stage it was given in — in the same write', async () => {
    const st = createProjectStore(memoryStore());
    const p = newProject('preprod', 'live', 'resume');
    await st.upsert(p);
    const a = await st.setValue('preprod', p.id, 'people', 'media_manager', 'Ana');
    assert.equal(a!.lastStageId, 'people');
    const b = await st.setNa('preprod', p.id, 'schedule', 'backup_date', 'single-day booking');
    assert.equal(b!.lastStageId, 'schedule');
    assert.equal((await st.get('preprod', p.id))!.lastStageId, 'schedule');
    assert.equal(normaliseProject({ ...b, lastStageId: 7 })!.lastStageId, undefined, 'a damaged marker is dropped, not trusted');
  });

  it('a failed answer write leaves no marker behind', async () => {
    const kv = memoryStore();
    const st = createProjectStore(kv);
    const p = newProject('preprod', 'live', 'resume');
    await st.upsert(p);
    const real = kv.setItem.bind(kv);
    kv.setItem = async () => {
      throw new Error('disk full');
    };
    assert.equal(await st.setValue('preprod', p.id, 'people', 'media_manager', 'Ana'), null);
    kv.setItem = real;
    assert.equal((await st.get('preprod', p.id))!.lastStageId, undefined);
  });

  it('the lab home opens the project worked on most recently', () => {
    const list = [
      { ...newProject('preprod', 'music', 'old'), updatedAt: 1 },
      { ...newProject('preprod', 'music', 'new'), updatedAt: 9 },
      { ...newProject('preprod', 'music', 'mid'), updatedAt: 5 },
    ];
    assert.equal(types.mostRecentProject(list).name, 'new');
    assert.equal(types.mostRecentProject([]), undefined);
    assert.match(read('src/screens/lab/production/ProductionLabScreen.tsx'), /: mostRecentProject\(own\)\?\.id \?\? null\)\);/);
  });

  it('DUPLICATE is reachable, latched, opens the copy only once it is saved, and says when it is not', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    const fn = home.slice(home.indexOf('const duplicate = useLatchedPress('), home.indexOf('/** Where this project was last worked on'));
    assert.match(fn, /const copy = await projectStore\(\)\.duplicate\(lab, project\.id\);/);
    assert.ok(fn.indexOf("notify('Not duplicated'") < fn.indexOf('setOpenId(copy.id)'));
    assert.match(home, /onPress=\{duplicate\}/);
    assert.match(home, /PICK UP WHERE YOU LEFT OFF/);
    assert.match(home, /navigation\.navigate\('ProductionPacket', \{ lab, projectId: project\.id \}\)/);
  });
});
