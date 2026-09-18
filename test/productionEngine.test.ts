/**
 * The production-lab engine: schema resolution, rules, readiness, persistence.
 *
 * The invariant that matters most is in "the meter judges decisions": the
 * owner's spec says the meter must evaluate actual decisions rather than reward
 * users for opening screens, and that is asserted directly rather than assumed.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// House pattern (see cymaticsGallery.test.ts): the source imports its siblings
// without a file extension, which Metro resolves and node's ESM loader does not.
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

const {
  isAnswered, valueKey, isOpenPathway, LAUNCH_PATHWAYS,
} = await import('../src/features/production/types.ts');
type ProductionProject = import('../src/features/production/types.ts').ProductionProject;

const {
  resolveStage, stageFields, validateStage, validateStages, validateSeeds, findBannedCopy,
} = await import('../src/features/production/schema.ts');
type StageDef = import('../src/features/production/schema.ts').StageDef;

const {
  evaluateStage, evaluateAll, missingLogic, unansweredRequired, isMostlyEmptyPraise,
  namesMoreThanOne, clockMinutes, sameName, daysBetween,
} = await import('../src/features/production/rules.ts');

const { checkActivity, seedActivityProject, missingChecks } = await import(
  '../src/features/production/activities.ts'
);

const { readStage, readProject, blockingReasons } = await import('../src/features/production/readiness.ts');

const {
  createProjectStore, memoryStore, newProject, normaliseProject, PROJECT_KEYS,
} = await import('../src/features/production/projectStore.ts');

const { PREPROD_STAGES } = await import('../src/features/production/preprod/index.ts');
const { STAGE1_DEFINE } = await import('../src/features/production/preprod/stage1.data.ts');

const stage = (pathway: 'music' | 'podcast' | 'live' = 'music') => resolveStage(STAGE1_DEFINE, pathway);

function project(over: Partial<ProductionProject> = {}): ProductionProject {
  return { ...newProject('preprod', 'music', 'Test'), ...over };
}

/**
 * A project with every required field of stage 1 answered sensibly.
 *
 * Stage 1 grew from 12 fields to 33 when Computer C's batch landed (the Scope
 * and Creative Direction sections), so this fixture covers 17 required fields
 * on music and live, 16 on podcast. If a later batch adds a required field,
 * THIS IS THE FIXTURE THAT SHOULD FAIL FIRST — that is the point of it.
 */
function completeProject(pathway: 'music' | 'podcast' | 'live' = 'music'): ProductionProject {
  const future = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
  return project({
    pathway,
    values: {
      'define.project_name': 'Northgate Sessions',
      'define.project_lead': 'Dana Okonkwo',
      'define.purpose': 'A four-song release to open the autumn tour and give the band something to sell at the merch table.',
      'define.audience': 'Existing fans on streaming, plus people who see the band live for the first time this autumn.',
      'define.creative_objective': 'The room should feel small and close, as if the listener is standing by the piano.',
      'define.platform': ['streaming_music'],
      'define.size_estimate': 4,
      'define.target_date': future,
      'define.approver': 'Dana Okonkwo',
      'define.success_definition': 'All four masters accepted by the band and live on streaming before the first tour date.',
      // Scope
      'define.services': ['recording', 'mixing'],
      'define.performer_count': 5,
      'define.source_count': 12,
      'define.location_count': 1,
      'define.format': 'stereo',
      'define.revisions_included': 2,
      'define.archive_plan': 'both',
      // Creative direction
      'define.style': 'Indie folk, sparse, mostly live takes',
      'define.tone_mood': 'Warm and close, unhurried, with room for the voice to sit forward.',
    },
  });
}

describe('value helpers', () => {
  it('treats whitespace, empty lists and nothing as undecided', () => {
    assert.equal(isAnswered(undefined), false);
    assert.equal(isAnswered(null), false);
    assert.equal(isAnswered('   '), false);
    assert.equal(isAnswered([]), false);
    assert.equal(isAnswered(Number.NaN), false);
    assert.equal(isAnswered('a'), true);
    assert.equal(isAnswered(0), true, 'zero is a real answer');
    assert.equal(isAnswered(false), true, 'false is a real answer');
    assert.equal(isAnswered(['x']), true);
  });

  it('builds the flat key', () => {
    assert.equal(valueKey('define', 'purpose'), 'define.purpose');
  });

  it('knows which pathways are open', () => {
    for (const p of LAUNCH_PATHWAYS) assert.equal(isOpenPathway(p), true);
    assert.equal(isOpenPathway('game'), false);
  });
});

