/**
 * Mic capsule cutaway — the coil moves (owner 2026-11-22, on the iPhone
 * screenshot of Microphone Principles → INSIDE THE CAPSULE: "needs animation
 * showing coil moving around magnet").
 *
 * Receipts for docs/art/mic-cutaway/patch_mic_cutaway.mjs (RN LAB EXPORT) →
 * src/screens/lab/micspeaker/micCutawayAsset.ts → MicCutaway.tsx:
 *   1. every SvgXml layer carries the <defs> it references (2026-09-14: a layer
 *      without them painted an opaque black smear on device);
 *   2. the dome + voice coil are their own moving layer — nothing static still
 *      draws them;
 *   3. over the WHOLE travel the coil stays in the gap, the dome never touches
 *      the pole piece or the front screen, and no lead wire cuts steel;
 *   4. the joints hold at both ends: the roll's inner edge follows the dome, its
 *      outer edge stays clamped, and the leads meet the coil and their fixed run;
 *   5. label dots stay on their parts;
 *   6. the physics is one chain on one clock: dx = X·cos φ, current and glow
 *      ∝ sin φ (velocity), ⊗/⊙ flip where the coil stops, a compression meets
 *      the screen as the coil passes mid-travel;
 *   7. cheap and cross-platform: view-level translate/rotate/scaleX/opacity
 *      only (no skew: Android Views cannot skew), one withRepeat, no JS timers,
 *      the running gate intact.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

type Box = readonly [number, number, number, number];
type Layer = { box: Box; xml: string };
const A = (await import('../src/screens/lab/micspeaker/micCutawayAsset.ts')) as unknown as {
  MIC_LAYERS: Record<string, Layer>;
  MIC_MOTION: {
    travel: number; rollArm: number; rollUpperPivot: readonly [number, number]; rollLowerPivot: readonly [number, number];
    leadPivotX: number; leadASpan: number; leadBSpan: number; waveStep: number; waveClipX: number; nearClipX: number;
  };
  MIC_VIEWBOX_BOX: Box;
};
const L = A.MIC_LAYERS;
const M = A.MIC_MOTION;
const X = M.travel;
const TSX = 'src/screens/lab/micspeaker/MicCutaway.tsx';
const DX = Array.from({ length: 33 }, (_, i) => -X + (2 * X * i) / 32); // the whole travel

const pts = (xml: string, id: string): number[][] => {
  const m = xml.match(new RegExp(`id="${id}"[^>]*points="([^"]+)"|points="([^"]+)"[^>]*id="${id}"`));
  assert.ok(m, `#${id} not found`);
  return (m[1] ?? m[2]).trim().split(/\s+/).map((p) => p.split(',').map(Number));
};
/** Dense samples along a polyline (segments, not just vertices). */
const dense = (P: number[][]) => P.slice(1).flatMap((p, i) =>
  Array.from({ length: 21 }, (_, t) => [P[i][0] + ((p[0] - P[i][0]) * t) / 20, P[i][1] + ((p[1] - P[i][1]) * t) / 20]));
/** RN rotate(θ) about the view centre (clockwise on screen, y down). */
const rot = ([x, y]: number[], [px, py]: readonly number[], th: number) =>
  [px + (x - px) * Math.cos(th) - (y - py) * Math.sin(th), py + (x - px) * Math.sin(th) + (y - py) * Math.cos(th)];
const rollTheta = (dx: number, upper: boolean) => (upper ? -1 : 1) * Math.asin(dx / M.rollArm);

