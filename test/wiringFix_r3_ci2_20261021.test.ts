/**
 * Wiring fix round 3, Cable Install part 2 (owner go 2026-10-21), pinned
 * from the source (the scenes import react-native-svg, so their layout
 * constants are evaluated here, or read as literals).
 *  - R3-CI-01  Labeling: N-004 is a NETWORK run — network colour, ending on an
 *              etherCON "NET A" jack, never a stage-box XLR.
 *  - R3-CI-02  Labeling: every run starts ON its own rack-end port (PP2 10–12,
 *              SW1-04) and passes the wall in a SLEEVE — no face crossings.
 *  - R3-CI-03  Rack: the DSP's audio reaches the interface over the network:
 *              DSP NET → switch → interface NET, network colour, traceable.
 *  - R3-CI-04  Routes: the mechanical-bay route is no longer "Shortest";
 *              relLength matches the drawn lengths; tray is still the answer.
 *  - R3-CI-05  Rack: every DrawPath reveals its WHOLE path (len from the path).
 *  - R3-CI-06  Inspection: the analog run lies on the floor through the ramp;
 *              the network run comes along the tray from the cut edge.
 *  - R3-CI-07  Rack: switch and interface get IEC C13 cords; the white control
 *              cable lands on a control terminal block, not the RJ45 NET.
 *  - S3 extras: keys → DI lead, backstage routes start on the distro, the
 *              SNAKE HEAD label clear of wedge 1, the key names the MON
 *              returns, "cables drawn wider for tracing", ins-7 / ins-10 on
 *              their items, Emi "reduce that".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { pathLen } from '../src/screens/lab/cableinstall/pathLen.ts';
import { rankRoutes } from '../src/screens/lab/cableinstall/engine/routeEval.ts';
import { CI_CABLE_SCHEDULE, CI_INSPECTION_POOL, CI_ROUTE_SCENARIOS } from '../src/screens/lab/cableinstall/data/scenarios.ts';
import { CI_CLASS_TINTS } from '../src/screens/lab/cableinstall/data/cableTypes.ts';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/cableinstall/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LABEL = read('scenes/LabelScene.tsx');
const RACK = read('scenes/RackScene.tsx');
const RACK_ART = read('scenes/rackArt.tsx');
const ROUTE = read('scenes/RouteScene.tsx');
const INSPECT = read('scenes/InspectScene.tsx');
const FLOOR = read('scenes/FloorScene.tsx');
const EMI = read('scenes/EmiScene.tsx');

/* ── LabelScene geometry, evaluated ─────────────────────────────────────── */
type LabelGeo = {
  NET_CABLE: number;
  START_Y: number[];
  START_X: number[];
  PP2_X: number;
  PP2_ROW_X: readonly number[];
  SW_PORT_X: number[];
  W_Y: number[];
  S_Y: number[];
  PERM_B: number[];
  PERM_C: number[];
  STAGE_JACK_X: readonly number[];
  RUN_END_X: number;
  SLEEVE: { x: number; w: number; y: number; h: number };
  PW_X: number[];
  WS_X: number[];
  FLAG_P_X: number;
  FLAG_S_X: number;
  BADGE_X: number;
  cablePath: (i: number) => string;
};
const labelRegion = LABEL.slice(LABEL.indexOf('const NET_CABLE = '), LABEL.indexOf('const cableTint'));
const L: LabelGeo = new Function(
  stripTypeScriptTypes(labelRegion) +
    '\nreturn { NET_CABLE, START_Y, START_X, PP2_X, PP2_ROW_X, SW_PORT_X, W_Y, S_Y, PERM_B, PERM_C, STAGE_JACK_X, RUN_END_X, SLEEVE, PW_X, WS_X, FLAG_P_X, FLAG_S_X, BADGE_X, cablePath };',
)();

