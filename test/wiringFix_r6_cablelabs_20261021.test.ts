/**
 * Wiring grade, round 6 — Cable, Connector Selection, Patchbay and Cable
 * Install labs (owner go 2026-10-21; grader notes R5_cable.md). Geometry is
 * MEASURED: the cord paths are rebuilt from the source templates and sampled,
 * route lengths come from pathLen, label sizes are rendered points at the
 * narrowest inline width (a 360-pt phone).
 *  R5-CB-01  bi-amp 2-pole note: HF damage only "if circuit 1 is the HF section".
 *  R5-CB-02  CRACKED JOINT label in its own band under the jacket, off the outline.
 *  R5-CS-01  exploded-cable and tester labels ≥ 9 pt inline.
 *  R5-CS-02  the TRS extension is TRS at both ends.
 *  R5-CS-03  "the SAME cable" keeps its etherCON shell at end b.
 *  R5-PB-01  faceplate cord clears the jack below by ≥ 9.87 from its centre.
 *  R5-PB-02  studio-bay cord clears the jack below by ≥ 13.03.
 *  R5-PB-03  the "S" label stays off the bushing / panel at every insertion.
 *  R5-PB-04  PatchPairView labels ≥ 9 pt inline.
 *  R5-CI-01  catwalk feed ends on the top box's rear input (x 247, y ≈ 96).
 *  R5-CI-02  catwalk card ×1.3 = drawn ×1.3.
 *  R5-CI-03  ins-11's receptacle at true scale (2.2 × 4).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathLen } from '../src/screens/lab/cableinstall/pathLen.ts';
import { CI_ROUTE_SCENARIOS } from '../src/screens/lab/cableinstall/data/scenarios.ts';
import { SCENARIOS as CS_SCENARIOS } from '../src/screens/lab/connectorselect/data/scenarios.ts';

const src = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const num = (re: RegExp, s: string) => {
  const m = re.exec(s);
  assert.ok(m, `missing ${re}`);
  return Number(m![1]);
};

/** Sample an absolute M/L/H/V/C path (the cord and route paths here). */
function sample(d: string, steps = 200): [number, number][] {
  const tok = d.match(/[MLHVC]|-?\d*\.?\d+/g)!;
  const pts: [number, number][] = [];
  let i = 0;
  let cmd = '';
  let cur: [number, number] = [0, 0];
  const n = () => Number(tok[i++]);
  while (i < tok.length) {
    if (/[MLHVC]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M' || cmd === 'L') {
      const p: [number, number] = [n(), n()];
      if (cmd === 'L') for (let k = 1; k <= steps; k++) pts.push([cur[0] + ((p[0] - cur[0]) * k) / steps, cur[1] + ((p[1] - cur[1]) * k) / steps]);
      else pts.push(p);
      cur = p;
    } else if (cmd === 'H' || cmd === 'V') {
      const v = n();
      const p: [number, number] = cmd === 'H' ? [v, cur[1]] : [cur[0], v];
      for (let k = 1; k <= steps; k++) pts.push([cur[0] + ((p[0] - cur[0]) * k) / steps, cur[1] + ((p[1] - cur[1]) * k) / steps]);
      cur = p;
    } else if (cmd === 'C') {
      const c1: [number, number] = [n(), n()];
      const c2: [number, number] = [n(), n()];
      const p: [number, number] = [n(), n()];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        pts.push([
          u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p[0],
          u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p[1],
        ]);
      }
      cur = p;
    } else throw new Error(`unhandled ${cmd}`);
  }
  return pts;
}
/** Build a path from a source template literal, with the named values. */
function fromTemplate(source: string, re: RegExp, vars: Record<string, number>): string {
  const m = re.exec(source);
  assert.ok(m, `template ${re}`);
  // eslint-disable-next-line no-new-func
  return new Function(...Object.keys(vars), `return ${m![1]};`)(...Object.values(vars)) as string;
}