describe('schema', () => {
  it('the authored stage is structurally valid', () => {
    assert.deepEqual(validateStage(STAGE1_DEFINE), []);
  });

  it('no authored copy contains a promise word', () => {
    for (const s of PREPROD_STAGES) assert.deepEqual(findBannedCopy(s), [], s.stageId);
  });

  it('catches duplicate ids, missing options and phantom watches', () => {
    const broken: StageDef = {
      stageId: 'x',
      num: 1,
      title: 'X',
      intro: 'i',
      whyItMatters: 'w',
      sections: [
        {
          sectionId: 's',
          title: 'S',
          fields: [
            { fieldId: 'a', label: 'A', kind: 'choice' },
            { fieldId: 'a', label: 'Dup', kind: 'text' },
          ],
        },
      ],
      rules: [
        { ruleId: 'r', watches: ['x.ghost'], severity: 'attention', kind: 'missing', title: 'T', detail: 'D', needsLogic: true },
      ],
    };
    const errs = validateStage(broken);
    assert.ok(errs.some((e) => e.includes('duplicate fieldId')));
    assert.ok(errs.some((e) => e.includes('requires options')));
    assert.ok(errs.some((e) => e.includes('does not exist')));
    assert.ok(errs.some((e) => e.includes('needsLogic without logicIntent')));
  });

  it('a pathway relabels a field without changing its identity', () => {
    const music = stage('music');
    const podcast = stage('podcast');
    const mf = stageFields(music).find((f) => f.fieldId === 'size_estimate');
    const pf = stageFields(podcast).find((f) => f.fieldId === 'size_estimate');
    assert.equal(mf?.label, 'How many songs?');
    assert.equal(pf?.label, 'How many episodes?');
    // Same fieldId, so switching pathway never loses the user's answer.
    assert.equal(mf?.fieldId, pf?.fieldId);
  });

  it('a pathway-scoped rule only appears on its pathway', () => {
    assert.ok(stage('live').rules.some((r) => r.ruleId === 'define-platform-live-no-venue'));
    assert.ok(!stage('music').rules.some((r) => r.ruleId === 'define-platform-live-no-venue'));
  });
});

describe('rules', () => {
  it('every rule that promised logic has an implementation', () => {
    assert.deepEqual(missingLogic(PREPROD_STAGES), []);
  });

  it('a complete, sensible project raises no findings at all', () => {
    // A rule that fires on a healthy project is worse than no rule.
    assert.deepEqual(evaluateStage(stage(), completeProject()), []);
  });

  it('an empty project raises the missing approver as a warning, not a blocker', () => {
    // Demoted 2026-09-17: it fires on an empty field, and a blocker cannot be
    // outscored, so it made a brand-new plan unreadable from the first screen.
    const findings = evaluateStage(stage(), project());
    const approver = findings.find((f) => f.ruleId === 'define-approver-missing');
    assert.ok(approver, 'it should still be raised');
    assert.equal(approver?.severity, 'attention');
  });

  it('spots a purpose that is only praise, and accepts one that is not', () => {
    assert.equal(isMostlyEmptyPraise('We want it to sound professional, exciting, and really good.'), true);
    assert.equal(isMostlyEmptyPraise('A four-song release to open the autumn tour.'), false);
    assert.equal(isMostlyEmptyPraise('Album launch'), false, 'terse is not vague');

    const vague = project({
      values: { ...completeProject().values, 'define.purpose': 'We want it to sound professional, exciting and really good.', 'define.creative_objective': 'Make it amazing and very polished.' },
    });
    assert.ok(evaluateStage(stage(), vague).some((f) => f.ruleId === 'define-purpose-vague'));
  });

  it('a substantive creative objective rescues a thin purpose', () => {
    const p = project({
      values: { ...completeProject().values, 'define.purpose': 'We want it to sound really professional and exciting.' },
    });
    assert.ok(!evaluateStage(stage(), p).some((f) => f.ruleId === 'define-purpose-vague'));
  });

  it('notices more than one approver', () => {
    assert.equal(namesMoreThanOne('Dana Okonkwo'), false);
    assert.equal(namesMoreThanOne('Dana and the label'), true);
    assert.equal(namesMoreThanOne('the committee'), true);
    const p = project({ values: { ...completeProject().values, 'define.approver': 'Dana and Sam' } });
    assert.ok(evaluateStage(stage(), p).some((f) => f.ruleId === 'define-approver-ambiguous'));
  });

  it('blocks a deadline in the past but allows one today', () => {
    const now = Date.parse('2026-09-17T16:00:00Z');
    const past = project({ values: { ...completeProject().values, 'define.target_date': '2026-09-10' } });
    const today = project({ values: { ...completeProject().values, 'define.target_date': '2026-09-17' } });
    assert.ok(evaluateStage(stage(), past, now).some((f) => f.ruleId === 'define-deadline-past'));
    assert.ok(
      !evaluateStage(stage(), today, now).some((f) => f.ruleId === 'define-deadline-past'),
      'a deadline of today is not retroactively a blocker',
    );
  });

  it('flags a live project with no live destination', () => {
    const base = completeProject('live').values;
    const online = project({ pathway: 'live', values: { ...base, 'define.platform': ['website'] } });
    const venue = project({ pathway: 'live', values: { ...base, 'define.platform': ['live_venue'] } });
    assert.ok(evaluateStage(stage('live'), online).some((f) => f.ruleId === 'define-platform-live-no-venue'));
    assert.ok(!evaluateStage(stage('live'), venue).some((f) => f.ruleId === 'define-platform-live-no-venue'));
  });

  it('a justified not-applicable satisfies a field instead of nagging', () => {
    const p = project({ na: { 'define.success_definition': 'Internal test render, no client' } });
    const findings = evaluateStage(stage(), p);
    assert.ok(!findings.some((f) => f.ruleId === 'define-success-missing'));
  });

  it('lists required fields that are neither answered nor justified', () => {
    const missing = unansweredRequired(stage(), project());
    assert.ok(missing.includes('approver'));
    assert.ok(missing.includes('purpose'));
    assert.ok(!missing.includes('client'), 'client is optional');
  });
});

