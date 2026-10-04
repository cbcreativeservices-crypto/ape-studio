/**
 * Miking M01 — the fixes for the audio-expert and cognitive reviews
 * (docs/labs/miking/kick/REVIEW_AUDIO_EXPERT.md, REVIEW_COGNITIVE.md,
 * 2026-10-04). Each block names the finding it pins.
 *
 *   • checks test reasoning: no length cue (correct ≤ 1.6× the mean wrong
 *     option, and rarely the longest), no absolute-word giveaways, no model
 *     names in options, a "why" for every wrong option (cog C1, M2);
 *   • the final task accepts several setups and grades the reasons (cog C1);
 *     the setup procedure is practised in order, power before gain (cog C2);
 *   • hearing safety is taught where it matters, with NIOSH (audio C1);
 *   • no internal source codes in learner text (cog M6);
 *   • PORT GEOMETRY: the port is drawn as an opening IN the head, at the
 *     port's position, in both views; a boom through the port is clear and
 *     the same mount through an intact head is blocked (lead's finding);
 *   • 3:1 is null for two mics on one source (audio M7, cog M11);
 *   • the comb follows the rear-lobe sign (audio M8);
 *   • ideal nulls never print as a number (audio M3, cog M8);
 *   • zones with a stated orientation test aim; lab-drawn edges read SOURCED*
 *     (audio M5, M6);
 *   • page 4: the monitors are fixed; the downstage wedge can be nulled by
 *     AIM within ±45°, the drummer's fill cannot, and the drum lies in its
 *     path (audio M2, cog M7);
 *   • readout precision and the "inside the drum" wording (audio m12, m13).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { M01_LESSON } from '../src/screens/lab/miking/lessons/m01Kick/lesson.ts';
import { KICK_GEOM, portOpening } from '../src/screens/lab/miking/lessons/m01Kick/geometry.ts';
import { micType } from '../src/screens/lab/miking/data/micTypes.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, zoneEdgesByLab } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { effectivePolarity, micGain, notchesHz } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import { threeToOneReading } from '../src/screens/lab/miking/engine/physics/levels.ts';
import { fmtIdealPickup, fmtMs, isDeepNull, IDEAL_NULL_DB } from '../src/screens/lab/miking/engine/model/units.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { zoneMark, liveLine } from '../src/screens/lab/miking/engine/scene/readoutText.ts';
import { describeMic } from '../src/screens/lab/miking/engine/a11y/describe.ts';
import { validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';

const lesson = M01_LESSON;
const m = lesson.model;
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const items = [...lesson.scenarios, ...lesson.symptoms];

describe('checks test reasoning, not test-taking cues (cognitive C1, M2)', () => {
  it('no option set where the correct one is > 1.6× the mean length of the others', () => {
    for (const s of items) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs mean ${mean.toFixed(1)}`);
    }
  });
  it('the correct option is the longest in at most a quarter of the items', () => {
    const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= items.length / 4, `correct is the longest in ${longest} of ${items.length}`);
  });
  it('wrong options carry no absolute-word giveaway (always / any / never / every)', () => {
    for (const s of items) for (const o of s.options) if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
  });
  it('no option asks to recall a model name', () => {
    for (const s of items) for (const o of s.options) assert.doesNotMatch(o, /Beta ?\d|e ?902|D112|4055|Shure|Sennheiser|AKG/, `${s.id}: "${o}"`);
  });
  it('every wrong option has its own explanation; at least three options each', () => {
    for (const s of items) {
      assert.ok(s.options.length >= 3, s.id);
      for (const o of s.options) if (o !== s.correct) assert.ok(s.why[o] && s.why[o].length > 20, `${s.id}: no why for "${o}"`);
      assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), `${s.id}: why keys must be the wrong options`);
    }
  });
  it('the lesson validates (credited ids exist on their page, ≥ 2 acceptable setups per brief)', () => {
    assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
  });
});

describe('the final task has more than one acceptable solution (cognitive C1; lesson L89)', () => {
  const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
  it('each brief accepts at least two different setups with the same sound reasons', () => {
    for (const t of lesson.setupTasks) {
      const ok = t.setups.filter((s) => s.ok);
      assert.ok(ok.length >= 2, t.id);
      for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
    }
  });
  it('a brand or bass reason fails a good setup; a missing required reason fails it', () => {
    for (const t of lesson.setupTasks) {
      const good = t.setups.find((s) => s.ok)!.id;
      assert.equal(gradeSetup(t, good, new Set([...REQUIRED, 'r.brand'])).pass, false);
      assert.equal(gradeSetup(t, good, new Set([...REQUIRED, 'r.bass'])).pass, false);
      for (const r of REQUIRED) assert.equal(gradeSetup(t, good, new Set(REQUIRED.filter((x) => x !== r))).pass, false, `${t.id} without ${r}`);
      assert.equal(gradeSetup(t, null, new Set(REQUIRED)).pass, false);
    }
  });
  it('the no-phantom brief rejects every setup that needs phantom power', () => {
    const t = lesson.setupTasks.find((x) => /NO phantom/.test(x.brief))!;
    for (const s of t.setups) if (s.power === 'phantom') assert.equal(s.ok, false, s.id);
    const t1 = lesson.setupTasks.find((x) => /phantom power is available/.test(x.brief))!;
    assert.ok(t1.setups.some((s) => s.ok && s.power === 'phantom'), 'with phantom available, a condenser setup can pass');
  });
  it('the one-mic setup is practised in order: player → mic → mount → power → gain → compare → keep', () => {
    const t = lesson.orderTasks.find((x) => x.id === 'k.prac.order')!;
    const at = (re: RegExp) => t.steps.findIndex((s) => re.test(s.text));
    assert.equal(t.steps.length, 7);
    assert.ok(at(/Ask the player/) === 0);
    assert.ok(at(/mount the mic/i) < at(/phantom/));
    assert.ok(at(/phantom/) < at(/gain/));
    assert.ok(at(/gain/) < at(/Compare positions/));
    assert.ok(at(/Mute the outputs/) === at(/phantom/), 'mute and lower monitoring BEFORE switching phantom');
    for (const s of t.steps) assert.ok(s.early.length > 10);
    assert.ok(lesson.pages.practice.credit.scenarios.includes('k.prac.order'));
    assert.ok(lesson.pages.practice.credit.scenarios.includes('k.prac.gain'));
  });
});

describe('hearing safety is taught where it matters (audio C1, cognitive C2)', () => {
  it('page 1 teaches NIOSH 85 dBA / 8 h / 3 dB exchange and that max SPL is not a hearing limit', () => {
    const p1 = read('src/screens/lab/miking/pages/PInstrument.tsx');
    assert.match(p1, /85 dBA averaged over an 8-hour day/);
    assert.match(p1, /every 3 dBA/);
    assert.match(p1, /nothing to do with a microphone’s maximum SPL rating/);
    assert.ok(lesson.pages.instrument.credit.scenarios.includes('k.inst.2'));
    assert.ok(lesson.sources.some((s) => s.key === 'NIOSH'));
  });
  it('the max-SPL figures sit next to the caveat on page 2', () => {
    const p2 = read('src/screens/lab/miking/pages/PMicrophone.tsx');
    assert.match(p2, /Max SPL figures are distortion limits/);
    assert.match(p2, /None of them is a safe listening level/);
  });
});

describe('no internal source codes in learner text (cognitive M6)', () => {
  const CODE = /\(L\d+|\bL\d+-L\d+|\bK-\d\d\b/;
  it('lesson data strings carry no (L39) / K-03 codes', () => {
    const texts: string[] = [];
    for (const p of Object.values(lesson.pages)) texts.push(p.title, p.goal, p.takeaway, p.credit.note);
    for (const s of lesson.scenarios) texts.push(s.prompt, s.explain, ...s.options, ...Object.values(s.why));
    for (const s of lesson.symptoms) texts.push(s.observation, s.explain, ...s.options, ...Object.values(s.why));
    for (const t of lesson.orderTasks) texts.push(t.prompt, t.explain, ...t.steps.flatMap((s) => [s.text, s.early]));
    for (const t of lesson.setupTasks) texts.push(t.brief, t.explain, ...t.setups.flatMap((s) => [s.label, s.feedback]), ...t.reasons.flatMap((r) => [r.label, r.feedback]));
    for (const z of lesson.zones) texts.push(z.label, z.tendency, ...z.checks);
    for (const c of lesson.corrections) texts.push(c.text);
    texts.push(lesson.practice.task, lesson.accuracyDetail);
    for (const t of texts) assert.doesNotMatch(t, CODE, t);
  });
  it('page sources carry no codes outside comments', () => {
    const dir = 'src/screens/lab/miking/pages';
    for (const f of readdirSync(join(process.cwd(), dir))) {
      if (!f.endsWith('.tsx')) continue;
      assert.doesNotMatch(stripComments(read(`${dir}/${f}`)), CODE, f);
    }
  });
});

describe('PORT GEOMETRY — a hole IN the head (lead finding, 2026-10-04)', () => {
  const port = m.ports.ported!;
  it('in both views the opening lies on the head plane, at the port’s position, inside the head', () => {
    for (const view of ['side', 'top'] as const) {
      const o = portOpening(view);
      assert.equal(o.x, KICK_GEOM.L, `${view}: the opening is IN the front-head plane, not beyond it`);
      const c = view === 'side' ? port.c.y : port.c.z;
      assert.ok(Math.abs((o.lo + o.hi) / 2 - c) < 1e-9, `${view}: centred on the port`);
      assert.ok(Math.abs(o.hi - o.lo - 2 * port.r) < 1e-9, `${view}: as wide as the port`);
      assert.ok(o.lo > -KICK_GEOM.R && o.hi < KICK_GEOM.R, `${view}: within the head`);
    }
  });
  it('the art draws the ported head WITH that opening, and no disc beyond the head', () => {
    const art = read('src/screens/lab/miking/lessons/m01Kick/art.tsx');
    assert.match(art, /portOpening\(view\)/);
    assert.match(art, /ported \? g\.frontPorted : g\.front/);
    assert.doesNotMatch(art, /addCircle\([^)]*PORT/);
    const scene = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    assert.doesNotMatch(scene.slice(scene.indexOf('const STAND_ART'), scene.indexOf('function MountPath')), /baseTop\.addCircle/, 'the stand base in plan is a tripod, not a disc that reads as the port');
  });
  it('every inside stand zone: the boom passes THROUGH the port opening (clear) — and an intact head blocks the same mount', () => {
    const ported = compileScene(m, 'ported');
    const intact = compileScene(m, 'intact');
    const zones = lesson.zones.filter((z) => z.side === 'inside' && z.requires?.mount !== 'surface');
    assert.ok(zones.length >= 3);
    for (const z of zones) {
      const body = micBodyOf(micType(z.requires!.micTypeIds![0]));
      const boom = assembly(ported, z.start, body).find((s) => s.piece === 'boom')!;
      const t = (KICK_GEOM.L - boom.a.x) / (boom.b.x - boom.a.x);
      assert.ok(t > 0 && t < 1, `${z.id}: the boom crosses the head plane`);
      const y = boom.a.y + t * (boom.b.y - boom.a.y);
      const zz = boom.a.z + t * (boom.b.z - boom.a.z);
      assert.ok(Math.hypot(y - port.c.y, zz - port.c.z) <= port.r - boom.r, `${z.id}: crosses the head inside the port opening`);
      for (const view of ['side', 'top'] as const) {
        const o = portOpening(view);
        const v = view === 'side' ? y : zz;
        assert.ok(v > o.lo && v < o.hi, `${z.id}: the drawn opening (${view}) is where the boom passes`);
      }
      assert.equal(checkAssembly(ported, z.start, body), null, `${z.id}: through the port is allowed`);
      assert.ok(checkAssembly(intact, z.start, body), `${z.id}: through an intact head is blocked`);
    }
  });
  it('a body straddling the ported head OUTSIDE the opening is blocked by the head', () => {
    const ported = compileScene(m, 'ported');
    const body = micBodyOf(micType('kickDynCard'));
    const hit = checkAssembly(ported, { p: { x: KICK_GEOM.L - 40, y: -150, z: -120 }, az: 0, el: 0 }, body);
    assert.ok(hit, 'blocked');
  });
});

describe('3:1 only where it applies (audio M7, cognitive M11)', () => {
  it('null for two mics on ONE source; a ratio for different sources', () => {
    assert.equal(threeToOneReading({ dAB: 900, rA: 100, rB: 250, srcA: 'kick', srcB: 'kick' }), null);
    assert.equal(threeToOneReading({ dAB: 900, rA: 100, rB: 300, srcA: 'kick', srcB: 'snare' }), 3);
  });
  it('page 5 prints no 3:1 cell', () => {
    assert.doesNotMatch(stripComments(read('src/screens/lab/miking/pages/PTwoMic.tsx')), /3:1 RATIO|threeToOneRatio/);
  });
});

describe('the comb honours the rear-lobe sign (audio M8)', () => {
  it('a source behind a supercardioid arrives inverted, and flips the notch set', () => {
    const behind = micGain('supercardioid', { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 }, { x: 500, y: 0, z: 0 });
    assert.ok(behind < 0, 'ideal rear lobe is polarity-inverted');
    assert.equal(effectivePolarity(1, 1, behind), -1);
    assert.equal(effectivePolarity(-1, 1, behind), 1);
    assert.equal(effectivePolarity(1, 1, 0.5), 1);
    assert.deepEqual(notchesHz(1, effectivePolarity(1, 1, behind), 2500), [0, 1000, 2000]);
  });
  it('CombPanel and page 5 use the effective polarity', () => {
    assert.match(read('src/screens/lab/miking/engine/scene/CombPanel.tsx'), /effectivePolarity\(pol, gA, gB\)/);
    assert.match(read('src/screens/lab/miking/pages/PTwoMic.tsx'), /effectivePolarity\(B\.polarity, gA, gB\)/);
  });
});

describe('ideal nulls never print as a real value (audio M3, cognitive M8)', () => {
  it('below the threshold the text has no number', () => {
    assert.equal(isDeepNull(IDEAL_NULL_DB - 0.1), true);
    assert.equal(isDeepNull(IDEAL_NULL_DB + 0.1), false);
    assert.equal(fmtIdealPickup(-52.4), 'deep null (ideal)');
    assert.match(fmtIdealPickup(-11.4), /−11\.4 dB \(ideal\)/);
  });
  it('pages 2 and 4 branch on isDeepNull before printing a pickup number', () => {
    for (const f of ['PMicrophone.tsx', 'PContext.tsx']) assert.match(read(`src/screens/lab/miking/pages/${f}`), /isDeepNull\(db\)/, f);
  });
});

describe('zones: aim where the source states an axis; lab-drawn edges disclosed (audio M5, M6)', () => {
  const scene = compileScene(m, 'ported');
  const ctx = { scene, surfaces: m.surfaces, lines: m.lines, variant: 'ported', micTypeId: 'kickDynSuper', mount: 'stand' };
  it('b52.far counts on-axis with the beater, not when the mic is turned away', () => {
    const z = lesson.zones.find((q) => q.id === 'b52.far')!;
    assert.ok(inZone(z, ctx, z.start));
    assert.ok(!inZone(z, ctx, { ...z.start, az: 50 }), 'turned 50° away: out of the zone');
    assert.ok(!inZone(z, ctx, { ...z.start, el: -60 }), 'pointed at the floor: out of the zone');
    assert.ok(inZone(z, ctx, { ...z.start, az: 20 }), 'within the lab’s ±30°');
  });
  it('marks: plain SOURCED only when every edge is the source’s; TRIAL stays TRIAL', () => {
    assert.equal(zoneMark(lesson.zones.find((z) => z.id === 'b91.pillow')!), 'SOURCED');
    for (const id of ['b52.near', 'b52.far', 'e902.reso', 'dpa.outside']) {
      const z = lesson.zones.find((q) => q.id === id)!;
      assert.equal(zoneEdgesByLab(z), true, id);
      assert.equal(zoneMark(z), 'SOURCED*', id);
    }
    assert.equal(zoneMark(lesson.zones.find((z) => z.id === 'live.D')!), 'TRIAL');
    assert.equal(zoneMark(null), 'NONE');
  });
  it('the placement lobe is drawn in the IDEAL colour, never the sourced blue, and tagged', () => {
    const s = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    const slice = s.slice(s.indexOf('function PolarSlice'), s.indexOf('function PathsOverlay'));
    assert.doesNotMatch(slice, /color=\{BLUE\}/);
    assert.match(slice, /IDEAL PATTERN · SHAPE, NOT RANGE/);
  });
});

describe('page 4: the monitor stays put, the learner aims the mic (audio M2, cognitive M7)', () => {
  const z = lesson.zones.find((q) => q.id === 'dpa.outside')!;
  const srcOf = (id: string) => {
    const w = lesson.live.wedges.find((q) => q.id === id)!;
    return { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
  };
  const reach = (id: string, pat: 'cardioid' | 'supercardioid' | 'hypercardioid') => {
    let n = 0;
    for (let az = -45; az <= 45; az += 5) for (let el = -30; el <= 30; el += 5) if (nearNull(pat, arrivalAngle({ ...z.start, az, el }, srcOf(id)), 15)) n++;
    return n;
  };
  it('the outside start is clear for both kick dynamics, ported and intact', () => {
    for (const v of ['ported', 'intact']) for (const t of ['kickDynSuper', 'kickDynCard']) assert.equal(checkAssembly(compileScene(m, v), z.start, micBodyOf(micType(t))), null, `${v}/${t}`);
  });
  it('the downstage wedge is NOT in the null at the start — the learner must aim — and can be by aim alone', () => {
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, srcOf('downstage')), 15), false);
    assert.ok(reach('downstage', 'supercardioid') > 0);
    assert.ok(reach('downstage', 'hypercardioid') > 0);
  });
  it('the drummer’s fill is in front of the mic: no aim within the limits nulls it, and the drum lies in its path', () => {
    for (const p of ['cardioid', 'supercardioid', 'hypercardioid'] as const) assert.equal(reach('fill', p), 0, p);
    const parts = ['kick.shell', 'kick.batter', 'kick.reso', 'kick.resoPorted'];
    assert.ok(solidOnPath(compileScene(m, 'ported'), z.start.p, srcOf('fill'), parts));
    assert.equal(solidOnPath(compileScene(m, 'ported'), z.start.p, srcOf('downstage'), parts), null);
  });
  it('no monitor sits inside the drum or under the kit, and every position is ILLUSTRATIVE', () => {
    for (const w of lesson.live.wedges) {
      assert.equal(w.prov.kind, 'illustrative');
      assert.ok(w.p.x < -300 || w.p.x > KICK_GEOM.L + 300, w.id);
    }
  });
});

describe('readout wording and precision (audio m12, m13)', () => {
  it('Δt is rounded to 0.05 ms and marked ≈', () => {
    assert.equal(fmtMs(0.7012), '≈ 0.70 ms');
    assert.equal(fmtMs(0.724), '≈ 0.70 ms');
    assert.equal(fmtMs(-0.736), '≈ 0.75 ms');
  });
  it('a negative distance from the front head reads "inside the drum from", the batter head keeps "behind"', () => {
    const r = { surfaceId: 'reso', distance: -60, radial: 0, radialLine: 'axis', offAxis: 0, inside: true, zoneId: null, blocked: null };
    const reso = m.surfaces.find((s) => s.id === 'reso')!;
    assert.match(liveLine(r, { slot: 'A', surfaceLabel: reso.label, lineLabel: 'the drum’s axis', showAim: true, minusWords: reso.minus!.words, minusKey: reso.minus!.key }), /inside the drum from the front head/);
    assert.match(describeMic({ slot: 'A', typeLabel: 'x', patternLabel: 'y', readouts: r, surfaceLabel: reso.label, lineLabel: 'the axis', zoneLabel: null, zoneKind: null, showAim: true, minusWords: reso.minus!.words }), /inside the drum from the front head/);
    assert.match(liveLine({ ...r, surfaceId: 'batter' }, { slot: 'A', surfaceLabel: 'the batter head', lineLabel: 'the beater line', showAim: true }), /behind the batter head/);
  });
});

describe('try before tell (cognitive M1)', () => {
  it('pages 2–5 open on the activity, with a prediction, before the LEARN read', () => {
    for (const [f, page] of [
      ['PMicrophone.tsx', 'microphone'],
      ['PPlacement.tsx', 'placement'],
      ['PContext.tsx', 'context'],
      ['PTwoMic.tsx', 'twoMic'],
    ] as const) {
      const s = read(`src/screens/lab/miking/pages/${f}`);
      const steps = s.slice(s.indexOf('const steps: MikingStep[]'));
      assert.ok(steps.indexOf("layout: 'rack'") < steps.indexOf("kind: 'LEARN'"), `${f}: the rack step comes first`);
      assert.match(s, /<PredictCard /, f);
      assert.ok(lesson.predictions[page], page);
    }
  });
});