const L05 = src('cable/data/lesson05.ts');
const WIRING = src('cable/art/wiring.tsx');
const CS_ART = src('connectorselect/art.tsx');
const PAIR = src('patchbay/art/PatchPairView.tsx');
const STUDIO = src('patchbay/art/StudioBayView.tsx');
const JACK = src('patchbay/art/JackCutaway.tsx');
const ROUTE = src('cableinstall/scenes/RouteScene.tsx');
const INSPECT = src('cableinstall/scenes/InspectScene.tsx');

describe('R5-CB-01 bi-amp 2-pole lead: HF damage is conditional on the pinout', () => {
  it('names circuit 1 as the condition and sends the reader to the pinout', () => {
    assert.match(L05, /A 2-pole lead engages circuit 1 only: one driver section plays, the other stays silent\. There is no crossover inside the cabinet, so if circuit 1 is the HF section, a full-range feed down that lead can damage it — check the pinout\./);
    assert.doesNotMatch(L05, /full-range amp channel, its HF section can be damaged/);
  });
});

describe('R5-CB-02 CRACKED JOINT label sits off the jacket outline', () => {
  it('its baseline is in a band under the jacket, clear of the dashed edge and of the footer', () => {
    assert.match(WIRING, /<Label x=\{xb - 15\} y=\{jacketBottom \+ CRACK_LABEL_DY\} text="CRACKED JOINT — breaks when flexed"/);
    assert.match(WIRING, /const jacketBottom = top \+ n \* rowH \+ 4;/);
    assert.match(WIRING, /height=\{jacketBottom - \(top - 4\)\}/, 'the drawn jacket ends at jacketBottom');
    assert.match(WIRING, /const H = top \+ n \* rowH \+ \(network \? 44 : 30\) \+ \(hasFlaky\(m\) \? CRACK_BAND : 0\);/);
    assert.match(WIRING, /return W \/ \(34 \+ m\.a\.length \* rowH \+ \(m\.a\.length >= 8 \? 44 : 30\) \+ \(hasFlaky\(m\) \? CRACK_BAND : 0\)\);/);
    const band = num(/export const CRACK_BAND = ([\d.]+);/, WIRING);
    const dy = num(/export const CRACK_LABEL_DY = ([\d.]+);/, WIRING);
    const size = 10;
    const cap = 0.73 * size; // Oswald cap height
    const desc = 0.25 * size;
    // analog leads: H = jacketBottom − 4 + 30 + band; footer baseline H − 9
    const footerCapTop = -4 + 30 + band - 9 - 0.73 * 10;
    assert.ok(dy - cap > 0.5 + 2, 'cap top clears the dashed bottom edge (stroke 1)');
    assert.ok(dy + desc < footerCapTop - 1, 'descenders clear the footer line');
  });
  it('the leader to the crack runs right of the jacket end, never across it', () => {
    const W = 340;
    const xb = W - 66;
    const c1 = W - 92;
    assert.match(WIRING, /<Leader x1=\{xb - 19\.5\} y1=\{jacketBottom \+ CRACK_LABEL_DY - 8\} x2=\{xb - 19\.5\} y2=\{y1 \+ 2\.2\}/);
    assert.ok(xb - 19.5 > c1 + 1);
    // the crack itself spans xb − 24 … xb − 15
    assert.ok(xb - 19.5 > xb - 24 && xb - 19.5 < xb - 15);
  });
});

