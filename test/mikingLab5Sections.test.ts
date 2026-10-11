/**
 * Miking Lab 5, group 5 — SECTIONS: the horn section (E10), the big band
 * (E16), the percussion ensemble (E12), their seating presets on the shared
 * builder (frame S), the close and shared mics on the players, and the shared
 * Lab 5 worksheet. Real relationships, never the implementation re-run:
 *
 *   seating   the big band's orders as the conductor faces it (saxes tenor 1,
 *             alto 2, alto 1, tenor 2, baritone; trombones and trumpets
 *             2–1–3–4; the rhythm section on the left; trumpets standing on
 *             the riser behind the seated trombones); the horseshoe (drums at
 *             the base, trumpets across from them, saxes and trombones facing
 *             each other); the horn arc at one distance from its centre;
 *             nobody on anybody, no instrument through a player
 *   mics      every close mic at its instrument's distance from its target,
 *             aimed at it; every mic above the floor and clear of the
 *             players; every stand's foot on the floor or a riser, clear of
 *             the players; the 3-to-1 ratio said honestly
 *   lessons   registered in Lab 5, ≥ 4 core setups per seating with a main
 *             array alone, two Placement zones per seating with the worked
 *             example in one, the unsourced 140 dB replaced
 *   worksheet field ids short and unique, the A/B rows paired, the seating
 *             sketch read from the builder front to back
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { arrayCapsules } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { arrayClear, headTop, KIND, seatingOf, seatsOf, soundPoint, type Seat, type Seating, type SeatingId } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { dist, planDir, sub, unit, v3 } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';
import { ensembleModel } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleModel.ts';
import { bellOf, ratio31 } from '../src/screens/lab/miking/lessons/shared/ensemble/spots.ts';
import { COMPARE_ROWS, lab5Worksheet, seatingSketch } from '../src/screens/lab/miking/lessons/shared/ensemble/worksheet.ts';
import { SHURE_H, SHURE_SPACING } from '../src/screens/lab/miking/lessons/shared/mallets/malletModel.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { lessonMeta } from '../src/screens/lab/miking/data/registry.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import * as E10 from '../src/screens/lab/miking/lessons/e10HornSection/geometry.ts';
import * as E16 from '../src/screens/lab/miking/lessons/e16BigBand/geometry.ts';
import * as E12 from '../src/screens/lab/miking/lessons/e12PercussionEnsemble/geometry.ts';

const G5: readonly SeatingId[] = ['horns.line', 'horns.arc', 'bb.standard', 'bb.horseshoe', 'perc.trio', 'perc.large'];
const byX = (s: Seating, sec: string) => [...seatsOf(s, sec)].sort((a, b) => a.p.x - b.p.x).map((q) => q.id);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('group 5 seatings (frame S, the conductor’s view)', () => {
  it('the big band’s rows in their orders: saxes T1 A2 A1 T2 baritone; trombones and trumpets 2–1–3–4', () => {
    const s = seatingOf('bb.standard');
    assert.deepEqual(byX(s, 'sax'), ['sax.t1', 'sax.a2', 'sax.a1', 'sax.t2', 'sax.bari']);
    assert.deepEqual(byX(s, 'tbn'), ['tbn.2', 'tbn.1', 'tbn.3', 'tbn.4']);
    assert.deepEqual(byX(s, 'tpt'), ['tpt.2', 'tpt.1', 'tpt.3', 'tpt.4']);
    assert.equal(seatsOf(s, 'sax').find((q) => q.id === 'sax.bari')!.kind, 'bariSax');
  });
  it('saxes in front, trombones behind on a riser, trumpets standing higher still; the rhythm section on the conductor’s left', () => {
    const s = seatingOf('bb.standard');
    const z = (sec: string) => mean(seatsOf(s, sec).map((q) => q.p.z));
    assert.ok(z('sax') > z('tbn') && z('tbn') > z('tpt'));
    const tbn = seatsOf(s, 'tbn')[0];
    const tpt = seatsOf(s, 'tpt')[0];
    assert.ok(-tpt.p.y > -tbn.p.y && -tbn.p.y > 0, 'risers: trumpets higher than trombones');
    assert.equal(tpt.posture, 'standing');
    assert.equal(tbn.posture, 'seated');
    assert.ok(-soundPoint(tpt).y > headTop(tbn), 'the trumpets’ bells clear the trombones’ heads');
    const winds = Math.min(...s.seats.filter((q) => ['sax', 'tbn', 'tpt'].includes(q.section)).map((q) => q.p.x));
    for (const sec of ['pno', 'gtr', 'cb', 'dr']) for (const q of seatsOf(s, sec)) assert.ok(q.p.x < winds, `${q.id} on the left`);
  });
  it('the horseshoe: drums at the base, trumpets across from them, saxes and trombones facing each other', () => {
    const s = seatingOf('bb.horseshoe');
    const dr = seatsOf(s, 'dr')[0];
    const tpt = seatsOf(s, 'tpt');
    assert.ok(tpt.every((q) => q.p.z > dr.p.z + 3000), 'trumpets across the U from the drums');
    assert.ok(tpt.every((q) => planDir(q.face).z < -0.9), 'the trumpets face the drums');
    assert.ok(planDir(dr.face).z > 0.9, 'the drums face the trumpets');
    const sax = seatsOf(s, 'sax');
    const tbn = seatsOf(s, 'tbn');
    assert.ok(sax.every((q) => q.p.x < 0 && planDir(q.face).x > 0.9));
    assert.ok(tbn.every((q) => q.p.x > 0 && planDir(q.face).x < -0.9));
  });
  it('the studio horn arc: every player the same distance from the section mic’s place (1–6 ft)', () => {
    const s = seatingOf('horns.arc');
    // Measured to where each instrument's sound leaves (the bells; the sax's body), in plan.
    const ds = s.seats.map((q) => Math.hypot(soundPoint(q).x - E10.AR_C.x, soundPoint(q).z - E10.AR_C.z));
    assert.ok(Math.max(...ds) - Math.min(...ds) < 40, ds.join(', '));
    assert.ok(ds[0] >= 304.8 && ds[0] <= 1828.8);
    for (const q of s.seats) assert.ok(planDir(q.face).z > 0.5, `${q.id} faces the centre`);
  });
  it('nobody sits on anybody, and no instrument passes through another player', () => {
    for (const id of G5) {
      const s = seatingOf(id);
      for (let i = 0; i < s.seats.length; i++)
        for (let j = i + 1; j < s.seats.length; j++) assert.ok(Math.hypot(s.seats[i].p.x - s.seats[j].p.x, s.seats[i].p.z - s.seats[j].p.z) >= 600, `${id}: ${s.seats[i].id}/${s.seats[j].id}`);
      const m = ensembleModel({ id: 'x', name: 'x', variants: [{ id: 'v', label: 'v', blurb: '', seating: s }] });
      for (const part of m.parts.filter((p) => p.id.endsWith('.inst'))) {
        const b = part.solid as { min: { x: number; z: number }; max: { x: number; z: number } };
        for (const q of s.seats) {
          if (part.id === `v:${q.id}.inst`) continue;
          const dx = Math.max(b.min.x - q.p.x, 0, q.p.x - b.max.x);
          const dz = Math.max(b.min.z - q.p.z, 0, q.p.z - b.max.z);
          assert.ok(Math.hypot(dx, dz) >= 300, `${id}: ${part.id} through ${q.id}`);
        }
      }
    }
  });
  it('a player standing to play a seated instrument plays it higher', () => {
    const tpt = seatsOf(seatingOf('bb.standard'), 'tpt')[0];
    const h = -soundPoint(tpt).y - -tpt.p.y;
    assert.ok(h > KIND.trumpet.sound + 300, `${h}`);
  });
});

/** Every single mic of a lesson's setups with its seating. */
function singles(L: EnsembleLesson) {
  return L.ensemble.setups.flatMap((st) => (st.variants ?? L.model.variants.map((v) => v.id)).flatMap((v) => (st.singles ?? []).map((m) => ({ st, v, m, seat: seatingOf(L.ensemble.seatings[v]) }))));
}
const LESSONS = ['E10', 'E16', 'E12'].map((id) => lessonById(id) as EnsembleLesson);
const riserTop = (s: Seating, p: { x: number; z: number }) => s.risers.find((r) => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1)?.h ?? 0;

