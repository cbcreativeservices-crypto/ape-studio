/**
 * Lab 5 ensemble pages, instrument pass G1 (S2/S3, 2026-11-05). A control
 * passes only if the student can SEE what it promises:
 *
 *   MOVE      picking an axis lands on a view that draws it, and a view never
 *             strands an axis it cannot show; a lesson drawn from above has
 *             no UP–DOWN, and its zones stay reachable without one
 *   FAMILY    one family means no chooser: identical arcs are no choice
 *   E16       the horseshoe's start and zones are all on the TOWARD–AWAY lane
 *   WORDS     the blocked note, the conductor words and the ACROSS key come
 *             from what is really on this stage
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { acrossKey, acrossWords, axesFor, axisForView, blockedWords, ensembleModel, settleHeight, sideViewer, stageTags, stageWho, viewForAxis, type Axis } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleModel.ts';
import { seatingOf, type Seating } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import type { StageView } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';

const pages = readFileSync(join(process.cwd(), 'src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx'), 'utf8').replace(/\r\n/g, '\n');
const ALL: readonly StageView[] = ['plan', 'section', 'front'];
const AXES: readonly Axis[] = ['h', 'z', 'x'];
/** What each drawing can truly show, stated apart from the code under test. */
const SHOWS: Record<StageView, readonly Axis[]> = { plan: ['x', 'z'], section: ['h', 'z'], front: ['h', 'x'] };
const lesson = (id: string) => lessonById(id) as EnsembleLesson;
const LESSONS = ['E02', 'E04', 'E05', 'E06', 'E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16'].map(lesson);

describe('MOVE always moves something on the glass', () => {
  it('every axis, picked from every view, lands on a view that draws it', () => {
    for (const a of AXES) for (const v of ALL) assert.ok(SHOWS[viewForAxis(a, v, ALL)].includes(a), `${a} from ${v}`);
  });
  it('the three frozen starts of the bug now switch the view', () => {
    assert.notEqual(viewForAxis('x', 'section', ALL), 'section');
    assert.notEqual(viewForAxis('h', 'plan', ALL), 'plan');
    assert.notEqual(viewForAxis('z', 'front', ALL), 'front');
  });
  it('a view that already shows the axis stays put', () => {
    assert.equal(viewForAxis('x', 'front', ALL), 'front');
    assert.equal(viewForAxis('z', 'plan', ALL), 'plan');
  });
  it('picking a VIEW never leaves MOVE on an axis that view cannot draw', () => {
    for (const v of ALL) for (const a of AXES) assert.ok(SHOWS[v].includes(axisForView(v, a, AXES)), `${a} in ${v}`);
  });
  it('the page wires both pairings through the chooser and the VIEW key', () => {
    assert.match(pages, /onSelect: \(id\) => pickAxis\(id as Axis\)/);
    assert.match(pages, /viewParam\(view, pickView, VW, viewsFor\(lesson\)\)/);
  });
});