describe('R5-CS-01 connector-selection labels render ≥ 9 pt inline', () => {
  const inline = 360 - 2 * 16 - 2 * 13;
  it('the inline width is a 360-pt phone less the gutters and the Card', () => {
    assert.match(CS_ART, /export const CS_INLINE_W = 360 - 2 \* 16 - 2 \* 13;/);
  });
  it('every exploded-cable label', () => {
    const body = CS_ART.slice(CS_ART.indexOf('export function ExplodedCable'), CS_ART.indexOf('/* ── cross-sections'));
    assert.doesNotMatch(body, /fontSize=\{\d/, 'no literal sizes left');
    const pt = num(/export const EXPLODED_LABEL_PT = ([\d.]+);/, CS_ART);
    const vbW = num(/const EXPLODED_W = (\d+);/, CS_ART);
    assert.ok((pt * inline) / vbW >= 9, `${((pt * inline) / vbW).toFixed(2)} pt`);
  });
  it('every tester label (the 12-unit readouts already clear it)', () => {
    const body = CS_ART.slice(CS_ART.indexOf('export function TesterFace'));
    const sizes = [...body.matchAll(/fontSize=\{([^}]+)\}/g)].map((m) => m[1]);
    const pt = num(/export const TESTER_LABEL_PT = ([\d.]+);/, CS_ART);
    const vbW = num(/const FACE_W = (\d+);/, CS_ART);
    for (const s of sizes) {
      const units = s === 'TESTER_LABEL_PT' ? pt : Number(s);
      assert.ok((units * inline) / vbW >= 9, `${s}: ${((units * inline) / vbW).toFixed(2)} pt`);
    }
  });
});

describe('R5-CS-02 / R5-CS-03 the cables are drawn as named', () => {
  const choice = (sid: string, cid: string) => CS_SCENARIOS.find((s) => s.id === sid)!.choices.find((c) => c.id === cid)!;
  it('the TRS extension is 3.5 mm TRS at both ends', () => {
    const c = choice('s08_phones_headset', 'c');
    assert.match(c.name, /TRS extension/);
    assert.equal(c.a, 'trs_35');
    assert.equal(c.b, 'trs_35');
  });
  it('"the SAME cable" keeps its etherCON shell at both ends', () => {
    const same = choice('s12_stagebox', 'd');
    const right = choice('s12_stagebox', 'a');
    assert.match(same.name, /The SAME cable/);
    assert.equal(same.a, right.a);
    assert.equal(same.b, right.b);
    assert.equal(same.b, 'ethercon_style');
  });
});

/* ── patchbay cords ─────────────────────────────────────────────────────── */

const minDist = (pts: [number, number][], c: [number, number]) => Math.min(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));

