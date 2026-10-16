/**
 * Amplifier Principles — lab-art fix round 3 (2026-10-16). The grading found
 * gear drawn as labelled boxes and the Class D stage an OPEN circuit (the node
 * wire started in the gap between two boxes, the filter capacitor had no
 * ground, the load no return).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f: string) => readFileSync(new URL(`../src/screens/lab/amp/${f}`, import.meta.url), 'utf8');
const block = (src: string, start: string, end: string) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));

test('Class D: a closed half-bridge — rails, two MOSFETs, a node junction, L, C to 0 V, speaker to 0 V', () => {
  const m5 = read('modules/mod5ClassD.tsx');
  const st = block(m5, 'function SwitchingStage(', 'const LOSSES');
  assert.equal((st.match(/<MosfetSymbol /g) ?? []).length, 2);
  assert.match(st, /<Circle cx=\{DX\} cy=\{NODE_Y\} r=\{3\}/, 'the switching node is a junction ON the device column');
  assert.match(st, /<Line x1=\{OUT_X\} y1=\{104\} x2=\{OUT_X\} y2=\{GND_Y\}/, 'C returns to 0 V');
  assert.match(st, /<Line x1=\{SPK_X\} y1=\{110\} x2=\{SPK_X\} y2=\{GND_Y\}/, 'the speaker returns to 0 V');
  assert.match(st, /<GroundSymbol /);
  assert.doesNotMatch(st, /<Rect /, 'no box stand-ins left in the stage');
});

test('the device diagram draws real parts: DC supply, the device symbol, a loudspeaker', () => {
  const m2 = read('modules/mod2Devices.tsx');
  const dd = block(m2, 'function DeviceDiagram(', 'function TransformerDiagram(');
  for (const sym of ['DcSupplySymbol', 'BjtSymbol', 'MosfetSymbol', 'TriodeSymbol', 'SpeakerSymbol']) assert.match(dd, new RegExp(`<${sym} `), sym);
  const xf = block(m2, 'function TransformerDiagram(', 'export function Mod2Devices(');
  assert.match(xf, /fillRule="evenodd"/, 'the core is a laminated frame with a window, not a box');
});

test('signal chains end in a drawn loudspeaker cabinet, not a LOAD / SPEAKER box', () => {
  for (const f of ['modules/mod1What.tsx', 'modules/mod5ClassD.tsx', 'modules/mod7RealWorld.tsx']) assert.match(read(f), /<SpeakerCabinet /, f);
});