test('R3-CI-01: N-004 is drawn as network and lands on the etherCON "NET A"', () => {
  const row = CI_CABLE_SCHEDULE.find((r) => r.cableId === 'N-004')!;
  assert.equal(row.destination, 'STG-NET-A');
  assert.match(LABEL, /const CABLE_FLAGS = \['A-010', 'A-011', 'A-012', 'N-004'\] as const;/);
  assert.equal(L.NET_CABLE, 3, 'cable 4 is N-004');
  assert.match(LABEL, /const cableTint = \(i: number\) => \(i === NET_CABLE \? CI_CLASS_TINTS\.network : CI_CLASS_TINTS\.analog\);/);
  assert.match(LABEL, /<JacketPath key=\{i\} d=\{cablePath\(i\)\} color=\{cableTint\(i\)\} width=\{2\.4\} \/>/);
  assert.doesNotMatch(LABEL, /<JacketPath key=\{i\} d=\{cablePath\(i\)\} color="#4fd0e0"/, 'no longer one cyan tint for all four');
  assert.notEqual(CI_CLASS_TINTS.network, CI_CLASS_TINTS.analog);
  // the jack it lands on is the etherCON, and it is named
  assert.match(LABEL, /col === 0 && row === PERM_C\[NET_CABLE\] \? <PanelEthercon/);
  assert.match(LABEL, /text="NET A"/);
  const end = L.cablePath(3).match(/(-?[\d.]+) (-?[\d.]+) H([\d.]+)$/)!;
  assert.equal(Number(end[2]), L.S_Y[L.PERM_C[3]], 'N-004 ends on the etherCON row');
});

