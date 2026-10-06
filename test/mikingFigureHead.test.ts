/**
 * Miking Labs — the player's HEAD is drawn as part of the figure (owner,
 * Pixel 2026-10-06: "on human figures do not replace the head with the
 * separate head icon, they look too dissimilar and disjunct").
 *
 * The lab figures used the house line-art head icon (a light stroke over a
 * dark translucent fill: brows, nose, mouth, ears) on a shaded, gradient-lit
 * body. Every lab figure now paints its head as one more body mass in the
 * skin tone (players/PlayerFigure.FigureHead → FigureMass 'skin'; the sax,
 * low-brass, free-reed and harmonica figures with their own skin masses),
 * joined to the collar by a neck, adult-proportioned. The head-icon spec still
 * applies to avatars elsewhere in the app — just not to lab figures.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = 'src/screens/lab/miking';
const files: string[] = [];
const walk = (d: string) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(n)) files.push(p.replace(/\\/g, '/'));
  }
};
walk(ROOT);
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('lab figures: the head belongs to the body', () => {
  it('no lab figure draws the line-art head icon (LineHead / HEAD_LINE / a translucent HEAD_FILL)', () => {
    const bad = files.filter((f) => /\bLineHead\b|\bHEAD_LINE\b|\bHEAD_FILL\b/.test(code(readFileSync(f, 'utf8'))));
    assert.deepEqual(bad, []);
  });
  it('FigureHead paints the head as a skin-tone body mass (the same light, rim, core shadow and contour)', () => {
    const s = readFileSync(`${ROOT}/lessons/shared/players/PlayerFigure.tsx`, 'utf8');
    assert.match(s, /export function FigureHead\(\{ fill \}: \{ fill: SkPath \}\) \{\n\s*return <FigureMass path=\{fill\} tone="skin"/);
    assert.match(s, /<FigureHead fill=\{b\.head\.fill\} \/>/);
  });
  it('the front head is one outline with its ears and its neck down to the collar', () => {
    const s = readFileSync(`${ROOT}/lessons/shared/players/PlayerFigure.tsx`, 'utf8');
    assert.match(s, /const fill = union\(skull, \.\.\.ears, capsule\(P\(0, 80\), P\(0, nb - 6\)/);
  });
  it('every family that draws its own figure uses its own skin mass for the head', () => {
    for (const [f, re] of [
      ['lessons/shared/sax/SaxArt.tsx', /return <FigureHead fill=\{h\.fill\} \/>/],
      ['lessons/shared/bowed/BowedArt.tsx', /<FigureHead fill=\{it\.head\.paths\.fill\} \/>/],
      ['lessons/shared/lutes/lutePlayers.tsx', /<FigureHead fill=\{head\.fill\} \/>/],
      ['lessons/shared/lowbrass/LowBrassArt.tsx', /<Lit path=\{head\} pts=\{headPts\} ramp=\{SKIN\} \/>/],
      ['lessons/shared/freereed/PlayerProfile.tsx', /<SkinArt path=\{b\.head\.fill\} \/>/],
      ['lessons/a10Harmonica/art.tsx', /<MassArt path=\{face\} ramp=\{SKIN\}/],
    ] as const) {
      assert.match(readFileSync(`${ROOT}/${f}`, 'utf8'), re, f);
    }
  });
  it('an adult head is about 1/7.5 of the standing height (BODY.headH against a 1.7 m figure)', async () => {
    const { BODY } = await import('../src/screens/lab/miking/lessons/shared/players/playerPose.ts');
    const ratio = 1700 / BODY.headH;
    assert.ok(ratio > 6.8 && ratio < 8.2, `1 : ${ratio.toFixed(1)}`);
  });
});
