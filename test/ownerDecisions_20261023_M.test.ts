/**
 * Owner decisions 2026-10-23, group M (miking) — items 1–6 of
 * OWNER_DECISIONS_20261023.md, applied as the owner worded them.
 *
 *  1. The 60° AIM tip: AIM turns the mic in place, so the source stays in
 *     front of the mic but goes off its axis — never "it still faces".
 *  2. A fixed boom STAND over a seated talker is "set up and secured by
 *     trained crew" (never "rigged"); "qualified rigger" stays for anything
 *     hung over people or seats.
 *  3. Drawing checks: (a) M07a's section monitor is upstage and past the far
 *     head — off the drum's axis, yet in the spot's front where no null
 *     reaches; (b) M10's headphone-mixer cable stays clear of the door
 *     walkway; (c) B09's two headset booms are MIRRORED (drawing fixed).
 *  4. Veena: "round the middle of the plate, on the far side of the bridge
 *     from the neck"; zone label "Over the middle of the top plate".
 *  5. E09's spaced pair hangs on one long, well-weighted bar.
 *  6. M01's boundary mic: "the beater within 60° of straight up from the
 *     plate" (S-B91-UG's words: "Keep sound sources within a 60° range above
 *     this surface."). Source read with CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { aimVec, angleBetween } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { M10_WALKWAY, m10Cue } from '../src/screens/lab/miking/lessons/m10Room/roomPlanModel.ts';
import { cueCables } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';
import { ANALYST, CALLER } from '../src/screens/lab/miking/lessons/b09Commentators/geometry.ts';
import { SAFETY as BOOM_SAFETY } from '../src/screens/lab/miking/lessons/shared/broadcast/boomPole.ts';

const ROOT = process.cwd();
const MK = join(ROOT, 'src/screens/lab/miking');
const read = (rel: string) => readFileSync(join(MK, rel), 'utf8').replace(/\r\n/g, '\n');

function files(dir = MK): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}
const ALL = files().map((f) => ({ f, s: readFileSync(f, 'utf8').replace(/\r\n/g, '\n') }));

describe('1 · the 60° AIM tip', () => {
  const NEW = /^Turn (the front|the capsule|the capsule’s front|the gooseneck’s capsule|the boom mic) up to 60° either way — (the [^.]+) stays in front of the mic, a little off its axis\.$/;
  const tips = ALL.flatMap(({ f, s }) => [...s.matchAll(/aimBlurb: '([^']*60° either way[^']*)'/g)].map((m) => ({ f, t: m[1] })));
  it('every 60° tip (32 lessons) says the source stays in front, a little off the axis', () => {
    assert.equal(tips.length, 32);
    for (const { f, t } of tips) assert.match(t, NEW, f);
  });
  it('no 60° tip still claims the mic "still faces" or "still looks at" its source', () => {
    for (const { f, s } of ALL) assert.doesNotMatch(s, /60° either way — (it still|the guard still)/, f);
  });
  it('each lesson keeps its own X', () => {
    const x = (rel: string) => tips.find((q) => q.f.replace(/\\/g, '/').includes(rel))!.t.match(NEW)![2];
    assert.equal(x('a01Trumpet/'), 'the bell');
    assert.equal(x('b03FieldReporter/'), 'the speaking mouth');
    assert.equal(x('shared/foley/'), 'the action');
    assert.equal(x('i01aHiHat/'), 'the bottom cymbal');
    assert.match(tips.find((q) => q.f.replace(/\\/g, '/').includes('b02NewsAnchor/'))!.t, /^Turn the gooseneck’s capsule /);
  });
});

describe('2 · a boom stand is set up by trained crew', () => {
  it('B02 and B04 never say a stand is "rigged" or "qualified crew"', () => {
    for (const rel of ['lessons/b02NewsAnchor/copy.ts', 'lessons/b02NewsAnchor/geometry.ts', 'lessons/b02NewsAnchor/lesson.ts', 'lessons/b02NewsAnchor/model.ts', 'lessons/b04BoomCamera/copy.ts', 'lessons/b04BoomCamera/lesson.ts', 'lessons/shared/broadcast/boomPole.ts']) {
      const s = read(rel);
      assert.doesNotMatch(s, /qualified crew|\b[Rr]igged (and|by)\b|\brig an overhead boom|RIGGING AND/, rel);
    }
    assert.match(read('lessons/b02NewsAnchor/copy.ts'), /A fixed boom stand over a seated person is set up and secured by trained crew before anyone sits beneath it\./);
    assert.match(read('lessons/b04BoomCamera/copy.ts'), /'Mount: a boom stand set up and secured by trained crew'/);
    assert.match(BOOM_SAFETY.rigged, /set up and secured by trained crew/);
  });
  it('the B02 quiz answers say trained crew', () => {
    const s = read('lessons/b02NewsAnchor/lesson.ts');
    assert.match(s, /correct: 'When trained crew have set it up and secured it'/);
    assert.match(s, /correct: 'Once trained crew have secured it'/);
  });
  it('anything hung over seats still names a qualified rigger', () => {
    assert.match(read('lessons/b08Audience/copy.ts'), /rigged by a qualified rigger/);
  });
});

describe('3 · drawing checks', () => {
  it('(a) M07a: the section monitor is off the drum’s axis yet in the spot’s front — no null reaches it', () => {
    const l = lessonById('M07a') as any;
    const spot = l.zones.find((z: any) => z.id === 'cbd.spot').start;
    const fill = l.live.wedges.find((w: any) => w.id === 'fill');
    const to = { x: fill.p.x - spot.p.x, y: fill.p.y - (fill.lift ?? 0) - spot.p.y, z: fill.p.z - spot.p.z };
    const off = angleBetween(aimVec(spot.az, spot.el), to);
    assert.ok(Math.abs(off - 35) < 3, `≈ 35° off the spot’s axis (${off.toFixed(1)}°)`);
    // even swung the full 45° away, it stays short of a hypercardioid’s null (≈ 110°)
    assert.ok(off + 45 < 109);
    // upstage (−z) and past the far head (x below −depth), NOT on the drum's axis (z = 0)
    assert.ok(fill.p.z < -1000 && fill.p.x < -410);
    const note = l.setting.items.find((i: any) => i.id === 'fill').note;
    assert.match(note, /^Upstage and past the far head, facing the players\. It is off the drum’s axis, yet still in FRONT of a spot looking down at the drum — about 35° off the mic’s axis — where no pattern rejects it\.$/);
  });
  it('(b) M10: the drawn headphone-mixer cable never enters the door walkway', () => {
    const W = M10_WALKWAY;
    for (const c of cueCables(m10Cue())) {
      for (let i = 1; i < c.pts.length; i++) {
        const a = c.pts[i - 1];
        const b = c.pts[i];
        for (let k = 0; k <= 200; k++) {
          const u = a.u + ((b.u - a.u) * k) / 200;
          const v = a.v + ((b.v - a.v) * k) / 200;
          assert.ok(!(u > W.u0 && u < W.u1 && v > W.v0 && v < W.v1), `${c.id} enters the walkway at (${u}, ${v})`);
        }
      }
    }
    assert.match(read('lessons/m10Room/PRoomSetting.tsx'), /its cable running straight back to the control room box on the back wall, clear of the door’s walkway\./);
  });
  it('(c) B09: the two booms are mirrored — each on the side toward the partner', () => {
    const l = lessonById('B09') as any;
    const a = l.zones.find((z: any) => z.id === 'b9.headset').start.p;
    const b = l.zones.find((z: any) => z.id === 'b9.analyst').start.p;
    assert.ok(a.z > CALLER.lip.z, 'the commentator’s capsule on their right, toward the analyst');
    assert.ok(b.z < ANALYST.lip.z, 'the analyst’s capsule on their left, toward the commentator');
    const m = read('lessons/b09Commentators/model.ts');
    assert.match(m, /'Mirrored: each boom on the side toward the partner'/);
    assert.doesNotMatch(m, /Both booms set the same way|the same place as the commentator’s/);
    assert.match(read('lessons/b09Commentators/geometry.ts'), /'the headset over the analyst’s left ear, on the commentator’s side', c: earPivotLeft\(ANALYST\), axis: v3\(0, 0, -1\)/);
  });
});

describe('4 · the veena’s plate', () => {
  const P = 'round the middle of the plate, on the far side of the bridge from the neck';
  it('no "between the bridge and the body" is left in the veena or the shared lute model', () => {
    for (const rel of ['lessons/c15Veena/copy.ts', 'lessons/c15Veena/lesson.ts', 'lessons/c15Veena/model.ts', 'lessons/shared/lutes/luteModel.ts']) assert.doesNotMatch(read(rel), /between the bridge and the body/, rel);
  });
  it('the zone, its label and the quote card say the same place', () => {
    const m = read('lessons/c15Veena/model.ts');
    assert.match(m, /label: 'Over the middle of the top plate'/);
    assert.ok(m.includes(`aimed at a broad area ${P}.'`));
    const l = read('lessons/c15Veena/lesson.ts');
    assert.ok(l.includes(`quote: '30–50 cm from the top plate, ${P}'`));
    assert.match(l, /right: 'The top plate, round its middle, on the far side of the bridge from the neck'/);
    assert.ok(read('lessons/c15Veena/copy.ts').includes(`workedAim: 'Aim at a broad area ${P} —`));
  });
});

describe('5 · E09’s spaced pair', () => {
  it('hangs on one long, well-weighted bar', () => {
    assert.match(read('lessons/e09CompleteBand/geometry.ts'), /'Two small condensers on one long, well-weighted bar, 1\.4 m apart, pointing straight down\.'/);
  });
});

describe('6 · M01’s boundary mic orientation', () => {
  it('names the reference: within 60° of straight up from the plate', () => {
    assert.match(read('lessons/m01Kick/model.ts'), /'Orientation: the beater within 60° of straight up from the plate'/);
    assert.match(read('pages/PMicrophone.tsx'), /within about 60° of straight up from the plate/);
    for (const { f, s } of ALL) assert.doesNotMatch(s, /60° above the surface/, f);
  });
});
