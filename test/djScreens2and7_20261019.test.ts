/**
 * DJ Systems Lab — Screens 2 and 7 regrade fixes (2026-10-19). The art
 * modules load Skia, so these checks read the page sources (as the other DJ
 * ratchets do): the things the grader found must not come back.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'dj');
const p07 = readFileSync(join(root, 'pages', 'p07Cue.tsx'), 'utf8');
const p02 = readFileSync(join(root, 'pages', 'p02Gear.tsx'), 'utf8');
const scene = readFileSync(join(root, 'art', 'Scene.tsx'), 'utf8');
const mixer = readFileSync(join(root, 'art', 'MixerTop.tsx'), 'utf8');

describe('Screen 7: one true scale, nothing floating', () => {
  it('the headphones are drawn at true scale with the mixer (no s= on them)', () => {
    const hp = p07.match(/<Headphones [^>]*\/>/);
    assert.ok(hp, 'the stage draws the headphones');
    assert.doesNotMatch(hp![0], /\bs=\{/);
    assert.match(hp![0], /cord=\{false\}/, 'their cord is drawn into the PHONES jack by the page');
  });
  it('the monitor alone is scaled, in its own inset, and the inset says so', () => {
    assert.match(p07, /const MON_S = 0\.5;/);
    assert.match(p07, /'HALF SCALE'/);
    assert.match(p07, /'TO SCALE'/);
    assert.doesNotMatch(p07, /s: 0\.48|s: 0\.3\b/, 'the old unstated scales are gone');
  });
  it('the plug is seated in the PHONES jack and the cord runs from it', () => {
    assert.match(p07, /<SeatedJackPlugTop x=\{JACK\.x\} y=\{JACK\.y\} \/>/);
    assert.match(p07, /\[JACK\.x, JACK\.y \+ SEATED_PLUG_LEN\]/, 'the cord starts at the plug boot');
    assert.match(p07, /MIXER\.front\.phones635/, 'JACK is the mixer’s 6.35 mm PHONES jack');
  });
  it('the monitor stands on a pad on the shelf, and the meters are housed with a dB scale', () => {
    assert.match(p07, /<IsolationPad /);
    assert.match(p07, /SHELF_Y/);
    assert.match(p07, /function MeterBridge/);
    assert.match(p07, /METER_SCALE/);
  });
  it('L sits left of R, each under its own cup', () => {
    const l = p07.match(/id: 'l',[^\n]*at: \{ x: cupX\('L'\) \+ 12/);
    const r = p07.match(/id: 'r',[^\n]*at: \{ x: cupX\('R'\) - 12/);
    assert.ok(l && r);
  });
  it('the printed legends are passed as zoom-aware label obstacles', () => {
    assert.match(p07, /printed=\{PRINTED\}/);
    assert.match(mixer, /export function mixerLegendBoxes\(\)/);
    assert.match(scene, /printed\?: readonly \(Box & \{ size: number \}\)\[\]/);
    assert.match(scene, /p\.size \* s >= 9 - 1e-3/, 'a legend blocks a label only once it renders (≥ 9 pt)');
  });
});

describe('Screen 2: every output cable ends in a socket', () => {
  it('no MASTER OUT run ends in mid-air past the controller', () => {
    assert.doesNotMatch(p02, /CTRL_W \+ 30\]/);
    assert.match(p02, /spkIn\('L'\)\]/);
    assert.match(p02, /spkIn\('R'\)\]/);
  });
  it('the interface’s OUT L / OUT R run to the speakers’ inputs, with a plug at each end', () => {
    assert.match(p02, /ifSpkIn\('L'\)\]/);
    assert.match(p02, /ifSpkIn\('R'\)\]/);
    assert.match(p02, /<PlugFace cx=\{r\[r\.length - 1\]\[0\]\}/);
  });
  it('free cable runs are smooth curves, not ruled right angles', () => {
    assert.match(p02, /curvePath\(USB_RUN\)/);
    assert.match(p02, /curvePath\(IF_USB\)/);
  });
  it('PLATTER and RECORD keep off the record', () => {
    assert.match(p02, /circBox\(TT\.platter\.cx, TT\.platter\.cy, TT\.platter\.d\)/);
  });
  it('the system views draw the cables their question is about', () => {
    assert.match(p02, /<RcaRun pts=\{VINYL_RUNS\[0\]\}/);
    assert.match(p02, /<LanRun pts=\{MOD_LAN\}/);
  });
});
