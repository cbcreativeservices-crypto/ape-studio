/**
 * Wiring grade, round 8 — Cable, Connector Selection, Patchbay and Cable
 * Install labs (owner go 2026-10-21; grader list R7_cable_full.md). Geometry
 * is MEASURED: paths are rebuilt from the source and sampled, label sizes are
 * rendered points at the narrowest inline width (a 360-pt phone), clearances
 * are real distances in the drawing's own units.
 *  R7-CS-01  RJ45's "cannot" decoy is impossible (mains), not analog mic.
 *  R7-CS-02  charge-only USB-C: "no data wires".
 *  R7-CS-03  definite failures are failures (wrong_level / wrong_construction).
 *  R7-CS-04  a headset cord has ONE plug in the tray.
 *  R7-CS-05  TOSLINK core ≈ 98 % of the cladding.
 *  R7-CS-06  "shielded pairs" each in a foil ring.
 *  R7-CS-07  instrument cable on speaker duty "can heat and fail".
 *  R7-CB-01  card-figure labels ≥ 9 pt (10.5 units).
 *  R7-CB-02  NEMA caption clear of the plug body (art 8 taller).
 *  R7-CB-03  data inks are generic lanes, not 1000BASE-T pair names.
 *  R7-CB-04  insert exception named (older large-format desks).
 *  R7-CB-05  "in this lab" mains never shares a connector with signal.
 *  R7-CB-06  the G3 hum fixes listed beside the cheater-plug mistake.
 *  R7-PB-01  every patch-cord label fits the 18-character trim.
 *  R7-PB-02  a routed thru pair is ONE looping cord.
 *  R7-PB-03  a lone bottom cord brings an ALT SOURCE.
 *  R7-PB-04  the wrong-patch cords are named (meter, drum machine).
 *  R7-PB-05  P5 as a convention: "On most bays…".
 *  R7-CI-01  every facility run reveals its full measured length.
 *  R7-CI-02  the AC cord passes the rated wall in a named, firestopped sleeve.
 *  R7-CI-03  the BEFORE thumbnail draws no text.
 *  R7-CI-04  SNAKE / HEAD ≥ 9 pt.
 *  R7-CI-05  backstage words clear of the hazard stripes and the routes.
 *  R7-CI-06  route B clear of the AMP ROOM word.
 *  R7-CI-07  the elevation rack is 0.6 × 1.93 m, narrower than the door.
 *  R7-CI-08  the bushed exit is concealed in a fitting + raceway drop.
 *  R7-CI-09  stage-end flags print the ID.
 *  R7-CI-10  the connector-pull rule reads plainly.
 *  R7-CI-11  the intro's tray runs start at the cut edge.
 *  R7-CI-12  the upstage quad boxes feed the amp and the keys.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { pathLen } from '../src/screens/lab/cableinstall/pathLen.ts';
import { CI_INSPECTION_POOL } from '../src/screens/lab/cableinstall/data/scenarios.ts';
import { CI_RULES } from '../src/screens/lab/cableinstall/data/rules.ts';
import { JOB_MATRIX } from '../src/screens/lab/connectorselect/data/jobs.ts';
import { SCENARIOS } from '../src/screens/lab/connectorselect/data/scenarios.ts';
import { MISCONCEPTIONS } from '../src/screens/lab/connectorselect/data/practice.ts';
import { evaluateChoice } from '../src/screens/lab/connectorselect/engine/evaluate.ts';
import { CONNECTOR_INK_LABELS } from '../src/screens/lab/cable/connectorInks.ts';
import { CARRIED_CATEGORIES } from '../src/screens/lab/cable/data/lesson01.ts';
import { getConnector } from '../src/screens/lab/cable/data/registry.ts';

const src = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const num = (re: RegExp, s: string) => {
  const m = re.exec(s);
  assert.ok(m, `missing ${re}`);
  return Number(m![1]);
};
/** Rendered points of `units` in a `vbW`-wide viewBox drawn `w` points wide. */
const pt = (units: number, w: number, vbW: number) => (units * w) / vbW;
/** The narrowest inline widths: a 360-pt phone less the gutters and a card. */
const CARD_W = 360 - 2 * 16 - 2 * 13; // 302
const CI_W = 360 - 2 * 16; // 328 (full-bleed figure)