describe('the mics on the sections: real equipment, real places', () => {
  it('every close mic is aimed at what it hears', () => {
    for (const L of LESSONS)
      for (const { st, m } of singles(L)) {
        const a = unit(m.aim);
        assert.ok(Math.abs(Math.hypot(a.x, a.y, a.z) - 1) < 1e-9, `${L.id} ${st.id}/${m.key}`);
      }
  });
  it('every mic is above the floor and clear of the players (body and head)', () => {
    for (const L of LESSONS)
      for (const { st, v, m, seat } of singles(L)) {
        assert.ok(m.p.y < 0, `${L.id} ${st.id}/${m.key}: under the floor`);
        for (const q of seat.seats) {
          const r = Math.hypot(m.p.x - q.p.x, m.p.z - q.p.z);
          const above = -m.p.y > headTop(q) + 60;
          assert.ok(above || r >= 300, `${L.id} ${st.id}/${v}: ${m.key} inside ${q.id} (${r.toFixed(0)} mm)`);
        }
      }
  });
  it('every stand stands on the floor or on a riser, clear of the players — nothing floats', () => {
    for (const L of LESSONS)
      for (const { st, v, m, seat } of singles(L)) {
        if (!m.foot) continue;
        const h = riserTop(seat, m.foot);
        assert.ok(Math.abs(-m.foot.y - h) < 1, `${L.id} ${st.id}/${m.key}: foot at ${-m.foot.y} mm, the surface at ${h}`);
        for (const q of seat.seats) assert.ok(Math.hypot(m.foot.x - q.p.x, m.foot.z - q.p.z) >= 300, `${L.id} ${st.id}/${v}: ${m.key}’s stand in ${q.id}`);
      }
  });
  it('every array is above the floor and clear of the players', () => {
    for (const L of LESSONS)
      for (const st of L.ensemble.setups)
        for (const v of st.variants ?? L.model.variants.map((x) => x.id)) {
          const seat = seatingOf(L.ensemble.seatings[v]);
          for (const r of [...(st.rig ? [st.rig] : []), ...(st.extraRigs ?? [])]) {
            const caps = arrayCapsules(r.id, r.params, r.place);
            assert.ok(caps.every((c) => c.p.y < 0));
            assert.equal(arrayClear(seat, caps, v3(r.place.c.x, 0, r.place.c.z)), null, `${L.id} ${st.id}/${v}`);
          }
        }
  });
  it('the close mics sit at their instruments’ starting distances', () => {
    const near = (a: number, lo: number, hi: number) => a >= lo - 0.5 && a <= hi + 0.5;
    for (const s of [E10.LN_TPT, E10.AR_TPT, ...E16.BB_TPT]) assert.ok(near(dist(s.p, s.target), 300, 500), 'trumpet 30–50 cm');
    for (const s of [E10.LN_AS, E10.AR_TS, ...E16.BB_SAX, ...E16.HS_SAX]) assert.ok(near(dist(s.p, s.target), 300, 600), 'sax 30–60 cm');
    for (const s of [E10.LN_TBN, E10.LN_BTB, E10.AR_TBN, ...E16.BB_TBN, ...E16.HS_TBN, ...E16.HS_TPT]) assert.ok(near(dist(s.p, s.target), 300, 610), 'ribbon or trombone 1–2 ft');
    for (const s of [E10.LN_PAIR1, E10.LN_PAIR2, E16.BB_SAX2[0], E16.BB_SAX2[1], ...E16.BB_TPT2]) assert.ok(near(dist(s.p, s.target), 800, 1200), 'a mic for two 0.8–1.2 m');
    assert.ok(near(dist(E10.AR_TU.p, E10.AR_TU.target), 560, 660), 'tuba 56–66 cm above');
    assert.ok(near(E16.BB_PNO.p.z - (-1000), 900, 1700) && near(dist(E16.BB_AMP.p, E16.BB_AMP.target), 80, 120), 'piano outside its curve; the amp close');
    // The congas: one mic between the heads, just above them, aimed down.
    for (const c of [E12.TR_CG, E12.LG_CG]) {
      assert.ok(near(dist(c.spot.p, c.spot.target), 50, 150));
      assert.ok(c.spot.aim.y > 0.95, 'aimed down');
    }
    // The marimba pair: about 18 in above the bars, 2 ft apart, aimed down.
    for (const m of [E12.TR_MAR2, E12.LG_MAR2]) {
      assert.ok(Math.abs(dist(m.spots[0].p, m.spots[1].p) - SHURE_SPACING) < 30);
      for (const s of m.spots) assert.ok(Math.abs(dist(s.p, s.target) - SHURE_H) < 1 && s.aim.y > 0.95);
    }
  });
  it('a trumpet’s close mic is a little off the bell’s axis; a trombone’s stays out of the slide’s path', () => {
    for (const q of [...seatsOf(seatingOf('horns.line'), 'tpt'), ...seatsOf(seatingOf('bb.standard'), 'tpt')]) {
      const s = q.id === 'tpt.1' && q.p.y === 0 ? E10.LN_TPT : E16.BB_TPT[seatsOf(seatingOf('bb.standard'), 'tpt').indexOf(q)] ?? E10.LN_TPT;
      const off = (Math.acos(-(s.aim.x * planDir(q.face).x + s.aim.z * planDir(q.face).z)) * 180) / Math.PI;
      assert.ok(off > 5 && off < 30, `${q.id}: ${off.toFixed(1)}°`);
    }
    for (const [q, s] of [
      [seatsOf(seatingOf('horns.line'), 'tbn')[0], E10.LN_TBN],
      [seatsOf(seatingOf('bb.standard'), 'tbn')[1], E16.BB_TBN[1]],
    ] as [Seat, typeof E10.LN_TBN][]) {
      // The slide runs straight ahead of the player, at mouth height, to its 7th position (about 0.9 + 0.56 m).
      const f = planDir(q.face);
      const rel = sub(s.p, q.p);
      const along = rel.x * f.x + rel.z * f.z;
      const across = Math.abs(rel.x * f.z - rel.z * f.x);
      const above = -s.p.y - -bellOf(q).y;
      assert.ok(along < 1460 && (across > 150 || above > 150), `${q.id}: clear of the slide`);
    }
  });
  it('the 3-to-1 ratio between the horn line’s close mics is said honestly: about 2:1, not 3:1', () => {
    const r = ratio31(E10.LN_TPT, E10.LN_AS);
    assert.ok(r < 3 && r > 1.5, `${r.toFixed(2)}`);
    const card = lessonById('E10') as EnsembleLesson;
    assert.match(card.ensemble.setups.find((s) => s.id === 'lnClose')!.line, /2:1, not 3:1/);
  });
});

