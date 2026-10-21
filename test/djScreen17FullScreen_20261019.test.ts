/**
 * DJ Systems Lab — Screen 17 full-screen side views (optional polish,
 * 2026-10-19; grade round 1: "FULL SCREEN 3x enlarges only the top view; the
 * tonearm side view and the booth side view stay at panel size"). The zoom
 * maths is pure (art/djZoom.zoomedOrigin) and is checked with numbers; the
 * art and the page load Skia, so their wiring is checked in the sources.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zoomedOrigin } from '../src/screens/lab/dj/art/djZoom.ts';
import { ARM_SIDE } from '../src/screens/lab/dj/geometry/armGeometry.ts';

const root = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'dj');
const p17 = readFileSync(join(root, 'pages', 'p17Vinyl.tsx'), 'utf8');
const art = readFileSync(join(root, 'art', 'vinylArt.tsx'), 'utf8');

// ArmSide's own sizes at 390 wide, k = 1 (panel 378 × 152 pt)
const b = { x: 6, y: 4, w: 378, h: 152 };
const loupeW = 78, head = 20, foot = 14;
const s1 = Math.min((b.w - loupeW - 22) / 366, (b.h - head - foot) / 82);
const win = { x: b.x + 2, y: b.y + head - 2, w: b.w - loupeW - 14, h: b.h - head - foot + 1 };
const inWin = (o: { ox: number; oy: number }, s: number, x: number, y: number) => {
  const X = o.ox + x * s, Y = o.oy + y * s;
  return X >= win.x && X <= win.x + win.w && Y >= win.y && Y <= win.y + win.h;
};

describe('Screen 17: the side views zoom with the full-screen step', () => {
  it('at 3× the arm on the record opens on the stylus, cartridge and headshell, three times larger', () => {
    const s = s1 * 3;
    const o = zoomedOrigin(win, s, { x: ARM_SIDE.stylusX + 20, y: (ARM_SIDE.recTop + ARM_SIDE.tubeY) / 2 }, [-24, 342], [-62, 20], 1);
    assert.ok(inWin(o, s, ARM_SIDE.stylusX, ARM_SIDE.recTop), 'the stylus tip on the record');
    assert.ok(inWin(o, s, ARM_SIDE.stylusX + 29, -41), 'the cartridge’s top far corner');
    assert.ok(inWin(o, s, ARM_SIDE.stylusX + 40, ARM_SIDE.tubeY), 'the headshell collar on the tube');
    assert.ok(o.ox + -24 * s <= win.x + 1e-9, 'the drawing’s left end is never inside the window');
    assert.ok(o.oy + -62 * s <= win.y + 1e-9, 'nor its top');
  });
  it('lifted to balance, it opens on the gimbal and the counterweight, the right end held to the drawing', () => {
    const s = s1 * 3;
    const P = { x: ARM_SIDE.pivotX, y: ARM_SIDE.tubeY };
    const o = zoomedOrigin(win, s, { x: P.x + 20, y: P.y }, [-24, 342], [-62, 20], 1);
    assert.ok(inWin(o, s, P.x, P.y), 'the gimbal');
    assert.ok(inWin(o, s, P.x + 64, P.y), 'the counterweight’s back');
    assert.ok(o.ox + 342 * s >= win.x + win.w - 1e-9, 'the drawing’s right end is never inside the window');
  });
  it('the side views take the step; the room stops at 2×; the PHONO chain stays pinned', () => {
    assert.match(p17, /<ArmSide [^>]*zoom=\{zStep\} \/>/);
    assert.match(p17, /<RoomView [^>]*zoom=\{zStep\} \/>/);
    assert.doesNotMatch(p17, /<PhonoChain [^>]*zoom=/);
    assert.match(art, /export const ROOM_ZOOM_MAX = 2;/);
    assert.match(art, /const z = Math\.min\(ROOM_ZOOM_MAX, Math\.max\(1, zoom\)\);/);
  });
  it('the top view’s room starts where the side panel ends (the panel no longer covers its labels)', () => {
    assert.match(p17, /fit=\{\{ x: 0, y: panelH\(hh, kz\), w, h: hh - panelH\(hh, kz\) \}\}/);
    assert.doesNotMatch(p17, /panelH\(hh, 1\)/);
  });
  it('zoomed, the room’s words are cut to the drawing’s window, never over its title or footer', () => {
    assert.match(art, /<Group clip=\{zo \? Skia\.XYWHRect\(win\.x, win\.y, win\.w, win\.h\) : undefined\}>/);
    const footer = art.indexOf('80 Hz BUILD-UP');
    const clipEnd = art.lastIndexOf('</Group>', footer);
    assert.ok(clipEnd > art.indexOf('<Group clip={zo ?'), 'the footer is drawn after the clipped words, outside them');
  });
});

describe('Screens 16 and 18: the same fix — the top panel never covers the gear in full screen', () => {
  const p16 = readFileSync(join(root, 'pages', 'p16Laptop.tsx'), 'utf8');
  const p18 = readFileSync(join(root, 'pages', 'p18Dvs.tsx'), 'utf8');
  it('screen 16 starts the rig where the setup window ends', () => {
    assert.match(p16, /fit=\{\{ x: 0, y: panelH\(hh, kz\), w, h: hh - panelH\(hh, kz\) \}\}/);
    assert.doesNotMatch(p16, /panelH\(hh, 1\)/);
  });
  it('screen 18 starts the turntable where the scope and map end', () => {
    assert.match(p18, /fit=\{\{ x: 0, y: topH\(hh, kz\), w: ttW\(w\), h: hh - topH\(hh, kz\) \}\}/);
    assert.doesNotMatch(p18, /topH\(hh, 1\)/);
  });
});