describe('readiness — the meter judges decisions', () => {
  it('visiting every stage without answering anything scores zero', () => {
    // The spec's central requirement, asserted rather than assumed.
    const report = readProject([stage()], project());
    assert.equal(report.score, 0);
    assert.equal(report.answeredRequired, 0);
    assert.equal(report.verdict, 'not_ready');
  });

  it('a complete project is ready and scores full marks', () => {
    const report = readProject([stage()], completeProject());
    assert.equal(report.blockers.length, 0);
    assert.equal(report.answeredRequired, report.totalRequired);
    assert.equal(report.score, 100);
    assert.equal(report.verdict, 'ready');
  });

  it('a blocker cannot be outscored by any amount of other work', () => {
    // Everything answered EXCEPT a past deadline, which is a blocker.
    const p = project({ values: { ...completeProject().values, 'define.target_date': '2020-01-01' } });
    const report = readProject([stage()], p, Date.parse('2026-09-17T16:00:00Z'));
    assert.ok(report.score > 80, 'the score is high');
    assert.equal(report.verdict, 'not_ready', 'and it still cannot proceed');
    assert.ok(report.blockers.length > 0);
  });

  it('an accepted blocker clears the gate but is recorded as a condition', () => {
    const p = project({
      values: { ...completeProject().values, 'define.target_date': '2020-01-01' },
      acceptedConditions: [
        { ruleId: 'define-deadline-past', acceptedBy: 'Dana Okonkwo', reason: 'Date already renegotiated by email; brief not yet updated.', at: Date.now() },
      ],
    });
    const report = readProject([stage()], p, Date.parse('2026-09-17T16:00:00Z'));
    assert.equal(report.blockers.length, 0);
    assert.equal(report.verdict, 'ready_with_conditions');
    assert.equal(report.acceptedBlockers.length, 1);
  });

  it('an acceptance with no name or no reason does NOT clear the gate', () => {
    // Otherwise the escape hatch is just a dismiss button.
    for (const bad of [
      { acceptedBy: '', reason: 'because' },
      { acceptedBy: 'Dana', reason: '   ' },
    ]) {
      const p = project({
        values: { ...completeProject().values, 'define.target_date': '2020-01-01' },
        acceptedConditions: [{ ruleId: 'define-deadline-past', at: Date.now(), ...bad }],
      });
      const report = readProject([stage()], p, Date.parse('2026-09-17T16:00:00Z'));
      assert.equal(report.verdict, 'not_ready');
      assert.ok(report.blockers.length > 0);
    }
  });

  it('explains why a project cannot proceed', () => {
    const reasons = blockingReasons(readProject([stage()], project()));
    // An untouched project is held up by unmade decisions, not by a blocker.
    assert.ok(reasons.some((r) => r.includes('required')));

    // A real contradiction names itself.
    const bad = project({ values: { ...completeProject().values, 'define.target_date': '2020-01-01' } });
    const withBlocker = blockingReasons(readProject([stage()], bad, Date.parse('2026-09-17T16:00:00Z')));
    assert.ok(withBlocker.some((r) => /already passed/i.test(r)));
  });

  it('per-field states distinguish missing, complete and justified', () => {
    const p = project({
      values: { 'define.project_name': 'X' },
      na: { 'define.client': 'No client, self-released' },
    });
    const s = readStage(stage(), p);
    const byId = Object.fromEntries(s.fields.map((f) => [f.fieldId, f.state]));
    assert.equal(byId['project_name'], 'complete');
    assert.equal(byId['client'], 'na');
    assert.equal(byId['purpose'], 'missing');
  });
});

