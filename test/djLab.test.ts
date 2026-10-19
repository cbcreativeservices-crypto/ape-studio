/**
 * DJ Systems Lab — wiring, house rules and geometry.
 *
 * Pins: the lab is registered MEMBERS ONLY in the catalog, gated in the
 * navigator, typed, previewable and covered by the exposure check-in; the
 * twelve Stage 1 screens exist and none promises later content; learner text
 * carries no brand/model names, no citations and no raw platform alerts; the
 * worklet copy of the meter LED scale equals the JS one; every anchor sits
 * inside its device and the main controls do not collide.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BOOTH_LAYOUT,
  BOOTH_W,
  MIXER,
  MIXER_D,
  MIXER_REAR,
  MIXER_REAR_JACKS,
  MIXER_W,
  PLAYER,
  PLAYER_D,
  PLAYER_REAR,
  PLAYER_REAR_JACKS,
  PLAYER_W,
  STRIP_X,
  TT,
  TT_D,
  TT_W,
  VIEWS,
  fitView,
  type Box,
} from '../src/screens/lab/dj/geometry/boothGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const DJ = 'src/screens/lab/dj';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${n}`;
    if (statSync(join(ROOT, p)).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}
const FILES = walk(DJ);
// the generated track analysis is numbers only; everything else is checked
const TEXT_FILES = FILES.filter((f) => !f.endsWith('djTrackData.ts'));

describe('DJ Systems Lab — wiring', () => {
  it('is in the catalog as a MEMBERS-ONLY lab', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    const line = cat.split('\n').find((l) => l.includes("route: 'DJSystemsLab'"));
    assert.ok(line, 'catalog row missing');
    assert.match(line!, /member: true/);
  });
  it('is gated in the navigator, typed, previewable and exposure-checked', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    assert.match(nav, /DJSystemsLab: lazyScreen\(\(\) => withMembershipPreview\(/);
    assert.match(nav, /<Stack\.Screen name="DJSystemsLab" getComponent=\{MemberGated\.DJSystemsLab\} \/>/);
    assert.match(read('src/navigation/types.ts'), /DJSystemsLab: undefined;/);
    assert.match(read('src/dev/webPreviews.tsx'), /DJSystemsLab: DJSystemsLabScreen/);
    assert.match(read('src/features/audio/ExposureCheckin.tsx'), /'DJSystemsLab'/);
  });
  it('has the twelve Stage 1 screens, in order, each a rack page', () => {
    const idx = read(`${DJ}/pages/index.ts`);
    const list = idx.match(/DJ_PAGES[^=]*=\s*\[([^\]]+)\]/);
    assert.ok(list);
    const ids = list![1].split(',').map((s) => s.trim()).filter(Boolean);
    // Stage 2 appends its screens in order (the count grows to the owner's 24)
    assert.ok(ids.length >= 12);
    assert.deepEqual(ids, ids.map((_, i) => `P${String(i + 1).padStart(2, '0')}`));
    for (const f of FILES.filter((x) => /pages\/p\d\d/.test(x))) {
      const s = read(f);
      assert.match(s, /rack: true/, `${f} is not a rack page`);
      assert.match(s, /UnderstandingCheck/, `${f} has no check-yourself question`);
      assert.match(s, /FaultCard/, `${f} has no troubleshooting fault`);
    }
  });
  it('keeps its sources and model notes in docs, not in the app', () => {
    assert.ok(existsSync(join(ROOT, 'docs/labs/dj/SOURCES.md')));
    assert.ok(existsSync(join(ROOT, 'docs/labs/dj/MODEL.md')));
  });
});

describe('DJ Systems Lab — house rules in the code', () => {
  const BRANDS = /\b(pioneer|technics|serato|rekordbox|traktor|denon|numark|rane|shure|sennheiser|ortofon|audio-technica|behringer|mackie|qsc|jbl|beyerdynamic|stanton|reloop|virtual ?dj|akai|native instruments|allen ?& ?heath|cdj-?\d*|djm-\d+|sl-?1200)\b/i;
  it('names no maker or model anywhere in the lab', () => {
    for (const f of TEXT_FILES) {
      const m = read(f).match(BRANDS);
      assert.equal(m, null, `${f}: "${m?.[0]}"`);
    }
  });
  it('carries no citations or source tags', () => {
    for (const f of TEXT_FILES) {
      const s = read(f);
      assert.doesNotMatch(s, /\[S\d+\]|\[F\d+\]|Source: /, f);
    }
  });
  it('promises nothing for later screens and never uses a raw platform alert', () => {
    for (const f of TEXT_FILES) {
      const s = read(f);
      assert.doesNotMatch(s, /coming soon|stay tuned/i, f);
      assert.doesNotMatch(s, /Alert\.alert\(/, f);
    }
  });
  it('the worklet copy of the LED scale equals the JS one', () => {
    const s = read(`${DJ}/art/parts.tsx`);
    const js = s.match(/export const LED_DB = \[([^\]]+)\]/);
    const wk = s.match(/const LED_DB_W = \[([^\]]+)\]/);
    assert.ok(js && wk);
    const nums = (t: string) => t.split(',').map((x) => Number(x.trim()));
    assert.deepEqual(nums(wk![1]), nums(js![1]));
    assert.equal(nums(js![1]).length, 12);
  });
});

const inside = (b: Box, w: number, h: number) => b.x >= 0 && b.y >= 0 && b.x + b.w <= w && b.y + b.h <= h;
const circ = (cx: number, cy: number, d: number): Box => ({ x: cx - d / 2, y: cy - d / 2, w: d, h: d });
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('DJ Systems Lab — geometry', () => {
  it('every player control sits inside the player', () => {
    const p = PLAYER;
    const boxes: Record<string, Box> = {
      screen: p.screen,
      browse: circ(p.browse.x, p.browse.y, p.browse.d),
      load: p.load,
      back: p.back,
      jog: circ(p.jog.cx, p.jog.cy, p.jog.d),
      cue: circ(p.cue.cx, p.cue.cy, p.cue.d),
      play: circ(p.play.cx, p.play.cy, p.play.d),
      sync: p.sync,
      masterBtn: p.masterBtn,
      quantize: p.quantize,
      tempo: { x: p.tempo.x - p.tempo.capW / 2, y: p.tempo.top, w: p.tempo.capW, h: p.tempo.len },
      tempoRange: p.tempoRange,
      ...Object.fromEntries(p.hotCues.xs.map((x, i) => [`hot${i}`, { x, y: p.hotCues.y, w: p.hotCues.w, h: p.hotCues.h }])),
    };
    for (const [k, b] of Object.entries(boxes)) assert.ok(inside(b, PLAYER_W, PLAYER_D), `player.${k}`);
    // the jog never collides with the keys around it
    for (const k of ['cue', 'play', 'sync', 'quantize', 'masterBtn', 'tempo', 'hot0', 'hot1', 'hot2', 'hot3', 'screen']) {
      assert.ok(!overlap(boxes.jog, boxes[k]), `jog vs ${k}`);
    }
    assert.ok(!overlap(boxes.cue, boxes.play));
    assert.ok(!overlap(boxes.screen, boxes.hot0));
  });
  it('every mixer control sits inside the mixer, strips mirror each other', () => {
    const m = MIXER;
    for (const ch of [1, 2] as const) {
      const x = STRIP_X[ch];
      for (const k of ['trim', 'hi', 'mid', 'lo', 'filter'] as const) assert.ok(inside(circ(x, m[k].y, m[k].d), MIXER_W, MIXER_D), `ch${ch}.${k}`);
      assert.ok(inside({ x: x - m.fader.capW / 2, y: m.fader.top, w: m.fader.capW, h: m.fader.len + m.fader.capL }, MIXER_W, MIXER_D));
    }
    assert.equal(STRIP_X[1] + STRIP_X[2], MIXER_W);
    for (const k of ['master', 'booth', 'cueMix', 'phones', 'resonance'] as const) assert.ok(inside(circ(m[k].x, m[k].y, m[k].d), MIXER_W, MIXER_D), k);
    assert.ok(m.xfader.left >= 0 && m.xfader.left + m.xfader.len + m.xfader.capW <= MIXER_W);
    for (const x of m.meters.xs) assert.ok(inside({ x, y: m.meters.y, w: m.meters.w, h: m.meters.h }, MIXER_W, MIXER_D));
  });
  it('rear sockets sit on their panels; the turntable parts on the plinth', () => {
    for (const [k, j] of Object.entries(PLAYER_REAR_JACKS)) assert.ok(j.x > 0 && j.x < PLAYER_REAR.w && j.y > 0 && j.y < PLAYER_REAR.h, `player rear ${k}`);
    for (const [k, j] of Object.entries(MIXER_REAR_JACKS)) assert.ok(j.x > 0 && j.x < MIXER_REAR.w && j.y > 0 && j.y < MIXER_REAR.h, `mixer rear ${k}`);
    assert.ok(inside(circ(TT.platter.cx, TT.platter.cy, TT.platter.d), TT_W, TT_D));
    assert.ok(TT.record.d < TT.platter.d);
    for (const k of ['armPivot', 'armRest', 'stylusPlay', 'counterweight', 'targetLight'] as const) {
      assert.ok(TT[k].x > 0 && TT[k].x < TT_W && TT[k].y > 0 && TT[k].y < TT_D, k);
    }
  });
  it('the table layout does not overlap devices, and views frame what they name', () => {
    assert.ok(BOOTH_LAYOUT.mixer.x >= PLAYER_W);
    assert.ok(BOOTH_LAYOUT.B.x >= BOOTH_LAYOUT.mixer.x + MIXER_W);
    assert.equal(BOOTH_LAYOUT.B.x + PLAYER_W, BOOTH_W);
    assert.ok(VIEWS.booth.x <= 0 && VIEWS.booth.x + VIEWS.booth.w >= BOOTH_W);
    assert.ok(VIEWS.deckB.x <= BOOTH_LAYOUT.B.x && VIEWS.deckB.x + VIEWS.deckB.w >= BOOTH_W);
    const f = fitView(VIEWS.booth, 390, 300);
    assert.ok(f.s > 0 && VIEWS.booth.w * f.s <= 390);
  });
});
