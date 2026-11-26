/**
 * CAST FIGURES — the broadcast area (B01–B17 and shared/broadcast, shared/sports),
 * sweep of 2026-11-26. Every person a learner sees in the area is already a
 * cast member in the approved look: the seated talkers (B01, B02, B06, B07,
 * B09), the standing talkers (B03, B10, B11), the presenter in her jacket (B04,
 * B05), the lectern presenter and the asker (B06), the boom operators (B04, B10,
 * B11), the dish operator and the clapper (B12–B17). The old player figure is
 * reached only through a lesson's figure-family switch when it is off, and every
 * switch the area reads is on. This pins that state, and that each talker id the
 * lessons use resolves to its own cast member (the same role, the same person,
 * on every page and view).
 * (Left for the owner's ruling, untouched: B08's audience; B09's partner head is
 * never drawn turned.)
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const CFG = await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts');
const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');

const L = 'src/screens/lab/miking/lessons/';

describe('cast figures — broadcast (2026-11-26)', () => {
  it('every figure-family switch the broadcast lessons read is on', () => {
    for (const f of ['sideDeskTalker', 'sideStanding', 'frontAndBoom'] as const) assert.equal(CFG.figureV2On(f), true, f);
  });

  it('each talker id resolves to its own cast member', () => {
    const want: Record<string, string> = {
      host: 'kofi', // B01 host, B02 anchor, B06 focus, B07 reader, B09 commentator
      hostB: 'ruth', // B01 co-host
      guest: 'mei', // B02, B03, B07, B10 guest
      reporter: 'ana', // B03, B10
      analyst: 'mei', // B09
      wearer: 'kofi', // B11
      asker: 'ruth', // B06
      p1: 'mei',
      p3: 'drummer',
      p4: 'ruth', // B06 panel
    };
    for (const [id, who] of Object.entries(want)) assert.equal(CAST.castFor(CAST.talkerRole(id)).id, who, id);
    assert.equal(CAST.castFor('presenter').id, 'ruth', 'B04 / B05 presenter');
    assert.equal(CAST.castFor('sports.dish').id, 'kofi', 'B12–B17 dish operator');
    assert.equal(CAST.castFor('sports.clapper').id, 'mei', 'B14 clapper');
  });

  it('the lessons pass the new look to every figure call (the old figure only behind a switch)', () => {
    // seated talkers: every SeatedTalker in B01, B02, B06, B07 carries v2
    for (const f of ['b01RadioHost', 'b02NewsAnchor', 'b06Panels', 'b07Voiceover']) {
      const src = read(`${L}${f}/scene.tsx`);
      const calls = src.match(/<SeatedTalker [^>]*\/>/g) ?? [];
      assert.ok(calls.length > 0, f);
      for (const c of calls) assert.match(c, /v2=\{v2\}/, `${f}: ${c}`);
    }
    // B09: the commentator is the cast member (SeatedV2) whenever v2; the analyst's SeatedTalker carries v2
    const b09 = read(`${L}b09Commentators/scene.tsx`);
    assert.match(b09, /const CALLER_WHO = castFor\('talker\.host'\);/);
    for (const c of b09.match(/<SeatedTalker view="top" t=\{analyst\}[^>]*\/>/g) ?? []) assert.match(c, /v2=\{v2\}/, c);
    // B03 / B10 / B11 standing people, B04 / B05 presenter
    assert.match(read(`${L}b03FieldReporter/scene.tsx`), /\{v2 \? <StandingV2 view=\{view\} t=\{GUEST\} who=\{WHO\.guest\} \/>/);
    assert.match(read(`${L}b11Athletes/scene.tsx`), /\{V2 \? <StandingTalkerV2 view=\{view\} t=\{WEARER\}/);
    assert.match(read(`${L}b04BoomCamera/scene.tsx`), /<StandingPresenter view=\{view\} headless=\{headless\} v2=\{V2\} \/>/);
    assert.match(read(`${L}b05Lavalier/scene.tsx`), /<StandingPresenter view=\{view\} headless=\{headless\} v2=\{V2\} \/>/);
    // the sports operator from above and the clapper are cast members
    assert.match(read(`${L}shared/sports/VenueArt.tsx`), /<PlayerTopV2 player=\{DISH_OP_PLAYER\} who=\{castFor\('sports\.dish'\)\} \/>/);
    assert.match(read(`${L}shared/sports/DishArt.tsx`), /<PlayerTopV2 player=\{OP_PLAYER\} who=\{castFor\('sports\.dish'\)\} \/>/);
    assert.match(read(`${L}shared/sports/BoundaryArt.tsx`), /<ClapperV2 pose=\{pose\} who=\{castFor\('sports\.clapper'\)\} \/>/);
  });

  it('the cut-away and the turned head are the talker at the lips, not the host by default', () => {
    for (const [f, who] of [
      ['b03FieldReporter', 'talker.guest'],
      ['b04BoomCamera', 'presenter'],
      ['b05Lavalier', 'presenter'],
      ['b10Sideline', 'talker.guest'],
      ['b11Athletes', 'talker.wearer'],
    ] as const) {
      const src = read(`${L}${f}/pages.tsx`);
      assert.match(src, new RegExp(`makeBroadcastSound\\(\\{\\n  v2: V2,\\n(?:.*\\n){0,3}?  who: '${who.replace('.', '\\.')}',`), f);
    }
    assert.match(read(`${L}b11Athletes/pages.tsx`), /turnWho: 'talker\.wearer'/);
  });
});
