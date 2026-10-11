/**
 * PATCHBAY ON THE RACK (owner 2026-10-10: "convert the patchbay lab, all 23
 * modules, to the rack layout").
 *
 * The 9 pt floor (owner 2026-09-25) on the GLASS: every patchbay drawing is
 * authored with 9-unit text on a 340-unit viewBox, so it must be drawn at
 * least 340 pt wide. The glass height comes from the drawing's own aspect
 * (patchbay/glassFit.ts); this proves the arithmetic for every drawing the
 * rack pages pin, on a 390- and a 375-wide phone of normal height, through
 * the Rack Unit's own clamp and StageFit's margins.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { DRAWING_W, GLASS_BORDER, fitWidth, patchbayGlassHeight } from '../src/screens/lab/patchbay/glassFit.ts';
import { STAGE_HEIGHTS, type StageSize } from '../src/screens/lab/rack/rackTypes.ts';

const read = (rel: string) => readFileSync(new URL(`../src/screens/lab/${rel}`, import.meta.url), 'utf8');
const num = (src: string, re: RegExp, what: string) => {
  const m = re.exec(src);
  assert.ok(m, `${what} not found`);
  return Number(m[1]);
};

// The drawings' real dimensions, read from their sources.
const pp = read('patchbay/art/PatchPairView.tsx');
const FACE_H = num(pp, /const FACE_H = (\d+);/, 'FACE_H');
const FACE_GAP = num(pp, /const FACE_GAP = (\d+);/, 'FACE_GAP');
const GLASS_H = num(pp, /const GEO_GLASS: PairGeo = \{ H: (\d+),/, 'GEO_GLASS.H');
const BAY_H = num(read('patchbay/art/StudioBayView.tsx'), /const H = (\d+);/, 'bay H');
const JACK_H = num(read('patchbay/art/JackCutaway.tsx'), /const H = (\d+);/, 'jack H');
const BAY_GAP = num(read('patchbay/pagesC.tsx'), /const BAY_GAP = (\d+);/, 'BAY_GAP');

const DRAWINGS: { name: string; aspect: number; size: StageSize }[] = [
  { name: 'pair (faceplate + schematic)', aspect: DRAWING_W / (FACE_H + FACE_GAP + GLASS_H), size: 'L' },
  { name: 'pair schematic (processor chain)', aspect: DRAWING_W / GLASS_H, size: 'L' },
  { name: 'jack cutaway', aspect: DRAWING_W / JACK_H, size: 'L' },
  { name: 'studio bay (zero cables)', aspect: DRAWING_W / BAY_H, size: 'S' },
  { name: 'bay over the pair (page 14)', aspect: DRAWING_W / (BAY_H + BAY_GAP + GLASS_H), size: 'L' },
];

/** The Rack Unit's phone glass for a window (RackUnit.tsx, phone branch). */
function rackGlassH(winH: number, size: StageSize, phoneHeight: number | undefined): number {
  const effSize: StageSize = winH < 700 ? (size === 'L' ? 'M' : 'S') : size;
  const base = phoneHeight && effSize === size ? Math.max(STAGE_HEIGHTS[effSize], phoneHeight) : STAGE_HEIGHTS[effSize];
  return Math.min(base, Math.max(100, winH - 350));
}

describe('patchbay rack glass: every pinned drawing renders its 9-unit text at ≥ 9 pt', () => {
  for (const [winW, winH] of [[390, 844], [375, 812], [393, 852], [412, 915]] as const) {
    for (const d of DRAWINGS) {
      it(`${d.name} on a ${winW}×${winH} phone`, () => {
        const glassH = rackGlassH(winH, d.size, patchbayGlassHeight(winH, d.aspect, d.size));
        const glassW = winW - 20 - 2; // stage margins + the glass border
        const drawnW = fitWidth(glassW, glassH - GLASS_BORDER, d.aspect);
        const pt = (9 * drawnW) / DRAWING_W;
        assert.ok(pt >= 9, `${d.name}: 9-unit text draws at ${pt.toFixed(2)} pt (glass ${glassH} pt tall)`);
      });
    }
  }
  it('a short phone keeps the rack’s own glass (full screen covers it)', () => {
    assert.equal(patchbayGlassHeight(667, DRAWINGS[0].aspect), undefined);
  });
  it('the glass never takes more than 42 % of the window', () => {
    for (const d of DRAWINGS) {
      const h = patchbayGlassHeight(844, d.aspect, d.size);
      if (h != null) assert.ok(h <= Math.round(844 * 0.42));
    }
  });
});

describe('patchbay art: no authored text under 9 units', () => {
  for (const f of ['patchbay/art/PatchPairView.tsx', 'patchbay/art/JackCutaway.tsx', 'patchbay/art/StudioBayView.tsx']) {
    it(f, () => {
      for (const m of read(f).matchAll(/fontSize=\{([\d.]+)\}/g)) assert.ok(Number(m[1]) >= 9, `${f}: fontSize ${m[1]}`);
    });
  }
});

describe('patchbay rack pages', () => {
  it('the rack wrapper pins the drawing with StageFit, owns FULL SCREEN, and sizes the glass from the aspect', () => {
    const src = read('patchbay/rackLayout.tsx');
    assert.match(src, /phoneHeight: patchbayGlassHeight\(winH, rack\.aspect, size\),/);
    assert.match(src, /fullScreen: true,/);
    assert.match(src, /<StageFit w=\{w\} h=\{h\} aspect=\{rack\.aspect\} pad=\{PAD\}>/);
  });
  it('the bezel is read-only and the jacks are dock switches', () => {
    const src = read('patchbay/rackLayout.tsx');
    assert.doesNotMatch(src, /onPress/);
    assert.match(src, /kind: 'toggle', id: 'top', label: 'TOP JACK'/);
    assert.match(src, /kind: 'toggle', id: 'bottom', label: 'BOTTOM JACK'/);
    assert.match(src, /kind: 'fader',\s*id: 'insertion',\s*label: 'PLUG INSERTION',/);
  });
  it('the readouts on a rack page are the same resolved flow as the drawing (one status function)', () => {
    assert.match(pp, /export function pairStatus\(/);
    assert.match(pp, /const \{ flow, status, hazard \} = pairStatus\(state, sourceLabel, destLabel, sourceLive\);/);
    assert.match(read('patchbay/rackLayout.tsx'), /const \{ flow, hazard \} = pairStatus\(state, sourceLabel, destLabel, sourceLive\);/);
  });
});
