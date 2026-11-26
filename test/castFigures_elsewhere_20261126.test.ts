/**
 * CAST FIGURES — "ELSEWHERE" sweep (owner 2026-11-26: every drawn person is one
 * of the cast). The sweep of every screen outside the Miking lessons found the
 * body figures already converted (waves 6 and 7); this pins that state:
 *   • each role is the same cast member on every page of its lab;
 *   • each screen that draws a person with a body draws the cast member, and
 *     no old body figure (the old front/seated/above figure, the old graphite
 *     person for scale, the old standing head) is drawn there any more;
 *   • the owner's rulings hold: Stage Plot's people stay the one generic plot
 *     symbol (PERFORMERS_AS_CAST false, the choir the same).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LAB = 'src/screens/lab';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));

describe('cast figures elsewhere — the roles', () => {
  it('each role outside the Miking lessons is one fixed cast member', () => {
    const want: Record<string, string> = {
      'foundations.person': 'ruth',
      'wave.listener': 'kofi',
      'eq.person': 'ana',
      'cable.person': 'kofi',
      'cable.person2': 'ana',
      'room.listener': 'mei',
      'venue.stageC': 'ana',
      'venue.stageL': 'kofi',
      'venue.stageR': 'ruth',
      'venue.riserC': 'drummer',
      'monitor.performer': 'ana',
      'voice.singer': 'ana',
      'coverage.guitar': 'ruth',
      'coverage.bass': 'kofi',
      'ga.you': 'kofi',
      'ga.guide': 'mei',
    };
    for (const [role, id] of Object.entries(want)) assert.equal(CAST.castFor(role as never).id, id, role);
  });
  it('two people drawn together are two different people', () => {
    assert.notEqual(CAST.castFor('cable.person').id, CAST.castFor('cable.person2').id);
    const stage = ['venue.stageC', 'venue.stageL', 'venue.stageR', 'venue.riserC'].map((r) => CAST.castFor(r as never).id);
    assert.equal(new Set(stage).size, stage.length, 'the venue stage: four different people');
  });
});

describe('cast figures elsewhere — each screen draws the cast member, no old body figure', () => {
  const OLD = /<FigureStandingAt\b|<FigureStandingFrontSvg\b|<FigureSeatedSideSvg\b|<PlayerBehind\b|<PlayerInFront\b|<PersonScaleOld\s|<StandingHead\s/;
  const sites: [string, RegExp[]][] = [
    [`${LAB}/foundations/viz.tsx`, [/<PersonStandingFrontAt [^>]*who=\{castFor\('foundations\.person'\)\}/]],
    [`${LAB}/wave/vizWave.tsx`, [/<PersonStandingFrontAt [^>]*who=\{castFor\('wave\.listener'\)\}/]],
    [`${LAB}/eq/modules/CameraAnalogy.tsx`, [/<PersonFrontSvg [^>]*who=\{castFor\('eq\.person'\)\}/]],
    [`${LAB}/cableinstall/svgArt.tsx`, [/return <PersonFrontSvg [^>]*who=\{who \?\? castFor\('cable\.person'\)\}/]],
    [`${LAB}/cableinstall/scenes/routeArt.tsx`, [/<PersonScale [^>]*who=\{castFor\('cable\.person2'\)\}/]],
    [`${LAB}/roomdesign/RoomSideView.tsx`, [/<PersonSeatedSideSvg [^>]*who=\{castFor\('room\.listener'\)\}/]],
    [`${LAB}/soundsystems/art/VenueView.tsx`, [/<PersonAboveSvg [^>]*who=\{castFor\(`venue\.\$\{s\}`/]],
    [`${LAB}/soundsystems/art/diagrams.tsx`, [/<PersonAboveSvg [^>]*who=\{castFor\('monitor\.performer'\)\}/]],
    [`${LAB}/micspeaker/viz.tsx`, [/<PersonSideV2 pose=\{SINGER_SIDE\} who=\{castFor\('voice\.singer'\)\}/, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('voice\.singer'\)\}/, /<PlayerTopV2 player=\{BAND_TOP_PLAYERS\[p\.kind\]\}/]],
    [`${LAB}/micselect/polarStage.tsx`, [/<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('voice\.singer'\)\}/]],
    [`${LAB}/gameaudio/scene/GaScene.tsx`, [/<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\(second \? 'ga\.guide' : 'ga\.you'\)\}/]],
    [`${LAB}/gameaudio/pages/chcSpeakerMap.tsx`, [/<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('ga\.you'\)\}/]],
    [`${LAB}/gameaudio/scene/hud/bOutput.tsx`, [/<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('ga\.you'\)\}/]],
  ];
  for (const [file, res] of sites)
    it(file.split('/').slice(-2).join('/'), () => {
      const src = read(file);
      for (const re of res) assert.match(src, re);
      assert.doesNotMatch(src, OLD, 'no old body figure drawn');
    });
  it('Sound Systems: no old figure from above in its drawings', () => {
    for (const f of ['VenueView.tsx', 'diagrams.tsx']) assert.doesNotMatch(read(`${LAB}/soundsystems/art/${f}`), /<FigureAboveSvg\b/, f);
  });
});

describe('cast figures elsewhere — the owner rulings hold', () => {
  it('Stage Plot: every person stays the one generic plot symbol', () => {
    assert.match(read(`${LAB}/stageplot/stage/stageArt.tsx`), /export const PERFORMERS_AS_CAST = false;/);
    assert.match(read(`${LAB}/stageplot/stage/topArtWorld.tsx`), /<FigureAboveSvg [^>]*build="narrow" \/>/);
  });
});