type P = [number, number];
/** Sample an absolute (and simple relative l/v) M L H V C Q path. */
function sample(d: string, steps = 120): P[] {
  const tok = d.match(/[MLHVCQlv]|-?\d*\.?\d+/g)!;
  const pts: P[] = [];
  let i = 0;
  let cmd = '';
  let cur: P = [0, 0];
  const n = () => Number(tok[i++]);
  const line = (p: P) => {
    for (let k = 1; k <= steps; k++) pts.push([cur[0] + ((p[0] - cur[0]) * k) / steps, cur[1] + ((p[1] - cur[1]) * k) / steps]);
    cur = p;
  };
  while (i < tok.length) {
    if (/[MLHVCQlv]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M') {
      cur = [n(), n()];
      pts.push(cur);
    } else if (cmd === 'L') line([n(), n()]);
    else if (cmd === 'l') {
      const dx = n();
      line([cur[0] + dx, cur[1] + n()]);
    } else if (cmd === 'H') line([n(), cur[1]]);
    else if (cmd === 'V') line([cur[0], n()]);
    else if (cmd === 'v') line([cur[0], cur[1] + n()]);
    else if (cmd === 'C' || cmd === 'Q') {
      const c: P[] = cmd === 'C' ? [[n(), n()], [n(), n()]] : [[n(), n()]];
      const p: P = [n(), n()];
      const ctrl = [cur, ...c, p];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        let q = ctrl.map((x) => [x[0], x[1]] as P);
        while (q.length > 1) q = q.slice(1).map((b, j) => [q[j][0] + (b[0] - q[j][0]) * t, q[j][1] + (b[1] - q[j][1]) * t] as P);
        pts.push(q[0]);
      }
      cur = p;
    } else throw new Error(`unhandled ${cmd}`);
  }
  return pts;
}
/** Shortest distance from a point to a box [x0, y0, x1, y1]. */
const boxDist = ([x, y]: P, [x0, y0, x1, y1]: number[]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
const pathBoxDist = (d: string, box: number[]) => Math.min(...sample(d).map((p) => boxDist(p, box)));
/** Oswald caps: ≈ 0.55 em per glyph (a generous over-estimate), cap height
 *  ≈ 0.75 em. `callout`: a Callout / PlanLabel / Room insets a start- or
 *  end-anchored word by 0.45 em (svgArt.tsx). */
const textBox = (x: number, base: number, text: string, size: number, anchor: 'start' | 'middle' | 'end', callout = true) => {
  const w = text.length * size * 0.55;
  const inset = callout ? size * 0.45 : 0;
  const x0 = anchor === 'start' ? x + inset : anchor === 'end' ? x - inset - w : x - w / 2;
  return [x0, base - size * 0.75, x0 + w, base];
};

/* ── Connector Selection ─────────────────────────────────────────────── */
const CS_ART = src('connectorselect/art.tsx');
const CS_C = src('connectorselect/pagesC.tsx');

describe('R7-CS-01 RJ45 decoy is impossible', () => {
  it('no "analog mic" can:false row (passive Cat snakes DO carry analog); mains instead', () => {
    const e = JOB_MATRIX.find((x) => x.connector === 'ethernet_8p8c')!;
    const no = e.jobs.filter((j) => !j.can);
    assert.ok(no.length >= 1);
    for (const j of no) assert.doesNotMatch(j.label, /analog|microphone/i);
    assert.ok(no.some((j) => /mains/i.test(j.label)));
  });
});

describe('R7-CS-02 charge-only USB-C has no data wires', () => {
  it('scenario and myth say "no data wires", never "minimal" / "barely"', () => {
    const c = SCENARIOS.find((s) => s.id === 's11_computer_interface')!.choices.find((x) => x.id === 'b')!;
    assert.match(c.explain, /no data wires/);
    assert.doesNotMatch(c.explain, /minimal/);
    const m = MISCONCEPTIONS.find((x) => x.id === 'usbc_identical')!;
    assert.match(m.correction, /no data wires/);
    assert.doesNotMatch(m.correction, /barely/);
  });
});

describe('R7-CS-03 definite failures are not "verify"', () => {
  it('guitar straight into a line input = wrong level; 3-contact headphones on a call = wrong construction', () => {
    const g = SCENARIOS.find((s) => s.id === 's03_guitar_di')!.choices.find((x) => x.id === 'b')!;
    const h = SCENARIOS.find((s) => s.id === 's08_phones_headset')!.choices.find((x) => x.id === 'b')!;
    assert.equal(g.verdict, 'wrong_level');
    assert.equal(h.verdict, 'wrong_construction');
    for (const c of [g, h]) {
      const v = evaluateChoice(c);
      assert.equal(v.overall, false);
      assert.ok(!v.unverified, 'a definite failure is not amber "?"');
    }
    assert.doesNotMatch(h.explain, /Nothing failed/);
  });
});

describe('R7-CS-04 a headset cord has one plug', () => {
  it('both head-worn choices are fixedTo the device, and the tray draws ONE plug then its name', () => {
    const s = SCENARIOS.find((x) => x.id === 's08_phones_headset')!;
    assert.equal(s.choices.find((c) => c.id === 'a')!.fixedTo, 'headset');
    assert.equal(s.choices.find((c) => c.id === 'b')!.fixedTo, 'headphones');
    // the extension cable keeps two ends
    assert.equal(s.choices.find((c) => c.id === 'c')!.fixedTo, undefined);
    assert.match(CS_C, /\{c\.fixedTo \? \(\s*<Text style=\{styles\.trayLine\}[^>]*>\s*\{c\.fixedTo\.toUpperCase\(\)\}\s*<\/Text>\s*\) : \(\s*<ConnectorPhoto id=\{c\.b\}/);
  });
});

describe('R7-CS-05 TOSLINK core at true scale', () => {
  it('core ≈ 980 µm inside ≈ 1000 µm of cladding (r 24)', () => {
    const core = num(/export const OPTICAL_CORE_R = ([\d.]+);/, CS_ART);
    const opt = CS_ART.slice(CS_ART.indexOf("case 'optical':"), CS_ART.indexOf("case 'multiconductor':"));
    const clad = num(/\{ r: (\d+), fill: '#9fd7ff' \}/, opt);
    assert.equal(clad, 24);
    assert.ok(core / clad >= 0.95 && core / clad < 1, `${(core / clad).toFixed(3)}`);
    assert.match(opt, /<Circle cx=\{C\} cy=\{C\} r=\{OPTICAL_CORE_R\}/);
  });
});

describe('R7-CS-06 shielded pairs carry their foil', () => {
  const pairs = JSON.parse(/export const MULTI_PAIRS[^=]*= (\[[^;]+\]);/.exec(CS_ART)![1]) as P[];
  const power = JSON.parse(/export const MULTI_POWER[^=]*= (\[[^;]+\]);/.exec(CS_ART)![1]) as P[];
  const foil = num(/export const MULTI_FOIL_R = ([\d.]+);/, CS_ART);
  const inner = 44 - 6; // the overall braid (r 44) is a 6-unit band
  it('each pair (r 6, 13 apart) sits inside its own foil ring (stroke 1.4)', () => {
    assert.ok(6.5 + 6 <= foil - 0.7, 'pair inside the ring');
    for (let a = 0; a < pairs.length; a++) {
      assert.ok(Math.hypot(...pairs[a]) + foil + 0.7 <= inner, `foil ${a} inside the braid`);
      for (let b = a + 1; b < pairs.length; b++) {
        const d = Math.hypot(pairs[a][0] - pairs[b][0], pairs[a][1] - pairs[b][1]);
        assert.ok(d >= 2 * foil + 1.4, `foils ${a}/${b} ${d.toFixed(1)} apart`);
      }
    }
    for (const q of power) {
      assert.ok(Math.hypot(...q) + 6 <= inner, 'power conductor inside the braid');
      for (const p of pairs) assert.ok(Math.hypot(q[0] - p[0], q[1] - p[1]) >= foil + 0.7 + 6, 'power clear of every foil');
    }
    const mc = CS_ART.slice(CS_ART.indexOf("case 'multiconductor':"));
    assert.match(mc, /MULTI_PAIRS\.map[\s\S]*?r=\{MULTI_FOIL_R\}[\s\S]*?<Pair cx=\{C \+ dx\} cy=\{C \+ dy\} r=\{6\} gap=\{13\} \/>/);
  });
});

describe('R7-CS-07 "can heat and fail"', () => {
  it('neither the tester nor the assessment states it as certain', () => {
    for (const f of ['connectorselect/engine/tester.ts', 'connectorselect/data/assessment.ts']) {
      const s = src(f);
      assert.doesNotMatch(s, /heats and fails/);
      assert.match(s, /can heat and fail/);
    }
  });
});

/* ── Cable lab ───────────────────────────────────────────────────────── */
const KIT = src('cable/art/kit.tsx');
const PLUGS = src('cable/art/plugs.tsx');
const SECTIONS = src('cable/art/sections.tsx');
const WIRING = src('cable/art/wiring.tsx');

describe('R7-CB-01 card-figure labels ≥ 9 pt', () => {
  it('CARD_LABEL_U renders ≥ 9 pt on a 340-unit figure at the card width', () => {
    assert.match(KIT, /export const CARD_INLINE_W = 360 - 2 \* 16 - 2 \* 13;/);
    const u = num(/export const CARD_LABEL_U = ([\d.]+);/, KIT);
    assert.ok(pt(u, CARD_W, 340) >= 9, `${pt(u, CARD_W, 340).toFixed(2)} pt`);
  });
  it('the plug zone labels, the peel labels and every trace label use it', () => {
    assert.match(PLUGS, /<Label x=\{tx\} y=\{ly\} text=\{z\.name\} anchor="middle" size=\{CARD_LABEL_U\} \/>/);
    assert.match(PLUGS, /const half = z\.name\.length \* 3\.05 \+ 2;/);
    assert.match(SECTIONS, /<Label x=\{lx\} y=\{ly\} text=\{text\} anchor="middle" size=\{CARD_LABEL_U\}/);
    assert.match(SECTIONS, /<Label x=\{xcx \+ 66\} y=\{xcy \+ 62\} text=\{text\} size=\{CARD_LABEL_U\}/);
    assert.match(SECTIONS, /text="CUT END" color=\{ART\.sub\} size=\{CARD_LABEL_U\}/);
    assert.match(SECTIONS, /const textW = \(t: string\) => t\.length \* 5\.6 \+ 4;/);
    const trace = WIRING.slice(WIRING.indexOf('export function WiringTrace'));
    const labels = trace.match(/<Label [^>]*\/>/g)!;
    assert.ok(labels.length >= 8);
    for (const l of labels) assert.match(l, /size=\{CARD_LABEL_U\}/, l);
  });
  it('a 13-unit network row still holds a 10.5-unit label (cap height < row)', () => {
    assert.ok(10.5 * 0.75 < 13);
  });
});

describe('R7-CB-02 NEMA caption clear of the plug body', () => {
  it('the art is 8 units taller and the caption cap line clears the body bottom', () => {
    const H = num(/export const NEMA_FACE_H = (\d+);/, PLUGS);
    assert.equal(H, 196 + 8);
    const body = 96 + 19 * 4.6 + 0.4; // cy + 19 mm, half its stroke
    const capTop = H - 7 - 9.5 * 0.75;
    assert.ok(capTop - body >= 2, `${(capTop - body).toFixed(2)} clear`);
    assert.match(PLUGS, /const H = NEMA_FACE_H;/);
  });
});

describe('R7-CB-03 data inks are generic lanes', () => {
  it('never "pair A / B" (1000BASE-T names its four pairs A–D)', () => {
    assert.equal(CONNECTOR_INK_LABELS.dataA, 'Data lane 1');
    assert.equal(CONNECTOR_INK_LABELS.dataB, 'Data lane 2');
    for (const v of Object.values(CONNECTOR_INK_LABELS)) assert.doesNotMatch(v, /pair [A-D]\b/);
  });
});

describe('R7-CB-04..06 cable lab wording', () => {
  it('CB-04: the insert exception is named (C5)', () => {
    const trs = getConnector('trs_quarter' as never)!;
    const ins = trs.pinouts.find((p) => p.id === 'insert')!;
    assert.match(ins.contacts.find((c) => c.label === 'Ring')!.note ?? '', /older large-format desks/);
    assert.match(ins.verifyAgainst ?? '', /most consoles/);
    assert.match(ins.verifyAgainst ?? '', /older large-format desks/);
  });
  it('CB-05: "in this lab" mains never shares a connector with signal', () => {
    const ac = CARRIED_CATEGORIES.find((t) => t.id === 'ac_mains')!;
    assert.match(ac.blurb, /in this lab it never shares a connector with signal/);
  });
  it('CB-06: the cheater-plug mistake lists the G3 fixes', () => {
    const nema = getConnector('mains_wall' as never)!;
    const m = nema.commonMistakes.find((x) => /cheater/.test(x))!;
    for (const fix of [/ground-lift switch/, /isolation transformer/, /balanced connections/, /same circuit/]) assert.match(m, fix);
    assert.match(m, /never defeat the safety earth/);
  });
});

/* ── Patchbay ────────────────────────────────────────────────────────── */
const PAIR = src('patchbay/art/PatchPairView.tsx');
const PB_A = src('patchbay/pagesA.tsx');
const PB_C = src('patchbay/pagesC.tsx');

describe('R7-PB-01 cord labels fit the 18-character trim', () => {
  it('every literal patch label in the patchbay pages is ≤ 18 characters', () => {
    const all = ['patchbay/pagesA.tsx', 'patchbay/pagesB.tsx', 'patchbay/pagesC.tsx', 'patchbay/pagesD.tsx', 'patchbay/PatchbayPreview.tsx'].map(src).join('\n');
    const found = [...all.matchAll(/(?:top|bottom)PatchLabel(?:=|: |=\{[^}]*?)["']([^"']+)["']/g), ...all.matchAll(/PatchLabel=\{routed \? '([^']+)' : '([^']+)'\}/g)].flatMap((m) => m.slice(1).filter(Boolean));
    assert.ok(found.length >= 20, `${found.length} labels`);
    for (const l of found) assert.ok([...l].length <= 18, `"${l}" is ${[...l].length}`);
    assert.match(PAIR, /\{trim\(topPatchLabel, 18\)\}/);
  });
});

describe('R7-PB-02 a routed thru pair is one looping cord', () => {
  const W = 340;
  const CX = 92;
  it('the THRU page asks for it, and the drawing then draws ONE cord, no far plugs', () => {
    assert.match(PB_A, /bottomPatchLabel=\{routed \? 'TOP TO BOTTOM' : 'ALT SOURCE'\}\s*loopCord/);
    assert.match(PAIR, /const looped = !!loopCord && state\.topPlugged && state\.bottomPlugged;/);
    assert.match(PAIR, /\{state\.topPlugged && !looped \? \(/);
    assert.match(PAIR, /\{state\.bottomPlugged && !looped \? \(/);
    assert.match(PAIR, /\{looped \? \(\s*<G>\s*<FlowPath d=\{schemLoop\(CX, TOP_Y, BOT_Y\)\}/);
    assert.match(PAIR, /<PairFaceplate topPlugged=\{state\.topPlugged\} bottomPlugged=\{state\.bottomPlugged\} w=\{w\} loop=\{loopCord\} \/>/);
  });
  it('schematic loop: from jack edge to jack edge, clear of the words, short of the label column', () => {
    const dx = num(/export const LOOP_CTRL_DX = (\d+);/, PAIR);
    for (const [top, bot] of [[96, 208], [64, 132]]) {
      const d = `M ${CX + 11} ${top} C ${CX + dx} ${top - 6}, ${CX + dx} ${bot + 6}, ${CX + 11} ${bot}`;
      const p = sample(d);
      assert.deepEqual(p[0], [CX + 11, top]);
      assert.deepEqual(p.at(-1), [CX + 11, bot]);
      const maxX = Math.max(...p.map((q) => q[0]));
      const mid = (top + bot) / 2;
      // "NO INTERNAL" / "CONNECTION" at CX + 16, 10 units, letterSpacing 1
      const words = [CX + 16, mid - 2 - 10 * 0.75, CX + 16 + 11 * (10 * 0.55 + 1), mid + 10];
      assert.ok(pathBoxDist(d, words) >= 1.5 + 2, `loop ${pathBoxDist(d, words).toFixed(1)} from the words`);
      assert.ok(maxX + 1.5 < W - 87 - 4, `loop reaches x ${maxX.toFixed(1)}`);
    }
  });
  it('faceplate loop: drops right of the bottom jack (≥ 9.87), sags inside the strip, rises into the bottom plug', () => {
    const MM = 62 / 44.45;
    const top = 2 + 12.5 * MM;
    const bot = 2 + 29.5 * MM;
    const sag = num(/export const LOOP_SAG_Y = (\d+);/, PAIR);
    const body = /export const faceLoop = \(cx: number, yTop: number, yBot: number\) => \{([\s\S]*?)\n\};/.exec(PAIR)![1];
    // eslint-disable-next-line no-new-func
    const faceLoop = new Function('cx', 'yTop', 'yBot', 'CORD_DROP_DX', 'CORD_SETTLE_DY', 'LOOP_SAG_Y', body) as (a: number, b: number, c: number, d: number, e: number, f: number) => string;
    const d = faceLoop(CX, top, bot, 11, 12, sag);
    const p = sample(d);
    const maxY = Math.max(...p.map((q) => q[1]));
    assert.ok(Math.abs(maxY - sag) < 0.3, `sags to ${maxY.toFixed(2)}`);
    assert.ok(maxY + 1.2 <= 66 - 2, 'on the panel (its edge at y 64)');
    // beside the bottom jack (± its bushing), the cord runs ≥ 9.87 from its centre
    const near = p.filter((q) => Math.abs(q[1] - bot) <= 7.67 + 2.2 && q[0] > CX);
    assert.ok(near.length > 0);
    for (const q of near) assert.ok(Math.hypot(q[0] - CX, q[1] - bot) >= 9.87, `${q.map((v) => v.toFixed(1))}`);
    // it ends in the bottom plug, entering from the left
    assert.ok(Math.hypot(p.at(-1)![0] - (CX - 1), p.at(-1)![1] - (bot + 2)) < 0.01);
    // the U passes under the bottom jack's bushing
    assert.ok(sag - 1.2 > bot + 7.67 + 1, 'clear of the bushing');
  });
});

describe('R7-PB-03..05 patchbay words', () => {
  it('PB-03: a lone bottom cord is an ALT SOURCE, never "YOUR CABLE" with no source', () => {
    assert.match(PB_A, /bottomPatchLabel=\{routed \? 'TOP TO BOTTOM' : 'ALT SOURCE'\}/);
  });
  it('PB-04: the wrong-patch cords name the meter and the drum machine', () => {
    assert.doesNotMatch(PB_C, /LEFT BY SOMEONE/);
    assert.match(PB_C, /topPatchLabel="METER"\s*bottomPatchLabel="DRUM MACHINE"/);
  });
  it('PB-05: top = source is taught as "On most bays…"', () => {
    assert.match(src('patchbay/bits.tsx'), /export const MANTRA =\s*'On most bays, top is the source and bottom is the destination\./);
    assert.match(src('patchbay/PatchbayLabScreen.tsx'), /subtitle="On most bays, top is the source and bottom is the destination\./);
    assert.doesNotMatch(src('patchbay/bits.tsx'), /'Top is the source\./);
  });
});

/* ── Cable Install ───────────────────────────────────────────────────── */
const INSPECT = src('cableinstall/scenes/InspectScene.tsx');
const RACK = src('cableinstall/scenes/RackScene.tsx');
const RACK_ART = src('cableinstall/scenes/rackArt.tsx');
const FLOOR = src('cableinstall/scenes/FloorScene.tsx');
const ROUTE_ART = src('cableinstall/scenes/routeArt.tsx');
const WALLS_ART = src('cableinstall/scenes/wallsArt.tsx');
const WALLS = src('cableinstall/scenes/WallsScene.tsx');
const LABEL = src('cableinstall/scenes/LabelScene.tsx');
const INTRO = src('cableinstall/introSceneArt.tsx');
const at = (id: string) => {
  const d = CI_INSPECTION_POOL.find((p) => p.id === id)!;
  return [(d.x / 100) * 360, (d.y / 100) * 240] as P;
};
const MARKER_R = 10.5;

describe('R7-CI-01 facility runs reveal their whole length', () => {
  it('RunIn reveals max(typed, measured) — the analog run up the wall was typed short', () => {
    assert.match(INSPECT, /const len = useMemo\(\(\) => Math\.max\(typed, pathLen\(d\)\), \[typed, d\]\);/);
    const runs = [...INSPECT.matchAll(/<RunIn d=(?:"([^"]+)"|\{AC_BUNDLE_D\}) len=\{(\d+)\}/g)];
    assert.equal(runs.length, 6);
    const ac = /const AC_BUNDLE_D = '([^']+)';/.exec(INSPECT)![1];
    const short = runs.filter((m) => pathLen(m[1] ?? ac) > Number(m[2]));
    assert.ok(short.some((m) => (m[1] ?? '').startsWith('M150 226.4')), 'the wall run was typed short (and is now measured)');
  });
});

describe('R7-CI-02 the AC cord passes the rated wall in a named sleeve', () => {
  const S = /export const WALL_SLEEVE = \{ x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), labelX: ([\d.]+), labelY: ([\d.]+), labelU: ([\d.]+) \}/.exec(INSPECT)!.slice(1).map(Number);
  const [x, y, w, h, lx, ly, lu] = S;
  it('the sleeve spans the wall (x 254–259) and holds both runs (y 178, 180.4, each 2.4 wide)', () => {
    assert.ok(x < 254 && x + w > 259);
    assert.ok(y < 178 - 1.2 && y + h > 180.4 + 1.2);
    assert.match(INSPECT, /<Rect x=\{WALL_SLEEVE\.x\} y=\{WALL_SLEEVE\.y\} width=\{WALL_SLEEVE\.w\} height=\{WALL_SLEEVE\.h\}/);
    assert.match(INSPECT, /fill="#d2452f"/, 'firestop at the faces');
  });
  it('it is named, ≥ 9 pt, clear of the runs, the rated-wall marks and the markers', () => {
    assert.match(INSPECT, /FIRESTOPPED SLEEVE/);
    assert.ok(pt(lu, CI_W, 360) >= 9);
    const box = textBox(lx, ly, 'FIRESTOPPED SLEEVE', lu, 'end', false);
    assert.ok(box[3] + 2 < 178 - 1.2, 'above the runs');
    assert.ok(box[2] < 254, 'on the wall side, off the wall');
    assert.ok(pathBoxDist('M259 160 l-5 7', box) > 1, 'clear of the rated-wall hatch');
    for (const id of ['ins-9', 'ins-11', 'ins-5', 'ins-10']) assert.ok(boxDist(at(id), box) > MARKER_R, id);
  });
});

describe('R7-CI-03 the BEFORE thumbnail draws no text', () => {
  it('thumb → no cable flags, no silkscreen', () => {
    assert.match(RACK, /<RackSvg w=\{beforeW\} mode="bad" thumb \/>/);
    assert.match(RACK, /<RackPaints uid=\{uid\} noText=\{thumb\}>/);
    assert.match(RACK, /<BadCables enter=\{enter\} found=\{found\} noText=\{thumb\} \/>/);
    assert.match(RACK, /\{!noText \? \(\s*<>\s*<SvgText[\s\S]*?N-012[\s\S]*?N-007[\s\S]*?<\/>\s*\) : null\}/);
    assert.match(RACK_ART, /const show = useContext\(SilkCtx\);\s*if \(!show\) return null;/);
    assert.match(RACK_ART, /<SilkCtx\.Provider value=\{!noText\}>/);
    // every other SvgText in the rack is in the TRACE (phase C), never in mode "bad"
    const bad = RACK.slice(RACK.indexOf('const BadCables = memo'), RACK.indexOf('const BadCables = memo') + 12000);
    assert.equal((bad.slice(0, bad.indexOf('});\n')).match(/<SvgText/g) ?? []).length, 2);
  });
});

describe('R7-CI-04 SNAKE / HEAD ≥ 9 pt', () => {
  it('10 units at the 328-pt figure, still short of wedge 1', () => {
    for (const t of ['SNAKE', 'HEAD']) {
      const m = new RegExp(`<PlanLabel x=\\{([\\d.]+)\\} y=\\{[\\d.]+\\} text="${t}" anchor="start" size=\\{(\\d+)\\} />`).exec(FLOOR)!;
      assert.ok(pt(Number(m[2]), CI_W, 360) >= 9, t);
      const end = Number(m[1]) + 10 * 0.45 + t.length * 10 * 0.62;
      assert.ok(end < 120 - 9.6 - 4, `${t} ends at ${end.toFixed(1)}`);
    }
  });
});

describe('R7-CI-05 backstage words off the hazard stripes', () => {
  const L = /export const BACKSTAGE_LABELS = \{\s*loadIn: \[([\d.]+), ([\d.]+)\],\s*forklift: \[([\d.]+), ([\d.]+)\],\s*laneLeader: \[[^\]]+\],\s*mat: \[([\d.]+), ([\d.]+)\],\s*rated: \[([\d.]+), ([\d.]+)\],/.exec(FLOOR)!.slice(1).map(Number);
  const boxes = {
    'LOAD-IN': textBox(L[0], L[1], 'LOAD-IN', 10.5, 'start'),
    'FORKLIFT PATH': textBox(L[2], L[3], 'FORKLIFT PATH', 10.5, 'start'),
    MAT: textBox(L[4], L[5], 'MAT', 10.5, 'start'),
    'RATED + MARKED': textBox(L[6], L[7], 'RATED + MARKED', 10.5, 'end'),
  };
  const edges = ['M52 10 L200 204', 'M100 10 L268 204'];
  const routes = ['M42 100 L300 179', 'M42 106 H48 V184 H300', 'M42 94 H48 V30 H292 V174 H300'];
  it('every word is ≥ 2 units off both striped edges (2.4 wide) and every route (2.8 wide)', () => {
    for (const [t, b] of Object.entries(boxes)) {
      for (const e of edges) assert.ok(pathBoxDist(e, b) >= 1.2 + 2, `${t} vs edge ${pathBoxDist(e, b).toFixed(1)}`);
      for (const r of routes) assert.ok(pathBoxDist(r, b) >= 1.4 + 1, `${t} vs route ${pathBoxDist(r, b).toFixed(1)}`);
    }
    // RATED + MARKED clear of the protector's dashed side line (x 172, y 168–190)
    assert.ok(boxes['RATED + MARKED'][1] > 190 + 1);
    assert.match(FLOOR, /text="RATED \+ MARKED" anchor="end"/);
  });
});

describe('R7-CI-06 route B clear of AMP ROOM', () => {
  it('the word sits between the wall (x 10) and route B (x 70)', () => {
    const x = num(/export const AMP_ROOM_LABEL_X = (\d+);/, ROUTE_ART);
    assert.match(ROUTE_ART, /<Room x=\{AMP_ROOM_LABEL_X\} y=\{100\} text="AMP ROOM" \/>/);
    const b = textBox(x, 100, 'AMP ROOM', 10.5, 'middle');
    assert.ok(b[0] > 10 + 1, `left ${b[0].toFixed(1)}`);
    for (const d of ['M44 156 V144 H70 V84', 'M40 156 V148 H86 V84', 'M36 156 V140 H80 V84']) assert.ok(pathBoxDist(d, b) >= 0.8 + 1.5, d);
  });
});

describe('R7-CI-07 the elevation rack at true size', () => {
  it('0.6 m × 1.93 m (35 × 112 at 58 units/m), right side at x 70, narrower than the 44-unit door', () => {
    const [x, w, h] = /export const RACK_FRONT = \{ x: (\d+), w: (\d+), h: (\d+) \}/.exec(WALLS_ART)!.slice(1).map(Number);
    const M = num(/export const WALL_M = (\d+);/, WALLS_ART);
    assert.ok(Math.abs(w / M - 0.6) < 0.02, `${(w / M).toFixed(2)} m`);
    assert.ok(Math.abs(h / M - 1.93) < 0.02, `${(h / M).toFixed(2)} m`);
    assert.equal(x + w, 70, 'the routes leave its side at x 70');
    assert.ok(w < 44, 'narrower than the door opening');
    assert.doesNotMatch(WALLS_ART, /width=\{54\}/);
  });
});

describe('R7-CI-08 the fixed exit is concealed', () => {
  it('a fitting under the grommet and a drop over the whole bushed run, into the baseboard raceway', () => {
    const [x, w, top, bottom] = /export const EDGE_DROP = \{ x: ([\d.]+), w: ([\d.]+), top: ([\d.]+), bottom: ([\d.]+) \}/.exec(WALLS)!.slice(1).map(Number);
    // the bushed run: … 154 86 L154 150 (2.2 wide)
    assert.match(WALLS, /const EDGE_BUSH = \[152\.6, 77\.6, 154, 80\.5, 154, 86\] as const;/);
    assert.ok(x < 154 - 1.1 - 1 && x + w > 154 + 1.1 + 1, 'covers the run');
    assert.ok(top <= 86 && top - 1.5 > 77 + 5.5 - 1, 'from just under the grommet');
    assert.ok(bottom >= 151, 'into the baseboard raceway (y 151)');
    assert.match(WALLS, /<G opacity=\{1 - rest\}>\s*<Rect x=\{EDGE_DROP\.x\}/);
  });
});

describe('R7-CI-09 stage-end flags print the ID', () => {
  const region = LABEL.slice(LABEL.indexOf('const NET_CABLE = '), LABEL.indexOf('const cableTint'));
  // eslint-disable-next-line no-new-func
  const G = new Function(stripTypeScriptTypes(region) + '\nreturn { S_Y, W_Y, PERM_B, PERM_C, WS_X, FLAG_S_X, FLAG_S_W, BOX_X, STAGE_JACK_X, RUN_END_X, START_Y, cablePath };')() as {
    S_Y: number[]; W_Y: number[]; PERM_B: number[]; PERM_C: number[]; WS_X: number[]; FLAG_S_X: number; FLAG_S_W: number; BOX_X: number;
    STAGE_JACK_X: readonly number[]; RUN_END_X: number; START_Y: number[]; cablePath: (i: number) => string;
  };
  it('a 10-unit ID in a flag between the fan-out and the box, clear of the next run up', () => {
    assert.ok(pt(10, CI_W, 360) >= 9);
    const textW = 5 * 10 * 0.5; // "A-010" in Oswald, generous
    assert.ok(G.FLAG_S_W >= textW + 2);
    for (let i = 0; i < 4; i++) assert.ok(G.WS_X[i] + 3 < G.FLAG_S_X, 'after the fan-out');
    assert.ok(G.FLAG_S_X + G.FLAG_S_W < G.BOX_X, 'off the stage box');
    assert.ok(G.BOX_X < G.STAGE_JACK_X[0] - 5.4, 'the box still frames its jacks');
    const gaps = G.S_Y.slice(1).map((y, k) => y - G.S_Y[k]);
    for (const g of gaps) assert.ok(g - 13 >= 1.2 + 0.5, 'flag top clear of the run above');
    assert.match(LABEL, /<LabelFlag x=\{FLAG_S_X\} y=\{s - 13\} w=\{FLAG_S_W\} h=\{12\}[^>]*>\s*<SvgText[^>]*fontSize=\{10\}[^>]*>\s*\{CABLE_FLAGS\[i\]\}/);
    assert.match(LABEL, /<LabelFlag x=\{FLAG_S_X\} y=\{S_Y\[PERM_C\[TARGET_CABLE\]\] - 13\} w=\{FLAG_S_W\}[^>]*>\s*<SvgText[^>]*>\s*\{CABLE_FLAGS\[TARGET_CABLE\]\}/);
  });
  it('after the sleeve the runs only fan out (no crossing); no two runs ever lie side by side < 6 apart', () => {
    assert.deepEqual(G.PERM_B, G.PERM_C);
    const ys = [0, 1, 2, 3].map((i) => sample(G.cablePath(i), 60));
    const yAt = (pts: P[], x: number) => {
      for (let k = 1; k < pts.length; k++) {
        const [a, b] = [pts[k - 1], pts[k]];
        if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return { y: a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]), flat: Math.abs(b[1] - a[1]) / Math.abs(b[0] - a[0]) < 0.05 };
      }
      return null;
    };
    for (let x = 126; x <= 266; x += 0.5) {
      const at4 = ys.map((p) => yAt(p, x));
      for (let a = 0; a < 4; a++)
        for (let b = a + 1; b < 4; b++) {
          const [p, q] = [at4[a], at4[b]];
          if (!p || !q || !p.flat || !q.flat) continue;
          assert.ok(Math.abs(p.y - q.y) >= 6, `runs ${a + 1}/${b + 1} at x ${x}: ${Math.abs(p.y - q.y).toFixed(1)} apart`);
        }
    }
    for (let i = 0; i < 4; i++) {
      const p = ys[i];
      assert.ok(Math.abs(p.at(-1)![1] - G.S_Y[G.PERM_C[i]]) < 1e-9 && p.at(-1)![0] === G.RUN_END_X, `run ${i + 1} on its jack`);
    }
  });
});

describe('R7-CI-10 the connector-pull rule reads plainly', () => {
  it('no "Where inappropriate, never…"', () => {
    const r = CI_RULES.find((x) => x.id === 'mech-no-connector-pull')!;
    assert.doesNotMatch(r.studentText, /inappropriate/i);
    // audit R2 R051507: stated as the professional rule (2026-10-23)
    assert.match(r.studentText, /not on its connector\./);
  });
});

describe('R7-CI-11 the intro tray runs start at the cut edge', () => {
  it('both runs and the tray begin at x 0', () => {
    assert.equal(num(/export const TRAY_RUN_X0 = (\d+);/, INTRO), 0);
    assert.match(INTRO, /const trayRunA = useMemo\(\s*\(\) => \[\s*\{ x: TRAY_RUN_X0, y: 32\.5 \},/);
    assert.match(INTRO, /const trayRunB = useMemo\(\s*\(\) => \[\s*\{ x: TRAY_RUN_X0, y: 41 \},/);
    assert.match(INTRO, /<CableTray x=\{TRAY_RUN_X0\} y=\{28\} w=\{270 - TRAY_RUN_X0\}/);
  });
});

describe('R7-CI-12 the upstage quad boxes feed the amp and the keys', () => {
  const block = /const UP_MAINS = \[([\s\S]*?)\] as const;/.exec(FLOOR)![1];
  const lead = (id: string) => {
    const m = new RegExp(`\\{ id: '${id}', d: '([^']+)', inlet: \\[([^\\]]+)\\], plug: \\[([^\\]]+)\\] \\}`).exec(block)!;
    return { d: m[1], inlet: m[2].split(',').map(Number), plug: m[3].split(',').map(Number) };
  };
  it('amp: from its side inlet (x 62) to a plug seated in the SR box (62–69 × 69.2–74.8), clear of GTR AMP', () => {
    const a = lead('amp');
    const p = sample(a.d);
    const [ix, iy, iw, ih] = a.inlet;
    assert.ok(boxDist(p[0], [ix, iy, ix + iw, iy + ih]) < 1, 'starts on the amp inlet');
    assert.ok(Math.abs(ix + iw / 2 - 62) < 0.1, 'inlet on the amp side panel');
    const [px, py, pw, ph] = a.plug;
    assert.ok(boxDist(p.at(-1)!, [px, py, px + pw, py + ph]) < 0.4, 'ends on its plug');
    assert.ok(px >= 62 && px + pw <= 69 && py + ph >= 69.2 && py + ph <= 69.2 + 0.6, 'plug seated in the box top');
    assert.match(FLOOR, /<PlanLabel x=\{69\} y=\{39\} text="GTR AMP" anchor="start" size=\{9\.6\} \/>/);
    assert.ok(pathBoxDist(a.d, textBox(69, 39, 'GTR AMP', 9.6, 'start')) >= 0.8 + 1);
  });
  it('keys: from its rear inlet (y 60) to a plug on the SL box face (x 325), clear of KEYS · DI', () => {
    const k = lead('keys');
    const p = sample(k.d);
    const [ix, iy, iw, ih] = k.inlet;
    assert.ok(boxDist(p[0], [ix, iy, ix + iw, iy + ih]) < 1);
    assert.ok(ix >= 262 && ix + iw <= 318 && Math.abs(iy + ih / 2 - 60) < 0.1, 'inlet on the keyboard rear panel');
    const [px, py, pw, ph] = k.plug;
    assert.ok(boxDist(p.at(-1)!, [px, py, px + pw, py + ph]) < 0.4);
    assert.ok(Math.abs(px + pw - 325.5) < 0.1 && py >= 77.2 && py + ph <= 82.8, 'plug seated in the box face');
    assert.ok(pathBoxDist(k.d, textBox(290, 72, 'KEYS · DI', 9.6, 'middle')) >= 0.8 + 1);
    assert.ok(pathBoxDist(k.d, [314 - 1.2, 58.6, 321 + 1.2, 63.4 + 1.2]) >= 0.8 + 1, 'clear of the keys → DI lead');
    assert.match(FLOOR, /\{UP_MAINS\.map\(\(u\) => \(/);
  });
});