test('R3-CI-02: every run starts on its own port, passes a sleeve, ends on its own jack', () => {
  // A-010…A-012 start on PP2's port column, on drawn port rows; N-004 on SW1 port 4
  assert.ok(L.PP2_ROW_X.includes(L.PP2_X));
  for (const i of [0, 1, 2]) {
    assert.equal(L.START_X[i], L.PP2_X);
    assert.ok(L.cablePath(i).startsWith(`M${L.PP2_X} ${L.START_Y[i]} `), `run ${i + 1} starts on its PP2 port`);
  }
  assert.equal(L.START_X[3], L.SW_PORT_X[3]);
  assert.match(LABEL, /START_Y\.slice\(0, 3\)\.map\(\(y\) => \(\s*<PanelXlr key=\{y\} x=\{x\} y=\{y\} male \/>/);
  // ends land inside the jack's flange (x ± 5.4), each on its own row
  const half = 5.4;
  assert.ok(Math.abs(L.RUN_END_X - L.STAGE_JACK_X[0]) < half);
  assert.equal(new Set(L.PERM_C).size, 4);
  // the sleeve: no lane change inside it, under a flag or under a badge
  const s0 = L.SLEEVE.x - 1.6;
  const s1 = L.SLEEVE.x + L.SLEEVE.w + 1.6;
  for (let i = 0; i < 4; i++) {
    assert.ok(L.PW_X[i] - 4 > L.BADGE_X + 6.5 && L.PW_X[i] - 4 > L.FLAG_P_X + 36, `run ${i + 1}: first lane change clear of flag + badge`);
    assert.ok(L.PW_X[i] + 4 < s0, `run ${i + 1}: lane change before the sleeve`);
    assert.ok(L.WS_X[i] - 3 > s1, `run ${i + 1}: lane change after the sleeve`);
    assert.ok(L.WS_X[i] + 3 < L.FLAG_S_X, `run ${i + 1}: stage flag clear of its lane change`);
    const wy = L.W_Y[L.PERM_B[i]];
    assert.ok(wy > L.SLEEVE.y && wy < L.SLEEVE.y + L.SLEEVE.h, `run ${i + 1} passes inside the sleeve`);
  }
  assert.match(LABEL, /text="WALL SLEEVE"/);
  assert.doesNotMatch(LABEL, /text="WALL PLATE"/);
  // the PP2 ports are male (rack end: signal leaves), the stage inputs female
  assert.match(LABEL, /function PanelXlr\(\{ x, y, male = false \}/);
});

/* ── Rack ──────────────────────────────────────────────────────────────── */
const num = (re: RegExp, s = RACK_ART) => Number(s.match(re)![1]);
const DSP_NET_X = num(/export const DSP = \{[^}]*netX: ([\d.]+)/);
const DSP_IEC_X = num(/export const DSP = \{[^}]*iecX: ([\d.]+)/);
const IFACE_NET_X = num(/export const IFACE = \{[^}]*netX: ([\d.]+)/);
const IFACE_IEC_X = num(/export const IFACE = \{[^}]*iecX: ([\d.]+)/);
const SW_IEC_X = num(/export const SWITCH = \{[^}]*iecX: ([\d.]+)/);
const RK = 22 / 44.45;
const FLANGE_HALF = (26 * RK) / 2;

test('R3-CI-03: DSP → switch → interface over the network, each link its own lane', () => {
  const dspLink = RACK.slice(RACK.indexOf('const DSP_LINK_D'), RACK.indexOf('const LINK_HM_Y'));
  assert.match(dspLink, /^const DSP_LINK_D =\s*`M\$\{SW_CX\[7\]\} \$\{SWITCH\.portCy\} /);
  assert.match(dspLink, /\$\{DSP\.netX\} \$\{LINK_Y \+ 5\} V\$\{DSP\.jackY\}`;/);
  const ifLink = RACK.slice(RACK.indexOf('const IFACE_LINK_D'), RACK.indexOf('function FiberTail'));
  assert.match(ifLink, /^const IFACE_LINK_D =\s*`M\$\{SW_CX\[5\]\} \$\{SWITCH\.portCy\} /);
  assert.match(ifLink, /\$\{IFACE\.netX\} \$\{LINK_HM_Y \+ 4\} V\$\{IFACE\.jackY\}`;/);
  assert.match(RACK, /<JacketPath d=\{DSP_LINK_D\} color=\{N\}/);
  assert.match(RACK, /<JacketPath d=\{IFACE_LINK_D\} color=\{N\}/);
  assert.match(RACK, /<Rj45PlugRear cx=\{DSP\.netX\} cy=\{DSP\.jackY\} color=\{N\} \/>/);
  assert.match(RACK, /<Rj45PlugRear cx=\{IFACE\.netX\} cy=\{IFACE\.jackY\} color=\{N\} \/>/);
  assert.match(RACK_ART, /<PanelJack x=\{IFACE\.netX\} y=\{IFACE\.jackY\} k=\{RK\} kind="rj45" \/>/);
  // the interface link drops between the DSP's NET port and its inlet, and
  // between the switch's last SFP cage and its inlet — touching none
  const drop = IFACE_NET_X;
  const w = 1.4 / 2;
  assert.ok(drop - w > DSP_NET_X + FLANGE_HALF + 1, 'clear of the DSP NET flange');
  assert.ok(drop + w < DSP_IEC_X - 0.6 - 1, 'clear of the DSP C13 plug');
  assert.ok(drop + w < SW_IEC_X - 0.6 - 1, 'clear of the switch C13 plug');
  assert.ok(drop - w > 256 + (14 * RK) / 2 + 1, 'clear of the second SFP cage');
  assert.ok(drop - w > 258 + 3.2 + 1 && drop + w < 274 - 3.2, 'leaves the horizontal manager between two fingers');
  // the switch lights the two new ports
  assert.match(RACK, /<NetworkSwitch lit=\{dress \? \[0, 1, 2, 3, 5, 7\] : \[0, 4\]\} \/>/);
  // the DSP's lane sits above the analog harness (turn-in 102.7) and below the SFP cages
  const linkY = num(/const LINK_Y = ([\d.]+);/, RACK);
  assert.ok(linkY + 0.5 < 102.7 - 0.5 && linkY - 0.5 > 96.6 + (9.5 * RK) / 2);
});

test('R3-CI-04: the mechanical-bay route is named for what it is and its length matches the drawing', () => {
  const sc = CI_ROUTE_SCENARIOS.find((s) => s.id === 'stage-to-rack')!;
  const block = ROUTE.slice(ROUTE.indexOf("'stage-to-rack': {"), ROUTE.indexOf("'amp-to-cluster': {"));
  const drawn: Record<string, number> = {};
  for (const o of sc.options) {
    const seg = block.slice(block.indexOf(`'${o.id}'`));
    const body = seg.slice(0, seg.indexOf(']'));
    drawn[o.id] = [...body.matchAll(/len: ([\d.]+)/g)].reduce((a, m) => a + Number(m[1]), 0);
  }
  const shortest = Math.min(...Object.values(drawn));
  for (const o of sc.options) {
    assert.ok(Math.abs(o.relLength - drawn[o.id] / shortest) <= 0.06, `${o.id}: relLength ${o.relLength} vs drawn ${(drawn[o.id] / shortest).toFixed(2)}`);
    if (/shortest/i.test(o.name)) assert.equal(o.relLength, 1, `${o.id} is only called shortest if it is`);
  }
  const mech = sc.options.find((o) => o.id === 'mech-shortcut')!;
  assert.doesNotMatch(mech.name, /shortest/i);
  assert.ok(Math.abs(mech.relLength - 1.7) < 0.05);
  // the teaching point holds: the real shortest (the floor) is not the best, and carries the rule
  const floor = sc.options.find((o) => o.id === 'floor-shortcut')!;
  assert.equal(floor.relLength, 1);
  assert.ok(floor.flags.some((f) => f.ruleId === 'plan-shortest-not-best'));
  assert.ok(!mech.flags.some((f) => f.ruleId === 'plan-shortest-not-best'));
  const ranked = rankRoutes(sc.options);
  assert.equal(ranked[0].option.id, 'tray-route', 'the tray is still the answer');
  assert.ok(ranked.find((r) => r.option.id === 'floor-shortcut')!.safetyReject);
});

test('R3-CI-05: every DrawPath reveals its whole path', () => {
  // pathLen itself
  assert.equal(pathLen('M0 0 H10 V10'), 20);
  assert.ok(Math.abs(pathLen('M0 0 A10 10 0 0 1 20 0') - Math.PI * 10) < 1);
  assert.ok(Math.abs(pathLen('M0 0 Q10 0 10 10') - 16.23) < 1);
  // the old as-found AC cord: len 200 against a 245-unit path (the bug)
  assert.ok(pathLen('M190 29 C204 15 258 13 272 16 C279 18 280 30 280 48 V96 C280 142 250 162 243.5 153.2') > 240);
  // DrawPath now takes the larger of its len and the path's own length
  assert.match(RACK, /const full = useMemo\(\(\) => Math\.max\(len, pathLen\(d\)\), \[len, d\]\);/);
  assert.match(RACK, /return <JacketCable d=\{d\} len=\{full\} p=\{p\}/);
  // every literal DrawPath is measurable (so the reveal reaches its plug)
  for (const m of RACK.matchAll(/<DrawPath[^>]*?\bd="([^"]+)"/g)) assert.ok(pathLen(m[1]) > 0, m[1]);
  // the as-found AC cord now ends at the DSP inlet's boot, wherever that is
  assert.match(RACK, /\$\{DSP\.iecX \+ 7\.5\} 162 \$\{DSP\.iecX \+ 7\.5\} \$\{DSP\.y \+ 47\.2\}`\} len=\{260\}/);
});

test('R3-CI-06: the analog run lies on the floor through the ramp; the network run starts at the cut edge', () => {
  const runs = [...INSPECT.matchAll(/<RunIn d="([^"]+)"[^>]*color=\{CI_CLASS_TINTS\.(analog|network)\}/g)];
  const analog = runs.filter((m) => m[2] === 'analog').map((m) => m[1]).join(' ');
  assert.doesNotMatch(analog, / 210 /, 'no longer floats at y 210');
  // across the aisle (ramp x 128–172) it lies at floor level, inside the ramp body (y 223–228)
  const floorRun = analog.match(/H150 M150 226\.4 H210/) ?? analog.match(/120 226\.4 H150/);
  assert.ok(floorRun, 'the run crosses x 120–210 at y 226.4');
  assert.ok(226.4 - 1.2 >= 223 && 226.4 + 1.2 <= 228);
  // the ramp's lid is drawn over the run, not the run over the ramp
  assert.ok(INSPECT.indexOf('the ramp\'s lid, over the run') > INSPECT.indexOf('<RunIn d="M36 196'));
  const net = runs.filter((m) => m[2] === 'network').map((m) => m[1]);
  assert.ok(net[0].startsWith('M0 25 '), 'network run comes in from the cut edge');
  assert.match(INSPECT, /<LadderTraySide x0=\{0\} x1=\{244\} y=\{26\}/);
});

test('R3-CI-07: the switch and the interface each have their own C13 cord; control lands on a control port', () => {
  assert.match(RACK_ART, /<IecInlet x=\{SWITCH\.iecX\} y=\{SWITCH\.iecY\} \/>/);
  assert.match(RACK_ART, /<IecInlet x=\{IFACE\.iecX\} y=\{IFACE\.jackY - 5\.5\} \/>/);
  for (const dev of ['SWITCH.iecX} y={SWITCH.iecY', 'DSP.iecX} y={DSP.y + 32', 'IFACE.iecX} y={IFACE.jackY - 5.5']) {
    assert.ok(RACK.includes(`<C13Plug x={${dev}} />`), `C13 seated at ${dev}`);
  }
  // three feeds from three outlets, nested so none crosses another: the outlet
  // further left takes the lower lane, the outer manager lane, the higher turn-in
  const feeds = RACK.slice(RACK.indexOf('const AC_FEEDS'), RACK.indexOf('const acFeedD'));
  const rows = [...feeds.matchAll(/outlet: (\d), lane: ([\d.]+), mgrX: ([\d.]+)/g)].map((m) => m.slice(1).map(Number));
  assert.equal(rows.length, 3);
  assert.equal(new Set(rows.map((r) => r[0])).size, 3);
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i][0] > rows[i - 1][0] && rows[i][1] < rows[i - 1][1] && rows[i][2] < rows[i - 1][2], 'nested lanes');
  }
  assert.match(feeds, /boot: \{ x: SWITCH\.iecX \+ 7\.5/);
  assert.match(feeds, /boot: \{ x: IFACE\.iecX \+ 7\.5/);
  // the white control cable is a control cable on a terminal block — no Cat cable drawn white into NET
  const ctl = RACK.slice(RACK.indexOf('function ControlTail'), RACK.indexOf('function NetTail'));
  assert.doesNotMatch(ctl, /Rj45PlugRear/);
  assert.match(ctl, /<TerminalBlock x=\{cx\} y=\{DSP\.ctlY\} seated \/>/);
  assert.match(RACK_ART, /<Silk x=\{DSP\.ctlX \+ 6\} y=\{y \+ DSP\.h - 3\.6\} text="CTRL" \/>/);
  // the NET port's only cable is the green link
  assert.equal((RACK.match(/cx=\{DSP\.netX\}/g) ?? []).length, 1);
});

test('S3 extras: keys → DI lead, backstage starts, SNAKE HEAD label, key + caption, markers, Emi wording', () => {
  // keys → DI: a lead from the keyboard's rear edge (y 60) to the DI's input from below (DI box y 53.4–58.6)
  assert.match(FLOOR, /const KEYS_DI_D = 'M314 60 [^']* V58\.6';/);
  assert.match(FLOOR, /<JacketPath d=\{KEYS_DI_D\} color=\{mic\}/);
  // backstage: every route starts on the distro's face (x 10 + 32 = 42)
  const bs = FLOOR.slice(FLOOR.indexOf('function BackstagePlan'), FLOOR.indexOf('function RouteLetter'));
  const starts = [...bs.matchAll(/<RoutePath d="M([\d.]+) /g)].map((m) => Number(m[1]));
  assert.deepEqual(starts, [42, 42, 42]);
  assert.match(bs, /<DistroTop x=\{10\} y=\{86\} \/>/);
  // SNAKE HEAD on two lines, ending well short of wedge 1 (x 120 − 9.6)
  assert.doesNotMatch(FLOOR, /text="SNAKE HEAD"/);
  for (const t of ['SNAKE', 'HEAD']) {
    const m = FLOOR.match(new RegExp(`<PlanLabel x=\\{([\\d.]+)\\} y=\\{[\\d.]+\\} text="${t}" anchor="start" size=\\{10\\} />`))!; // R7-CI-04: 10 units renders >= 9 pt
    const end = Number(m[1]) + 10 * 0.45 + t.length * 10 * 0.62;
    assert.ok(end < 120 - 9.6 - 4, `${t} ends at ${end.toFixed(1)}`);
  }
  // the key names the MON returns; the caption owns the wide cables
  assert.match(FLOOR, /the MON returns back to the snake head/);
  assert.match(FLOOR, /cables drawn wider for tracing/);
  // ins-7 on the door threshold, ins-10 on the rated wall where the network run passes
  const pos = (id: string) => {
    const d = CI_INSPECTION_POOL.find((p) => p.id === id)!;
    return { x: (d.x / 100) * 360, y: (d.y / 100) * 240 };
  };
  const door = pos('ins-7');
  assert.ok(door.x >= 253 && door.x <= 268 && door.y >= 192 && door.y <= 228, `ins-7 at ${door.x}, ${door.y}`);
  const sleeve = pos('ins-10');
  assert.ok(sleeve.x >= 254 && sleeve.x <= 259 && Math.abs(sleeve.y - 101) <= 3, `ins-10 at ${sleeve.x}, ${sleeve.y}`);
  // Emi: twisting and distance REDUCE magnetic pickup, they do not stop it
  assert.match(EMI, /twisting and distance reduce that/);
  assert.doesNotMatch(EMI, /distance stop that/);
});
