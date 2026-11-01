// Cymatics · Other Cymatic Systems · Acoustic levitation (2026-10-31 fact fix).
// A gap of 5 half-wavelengths between two hard surfaces (horn face, reflector) has
// pressure ANTINODES at both ends: p ∝ cos(5πu). Its 5 pressure nodes sit at
// u = 0.1, 0.3, 0.5, 0.7, 0.9, which is where the beads are drawn.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = readFileSync(join(process.cwd(), 'src', 'screens', 'lab', 'cymatics', 'modules', 'modSystems.tsx'), 'utf8').replace(/\r\n/g, '\n');
const LEV = SRC.slice(SRC.indexOf('function LevitationDemo'), SRC.indexOf('THE OTHER THREE GOT A DRAWING'));

describe('Acoustic levitation draws pressure with antinodes at both hard ends', () => {
  it('draws pressure as cos(nπu), not sin(nπu)', () => {
    assert.ok(LEV.includes('Math.cos(n * Math.PI * u) * Math.cos(phase)'));
    assert.ok(!LEV.includes('Math.sin(n * Math.PI * u)'));
  });

  it('draws n beads at the odd tenths, which are the zeros of cos(5πu)', () => {
    assert.ok(LEV.includes('Array.from({ length: n }, (_, k) => k + 1)'));
    assert.ok(LEV.includes('((2 * k - 1) / (2 * n))'));
    const n = 5;
    const us = Array.from({ length: n }, (_, i) => (2 * (i + 1) - 1) / (2 * n));
    assert.deepEqual(us.map((u) => +u.toFixed(2)), [0.1, 0.3, 0.5, 0.7, 0.9]);
    for (const u of us) assert.ok(Math.abs(Math.cos(n * Math.PI * u)) < 1e-9);
    assert.equal(Math.abs(Math.cos(0)), 1); // horn face: antinode
    assert.ok(Math.abs(Math.abs(Math.cos(n * Math.PI)) - 1) < 1e-9); // reflector: antinode
  });

  it('readouts agree with the drawing: 5 nodes, 5 beads', () => {
    assert.ok(SRC.includes("modeLabel: '5 nodes', nodesLabel: '5 beads'"));
    assert.ok(!SRC.includes("nodesLabel: '4 beads'"));
    assert.ok(!SRC.includes('the same nodes as the pipe'));
  });
});