describe('mic cutaway coil motion: layers', () => {
  it('every layer is a self-contained SVG: its viewBox is its box and every url(#…) is defined inside it', () => {
    for (const [name, l] of Object.entries(L)) {
      assert.ok(l.xml.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l.box.join(' ')}">`), `${name}: viewBox ≠ box`);
      const refs = [...l.xml.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
      const defs = (l.xml.match(/<defs>[\s\S]*?<\/defs>/) ?? [''])[0];
      for (const r of refs) assert.match(defs, new RegExp(`id="${r}"`), `${name}: url(#${r}) has no definition in this layer`);
    }
  });
  it('the dome + voice coil are their own moving layer; no static layer still draws them', () => {
    for (const id of ['diaphragm', 'voiceCoil']) assert.match(L.moving.xml, new RegExp(`<g id="${id}">`));
    for (const name of ['under', 'overA', 'overB']) {
      assert.doesNotMatch(L[name].xml, /id="(diaphragm|voiceCoil|rollUpper|rollLower|cfMoving|glowHalo|leadA_move|leadB_move)"/, name);
    }
    assert.match(L.rollUpper.xml, /id="rollUpper"/);
    assert.match(L.rollLower.xml, /id="rollLower"/);
    assert.match(L.currentPos.xml, /<g id="cfMoving"/);
    assert.match(L.glow.xml, /<g id="glowHalo" opacity="1">/);
    // the two current half-cycles differ ONLY in which ⊗/⊙ marks are shown
    assert.match(L.currentPos.xml, /<g id="cfDirTopX">[\s\S]*<circle id="cfDirTopO" display="none"[\s\S]*<g id="cfDirBotX" display="none">/);
    assert.match(L.currentNeg.xml, /<g id="cfDirTopX" display="none">[\s\S]*<circle id="cfDirTopO" cx[\s\S]*<g id="cfDirBotX">[\s\S]*<circle id="cfDirBotO" display="none"/);
  });
  it('rotated and scaled layers are boxed about their pivot (React Native transforms about the view centre)', () => {
    const centre = (b: Box) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
    assert.deepEqual(centre(L.rollUpper.box), [...M.rollUpperPivot]);
    assert.deepEqual(centre(L.rollLower.box), [...M.rollLowerPivot]);
    for (const n of ['leadA', 'leadB', 'currentLeadA', 'currentLeadB']) assert.equal(centre(L[n].box)[0], M.leadPivotX, n);
    assert.deepEqual(L.currentLeadA.box, L.leadA.box);
    assert.deepEqual(L.currentLeadB.box, L.leadB.box);
  });
});

describe('mic cutaway coil motion: real parts, real clearances, over the whole travel', () => {
  it('travel X = 4 units: about ±4.5 pt on a 340-pt card, ~9 pt end to end', () => {
    assert.equal(X, 4);
    const k = 340 / A.MIC_VIEWBOX_BOX[2];
    assert.ok(X * k > 4.4 && X * k < 4.6);
  });
  it('the coil stays inside the gap slot and keeps covering most of it', () => {
    // voice coil sections: x 131→150, y 126.5–130.5 (upper) / 229.5–233.5 (lower)
    assert.match(L.moving.xml, /<rect x="131" y="126\.5" width="19" height="4"/);
    assert.match(L.moving.xml, /<rect x="131" y="229\.5" width="19" height="4"/);
    // gap: pole plate face y 124 / 236, pole piece y 132 / 228, x 134→146
    assert.match(L.under.xml, /M60 76 L146 76 L146 124 L134 124 L134 84 L72 84 L72 276 L134 276 L134 236 L146 236 L146 284 L60 284 Z/);
    assert.match(L.under.xml, /M124 132 L146 132 L146 228 L124 228 Z/);
    for (const dx of DX) {
      const [x0, x1] = [131 + dx, 150 + dx];
      assert.ok(x0 >= 72 && x0 <= 135 && x1 >= 146, `coil leaves the gap at dx=${dx}`);
      assert.ok(Math.min(x1, 146) - Math.max(x0, 134) >= 11, `coil covers < 11 of the 12-unit gap at dx=${dx}`);
    }
  });
  it('the dome never touches the pole piece (in) or the front screen (out)', () => {
    // film outer arc R 140.2 through (150,128)/(150,232); inner R 139.2 through (149,128.4)/(149,231.6)
    assert.match(L.moving.xml, /M150 128 A140\.2 140\.2 0 0 1 150 232 L149 231\.6 A139\.2 139\.2 0 0 0 149 128\.4 Z/);
    const cx = (x: number, r: number, h: number) => x - Math.sqrt(r * r - h * h); // centre on the axis y 180
    const cOut = cx(150, 140.2, 52), cIn = cx(149, 139.2, 51.6);
    const filmIn = (rr: number) => cIn + Math.sqrt(139.2 ** 2 - rr ** 2);
    const apex = cOut + 140.2;
    // fully IN (dx = −X): the inner film face over the pole face (r ≤ 48) clears x 146,
    // and the dome's chord (the dark interior) meets the pole face, never past it
    for (let rr = 0; rr <= 48; rr += 1) assert.ok(filmIn(rr) - X >= 146.3, `film hits the pole piece at r=${rr}`);
    assert.ok(150 - X >= 146);
    // fully OUT (dx = +X): the apex stays short of the front screen's inner face (x 166)
    assert.match(L.under.xml, /<rect x="166" y="84" width="2" height="192"/);
    assert.ok(apex + X <= 166 - 1.5, `apex ${apex + X}`);
  });
  it('no lead wire cuts steel: the flexing runs stay in the rear cavity or the gap clearance', () => {
    const air = ([x, y]: number[]) =>
      (x >= 72.8 && x <= 133.2 && y >= 84.8 && y <= 131.2) || // rear cavity, 0.8 off steel
      (x >= 72.8 && x <= 145.2 && y >= 124.8 && y <= 131.2); // the gap slot under the pole plate
    for (const [id, span] of [['leadA_move', M.leadASpan], ['leadB_move', M.leadBSpan]] as const) {
      const lay = id === 'leadA_move' ? L.leadA : L.leadB;
      const P = pts(lay.xml, id);
      assert.deepEqual(pts(lay.xml, id.replace(/^lead([AB])_move$/, 'lead$1Sh_move')), P, 'the dark outline follows the same run');
      for (const dx of DX) {
        const s = (span + dx) / span;
        for (const [x, y] of dense(P)) {
          const q = [M.leadPivotX + (x - M.leadPivotX) * s, y];
          assert.ok(air(q), `${id} at (${q[0].toFixed(2)},${y}) cuts steel at dx=${dx}`);
        }
      }
    }
  });
});

describe('mic cutaway coil motion: no tearing at either end', () => {
  it('each lead meets its lead-out on the coil and its fixed run at the dressing point, at every dx', () => {
    for (const [lay, id, fixedLay, fixedId, span, leadOut] of [
      [L.leadA, 'leadA_move', L.overA, 'leadA_fixed', M.leadASpan, [131, 126.2]],
      [L.leadB, 'leadB_move', L.overA, 'leadB_fixed', M.leadBSpan, [134, 126.2]],
    ] as const) {
      const P = pts(lay.xml, id), F = pts(fixedLay.xml, fixedId);
      assert.deepEqual(P[0], [...leadOut], `${id} starts at its lead-out`);
      assert.deepEqual(P[P.length - 1], [M.leadPivotX, F[0][1]], `${id} ends where its fixed run starts`);
      assert.equal(F[0][0], M.leadPivotX);
      assert.equal(span, leadOut[0] - M.leadPivotX);
      for (const dx of DX) {
        const s = (span + dx) / span;
        assert.ok(Math.abs(M.leadPivotX + (P[0][0] - M.leadPivotX) * s - (leadOut[0] + dx)) < 1e-9, 'lead-out follows the coil exactly');
      }
    }
    // the coil's own lead-out stubs are on the moving layer
    assert.match(L.moving.xml, /id="leadOutA" points="131\.5,126\.7 131,126\.2"/);
    assert.match(L.moving.xml, /id="leadOutB" points="134\.5,126\.7 134,126\.2"/);
    // stacking at the joint: fixed outline (under) < moving lead (its own layer) < fixed copper (overA)
    assert.match(L.under.xml, /id="leadASh_fixed"[\s\S]*id="leadBSh_fixed"/);
    assert.doesNotMatch(L.under.xml, /id="lead[AB]_fixed"/);
    assert.match(L.overA.xml, /id="leadA_fixed"[\s\S]*id="leadB_fixed"/);
  });
  it('the roll rotates about its clamped outer edge: the inner edge follows the dome, the outer edge stays put', () => {
    const U = pts(L.rollUpper.xml, 'rollUpper'), D = pts(L.rollLower.xml, 'rollLower');
    assert.deepEqual([U[0], U[32]], [[150, 128], [150, 98]]); // inner attach, outer attach
    assert.deepEqual([D[0], D[32]], [[150, 232], [150, 262]]);
    // the coil-seat wedges ride with the dome and cover the inner joint (x 148.6–151.2, y 127.2–129.4 / 230.6–232.8)
    assert.match(L.moving.xml, /M148\.6 127\.2 L151\.2 127\.2 L150\.4 129\.4 L149\.2 129\.4 Z M148\.6 232\.8 L151\.2 232\.8 L150\.4 230\.6 L149\.2 230\.6 Z/);
    for (const dx of DX) {
      for (const [P, piv, upper, inner] of [[U, M.rollUpperPivot, true, [128, 127]], [D, M.rollLowerPivot, false, [232, 233]]] as const) {
        const th = rollTheta(dx, upper);
        // inner attach: within 0.3 of the dome edge, and inside the wedge's reach
        for (const yy of inner) {
          const [x, y] = rot([150, yy], piv, th);
          assert.ok(Math.abs(x - (150 + dx)) <= 0.3, `roll inner x off by ${x - 150 - dx} at dx=${dx}`);
          assert.ok(Math.abs(y - yy) <= 0.35, `roll inner y off by ${y - yy} at dx=${dx}`);
        }
        // outer attach: barely moves (clamped under the rim)
        for (const q of [P[31], P[32], P[33]]) {
          const [x, y] = rot(q, piv, th);
          assert.ok(Math.hypot(x - q[0], y - q[1]) <= 0.15, `roll outer edge moves at dx=${dx}`);
        }
      }
    }
    // the rim flanges that clamp the roll are static
    assert.match(L.under.xml, /<rect x="149\.6" y="86" width="0\.8" height="12"/);
    assert.match(L.under.xml, /<rect x="149\.6" y="262" width="0\.8" height="12"/);
  });
});

describe('mic cutaway coil motion: labels still land', () => {
  it('DIAPHRAGM and COMPLIANT ROLL dots ride with their parts; VOICE COIL points where the coil always is', () => {
    const dotRe = (x: number, y: number) => new RegExp(`<circle cx="${x}" cy="${y}" r="1\\.2"`);
    assert.match(L.moving.xml, dotRe(156.75, 150));
    assert.match(L.rollUpper.xml, dotRe(156, 113));
    assert.doesNotMatch(L.overB.xml, dotRe(156.75, 150));
    assert.doesNotMatch(L.overB.xml, dotRe(156, 113));
    // leaders that point at moving parts are horizontal — along the motion — so the dot slides along its own leader
    assert.match(L.overB.xml, /points="188,150 158,150"/);
    assert.match(L.overB.xml, /points="188,113 157\.5,113"/);
    // VOICE COIL: x 136.5 is on the coil's lower section for the whole travel (131+dx … 150+dx)
    assert.match(L.overB.xml, dotRe(136.5, 232));
    assert.match(L.overB.xml, /points="141,308 141,236 137,232\.6"/);
    for (const dx of DX) assert.ok(131 + dx <= 136.5 - 1.2 && 150 + dx >= 136.5 + 1.2);
    // fixed parts' labels are unchanged
    for (const [x, y] of [[140.5, 232], [140.5, 248], [140.5, 266], [146, 200], [167, 100], [101.69, 118.76]]) assert.match(L.overB.xml, dotRe(x, y));
  });
  it('the on-art caveat keeps the shipped copy (travel exaggerated ~1,000×; the mass-controlled note)', () => {
    assert.match(L.overB.xml, /SIMPLIFIED MODEL<\/tspan> — coil speed follows the sound; travel<\/text>/);
    assert.match(L.overB.xml, /exaggerated ~1,000×; output assumes a connected load\.<\/text>/);
    assert.match(L.overB.xml, /In a real cardioid, the diaphragm’s position runs<\/text>/);
    assert.match(L.overB.xml, /about 180° behind the force pushing it\.<\/text>/);
  });
});

describe('mic cutaway coil motion: one chain on one clock', () => {
  const c = code(TSX);
  it('the coil, roll and leads move from the displacement dx = X·cos φ', () => {
    assert.equal((c.match(/translateX: X \* Math\.cos\(TAU \* phase\.value\) \* k/g) ?? []).length, 3); // assembly, amber+glow, dome-face wash
    assert.match(c, /const dx = X \* Math\.cos\(TAU \* phase\.value\);\s*return \{ transform: \[\{ rotate: `\$\{-Math\.asin\(dx \/ ARM\)\}rad` \}\] \};/);
    assert.match(c, /const dx = X \* Math\.cos\(TAU \* phase\.value\);\s*return \{ transform: \[\{ rotate: `\$\{Math\.asin\(dx \/ ARM\)\}rad` \}\] \};/);
    assert.match(c, /scaleX: \(SPAN_A \+ X \* Math\.cos\(TAU \* phase\.value\)\) \/ SPAN_A/);
    assert.match(c, /scaleX: \(SPAN_B \+ X \* Math\.cos\(TAU \* phase\.value\)\) \/ SPAN_B/);
  });
  it('current and glow follow the VELOCITY (sin φ): brightest mid-travel, nothing at the ends, ⊗/⊙ flip where the coil turns', () => {
    assert.match(c, /const s = Math\.sin\(2 \* Math\.PI \* phase\.value\);\s*return \{ opacity: Math\.max\(0, s\) \};/);
    assert.match(c, /const s = Math\.sin\(2 \* Math\.PI \* phase\.value\);\s*return \{ opacity: Math\.max\(0, -s\) \};/);
    assert.match(c, /const s = Math\.sin\(2 \* Math\.PI \* phase\.value\);\s*return \{ opacity: Math\.abs\(s\) \};/);
    assert.match(c, /return \{ opacity: Math\.abs\(Math\.sin\(TAU \* phase\.value\)\) \};/);
    assert.equal((c.match(/opacity: Math\.abs\(Math\.sin\(p\)\), transform: \[\{ scaleX/g) ?? []).length, 2);
    // the model, numerically: position x = X·cos φ ⇒ screen velocity −2πX·sin φ;
    // inward speed ∝ sin φ = the current's sign and size
    for (let i = 0; i < 400; i++) {
      const p = i / 400, h = 1e-6;
      const x = X * Math.cos(2 * Math.PI * p);
      const vIn = -(X * Math.cos(2 * Math.PI * (p + h)) - X * Math.cos(2 * Math.PI * (p - h))) / (2 * h);
      const cur = Math.sin(2 * Math.PI * p);
      assert.ok(Math.abs(vIn / (2 * Math.PI * X) - cur) < 1e-5, 'current ∝ inward velocity');
      if (Math.abs(Math.abs(x) - X) < 1e-9) assert.ok(Math.abs(cur) < 1e-6, 'current is zero where the coil stops');
      if (Math.abs(x) < 1e-9) assert.ok(Math.abs(Math.abs(cur) - 1) < 1e-6, 'current peaks mid-travel');
    }
    // the ⊗/⊙ flip (sign change of sin φ) happens at φ = 0, ½ — exactly the ends of the travel
    for (const p of [0, 0.5]) assert.equal(Math.abs(Math.cos(2 * Math.PI * p)), 1);
  });
  it('the sound field rides the SAME clock: one wavelength per period, a compression at the screen as the coil passes mid-travel', () => {
    assert.doesNotMatch(c, /\bmarch\b|WAVE_MS/);
    assert.match(c, /const f = phase\.value - Math\.floor\(phase\.value\);\s*return \{ transform: \[\{ translateX: -f \* WAVE_STEP \* k \}\] \};/);
    assert.equal(M.waveStep, 34);
    const sfC0 = Number(L.wave.xml.match(/id="sfC0" x1="([\d.]+)"/)![1]);
    const sfC1 = Number(L.wave.xml.match(/id="sfC1" x1="([\d.]+)"/)![1]);
    assert.equal(sfC1 - sfC0, M.waveStep);
    assert.equal(sfC0 - 0.25 * M.waveStep, M.waveClipX); // at φ = ¼ (velocity peak) the front is AT the screen face
    assert.match(c, /return \{ opacity: Math\.max\(0, Math\.sin\(TAU \* phase\.value\)\) \};/); // dome-face compression
    assert.match(c, /return \{ opacity: Math\.max\(0, -Math\.sin\(TAU \* phase\.value\)\) \};/); // … rarefaction
    assert.match(L.nearComp.xml, /id="sfNearComp"[^>]*fill-opacity="0\.12"/);
    assert.doesNotMatch(L.wave.xml, /sfNear/);
  });
});

describe('mic cutaway coil motion: cheap, cross-platform, gated', () => {
  const c = code(TSX);
  it('one UI-thread clock, no JS timers, no per-frame SVG work', () => {
    assert.equal((c.match(/\bwithRepeat\(/g) ?? []).length, 1);
    assert.equal((c.match(/\buseSharedValue\(/g) ?? []).length, 1);
    assert.doesNotMatch(c, /setInterval|setTimeout|requestAnimationFrame|InteractionManager|useFrameCallback|useAnimatedProps|useState/);
    assert.doesNotMatch(c, /<SvgXml[^>]*\{\s*`/); // xml never built per render
    assert.match(c, /xml=\{l\.xml\}/);
  });
  it('only transforms an Android View and an iOS layer both apply: translate, rotate, scaleX (never skew)', () => {
    assert.doesNotMatch(c, /skew|perspective|matrix/i);
    const used = new Set([...c.matchAll(/\{ (translateX|translateY|rotate|scaleX|scaleY|scale): /g)].map((m) => m[1]));
    assert.deepEqual([...used].sort(), ['rotate', 'scaleX', 'translateX']);
  });
  it('the running gate cancels the clock and parks at the rest still (φ = ¼: mid-travel, full current)', () => {
    assert.match(c, /if \(!running\) \{\s*cancelAnimation\(phase\);\s*phase\.value = 0\.25;\s*return;\s*\}/);
    assert.match(c, /return \(\) => \{\s*cancelAnimation\(phase\);\s*\};\s*\}, \[running, phase\]\);/);
    assert.match(c, /useSharedValue\(0\.25\)/);
  });
  it('a LESSON display: still exempt from the decorative gate, as the owner ruled (2026-10-02)', () => {
    assert.doesNotMatch(c, /useDecorativeMotion|useAnimationsAllowed|useReducedMotion/);
    assert.match(read('test/patternP10b_20261002.test.ts'), /'src\/screens\/lab\/micspeaker\/MicCutaway\.tsx': 'the diaphragm motion IS the lesson/);
  });
  it('the generator, not a hand edit, made the asset', () => {
    assert.match(read('src/screens/lab/micspeaker/micCutawayAsset.ts'), /GENERATED by docs\/art\/mic-cutaway\/patch_mic_cutaway\.mjs/);
    const script = read('docs/art/mic-cutaway/patch_mic_cutaway.mjs');
    assert.match(script, /showing coil moving around magnet/);
    assert.match(script, /coil speed follows the sound; travel/);
  });
});
