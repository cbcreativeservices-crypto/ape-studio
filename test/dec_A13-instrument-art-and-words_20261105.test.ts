/**
 * Function audit, decisions 28, 29, 30, 32, 36 and three of the "left not fixed"
 * items (decision 39): instrument drawings that showed something impossible, and
 * words that said the opposite of what the picture showed.
 *
 *   28  A01  MIC ANGLE stops short of 180°, where the mic sat in the player's head
 *   29  C06a, C04  the ring round PIANO and AUDIENCE · PA shows whole
 *   30  C11  SHORT STICK rays leave through the lid gap, off the lid, over the rim
 *   32  I07  PEDAL UP says the note stops; nothing rings
 *   36  A12  a tap on the CONSOLE ring picks the console
 *   §5  I11a marks stay 44 px on a short phone, and no label leaves the box
 *   §5  C08  GRILLE CLOTH is not above the box, where a head rests
 *   §5  F04  the splash crown stands on the water line
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const L = '../src/screens/lab/miking/lessons';
const src = (f: string) => readFileSync(new URL(`${L}/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const { MIC_ANGLE_MAX } = R(await import('../src/screens/lab/miking/lessons/shared/brass/BrassSoundArt.tsx'));
const { TP, FH } = R(await import('../src/screens/lab/miking/lessons/a01Trumpet/geometry.ts'));
const { TB, BT } = R(await import('../src/screens/lab/miking/lessons/a02Trombone/geometry.ts'));
const { bassPlan, BASS_PIANO_AT } = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bassPlan.ts'));
const { ringedBox } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx'));
const { BACKLINE_BOX, backlineItems } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/backlinePlanModel.ts'));
const { shortStickRays } = R(await import('../src/screens/lab/miking/lessons/c11Piano/radiateArt.tsx'));
const { LID_DEG, GRAND_DIMS } = R(await import('../src/screens/lab/miking/lessons/shared/piano/pianoSpec.ts'));
const { GB, GS } = R(await import('../src/screens/lab/miking/lessons/c11Piano/model.ts'));
const { strikeWord } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MSound.tsx'));
const { ORGAN_FRONT } = R(await import('../src/screens/lab/miking/lessons/a12Organ/art.tsx'));
const { CONSOLE, DIVISIONS } = R(await import('../src/screens/lab/miking/lessons/a12Organ/model.ts'));
const { HI_MIN_PX, HI_STAGE, HI_THIN_PX, rhodesLabels } = R(await import('../src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx'));
const { keysBox } = R(await import('../src/screens/lab/miking/lessons/shared/keys/KeysExplorer.tsx'));
const { MECH_FRAME, mechHiRect } = R(await import('../src/screens/lab/miking/lessons/shared/keys/MechanismDisplay.tsx'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { cabLabels, frontBox } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/cabLabels.ts'));
const { cabDraw } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/cabGeometry.ts'));

describe('28: the mic never swings into the player', () => {
  it('the fader stops at MIC_ANGLE_MAX, short of 180°', () => {
    assert.ok(MIC_ANGLE_MAX < 180);
    assert.equal(MIC_ANGLE_MAX % 5, 0, 'a step the fader lands on');
    const page = src('shared/brass/BrassSoundPage.tsx');
    assert.ok(page.includes('value: deg / MIC_ANGLE_MAX'));
    assert.ok(page.includes('setDeg(Math.round((v * MIC_ANGLE_MAX) / 5) * 5)'));
  });
  it('at the stop the mic stands clear of the head on all four horns', () => {
    const at = (deg: number) => ({ x: 600 * Math.cos((deg * Math.PI) / 180), z: -600 * Math.sin((deg * Math.PI) / 180) });
    for (const P of [TP, FH, TB, BT]) {
      const gap = (deg: number) => Math.hypot(at(deg).x - P.player.head.x, at(deg).z - P.player.head.z) - P.player.headR * 1.15;
      assert.ok(gap(MIC_ANGLE_MAX) > 0, `${P.spec.id} ${gap(MIC_ANGLE_MAX)}`);
    }
  });
});

describe('29: a ring shows whole', () => {
  it('C06: the piano ring is inside both plans, either bass', () => {
    const piano = 650 + 40 + 34 / 2;
    for (const kind of ['bow', 'pluck'] as const) {
      const p = bassPlan(kind);
      assert.ok(p.near.v0 <= BASS_PIANO_AT.z - piano, `near ${p.near.v0}`);
      assert.ok(p.wide.v0 <= BASS_PIANO_AT.z - piano, `wide ${p.wide.v0}`);
    }
  });
  it('C04: every ring on a backline plan is inside the box it draws in', () => {
    for (const who of ['guitar', 'bass', 'steel'] as const) {
      for (const scene of ['stage', 'studio'] as const) {
        const items = backlineItems(who, scene, []);
        const b = ringedBox(BACKLINE_BOX[scene], items);
        for (const i of items) {
          const o = i.r + 40 + 34 / 2;
          assert.ok(i.u - o >= b.u0 && i.u + o <= b.u1 && i.v - o >= b.v0 && i.v + o <= b.v1, `${who} ${scene} ${i.id}`);
        }
      }
    }
    assert.ok(src('shared/speakers/BacklinePlan.tsx').includes('ringedBox(BACKLINE_BOX[scene]'), 'the plan draws in the grown box');
  });
});

describe('30: SHORT STICK, through the lid gap', () => {
  const a = (LID_DEG.short * Math.PI) / 180;
  for (const [name, g] of [['GB', GB], ['GS', GS]] as const) {
    const xm = g.xKey + 0.45 * (g.xTail - g.xKey);
    const zt = Math.min(g.hw, g.bentZ(xm));
    const zb = -g.hw;
    const t = GRAND_DIMS.rimT.mm;
    const rays = shortStickRays(zb, zt, g.rimTop, t, a);
    it(`${name}: every ray clears the rim, going up and out`, () => {
      assert.equal(rays.length, 3);
      for (const r of rays) {
        assert.ok(r.out.z > 0, 'toward the open side');
        const yAtRim = r.hit.y + r.out.y * ((zt - r.hit.z) / r.out.z);
        assert.ok(yAtRim < g.rimTop - 1, `crosses the rim line at ${yAtRim}, rim top ${g.rimTop}`);
      }
    });
    it(`${name}: every ray turns on the lid, by the mirror law`, () => {
      const n = { z: Math.sin(a), y: Math.cos(a) };
      for (const r of rays) {
        assert.ok(Math.abs((r.hit.z - zb) * n.z + (r.hit.y - g.rimTop) * n.y) < 1e-6, 'on the lid');
        const len = Math.hypot(r.hit.z - r.from.z, r.hit.y - r.from.y);
        const d = { z: (r.hit.z - r.from.z) / len, y: (r.hit.y - r.from.y) / len };
        const dn = d.z * n.z + d.y * n.y;
        assert.ok(Math.abs(r.out.z - (d.z - 2 * dn * n.z)) < 1e-6 && Math.abs(r.out.y - (d.y - 2 * dn * n.y)) < 1e-6);
      }
    });
  }
});

describe('32: PEDAL UP never says the note rings on', () => {
  const lessonSrc = src('i07Vibraphone/lesson.ts');
  const block = lessonSrc.slice(lessonSrc.indexOf('damped: {'), lessonSrc.indexOf('pedal: { down:'));
  it('every damped word is said for the felt on the bar', () => {
    assert.ok(block.length > 200, 'I07 has its PEDAL UP words');
    assert.doesNotMatch(block, /\bring(s|ing)?\b|keeps? ringing|rings? on/i);
  });
  it('the page speaks them only with the damper on the bar', () => {
    const page = src('shared/mallets/MSound.tsx');
    assert.ok(page.includes('const dampedWords = damped ?'));
    assert.ok(page.includes('stagesNow = dampedWords?.stages ?? W.stages'));
    assert.ok(page.includes('{stageNow(shown - 1)}</Point>'), 'the card reads the words for the state on screen');
    assert.ok(page.includes('{dampedWords?.after ?? W.after}'));
  });
  it('the bezel word follows', () => {
    assert.equal(strikeWord('RINGING', true), 'DAMPED');
    assert.equal(strikeWord('RINGING', false), 'RINGING');
  });
});

describe('36: the CONSOLE ring takes its tap', () => {
  const hit = (u: number, v: number) => ORGAN_FRONT.hitTest('none', u, v, 40);
  it('inside the ring, over the case and over the left Pedal tower', () => {
    for (const u of [CONSOLE.z0 - 300, CONSOLE.z0, (CONSOLE.z0 + CONSOLE.z1) / 2, CONSOLE.z1, CONSOLE.z1 + 300]) {
      for (const v of [-CONSOLE.h - 300, -CONSOLE.h / 2, -300, 300]) assert.equal(hit(u, v), 'org.console', `${u}, ${v}`);
    }
  });
  it('above the ring, and on the other side, the towers keep their taps', () => {
    const tower = (DIVISIONS.pedal.z0 + DIVISIONS.pedal.z1) / 2;
    assert.equal(hit(-tower, -3000), 'org.pedal');
    assert.equal(hit(tower, -3000), 'org.pedal');
    assert.equal(hit(tower, -CONSOLE.h / 2 - 500), 'org.pedal');
  });
});

describe('§5 I11a: a short phone keeps the marks and the labels', () => {
  it('the mark floor is reckoned on the short stage', () => {
    assert.ok(HI_STAGE.h <= 198, `stage ${HI_STAGE.h}`);
  });
  it('every inside-view part keeps its mark on the drawing: 44 px long, 16 px wide', () => {
    for (const kind of ['tine', 'reed'] as const) {
      const { s } = fitXform('side', MECH_FRAME[kind].box, HI_STAGE.w, HI_STAGE.h, HI_STAGE.pad);
      for (const id of ['k.bar', 'k.tonebar', 'k.pickup', 'k.hammer', 'k.key', 'k.block']) {
        const q = mechHiRect(kind, id, s);
        if (!q) continue;
        const [a, b] = [(q.u1 - q.u0) * s, (q.v1 - q.v0) * s].sort((x, y) => y - x);
        assert.ok(a >= HI_MIN_PX - 1e-6 && b >= HI_THIN_PX - 1e-6, `${kind} ${id} ${a.toFixed(1)} × ${b.toFixed(1)}`);
      }
    }
  });
  it('no front-view label stands above the box, where the drawing is clipped', () => {
    const b = keysBox('rhodesFront');
    for (const l of rhodesLabels('front')) assert.ok(l.v - 12 >= b.v0, `${l.id} at ${l.v}, box from ${b.v0}`);
  });
  it('the two top labels share a row without touching', () => {
    const top = rhodesLabels('front').filter((l: { id: string }) => l.id === 'lid' || l.id === 'ctl');
    assert.equal(top.length, 2);
    assert.equal(top[0].v, top[1].v);
    const lid = top.find((l: { id: string }) => l.id === 'lid')!;
    const ctl = top.find((l: { id: string }) => l.id === 'ctl')!;
    assert.ok(ctl.align === 'right' && lid.align === 'left' && ctl.u < lid.u);
  });
});

describe('§5 C08: GRILLE CLOTH', () => {
  for (const kind of ['1x12', '4x12', 'bass410', 'combo12'] as const) {
    it(`${kind}: under the box, inside the view, clear of the head`, () => {
      const c = cabDraw(kind, 'closed');
      const g = cabLabels(kind, 'closed', 'front').find((l: { id: string }) => l.id === 'grille')!;
      assert.ok(g.v > c.box.y1, `at ${g.v}, box bottom ${c.box.y1}`);
      assert.ok(g.v < frontBox(kind).v1, 'inside the view');
    });
  }
});

describe('§5 F04: the crown stands on the water', () => {
  const marks = src('shared/foley/contactMarks.tsx');
  const art = src('f04Impacts/soundArt.tsx');
  it('nothing clips its foot off at the rim', () => {
    assert.ok(!marks.includes('rimY'));
    assert.ok(!art.includes('rimY'));
  });
  it('its foot is drawn at the water line and both pictures stand it on y = 0', () => {
    assert.ok(marks.includes('wall.moveTo(x - half * 0.55, y);'));
    assert.ok(art.includes('<SplashCrown c={[0, 0]} k={crown} />'));
    assert.ok(art.includes('const hit: [number, number] = water ? [0, 0]'));
  });
  it('the growth curve is unchanged', () => {
    assert.ok(art.includes('0.27 + (0.73 * (t - 0.15)) / 0.85'));
  });
});
