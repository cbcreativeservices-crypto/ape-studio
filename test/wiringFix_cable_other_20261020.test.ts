/**
 * Wiring A-grade audit, Phase 2 fixes (owner go 2026-10-20) — group
 * "cable_other": the cable labs' remaining text findings plus Production,
 * FX, Modular, Meter and Amp (docs/wiring/WIRING_FINDINGS_2026_10_20.md; the
 * finding id is in each title). Each assertion fails if the wrong wording or
 * logic comes back. Source-reading where the module imports Skia or RN.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// House pattern (productionEngine.test.ts): extensionless sibling imports.
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

const { getConnector } = await import('../src/screens/lab/cable/data/registry.ts');
const { resolveStage } = await import('../src/features/production/schema.ts');
const { evaluateStage } = await import('../src/features/production/rules.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');
const { PREPROD_STAGES } = await import('../src/features/production/preprod/index.ts');

const root = join(import.meta.dirname, '..');
const src = (rel: string) => readFileSync(join(root, rel), 'utf8');
const lab = (rel: string) => src(`src/screens/lab/${rel}`);

describe('cable labs — remaining text findings', () => {
  it('CS-05 open shield: phantom loses its return, so a condenser goes silent', () => {
    const s = lab('connectorselect/engine/tester.ts');
    assert.match(s, /Pin 1 is also the return path for phantom power[^']*condenser[^']*silent/);
  });
  it('CS-06 the speaker connection is "most likely" to destroy equipment, not "the one"', () => {
    const s = lab('connectorselect/pagesC.tsx');
    assert.doesNotMatch(s, /the one connection in this lab that can destroy/);
    assert.match(s, /most likely to destroy equipment/);
  });
  it('CB-02 headphone level is about current into a low impedance, not more voltage than line', () => {
    const s = lab('cable/data/lesson01.ts');
    assert.doesNotMatch(s, /More than line level demands/);
    assert.match(s, /current it can push into low-impedance earcups/);
  });
  it('CB-03 trs_35 is not tagged as a balanced cable build (stereo on a common return)', () => {
    assert.notEqual(getConnector('trs_35' as never)?.construction, 'balanced_shielded');
  });
  it('CB-05 a digital-snake protocol is not lumped with office LAN', () => {
    const s = lab('cable/data/lesson04.ts');
    assert.doesNotMatch(s, /Digital-snake or office LAN port \(e\.g\. AES50\)/);
    assert.match(s, /Digital-snake port \(e\.g\. AES50\), or a plain office LAN port/);
  });
  it('CI-02 dimmer runs are power, not control cable', () => {
    const s = lab('cableinstall/data/cableTypes.ts');
    assert.doesNotMatch(s, /Some control \(e\.g\. dimmer runs\)/);
    assert.match(s, /Dimmer runs are POWER, not control/);
  });
  it('PB-04 a mult and a parallel pair are not the top-jack tap', () => {
    const s = lab('patchbay/pagesB.tsx');
    assert.doesNotMatch(s, /tap · mult · split · monitor · parallel feed/);
    assert.match(s, /a MULT is a separate group of jacks/);
  });
  it('PB-05 a full-normal pair breaks on either jack', () => {
    const s = lab('patchbay/engine/scenariosB.ts');
    assert.doesNotMatch(s, /This bay breaks on top\./);
    assert.match(s, /full-normal pair breaks on EITHER jack/);
  });
});

describe('Production — phantom and learn-more (PR-01, PR-02)', () => {
  const st = resolveStage(PREPROD_STAGES.find((s) => s.stageId === 'technical')!, 'music');
  const fire = (r: Record<string, unknown>) =>
    evaluateStage(st, { ...newProject('preprod', 'music', 'T'), values: { 'technical.input_list': [{
      in_source: 'Guitar amp', in_capture: 'dynamic_mic', in_phantom: 'off', in_channels: '1',
      in_connection: 'xlr', in_console: '1', in_track: '1', in_notes: '', ...r,
    }] } as never }).map((f) => f.ruleId);

  it('PR-01 an ACTIVE ribbon with phantom on is correct; without it, flagged', () => {
    assert.ok(!fire({ in_capture: 'active_ribbon_mic', in_phantom: 'on' }).includes('technical-phantom-mismatch'));
    assert.ok(fire({ in_capture: 'active_ribbon_mic', in_phantom: 'off' }).includes('technical-phantom-mismatch'));
  });
  it('PR-01 a PASSIVE ribbon keeps the phantom caution', () => {
    assert.ok(fire({ in_capture: 'ribbon_mic', in_phantom: 'on' }).includes('technical-phantom-mismatch'));
    assert.match(src('src/features/production/preprod/stage5.data.ts'), /label: "Ribbon microphone \(active\)"/);
  });
  it('PR-02 system-path and level rules no longer send learners to the FX chain lab', () => {
    const rules = PREPROD_STAGES.flatMap((s) => s.rules);
    const route = (id: string) => rules.find((r) => r.ruleId === id)?.learnMore?.route;
    assert.equal(route('technical-path-ends-nowhere'), 'SoundSystemsRoute');
    assert.equal(route('technical-level-format-conflict'), 'ConnectorSelectLab');
  });
});

describe('FX, Modular, Meter, Amp', () => {
  it('FX-01 the Gate catalog blurb promises no sidechain (the lab has none)', () => {
    const line = lab('labCatalog.ts').split('\n').find((l) => l.includes("route: 'GateLab'"))!;
    assert.ok(line, 'Gate catalog row exists');
    assert.doesNotMatch(line, /sidechain/i);
    assert.doesNotMatch(lab('fxLabConfigs.tsx'), /sidechain/i, 'if a key input is ever added, update the blurb and this test');
  });
  it('FX-02 delay and reverb 100% WET name the send/return convention', () => {
    const s = lab('fxLabConfigs.tsx');
    assert.equal((s.match(/label: '100% WET', value: 1\.0, blurb: SEND_RETURN_WET/g) ?? []).length, 2);
    assert.match(s, /SEND_RETURN_WET =\s*'[^']*aux send\/return[^']*insert/);
  });
  it('MD-01 the VCA caption matches its one IN / one OUT; CV destinations not over-general', () => {
    const s = lab('ModularLabScreen.tsx');
    assert.doesNotMatch(s, /the VCA is a pair\s+in a row/);
    assert.match(s, /two\s+gain stages in series inside one module, so it has one IN and one OUT/);
    const c = src('src/features/lab/guidedLessons/content.ts');
    assert.doesNotMatch(c, /three places one control signal can go/);
    assert.match(c, /three places this lab’s LFO can go/);
  });
  it('MT-01 pink noise names the display: slope on this FFT-style view, flat on a 1/3-octave RTA', () => {
    const s = lab('meter/modules/modMeterB.tsx');
    assert.doesNotMatch(s, /a straight downward slope on this log display/);
    assert.equal((s.match(/1\/3-octave RTA (shows|draws) (it|pink noise) flat/g) ?? []).length, 2);
    assert.match(s, /FFT-style/);
  });
  it('AM-01 Rack 7 hedges the CLIP flicker and says persistent clip is not acceptable', () => {
    const s = src('src/features/amp/ampContent.ts');
    assert.doesNotMatch(s, /flickers on the very loudest peaks: that is ordinary, healthy operation/);
    assert.match(s, /may be acceptable on some amplifiers[^']*stays lit[^']*not acceptable/);
  });
});