describe('the sections lessons', () => {
  it('are registered in Lab 5 and carry their stage data', () => {
    for (const L of LESSONS) {
      assert.ok(L && L.ensemble, L?.id);
      assert.equal(lessonMeta(L.id)?.labId, 'ensembles');
      for (const v of L.model.variants) assert.ok(L.ensemble.seatings[v.id], `${L.id}/${v.id}`);
    }
  });
  it('STARTING SETUPS: at least four core setups per seating, one a main array alone', () => {
    for (const L of LESSONS)
      for (const v of L.model.variants) {
        const core = L.ensemble.setups.filter((s) => s.core && (!s.variants || s.variants.includes(v.id)));
        assert.ok(core.length >= 4, `${L.id}/${v.id}: ${core.length}`);
        assert.ok(core.some((s) => s.rig && !s.singles), `${L.id}/${v.id}: a main array alone`);
      }
  });
  it('each seating has two Placement starting points; the worked example starts inside one', () => {
    for (const L of LESSONS)
      for (const v of L.model.variants) {
        const zones = L.ensemble.placeZones.filter((z) => !z.variants || z.variants.includes(v.id));
        assert.ok(zones.length >= 2, `${L.id}/${v.id}`);
        const w = L.ensemble.setups.find((s) => s.id === L.ensemble.worked[v.id])!;
        const c = w.rig!.place.c;
        assert.ok(zones.some((z) => c.x >= z.box.min.x && c.x <= z.box.max.x && c.y >= z.box.min.y && c.y <= z.box.max.y && c.z >= z.box.min.z && c.z <= z.box.max.z), `${L.id}/${v.id}`);
      }
  });
  it('the brass peak close to the bell is said as exceeding 140 dB (audit 2026-10-10: sourced; "about 130 dB" understated it)', () => {
    const text = JSON.stringify(lessonById('E10'));
    assert.doesNotMatch(text, /about 130 dB/);
    assert.match(text, /can exceed 140 dB SPL/);
  });
  it('the area mics sit 1–1.5 m from the sources they cover', () => {
    for (const a of [E12.LG_AREA_F, E12.LG_AREA_B]) {
      const d = dist(a.pose.p, a.target);
      assert.ok(d >= 1000 && d <= 1500, `${d}`);
      assert.ok(a.players >= 2, `${a.players}`);
    }
  });
});

