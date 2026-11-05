/**
 * Report 2026-11-05, items 16, 17, 18, 20, 21, 22: words on a screen that said
 * something untrue or unclear.
 *   16. Certificate requirement rows use a bullet; ✓ is kept for done.
 *   17. The Cymatics studios' CHECK says it covers the whole lab.
 *   18. An empty My Custom List shows no percent; a list with terms stays at 100.
 *   20. Gate RANGE carries dB and shares THRESH's minus sign.
 *   21. The Advanced Tuner's bar is called what it is: CONFIDENCE.
 *   22. A signal source's info page does not talk about measuring.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('16. requirement rows use a neutral bullet, never ✓', () => {
  const s = read('src/screens/awards/AwardsScreen.tsx');
  assert.doesNotMatch(s, />✓</);
  const at = s.indexOf('CO-REQUISITES</Text>');
  const end = s.indexOf('{tier.programs &&', at);
  assert.equal(s.slice(at, end).match(/>•</g)?.length, 2);
});

test('17. each Cymatics studio titles its shared CHECK as whole-lab', () => {
  assert.match(read('src/screens/lab/cymatics/cymaticsScreenGuides.ts'), /CYMATICS_CHECK_TITLE = 'Covers the Whole Cymatics Lab'/);
  for (const f of ['Membrane', 'Plate', 'Liquid']) {
    assert.match(read(`src/screens/lab/cymatics/${f}StudioScreen.tsx`), /checkTitle=\{CYMATICS_CHECK_TITLE\}/, f);
  }
  assert.match(read('src/screens/lab/LabShell.tsx'), /<LabUnderstandingCheck\n\s*labTitle=\{checkTitle \?\? title\}/);
});

test('18. no percent at 0 terms; the 100% ruling stands otherwise', async () => {
  const rules = await import('../src/features/commercial/studyGate.ts');
  const list = (read: boolean, unreadable: boolean, count: number) => ({ read, unreadable, count });
  assert.equal(rules.customListIsEmpty(list(true, false, 0)), true);
  assert.equal(rules.customListMeterPct(list(true, false, 0)), 0);
  assert.equal(rules.customListMeterPct(list(true, false, 1)), 100);
  // Loading or unreadable is not known to be empty.
  assert.equal(rules.customListMeterPct(list(false, false, 0)), 100);
  assert.equal(rules.customListMeterPct(list(true, true, 0)), 100);
  assert.match(read('src/screens/dashboard/DashboardScreen.tsx'), /\{dispIsCustom && customEmpty \? 'EMPTY' : `\$\{dispOverallPct\}%`\}/);
});

test('20. Gate RANGE labels carry dB, and THRESH uses the same minus sign', () => {
  const s = read('src/screens/lab/fxLabConfigs.tsx');
  for (const l of ['−20 dB GENTLE', '−40 dB', '−70 dB SILENCE']) assert.ok(s.includes(`label: '${l}'`), l);
  assert.ok(s.includes('choices: [-50, -35, -20].map((t) => ({ label: `−${Math.abs(t)} dB`, value: t })),'));
  assert.ok(s.includes('format: (v) => `−${Math.abs(Math.round(v))} dB`'));
  assert.ok(s.includes('`Below −${Math.abs(v[P.thresholdDb])} dB the output drops'));
});

test('21. the Advanced Tuner row reads CONFIDENCE, not SIGNAL', () => {
  const s = read('src/screens/tools/CenterLockTuner.tsx');
  assert.match(s, /<Text style=\{styles\.footLabel\}>CONFIDENCE<\/Text>/);
  assert.doesNotMatch(s, />SIGNAL</);
});

test('22. a signal source has its own headings; every other tool keeps measuring words', () => {
  const data = read('src/screens/tools/toolsData.ts');
  assert.equal(data.match(/signalSource: true/g)?.length, 1);
  assert.match(data, /key: 'signalgen',[\s\S]{0,140}signalSource: true/);
  assert.doesNotMatch(data, /'Anything — it is/);
  const info = read('src/screens/tools/ToolInfoScreen.tsx');
  assert.ok(info.includes("{tool.signalSource ? 'WHAT IT PRODUCES' : 'WHAT IT MEASURES'}"));
  assert.ok(info.includes("{tool.signalSource ? 'WHAT IT DOES NOT DO' : 'WHAT IT DOES NOT MEASURE'}"));
});