describe('a lesson drawn only from above (E06)', () => {
  const E = lesson('E06').ensemble;
  it('offers no UP–DOWN, and opens on TOWARD–AWAY', () => {
    assert.deepEqual(axesFor(E.views!), ['z', 'x']);
    assert.deepEqual(axesFor(ALL), ['h', 'z', 'x']);
  });
  it('every axis it offers is drawn from above', () => {
    for (const a of axesFor(E.views!)) assert.ok(SHOWS.plan.includes(a));
  });
  it('both zones can be rested in on every seating, from every start, without UP–DOWN', () => {
    for (const variant of Object.keys(E.seatings)) {
      const zones = E.placeZones.filter((z) => !z.variants || z.variants.includes(variant));
      const starts = E.setups.filter((q) => q.rig && (!q.variants || q.variants.includes(variant)));
      for (const q of starts) {
        for (const z of zones) {
          const c = q.rig!.place.c;
          const rested = settleHeight({ x: 0, y: c.y, z: (z.box.min.z + z.box.max.z) / 2 }, [z]);
          assert.ok(rested.y >= z.box.min.y && rested.y <= z.box.max.y, `${variant}/${q.id} in ${z.id}`);
        }
      }
    }
  });
  it('outside every zone the height is left as the start gave it', () => {
    assert.deepEqual(settleHeight({ x: 2000, y: -1810, z: 100 }, E.placeZones), { x: 2000, y: -1810, z: 100 });
  });
  it('the height is said in words, and the prompt lists only the moves there are', () => {
    assert.match(pages, /seesHeight \? null : <Body>/);
    assert.doesNotMatch(pages, /prompt="MOVE the array \(choose UP–DOWN/);
  });
});

describe('FAMILY is a choice only when there are families to choose', () => {
  it('there are single-family seatings for the rule to cover', () => {
    assert.equal(new Set(seatingOf('quartet.arc').sections.map((q) => q.family)).size, 1);
    assert.ok(new Set(seatingOf('bb.standard').sections.map((q) => q.family)).size > 1);
  });
  it('one family drops the key, the readout and the instruction, and moves initialParam', () => {
    assert.match(pages, /\.\.\.\(manyFamilies \? \[\{ kind: 'options' as const, id: 'fam'/);
    assert.match(pages, /\.\.\.\(manyFamilies \? \[\{ k: 'FAMILY'/);
    assert.match(pages, /initialParam: manyFamilies \? 'fam' : 'main'/);
    assert.match(pages, /\$\{manyFamilies \? 'Choose a FAMILY: the' : 'The'\} arcs show/);
  });
  it('a family picked on another seating cannot empty the arcs', () => {
    assert.ok(pages.includes("const fam = manyFamilies && families.some((f) => f === famPicked) ? famPicked : 'all'"));
  });
});

describe('E16: the horseshoe stays on the TOWARD–AWAY lane', () => {
  const E = lesson('E16').ensemble;
  const lo = E.placeAxes!.z!.lo;
  const hi = E.placeAxes!.z!.hi;
  it('every start of every seating is on the lane', () => {
    for (const q of E.setups) if (q.rig) assert.ok(q.rig.place.c.z >= lo && q.rig.place.c.z <= hi, q.id);
  });
  it('every zone of every seating is on the lane', () => {
    for (const z of E.placeZones) assert.ok(z.box.min.z >= lo && z.box.max.z <= hi, z.id);
  });
  it('the rows keep their lane on the stage: the far end is still in front of the back wall', () => {
    assert.ok(lo > seatingOf('bb.standard').stage.z0);
    assert.ok(lo > seatingOf('bb.horseshoe').stage.z0);
  });
  it('the band has no conductor, and its words say so', () => {
    assert.equal(seatingOf('bb.standard').podium, null);
    assert.doesNotMatch(`${E.meet.figureBadge} ${E.meet.sectionsNote}`, /conductor/i);
  });
});

describe('the blocked note names only what is on this stage', () => {
  it('singers have no bows', () => {
    const w = blockedWords(seatingOf('vocal.quartet'));
    assert.match(w, /singers/);
    assert.doesNotMatch(w, /players|bows|conductor/);
  });
  it('a choir with a conductor: singers and the conductor’s space, no bows', () => {
    assert.equal(blockedWords(seatingOf('choir.risers')), 'the singers and the conductor’s space');
  });
  it('horns have no bows and no conductor here', () => {
    assert.equal(blockedWords(seatingOf('horns.line')), 'the players');
  });
  it('a quartet has bows and no conductor', () => {
    assert.equal(blockedWords(seatingOf('quartet.arc')), 'the players and their bows');
  });
  it('an orchestra has all three', () => {
    assert.equal(blockedWords(seatingOf('orch.american')), 'the players, their bows and the conductor’s space');
  });
  it('a jazz double bass is plucked: no bows on that stage', () => {
    assert.doesNotMatch(blockedWords(seatingOf('jazz.quartet')), /bows/);
  });
  it('the page no longer hard-codes it', () => {
    assert.doesNotMatch(pages, /the players, their bows and the conductor’s space come first/);
  });
});

describe('no conductor on the stage, no conductor in the words', () => {
  const quiet: readonly Seating[] = (['quartet.arc', 'horns.line', 'bb.standard', 'vocal.quartet', 'perc.trio'] as const).map(seatingOf);
  it('a seating with no podium is said from the audience', () => {
    for (const s of quiet) {
      assert.equal(stageWho(s), 'audience', s.id);
      assert.equal(sideViewer(s), 'audience', s.id);
      assert.doesNotMatch(JSON.stringify(stageTags(s)), /conductor/i, s.id);
    }
  });
  it('a podium keeps its conductor', () => {
    const s = seatingOf('orch.american');
    assert.equal(stageWho(s), 'conductor');
    assert.equal(sideViewer(s), undefined);
    assert.equal(stageTags(s).top, 'FROM ABOVE · THE CONDUCTOR’S VIEW');
  });
  it('a stage plot keeps its own words', () => {
    assert.equal(stageTags(seatingOf('band.stage')).top, 'FROM ABOVE · THE STAGE PLOT');
  });
  it('the engine’s tags and left/right agree on every lesson', () => {
    for (const L of LESSONS) {
      const variants = Object.keys(L.ensemble.seatings);
      const seats = variants.map((v) => seatingOf(L.ensemble.seatings[v]));
      const blob = JSON.stringify({ tags: L.model.viewTags, line: L.model.lines[0].words });
      if (seats.some((s) => !s.podium)) assert.doesNotMatch(blob, /conductor/i, L.id);
      else assert.match(blob, /conductor/i, L.id);
    }
  });
  it('the model builds its tags from the one helper', () => {
    const s = seatingOf('quartet.arc');
    const m = ensembleModel({ id: 'x', name: 'x', variants: [{ id: 'a', label: 'A', blurb: '', seating: s }] });
    assert.deepEqual(m.viewTags, stageTags(s));
  });
  it('the Placement Studio and the sections page use it', () => {
    assert.match(pages, /const who = stageWho\(s\)/);
    assert.match(pages, /sideWords\(centre, 600, sideViewer\(s\)\)/);
    const table = pages.slice(pages.indexOf('const SEATING_VIEW_WORDS'), pages.indexOf('const PLOT_VIEW_WORDS'));
    assert.ok(table.length > 100);
    assert.doesNotMatch(table.replace('front: VIEW_WORDS.front', ''), /conductor/i);
    assert.ok(table.includes(stageTags(seatingOf('quartet.arc')).top), 'the page and the engine say the same tag');
    assert.match(pages, /const viewWordsOf = \(s: Seating\): ViewWords => \(s\.viewer === 'audience' \? PLOT_VIEW_WORDS : stageWho\(s\) === 'conductor' \? VIEW_WORDS : SEATING_VIEW_WORDS\)/);
  });
});

describe('ACROSS says which way, first', () => {
  it('the key carries L or R', () => {
    assert.equal(acrossKey(-1500), 'L 1.5 m');
    assert.equal(acrossKey(2000), 'R 2.0 m');
    assert.equal(acrossKey(0), 'CENTER');
    assert.equal(acrossKey(20), 'CENTER');
  });
  it('the two sides never read the same', () => {
    assert.notEqual(acrossKey(-1500), acrossKey(1500));
  });
  it('the caption leads with the direction, so a cut line still says it', () => {
    assert.match(acrossWords(-1500), /^Left 1\.5 m/);
    assert.match(acrossWords(1500), /^Right 1\.5 m/);
    assert.equal(acrossWords(0), 'on the center line');
  });
  it('the longest caption fits the lane at 375 (it holds 30 characters)', () => {
    assert.ok(acrossWords(-3000).length <= 30, acrossWords(-3000));
    assert.ok(acrossWords(2750).length <= 30, acrossWords(2750));
  });
});
