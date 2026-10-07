/**
 * Miking Lab 5, group 4 — BANDS & STAGE PLOTS: the stage-plot presets
 * (bandStage.ts), the derived readouts (stagePlot.ts) and the three lessons
 * built on them (E09 complete band, E15 jazz combo, E08 acoustic small
 * group). Real relationships, never the implementation re-run:
 *
 *   presets   said from the audience; nobody on top of anybody; the kit is
 *             Lab 1's shared kit placed whole (its throne under the drummer,
 *             its kick toward the drummer's facing); the amps are Lab 4's
 *             cabinets standing on the floor with their speaker inside the
 *             box; an electric player's sound leaves from their amp; the
 *             band amps aim away from the vocal mic; the jazz guitar amp is
 *             turned away from the drums; every wedge faces its player
 *   readouts  inverse square (6 dB per doubling), 3 dB per doubling of open
 *             mics, a source straight behind a cardioid in its null, 3:1 as
 *             mic-to-mic over 3 × the larger mic-to-source distance
 *   lessons   every close mic at a distance inside the zone it borrows from
 *             its instrument's own lesson; arrays clear of the players with
 *             their stands on the floor; two Placement zones per seating and
 *             the worked example inside one; the vocal wedge behind the vocal
 *             mic; the small group about equally far from its pair (inside
 *             the published 30 cm–2 m band); learner words clean
 * No Lab 5 total is pinned here (three groups add lessons in parallel).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { seatingOf, seatsOf, soundPoint, headTop, arrayClear, type Seating, type BandSeatingId } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { ampGeom, ampOf, ampSpeaker, BAND_KIT, GEAR_SIZE, guitarPoint, GUITAR_POSE, kitKickFront, kitOrigin, kitPoint, rightOf, soundHole } from '../src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts';
import { byDistanceDb, nomDb, spill, worstThreeToOne } from '../src/screens/lab/miking/lessons/shared/ensemble/stagePlot.ts';
import { arrayCapsules } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { dist, planDir, sub, unit, v3 } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';
import { KIT } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { lessonMeta } from '../src/screens/lab/miking/data/registry.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import { E09_BORROWED, E09_NUMBERS } from '../src/screens/lab/miking/lessons/e09CompleteBand/geometry.ts';
import { E15_BORROWED, E15_NUMBERS } from '../src/screens/lab/miking/lessons/e15JazzCombo/geometry.ts';
import { E08_BORROWED, E08_NUMBERS, PAIR_C, SM4_BAND } from '../src/screens/lab/miking/lessons/e08AcousticGroup/geometry.ts';
import { BANNED_FORMS, BRAND_NAMES } from './mikingLearnerText.test.ts';

const IDS: BandSeatingId[] = ['band.stage', 'band.room', 'jazz.quartet', 'jazz.guitar', 'acoustic.duo', 'acoustic.trio'];
const angle = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z))))) * 180) / Math.PI;

describe('the stage-plot presets (frame S, said from the audience)', () => {
  it('build, say left and right from the audience, and seat nobody on top of anybody', () => {
    for (const id of IDS) {
      const s = seatingOf(id);
      assert.equal(s.id, id);
      assert.equal(s.viewer, 'audience', id);
      assert.ok(s.seats.length >= 2, id);
      for (let i = 0; i < s.seats.length; i++)
        for (let j = i + 1; j < s.seats.length; j++) assert.ok(Math.hypot(s.seats[i].p.x - s.seats[j].p.x, s.seats[i].p.z - s.seats[j].p.z) >= 900, `${id}: ${s.seats[i].id} / ${s.seats[j].id}`);
      for (const sec of s.sections) assert.ok(sec.seats.length >= 1 && sec.radiates.length > 20, `${id} ${sec.id}`);
    }
  });
  it('the kit is Lab 1’s shared kit, placed whole: the throne under the drummer, the kick toward the drummer’s facing', () => {
    for (const id of ['band.stage', 'band.room', 'jazz.quartet'] as const) {
      const d = seatsOf(seatingOf(id), 'drums')[0];
      const throne = kitPoint(d, { x: KIT.throne.c.u, y: KIT.floorY, z: KIT.throne.c.v });
      assert.ok(dist(throne, d.p) < 1, `${id}: the throne at the drummer`);
      const kick = kitKickFront(d).c;
      const fwd = planDir(d.face);
      assert.ok((kick.x - d.p.x) * fwd.x + (kick.z - d.p.z) * fwd.z > 1100, `${id}: the kick ahead of the drummer`);
      assert.ok(-kick.y > 200 && -kick.y < 400, `${id}: the kick’s centre at its own height above the floor`);
      // The drummer's right is the kit's +z (the floor tom side).
      const ft = kitPoint(d, KIT.drums.floor.c);
      const r = rightOf(d.face);
      assert.ok((ft.x - d.p.x) * r.x + (ft.z - d.p.z) * r.z > 0, `${id}: the floor tom on the drummer’s right`);
    }
    assert.equal(kitOrigin(seatsOf(seatingOf('band.stage'), 'drums')[0]).x, kitOrigin(seatsOf(seatingOf('band.room'), 'drums')[0]).x, 'the same kit in both band seatings');
    assert.deepEqual(seatsOf(seatingOf('band.stage'), 'drums')[0].p, BAND_KIT.p);
  });
  it('the amps are Lab 4’s cabinets on the floor; an electric player’s sound leaves from the amp’s speaker', () => {
    const combo = ampGeom('combo');
    const bass = ampGeom('bassRig');
    assert.ok(Math.abs(combo.w - 24.5 * 25.4) < 0.5 && Math.abs(bass.h - 24 * 25.4) < 0.5, 'the cabinets’ published sizes');
    assert.ok(combo.speaker.up > 50 && combo.speaker.up < combo.h, 'the combo’s speaker inside its box');
    for (const id of IDS) {
      const s = seatingOf(id);
      for (const g of s.gear ?? []) {
        assert.ok(g.p.y <= 0, `${id} ${g.id}: on the floor or a riser`);
        assert.ok(GEAR_SIZE[g.kind].h > 0, g.id);
      }
      for (const q of s.seats.filter((x) => x.kind === 'eguitar' || x.kind === 'ebass')) {
        const amp = ampOf(s, q.section)!;
        assert.ok(amp, `${id} ${q.id}: an amp`);
        assert.ok(dist(soundPoint(q), ampSpeaker(amp)) < 400, `${id} ${q.id}: the sound at the amp`);
        assert.ok(dist(soundPoint(q), q.p) > 800, `${id} ${q.id}: not at the player`);
      }
    }
  });
  it('the band’s amps aim away from the vocal mic; the jazz guitar amp is turned away from the drums', () => {
    for (const id of ['band.stage', 'band.room'] as const) {
      const s = seatingOf(id);
      const lip = soundPoint(seatsOf(s, 'vox')[0]);
      for (const g of (s.gear ?? []).filter((x) => x.kind === 'combo' || x.kind === 'bassRig')) {
        const off = angle(planDir(g.face), sub(lip, ampSpeaker(g)));
        assert.ok(off > 30, `${id} ${g.id}: the vocal ${off.toFixed(0)}° off its axis`);
      }
    }
    const s = seatingOf('jazz.guitar');
    const amp = ampOf(s, 'jgtr')!;
    const kit = soundPoint(seatsOf(s, 'drums')[0]);
    assert.ok(angle(planDir(amp.face), sub(kit, ampSpeaker(amp))) > 120, 'the speaker points away from the kit');
  });
  it('every wedge faces its player', () => {
    for (const id of IDS) {
      const s = seatingOf(id);
      for (const g of (s.gear ?? []).filter((x) => x.kind === 'wedge' && x.section)) {
        const q = seatsOf(s, g.section!)[0];
        assert.ok(angle(planDir(g.face), sub(q.p, g.p)) < 30, `${id} ${g.id}`);
      }
    }
  });
  it('a held guitar’s 12th fret and sound hole lie on the instrument as drawn', () => {
    const ag = seatsOf(seatingOf('acoustic.duo'), 'ag')[0];
    const hole = soundHole(ag, 'aguitar');
    assert.deepEqual(soundPoint(ag), hole);
    const fret = guitarPoint(ag, 'aguitar', GUITAR_POSE.aguitar.L + 60);
    assert.ok(-fret.y > -hole.y, 'the neck rises toward the 12th fret');
    assert.ok(dist(fret, hole) > 200 && dist(fret, hole) < 400);
  });
});

describe('the stage-plot readouts (derived, never invented)', () => {
  it('inverse square: twice the distance is about 6 dB down', () => {
    assert.ok(Math.abs(byDistanceDb(1000, 2000) - 6.02) < 0.01);
    assert.ok(Math.abs(byDistanceDb(500, 500)) < 1e-9);
  });
  it('open mics: each doubling costs about 3 dB of gain before feedback', () => {
    assert.equal(nomDb(1), 0);
    assert.ok(Math.abs(nomDb(2) - 3.01) < 0.01 && Math.abs(nomDb(8) - 9.03) < 0.01);
  });
  it('a source straight behind a cardioid sits in its null; one in front gets no pattern help', () => {
    const mic = { p: v3(0, -1500, 0), dir: v3(0, 0, -1), pattern: 'cardioid' as const };
    assert.equal(spill(mic, v3(0, -1500, -60), v3(0, -1500, 2000)).patternDb, null);
    const front = spill(mic, v3(0, -1500, -60), v3(0, -1500, -3000));
    assert.ok(front.patternDb !== null && Math.abs(front.patternDb) < 0.01);
    assert.ok(front.distanceDb > 30, 'a close mic: the far source far down by distance');
  });
  it('3:1: mic-to-mic at least 3 × the larger mic-to-source distance', () => {
    const ok = worstThreeToOne([
      { key: 'a', p: v3(0, 0, 0), own: v3(0, 0, -300) },
      { key: 'b', p: v3(1000, 0, 0), own: v3(1000, 0, -300) },
    ])!;
    assert.ok(ok.ok && Math.abs(ok.need - 900) < 1);
    const no = worstThreeToOne([
      { key: 'a', p: v3(0, 0, 0), own: v3(0, 0, -300) },
      { key: 'b', p: v3(500, 0, 0), own: v3(500, 0, -300) },
    ])!;
    assert.ok(!no.ok);
  });
});

const LESSONS = ['E09', 'E15', 'E08'].map((id) => lessonById(id) as EnsembleLesson);
/** Every close mic in a lesson's setups, by its key (one mic object may serve several setups). */
const singlesOf = (L: EnsembleLesson) => {
  const out = new Map<string, NonNullable<EnsembleLesson['ensemble']['setups'][number]['singles']>[number]>();
  for (const s of L.ensemble.setups) for (const m of s.singles ?? []) out.set(m.key, m);
  return out;
};
const inBand = (d: number, z: { distance: { min: number; max: number } }, label: string) => assert.ok(d >= z.distance.min - 0.5 && d <= z.distance.max + 0.5, `${label}: ${d.toFixed(0)} mm outside ${z.distance.min}–${z.distance.max}`);

