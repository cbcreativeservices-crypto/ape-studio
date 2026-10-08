/**
 * Miking Labs 6 and 7 — the owner's lesson-specific decisions of 2026-10-08
 * (docs/labs/miking/CORRECTIONS_LOG.md, "Owner decisions 2026-10-08"):
 *
 *   L6A  F09 reads every shotgun to its CAPSULE (as F01–F05), the tip keeps
 *        the frame clearance, and one line says the tip is about 20 cm nearer
 *   L6F  F06's 60 cm spaced omnis: one line on wider spacing and mono
 *   L6T  F07 / F08 titles approved as they are
 *   L7A  B12–B17 START shows each lesson's own intro
 *   L7F  the live context badge says each lesson's own loudspeaker words
 *   L7J  B16's hydrophone cable line
 *   L7D  body-pack wireless setups carry power 'pack', not 'phantom'
 *   L7G  B02's guest beside the anchor, plus the 30–45° line
 *   DEF  every listed builder default marked approved in the log
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import type { Lesson, MikingScenario } from '../src/screens/lab/miking/engine/model/types.ts';
import { boomStart, frameForShot } from '../src/screens/lab/miking/lessons/shared/field/location.ts';
import { FRAME, LENS } from '../src/screens/lab/miking/lessons/f09LocationSpeech/geometry.ts';
import { learnerStrings } from './_mikingItemRules.ts';

const lesson = (id: string) => lessonById(id) as Lesson;
const src = (rel: string) => readFileSync(new URL(`../src/screens/lab/miking/${rel}`, import.meta.url), 'utf8');
const log = readFileSync(new URL('../docs/labs/miking/CORRECTIONS_LOG.md', import.meta.url), 'utf8');
const len = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z);

describe('L6A — F09 reads a shotgun to its capsule', () => {
  const F09 = lesson('F09');
  const zone = (id: string) => F09.zones.find((z) => z.id === id)!;
  it('the F09 shotguns carry their tube ahead of the capsule; Lab 7’s front-read types are untouched', () => {
    assert.equal(MIC_TYPES.locBoomSgCap.body.fore?.mm, 200);
    assert.equal(MIC_TYPES.locBoomSgCap.body.length.mm + 200, 250, 'a 250 mm shotgun overall');
    assert.equal(MIC_TYPES.locBoomFurCap.body.fore?.mm, 285);
    assert.equal(MIC_TYPES.locCamCap.body.fore?.mm, 130);
    for (const id of ['locBoomSg', 'locBoomFur', 'locCam']) assert.equal(MIC_TYPES[id].body.fore, undefined, id);
    for (const id of ['locBoomSg', 'locBoomFur', 'locCam']) assert.ok(!F09.micTypeIds.includes(id), `F09 no longer uses ${id}`);
    for (const id of ['locBoomSgCap', 'locBoomFurCap', 'locCamCap']) assert.ok(F09.micTypeIds.includes(id), id);
  });
  it('the boom start keeps the TIP 15 cm above the frame and reads the capsule 20 cm farther', () => {
    const tipOnly = boomStart(FRAME, { clearance: 150, elevDeg: 45 });
    const b = boomStart(FRAME, { clearance: 150, elevDeg: 45, capsule: 200 });
    assert.equal(b.d, tipOnly.d + 200);
    assert.ok(len({ x: b.tip.x - tipOnly.p.x, y: b.tip.y - tipOnly.p.y, z: 0 }) < 1e-9, 'the tip stays where the front was');
    assert.equal(b.d, 810, 'medium shot: the capsule about 80 cm from the lips');
    assert.equal(boomStart(frameForShot(LENS, 'wide'), { capsule: 200 }).d, 1100, 'wide shot: 110 cm');
    const z = zone('loc.boom');
    assert.ok(Math.abs(len(z.start.p) - b.d) < 2, `the set boom starts at its capsule (${len(z.start.p)})`);
    const out = zone('loc.boom.out');
    assert.ok(Math.abs(len(out.start.p) - (tipOnly.d + 285)) < 2, 'the fur basket’s front keeps the clearance');
    const cam = zone('loc.cam');
    const a = aimVec(cam.start.az, cam.start.el);
    const tip = { x: cam.start.p.x + a.x * 130, y: cam.start.p.y + a.y * 130, z: cam.start.p.z + a.z * 130 };
    assert.ok(tip.x >= 2400, 'the camera mic’s tip stays on the camera');
  });
  it('the words say capsule, with ONE line on the tip', () => {
    const text = learnerStrings(F09).join('\n');
    assert.doesNotMatch(text, /front of the mic|mic’s FRONT|mic’s front\b/);
    const C = copyOf(F09);
    assert.match(C.placement.learn.separate, /The tip of a shotgun is about 20 cm nearer the mouth than its capsule\./);
    assert.equal((text.match(/about 20 cm nearer the mouth/g) ?? []).length, 1, 'one line');
    assert.match(F09.accuracyDetail, /measured from the lips to the mic’s capsule/);
    const q = F09.scenarios.find((s) => s.id === 'loc.snd.1') as MikingScenario;
    assert.equal(q.correct, 'The talker’s lips, to the mic’s capsule');
  });
});

describe('L6A extended (owner: capsule everywhere) — B04, B10, B11', () => {
  it('the Lab 7 booms use the capsule-read shotgun; the camera mic carries its tube', () => {
    for (const id of ['B04', 'B10', 'B11']) {
      const L = lesson(id);
      assert.ok(L.micTypeIds.includes('locBoomSgCap') && !L.micTypeIds.includes('locBoomSg'), id);
      assert.match(L.accuracyDetail, /a shotgun’s capsule, about 20 cm behind its tip/, id);
    }
    assert.equal(MIC_TYPES.camMic.body.fore?.mm, 130);
    assert.equal(MIC_TYPES.camMic.body.length.mm + 130, 180);
  });
  it('the starts moved back 20 cm along the same line, so the drawn tip stays put', () => {
    const z = (id: string, zid: string) => lesson(id).zones.find((q) => q.id === zid)!;
    const above = z('B04', 'b4.above');
    const compact = z('B04', 'b4.compact');
    assert.ok(Math.abs(len(above.start.p) - len(compact.start.p) - 200) < 1, 'the compact (no tube) sits at the shotgun’s tip');
    assert.match(src('lessons/b10Sideline/model.ts'), /start: \{ d: \[900, /);
    assert.match(src('lessons/b11Athletes/model.ts'), /start: \{ d: \[1200, /);
    assert.match(src('lessons/b04BoomCamera/pages.tsx'), /tube: SHOTGUN_CAPSULE_MM,\n\s+camTube: CAM_CAPSULE_MM,/);
  });
});

describe('after owner-x (2026-10-08): the rounding words and the ground line', () => {
  it('Lab 6/7 accuracy notes say the one distance rule', () => {
    for (const id of ['F01', 'F02', 'F03', 'F04', 'F09', 'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B09', 'B10', 'B11']) {
      const a = lesson(id).accuracyDetail;
      assert.doesNotMatch(a, /rounded to about 5 mm(?! below 1 m)/, id);
      assert.match(a, /rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m/, id);
    }
  });
  it('the ground line reads “1.5 m above the ground”, never “above the ground the ground”', () => {
    for (const [id, dir] of [['F06', 'f06Ambience'], ['F07', 'f07Wildlife'], ['F08', 'f08Passby'], ['F12', 'f12SoundLevel']]) {
      assert.match(src(`lessons/${dir}/geometry.ts`), /label: 'the ground'[^\n]*words: \{ plus: 'above', minus: 'below',/, id);
    }
  });
});

describe('Lab 6 — F06 and the titles', () => {
  it('L6F: the 60 cm spaced pair adds the wider-spacing line', () => {
    const t = src('lessons/f06Ambience/model.ts');
    assert.match(t, /label: 'Spaced omnis, 60 cm apart'[^\n]*Wider spacing is common for ambience — check it in mono\./);
  });
  it('L6T: F07 and F08 keep their approved titles', () => {
    assert.equal(LESSONS.find((l) => l.id === 'F07')?.title, 'Wildlife and Distant Sounds');
    assert.equal(LESSONS.find((l) => l.id === 'F08')?.title, 'Moving Sounds and Pass-bys');
  });
});

describe('Lab 7 — START, the badge, the hydrophone, power, the guest', () => {
  it('L7A: B12–B17 show their own START intro; the engine shows it only when asked', () => {
    for (const [id, dir] of [['B12', 'b12Parabolic'], ['B13', 'b13FieldDiamond'], ['B14', 'b14CourtIce'], ['B15', 'b15TrackGymCombat'], ['B16', 'b16MotorHorseWater'], ['B17', 'b17CrowdComplete']]) {
      assert.match(src(`lessons/${dir}/pages.tsx`), /startStep\(lesson, journey, '', \{ ownIntro: true \}\)/, id);
      assert.ok((copyOf(lesson(id)).terms?.startIntro ?? '').length > 40, `${id} has its own intro`);
    }
    assert.match(src('lessons/shared/journeyPages.tsx'), /<Body>\{own \?\? journeyIntro\(/);
  });
  it('L7F: each speech lesson names its own loudspeaker on the live badge', () => {
    assert.match(src('pages/PContext.tsx'), /\$\{X\.badgeWhere \?\? 'monitors where a stage often puts them'\}/);
    const want: Record<string, RegExp> = { B01: /the PA/, B02: /the PA/, B03: /loudspeaker/, B04: /the PA/, B05: /the PA/, B06: /the PA/, B07: /monitor/, B09: /the PA where the venue/, B10: /the PA where the venue/, B11: /the PA where the venue/ };
    for (const [id, re] of Object.entries(want)) assert.match(copyOf(lesson(id)).context.badgeWhere ?? '', re, id);
  });
  it('L7J: the hydrophone cable line', () => {
    const q = lesson('B16').scenarios.find((s) => s.id === 'mo.mix.1') as MikingScenario;
    assert.match(q.explain, /Never lift it by a damaged cable; replace a damaged cable before use\./);
    assert.doesNotMatch(q.explain, /pulled out by/);
  });
  it('L7D: body-pack wireless setups carry power "pack"; a bodypack into phantom stays phantom', () => {
    const task = (id: string, t: number) => lesson(id).setupTasks[t].setups;
    const B05a = task('B05', 0);
    for (const k of ['a', 'b', 'c', 'd']) assert.equal(B05a.find((s) => s.id === k)?.power, 'pack', `B05 setup1 ${k}`);
    assert.equal(B05a.find((s) => s.id === 'e')?.power, 'phantom', 'the bodypack plugged into phantom');
    for (const k of ['a', 'b', 'c', 'e']) assert.equal(task('B05', 1).find((s) => s.id === k)?.power, 'pack', `B05 setup2 ${k}`);
    assert.equal(task('B02', 0).find((s) => s.id === 'a')?.power, 'pack');
    assert.equal(task('B10', 1).find((s) => s.id === 'a')?.power, 'pack');
    assert.equal(task('B11', 0).find((s) => s.id === 'a')?.power, 'pack');
    assert.equal(task('F09', 1).find((s) => s.id === 'b')?.power, 'pack');
    for (const id of ['B02', 'B05', 'B10', 'B11', 'F09']) {
      for (const t of lesson(id).setupTasks) for (const s of t.setups) {
        if (/\blav\b|\blavs\b|body mic|headset/i.test(s.label) && !/boom|lectern|gooseneck|handheld|aisle|team headset|phantom input/i.test(s.label)) assert.equal(s.power, 'pack', `${id} ${t.id} ${s.id}`);
      }
    }
  });
  it('L7G: the guest stays beside the anchor, with the 30–45° line', () => {
    const g = lesson('B02').setting.items.find((i) => i.id === 'guest');
    assert.match(g?.note ?? '', /^Beside the anchor/);
    assert.match(g?.note ?? '', /A guest angled 30–45° toward the anchor also works\./);
  });
});

describe('DEF — the owner decisions are recorded', () => {
  it('the log has the section and every answer', () => {
    const at = log.indexOf('## Owner decisions 2026-10-08');
    assert.ok(at > 0);
    const sec = log.slice(at);
    for (const id of ['L6A', 'L6F', 'L6T', 'L7A', 'L7F', 'L7J', 'L7D', 'L7G', 'DEF']) assert.match(sec, new RegExp(`^\\| ${id} \\|`, 'm'), id);
  });
  it('the listed builder defaults are marked approved', () => {
    for (const id of ['O-1', 'O-5', 'O-8', 'O-14', 'G1-OR-1', 'G1-OR-5', 'G2-1', 'G2-8']) assert.match(log, new RegExp(`^\\| ${id} \\|[^\\n]*APPROVED 2026-10-08 \\|$`, 'm'), id);
    for (const id of ['G5-D1', 'G5-D9', 'D7-1 rules on screen', 'D7-7 Lip-mic distance']) assert.match(log, new RegExp(`\\*\\*${id}[^*]*\\*\\* APPROVED 2026-10-08`), id);
    assert.match(log, /^- D-6B-5 [^\n]*APPROVED 2026-10-08\.$/m);
    assert.match(log, /\| G6-12 \|[^\n]*SUPERSEDED 2026-10-08/);
  });
});
