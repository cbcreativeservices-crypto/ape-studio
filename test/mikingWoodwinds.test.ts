/**
 * Lab 3 (Winds) — the shared WOODWIND family (lessons/shared/woodwinds) and
 * its six lessons: A06 FLUTE, A07 PICCOLO, A08a CLARINET, A08b BASS
 * CLARINET, A09a OBOE, A09b BASSOON:
 *
 *   • the family: the sourced lowest notes; the tone holes where the
 *     semitone rule puts them; the registers (an octave on the flutes, the
 *     oboe and the bassoon; a twelfth on the clarinets — the same tube);
 *   • the physics the HOW IT SOUNDS pages draw: pressure nodes at open
 *     ends, odd harmonics in a closed cylinder;
 *   • the one-third rule along each instrument, oriented per instrument:
 *     ABOVE the bell on a clarinet and an oboe, BELOW the bell top on a
 *     bassoon (its bell points up);
 *   • each lesson validates, carries the 9 pages, sits in Lab 3, follows the
 *     item-writing rules; every recommended start is clear of every part and
 *     inside its zone in every variant it is offered — and never in a
 *     flute's or a piccolo's air jet; no clip zone on the piccolo; FULLY
 *     SILENT (no audio import in the family or its lessons).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, MIKING_LABS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { BASSOON, CLARINET, OBOE, PICCOLO, bassClarinetSpec, endWordOf, fluteSpec, holeS, type WindSpec } from '../src/screens/lab/miking/lessons/shared/woodwinds/windSpec.ts';
import { noteState, overblowRatio, pressure, pressureNodes, seriesOf } from '../src/screens/lab/miking/lessons/shared/woodwinds/windPhysics.ts';
import { frameAt, oneThirdS, type Layout } from '../src/screens/lab/miking/lessons/shared/woodwinds/windPosture.ts';
import { A06_LESSON } from '../src/screens/lab/miking/lessons/a06Flute/lesson.ts';
import { A07_LESSON } from '../src/screens/lab/miking/lessons/a07Piccolo/lesson.ts';
import { A08A_LESSON } from '../src/screens/lab/miking/lessons/a08aClarinet/lesson.ts';
import { A08B_LESSON } from '../src/screens/lab/miking/lessons/a08bBassClarinet/lesson.ts';
import { A09A_LESSON } from '../src/screens/lab/miking/lessons/a09aOboe/lesson.ts';
import { A09B_LESSON } from '../src/screens/lab/miking/lessons/a09bBassoon/lesson.ts';
import { LAYOUTS as FLUTES } from '../src/screens/lab/miking/lessons/a06Flute/geometry.ts';
import { SEATED as PICC_SEATED, STANDING as PICC_STANDING } from '../src/screens/lab/miking/lessons/a07Piccolo/geometry.ts';
import { SEATED as CL_SEATED, STANDING as CL_STANDING } from '../src/screens/lab/miking/lessons/a08aClarinet/geometry.ts';
import { LAYOUTS as BCL } from '../src/screens/lab/miking/lessons/a08bBassClarinet/geometry.ts';
import { SEATED as OB_SEATED, STANDING as OB_STANDING } from '../src/screens/lab/miking/lessons/a09aOboe/geometry.ts';
import { SEATED as BSN_SEATED, STANDING as BSN_STANDING } from '../src/screens/lab/miking/lessons/a09bBassoon/geometry.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const WINDS = [A06_LESSON, A07_LESSON, A08A_LESSON, A08B_LESSON, A09A_LESSON, A09B_LESSON];
const SPECS: WindSpec[] = [fluteSpec('metal'), fluteSpec('wooden'), fluteSpec('simple'), PICCOLO, CLARINET, bassClarinetSpec('eflat'), bassClarinetSpec('lowc'), OBOE, BASSOON];
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;

describe('the woodwind family (lessons/shared/woodwinds)', () => {
  it('the lowest notes: flute C4 (simple-system D4), piccolo D5, clarinet D3 sounding, oboe B♭3, bassoon B♭1, bass clarinet D♭2 / B♭1 sounding', () => {
    assert.equal(fluteSpec('metal').lowest.name, 'C4');
    assert.equal(fluteSpec('simple').lowest.name, 'D4');
    assert.equal(PICCOLO.lowest.name, 'D5');
    assert.equal(CLARINET.lowest.name, 'D3');
    assert.equal(OBOE.lowest.name, 'B♭3');
    assert.equal(BASSOON.lowest.name, 'B♭1');
    assert.equal(bassClarinetSpec('eflat').lowest.name, 'D♭2');
    assert.equal(bassClarinetSpec('lowc').lowest.name, 'B♭1');
  });
  it('the piccolo is about half a flute: its sounding length and its lowest note an octave and a tone up', () => {
    assert.ok(PICCOLO.end < fluteSpec('metal').end * 0.55);
    assert.equal(PICCOLO.lowest.midi - fluteSpec('metal').lowest.midi, 14);
  });
  it('the semitone rule: each hole up sits nearer the player, its distance from the effective end shrinking by 2^(1/12)', () => {
    for (const s of SPECS) {
      for (let k = 1; k < s.holes.length; k++) {
        assert.ok(holeS(s, k + 1) < holeS(s, k), `${s.id} hole ${k + 1} nearer the player`);
        assert.ok(near((holeS(s, k) - s.rule.B) / (holeS(s, k + 1) - s.rule.B), 2 ** (1 / 12), 1e-9), `${s.id} hole ${k}`);
      }
      assert.ok(holeS(s, 1) < s.end, `${s.id}: the first hole sits inside the tube`);
    }
  });
  it('the registers: an octave on open pipes and cones, a twelfth on the clarinets — the same tube, the same fingering', () => {
    for (const s of SPECS) {
      const up = s.registers[1];
      const lo = noteState(s, up.from - up.shift);
      const hi = noteState(s, up.from);
      assert.equal(hi.endS, lo.endS, `${s.id}: the same sounding tube`);
      assert.equal(hi.midi - lo.midi, overblowRatio(s.bore) === 3 ? 19 : 12, `${s.id}: ${s.bore}`);
    }
    assert.equal(noteState(CLARINET, 19).harmonic, 3);
    assert.equal(noteState(fluteSpec('metal'), 12).harmonic, 2);
  });
  it('the pressure stays still at every open end; a closed cylinder carries the odd harmonics only', () => {
    assert.deepEqual(pressureNodes('open', 1), [0, 1]);
    assert.deepEqual(pressureNodes('closed', 1), [1]);
    assert.ok(near(pressure('open', 1, 0, 100), 0) && near(pressure('open', 1, 100, 100), 0, 1e-12));
    assert.ok(near(pressure('closed', 1, 0, 100), 1));
    assert.ok(near(pressure('closed', 2, 100, 100), 0, 1e-12));
    assert.deepEqual(seriesOf('closed', 4), [1, 3, 5, 7]);
    assert.deepEqual(seriesOf('open', 4), [1, 2, 3, 4]);
    assert.deepEqual(seriesOf('cone', 3), [1, 2, 3]);
  });
  it('the far end is named for what it is: a flute’s foot, a piccolo’s open end, a reed instrument’s bell', () => {
    assert.equal(endWordOf(fluteSpec('metal')), 'foot');
    assert.equal(endWordOf(fluteSpec('simple')), 'open end');
    assert.equal(endWordOf(PICCOLO), 'open end');
    assert.equal(endWordOf(OBOE), 'bell');
  });
});

describe('the one-third rule, oriented per instrument', () => {
  const y = (L: Layout, s: number) => frameAt(L, s).p.y;
  it('clarinet and oboe: a third of the length up from the bell — ABOVE the bell (smaller y), between the reed and the bell', () => {
    for (const L of [CL_SEATED, CL_STANDING, OB_SEATED, OB_STANDING]) {
      const t = oneThirdS(L.spec)!;
      assert.ok(t > 0 && t < L.spec.end, L.spec.id);
      assert.ok(y(L, t) < y(L, L.spec.end), `${L.spec.id}: above the bell`);
      assert.ok(y(L, t) > y(L, 0), `${L.spec.id}: below the reed`);
    }
  });
  it('bassoon: the bell points up, so a third from it is BELOW the bell top (larger y)', () => {
    for (const L of [BSN_SEATED, BSN_STANDING]) {
      const t = oneThirdS(L.spec)!;
      assert.ok(t > 0 && t < L.spec.end);
      assert.ok(y(L, L.spec.end) < y(L, 0), 'the bell top stands above the reed');
      assert.ok(y(L, t) > y(L, L.spec.end), 'below the bell top');
    }
  });
  it('the flutes have no one-third rule (no U): they are edge-blown, with no bell', () => {
    for (const s of [fluteSpec('metal'), PICCOLO]) assert.equal(oneThirdS(s), null);
  });
  it('the bass clarinet stands on its floor peg', () => {
    for (const L of [BCL.eflat, BCL.lowc]) {
      assert.ok(L.peg, 'a peg');
      assert.ok(near(L.peg!.b.y, L.body.floorY, 2), 'on the floor');
      assert.ok(L.peg!.b.y - L.peg!.a.y > 20, 'a peg of real length');
    }
  });
});

const variantsOf = (lesson: Lesson, z: Lesson['zones'][number]): string[] => {
  const all = lesson.model.variants.map((v) => v.id);
  const req = z.requires?.variants ?? (z.requires?.variant ? [z.requires.variant] : null);
  return req ?? all;
};

const JET_LAYOUTS: Record<string, (v: string) => Layout> = {
  A06: (v) => FLUTES[v as keyof typeof FLUTES] ?? FLUTES.metal,
  A07: (v) => (v === 'seated' ? PICC_SEATED : PICC_STANDING),
};

for (const lesson of WINDS) {
  describe(`${lesson.id} ${lesson.title}`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('its written pages serve the 8 journey pages', () => assertJourneyPages(lesson));
    it('it is listed in Lab 3 (Winds), and served', () => {
      assert.ok(MIKING_LABS.some((l) => l.id === 'winds'), 'the Winds hub exists');
      assert.ok(LESSONS.some((l) => l.id === lesson.id && l.labId === 'winds' && l.status === 'ready'));
      assert.equal(lesson.labId, 'winds');
      assert.equal(lessonById(lesson.id), lesson);
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    it('every wrong option has its own explanation; the quick check is six items with a critical one', () => {
      for (const s of [...lesson.scenarios, ...lesson.symptoms, ...lesson.diagnostic]) {
        assert.ok(s.options.includes(s.correct), s.id);
        assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), `${s.id}: why keys`);
      }
      assert.equal(lesson.diagnostic.length, 6);
      assert.ok(lesson.diagnostic.some((d) => d.critical));
    });
    it('a hearing line: 85 dBA, a limit for people', () => {
      assert.match([...lesson.scenarios, ...lesson.diagnostic].map((s) => s.explain).join(' '), /85 dBA/);
    });
    it('every recommended start is clear of every part and inside its own zone, in every variant it is offered', () => {
      for (const z of lesson.zones) {
        const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0]];
        const body = micBodyOf(t);
        for (const v of variantsOf(lesson, z)) {
          const scene = compileScene(lesson.model, v);
          const hit = checkAssembly(scene, z.start, body);
          assert.equal(hit, null, `${z.id} (${v}): blocked by ${hit?.partId}/${hit?.piece}`);
          assert.ok(inZone(z, { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} (${v}): not in its zone`);
        }
      }
    });
    const layoutOf = JET_LAYOUTS[lesson.id];
    if (layoutOf)
      it('no recommended start puts the mic in the air jet', () => {
        for (const z of lesson.zones) {
          const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0]];
          const aim = aimVec(z.start.az, z.start.el);
          for (const v of variantsOf(lesson, z)) {
            const jet = layoutOf(v).jet!;
            for (const f of [0, 0.5, 1]) {
              const p = { x: z.start.p.x - aim.x * t.body.length.mm * f, y: z.start.p.y - aim.y * t.body.length.mm * f, z: z.start.p.z - aim.z * t.body.length.mm * f };
              const d = { x: p.x - jet.a.x, y: p.y - jet.a.y, z: p.z - jet.a.z };
              const along = d.x * jet.dir.x + d.y * jet.dir.y + d.z * jet.dir.z;
              if (along <= 0 || along > jet.len * 1.5) continue;
              const r = Math.hypot(d.x - jet.dir.x * along, d.y - jet.dir.y * along, d.z - jet.dir.z * along);
              assert.ok(r > along * Math.tan((jet.half * Math.PI) / 180) + 10, `${z.id} (${v}): in the jet at ${f}`);
            }
          }
        }
      });
  });
}

describe('lesson-specific rules', () => {
  it('the piccolo makes no clip-fit claim: no clip zone, and every distance is marked as the flute’s, transferred', () => {
    assert.ok(!A07_LESSON.zones.some((z) => z.start.mount === 'clip'));
    for (const z of A07_LESSON.zones.filter((q) => q.id !== 'pc.headset')) assert.match(z.bandProv?.kind === 'illustrative' ? z.bandProv.reason : '', /flute’s figure, transferred/, z.id);
  });
  it('the flute’s clip is offered only on the keyed designs (never over a simple-system flute’s open finger holes)', () => {
    const clip = A06_LESSON.zones.find((z) => z.id === 'fl.clip')!;
    assert.ok(clip);
    const req = clip.requires?.variants ?? (clip.requires?.variant ? [clip.requires.variant] : []);
    assert.ok(!req.includes('simple') && req.length > 0);
  });
});

describe('fully silent', () => {
  const ROOTS = ['src/screens/lab/miking/lessons/shared/woodwinds', 'src/screens/lab/miking/lessons/a06Flute', 'src/screens/lab/miking/lessons/a07Piccolo', 'src/screens/lab/miking/lessons/a08aClarinet', 'src/screens/lab/miking/lessons/a08bBassClarinet', 'src/screens/lab/miking/lessons/a09aOboe', 'src/screens/lab/miking/lessons/a09bBassoon'];
  it('no audio import, no repeating animation loop', () => {
    for (const root of ROOTS)
      for (const f of readdirSync(root)) {
        const t = readFileSync(join(root, f), 'utf8');
        assert.doesNotMatch(t, /from ['"](expo-av|expo-audio|[^'"]*react-native-audio[^'"]*|[^'"]*\/audio\/[^'"]*)['"]/i, `${root}/${f}`);
        assert.doesNotMatch(t, /\b(withRepeat|useFrameCallback|setInterval)\b/, `${root}/${f}`);
      }
  });
});