describe('projectStore', () => {
  it('round-trips a project through the real serialiser', async () => {
    const store = createProjectStore(memoryStore());
    const p = newProject('preprod', 'music', 'Northgate');
    assert.equal(await store.upsert(p), true);
    const back = await store.get('preprod', p.id);
    assert.equal(back?.name, 'Northgate');
    assert.equal(back?.pathway, 'music');
  });

  it('keeps the two labs apart', async () => {
    const store = createProjectStore(memoryStore());
    await store.upsert(newProject('preprod', 'music', 'Plan'));
    await store.upsert(newProject('postprod', 'music', 'Repair'));
    assert.equal((await store.load('preprod')).length, 1);
    assert.equal((await store.load('postprod')).length, 1);
  });

  it('writes values and justified skips', async () => {
    const store = createProjectStore(memoryStore());
    const p = newProject('preprod', 'music', 'X');
    await store.upsert(p);
    await store.setValue('preprod', p.id, 'define', 'purpose', 'A release');
    const withNa = await store.setNa('preprod', p.id, 'define', 'client', 'Self-released');
    assert.equal(withNa?.values['define.purpose'], 'A release');
    assert.equal(withNa?.na['define.client'], 'Self-released');
    const cleared = await store.setNa('preprod', p.id, 'define', 'client', '  ');
    assert.equal(cleared?.na['define.client'], undefined, 'an empty reason clears the skip');
  });

  it('refuses an unattributed acceptance', async () => {
    const store = createProjectStore(memoryStore());
    const p = newProject('preprod', 'music', 'X');
    await store.upsert(p);
    const bad = await store.acceptCondition('preprod', p.id, { ruleId: 'r', acceptedBy: '', reason: 'x', at: Date.now() });
    assert.equal(bad, null);
    const good = await store.acceptCondition('preprod', p.id, { ruleId: 'r', acceptedBy: 'Dana', reason: 'Signed off by email', at: Date.now() });
    assert.equal(good?.acceptedConditions.length, 1);
  });

  it('duplicates without carrying the revision or sharing state', async () => {
    const store = createProjectStore(memoryStore());
    const p = { ...newProject('preprod', 'music', 'X'), revision: 4 };
    await store.upsert(p);
    await store.setValue('preprod', p.id, 'define', 'purpose', 'original');
    const copy = await store.duplicate('preprod', p.id);
    assert.equal(copy?.revision, 0);
    assert.ok(copy?.name.endsWith('(copy)'));
    await store.setValue('preprod', copy!.id, 'define', 'purpose', 'changed');
    const original = await store.get('preprod', p.id);
    assert.equal(original?.values['define.purpose'], 'original', 'the copy does not share state');
  });

  it('sets damaged rows aside instead of destroying the file', async () => {
    const kv = memoryStore();
    const good = newProject('preprod', 'music', 'Keeper');
    await kv.setItem(PROJECT_KEYS.preprod, JSON.stringify([good, { id: 'no-lab' }, 42]));
    const store = createProjectStore(kv);
    const list = await store.load('preprod');
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Keeper');
    const damaged = await kv.getItem(`${PROJECT_KEYS.preprod}:damaged`);
    assert.ok(damaged && damaged.includes('no-lab'), 'the bad rows were preserved, not dropped');
  });

  it('survives a file that is not JSON at all', async () => {
    const kv = memoryStore();
    await kv.setItem(PROJECT_KEYS.preprod, 'not json {{{');
    const store = createProjectStore(kv);
    assert.deepEqual(await store.load('preprod'), []);
    assert.equal(await kv.getItem(`${PROJECT_KEYS.preprod}:damaged`), 'not json {{{');
  });

  it('normalisation rejects rows it cannot trust', () => {
    assert.equal(normaliseProject(null), null);
    assert.equal(normaliseProject({ id: 'x', lab: 'nope', pathway: 'music' }), null);
    assert.equal(normaliseProject({ lab: 'preprod', pathway: 'music' }), null, 'no id');
    const ok = normaliseProject({ id: 'x', lab: 'preprod', pathway: 'music' });
    assert.equal(ok?.revision, 0);
    assert.deepEqual(ok?.values, {});
  });
});

const { buildPacketHtml, renderValue, escapeHtml, docControl } = await import(
  '../src/features/production/packet.ts'
);