describe('R5-PB-01 faceplate: the top cord clears the jack below', () => {
  const MM = 62 / 44.45;
  const ROW_TOP = 2 + 12.5 * MM;
  const ROW_BOT = 2 + 29.5 * MM;
  const FACE_H = num(/const FACE_H = (\d+);/, PAIR);
  const DX = num(/export const CORD_DROP_DX = ([\d.]+);/, PAIR);
  const SETTLE = num(/export const CORD_SETTLE_DY = ([\d.]+);/, PAIR);
  const cx = 92;
  const build = (side: 1 | -1, cy: number) =>
    fromTemplate(PAIR, /export const cordDrop = \(cx: number, cy: number, side: 1 \| -1\) =>\s*(`[^`]+`);/, { cx, cy, side, CORD_DROP_DX: DX, CORD_SETTLE_DY: SETTLE, FACE_H });
  it('the rows are where the faceplate draws them', () => {
    assert.match(PAIR, /const ROW_TOP = 2 \+ 12\.5 \* MM;/);
    assert.match(PAIR, /const ROW_BOT = 2 \+ 29\.5 \* MM;/);
    assert.match(PAIR, /<Path d=\{cordDrop\(cx, cy, side\)\} stroke=\{PB\.cord\} strokeWidth=\{2\.4\}/);
  });
  it('measured: ≥ 9.87 from the lower jack centre at every point (bushing 7.67 + stroke 1 + half-cord 1.2)', () => {
    const need = 5.5 * MM + 2 / 2 + 2.4 / 2;
    assert.ok(Math.abs(need - 9.87) < 0.01);
    const d = minDist(sample(build(1, ROW_TOP)), [cx, ROW_BOT]);
    assert.ok(d >= need, `closest ${d.toFixed(2)}`);
  });
  it('reaches cx + 11 above ROW_BOT − 10, then drops straight, never past cx + 11', () => {
    const pts = sample(build(1, ROW_TOP));
    const first = pts.find((p) => p[0] >= cx + DX - 1e-6)!;
    assert.ok(first[1] <= ROW_BOT - 10, `reaches cx+11 at y ${first[1].toFixed(2)}`);
    assert.ok(pts.every((p) => p[0] <= cx + DX + 1e-6));
    assert.ok(pts.filter((p) => p[1] >= first[1]).every((p) => Math.abs(p[0] - (cx + DX)) < 1e-6));
    assert.equal(pts[pts.length - 1][1], FACE_H);
  });
  it('the bottom cord (left lane) clears nothing below but stays out of the left neighbour', () => {
    const pts = sample(build(-1, ROW_BOT));
    const neighbourEdge = cx - 18.4 * MM + 5.5 * MM + 1.1 / 2;
    assert.ok(pts.every((p) => p[0] - 1.2 > neighbourEdge + 0.5));
  });
});

describe('R5-PB-02 studio bay: the top cord clears the jack below', () => {
  const MM = 1.95;
  const PY = 14;
  const PANEL_H = 44.45 * MM;
  const ROW_TOP = PY + 13 * MM;
  const ROW_BOT = PY + 30 * MM;
  const JACK_R = 5.5 * MM;
  const STEP = 18.4 * MM;
  const DX = num(/export const BAY_CORD_DX = ([\d.]+);/, STUDIO);
  const SETTLE = num(/export const BAY_CORD_SETTLE_DY = ([\d.]+);/, STUDIO);
  const cx = 100;
  const build = (side: number, y: number) =>
    fromTemplate(STUDIO, /export const bayCordDrop = \(cx: number, y: number, side: number\) =>\s*(`[^`]+`);/, { cx, y, side, BAY_CORD_DX: DX, BAY_CORD_SETTLE_DY: SETTLE, PY, PANEL_H });
  it('the drawing uses the measured helper at 2.6 wide', () => {
    assert.match(STUDIO, /<Path d=\{bayCordDrop\(cx, y, side\)\} stroke=\{PB\.cord\} strokeWidth=\{2\.6\}/);
    assert.match(STUDIO, /const ROW_TOP = PY \+ 13 \* MM;/);
    assert.match(STUDIO, /const ROW_BOT = PY \+ 30 \* MM;/);
  });
  it('measured: ≥ 13.03 from the lower jack centre (JACK_R 10.73 + stroke 1 + half-cord 1.3)', () => {
    const need = JACK_R + 2 / 2 + 2.6 / 2;
    assert.ok(Math.abs(need - 13.03) < 0.01);
    const d = minDist(sample(build(1, ROW_TOP)), [cx, ROW_BOT]);
    assert.ok(d >= need, `closest ${d.toFixed(2)}`);
  });
  it('lands on cx ± 14 above the jack below and stays inside the selection outline', () => {
    const pts = sample(build(1, ROW_TOP));
    const first = pts.find((p) => p[0] >= cx + DX - 1e-6)!;
    assert.ok(first[1] <= ROW_BOT - JACK_R - 2, `y ${first[1].toFixed(2)}`);
    const outline = STEP / 2 - 1.5 - 1.4 / 2;
    assert.ok(pts.every((p) => p[0] - cx + 1.3 < outline));
  });
});

