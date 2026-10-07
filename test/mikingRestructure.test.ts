/**
 * Miking Labs — THE 2026-10-06 RESTRUCTURE (owner: "The labs need to be about
 * miking … nowhere do I actually see mics set up or shown as an example").
 * docs/labs/miking/LESSON_JOURNEY.md is the record. Pinned here:
 *
 *   • the eight-page journey: "where it sits" is gone; MEET IT — WHERE THE
 *     SOUND COMES FROM and STARTING SETUPS are the two foundations, built for
 *     every one of the 79 lessons from the pages they were written in;
 *   • the standard line, word for word, on MEET IT, STARTING SETUPS and the
 *     Placement Studio;
 *   • STARTING SETUPS come from each lesson's own starting points (every mic
 *     at a zone's start pose, a type that zone takes), never invented; every
 *     variant has one, every lesson has two to look at somewhere;
 *   • credit: a record from before the restructure is never erased and never
 *     inflated — instrument / sound credit MEET IT, setting credits STARTING
 *     SETUPS, a complete lesson stays complete, and "n of N" never passes 8;
 *   • the quick check stays six valid items on the two foundations;
 *   • the Miking display is taller where the window allows (owner answer A);
 *   • the piano's long dynamic under the short-stick lid keeps its ~15 cm
 *     start (owner answer B): the mic is tilted clear, not moved closer.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { PAGE_IDS, viewsOf, type Lesson, type SourcePageId } from '../src/screens/lab/miking/engine/model/types.ts';
import { FOUNDATION_PAGES, journeyPageOf, STANDARD_LINE, STANDARD_LINE_PAGES, validateQuickCheck, journeyIntro } from '../src/screens/lab/miking/engine/journey.ts';
import { isRetired, pageOf, quickCheckOf, restructureLesson, RETIRED, scenariosOnPage } from '../src/screens/lab/miking/engine/restructure.ts';
import { coreSetups, SETUP_PICKS, startingSetups, zoneInVariant } from '../src/screens/lab/miking/engine/setups.ts';
import { creditedCount, creditedPages, isStoredPage } from '../src/screens/lab/miking/engine/progress/creditMap.ts';
import { pageComplete } from '../src/screens/lab/miking/engine/progress/credit.ts';
import { compileScene, checkAssembly, nearestClear, TILT_MAX } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { guideFor } from '../src/screens/lab/miking/engine/geometry/guides.ts';
import { GLASS_MAX, GLASS_MIN, mikingGlassHeight } from '../src/screens/lab/miking/engine/rack/glassHeight.ts';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const ALL: Lesson[] = LESSONS.map((m) => lessonById(m.id)!);

describe('the eight-page journey', () => {
  it('eight pages, MEET IT and STARTING SETUPS first, no "setting" / "instrument" / "sound" page', () => {
    assert.deepEqual([...PAGE_IDS], ['meet', 'setups', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice']);
    assert.deepEqual([...FOUNDATION_PAGES], ['meet', 'setups']);
  });
  it('the old page ids map to the page built from them', () => {
    const map: Record<string, string> = { instrument: 'meet', sound: 'meet', setting: 'setups' };
    for (const [a, b] of Object.entries(map)) assert.equal(journeyPageOf(a as SourcePageId), b);
    for (const p of PAGE_IDS) assert.equal(journeyPageOf(p), p);
  });
  for (const lesson of ALL) {
    it(`${lesson.id}: validates; MEET IT and STARTING SETUPS are served with their own title and credit`, () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      const meet = pageOf(lesson, 'meet');
      const setups = pageOf(lesson, 'setups');
      assert.equal(meet.title, 'Meet it — where the sound comes from');
      assert.equal(setups.title, 'Starting setups');
      assert.equal(setups.credit.interactive, 'setupsSeen');
      // Each foundation credits only live checks written for it.
      for (const p of FOUNDATION_PAGES) {
        for (const id of pageOf(lesson, p).credit.scenarios) {
          assert.ok(!isRetired(lesson.id, id), `${lesson.id} ${p}: ${id} retired`);
          assert.equal(journeyPageOf(lesson.scenarios.find((s) => s.id === id)!.page), p);
        }
      }
      // The served lesson carries no retired check and the six-item check.
      const served = restructureLesson(lesson);
      for (const s of served.scenarios) assert.ok(!isRetired(lesson.id, s.id), s.id);
      assert.deepEqual(validateQuickCheck(quickCheckOf(lesson)), []);
      assert.equal(served.diagnostic.length, 6);
      assert.ok(scenariosOnPage(lesson, 'setups').length >= 1, 'the "before any mic" checks moved to STARTING SETUPS');
    });
  }
  it('every RETIRED id names an item the lesson really has', () => {
    for (const [id, items] of Object.entries(RETIRED)) {
      const l = lessonById(id);
      assert.ok(l, id);
      const ids = new Set([...l!.scenarios.map((s) => s.id), ...l!.diagnostic.map((d) => d.id)]);
      for (const x of items) assert.ok(ids.has(x), `${id}: ${x}`);
    }
  });
});

describe('the standard line and the START wording', () => {
  it('word for word, on MEET IT, STARTING SETUPS and the Placement Studio', () => {
    assert.equal(STANDARD_LINE, 'These are suggested starting points, not rules. Put the mic up, listen, move it, and adjust — your ears and the room decide.');
    assert.deepEqual([...STANDARD_LINE_PAGES], ['meet', 'setups', 'placement']);
    const host = read('src/screens/lab/miking/MikingLessonScreen.tsx');
    assert.match(host, /\{STANDARD_LINE_PAGES\.includes\(page\) \? <StandardLine text=\{STANDARD_LINE\} \/> : null\}/);
  });
  it('the START step names the new journey, never "where it sits"', () => {
    for (const lesson of ALL) {
      const t = journeyIntro(lesson.noun);
      assert.doesNotMatch(t, /where (it|they) sits?/i);
      assert.match(t, /starting setups/);
    }
    for (const f of ['pages/PInstrument.tsx', 'lessons/shared/journeyPages.tsx', 'lessons/shared/handdrums/pages/HInstrument.tsx', 'lessons/shared/smallperc/pages/SInstrument.tsx', 'lessons/shared/kitPages/PKitOrient.tsx']) {
      const s = read(`src/screens/lab/miking/${f}`);
      assert.match(s, /journeyIntro\(/, f);
      assert.doesNotMatch(s, /and where (it|they) sits?\./, f);
    }
  });
  it('no sound page still asks for a sequence the journey no longer credits', () => {
    for (const f of ['pages/PSound.tsx', 'lessons/shared/mallets/MSound.tsx', 'lessons/shared/handdrums/pages/HSound.tsx', 'lessons/shared/woodwinds/WindSoundPage.tsx']) {
      assert.doesNotMatch(read(`src/screens/lab/miking/${f}`), /step it through to earn this page’s credit/, f);
    }
  });
});

describe('STARTING SETUPS: real setups, from the lesson’s own starting points', () => {
  for (const lesson of ALL) {
    it(`${lesson.id}: every variant has a setup; every mic sits at a zone start with a type that zone takes`, () => {
      let best = 0;
      // A lesson whose own words say one spot is usually enough has no TWO
      // MICS role (SETUP_PICKS pair: null, review 2026-10-07): it still draws
      // two setups somewhere, the second as ANOTHER START.
      const oneSpot = SETUP_PICKS[lesson.id]?.pair === null;
      for (const v of lesson.model.variants) {
        const list = startingSetups(lesson, v.id, MIC_TYPES);
        assert.ok(list.length >= 1, `${lesson.id}/${v.id}: no setup`);
        assert.equal(list[0].role, 'one');
        best = Math.max(best, oneSpot ? list.length : coreSetups(list).length);
        const ids = new Set<string>();
        const scene = compileScene(lesson.model, v.id);
        const vb = viewsOf(lesson.model, v.id);
        const bounds = { min: { x: Math.max(vb.side!.u0, vb.top!.u0) + 20, y: vb.side!.v0 + 20, z: vb.top!.v0 + 20 }, max: { x: Math.min(vb.side!.u1, vb.top!.u1) - 20, y: vb.side!.v1 - 20, z: vb.top!.v1 - 20 } };
        for (const s of list) {
          assert.ok(!ids.has(s.id), `${s.id} twice`);
          ids.add(s.id);
          assert.ok(s.title && s.line, s.id);
          for (const m of s.mics) {
            assert.ok(MIC_TYPES[m.typeId], `${s.id}: type ${m.typeId}`);
            if (m.zoneId) {
              const z = lesson.zones.find((q) => q.id === m.zoneId)!;
              assert.ok(zoneInVariant(z, v.id), `${s.id}: ${z.id} not in ${v.id}`);
              assert.deepEqual(m.pose, z.start, `${s.id}: the zone's own start`);
              if (s.role !== 'pair') assert.ok((z.requires?.micTypeIds ?? lesson.micTypeIds).includes(m.typeId), `${s.id}: ${m.typeId} for ${z.id}`);
            }
            // Nothing is drawn inside a part: the rig starts it clear.
            const t = MIC_TYPES[m.typeId];
            if (t.mount !== 'surface') {
              const body = micBodyOf(t);
              const clear = nearestClear(scene, m.pose, body, bounds);
              assert.ok(clear && !checkAssembly(scene, clear, body), `${s.id}: ${m.typeId} cannot start clear`);
            }
          }
        }
      }
      assert.ok(best >= 2, `${lesson.id}: only ${best} setup to look at in every variant`);
    });
  }
});

describe('stored credit across the restructure (never removed, never inflated)', () => {
  const old9: SourcePageId[] = ['instrument', 'sound', 'setting', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice'];
  it('a complete nine-page record is a complete eight-page lesson', () => {
    assert.equal(creditedCount(old9), 8);
    assert.deepEqual([...creditedPages(old9)].sort(), [...PAGE_IDS].sort());
  });
  it('each old page credits only the page built from it', () => {
    assert.deepEqual([...creditedPages(['instrument'])], ['meet']);
    assert.deepEqual([...creditedPages(['sound'])], ['meet']);
    assert.deepEqual([...creditedPages(['setting'])], ['setups']);
    assert.deepEqual([...creditedPages(['instrument', 'sound'])], ['meet']);
    assert.equal(creditedCount(['setting', 'placement']), 2);
  });
  it('the count never passes the eight pages, old and new ids mixed', () => {
    assert.equal(creditedCount([...old9, 'meet', 'setups']), 8);
    assert.equal(creditedCount([]), 0);
  });
  it('old ids are still valid on the record (never dropped by the sanitiser)', () => {
    for (const p of [...old9, 'meet', 'setups'] as const) assert.ok(isStoredPage(p), p);
    assert.ok(!isStoredPage('sources'));
    const prog = read('src/screens/lab/miking/engine/progress/mikingProgress.ts');
    assert.match(prog, /const isPage = isStoredPage;/);
  });
  it('the hub and the lesson read stored credit through the map', () => {
    assert.match(read('src/screens/lab/miking/MikingHubScreen.tsx'), /const n = creditedCount\(lp\.done\);/);
    assert.match(read('src/screens/lab/miking/MikingLessonScreen.tsx'), /creditedPages\(lp\.done\)/);
  });
  it('a foundation completes only on its own requirement', () => {
    const l = lessonById('M01')!;
    const all = Object.fromEntries(l.scenarios.map((s) => [s.id, true]));
    assert.equal(pageComplete(l, 'setups', all, new Set()), false, 'the setups must be looked at');
    assert.equal(pageComplete(l, 'setups', all, new Set(['setupsSeen'])), true);
    assert.equal(pageComplete(l, 'meet', {}, new Set()), false);
    assert.equal(pageComplete(l, 'meet', all, new Set()), true);
  });
});

describe('owner answers to the fix pass', () => {
  it('A · the display grows with a tall window, within a cap; a short phone keeps the rack’s rule', () => {
    assert.equal(mikingGlassHeight(700), undefined);
    assert.equal(mikingGlassHeight(759), undefined);
    assert.equal(mikingGlassHeight(915), 329);
    assert.equal(mikingGlassHeight(844), 304);
    assert.equal(mikingGlassHeight(2000), GLASS_MAX);
    for (let h = 760; h < 2400; h += 37) {
      const g = mikingGlassHeight(h)!;
      assert.ok(g >= GLASS_MIN && g <= GLASS_MAX, `${h}`);
    }
    const rack = read('src/screens/lab/rack/RackUnit.tsx');
    assert.match(rack, /stage\.phoneHeight && effSize === size/);
    assert.match(read('src/screens/lab/miking/engine/rack/MikingRack.tsx'), /phoneHeight, fullScreen: true/);
  });
  it('B · the long dynamic under the short-stick lid starts about 15 cm over the strings (tilted clear, not moved)', () => {
    const L = lessonById('C11')!;
    const z = L.zones.find((q) => q.id === 'gp.short')!;
    const scene = compileScene(L.model, 'short');
    const body = micBodyOf(MIC_TYPES.instDynCard);
    assert.ok(checkAssembly(scene, z.start, body), 'at the zone start the long dynamic would touch the lid');
    const vb = viewsOf(L.model, 'short');
    const bounds = { min: { x: -1e4, y: vb.side!.v0, z: vb.top!.v0 }, max: { x: 1e4, y: vb.side!.v1, z: vb.top!.v1 } };
    const p = nearestClear(scene, z.start, body, bounds)!;
    assert.ok(p && !checkAssembly(scene, p, body));
    assert.deepEqual(p.p, z.start.p, 'the front stays where the zone starts it');
    assert.ok(Math.abs(p.el - z.start.el) <= TILT_MAX + 5);
    const d = guideFor(L.model.surfaces.find((s) => s.id === z.refSurface)!, p).distance;
    assert.ok(Math.abs(d - 152.4) < 5, `${d.toFixed(0)} mm`);
  });
});