describe('the bands-and-stage-plots lessons', () => {
  it('are registered in Lab 5 as stage plots, every variant on a stage-plot seating', () => {
    for (const L of LESSONS) {
      assert.ok(L && L.ensemble, L?.id);
      assert.equal(lessonMeta(L.id)?.labId, 'ensembles');
      assert.equal(L.ensemble.plot, true, L.id);
      for (const v of L.model.variants) assert.equal(seatingOf(L.ensemble.seatings[v.id]).viewer, 'audience', `${L.id}/${v.id}`);
    }
  });
  it('every close mic sits inside the zone it borrows from its instrument’s own lesson', () => {
    const m09 = singlesOf(LESSONS[0]);
    const d = (key: string, map: ReturnType<typeof singlesOf>) => {
      const m = map.get(key)!;
      assert.ok(m && m.own, key);
      return dist(m.p, m.own!);
    };
    assert.ok(Math.abs(d('kick', m09) - E09_NUMBERS.kickD) < 1);
    inBand(d('kick', m09), { distance: { min: 0, max: E09_BORROWED.kick.distance.max } }, 'E09 kick');
    inBand(d('snare', m09), E09_BORROWED.snare, 'E09 snare');
    inBand(d('gtrAmp', m09), E09_BORROWED.amp, 'E09 guitar amp');
    inBand(d('bassAmp', m09), E09_BORROWED.bass, 'E09 bass amp');
    inBand(d('vox', m09), { distance: { min: 25, max: 100 } }, 'E09 vocal (within 10 cm)');
    const m15 = singlesOf(LESSONS[1]);
    inBand(d('ub', m15), E15_BORROWED.bass, 'E15 bass');
    inBand(d('kick', m15), E15_BORROWED.kick, 'E15 kick');
    inBand(d('sax', m15), E15_BORROWED.sax, 'E15 sax');
    inBand(d('tpt', m15), { distance: { min: 300, max: 500 } }, 'E15 trumpet (A01 tp.off)');
    inBand(d('pno', m15), E15_BORROWED.piano, 'E15 piano');
    inBand(d('amp', m15), E15_BORROWED.amp, 'E15 amp');
    assert.equal(Math.round(d('tpt', m15)), E15_NUMBERS.trumpetD);
    const m08 = singlesOf(LESSONS[2]);
    inBand(d('ag', m08), E08_BORROWED.guitar, 'E08 guitar');
    inBand(d('mdn', m08), E08_BORROWED.mandolin, 'E08 mandolin');
    inBand(d('fid', m08), E08_BORROWED.fiddle, 'E08 fiddle');
    inBand(d('ub', m08), E08_BORROWED.bass, 'E08 bass');
    assert.equal(Math.round(d('mdn', m08)), E08_NUMBERS.mandolinD);
  });
  it('every close mic is aimed at its own source and drawn as its own type', () => {
    for (const L of LESSONS)
      for (const s of L.ensemble.setups)
        for (const m of s.singles ?? []) {
          assert.ok(m.typeId && m.src && m.own, `${L.id} ${s.id} ${m.key}`);
          // At the point it is measured from, or at its instrument's sound (a
          // snare mic measured over the rim, aimed at the head).
          const seat = seatingOf(L.ensemble.seatings[s.variants?.[0] ?? L.model.defaultVariant]);
          const src = soundPoint(seatsOf(seat, m.src!)[0]);
          assert.ok(Math.min(angle(m.aim, sub(m.own!, m.p)), angle(m.aim, sub(src, m.p))) < 45, `${L.id} ${m.key}: aimed at its source`);
        }
  });
  it('every array is clear of the players with its stand on the floor; nothing floats', () => {
    for (const L of LESSONS) {
      for (const s of L.ensemble.setups) {
        assert.ok(s.rig || s.singles?.length, `${L.id} ${s.id}: something to draw`);
        if (!s.rig) continue;
        for (const v of s.variants ?? L.model.variants.map((x) => x.id)) {
          const seat = seatingOf(L.ensemble.seatings[v]);
          const caps = arrayCapsules(s.rig.id, s.rig.params, s.rig.place);
          for (const c of caps) assert.ok(c.p.y < -150, `${L.id} ${s.id}: a capsule above the floor`);
          const m = s.rig.mount ?? { kind: 'stand' as const };
          const f = planDir(s.rig.place.face ?? 0);
          const c0 = s.rig.place.c;
          const foot = m.kind === 'boom' ? v3(c0.x - f.x * m.reach, 0, c0.z - f.z * m.reach) : v3(c0.x, 0, c0.z);
          assert.equal(arrayClear(seat, caps, foot), null, `${L.id} ${s.id}/${v}`);
        }
      }
    }
  });
  it('no close mic is inside a player’s body', () => {
    for (const L of LESSONS)
      for (const s of L.ensemble.setups)
        for (const v of s.variants ?? L.model.variants.map((x) => x.id)) {
          const seat: Seating = seatingOf(L.ensemble.seatings[v]);
          for (const m of s.singles ?? [])
            for (const q of seat.seats) {
              const shoulder = q.posture === 'standing' ? 1430 : 1050;
              if (-m.p.y > shoulder || q.kind === 'drumkit') continue;
              assert.ok(Math.hypot(m.p.x - q.p.x, m.p.z - q.p.z) >= 250, `${L.id} ${s.id}/${v}: ${m.key} in ${q.id}`);
            }
        }
  });
  it('each seating has two Placement starting points, and the worked example starts inside one', () => {
    for (const L of LESSONS) {
      for (const v of L.model.variants) {
        const zones = L.ensemble.placeZones.filter((z) => !z.variants || z.variants.includes(v.id));
        assert.ok(zones.length >= 2, `${L.id}/${v.id}`);
        const w = L.ensemble.setups.find((s) => s.id === L.ensemble.worked[v.id]);
        assert.ok(w?.rig, `${L.id}/${v.id}: a worked rig`);
        const c = w!.rig!.place.c;
        assert.ok(zones.some((z) => c.x >= z.box.min.x && c.x <= z.box.max.x && c.y >= z.box.min.y && c.y <= z.box.max.y && c.z >= z.box.min.z && c.z <= z.box.max.z), `${L.id}/${v.id}: the worked example in a zone`);
      }
    }
  });
  it('STARTING SETUPS: at least four to look at per seating', () => {
    for (const L of LESSONS)
      for (const v of L.model.variants) {
        const core = L.ensemble.setups.filter((s) => s.core && (!s.variants || s.variants.includes(v.id)));
        assert.ok(core.length >= 4, `${L.id}/${v.id}: ${core.length}`);
      }
  });
  it('the vocal wedge sits behind the vocal mic, off its front', () => {
    const L = LESSONS[0];
    const voc = L.zones.find((z) => z.id === 'bd.voc')!;
    const w = L.live.wedges[0];
    const toWedge = sub(v3(w.p.x, w.p.y - w.lift, w.p.z), voc.start.p);
    const lip = soundPoint(seatsOf(seatingOf('band.stage'), 'vox')[0]);
    assert.ok(angle(sub(lip, voc.start.p), toWedge) > 110, 'more than 110° off the mic’s front');
  });
  it('the small group sits about equally far from its pair, inside the published 30 cm–2 m', () => {
    for (const id of ['acoustic.duo', 'acoustic.trio'] as const) {
      const pts = seatingOf(id).seats.map(soundPoint);
      const d = pts.map((p) => dist(p, PAIR_C));
      const spread = Math.max(...d) - Math.min(...d);
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      assert.ok(spread / mean < 0.2, `${id}: spread ${spread.toFixed(0)} of ${mean.toFixed(0)}`);
      for (const x of d) assert.ok(x >= SM4_BAND.min && x <= SM4_BAND.max, `${id}: ${x.toFixed(0)}`);
    }
  });
  it('learner words in the presets are clean (no sources, brands or badges)', () => {
    const RE = new RegExp(`\\b(?:${BRAND_NAMES.join('|')})\\b`);
    const words: string[] = [];
    for (const id of IDS) {
      const s = seatingOf(id);
      words.push(s.label, s.blurb);
      for (const sec of s.sections) words.push(sec.label, sec.short, sec.radiates);
      for (const g of s.gear ?? []) words.push(g.label, g.short);
    }
    const bad = words.filter((w) => RE.test(w) || BANNED_FORMS.some((f) => f.test(w)));
    assert.deepEqual(bad, []);
  });
  it('players’ heads and the PA stand in real proportion (nothing floats above the floor)', () => {
    for (const id of IDS) {
      const s = seatingOf(id);
      for (const q of s.seats) assert.ok(headTop(q) > 1000 && headTop(q) < 2000, `${id} ${q.id}`);
    }
    assert.ok(unit(v3(1, 0, 0)).x === 1);
  });
});