describe('R5-PB-03 the "S" label stays off the bushing and the panel', () => {
  assert.match(JACK, /const tipXAt = \(insertion: number\) => 26 \+ insertion \* 122;/);
  const tipXAt = (ins: number) => 26 + ins * 122;
  const PANEL_X0 = num(/export const PANEL_X0 = (\d+);/, JACK);
  assert.match(JACK, /export const BUSHING = \{ x0: 42, x1: 62, y0: 80, y1: 124 \} as const;/);
  const B = { x0: 42, x1: 62, y0: 80, y1: 124 };
  const body = /export function sLabelAt\(insertion: number\): \{[^}]*\} \{\n([\s\S]*?)\n\}/.exec(JACK)![1];
  // eslint-disable-next-line no-new-func
  const sLabelAt = new Function('insertion', 'tipXAt', 'PANEL_X0', body) as (i: number, t: typeof tipXAt, p: number) => { x: number; y: number; leaderTo: number; pocket: boolean };
  it('the drawing reads its spot from sLabelAt', () => {
    assert.match(JACK, /const s = sLabelAt\(insertion\);/);
    assert.match(JACK, /<SvgText x=\{s\.x\} y=\{s\.y\} fontSize=\{9\}[^>]*>S<\/SvgText>/);
    assert.match(JACK, /<Line x1=\{s\.x\} y1=\{116\} x2=\{s\.x\} y2=\{s\.leaderTo\}/);
  });
  it('measured at every insertion from 31 % to 100 %: the glyph box clears panel, bushing and jack body; the leader lands on the sleeve', () => {
    const hits = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    for (let k = 31; k <= 100; k++) {
      const ins = k / 100;
      const s = sLabelAt(ins, tipXAt, PANEL_X0);
      const glyph = [s.x - 3, s.y - 6.6, s.x + 3, s.y + 0.5]; // "S" at 9 units, Oswald
      const panelLow = [PANEL_X0 - 0.4, B.y1, 44 + 0.4, 192];
      const panelHigh = [PANEL_X0 - 0.4, 8, 44 + 0.4, B.y0];
      const bushing = [B.x0 - 0.7, B.y0 - 0.7, B.x1 + 0.7, B.y1 + 0.7];
      const jackBody = [62 - 0.7, 30 - 0.7, 324, 164];
      for (const [name, r] of [['panel', panelLow], ['panel top', panelHigh], ['bushing', bushing], ['jack body', jackBody]] as const) {
        assert.ok(!hits(glyph, r), `${k} %: S on the ${name}`);
      }
      const tipX = tipXAt(ins);
      // (below ≈ 68 % the spot is clamped to x 24, the frame's left margin —
      // the visible sleeve stub; unchanged here)
      if (tipX - 85 >= 24) assert.ok(s.x >= tipX - 110 && s.x <= tipX - 60, `${k} %: leader on the sleeve`);
      assert.ok(s.leaderTo < glyph[1] && s.leaderTo > 114, `${k} %: leader ends above the glyph`);
    }
    for (const ins of [0.84, 0.9, 1]) assert.equal(sLabelAt(ins, tipXAt, PANEL_X0).pocket, true);
  });
});

describe('R5-PB-04 PatchPairView labels render ≥ 9 pt inline', () => {
  it('padding 8, labels at PAIR_LABEL_PT, ≥ 9 pt at a 360-pt phone', () => {
    const pad = num(/export const PAIR_WRAP_PAD = (\d+);/, PAIR);
    assert.equal(pad, 8);
    assert.match(PAIR, /padding: PAIR_WRAP_PAD \}/);
    assert.match(PAIR, /export const PAIR_INLINE_W = 360 - 2 \* 16 - 2 \* \(PAIR_WRAP_PAD \+ 1\);/);
    const inline = 360 - 2 * 16 - 2 * (pad + 1);
    const pt = num(/export const PAIR_LABEL_PT = ([\d.]+);/, PAIR);
    const sizes = [...PAIR.matchAll(/<SvgText[^>]*fontSize=\{([^}]+)\}/g)].map((m) => m[1]);
    assert.ok(sizes.length >= 13);
    for (const s of sizes) {
      const units = s === 'PAIR_LABEL_PT' ? pt : Number(s);
      assert.ok((units * inline) / 340 >= 9, `${s}: ${((units * inline) / 340).toFixed(2)} pt`);
    }
  });
});

/* ── cable install ──────────────────────────────────────────────────────── */

