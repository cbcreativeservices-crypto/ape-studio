/**
 * Lab 5 (Ensembles and Voice), group 2 — VOICE II, GROUPS: the singers on the
 * seating builder (lessons/shared/ensemble/seatingVoices.ts, voiceGroup.ts,
 * frame S joined to frame V) and the four lessons — E02 BACKGROUND VOCALS,
 * E04 DUETS AND SMALL GROUPS, E05 CHOIRS, E06 CHILDREN'S CHOIRS — checked as
 * RELATIONSHIPS, never the implementation re-run:
 *
 *   • singers: the lips 1550 mm over their surface and ahead of the body;
 *     nobody standing on anybody; every singer facing the mic or the
 *     conductor; a shared mic's mouths all the same distance away;
 *   • risers: the maker's 8 in rise and 18 in tread, the 42 in back rail;
 *   • 3:1 is mic to mic (E02 L30 rewritten): the row's handhelds and the
 *     choir's two area mics pass; three area mics 6 ft apart (D-CH1) and the
 *     quartet's mics at 30 cm do not — and the lessons say so;
 *   • the no-provocation rule (E04 Ex. 4 rewritten);
 *   • E06 is drawn from above only, children never in elevation; its
 *     safeguarding and exposure words carry the numbers, not the names;
 *   • every setup safe and grounded: rigs and singles clear of every singer,
 *     every stand's foot on the floor; a worked rig inside a placement zone;
 *   • vocal starting points measured from the lips and aimed at the mouth;
 *   • the lessons validate, serve the eight pages, follow the item rules,
 *     carry no research name; Lab 5 lists them (no total hard-coded).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { lessonsOf, lessonMeta } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { aimOff, inZone, surfaceDistance } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { add, dist, planDir, sub, unit, v3 } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';
import { arrayClear, headTop, isVoice, seatingOf, type Seat } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { CHOIR, lipOf, SHARED_AT, SHARED_R, VOICE_SEATING_IDS, VOX, voiceTouches } from '../src/screens/lab/miking/lessons/shared/ensemble/seatingVoices.ts';
import { threeToOneMics } from '../src/screens/lab/miking/lessons/shared/ensemble/voiceGroup.ts';
import { ARRAYS, arrayCapsules, includedAngle } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import { E02_31, sharedDistances } from '../src/screens/lab/miking/lessons/e02BackgroundVocals/geometry.ts';
import { E04_30_31, E04_HANDS_31, E04_IND_31, SIX_IN_DB } from '../src/screens/lab/miking/lessons/e04Duets/geometry.ts';
import { EX4 } from '../src/screens/lab/miking/lessons/e04Duets/lesson.ts';
import { E05_31 } from '../src/screens/lab/miking/lessons/e05Choir/geometry.ts';
import { E06_31 } from '../src/screens/lab/miking/lessons/e06ChildrensChoir/geometry.ts';
import { EXPOSURE, SAFEGUARDING } from '../src/screens/lab/miking/lessons/e06ChildrensChoir/lesson.ts';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

const IDS = ['E02', 'E04', 'E05', 'E06'] as const;
const LESSONS = IDS.map((id) => lessonById(id) as EnsembleLesson);
const GROUP_NAMES = /\b(SM ?58|SM ?4|Neumann|Shure|DPA|AKG|Wenger|NSPCC|WHO|World Health Organization|NIOSH|OSHA|CDC|NIDCD|Sound On Sound|KSM ?\d+|C ?414)\b/;
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;

describe('singers on the seating builder (seatingVoices.ts)', () => {
  it('every voice preset builds; its singers are voices and stand', () => {
    for (const id of VOICE_SEATING_IDS) {
      const s = seatingOf(id);
      assert.ok(s.seats.length >= 2, id);
      for (const q of s.seats) {
        assert.ok(isVoice(q.kind), `${id}: ${q.id}`);
        assert.equal(q.posture, 'standing');
      }
    }
  });
  it('the lips: 1550 mm above the surface an adult stands on (frame V), ahead of the body; a child lower', () => {
    for (const id of VOICE_SEATING_IDS) {
      for (const q of seatingOf(id).seats) {
        const lip = lipOf(q);
        const b = q.kind === 'child' ? VOX.child : VOX.adult;
        assert.ok(near(-(lip.y - q.p.y), b.lip), `${id} ${q.id}: lip height`);
        const ahead = (lip.x - q.p.x) * planDir(q.face).x + (lip.z - q.p.z) * planDir(q.face).z;
        assert.ok(near(ahead, b.lipAhead), `${id} ${q.id}: lips ahead of the body`);
        assert.ok(headTop(q) > -lip.y, 'the head above the lips');
      }
    }
    assert.ok(VOX.child.lip < VOX.adult.lip && VOX.child.head < VOX.adult.head);
  });
  it('nobody stands on anybody: adults at least 0.45 m apart in plan, children 0.4 m', () => {
    for (const id of VOICE_SEATING_IDS) {
      const s = seatingOf(id);
      for (let i = 0; i < s.seats.length; i++)
        for (let j = i + 1; j < s.seats.length; j++) {
          const a = s.seats[i];
          const b = s.seats[j];
          const min = a.kind === 'child' && b.kind === 'child' ? 400 : 450;
          assert.ok(Math.hypot(a.p.x - b.p.x, a.p.z - b.p.z) >= min, `${id}: ${a.id} / ${b.id}`);
        }
    }
  });
  it('a shared mic: every mouth at the same distance (the arc 40 cm, the circle 50 cm), every singer facing it', () => {
    for (const d of sharedDistances()) assert.ok(near(d, SHARED_R.arc, 1));
    for (const [id, R] of [['duo.shared', SHARED_R.arc], ['vocal.circle', SHARED_R.circle], ['duo.fig8', SHARED_R.fig8]] as const) {
      const M = SHARED_AT[id];
      for (const q of seatingOf(id).seats) {
        assert.ok(near(dist(lipOf(q), M), R, 1), `${id} ${q.id}`);
        const to = unit(sub(v3(M.x, 0, M.z), v3(q.p.x, 0, q.p.z)));
        assert.ok(to.x * planDir(q.face).x + to.z * planDir(q.face).z > 0.999, `${id} ${q.id} faces the mic`);
      }
    }
  });
  it('choirs face their conductor; the figure-8 duet faces each other', () => {
    for (const id of ['choir.risers', 'choir.arc', 'choir.children'] as const) {
      const s = seatingOf(id);
      for (const q of s.seats) assert.ok(planDir(q.face).z > 0.75, `${id} ${q.id} faces the conductor`);
      assert.ok(s.conductor && s.podium && s.conductor.p.z > 1500, `${id}: a conductor in front`);
    }
    const [a, b] = seatingOf('duo.fig8').seats;
    assert.ok(planDir(a.face).x > 0.99 && planDir(b.face).x < -0.99);
  });
  it('the risers: an 8 in rise and an 18 in tread per step, a 42 in back rail on the top step', () => {
    const s = seatingOf('choir.risers');
    const hs = [...new Set(s.risers.map((r) => r.h))].sort((x, y) => x - y);
    assert.deepEqual(hs.map((h) => Math.round(h * 10) / 10), [203.2, 406.4, 609.6]);
    const fronts = s.risers.map((r) => r.z1).sort((x, y) => y - x);
    for (let i = 1; i < fronts.length; i++) assert.ok(near(fronts[i - 1] - fronts[i], VOX.riser.tread));
    assert.ok(near(s.risers.find((r) => r.h > 600)!.rail!, 1066.8));
    // Each riser row stands on its step; the first row on the floor, in front.
    const rows = [...new Set(s.seats.map((q) => Math.round(-q.p.y)))].sort((x, y) => x - y);
    assert.deepEqual(rows, [0, 203, 406, 610]);
    assert.equal(s.seats.length, CHOIR.rows.reduce((a, n) => a + n, 0));
  });
  it('children only in the children’s presets; one stepped forward in the solo preset', () => {
    for (const id of VOICE_SEATING_IDS) {
      const kids = seatingOf(id).seats.filter((q) => q.kind === 'child').length;
      assert.equal(kids > 0, id.startsWith('choir.children'), id);
    }
    const solo = seatingOf('choir.childrenSolo').seats.find((q) => q.section === 'solo')!;
    assert.ok(solo.p.z > 500, 'the soloist stands in front of the choir');
  });
  it('a vocal mic may come within a few cm of the lips, but never into the head or body', () => {
    const q = seatingOf('vocal.line').seats[1];
    const lip = lipOf(q);
    const f = planDir(q.face);
    assert.equal(voiceTouches(q, v3(lip.x + f.x * 40, lip.y, lip.z + f.z * 40)), false, '4 cm in front of the lips');
    assert.equal(voiceTouches(q, v3(lip.x - f.x * 80, lip.y - 50, lip.z - f.z * 80)), true, 'inside the head');
    assert.equal(voiceTouches(q, v3(q.p.x, -1000, q.p.z)), true, 'in the chest');
  });
});

describe('the array tool’s group-2 presets', () => {
  it('one shared mic: a single capsule into both sides (a mono channel), its pattern its own', () => {
    for (const [id, pat] of [['one', 'cardioid'], ['oneOmni', 'omni'], ['oneFig8', 'figure8']] as const) {
      const caps = arrayCapsules(id, {}, { c: v3(0, -1550, 0), face: 0, tilt: 0 });
      assert.equal(caps.length, 1);
      assert.equal(caps[0].pattern, pat);
      assert.equal(caps[0].route, 'LR');
      assert.equal(ARRAYS[id].recordingAngle, null);
    }
  });
  it('two cardioids back to back: 180° apart, the bodies’ backs together, level whatever the tilt', () => {
    const caps = arrayCapsules('b2b', {}, { c: v3(0, -1550, 0), face: 0, tilt: 30 });
    assert.ok(near(includedAngle(caps), 180, 0.01));
    assert.ok(caps.every((q) => Math.abs(q.dir.y) < 1e-9), 'level');
    assert.ok(near(dist(caps[0].p, caps[1].p), 170), 'each front 85 mm out from the shared back');
    for (const q of caps) assert.ok((q.p.z - 0) * q.dir.z > 0, 'each front faces away from the other');
  });
});

describe('3:1 — one definition: mic to mic, against the larger mic-to-singer distance', () => {
  it('the helper measures between the MICS (E02 L30 rewritten)', () => {
    const a: Seat = { id: 'a', kind: 'singer', section: 'a', p: v3(0, 0, 0), face: 180, posture: 'standing', stand: null };
    const b: Seat = { ...a, id: 'b', p: v3(1000, 0, 0) };
    const mA = add(lipOf(a), v3(0, 0, 300));
    const mB = add(lipOf(b), v3(0, 0, 300));
    const r = threeToOneMics(mA, a, mB, b);
    assert.ok(near(r.rA, 300) && near(r.d, 1000) && near(r.ratio, 1000 / 300, 1e-6) && r.ok);
    assert.ok(!threeToOneMics(mA, a, add(mA, v3(800, 0, 0)), { ...b, p: v3(800, 0, 0) }).ok, '0.8 m apart at 0.3 m fails');
  });
  it('E02: the row’s handhelds pass by a wide margin; the lesson’s 3:1 item is mic to mic', () => {
    assert.ok(E02_31.ok && E02_31.ratio > 10);
    const s = lessonById('E02')!.scenarios.find((q) => q.id === 'bv.31')!;
    assert.match(s.correct, /from each other$/);
    assert.ok(s.options.some((o) => /from each other singer/.test(o)) && s.correct !== s.options.find((o) => /singer/.test(o)), 'the old wording is the distractor');
  });
  it('E05: two area mics 9 ft apart pass; three at the 6 ft church spacing do not (D-CH1, said in the setup)', () => {
    assert.ok(E05_31.two.ok, `two: ${E05_31.two.ratio.toFixed(2)}`);
    assert.ok(!E05_31.three.ok, `three: ${E05_31.three.ratio.toFixed(2)}`);
    const L = lessonById('E05') as EnsembleLesson;
    assert.match(L.ensemble.setups.find((q) => q.id === 'area3')!.start, /under 3:1/);
  });
  it('E04: the quartet’s cardioids pass at 22 cm and miss at 30 cm; the duet’s handhelds pass', () => {
    assert.ok(E04_IND_31.ok && !E04_30_31.ok && E04_HANDS_31.ok);
    assert.ok(near(SIX_IN_DB, 20 * Math.log10(400 / (400 - 152.4)), 1e-9), 'the 6 in exercise, by distance alone');
  });
  it('E06: the children’s two area mics pass', () => assert.ok(E06_31.ok));
});

describe('the no-provocation rule (E04 Ex. 4 rewritten; every group lesson)', () => {
  it('Ex. 4 brings monitors up only to the agreed level and lowers the send at any ring', () => {
    assert.match(EX4, /only to the agreed performance level/);
    assert.match(EX4, /lower that send at once/);
    assert.match(EX4, /never raise the level to find the feedback point/);
    assert.ok(lessonById('E04')!.practice.task.includes(EX4));
  });
  it('no correct answer or passing setup raises the level to find feedback', () => {
    for (const L of LESSONS) {
      for (const s of [...L.scenarios, ...L.symptoms, ...L.diagnostic]) assert.doesNotMatch(s.correct, /until it rings|until it starts to ring|find the feedback/i, `${L.id} ${s.id}`);
      for (const t of L.setupTasks) for (const s of t.setups) if (s.ok) assert.doesNotMatch(s.label, /ring/i, `${L.id} ${t.id}`);
      assert.ok(L.scenarios.some((s) => s.id.endsWith('.ring')), `${L.id}: the ring card`);
    }
  });
});

describe('E06: children drawn from above only; safeguarding and exposure in words', () => {
  const L = lessonById('E06') as EnsembleLesson;
  it('the lesson’s only view is the plan, and every setup opens in it', () => {
    assert.deepEqual(L.ensemble.views, ['plan']);
    for (const s of L.ensemble.setups) assert.equal(s.view, 'plan', s.id);
  });
  it('the drawing never draws a child in elevation', () => {
    const src = readFileSync(join(process.cwd(), 'src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(src, /function elevSeat\([^)]*\) \{\n(?:\s*\/\/[^\n]*\n)*\s*if \(s\.kind === 'child'\) return;/);
  });
  it('safeguarding: supervision, an authorised adult, the venue’s policy and local law — no named authority', () => {
    assert.match(SAFEGUARDING, /supervised at all times/);
    assert.match(SAFEGUARDING, /authorised adult/);
    assert.match(SAFEGUARDING, /child-safeguarding policy and the local law/);
    assert.match(EXPOSURE, /94 dB averaged over 15 minutes and 120 dB peak/);
    assert.match(EXPOSURE, /at the source first/);
    assert.doesNotMatch(SAFEGUARDING + EXPOSURE, GROUP_NAMES);
  });
  it('two critical quick-check items: the headset fitting and the children’s exposure', () => {
    const crit = L.diagnostic.filter((d) => d.critical).map((d) => d.id);
    assert.ok(crit.includes('cc.q.3') && crit.includes('cc.q.4'));
  });
});

describe('every setup is safe and grounded', () => {
  for (const L of LESSONS) {
    it(`${L.id}: rigs clear of the singers and the conductor; singles clear; every stand on the floor`, () => {
      for (const s of L.ensemble.setups) {
        assert.ok(s.rig || s.singles?.length, `${s.id}: something to draw`);
        for (const v of s.variants ?? L.model.variants.map((x) => x.id)) {
          const seat = seatingOf(L.ensemble.seatings[v]);
          if (s.rig) {
            const caps = arrayCapsules(s.rig.id, s.rig.params, s.rig.place);
            for (const c of caps) assert.ok(c.p.y < 0, `${s.id}: a capsule above the floor`);
            const m = s.rig.mount ?? { kind: 'stand' as const };
            const f = planDir(s.rig.place.face ?? 0);
            const c0 = s.rig.place.c;
            const foot = m.kind === 'boom' ? v3(c0.x - f.x * m.reach, 0, c0.z - f.z * m.reach) : v3(c0.x, 0, c0.z);
            assert.equal(arrayClear(seat, caps, foot), null, `${L.id} ${s.id}/${v}`);
          }
          for (const m of s.singles ?? []) {
            assert.ok(m.p.y < 0, `${s.id}: ${m.key} above the floor`);
            for (const q of seat.seats) assert.equal(voiceTouches(q, m.p), false, `${L.id} ${s.id}/${v}: ${m.key} touches ${q.id}`);
            if (m.dimTo) assert.ok(seat.seats.some((q) => dist(lipOf(q), m.dimTo!) < 1), `${s.id}: the white distance is to a mouth`);
          }
        }
      }
    });
    it(`${L.id}: every seating has setups to look at (a core one), a worked rig inside a placement zone, two zones`, () => {
      for (const v of L.model.variants) {
        const list = L.ensemble.setups.filter((s) => !s.variants || s.variants.includes(v.id));
        assert.ok(list.length >= 2 && list.some((s) => s.core), `${L.id}/${v.id}: ${list.length}`);
        const zones = L.ensemble.placeZones.filter((z) => !z.variants || z.variants.includes(v.id));
        assert.ok(zones.length >= 2, `${L.id}/${v.id}: zones`);
        const w = L.ensemble.setups.find((s) => s.id === L.ensemble.worked[v.id]);
        assert.ok(w?.rig, `${L.id}/${v.id}: a worked rig`);
        const c = w!.rig!.place.c;
        assert.ok(zones.some((z) => c.x >= z.box.min.x && c.x <= z.box.max.x && c.y >= z.box.min.y && c.y <= z.box.max.y && c.z >= z.box.min.z && c.z <= z.box.max.z), `${L.id}/${v.id}: the worked example in a zone`);
      }
    });
  }
});

describe('every recommended starting point: clear, in its zone; a vocal one from the lips, aimed at the mouth', () => {
  for (const L of LESSONS) {
    for (const z of L.zones) {
      const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? L.model.variants.map((v) => v.id);
      for (const v of variants) {
        it(`${L.id} ${z.id} (${v})`, () => {
          const t = MIC_TYPES[(z.requires?.micTypeIds ?? L.micTypeIds)[0]];
          const scene = compileScene(L.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null);
          assert.ok(inZone(z, { scene, surfaces: L.model.surfaces, lines: L.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start));
          const s = L.model.surfaces.find((q) => q.id === z.refSurface)!;
          if (s.target && /^mouth/.test(s.id)) {
            const d = surfaceDistance(L.model.surfaces, s.id, z.start);
            assert.ok(d >= z.distance.min - 0.5 && d <= z.distance.max + 0.5, `${d} mm from the lips`);
            assert.ok(aimOff(s, z.start) <= (z.aim?.maxOffAxis ?? 90) + 1e-6);
          }
        });
      }
    }
  }
  it('E02: the backing handheld starts inside 1.5–3 in (38–76 mm) of the lips', () => {
    const z = lessonById('E02')!.zones.find((q) => q.id === 'bv.hand')!;
    assert.ok(z.distance.min === 38.1 && z.distance.max === 76.2);
  });
  it('E05: the area mic is 2–4 ft in front and 1–3 ft above the first row’s heads', () => {
    const z = lessonById('E05')!.zones.find((q) => q.id === 'ch.live')!;
    const p = z.start.p;
    assert.ok(p.z >= 609.6 && p.z <= 1219.2);
    assert.ok(-p.y - VOX.adult.head >= 304.8 && -p.y - VOX.adult.head <= 914.4);
  });
});

describe('the four lessons: registered, valid, served, clean', () => {
  it('Lab 5 lists them, ready (no total is hard-coded)', () => {
    const ids = lessonsOf('ensembles').map((l) => l.id);
    for (const id of IDS) {
      assert.ok(ids.includes(id), `${id} listed`);
      assert.equal(lessonMeta(id)?.status, 'ready');
    }
  });
  for (const L of LESSONS) {
    it(`${L.id}: validateLesson is clean; the eight journey pages are served`, () => {
      assert.deepEqual(validateLesson(L, MIC_TYPES), []);
      for (const p of PAGE_IDS) {
        const c = pageOf(L, p);
        assert.ok(c?.title && c.goal && c.credit, `${L.id}: ${p}`);
      }
    });
    it(`${L.id}: the item-writing rules`, () => itemRules(L));
    it(`${L.id}: no research name, brand or authority in learner text`, () => {
      const bad = learnerStrings(L).filter((s) => RESEARCH_NAMES.test(s) || GROUP_NAMES.test(s));
      assert.deepEqual(bad, []);
    });
  }
});
