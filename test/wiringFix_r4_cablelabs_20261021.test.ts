/**
 * Wiring grade, round 4 — Cable Install, Patchbay and Cable labs (owner go
 * 2026-10-21). Rule book: docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md.
 *  R4-CI-01  ins-4 ("bad floor crossing") sat on the rated ramp; it now sits
 *            on the bare stretch of the analog run past the ramp's end, and
 *            its label says what is drawn there.
 *  R4-CI-02  as-found rack: the switch (LEDs lit) and the PDU (feeding the
 *            amp and outlets) each have a cord seated in their own inlet.
 *  R4-CI-03  the port-6 riser crosses the fiber once at 90° — the comment
 *            says so (it claimed "neither crosses another cable").
 *  R4-CI-04  the label trace highlight is the lab's selection amber, not a
 *            cable-class tint; the traced cable's badge is drawn after the beam.
 *  R4-CI-05  ins-11 sits ON the run up the wall, and the AC cord it names is
 *            drawn there, tight against the mic line.
 *  R4-CI-06  duct-ride is drawn ×1.2 of over-grid → relLength 1.2.
 *  R4-PB-01  patch cords drop at cx ± 11 (faceplate) / cx ± 14 (studio bay),
 *            clear of the jack below.
 *  R4-CB-01  the 2-pole note: damage needs a full-range amp channel.
 * Source-reading for the .tsx art (react-native-svg); data is imported.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathLen } from '../src/screens/lab/cableinstall/pathLen.ts';
import { rankRoutes } from '../src/screens/lab/cableinstall/engine/routeEval.ts';
import { CI_INSPECTION_POOL, CI_ROUTE_SCENARIOS } from '../src/screens/lab/cableinstall/data/scenarios.ts';

const src = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const INSPECT = src('cableinstall/scenes/InspectScene.tsx');
const RACK = src('cableinstall/scenes/RackScene.tsx');
const LABEL = src('cableinstall/scenes/LabelScene.tsx');
const ROUTE = src('cableinstall/scenes/RouteScene.tsx');
const PAIR = src('patchbay/art/PatchPairView.tsx');
const STUDIO = src('patchbay/art/StudioBayView.tsx');
const L05 = src('cable/data/lesson05.ts');

/** Facility viewBox is 360 × 240; defects are placed in %. */
const at = (id: string) => {
  const d = CI_INSPECTION_POOL.find((x) => x.id === id)!;
  return { x: (d.x / 100) * 360, y: (d.y / 100) * 240 };
};
/** Marker radius used for spacing checks (the drawn ring is ~10 units). */
const MARKER_R = 10.5;

describe('R4-CI-01 ins-4 marks a real, unprotected floor run', () => {
  it('sits on the analog run at floor level (y 226.4), past the ramp (x 128–172) and before the riser to the wall (x 210)', () => {
    const p = at('ins-4');
    assert.ok(Math.abs(p.y - 226.4) <= 1, `y ${p.y}`);
    assert.ok(p.x - MARKER_R > 172, 'clear of the ramp body');
    assert.ok(p.x + MARKER_R < 210, 'on the straight floor stretch');
    assert.match(INSPECT, /<RunIn d="M150 226\.4 H210 /);
    // the ramp itself is unchanged (x 128–172, lid over the run)
    assert.match(INSPECT, /<Rect x=\{128\} y=\{223\} width=\{44\} height=\{5\}/);
    assert.match(INSPECT, /<Rect x=\{132\} y=\{223\.4\} width=\{36\} height=\{1\.8\}/);
  });
  it('the label names a bare run past the ramp, not a bare aisle crossing', () => {
    const d = CI_INSPECTION_POOL.find((x) => x.id === 'ins-4')!;
    assert.equal(d.mistakeId, 'bad-floor-crossing');
    assert.equal(d.label, 'Snake lying bare on the audience walkway past the ramp');
    assert.doesNotMatch(d.label, /aisle bare/);
  });
  it('does not collide with ins-5', () => {
    const a = at('ins-4');
    const b = at('ins-5');
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 2 * MARKER_R);
  });
});