describe('production packet', () => {
  const stages = [stage()];

  it('states its own verdict on the page, not just the content', () => {
    const p = project();
    const html = buildPacketHtml({ project: p, stages, report: readProject(stages, p) });
    assert.ok(html.includes('Not Ready for Production'));
    assert.ok(html.includes('0 of'), 'and how many decisions were actually made');
  });

  it('prints unanswered required fields as gaps rather than hiding them', () => {
    const p = project();
    const html = buildPacketHtml({ project: p, stages, report: readProject(stages, p) });
    assert.ok(html.includes('Not decided — required'));
  });

  it('prints a justified skip with its reason', () => {
    const p = project({ na: { 'define.client': 'Self-released, no client' } });
    const html = buildPacketHtml({ project: p, stages, report: readProject(stages, p) });
    assert.ok(html.includes('Not applicable — Self-released, no client'));
  });

  it('prints an accepted condition with who accepted it and why', () => {
    const p = project({
      values: { ...completeProject().values, 'define.target_date': '2020-01-01' },
      acceptedConditions: [
        { ruleId: 'define-deadline-past', acceptedBy: 'Dana Okonkwo', reason: 'Renegotiated by email', at: Date.now() },
      ],
    });
    const report = readProject(stages, p, Date.parse('2026-09-17T16:00:00Z'));
    const html = buildPacketHtml({ project: p, stages, report });
    assert.ok(html.includes('Accepted conditions'));
    assert.ok(html.includes('Dana Okonkwo'));
    assert.ok(html.includes('Renegotiated by email'));
  });

  it('escapes user text so a stray angle bracket cannot break the document', () => {
    assert.equal(escapeHtml('<b>&"x"'), '&lt;b&gt;&amp;&quot;x&quot;');
    const p = project({ values: { 'define.project_name': '<script>alert(1)</script>' } });
    const html = buildPacketHtml({ project: p, stages, report: readProject(stages, p) });
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('renders a multi-choice as its labels, not its raw values', () => {
    const field = stageFields(stage()).find((f) => f.fieldId === 'platform')!;
    assert.equal(renderValue(field, ['streaming_music', 'radio']), 'Streaming music service, Radio');
  });

  it('renders a number with its unit', () => {
    const field = stageFields(stage()).find((f) => f.fieldId === 'size_estimate')!;
    assert.equal(renderValue(field, 4), '4 items');
  });

  it('carries the legal notice and the qualified-personnel boundary', () => {
    const p = completeProject();
    const html = buildPacketHtml({ project: p, stages, report: readProject(stages, p) });
    assert.ok(html.includes('not legal advice'));
    assert.ok(html.includes('qualified personnel'));
  });

  it('document control records revision, date and who prepared it', () => {
    const p = completeProject();
    const d = docControl({ ...p, revision: 3 }, readProject(stages, p));
    assert.equal(d.revision, 3);
    assert.equal(d.author, 'Dana Okonkwo');
    assert.match(d.revisionDate, /^\d{4}-\d{2}-\d{2}$/);
  });
});

const { LAB_CATEGORIES } = await import('../src/screens/lab/labCatalog.ts');

describe('catalog wiring', () => {
  const production = LAB_CATEGORIES.find((c: { id: string }) => c.id === 'production');

  it('the Production Workflow category exists in the members-only section', () => {
    assert.ok(production, 'expected a production category');
    assert.equal(production.section, 'training');
  });

  it('Pre-Production is listed with a real route', () => {
    const labs = 'labs' in production ? production.labs : [];
    const pre = labs?.find((l: { name: string }) => l.name === 'Audio Pre-Production');
    assert.ok(pre, 'expected the Pre-Production lab');
    assert.equal(pre.route, 'PreProdLab');
    assert.equal(pre.member, true);
  });

  it('carries no placeholder row — Post-Production is absent until it is built', () => {
    const labs = ('labs' in production ? production.labs : []) ?? [];
    for (const l of labs) {
      assert.equal(l.status, undefined, `${l.name} must not be a placeholder`);
      assert.ok(l.route, `${l.name} must have a route`);
    }
    assert.ok(!labs.some((l: { name: string }) => /post-production/i.test(l.name)));
  });

  it('no category anywhere still carries a development row', () => {
    for (const cat of LAB_CATEGORIES) {
      const labs = ('labs' in cat ? cat.labs : []) ?? [];
      const families = ('families' in cat ? cat.families : []) ?? [];
      const all = [...labs, ...families.flatMap((f: { labs: unknown[] }) => f.labs)];
      for (const l of all as { name: string; status?: string }[]) {
        assert.notEqual(l.status, 'development', `${cat.id} / ${l.name}`);
      }
    }
  });
});

const { STAGE3_PEOPLE } = await import('../src/features/production/preprod/stage3.data.ts');

describe('Computer C batch 1', () => {
  it('all four stages are structurally valid on their own', () => {
    for (const s of PREPROD_STAGES) assert.deepEqual(validateStage(s), [], s.stageId);
  });

  it('every cross-stage watch resolves to a real field', () => {
    // C NOTES 6.1: half the useful rules are cross-stage, and a typo in one
    // silently never fires. This is the check that finding asked for.
    assert.deepEqual(validateStages(PREPROD_STAGES), []);
  });

  it('every seeded table row and choice value is real', () => {
    assert.deepEqual(validateSeeds(PREPROD_STAGES), []);
  });

  it('the load-bearing cross-stage field names still exist', () => {
    // Rename one of these and the stage 1 Scope Warning breaks quietly.
    const keys = new Set(
      PREPROD_STAGES.flatMap((s) => s.sections.flatMap((sec) => sec.fields.map((f) => `${s.stageId}.${f.fieldId}`))),
    );
    for (const k of [
      'schedule.production_days',
      'schedule.hours_per_day',
      'schedule.budget_total',
      'schedule.crew_count',
      'schedule.available_channels',
      'deliver.session_sample_rate',
      'deliver.session_bit_depth',
      'deliver.review_rounds',
      'deliver.review_period',
      'define.source_count',
    ]) {
      assert.ok(keys.has(k), `${k} is referenced across stages and must exist`);
    }
  });

  it('every one of the computed rules is implemented', () => {
    assert.deepEqual(missingLogic(PREPROD_STAGES), []);
  });

  it('every activity has an implemented check', () => {
    assert.deepEqual(missingChecks(PREPROD_STAGES), []);
  });

  it('no authored copy anywhere contains a promise word', () => {
    for (const s of PREPROD_STAGES) assert.deepEqual(findBannedCopy(s), [], s.stageId);
  });

  it('the batch is the size C reported', () => {
    const fields = PREPROD_STAGES.flatMap((s) => s.sections.flatMap((sec) => sec.fields));
    const rules = PREPROD_STAGES.flatMap((s) => s.rules);
    assert.equal(fields.length, 115);
    assert.equal(rules.length, 60);
    // Five, not C's seven: define-approver-missing and deliver-list-empty were
    // demoted to warnings because they fired on empty fields (owner, 2026-09-17).
    assert.equal(rules.filter((r) => r.severity === 'blocker').length, 5);
  });

  it('NO blocker fires on a brand-new, untouched project', () => {
    // The invariant behind the demotion, and the reason it was only two rules.
    // A blocker cannot be outscored, so one that fires before the user has
    // typed anything makes the meter meaningless from the first screen. Every
    // surviving blocker waits for something the user actually entered: an
    // explicit "yes" to rigging, a power source, a participant marked as a
    // minor, a source count above the channel count, or a date in the past.
    for (const pw of ['music', 'podcast', 'live'] as const) {
      const stages = PREPROD_STAGES.map((s) => resolveStage(s, pw));
      const blockers = evaluateAll(stages, project({ pathway: pw })).filter((f) => f.severity === 'blocker');
      assert.deepEqual(blockers.map((b) => b.ruleId), [], `${pw} starts blocked`);
    }
  });

  it('but a real contradiction still blocks', () => {
    // The demotion must not have made the meter toothless.
    const stages = PREPROD_STAGES.map((s) => resolveStage(s, 'live'));
    const bad = project({
      pathway: 'live',
      values: { 'define.target_date': '2020-01-01', 'people.rigging_required': 'yes' },
    });
    const ids = evaluateAll(stages, bad, Date.parse('2026-09-17T16:00:00Z'))
      .filter((f) => f.severity === 'blocker')
      .map((f) => f.ruleId);
    assert.ok(ids.includes('define-deadline-past'), 'a date already gone');
    assert.ok(ids.includes('people-rigging-no-rigger'), 'flying something with nobody qualified');
  });

  it('an empty project never fires a comparison about values it cannot see', () => {
    // A rule that fires on a plan with nothing in it is noise. Only
    // genuinely-missing-field rules should speak, never a comparison.
    const empty = project();
    const stages = PREPROD_STAGES.map((s) => resolveStage(s, 'music'));
    for (const f of evaluateAll(stages, empty)) {
      assert.notEqual(f.kind, 'unrealistic', `${f.ruleId} compared against nothing`);
      assert.notEqual(f.kind, 'conflict', `${f.ruleId} found a conflict in an empty plan`);
    }
  });

  it('licensed and certified roles disclose the requirement in their own copy', () => {
    // Standing house rule: a role needing a licence or certification says so.
    const fields = STAGE3_PEOPLE.sections.flatMap((s: { fields: unknown[] }) => s.fields) as {
      fieldId: string;
      help?: string;
    }[];
    for (const id of ['rigger', 'electrician', 'rf_coordinator']) {
      const f = fields.find((x) => x.fieldId === id);
      assert.ok(f, `${id} should exist`);
      assert.match(String(f?.help), /licen[cs]|certif/i, `${id} must disclose the requirement`);
    }
  });

  it('every stage carries at least one legal, safety or qualified notice', () => {
    for (const s of PREPROD_STAGES) {
      const all = [...(s.notices ?? []), ...s.sections.flatMap((sec) => sec.notices ?? [])];
      assert.ok(all.length > 0, `${s.stageId} has no notices`);
    }
  });
});

describe('the computed rules C specified', () => {
  const st = (id: string, pw: 'music' | 'podcast' | 'live' = 'music') =>
    resolveStage(PREPROD_STAGES.find((s) => s.stageId === id)!, pw);

  const fire = (stageId: string, values: Record<string, unknown>, pw: 'music' | 'podcast' | 'live' = 'music') =>
    evaluateStage(st(stageId, pw), project({ pathway: pw, values: values as never })).map((f) => f.ruleId);

  it('clock times parse leniently and refuse what they cannot read', () => {
    assert.equal(clockMinutes('16:00'), 16 * 60);
    assert.equal(clockMinutes('4pm'), 16 * 60);
    assert.equal(clockMinutes('9:30am'), 9 * 60 + 30);
    assert.equal(clockMinutes('12am'), 0);
    assert.equal(clockMinutes('teatime'), null, 'unparseable says nothing');
    assert.equal(clockMinutes('99:99'), null);
  });

  it('loose name matching catches a rename without being silly', () => {
    assert.equal(sameName('Dana Okonkwo', 'dana okonkwo'), true);
    assert.equal(sameName('Dana Okonkwo', 'Dana'), true);
    assert.equal(sameName('Dana', 'Sam'), false);
  });

  it('a budget that exceeds its total is caught', () => {
    const ids = fire('schedule', {
      'schedule.budget_total': 1000,
      'schedule.budget_lines': [
        { bl_category: 'personnel', bl_amount: 800 },
        { bl_category: 'venue', bl_amount: 400 },
      ],
    });
    assert.ok(ids.includes('schedule-budget-exceeded'));
    assert.ok(ids.includes('schedule-no-contingency'), 'and the missing contingency line');
  });

  it('more sources than channels blocks, and silences the spares nudge', () => {
    const ids = fire('schedule', { 'define.source_count': 24, 'schedule.available_channels': 16 });
    assert.ok(ids.includes('schedule-channels-insufficient'));
    assert.ok(!ids.includes('schedule-no-spares'), 'the stronger rule speaks alone');
  });

  it('a day whose blocks do not fit between call and hard out is caught', () => {
    const ids = fire('schedule', {
      'schedule.call_time': '16:00',
      'schedule.hard_out': '23:00',
      'schedule.day_schedule': [
        { blk_type: 'load_in', blk_duration: 30 },
        { blk_type: 'performance', blk_duration: 180 },
        { blk_type: 'soundcheck', blk_duration: 300 },
      ],
    });
    assert.ok(ids.includes('schedule-day-overruns'));
  });

  it('a hard out past midnight is not read as a day running backwards', () => {
    const ids = fire('schedule', {
      'schedule.call_time': '18:00',
      'schedule.hard_out': '01:00',
      'schedule.day_schedule': [{ blk_type: 'performance', blk_duration: 120 }],
    });
    assert.ok(!ids.includes('schedule-day-overruns'), 'two hours fits a seven-hour span across midnight');
  });

  it('a line check after the soundcheck is not a line check', () => {
    const ids = fire('schedule', {
      'schedule.day_schedule': [
        { blk_type: 'soundcheck', blk_duration: 60 },
        { blk_type: 'line_check', blk_duration: 15 },
      ],
    });
    assert.ok(ids.includes('schedule-soundcheck-no-linecheck'));
  });

  it('a small portable generator is not treated as licensed electrical work', () => {
    // C NOTES 2.8: the first draft got this wrong and the reviewer caught it.
    const direct = fire('people', { 'people.power_source': 'generator_direct' });
    const distro = fire('people', { 'people.power_source': 'generator_distro' });
    assert.ok(!direct.includes('people-power-no-electrician'));
    assert.ok(distro.includes('people-power-no-electrician'));
  });

  it('the hazard questions separate yes from not-known', () => {
    const yes = fire('people', { 'people.rigging_required': 'yes' }, 'live');
    const unknown = fire('people', { 'people.rigging_required': 'unknown' }, 'live');
    assert.ok(yes.includes('people-rigging-no-rigger'), 'yes with no rigger blocks');
    assert.ok(!unknown.includes('people-rigging-no-rigger'), 'not-known does not block');
    assert.ok(unknown.includes('people-hazards-unknown'), 'it asks the question instead');
  });

  it('one person in two simultaneous on-day roles is caught', () => {
    const ids = fire(
      'people',
      {
        'people.engineer_primary': 'Dana',
        'people.monitor_engineer': 'Dana',
        'people.stream_operator': 'Dana',
      },
      'live',
    );
    assert.ok(ids.includes('people-overload'));
  });

  it('a clean version with no definition or no decider is caught', () => {
    const neither = fire('deliver', {
      'deliver.deliverable_list': [{ item_name: 'Clean edit', item_type: 'clean_version' }],
    });
    assert.ok(neither.includes('deliver-clean-undefined'));
    const both = fire('deliver', {
      'deliver.deliverable_list': [{ item_name: 'Clean edit', item_type: 'clean_version' }],
      'deliver.clean_definition': 'Mute the two words on the label list.',
      'deliver.clean_decider': 'Dana Okonkwo',
    });
    assert.ok(!both.includes('deliver-clean-undefined'));
  });

  it('delivering above the session rate is caught; below it is not', () => {
    const up = fire('deliver', {
      'deliver.session_sample_rate': '48000',
      'deliver.spec_table': [{ spec_item: 'Master', sample_rate: '96000' }],
    });
    const down = fire('deliver', {
      'deliver.session_sample_rate': '96000',
      'deliver.spec_table': [{ spec_item: 'Master', sample_rate: '44100' }],
    });
    assert.ok(up.includes('deliver-sample-rate-fights-workflow'));
    assert.ok(!down.includes('deliver-sample-rate-fights-workflow'), 'downward conversion is routine');
  });

  it('a stereo spec for an immersive project is caught', () => {
    const ids = fire('deliver', {
      'define.format': 'immersive',
      'deliver.spec_table': [{ spec_item: 'Master', channel_config: 'stereo' }],
    });
    assert.ok(ids.includes('deliver-format-mismatch'));
  });

  it('a reference with no stated aspect is caught', () => {
    const bare = fire('define', { 'define.references': [{ ref_title: 'Some record', ref_aspect: [] }] });
    const reasoned = fire('define', {
      'define.references': [{ ref_title: 'Some record', ref_aspect: ['vocal_sound'] }],
    });
    assert.ok(bare.includes('define-reference-no-reason'));
    assert.ok(!reasoned.includes('define-reference-no-reason'));
  });

  it('storage is estimated from the real arithmetic', () => {
    // 12 ch x 48000 x 3 bytes x 3600 s is about 6.2 GB per hour; four hours
    // needs about 25 GB, and the backup needs it again.
    const short = fire('schedule', {
      'define.source_count': 12,
      'deliver.session_sample_rate': '48000',
      'deliver.session_bit_depth': '24',
      'schedule.recording_hours': 4,
      'schedule.storage_available': 30,
    });
    const plenty = fire('schedule', {
      'define.source_count': 12,
      'deliver.session_sample_rate': '48000',
      'deliver.session_bit_depth': '24',
      'schedule.recording_hours': 4,
      'schedule.storage_available': 500,
    });
    assert.ok(short.includes('schedule-storage-short'));
    assert.ok(!plenty.includes('schedule-storage-short'));
  });
});

describe('the four activities', () => {
  const byId = (id: string) => PREPROD_STAGES.find((s) => s.activity?.activityId === id)!.activity!;

  it('a seeded activity starts failing and says which criteria are unmet', () => {
    const seeded = seedActivityProject('preprod', 'music', byId('repair-the-brief'));
    const result = checkActivity('repair-the-brief', seeded);
    assert.equal(result.passed, false);
    assert.ok(result.unmet.length > 0);
    for (const c of result.unmet) assert.ok(c.label.length > 10, c.id);
  });

  it('the seeded brief is repairable, and then it passes', () => {
    const seeded = seedActivityProject('preprod', 'music', byId('repair-the-brief'));
    const repaired = {
      ...seeded,
      values: {
        ...seeded.values,
        'define.purpose': 'A live album to sell on the autumn tour and to send to community radio.',
        'define.audience': 'People who came to the shows, and radio programmers who have not heard the band.',
        'define.platform': ['streaming_music', 'radio'],
        'define.approver': 'Priya Raman',
        'define.success_definition': 'Accepted by the band and delivered to the distributor before the tour starts.',
        'define.services': ['recording', 'mixing'],
        'define.revisions_included': 2,
      },
    };
    const result = checkActivity('repair-the-brief', repaired);
    assert.equal(result.passed, true, result.unmet.map((c) => c.id).join(', '));
  });

  it('an unknown activity fails rather than passing by default', () => {
    // Silence must never look like success.
    const result = checkActivity('no-such-activity', project());
    assert.equal(result.passed, false);
    assert.equal(result.met.length, 0);
  });

  it('a seeded project is marked as an exercise', () => {
    const seeded = seedActivityProject('preprod', 'live', byId('save-the-production'));
    assert.equal(seeded.scenarioId, 'save-the-production');
  });
});
