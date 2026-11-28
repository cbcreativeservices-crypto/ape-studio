/**
 * Fix-next, group CYM (owner 2026-11-25: "Fix-first 15", then "continue with
 * next fixes"). Round-2 checker corrections Y1–Y5 on round-1 item 15, then the
 * remaining Cymatics rows of the lab controls audit
 * (Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md, rows 11–14, 17, 18, 23, 24).
 *
 *  Y1  the sand forms its figure from NEAR (on a mode?), damping blurs it
 *  Y2  one stated compressive LEVEL → heat curve; default pictures bright
 *  Y3  sentences made true again
 *  Y4  LEVEL recolours the cells, it does not rebuild the meshes
 *  Y5  every plate demo reads RESPONSE against the fixed reference
 *  11  Liquid waveform: what is heard and what is drawn, said apart
 *  12  Liquid below threshold: the surface rides at the drive rate
 *  13  Systems water: the half-rate ripple no longer snaps once per shake
 *  14  Liquid contours fade with SHAKE and trace the drawn (A+B) pattern
 *  17  Plate driver puck sits where the plate is driven
 *  18  Plate SECOND TONE: every readout describes the same tone
 *  23  Plate slow motion slows the sand
 *  24  Harmonics: RATIO / FREQ describe the shown ladder
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const src = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const PM = await import('../src/features/cymatics/plateModes.ts');
const G = await import('../src/features/cymatics/vizGain.ts');
const LM = await import('../src/features/cymatics/liquidMotion.ts');
const LC = await import('../src/features/tools/levelColor.ts');
const ML = await import('../src/features/cymatics/modalLibrary.ts');

const CYM = 'src/screens/lab/cymatics';
const plate = PM.DEFAULT_PLATE;
const modes = PM.plateModes(plate, 16);
const DAMPS = { Low: 0.1, Medium: 0.4, High: 0.85 } as const;
const at = (f: number, d: number) => PM.readResonance(f, modes, PM.effectiveQ(plate.material, d), PM.plateRefQ(plate.material));
const ON = 191.1; // (2,2), the studio's LAND ON target
const OFF = 240; // the studio's opening frequency, between modes

// ── Y1 ────────────────────────────────────────────────────────────────────
describe('Y1 · the sand forms a figure on a mode at every damping; damping blurs it', () => {
  const sand = (f: number, d: number, L: number) => {
    const r = at(f, d);
    return G.sandDrive(L, r.near, PM.plateQRel(plate.material, d));
  };
  it('on the mode at High damping the sand is thrown as hard as at Low (round 1: 0.014 vs 0.289 at LEVEL 30 %)', () => {
    const low = sand(ON, DAMPS.Low, 0.3);
    const high = sand(ON, DAMPS.High, 0.3);
    assert.ok(high.agit > 0.95 * low.agit, `${high.agit} vs ${low.agit}`);
  });
  it('between modes there is no figure at any damping: on-mode agitation ≥ 20× off-mode', () => {
    for (const d of Object.values(DAMPS)) {
      const on = sand(ON, d, 0.3).agit;
      const off = sand(OFF, d, 0.3).agit;
      assert.ok(on > 20 * off, `damping ${d}: on ${on}, off ${off}`);
    }
  });
  it('damping BLURS: slower settling (kick) and wider still lines (settle band) as damping rises', () => {
    const [l, m, h] = [DAMPS.Low, DAMPS.Medium, DAMPS.High].map((d) => sand(ON, d, 0.3));
    assert.ok(l.kick > m.kick && m.kick > h.kick);
    assert.ok(l.settleScale < m.settleScale && m.settleScale < h.settleScale);
    assert.equal(l.settleScale, 1);
  });
  it('at Low the shiver (agitation, jitter) is exactly what it was before round 1', () => {
    const Q = PM.effectiveQ(plate.material, DAMPS.Low);
    for (const f of [60, 120, ON, OFF, 400, 900, 2000]) {
      const s = PM.readResonance(f, modes, Q).strength; // the old normalisation (HEAD)
      for (const L of [0.2, 0.3, 1]) {
        const now = sand(f, DAMPS.Low, L);
        const agitOld = L * (0.04 + 0.96 * s * s); // HEAD vizPlate.tsx: const agit = a * (0.04 + 0.96 * s * s)
        assert.ok(Math.abs(now.agit - agitOld) < 1e-12, `${f} Hz`);
        assert.ok(Math.abs(now.jit - 0.09 * agitOld) < 1e-12);
      }
    }
  });
  it('the 0.04 floor feeds the shiver only: between modes the walk to the lines is ~0, on a mode within 4 % of HEAD', () => {
    const Q = PM.effectiveQ(plate.material, DAMPS.Low);
    for (const L of [0.3, 1]) {
      const off = sand(OFF, DAMPS.Low, L);
      assert.ok(off.kick < 1e-3 * L, `${off.kick}`);
      assert.ok(off.jit > 0, 'it still shivers');
      const s = PM.readResonance(ON, modes, Q).strength;
      const kickHead = 2.2 * L * (0.04 + 0.96 * s * s);
      const on = sand(ON, DAMPS.Low, L);
      assert.ok(on.kick < kickHead && on.kick > 0.95 * kickHead, `${on.kick} vs ${kickHead}`);
    }
  });
  it('NEAR does not move with damping on the mode; RESPONSE does', () => {
    for (const d of Object.values(DAMPS)) assert.ok(at(ON, d).near > 0.97);
    assert.ok(at(ON, DAMPS.High).strength < 0.1);
  });
  it('the plate view drives the sand from near + damping, never from RESPONSE', () => {
    const v = src(`${CYM}/vizPlate.tsx`);
    assert.match(v, /const sand = sandDrive\(p\.amplitude, p\.near, plateQRel\(spec\.material, spec\.damping\)\);/);
    assert.match(v, /const settle = \(0\.035 \+ 0\.05 \* frictionSV\.value\) \* settleScaleSV\.value;/);
    assert.doesNotMatch(v, /const agit = /);
    assert.match(v, /near: number;/);
    // PHASE / NODES show the shape that would form: their opacity follows near too.
    assert.match(v, /const shapeK = heatStrengthK\(p\.near\);/);
    assert.match(src(`${CYM}/vizMembrane.tsx`), /const shapeK = heatStrengthK\(p\.near\);/);
  });
  it('every PlateView / MembraneView passes near', () => {
    for (const f of ['PlateStudioScreen.tsx', 'CymaticsHomeScreen.tsx', 'modules/shared.tsx', 'modules/modNodes.tsx', 'modules/modChange.tsx', 'MembraneStudioScreen.tsx']) {
      assert.match(src(`${CYM}/${f}`), /near=\{/, f);
    }
  });
});

// ── Y2 ────────────────────────────────────────────────────────────────────
describe('Y2 · LEVEL → heat: g = ln(1 + 50·L) / ln(51)', () => {
  it('LEVEL 0 is dark; the opening 30 % is bright (≥ 0.7 of full scale on a full response); 100 % is full', () => {
    assert.equal(G.heatLevelGain(0), 0);
    assert.equal(G.heatGainK(0, 1), 0);
    assert.ok(G.heatGainK(0.3, 1) >= 0.7, `${G.heatGainK(0.3, 1)}`);
    // the studio's opening picture on its mode (RESPONSE 98 %): 0.705 × 0.982
    assert.ok(G.heatGainK(0.3, at(ON, DAMPS.Low).strength) >= 0.69, 'the studio opening picture on its mode');
    assert.equal(G.heatLevelGain(1), 1);
  });
  it('brightness rises strictly with LEVEL', () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const g = G.heatLevelGain(i / 100);
      assert.ok(g > prev, `${i} %`);
      prev = g;
    }
  });
  it('the top of the fader still visibly brightens: g(1) − g(0.6) ≥ 0.10 (checker round 2)', () => {
    assert.ok(G.heatLevelGain(1) - G.heatLevelGain(0.6) >= 0.1, `${G.heatLevelGain(1) - G.heatLevelGain(0.6)}`);
    assert.ok(G.heatLevelGain(1) - G.heatLevelGain(0.8) >= 0.05);
  });
  it('the stated curve: g(.3) ≈ 0.705, g(.6) ≈ 0.873, g(.8) ≈ 0.944 (demo views about 6 % below their look before round 1)', () => {
    assert.ok(Math.abs(G.heatLevelGain(0.3) - 0.705) < 0.002);
    assert.ok(Math.abs(G.heatLevelGain(0.6) - 0.873) < 0.002);
    assert.ok(Math.abs(G.heatLevelGain(0.8) - 0.944) < 0.002);
    assert.ok(G.heatLevelGain(0.3) >= 0.7);
  });
  it('the plate and drum heat colours use the one curve', () => {
    const p = src(`${CYM}/vizPlate.tsx`);
    const d = src(`${CYM}/vizMembrane.tsx`);
    assert.match(p, /const heatK = heatGainK\(p\.amplitude, p\.strength\);/);
    assert.match(d, /const heatK = heatGainK\(p\.amplitude, p\.strength\);/);
    assert.match(d, /const levelK = heatLevelGain\(p\.amplitude\);/);
    assert.match(d, /Math\.abs\(v\) \* levelK \* \(0\.35 \+ 0\.65 \* coneExc\)/);
  });
});

// ── Y3 ────────────────────────────────────────────────────────────────────
describe('Y3 · the sentences are true again', () => {
  it('Change One Thing no longer promises a bright heat map at AT for damping', () => {
    const m = src(`${CYM}/modules/modChange.tsx`);
    assert.doesNotMatch(m, /AT RESONANCE with a bright, full heat map/);
    assert.match(m, /unless damping has lowered the peak/);
    // and it is true: B on High is AT with a dim map
    const r = at(ON, DAMPS.High);
    assert.equal(r.state, 'at');
    assert.ok(G.heatGainK(0.8, r.strength) < 0.3);
    const g = src(`${CYM}/cymaticsScreenGuides.ts`);
    assert.match(g, /AT, sand on lines, a bright map unless damping lowers it/);
  });
  it('Nodes guide line "a bright heat map" on a mode is true (LEVEL 80 %, Low damping)', () => {
    const ex = modes.filter((m: { drive: number }) => m.drive > 0.05);
    const r = at(ex[0].hz, plate.damping);
    assert.equal(r.state, 'at');
    assert.ok(G.heatGainK(0.8, r.strength) > 0.9);
  });
  it('the Predict experiment says "brightest antinodes": the opening 30 % peaks orange, not red', () => {
    assert.match(src('src/features/cymatics/presets.ts'), /thrown off the brightest antinodes/);
    assert.ok(G.heatGainK(0.3, at(ON, DAMPS.Low).strength) < 0.8);
  });
});

// ── Y4 ────────────────────────────────────────────────────────────────────
describe('Y4 · LEVEL recolours, it does not rebuild the meshes', () => {
  it('heatColorFast matches heatColor to within 1 / 255 per channel', () => {
    const rgb = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
    for (let i = 0; i <= 5000; i++) {
      const t = i / 5000;
      const a = rgb(LC.heatColor(t));
      const b = rgb(G.heatColorFast(t));
      for (let c = 0; c < 3; c++) assert.ok(Math.abs(a[c] - b[c]) <= 1, `t=${t}`);
    }
    assert.equal(G.heatColorFast(0), LC.heatColor(0));
    assert.equal(G.heatColorFast(1), LC.heatColor(1));
  });
  it('geometry memos do not depend on heatK; the colour memos do', () => {
    const p = src(`${CYM}/vizPlate.tsx`);
    assert.match(p, /\}, \[N, ox, oy, plateW, plateH\]\);/);
    assert.match(p, /\}, \[grid, N, view, heatK\]\);/);
    assert.match(p, /\}, \[grid, N\]\);/);
    assert.match(p, /\}, \[grid3d, heatK, is3d\]\);/);
    assert.doesNotMatch(p, /heatColor\(/);
    const d = src(`${CYM}/vizMembrane.tsx`);
    assert.match(d, /\}, \[grid, N, view, ox, oy, D\]\);/);
    assert.match(d, /\}, \[grid, N, view, heatK\]\);/);
    assert.match(d, /\}, \[grid3d, heatK, is3d\]\);/);
    assert.match(d, /\}, \[coneGridIn, spk\]\);/);
    assert.match(d, /\}, \[coneGridIn, frontGeom, coneExc, levelK\]\);/);
    assert.doesNotMatch(d, /heatColor\(/);
  });
});

// ── Y5 ────────────────────────────────────────────────────────────────────
describe('Y5 · the plate demos read RESPONSE against plateRefQ', () => {
  it('home hero, the modules card and Nodes pass plateRefQ(spec.material)', () => {
    assert.match(src(`${CYM}/CymaticsHomeScreen.tsx`), /readResonance\(f, modes, Q, plateRefQ\(spec\.material\)\)/);
    assert.match(src(`${CYM}/modules/shared.tsx`), /readResonance\(hz, modes, Q, plateRefQ\(spec\.material\)\)/);
    assert.match(src(`${CYM}/modules/modNodes.tsx`), /readResonance\(hz, allModes, Q, plateRefQ\(spec\.material\)\)/);
  });
});

// ── 11 ────────────────────────────────────────────────────────────────────
describe('11 · Liquid waveform: heard vs drawn, said apart', () => {
  const s = src(`${CYM}/LiquidStudioScreen.tsx`);
  it('no claim that the harmonics are seen, or that each burst is drawn', () => {
    assert.doesNotMatch(s, /as well as see them/);
    assert.doesNotMatch(s, /the surface builds and relaxes each burst/);
    assert.match(s, /this simulation draws the fundamental’s pattern/);
    assert.match(s, /this simulation does not draw each burst/);
  });
  it('the guided-lesson help line says the same (owner 2026-11-25, fix-first 15 round 2)', () => {
    const c = src('src/features/lab/guidedLessons/content.ts');
    assert.doesNotMatch(c, /change the waveform only to see what the extra harmonics do/);
    assert.match(c, /The waveform changes what you hear; the picture stays the fundamental’s pattern\./);
  });
  it('with a second frequency playing, the shape is said not to be heard (the dual branch wins)', () => {
    assert.match(s, /dualId !== 'off' && tone\.dualReady \? 'not heard while a SECOND FREQUENCY plays/);
    assert.match(src(`${CYM}/useDriveTone.ts`), /if \(b != null && dualReady\) return \{ mode: GEN_MODES\.dual/);
  });
});

// ── 12 ────────────────────────────────────────────────────────────────────
describe('12 · Liquid below threshold: the surface rides at the drive rate', () => {
  const crossings = (fn: (t: number) => number) => {
    let n = 0;
    let prev = fn(0);
    for (let i = 1; i <= 4000; i++) {
      const v = fn(i / 1000);
      if (Math.sign(v) !== Math.sign(prev)) n++;
      prev = v;
    }
    return n;
  };
  const platform = (t: number) => Math.sin(2 * Math.PI * 2 * t); // vizLiquid bob
  const surface = (sub: boolean) => (t: number) => LM.weightsW(1, 0, LM.surfaceCycles(t, sub), 0)[0];
  it('below threshold (subharmonic false) the surface crosses zero as often as the platform', () => {
    assert.equal(crossings(surface(false)), crossings(platform));
  });
  it('above threshold it moves at half the platform rate (f/2)', () => {
    assert.equal(crossings(surface(true)) * 2, crossings(platform));
  });
  it('every per-frame surface in the view uses the surface clock', () => {
    const v = src(`${CYM}/vizLiquid.tsx`);
    assert.equal((v.match(/weightsW\(stageSV\.value, blendSV\.value, surfaceCycles\(clock\.value, subSV\.value\), raw\.value\)/g) ?? []).length, 4);
    assert.doesNotMatch(v, /weightsW\(stageSV\.value, blendSV\.value, clock\.value/);
    assert.match(v, /subSV\.value = state\.subharmonic;/);
  });
});

// ── 13 ────────────────────────────────────────────────────────────────────
describe('13 · Systems water: the half-rate surface no longer snaps', () => {
  const s = src(`${CYM}/modules/modSystems.tsx`);
  const wrapExpr = s.match(/const PHASE_WRAP = ([^;]+);/)![1];
  const wrap = Function(`return ${wrapExpr}`)() as number;
  it('the shared strobe clock wraps at 4π', () => {
    assert.ok(Math.abs(wrap - 4 * Math.PI) < 1e-12);
    assert.match(s, /setPhase\(\(p\) => \(p \+ 0\.35\) % PHASE_WRAP\)/);
  });
  it('cos(phase / 2) steps smoothly through the wrap (largest tick ≤ 0.18; a 2π wrap jumped ~2)', () => {
    const maxStep = (w: number) => {
      let p = 0;
      let worst = 0;
      for (let k = 0; k < 2000; k++) {
        const q = (p + 0.35) % w;
        worst = Math.max(worst, Math.abs(Math.cos(q / 2) - Math.cos(p / 2)));
        p = q;
      }
      return worst;
    };
    assert.ok(maxStep(wrap) <= 0.18, `${maxStep(wrap)}`);
    assert.ok(maxStep(2 * Math.PI) > 1.5, 'the regression');
  });
});

// ── 14 ────────────────────────────────────────────────────────────────────
describe('14 · Liquid contours fade with SHAKE and trace the drawn pattern', () => {
  it('a still surface draws no lines; a full pattern draws them solid', () => {
    assert.ok(LM.contourOpacity(0.02 * 0.1) < 0.01);
    assert.equal(LM.contourOpacity(0.7), 1);
    assert.ok(LM.contourOpacity(0.25) > LM.contourOpacity(0.12));
  });
  it('a blended stage contours A and B together; a single pattern is A unchanged', () => {
    const A = new Float32Array([1, -1, NaN, 0.5]);
    const B = new Float32Array([0, 1, 0, -0.5]);
    assert.equal(LM.crestField(A, B, 2, 0), A);
    const c = LM.crestField(A, B, 3, 0.5);
    assert.deepEqual([...c].map((v) => (Number.isNaN(v) ? 'NaN' : v)), [0.5, 0, 'NaN', 0]);
  });
  it('the view uses them', () => {
    const v = src(`${CYM}/vizLiquid.tsx`);
    assert.match(v, /const F = crestField\(gridA, gridB, STAGE_CODE\[state\.stage\], state\.blend\);/);
    assert.match(v, /\}, \[gridA, gridB, state\.stage, state\.blend, N, view, ox, oy, dishW, dishH\]\);/);
    assert.equal((v.match(/opacity=\{contourAlpha\}/g) ?? []).length, 2);
  });
});

// ── 17 ────────────────────────────────────────────────────────────────────
describe('17 · the driver puck sits where the plate is driven', () => {
  const ringFile = JSON.parse(src('src/data/cymatics/ring.json'));
  const ring = ML.parseLibraryFile(ringFile);
  ML.primeLibraryShape(ring);
  it('ring: "Center" (the hole) moves onto the plate; analytic shapes are unchanged', () => {
    const spec = { ...plate, shape: 'ring' as const };
    const asp = PM.plateAspect(spec);
    assert.equal(ML.libraryInside(ring, 0.5, 0.5), false, 'the centre is the hole');
    const q = PM.plateDrivePoint(spec, { x: 0.5, y: 0.5 * asp });
    assert.ok(ML.libraryInside(ring, q.x, q.y / asp));
    const p = { x: 0.85, y: 0.85 };
    assert.equal(PM.plateDrivePoint(plate, p), p);
  });
  it('the drawing and WHAT THIS PLATE IS use it', () => {
    const v = src(`${CYM}/vizPlate.tsx`);
    assert.match(v, /const exP = plateDrivePoint\(spec, spec\.exciter\);/);
    assert.match(v, /const exX = ox \+ exP\.x \* plateW;/);
    assert.match(v, /const spP = spec\.support \? plateDrivePoint\(spec, spec\.support\) : null;/);
    const s = src(`${CYM}/PlateStudioScreen.tsx`);
    assert.match(s, /driven at \(\{drivenAt\.x\.toFixed\(2\)\}, \{drivenAt\.y\.toFixed\(2\)\}\)/);
    assert.match(src('src/features/cymatics/patternField.ts'), /\{ k: 'Driver', v: `at \$\{pos\(plateDrivePoint\(spec, spec\.exciter\)\)\}` \}/);
  });
});

// ── 18 ────────────────────────────────────────────────────────────────────
describe('18 · SECOND TONE: RESPONSE, MODE and RES describe the same tone', () => {
  it('the case exists: tone A between modes while tone B (2:1) is on one', () => {
    const ex = modes.filter((m: { drive: number }) => m.drive > 0.05);
    const target = ex.find((m: { hz: number }) => at(m.hz / 2, DAMPS.Low).state === 'between');
    assert.ok(target, 'some mode has tone A at half its frequency between modes');
    const a = at(target!.hz / 2, DAMPS.Low);
    const b = at(target!.hz, DAMPS.Low);
    assert.equal(b.state, 'at');
    assert.ok(b.strength > a.strength, 'the lead tone is B');
  });
  it('the bezel and card read the lead tone; the B line is not gated on the tone playing', () => {
    const s = src(`${CYM}/PlateStudioScreen.tsx`);
    assert.match(s, /const lead = leadIsB && resB \? resB : res;/);
    assert.match(s, /const strength = lead\.strength;/);
    assert.match(s, /k: 'MODE', v: lead\.dominant && lead\.state/);
    assert.match(s, /k: 'RES', v: BEZEL_RES_WORD\[lead\.state\]/);
    assert.match(s, /RES_LABEL\[lead\.state\]/);
    assert.doesNotMatch(s, /tone\.running && freqB \?/);
    assert.match(s, /`A: \$\{BEZEL_RES_WORD\[res\.state\]\} · B: \$\{formatHz\(freqB\)\} \$\{resB \? BEZEL_RES_WORD\[resB\.state\] : ''\}`/);
  });
  it('a saved pattern / Lab Print names the lead tone too', async () => {
    const PF = await import('../src/features/cymatics/patternField.ts');
    const ex = modes.filter((m: { drive: number }) => m.drive > 0.05);
    const target = ex.find((m: { hz: number }) => at(m.hz / 2, DAMPS.Low).state === 'between')!;
    const state = { studio: 'plate', spec: plate, hz: target.hz / 2, amplitude: 0.3, view: 'heat', multi: 'oct', sandCount: 1, sandSize: 1, friction: 0.4 };
    const row = (PF.patternReadout(state as never).rows as { k: string; v: string }[]).find((r) => r.k === 'Resonance')!.v;
    assert.ok(row.startsWith('tone B ('), row);
    assert.match(row, / · AT · mode /);
    assert.match(row, new RegExp(`strength ${Math.round(at(target.hz, DAMPS.Low).strength * 100)} %$`));
    const one = (PF.patternReadout({ ...state, multi: 'off' } as never).rows as { k: string; v: string }[]).find((r) => r.k === 'Resonance')!.v;
    assert.ok(one.startsWith('BETWEEN'), one);
  });
});

// ── 23 ────────────────────────────────────────────────────────────────────
describe('23 · slow motion slows the sand', () => {
  it('the sand steps on the clock’s slowed time, jitter included', () => {
    const v = src(`${CYM}/vizPlate.tsx`);
    assert.match(v, /const slow = rate\.value \/ SAND_RATE_FULL;/);
    assert.match(v, /const dt = dtReal \* slow;/);
    assert.match(v, /const jit = jitSV\.value \* Math\.sqrt\(slow\);/);
    assert.match(v, /const SAND_RATE_FULL = 3\.2;/);
    assert.match(v, /rate\.value = p\.slowMo \? 0\.45 : 3\.2;/);
  });
});

// ── 24 ────────────────────────────────────────────────────────────────────
describe('24 · Harmonics: RATIO and FREQ describe the shown ladder', () => {
  it('a mode picked on another ladder reads —', () => {
    const s = src(`${CYM}/modules/modHarmonics.tsx`);
    assert.match(s, /k: 'RATIO', v: sel && sel\.ladder === ladder\.id \?/);
    assert.match(s, /k: 'FREQ', v: sel && sel\.ladder === ladder\.id \?/);
  });
});
