/**
 * D42 screen item (owner GO 2026-11-01) — Mastering, Module 3, A TREATED ROOM.
 *
 * The drawing used to sit the listener 75 % of the way back (about 1.07 m off
 * the rear wall of a 4.3 m room) and the copy repeated it as "three quarters
 * of the way", against "away from the walls" on the same card. Now the
 * listener sits on the centre line at the common ≈ 38 % starting point, the
 * triangle stays equilateral, and the cabinets clear the front wall.
 *
 * Ratchet: the listener's depth fraction stays within 30–45 %, the geometry
 * stays equilateral and clear of the walls/treatment, and the words
 * "three quarters" never come back to the copy or the guide.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const MA = 'src/screens/lab/mastering';
const stages = read(`${MA}/stages.tsx`);
const room = read(`${MA}/modules/mod3Room.tsx`);
const guides = read(`${MA}/masteringScreenGuides.ts`);

const num = (re: RegExp, src = stages) => {
  const m = src.match(re);
  assert.ok(m, `missing ${re}`);
  return Number(m![1]);
};

// The RoomDiagram body only.
const body = stages.slice(stages.indexOf('export function RoomDiagram'), stages.indexOf('{/* legend */}', stages.indexOf('export function RoomDiagram')));

describe('Mastering room drawing: the listener sits about 38 % of the depth from the front wall', () => {
  const frac = num(/export const ROOM_LISTENER_FRAC = ([\d.]+);/);
  const side = num(/const ROOM_TRI_SIDE = ([\d.]+);/);
  const ry0 = num(/const ry0 = (\d+);/, body);
  const ry1 = num(/const ry1 = (\d+);/, body);
  const rx0 = num(/const rx0 = (\d+);/, body);
  const rx1 = num(/const rx1 = (\d+);/, body);
  const U = 196 / 5.0;

  it('the fraction is between 30 % and 45 % and drives listY', () => {
    assert.ok(frac >= 0.3 && frac <= 0.45, `listener at ${frac}`);
    assert.match(body, /const listY = ry0 \+ ROOM_LISTENER_FRAC \* \(ry1 - ry0\);/);
    const listY = ry0 + frac * (ry1 - ry0);
    const f = (listY - ry0) / (ry1 - ry0);
    assert.ok(f >= 0.3 && f <= 0.45);
    // well away from the rear wall: more than 2 m in this 4.3 m room
    assert.ok((ry1 - listY) / U > 2, `${((ry1 - listY) / U).toFixed(2)} m from the rear wall`);
  });

  it('the triangle stays equilateral (speakers one equilateral height ahead, half a side either side of centre)', () => {
    assert.match(body, /const spkY = listY - \(ROOM_TRI_SIDE \* Math\.sqrt\(3\)\) \/ 2;/);
    assert.match(body, /const lx = cx - ROOM_TRI_SIDE \/ 2;/);
    assert.match(body, /const rxp = cx \+ ROOM_TRI_SIDE \/ 2;/);
    const listY = ry0 + frac * (ry1 - ry0);
    const spkY = listY - (side * Math.sqrt(3)) / 2;
    const cx = (rx0 + rx1) / 2;
    const lx = cx - side / 2;
    const toe = (Math.atan2(cx - lx, listY - spkY) * 180) / Math.PI;
    assert.ok(Math.abs(toe - 30) < 0.01, `toe-in ${toe}`);
    assert.ok(Math.abs(Math.hypot(cx - lx, listY - spkY) - side) < 1e-9);
  });

  it('the toed-in cabinets clear the front wall absorber, and the reflection pads clear the corner traps', () => {
    const listY = ry0 + frac * (ry1 - ry0);
    const spkY = listY - (side * Math.sqrt(3)) / 2;
    const cx = (rx0 + rx1) / 2;
    const w = 0.33 * U;
    const d = 0.4 * U;
    const halfDepthRotated = (w / 2) * Math.sin(Math.PI / 6) + (d / 2) * Math.cos(Math.PI / 6);
    const absorberFace = ry0 + 5; // the 5-unit pad on the front wall
    assert.match(body, /<Rect x=\{cx - 60\} y=\{ry0\} width=\{120\} height=\{5\}/);
    assert.ok(spkY - halfDepthRotated - absorberFace > 2, `cabinet back ${(spkY - halfDepthRotated - absorberFace).toFixed(2)} units off the absorber`);
    // left first-reflection pad (32 tall, centred on lRef) vs the 22-unit corner trap
    const sx = cx - side / 2;
    const mx = 2 * rx0 - cx;
    const t = (rx0 - sx) / (mx - sx);
    const lRef = spkY + t * (listY - spkY);
    assert.match(body, /<Rect x=\{rx0\} y=\{lRef - 13\} width=\{5\} height=\{26\}/);
    // The trap's tip reaches ry0 + 22 plus its stroke and miter (~1 unit):
    // keep a visible gap (D42 checker, 2026-11-01).
    assert.ok(lRef - 13 > ry0 + 22 + 2, `pad top ${lRef - 13} vs trap tip + stroke ${ry0 + 22 + 2}`);
    assert.ok(lRef + 16 < ry1 - 22);
  });
});

describe('Mastering room copy and guide match the drawing', () => {
  it('the Listening position point says center line, equilateral triangle, about 38 %, refined by measuring', () => {
    const point = room.match(/<Point title="Listening position">([^<]*)<\/Point>/);
    assert.ok(point);
    assert.doesNotMatch(point![1], /three quarters/i);
    assert.match(point![1], /center line, at the third corner of an equilateral triangle with the monitors/);
    assert.match(point![1], /about 38% of the way from the front wall to the rear wall, refined by measuring/);
    assert.match(point![1], /away from the walls/);
  });
  it('the room guide bullet matches, and nothing in the guides says "three quarters"', () => {
    assert.doesNotMatch(guides, /three quarters/i);
    assert.match(guides, /third corner of an equilateral triangle with the monitors, away from the walls\. A common start is about 38% of the way back from the front wall, refined by measuring\./);
  });
});
