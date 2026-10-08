/**
 * OWNER DRAWING DECISIONS 2026-10-08 — lock.
 *
 * L7C (Lab 7 B10, Sideline and Post-Event Interviews, SIDE view): the
 * reporter stood hidden behind the guest, so the reporter's arm read as the
 * guest holding their own mic. Owner: draw the reporter FAINTLY behind the
 * guest (the shared standing figure, reduced opacity) and label the holding
 * hand "reporter's hand" (≥ 9 pt at 390 wide, clear of the other labels).
 *
 * HF1: the hand-percussion players (smallperc, cajón), the low-brass, sax
 * and free-reed players wear the shared FigureHead skin on their heads, but
 * their HANDS kept palettes of their own (a lighter warm tone, a grey
 * neutral). Owner: the hands match the head — one shared skin constant,
 * PlayerFigure FIGURE_SKIN (= FIGURE_TONES.skin, what FigureHead wears).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const read = (p: string) => readFileSync(p, 'utf8');
/** Source without comments, so a comment can't satisfy or break a pin. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const L = 'src/screens/lab/miking/lessons/';

describe('HF1 — hands wear the shared figure skin (owner 2026-10-08)', () => {
  it('FIGURE_SKIN is the tone FigureHead wears, and the SVG figure head agrees with it', async () => {
    const PF = R(await import('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx'));
    assert.equal(PF.FIGURE_SKIN, PF.FIGURE_TONES.skin);
    assert.match(code(`${L}shared/players/PlayerFigure.tsx`), /export function FigureHead\([^)]*\)\s*\{\s*return <FigureMass path=\{fill\} tone="skin"/);
    const svg = code('src/features/lab/figureHeadSvg.tsx');
    for (const c of PF.FIGURE_SKIN.ramp) assert.ok(svg.includes(`'${c}'`), `figureHeadSvg ramp ${c}`);
  });

  const SITES: [string, RegExp][] = [
    ['shared/smallperc/Hand.tsx', /export const SKIN = FIGURE_SKIN\.ramp;[\s\S]*export const SKIN_RIM = FIGURE_SKIN\.edge;/],
    ['shared/lowbrass/LowBrassArt.tsx', /const SKIN = FIGURE_SKIN\.ramp;[\s\S]*const SKIN_EDGE = FIGURE_SKIN\.edge;/],
    ['shared/sax/SaxArt.tsx', /const SKIN = FIGURE_SKIN\.ramp;[\s\S]*const SKIN_EDGE = FIGURE_SKIN\.edge;/],
    ['shared/freereed/PlayerProfile.tsx', /export const SKIN = FIGURE_SKIN\.ramp;[\s\S]*export const SKIN_EDGE = FIGURE_SKIN\.edge;/],
    ['shared/handdrums/handSoundArt.tsx', /const SKIN = FIGURE_SKIN\.ramp;/],
  ];
  it('every figure-hand palette is the shared skin constant', () => {
    for (const [f, re] of SITES) assert.match(code(L + f), re, f);
  });

  it('the old hand palettes are gone (lighter warm, grey neutral)', () => {
    const OLD = /#f6d4b4|#e2ae87|#c48a63|#93603f|#5a3624|#8a8f98|#6e737c|#52565e|#3c3f45|#b3b8c1|#24272d|#e8b48c|#c98d62|#9a6440|#5a3820/i;
    for (const f of [...SITES.map(([f]) => f), 'shared/smallperc/Player.tsx', 'i02Cajon/art.tsx', 'a10Harmonica/art.tsx', 'a11Accordion/art.tsx']) {
      assert.doesNotMatch(code(L + f), OLD, f);
    }
  });

  it('the smallperc/cajón players and the free-reed hands take their skin from those modules (no private copy)', () => {
    assert.match(code(`${L}shared/smallperc/Player.tsx`), /import \{[^}]*\bSKIN\b[^}]*\} from '\.\/Hand'/);
    assert.match(code(`${L}i02Cajon/art.tsx`), /import \{[^}]*\bSKIN\b[^}]*\} from '\.\.\/shared\/smallperc\/Hand'/);
    for (const f of ['a10Harmonica/art.tsx', 'a11Accordion/art.tsx']) assert.match(code(L + f), /\bSKIN\b[^}]*\} from '\.\.\/shared\/freereed\/PlayerProfile'/, f);
    assert.match(code(`${L}a10Harmonica/art.tsx`), /ramp=\{SKIN_FAR\}/);
  });

  it('bodies still never wear the lone-head icon', () => {
    for (const f of ['shared/smallperc/Player.tsx', 'i02Cajon/art.tsx', 'shared/lowbrass/LowBrassArt.tsx', 'shared/sax/SaxArt.tsx', 'shared/freereed/PlayerProfile.tsx', 'b10Sideline/scene.tsx']) {
      assert.doesNotMatch(code(L + f), /headIcons|HeadIcon|HeadGlyph/, f);
    }
  });
});

describe('L7C — B10 side view: the reporter drawn faintly, the holding hand named (owner 2026-10-08)', () => {
  it('the side view draws the reporter (the shared standing figure, dimmed) whenever they hold a mic', () => {
    const s = code(`${L}b10Sideline/scene.tsx`);
    assert.match(s, /<StandingTalker view=\{view\} t=\{REPORTER\}[^>]*dim=\{REPORTER_FAINT\}/);
    const m = /export const REPORTER_FAINT = ([0-9.]+);/.exec(s);
    assert.ok(m, 'REPORTER_FAINT');
    const k = Number(m![1]);
    assert.ok(k >= 0.2 && k <= 0.5, `faint, not gone and not solid: ${k}`);
  });

  it('a "REPORTER’S HAND" label points at the fist on the reporter’s sideline handheld, only while a handheld is on the drawing', async () => {
    const { b10Labels, reporterFist } = R(await import('../src/screens/lab/miking/lessons/b10Sideline/scene.tsx'));
    const l = b10Labels('side', 'sideline').find((x: { id: string }) => x.id === 'b10R.hand');
    assert.ok(l);
    assert.equal(l.text, 'REPORTER’S HAND');
    const f = reporterFist();
    assert.ok(l.at && Math.hypot(l.at.u - f.x, l.at.v - f.y) < 1, 'anchored on the fist');
    assert.deepEqual([...l.withMics], ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper']);
    // TWO HANDHELDS: the first handheld there is the GUEST's own — a static label could not name the right hand.
    for (const v of ['twoMics', 'postEvent']) assert.equal(b10Labels('side', v).find((x: { id: string }) => x.id === 'b10R.hand'), undefined, v);
    // The engine shows a withMics label only with such a mic live; never on the mic-less read figure.
    assert.match(code('src/screens/lab/miking/engine/scene/PlacementScene.tsx'), /!l\.withMics \|\| rig\.mics\.some\(\(m\) => live\.includes\(m\.slot\) && m\.on && l\.withMics!\.includes\(m\.typeId\)\)/);
    assert.match(code('src/screens/lab/miking/engine/scene/artLabels.ts'), /art\.labels\(view, variant\)\.filter\(\(l\) => !l\.withMics\)/);
    assert.equal(b10Labels('top', 'sideline').find((x: { id: string }) => x.id === 'b10R.hand'), undefined);
  });

  it('at 390 wide the label is kept, at ≥ 9 pt, clear of every other label', async () => {
    const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
    const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
    // fitLabels (the label-against-label pass; under Node the Skia stand-in
    // cannot answer "is the figure here", so the drawing pass is the captures').
    const { fitLabels, labelRect } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
    const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
    const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
    const Ls = lessonById('B10');
    const A = lessonArt('B10');
    for (const variant of ['sideline']) {
      const authored = viewsOf(Ls.model, variant).side;
      const setup = Ls.model.setupFrameMax.side;
      for (const [where, box, h] of [['stage 300', authored, 300], ['stage 420', authored, 420], ['stage 640', authored, 640], ['setup 300', setup, 300], ['setup 420', setup, 420], ['setup 640', setup, 640]] as const) {
        const w = 390;
        const xf = fitXform('side', box, w, h, 8);
        const laid = fitLabels(A.labels('side', variant), xf, 1, w);
        const mine = laid.find((x: { id: string }) => x.id === 'b10R.hand');
        assert.ok(mine, `${variant} ${where}: kept`);
        const r = labelRect(mine, xf, 1, w);
        assert.ok(r.y1 - r.y0 >= 9, `${variant} ${where}: ≥ 9 pt tall line`);
        for (const o of laid) {
          if (o.id === 'b10R.hand') continue;
          const q = labelRect(o, xf, 1, w);
          const hit = r.x0 < q.x1 && q.x0 < r.x1 && r.y0 < q.y1 && q.y0 < r.y1;
          assert.ok(!hit, `${variant} ${where}: clear of ${o.id}`);
        }
      }
    }
  });
});
