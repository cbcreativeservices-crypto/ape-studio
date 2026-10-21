/**
 * Wiring grade, round 3 — Patchbay lab (owner go 2026-10-21).
 *  R3-PB-01  the CLASH state's bezel reads CLASH in the hazard colour (it read
 *            "BOTH" in healthy green — two outputs tied into one input).
 *  R3-PB-02  the cutaway draws only the tip spring: it says so (RING SPRING
 *            NOT SHOWN) and that it is ENLARGED, and the T·R·S page text no
 *            longer claims you watched tip AND ring contacts switch.
 *  R3-PB-03  with both jacks plugged, the two cords leave on opposite sides
 *            (faceplate slice + studio bay), each in its own lane.
 *  R3-PB-04  the full-normal detective item no longer names pair 01 (which is
 *            half-normal on the studio bay).
 *  extras    the far cord plugs are seated in a device panel (never in
 *            mid-air); "never make a clean mix" → "are not a mix"; a parallel
 *            pair's jacks are both taps.
 * Source-reading for the .tsx art (react-native-svg); engine data is imported.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { STUDIO_PAIRS, ASSESSMENT_ITEMS } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
const { PREDICT_SCENARIOS } = await import('../src/screens/lab/patchbay/engine/scenarios.ts');

const root = join(import.meta.dirname, '..');
const lab = (rel: string) => readFileSync(join(root, 'src/screens/lab/patchbay', rel), 'utf8');
const flat = (s: string) => s.replace(/\s+/g, ' ');

describe('R3-PB-01 clash bezel', () => {
  it('destinationHears "both" reads CLASH, tinted PB.hazard — never BOTH / green', () => {
    const s = lab('rackLayout.tsx');
    assert.match(s, /flow\.destinationHears === 'both'\s*\? 'CLASH'/);
    assert.doesNotMatch(s, /\? 'BOTH'/);
    assert.match(s, /tint: dest === 'CLASH' \? PB\.hazard :/);
  });
});

describe('R3-PB-02 cutaway honesty', () => {
  const s = lab('art/JackCutaway.tsx');
  it('prints ENLARGED and RING SPRING NOT SHOWN under the body (9 pt, inside the viewBox)', () => {
    assert.match(s, /JACK_NOTES = \['ENLARGED — DRAWN LARGER THAN A REAL JACK', 'RING SPRING NOT SHOWN — IT SWITCHES THE SAME WAY'\]/);
    assert.match(s, /JACK_NOTES\.map\(\(t, i\) => \(\s*<SvgText key=\{t\} x=\{62\} y=\{178 \+ i \* 12\} fontSize=\{9\}/);
    // body ends at y 164 (30 + 134); both notes sit below it and inside H = 200
    assert.ok(178 - 9 > 164 && 178 + 12 <= 200);
    assert.match(s, /a11y = `Jack cutaway, enlarged; the ring spring is not shown\./);
  });
  it('keeps the drawing size (body 262 × 134 units)', () => {
    assert.match(s, /<Rect x=\{62\} y=\{30\} width=\{262\} height=\{134\}/);
  });
  it('the T·R·S page says the ring spring is left out, not that you watched it', () => {
    const d = flat(lab('pagesD.tsx'));
    assert.doesNotMatch(d, /switching contacts you watched/);
    assert.match(d, /The cutaway drew only the TIP spring\. In real bays the RING has its own spring and normal contact too/);
    assert.match(d, /The sleeve is most often wired straight through, not switched\./);
  });
});

describe('R3-PB-03 one lane per cord', () => {
  it('faceplate slice: the bottom jack cord drops on the LEFT, the top cord on the right', () => {
    const s = lab('art/PatchPairView.tsx');
    assert.match(s, /export const cordDrop = \(cx: number, cy: number, side: 1 \| -1\) =>/);
    assert.match(s, /\{jack\(CX, ROW_TOP, true, topPlugged\)\}/);
    assert.match(s, /\{jack\(CX, ROW_BOT, true, bottomPlugged, -1\)\}/);
    assert.match(s, /<Path d=\{cordDrop\(cx, cy, side\)\}/);
  });
  it('studio bay: top cord at cx + 12, bottom cord at cx − 12 (opposite sides)', () => {
    const s = lab('art/StudioBayView.tsx');
    assert.match(s, /\{ y: ROW_TOP, on: !!plug\.top, side: 1 \}, \{ y: ROW_BOT, on: !!plug\.bottom, side: -1 \}/);
    assert.match(s, /\$\{cx \+ 12 \* side\} \$\{PY \+ PANEL_H \+ 4\}/);
  });
});

describe('R3-PB-03 extra: far plugs seated, not floating', () => {
  const s = lab('art/PatchPairView.tsx');
  it('both far plugs are SeatedPlug at PLUG_X, and no bare CordPlug is drawn in the schematic', () => {
    assert.match(s, /<SeatedPlug x=\{PLUG_X\} y=\{TOP_Y - 28\} \/>/);
    assert.match(s, /<SeatedPlug x=\{PLUG_X\} y=\{BOT_Y \+ 14\} \/>/);
    assert.equal((s.match(/<CordPlug /g) ?? []).length, 1, 'only inside SeatedPlug');
    assert.match(s, /const PLUG_X = W - 130;/);
  });
  it('the device panel covers the plug tip and stays clear of the labels at W − 87', () => {
    const W = 340;
    const PLUG_X = W - 130;
    const m = s.match(/SEATED_PANEL_DX = (\d+);[\s\S]*?SEATED_PANEL_W = (\d+);/);
    assert.ok(m);
    const dx = Number(m![1]);
    const pw = Number(m![2]);
    // CordPlug: handle 12 long, shaft 16.6 → tip end at x + 28.6
    assert.ok(dx > 12 && dx < 28.6, 'panel face on the shaft');
    assert.ok(dx + pw >= 28.6, 'tip hidden inside the device');
    assert.ok(PLUG_X + dx + pw <= W - 87 - 6, 'labels clear');
    // both cords end at the plug's back end
    assert.match(s, /\$\{PLUG_X - 12\} \$\{TOP_Y - 26\}, \$\{PLUG_X\} \$\{TOP_Y - 28\}/);
    assert.match(s, /M \$\{PLUG_X\} \$\{BOT_Y \+ 14\} C/);
  });
});

describe('R3-PB-04 + text extras', () => {
  it('the full-normal detective item does not name pair 01 (half-normal on the studio bay)', () => {
    const a6 = ASSESSMENT_ITEMS.find((q: { id: string }) => q.id === 'a6');
    assert.ok(a6);
    assert.match(a6.question, /^On a full-normal bay, /);
    assert.doesNotMatch(a6.question, /pair 01|The bay is full-normal/);
    assert.equal(STUDIO_PAIRS.find((p: { n: number }) => p.n === 1)?.config, 'half');
  });
  it('two outputs into one input "are not a mix"', () => {
    const all = JSON.stringify(PREDICT_SCENARIOS);
    assert.doesNotMatch(all, /never make a clean mix/);
    assert.match(all, /Two outputs wired into one input are not a mix/);
  });
  it('a parallel pair: both jacks are taps', () => {
    assert.match(flat(lab('pagesB.tsx')), /PARALLEL pair, where top and bottom are wired straight across with no switch to break, so both jacks are taps/);
  });
});