const block = ROUTE.slice(ROUTE.indexOf("'amp-to-cluster': {"), ROUTE.indexOf('/** Where the picked route'));
const segsOf = (id: string) => {
  const seg = block.slice(block.indexOf(id === 'catwalk' ? 'catwalk: [' : `'${id}': [`));
  const body = seg.slice(0, seg.indexOf('],'));
  return [...body.matchAll(/\{ d: '([^']+)', len: ([\d.]+)/g)].map((m) => ({ d: m[1], len: Number(m[2]) }));
};

describe('R5-CI-01 the catwalk feed ends on the top box input', () => {
  const segs = segsOf('catwalk');
  const pts = segs.flatMap((s) => sample(s.d));
  it('its last point is the rear (input) panel: x 247, y within the panel (94.8–101) and ≈ 96', () => {
    const end = pts[pts.length - 1];
    assert.equal(end[0], 247);
    assert.ok(end[1] >= 94.8 && end[1] <= 101 && Math.abs(end[1] - 96) <= 1, `y ${end[1]}`);
  });
  it('the drop never runs over the fly frame (x 247–261, y 92–94.4) at its 1.7 width', () => {
    for (const p of sample(segs[segs.length - 1].d)) {
      const inside = p[0] + 0.85 > 247 && p[0] - 0.85 < 261 && p[1] + 0.85 > 92 && p[1] - 0.85 < 94.4;
      assert.ok(!inside, `(${p[0].toFixed(2)}, ${p[1].toFixed(2)}) on the frame`);
    }
  });
  it('each segment\'s len covers its measured length', () => {
    for (const s of segs) assert.ok(s.len >= pathLen(s.d) - 0.5, `${s.d}: len ${s.len} < ${pathLen(s.d)}`);
  });
});

describe('R5-CI-02 the catwalk card agrees with its drawing', () => {
  it('measured catwalk / over-grid = ×1.3, the card says 1.3', () => {
    const measured = (id: string) => segsOf(id).reduce((a, s) => a + pathLen(s.d), 0);
    const ratio = measured('catwalk') / measured('over-grid');
    const sc = CI_ROUTE_SCENARIOS.find((s) => s.id === 'amp-to-cluster')!;
    const card = sc.options.find((o) => o.id === 'catwalk')!.relLength;
    assert.equal(card, 1.3);
    assert.ok(Math.abs(ratio - card) <= 0.01, `drawn ×${ratio.toFixed(3)}`);
    assert.equal(ratio.toFixed(1), card.toFixed(1));
  });
});

describe('R5-CI-03 ins-11 receptacle at true scale', () => {
  it('plate 2.2 × 4; the plug sits on its lower half and the cord leaves the plug', () => {
    const o = /export const OUTLET = \{ x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+) \} as const;/.exec(INSPECT)!;
    const p = /export const OUTLET_PLUG = \{ x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+) \} as const;/.exec(INSPECT)!;
    const [ox, oy, ow, oh] = o.slice(1).map(Number);
    const [px, py, pw, ph] = p.slice(1).map(Number);
    assert.equal(ow, 2.2);
    assert.equal(oh, 4);
    assert.match(INSPECT, /<Rect x=\{OUTLET\.x\} y=\{OUTLET\.y\} width=\{OUTLET\.w\} height=\{OUTLET\.h\}/);
    assert.match(INSPECT, /<Rect x=\{OUTLET_PLUG\.x\} y=\{OUTLET_PLUG\.y\} width=\{OUTLET_PLUG\.w\} height=\{OUTLET_PLUG\.h\}/);
    assert.doesNotMatch(INSPECT, /width=\{7\.4\} height=\{14\}/);
    // the cord (AC_BUNDLE_D) starts at the plug's left edge, mid-height
    assert.match(INSPECT, /const AC_BUNDLE_D = 'M229\.2 216\.6 /);
    assert.equal(px, 229.2);
    assert.ok(Math.abs(py + ph / 2 - 216.6) < 1e-9);
    // the plug is seated on the plate's lower half
    assert.ok(py + ph / 2 > oy + oh / 2 && py + ph / 2 < oy + oh);
    assert.ok(px + pw > ox && px < ox + ow);
    assert.ok(pw <= ow + 0.4 && ph <= oh, 'the plug is no bigger than the plate');
  });
});
