/**
 * D41 J2 (owner 2026-11-01, "lets continue fixing what the bugs discovered"):
 * LAB COMPLETE must never show above an unpassed understanding check.
 *
 * Vacuum Tube and Amp built their what's-left units from lessons / modules
 * only, so the end screen read LAB COMPLETE in green while the check that
 * completes the lab for certificates (trainingLabKeys completion
 * 'understanding') was still unpassed. The fix follows Mic Selection
 * (37175fbc): the check is the last unit, kind 'check', cleared only from the
 * banked labCompletion record (a practice run never clears it), the
 * completion read joins `unreadable`, and the CHECK row stays on the end
 * screen, where the check is drawn as `extra`.
 *
 * Cymatics (title "ALL MODULES OPENED", never LAB COMPLETE) and Smart
 * Processors (a hub with no end screen) are not changed here.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const code = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const { whatsLeft, endTitle, endLead } = await import('../src/screens/lab/kit/labEnd.ts');
const ampEnd = await import('../src/features/amp/ampEnd.ts');
const { TRAINING_LABS } = await import('../src/features/lab/trainingLabKeys.ts');

describe('Vacuum Tube: the check is a CHECK unit on the end screen', () => {
  const s = code('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
  it('is a training lab completed by its understanding check', () => {
    assert.ok(TRAINING_LABS.some((l) => l.route === 'TubeLab' && l.completion === 'understanding'));
  });
  it('wires the units, the banked check and the widened unreadable', () => {
    assert.match(s, /units=\{endUnits\}\s*cleared=\{endCleared\}\s*unreadable=\{progressUnreadable\}/);
    assert.match(s, /const bankedUnits = useLabClearedUnits\('tube'\);/);
    assert.match(s, /const progressUnreadable = visitsUnreadable \|\| \(hasCheck && completionUnreadable\);/);
    assert.match(s, /id: UNDERSTANDING_UNIT, label: 'Check your understanding', kind: 'check'/);
    assert.match(s, /if \(banked\.has\(UNDERSTANDING_UNIT\)\) out\.add\(UNDERSTANDING_UNIT\);/);
    // The CHECK row never sends the learner back into a section.
    assert.match(s, /onJump=\{\(id\) => \{ if \(id !== UNDERSTANDING_UNIT\) openSection\(/);
    assert.match(s, /extra=\{<LabUnderstandingBlock labId="tube"/);
    assert.doesNotMatch(s, /cleared=\{visited\}/);
  });
  it('every section opened but the check unpassed reads WHAT\'S LEFT; passed (or banked earlier) reads LAB COMPLETE', () => {
    const keys = [...s.matchAll(/^\s{2}\{\s*key: '([a-z]+)'/gm)].map((m) => m[1]);
    assert.ok(keys.length >= 9, `SECTIONS keys: ${keys.join(',')}`);
    const units = [...keys.map((k) => ({ id: k, label: k })), { id: 'understanding', label: 'Check your understanding', kind: 'check' as const }];
    const w = whatsLeft(units, new Set(keys));
    assert.equal(endTitle(w), "WHAT'S LEFT");
    assert.match(endLead(w, { mode: 'progress', noun: 'section', guest: false }), /^Only the check is left/);
    assert.equal(endTitle(whatsLeft(units, new Set([...keys, 'understanding']))), 'LAB COMPLETE');
  });
  it('the end guide says so', async () => {
    const { TUBE_END_GUIDE } = await import('../src/screens/lab/tube/tubeScreenGuides.ts');
    assert.match(TUBE_END_GUIDE.seeing[0], /LAB COMPLETE once every module is opened and the check is passed/);
    assert.match(TUBE_END_GUIDE.seeing[0], /CHECK row/);
    assert.match(TUBE_END_GUIDE.control.join(' '), /the CHECK row moves this screen up to the check/); // D41 K6
    assert.doesNotMatch(TUBE_END_GUIDE.seeing.join(' '), /When none are left the title reads LAB COMPLETE/);
  });
});

describe('Amp: the understanding check joins the modules and the final', () => {
  const BUILT = [
    { id: 'devices' as const, title: 'One' },
    { id: 'apply' as const, title: 'Eight' },
  ];
  const allDone = {
    modules: { devices: { visited: true, done: true, checks: {} }, apply: { visited: true, done: true, checks: {} } },
    bestFinal: { scorePct: 90, passed: true, at: 1 },
  };
  it('is a training lab completed by its understanding check', () => {
    assert.ok(TRAINING_LABS.some((l) => l.route === 'AmpLab' && l.completion === 'understanding'));
  });
  it('the check unit id is the shared UNDERSTANDING_UNIT', () => {
    // understanding.ts is not importable under plain node (extensionless imports), so read its constant.
    const m = /export const UNDERSTANDING_UNIT = '([a-z]+)';/.exec(code('src/features/lab/understanding.ts'));
    assert.ok(m);
    assert.equal(ampEnd.AMP_CHECK_UNIT, m[1]);
  });
  it('every module done and the final passed, check unpassed → WHAT\'S LEFT; check passed → LAB COMPLETE', () => {
    const open = ampEnd.ampEndModel(allDone, BUILT, { passed: false });
    assert.deepEqual(open.units.map((u) => u.id), ['devices', 'apply', 'final', 'understanding']);
    assert.equal(open.units[3].kind, 'check');
    assert.equal(endTitle(whatsLeft(open.units, open.cleared)), "WHAT'S LEFT");
    const done = ampEnd.ampEndModel(allDone, BUILT, { passed: true });
    assert.equal(endTitle(whatsLeft(done.units, done.cleared)), 'LAB COMPLETE');
    // Credit is never removed: a banked check reads passed even with no module progress (after a reset).
    assert.ok(ampEnd.ampEndModel({ modules: {} }, BUILT, { passed: true }).cleared.has('understanding'));
    // No check passed in (no questions authored) = no row, exactly as before.
    assert.deepEqual(ampEnd.ampEndModel(allDone, BUILT).units.map((u) => u.id), ['devices', 'apply', 'final']);
  });
  it('both end screens pass the banked check, show it as extra and keep the CHECK row in place', () => {
    for (const p of ['src/screens/lab/amp/AmpLabHomeScreen.tsx', 'src/screens/lab/amp/AmpModuleScreen.tsx']) {
      const s = code(p);
      assert.match(s, /const bankedUnits = useLabClearedUnits\('amp'\);/, p);
      assert.match(s, /ampEndModel\([^)]*, built, hasCheck \? \{ passed: bankedUnits\.has\(AMP_CHECK_UNIT\) \} : undefined\)/, p);
      assert.match(s, /onJump=\{\(id\) => \{ if \(id !== AMP_CHECK_UNIT\) /, p);
      assert.match(s, /extra=\{<LabUnderstandingBlock labId="amp" labTitle="Amp Lab" \/>\}/, p);
      assert.match(s, /hasCheck && completionUnreadable/, p);
    }
  });
  it('the end guide says so', async () => {
    const { AMP_END_GUIDE } = await import('../src/screens/lab/amp/ampScreenGuides.ts');
    assert.match(AMP_END_GUIDE.seeing[0], /CHECK row for Check your understanding\. LAB COMPLETE shows only once all are done, including a passed check/);
    assert.match(AMP_END_GUIDE.control.join(' '), /The Check your understanding row scrolls to the check on this same screen/); // D41 K6
    assert.match(AMP_END_GUIDE.changes.join(' '), /RESET LAB PROGRESS keeps it passed/);
  });
});

describe('EQ Lab: the check is a CHECK unit on both end screens (D41 J2 follow-up)', () => {
  const end = code('src/screens/lab/eq/eqEnd.ts');
  it('is a training lab completed by its understanding check', () => {
    assert.ok(TRAINING_LABS.some((l) => l.route === 'EqLabHome' && l.completion === 'understanding'));
  });
  it('one builder: modules, then the check row cleared only from the banked record', () => {
    assert.match(end, /id: UNDERSTANDING_UNIT, label: 'Check your understanding', kind: 'check'/);
    assert.match(end, /if \(banked\.has\(UNDERSTANDING_UNIT\)\) out\.add\(UNDERSTANDING_UNIT\);/);
  });
  it('home and module host wire units, banked check, widened unreadable, CHECK row kept in place', () => {
    for (const p of ['src/screens/lab/eq/EqLabHomeScreen.tsx', 'src/screens/lab/eq/EqModuleScreen.tsx']) {
      const s = code(p);
      assert.match(s, /const bankedUnits = useLabClearedUnits\('eq'\);/, p);
      assert.match(s, /const progressUnreadable = visitsUnreadable \|\| \(hasCheck && completionUnreadable\);/, p);
      assert.match(s, /units=\{endUnits\}\s*cleared=\{endCleared\}\s*unreadable=\{progressUnreadable\}/, p);
      assert.match(s, /onJump=\{\(id\) => \{ if \(id !== UNDERSTANDING_UNIT\) /, p);
      assert.match(s, /extra=\{<LabUnderstandingBlock labId="eq" labTitle="EQ Lab" \/>\}/, p);
      assert.doesNotMatch(s, /cleared=\{visited\}/, p);
    }
  });
  it('every module opened but the check unpassed reads WHAT\'S LEFT; banked reads LAB COMPLETE', () => {
    const ids = ['a', 'b', 'c'];
    const units = [...ids.map((k) => ({ id: k, label: k })), { id: 'understanding', label: 'Check your understanding', kind: 'check' as const }];
    assert.equal(endTitle(whatsLeft(units, new Set(ids))), "WHAT'S LEFT");
    assert.equal(endTitle(whatsLeft(units, new Set([...ids, 'understanding']))), 'LAB COMPLETE');
  });
  it('the end guide says so', async () => {
    const { EQ_END_GUIDE } = await import('../src/screens/lab/eq/eqScreenGuides.ts');
    assert.match(EQ_END_GUIDE.seeing[0], /LAB COMPLETE once every module is opened and the check is passed/);
    assert.match(EQ_END_GUIDE.control.join(' '), /the CHECK row stays here/);
    assert.doesNotMatch(EQ_END_GUIDE.seeing.join(' '), /When none are left the title reads LAB COMPLETE/);
  });
});