describe('the Lab 5 worksheet (the big band’s observation sheet, shared)', () => {
  it('its fields: short unique ids, the two positions on the same rows', () => {
    const f = lab5Worksheet({ seating: seatingOf('bb.standard'), noun: 'band' });
    const ids = f.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => id.length < 32));
    for (const r of COMPARE_ROWS) assert.ok(ids.includes(`a.${r.id}`) && ids.includes(`b.${r.id}`), r.id);
    for (const id of ['goal', 'ref', 'sketch', 'choice', 'pa', 'mon', 'rec', 'notes']) assert.ok(ids.includes(id), id);
  });
  it('the seating sketch is read from the builder: front to back, each row left to right', () => {
    const t = seatingSketch(seatingOf('bb.standard'));
    assert.ok(t.indexOf('saxophones') < t.indexOf('trombones') && t.indexOf('trombones') < t.indexOf('trumpets'), t);
    assert.match(t, /^front: /);
    assert.match(seatingSketch(seatingOf('horns.line')), /trumpet, alto saxophone, trombone, bass trombone/);
  });
  it('every sections lesson carries it', () => {
    for (const L of LESSONS) assert.ok(L.practice.fields.some((f) => f.id === 'a.target') && L.practice.fields.some((f) => f.id === 'sketch'), L.id);
  });
});
