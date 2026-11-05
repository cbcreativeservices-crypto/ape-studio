/**
 * A12, MEET IT, "The parts": PART = CONSOLE changed the words and 0 pixels of
 * the drawing (owner 2026-11-05, a control passes only if a student can SEE
 * what it promises at 375 wide). The façade had no console branch, only the
 * plan did. Every part PART steps through must now mark the façade, and the
 * console's mark must sit where the model puts the console, at a size a
 * student can find on a phone.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { OrganFacade, HIGHLIGHT } = R(await import('../src/screens/lab/miking/lessons/shared/organ/OrganArt.tsx'));
const { ORGAN_FRONT } = R(await import('../src/screens/lab/miking/lessons/a12Organ/art.tsx'));
const { CONSOLE } = R(await import('../src/screens/lab/miking/lessons/a12Organ/model.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { MARK_MIN_PX } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));

const SRC = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/organ/OrganArt.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** The rack's stage on a 375 pt phone (as in partMarkerVisible_20261105). */
const W = 355;
const H = 290;

type El = { props?: { color?: string; children?: unknown } };
/** How many amber shapes the façade draws for this choice. */
function marks(node: unknown): number {
  if (Array.isArray(node)) return node.reduce((n: number, c) => n + marks(c), 0);
  if (!node || typeof node !== 'object') return 0;
  const p = (node as El).props;
  return (p?.color === HIGHLIGHT ? 1 : 0) + marks(p?.children);
}

describe('A12: the chosen part shows on the façade', () => {
  it('nothing chosen draws no mark, so a mark always means a choice', () => {
    assert.equal(marks(OrganFacade({ hi: null })), 0);
  });

  it('every part PART steps through marks the drawing', () => {
    const parts = (lessonById('A12').model.parts as { id: string; listIn?: string[]; solid?: unknown }[]).filter((p) => !p.listIn && /^org\.(case|great|swell|pedal|positive|console)$/.test(p.id));
    assert.equal(parts.length, 6);
    for (const p of parts) assert.ok(marks(OrganFacade({ hi: p.id })) > 0, `${p.id} changes nothing on the drawing`);
  });

  it('the console reads as a marked area, not only a thin line', () => {
    assert.equal(marks(OrganFacade({ hi: 'org.console' })), 2);
  });

  it('its mark is on the real console, and big enough at 375 wide', () => {
    const m = SRC.match(/const consoleSpot = rr\(CONSOLE\.z0 - (\d+), -CONSOLE\.h - (\d+), CONSOLE\.z1 \+ (\d+), (\d+), \d+\);/);
    assert.ok(m, 'the mark is drawn from the model\'s CONSOLE');
    const [left, top, right, below] = m.slice(1).map(Number);
    const u = [CONSOLE.z0 - left, CONSOLE.z1 + right];
    const v = [-CONSOLE.h - top, below];
    const box = ORGAN_FRONT.box();
    assert.ok(u[0] >= box.u0 && u[1] <= box.u1 && v[0] >= box.v0 && v[1] <= box.v1, 'on the glass');
    const { s } = fitXform('side', box, W, H, 8);
    assert.ok((u[1] - u[0]) * s >= MARK_MIN_PX, `${((u[1] - u[0]) * s).toFixed(1)} pt wide`);
    assert.ok((v[1] - v[0]) * s >= MARK_MIN_PX, `${((v[1] - v[0]) * s).toFixed(1)} pt high`);
  });
});
