/**
 * Two owner-approved leftovers of the function audit, 2026-11-05.
 *
 * Decision 3 A, Boom Camera: MIC on Two talkers changed nothing in the display,
 * because the mic was drawn with fixed shotgun props and boomMicLook was never
 * called. It now draws the chosen mic at its real size, and at 375 wide that
 * change is small, so the close-up box the Mic TYPE pages use sits under the
 * stage, in room taken from the stage so it covers nothing.
 *
 * Decision 19 A: two "31" claims remained. The RTA's hub label now uses the RTA
 * screen's own words. MultiMeter help does NOT: that screen draws 1/6-octave
 * bands from 20 Hz, so its line says that (toolsData says the same).
 *
 * Reads the source: the step's render tree needs Skia on a real page, and the
 * tool run at 375 wide is the proof of what shows.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { FIELD_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/field/fieldMics.ts';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i);
  assert.ok(i >= 0 && j > i, `${a} … ${b}`);
  return s.slice(i, j);
};

describe('decision 3 A: the Boom Camera MIC choice draws the chosen mic', () => {
  const pages = read('screens/lab/miking/lessons/b04BoomCamera/pages.tsx');
  const step = between(pages, 'function useTwoTalkerStep', 'function useTools');

  it('the two mics really differ in the data the drawing reads', () => {
    const { locBoomSg, locBoomHyper } = FIELD_MIC_TYPES;
    assert.notEqual(locBoomSg.art, locBoomHyper.art);
    assert.ok(locBoomHyper.body.length.mm < locBoomSg.body.length.mm / 2);
  });

  it('the stage draws the choice, not fixed shotgun props', () => {
    assert.ok(!step.includes('art="shotgun"'));
    assert.ok(step.includes('const look = boomMicLook(pattern);'));
    assert.ok(step.includes('art={look.art} r={look.r} len={look.len}'));
  });

  it('the close-up box shows the choice, in room taken from the stage', () => {
    assert.ok(step.includes('<MicCloseUp type={look.type} w={w} />'));
    assert.ok(step.includes('h={h - CLOSE_UP_H}'));
    const look = between(read('screens/lab/miking/lessons/shared/broadcast/CameraArt.tsx'), 'export function boomMicLook', 'export function cameraSpec');
    assert.match(look, /return \{ type: t,/);
  });

  it('a screen reader hears the length too', () => {
    assert.match(between(step, 'const a11y', 'const params'), /\$\{look\.length\} boom mic/);
  });
});

describe('decision 19 A: no "31" claim is left where the screen does not draw it', () => {
  const WORDS = 'same band spacing as a 31-band graphic EQ, shown here from 25 Hz to 20 kHz';

  it('the RTA hub label uses the RTA screen’s own words', () => {
    assert.ok(read('screens/tools/RtaScreen.tsx').includes(WORDS));
    const hub = read('screens/tools/ToolsHubScreen.tsx');
    assert.ok(hub.includes(WORDS));
    assert.ok(!hub.includes('thirty-one'));
  });

  it('MultiMeter help says what that screen draws, not the RTA’s words', () => {
    const line = read('features/lab/guidedLessons/toolHelp.tsx').split('\n').find((l) => /name: ["']LIVE SPECTRUM["']/.test(l));
    assert.ok(line);
    assert.ok(!line.includes('31 gradient'));
    assert.ok(!line.includes('1/3-octave'));
    assert.ok(!line.includes(WORDS));
    assert.ok(line.includes('20 Hz–20 kHz · 61 bands (1/6 octave)'));
    assert.ok(line.includes('Each column is a 1/6-octave band'));
    const screen = read('screens/tools/MultiMeterScreen.tsx');
    assert.ok(screen.includes("{ label: 'FULL', min: 20, max: 20000 }"));
    assert.ok(screen.includes('useState<Zoom>(ZOOMS[0])'));
  });
});