describe('R4-CI-02 as-found: nothing lit is unpowered', () => {
  const bad = RACK.slice(RACK.indexOf('const BadCables = memo('), RACK.indexOf('/** The outgoing route, pulled back out'));
  it('the switch still shows lit ports in the as-found state', () => {
    assert.match(RACK, /<NetworkSwitch lit=\{dress \? \[0, 1, 2, 3, 5, 7\] : \[0, 4\]\} \/>/);
  });
  it('the switch and the PDU each have a C13 seated in their own inlet, with a cord into it', () => {
    assert.ok(bad.includes('<C13Plug x={SWITCH.iecX} y={SWITCH.iecY} />'), 'switch plug seated');
    assert.ok(bad.includes('<C13Plug x={264} y={PDU.y + 5.5} />'), 'PDU inlet plug seated');
    assert.match(bad, /<DrawPath d=\{AS_FOUND_SW_AC_D\}/);
    assert.match(bad, /<DrawPath d=\{AS_FOUND_PDU_FEED_D\}/);
    assert.match(RACK, /const AS_FOUND_SW_AC_D = `M\$\{SWITCH\.iecX \+ 7\.5\} \$\{SWITCH\.iecY \+ 15\.2\} /);
    assert.match(RACK, /const AS_FOUND_PDU_FEED_D = `M298 \$\{PDU\.y \+ 18\.5\} H273\.6`;/);
  });
  it('the stray DSP cord drops at x 285.5, clear of the seated switch plug (x 265.4–281.8)', () => {
    assert.match(bad, /C281 18 285\.5 30 285\.5 48 V136 C285\.5 160 \$\{DSP\.iecX \+ 7\.5\} 162/);
    const plugRight = 266 - 0.6 + 16.2;
    assert.ok(285.5 - 4 / 2 > plugRight + 1);
  });
  it('the PDU feed lane (y 344.5, 3 wide) stays off the hauled AC run (top lane y 349, 4 wide)', () => {
    const U_TOP = 18;
    const PDU_Y = U_TOP + 14 * 22;
    assert.ok(PDU_Y + 18.5 + 1.5 < 349 - 2);
  });
});

describe('R4-CI-03 the rack comment tells the truth about the fiber crossing', () => {
  it('no longer claims "neither crosses another cable"', () => {
    assert.doesNotMatch(RACK, /neither crosses another cable/);
    assert.match(RACK, /the port-6 riser crosses the violet fiber once, at 90°/);
  });
});

describe('R4-CI-04 label trace: a non-class highlight, badge over the beam', () => {
  it('the trace tint is the selection amber; no green left in the scene art', () => {
    assert.match(LABEL, /const TRACE_TINT = colors\.amber;/);
    assert.match(LABEL, /<JacketPath d=\{d\} color=\{TRACE_TINT\}/);
    assert.doesNotMatch(LABEL, /#37e05f|#eafff1|#0b3d1d/);
    const art = LABEL.slice(LABEL.indexOf('function SystemArt('), LABEL.indexOf('/* ── the documentation reveal'));
    assert.doesNotMatch(art, /colors\.green/);
  });
  it('the traced cable badge is drawn after the TraceBeam', () => {
    const beam = LABEL.indexOf('<TraceBeam d={cablePath(TARGET_CABLE)} />');
    const badge = LABEL.indexOf('<CableBadge i={TARGET_CABLE} />');
    assert.ok(beam > 0 && badge > beam);
  });
});

describe('R4-CI-05 ins-11 sits on the AC/mic bundle up the wall', () => {
  it('the AC cord is drawn tight against the mic run (2.4 apart, each 2.4 wide)', () => {
    assert.match(INSPECT, /const AC_BUNDLE_D = 'M229\.2 216\.6 C223\.4 216\.6 220\.4 214 220\.4 209 V187 C220\.4 183 223 180\.4 228 180\.4 H276';/);
    assert.match(INSPECT, /<RunIn d=\{AC_BUNDLE_D\} len=\{110\} color=\{CI_CLASS_TINTS\.power\}/);
    assert.match(INSPECT, /V186 C218 181 222 178 228 178 H276" len=\{160\} color=\{CI_CLASS_TINTS\.analog\}/);
    assert.ok(pathLen('M229.2 216.6 C223.4 216.6 220.4 214 220.4 209 V187 C220.4 183 223 180.4 228 180.4 H276') <= 110);
  });
  it('its marker is on that bundle, and clear of ins-5 and ins-8', () => {
    const p = at('ins-11');
    assert.ok(p.x >= 217 && p.x <= 221.5, `x ${p.x}`);
    assert.ok(p.y >= 187 && p.y <= 209, `y ${p.y}`);
    for (const o of ['ins-5', 'ins-8']) {
      const q = at(o);
      assert.ok(Math.hypot(p.x - q.x, p.y - q.y) > 2 * MARKER_R, o);
    }
  });
});

describe('R4-CI-06 duct-ride relLength matches its drawing', () => {
  const block = ROUTE.slice(ROUTE.indexOf("'amp-to-cluster': {"), ROUTE.indexOf('/** Where the picked route'));
  const drawn = (id: string) => {
    const seg = block.slice(block.indexOf(id.includes('-') ? `'${id}'` : `${id}:`));
    const body = seg.slice(0, seg.indexOf(']'));
    return [...body.matchAll(/len: ([\d.]+)/g)].reduce((a, m) => a + Number(m[1]), 0);
  };
  const sc = CI_ROUTE_SCENARIOS.find((s) => s.id === 'amp-to-cluster')!;
  it('duct-ride is ×1.2 of the over-grid drawing and the card says 1.2', () => {
    const ratio = drawn('duct-ride') / drawn('over-grid');
    assert.ok(Math.abs(ratio - 1.2) < 0.02, `drawn ×${ratio.toFixed(3)}`);
    assert.equal(sc.options.find((o) => o.id === 'duct-ride')!.relLength, 1.2);
    for (const o of sc.options) assert.ok(Math.abs(o.relLength - drawn(o.id) / drawn('over-grid')) <= 0.06, o.id);
  });
  it('the ranking and the teaching point are unchanged', () => {
    const ranked = rankRoutes(sc.options);
    assert.equal(ranked[0].option.id, 'catwalk');
    const og = sc.options.find((o) => o.id === 'over-grid')!;
    assert.equal(og.relLength, 1);
    assert.match(og.name, /Shortest/);
  });
});

describe('R4-PB-01 patch cords clear the jack below', () => {
  it('faceplate: cord at cx ± 11, 2.4 wide, clears the plugged bushing and the featured outline', () => {
    assert.match(PAIR, /export const CORD_DROP_DX = 11;/);
    assert.match(PAIR, /\$\{cx \+ CORD_DROP_DX \* side\} \$\{FACE_H\}`;/);
    assert.match(PAIR, /export const FEATURED_HALF_W = 14;/);
    assert.match(PAIR, /<Rect x=\{CX - FEATURED_HALF_W\} y=\{ROW_TOP - 11\} width=\{2 \* FEATURED_HALF_W\}/);
    const MM = 62 / 44.45;
    const bushing = 5.5 * MM + 2 / 2; // plugged stroke 2
    assert.ok(11 - 2.4 / 2 > bushing + 0.5, 'clear of the jack below');
    assert.ok(11 + 2.4 / 2 < 14 - 1.1 / 2, 'inside the featured outline');
    const neighbour = 18.4 * MM - (5.5 * MM + 1.1 / 2);
    assert.ok(14 + 1.1 / 2 < neighbour - 1, 'outline clear of the next column');
  });
  it('studio bay: cord at cx ± 14, 2.6 wide, clears the bushing and stays inside the selection outline', () => {
    assert.match(STUDIO, /\$\{cx \+ 14 \* side\} \$\{y \+ 18\}, \$\{cx \+ 14 \* side\} \$\{PY \+ PANEL_H \+ 4\}/);
    const MM = 1.95;
    const bushing = 5.5 * MM + 2 / 2;
    const sel = (18.4 * MM) / 2 - 1.5 - 1.4 / 2;
    assert.ok(14 - 2.6 / 2 > bushing + 0.5);
    assert.ok(14 + 2.6 / 2 < sel);
  });
});

describe('R4-CB-01 2-pole lead: damage needs a full-range feed', () => {
  it('says the HF section is at risk only if the lead comes from a full-range amp channel', () => {
    assert.match(L05, /A 2-pole lead engages circuit 1 only: one driver section plays, the other stays silent\. There is no crossover inside the cabinet, so if that lead comes from a full-range amp channel, its HF section can be damaged\./);
    assert.doesNotMatch(L05, /a full-range feed onto a high-frequency section can damage it/);
  });
  it('keeps the round-3 crossover wording', () => {
    assert.match(L05, /the crossover comes BEFORE the amplifier: it splits the signal into low and high bands and feeds each band to its own amp channel/);
  });
});
