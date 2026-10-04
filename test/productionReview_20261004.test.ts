/**
 * productionReview — receipts for the expert review (audio professional +
 * learning science) of the production labs' 2026-10-04 design work:
 * showWhen, the progress signal and the packet screen.
 *
 * Each block fails on the pre-review working tree:
 *   1. Post stage 5 hid "What is being corrected" when correction was RULED
 *      OUT. Hidden answers are never evaluated, so the legal finding
 *      "A performance is being altered without an agreement to do it" could no
 *      longer fire for the very case its own detail names ("the brief recorded
 *      it as ruled out"). And "no key and scale recorded" asked for an answer
 *      in a question that was hidden.
 *   2. Pre stage 5's timecode plan said "Only if a deliverable must sync to
 *      picture", while the stage 2 question that now reveals it asks about sync
 *      "with video or with another system" — show-control timecode (lighting,
 *      video, playback chasing LTC) was told it did not belong.
 *   3. The packet's empty WHAT'S LEFT said "no rule is asking about anything"
 *      while the document under it could still print information findings.
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

const { resolveLab, validateStages, validateSeeds } = await import('../src/features/production/schema.ts');
const { readProject } = await import('../src/features/production/readiness.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');
const { LABS } = await import('../src/features/production/labs.ts');

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const NOW = Date.parse('2026-10-04T12:00:00Z');
const post = LABS.postprod.stages;
const ids = (values: Record<string, unknown>) => {
  const p: Any = { ...newProject('postprod', 'music', 'Review'), values };
  const stages = resolveLab(post, 'music', p.values);
  const report = readProject(stages, p, NOW);
  const build = stages.find((s: Any) => s.stageId === 'build')!;
  return {
    findings: report.findings.map((f: Any) => f.ruleId) as string[],
    shown: build.sections.flatMap((s: Any) => s.fields.map((f: Any) => f.fieldId)) as string[],
  };
};

describe('1 · correction applied after it was ruled out is still caught', () => {
  it('"Ruled out" keeps "What is being corrected" in view, and ticking it raises the agreement finding', () => {
    const r = ids({ 'build.correction_decision': 'prohibited', 'build.correction_scope': ['pitch'] });
    assert.ok(r.shown.includes('correction_scope'), 'scope is asked when correction was ruled out');
    assert.ok(r.findings.includes('build-correction-not-agreed'), 'the legal finding fires');
    // The rest of the correction questions stay hidden — nothing to plan for a ruled-out correction …
    for (const f of ['correction_target', 'correction_amount', 'correction_guards', 'correction_compared']) {
      assert.ok(!r.shown.includes(f), `${f} stays hidden`);
    }
    // … so no finding may ask for the hidden key and scale.
    assert.ok(!r.findings.includes('build-correction-no-scale'), 'no finding asks for a hidden answer');
  });

  it('ruled out with nothing ticked raises nothing; "no correction needed" still hides the whole group', () => {
    assert.ok(!ids({ 'build.correction_decision': 'prohibited' }).findings.includes('build-correction-not-agreed'));
    const none = ids({ 'build.correction_decision': 'none_needed', 'build.correction_scope': ['pitch'] });
    assert.ok(!none.shown.includes('correction_scope'));
    assert.ok(!none.findings.includes('build-correction-not-agreed'));
  });

  it('agreed pitch correction with no key and scale still raises its finding', () => {
    assert.ok(ids({ 'build.correction_decision': 'agreed', 'build.correction_scope': ['pitch'] }).findings.includes('build-correction-no-scale'));
  });

  it('the field says why it is there, and both labs still validate', () => {
    const src = read('src/features/production/postprod/stage5.data.ts');
    assert.match(src, /showWhen: \{ field: "correction_decision", notEquals: \["none_needed"\] \},\n\s*label: "What is being corrected"/);
    assert.match(src, /If correction was ruled out, leave this empty\. Anything ticked here is a change to a performance that nobody agreed to\./);
    for (const lab of ['preprod', 'postprod'] as const) {
      assert.deepEqual(validateStages(LABS[lab].stages), [], lab);
      assert.deepEqual(validateSeeds(LABS[lab].stages), [], lab);
    }
  });
});

describe('2 · the timecode plan covers show-control timecode, not only picture', () => {
  it('its help matches the stage 2 question that reveals it', () => {
    const tech = LABS.preprod.stages.find((s: Any) => s.stageId === 'technical')!;
    const f: Any = tech.sections.flatMap((s: Any) => s.fields).find((x: Any) => x.fieldId === 'timecode_plan');
    assert.doesNotMatch(f.help, /Only if a deliverable must sync to picture/);
    assert.match(f.help, /lighting, video or playback/);
    assert.match(f.help, /stage 2/);
  });
});

describe('3 · an empty WHAT\'S LEFT does not overclaim', () => {
  it('says nothing is flagged, and that any notes below are information', () => {
    const scr = read('src/screens/lab/production/ProductionPacketScreen.tsx');
    assert.doesNotMatch(scr, /no rule is asking about anything/);
    assert.match(scr, /nothing is flagged for you to look at\. Any notes printed below are for information\./);
  });
});
