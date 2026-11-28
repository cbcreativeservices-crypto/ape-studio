/**
 * FIGURE V2 — THE PLAYERS, SET 3c (keys and the harp; 2026-11-24): the
 * pianist (C11), the reed piano's player (I11b) and the harpist (C10). Pins
 * the playing position a pianist would check — each fingertip pad on its
 * white key, the thumb near the key front, the wrist level with the knuckles
 * (≈ 4–6 cm over the keys), the forearm level, the wrist easy — and that
 * nothing the lessons measure moved (the bench, the keep-outs, the harp's
 * posed hands); and that each lesson opts in at its call sites.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const PP = await import('../src/screens/lab/miking/lessons/shared/piano/pianistPlanV2.ts');
const PS = await import('../src/screens/lab/miking/lessons/shared/piano/pianoSpec.ts');
const G = await import('../src/screens/lab/miking/lessons/c11Piano/geometry.ts');
const HM = await import('../src/screens/lab/miking/lessons/shared/players/handModel.ts');
const WM = await import('../src/screens/lab/miking/lessons/shared/keys/wurliModel.ts');
const WP = await import('../src/screens/lab/miking/lessons/shared/keys/wurliPlayerV2.tsx');
const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
const E07G = await import('../src/screens/lab/miking/lessons/e07SingerInstrument/geometry.ts');

const checkArm = (a: { sk: { fingers: { joints: { x: number; y: number; z: number }[] }[]; miss: number[]; frame: { o: { y: number } } }; elbow: { y: number } }, keyTop: number, name: string) => {
  for (const m of a.sk.miss) assert.ok(m < 2, `${name}: a pad misses its key by ${m.toFixed(1)} mm`);
  const kn = a.sk.fingers.map((d) => keyTop - d.joints[0].y);
  for (const h of kn) assert.ok(h > 35 && h < 65, `${name}: knuckles ${h.toFixed(0)} mm over the keys`);
  const wristH = keyTop - a.sk.frame.o.y;
  assert.ok(Math.abs(wristH - kn[1]) < 25, `${name}: the wrist (${wristH.toFixed(0)}) level with the knuckles (${kn[1].toFixed(0)})`);
  assert.ok(Math.abs(a.elbow.y - a.sk.frame.o.y) < 60, `${name}: the forearm level`);
  assert.ok(HM.wristBendDeg(a.sk as never, a.elbow as never) <= 23, `${name}: the wrist easy`);
};

describe('figure V2 players, set 3c (keys, harp)', () => {
  it('the roles: pianist Mei, reed piano Kofi, harpist Ruth', () => {
    assert.equal(CAST.ROLES['player.piano'], 'mei');
    assert.equal(CAST.ROLES['player.wurli'], 'kofi');
    assert.equal(CAST.ROLES['player.harp'], 'ruth');
  });

  it('C11: each hand arched over its five white keys, curved fingers, wrist level with the knuckles, forearm level', () => {
    for (const k of ['grand', 'upright'] as const) {
      const at = G.PIANIST_AT[k];
      const p = PP.pianist3(at.xKey, at.pedalX);
      for (const a of [p.R, p.L]) {
        checkArm(a, PS.KEY_TOP_Y, `${k} ${a.side}`);
        // the pads on the keys (in from the fronts), the thumb nearest the front
        for (const q of a.pads) assert.ok(q.x > at.xKey && q.x < at.xKey + 70, 'a pad on the key, in from its front');
        assert.ok(a.pads[0].x < Math.min(...a.pads.slice(1).map((q) => q.x)), 'the thumb nearest the key front');
      }
      // the bench is the lesson's
      const pn = PS.pianistAt(at.xKey, at.pedalX);
      assert.equal(pn.bench.y, PS.FLOOR_Y - 480);
    }
  });

  it('I11b: the same playing position at the reed piano, the hands inside the lesson’s hand keep-out', () => {
    const A = WP.wurliArms();
    for (const a of [A.R, A.L]) {
      checkArm(a, WM.W.keyTopY, `wurli ${a.side}`);
      for (const q of a.pads) assert.ok(q.x > -110 && q.x < 30, 'inside ko.hands');
    }
    // a real person facing the keys (−x): the right hand on the far side (−z)
    assert.ok(A.R.pads[0].z < 0 && A.L.pads[0].z > 0);
  });

  it('each lesson opts in at its call sites (the old look stays the default of the shared drawings)', () => {
    const c11 = read(`${L}/c11Piano/art.tsx`);
    assert.match(c11, /figureV2On\('sidePlayers'\)/);
    assert.match(c11, /v2 = V2/);
    assert.match(read(`${L}/c11Piano/pages.tsx`), /v2=\{V2\}/);
    const piano = read(`${L}/shared/piano/PianoArt.tsx`);
    assert.match(piano, /dim = 0\.9, v2 = false, who, lip \}/);
    const harp = read(`${L}/c10Harp/art.tsx`);
    assert.match(harp, /figureV2On\('sidePlayers'\)/);
    assert.match(harp, /HarpArt\(\{ view, variant, v2 = V2 \}/);
    const keys = read(`${L}/shared/keys/KeysArt.tsx`);
    assert.match(keys, /showPlayer = true, hi, v2 = false \}/);
    assert.match(keys, /<WurliSection view=\{view\} v2=\{WURLI_V2\} \/>/);
  });

  it('E07: one singer (Ana) at the guitar, at the piano and in the voice pages; the measured lips do not move', () => {
    const src = read(`${L}/e07SingerInstrument/art.tsx`);
    assert.match(src, /castGuitarScene\(GUITAR_SC, \{ role: 'voice\.singer', lip: true \}\)/);
    assert.match(src, /makeGuitarArt\(E07_GUITAR, \{ zones: E07_GUITAR_ZONES, v2: V2 \}\)/);
    assert.match(src, /who=\{SINGER\} lip=\{V_PIANO\.lip\}/);
    assert.match(src, /makeVoiceSound\(\{\n\s+v2: V2,/);
    assert.equal(CAST.ROLES['voice.singer'], 'ana');
    // the lips as the lesson measures them (pianist head + (84, 52); the guitar scene's fitted mouth)
    assert.equal(E07G.V_PIANO.lip.x, E07G.PIANIST.head.x + 84 * (E07G.PIANIST.headR / 110));
    assert.equal(E07G.V_PIANO.lip.y, E07G.PIANIST.head.y + 52 * (E07G.PIANIST.headR / 110));
    assert.deepEqual(E07G.V_GUITAR.lip, E07G.GUITAR_SC.fit.mouth);
  });

  it('(KeysGuitar3) C10: the harp hands re-fitted so the playing fingers lie side by side in the picture (contacts unchanged: mikingHarpHands)', async () => {
    const HP = await import('../src/screens/lab/miking/lessons/c10Harp/harpistPose.ts');
    for (const lever of [false, true]) {
      const H = HP.harpHands(lever);
      // the near (right) hand, thumb up: its knuckle row stands up the back of the hand (index over ring)
      const kR = H.R.sk.fingers.map((d) => d.joints[0]);
      assert.ok(Math.abs(kR[2].x - kR[0].x) <= 12 && kR[2].y - kR[0].y >= 25, `${lever}: the right knuckle row stands up`);
      // the far (left) hand seen through the strings: its knuckle row level across, the fingers hanging to the strings
      const kL = H.L.sk.fingers.map((d) => d.joints[0]);
      assert.ok(Math.abs(kL[2].x - kL[0].x) >= 25, `${lever}: the left knuckle row across`);
      for (const d of H.L.sk.fingers.slice(0, 3)) assert.ok(d.joints[3].y - d.joints[0].y >= 35, `${lever}: a left finger hangs to its string`);
    }
  });
});
