/**
 * CAST FIGURES — the strings area (owner 2026-11-26: "fix the figures to our cast"): every person a learner
 * sees on the c-lessons' pages and the shared bowed / lute plans is one of the cast, in the approved look,
 * and no plan shows one person twice.
 *   • C12 Clavinet's stage plan: the keyboardist is the cast figure (Mei, 'plan.clavinet'), not the old
 *     oval-and-head marker, and recedes by its own dim (never see-through);
 *   • the upright bass plans (c06a/b): the pianist beside the bass is the cast figure, Ruth ('plan.keys') —
 *     not the bassist (Mei), not the drummer at the kit;
 *   • the lute plans (c13–c15): the accompanists are never the lesson's own player (the tanpura's key fell on
 *     Mei, the veena player: it is the drummer).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LS = 'src/screens/lab/miking/lessons';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const MP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/markerPose.ts'));

describe('cast figures — strings: C12 Clavinet stage plan', () => {
  it('the lesson draws the keyboardist in the approved look', () => {
    const pages = read(`${LS}/c12Clavinet/pages.tsx`);
    assert.match(pages, /const V2 = figureV2On\('sidePlayers'\);/);
    assert.match(pages, /<ClavinetPlan dim=\{0\.9\} v2=\{V2\} \/>/);
    assert.doesNotMatch(pages, /<ClavinetPlan dim=\{0\.9\} \/>/, 'the old marker is gone from the lesson');
  });
  it('the figure is outside the instrument’s opacity and recedes by its own dim', () => {
    const art = read(`${LS}/c12Clavinet/art.tsx`);
    assert.match(art, /who=\{who \?\? castFor\('plan\.clavinet'\)\} dim=\{dim\} \/>/);
    assert.match(art, /\{v2 \? null : \(/);
    assert.equal(CAST.castFor('plan.clavinet').id, 'mei');
  });
});

describe('cast figures — strings: the upright bass plan’s pianist', () => {
  it('is the cast figure, the plans’ keys player', () => {
    const plan = read(`${LS}/shared/bowed/BowedSettingPage.tsx`);
    assert.match(plan, /const PIANIST_V2 = figureV2On\('familyBowed'\);/);
    assert.match(plan, /const PIANIST_WHO = castFor\('plan\.keys'\);/);
    assert.match(plan, /<Pianist view="top" xKey=\{PIANIST\.xKey\} pedalX=\{PIANIST\.pedalX\} dim=\{0\.8\} v2=\{PIANIST_V2\} who=\{PIANIST_WHO\} \/>/);
  });
  it('is neither the bassist nor the drummer at the kit beside them', () => {
    const pianist = CAST.castFor('plan.keys').id;
    assert.notEqual(pianist, CAST.castFor('bowed.bass').id);
    assert.notEqual(pianist, CAST.castFor('kit.drummer').id);
  });
});

describe('cast figures — strings: the lute plans’ accompanists', () => {
  // the accompanists on each lesson's plan (lutesContent: C13 riq; C14 tabla, tanpura; C15 mridangam, tanpura)
  const PLANS: [string, string, string[]][] = [
    ['C13 oud', 'lute.oud', ['riq']],
    ['C14 sitar', 'lute.sitar', ['tabla', 'tanpura']],
    ['C15 veena', 'lute.veena', ['mridangam', 'tanpura']],
  ];
  const whoOf = (id: string): string => (id === 'tanpura' ? 'drummer' : MP.castForKey(id).id);
  it('the plan picks the tanpura’s person by name, the others by their key', () => {
    const src = read(`${LS}/shared/lutes/LutePlan.tsx`);
    assert.match(src, /const ACCOMPANIST_WHO: Readonly<Record<string, CastId>> = \{ tanpura: 'drummer' \};/);
    assert.match(src, /<MarkerTopV2 who=\{accompanistWho\(id\)\} facing=\{Math\.PI \/ 2\} \/>/);
    assert.equal(MP.castForKey('tanpura').id, 'mei', 'why: the key alone gives the veena player');
  });
  for (const [name, role, acc] of PLANS)
    it(`${name}: every person on the plan is a different cast member`, () => {
      const people = [CAST.castFor(role as never).id, ...acc.map(whoOf)];
      assert.equal(new Set(people).size, people.length, people.join(', '));
    });
});
