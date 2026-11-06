/**
 * Function audit 2026-11-05, decisions 3, 5, 15 and 33 on B08 Broadcast Audience.
 *   5   HEIGHT and TILT cannot show from above: a read-only side view in the corner.
 *   3   PATTERN shows its shape, in the Field Reporter's dashed style.
 *   33  TURN: dragging right reads right.
 *   15  LOOKED AT names the item, never a total.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aimShort, aimWords } from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';

const DIR = join(process.cwd(), 'src/screens/lab/miking/lessons/shared/broadcast');
const read = (f: string) => readFileSync(join(DIR, f), 'utf8').replace(/\r\n/g, '\n');
const pages = read('audiencePages.tsx');
const art = read('AudienceArt.tsx');
const reporter = read('reporterPages.tsx');

/** One step's source, from its hook to the next section. */
const step = (name: string) => {
  const from = pages.indexOf(`export function ${name}(`);
  assert.ok(from > 0, name);
  const to = pages.indexOf('/* ── ', from);
  return pages.slice(from, to < 0 ? undefined : to);
};

describe('decision 33: TURN reads the way it is dragged', () => {
  const turnParam = /label: 'TURN',\s*value: (.+),\s*onChange: \(v\) => \{\s*setTurn\((.+)\);/.exec(step('usePaAngleStep'));
  assert.ok(turnParam, 'the TURN fader');
  const value = new Function('turn', `return ${turnParam[1]};`) as (t: number) => number;
  const toTurn = new Function('v', `return ${turnParam[2]};`) as (v: number) => number;

  it('the right end of the slider reads right, the left end left', () => {
    assert.equal(aimWords(toTurn(1)), '90° right of center');
    assert.equal(aimShort(toTurn(1)), '90°R');
    assert.equal(aimWords(toTurn(0)), '90° left of center');
    assert.equal(aimShort(toTurn(0)), '90°L');
  });

  it('the thumb sits where the value says and round-trips', () => {
    assert.equal(value(-60), 150 / 180, 'the opening 60° right sits right of the middle');
    for (const t of [-90, -60, -1, 0, 1, 45, 90]) assert.equal(toTurn(value(t)), t);
  });

  it('the drawing turns the same way (a positive plan angle is left)', () => {
    assert.match(step('usePaAngleStep'), /const aimDeg = base \+ turn;/);
    assert.match(read('../sports/venuePlan.ts'), /\$\{r > 0 \? 'left' : 'right'\} of center/);
  });
});

describe('decision 5: height and tilt show from the side', () => {
  it('HEIGHT and OUT drive the side view of the crowd mic', () => {
    const s = step('useNearSeatStep');
    assert.match(s, /const side = nearSeatSide\(\{ y, h, nearY: STUDIO\.N\.y, midY: STUDIO\.S\.y, faceH: FACE_H,/);
    assert.match(s, /<PlanStage [^\n]*inset=\{side\}>/);
  });

  it('TILT, PLACE and PATTERN drive the side view at the event', () => {
    const s = step('usePaAngleStep');
    assert.match(s, /const side = paAngleSide\(\{ hMic, rPa: planRange\(at, EVENT\.paL\), hPa: EVENT\.paH, rFaces: planRange\(at, EVENT\.CC\), faceH: FACE_H, aimRun: planRange\(at, aimAt\), aimRise: aimH - hMic, pattern,/);
    assert.match(s, /<PlanStage [^\n]*inset=\{side\}>/);
  });

  it('the box is drawing only: labels go through StaticLabels (never under 9 pt), no controls', () => {
    const near = art.slice(art.indexOf('export function nearSeatSide'), art.indexOf('/* ── the immersive tokens'));
    assert.match(near, /view: 'side'/);
    assert.match(near, /labels: \[/);
    assert.doesNotMatch(near, /Pressable|onPress|<Text|fontSize|numberOfLines/);
    assert.match(near, /text: fmtM1\(h\)/, 'the height is named beside its dimension');
    assert.match(near, /text: fmtM1\(hMic\)/);
  });

  it('every new RoundedRect sets x, y, width, height and r', () => {
    const near = art.slice(art.indexOf('function SideFloor'), art.indexOf('/* ── the immersive tokens'));
    const rects = near.match(/<RoundedRect [^>]*>/g) ?? [];
    assert.ok(rects.length >= 4);
    for (const r of rects) for (const k of ['x=', 'y=', 'width=', 'height=', 'r=']) assert.ok(r.includes(` ${k}`), `${k} in ${r}`);
  });

  it('the caption says what the box is, and stays short enough for two lines', () => {
    for (const name of ['useNearSeatStep', 'usePaAngleStep']) {
      const badge = /badge: '([^']+)'/.exec(step(name));
      assert.ok(badge, name);
      assert.match(badge[1], /corner box = from the side/);
      assert.ok(badge[1].length <= 128, `${name}: ${badge[1].length} characters`);
    }
  });
});

describe('decision 3: PATTERN shows its shape', () => {
  it('PatternLobe is the Field Reporter dashed shape', () => {
    const dash = /strokeWidth=\{1\.6 \* px\} color="#e8eef5" opacity=\{0\.75\}>\s*<DashPathEffect intervals=\{\[6 \* px, 4 \* px\]\} \/>/;
    assert.match(reporter, dash);
    assert.match(art, dash);
    assert.match(art, /Math\.abs\(gain\(pattern, \(th \* 180\) \/ Math\.PI\)\)/);
  });

  it('the plan draws it larger, from the chosen pattern; the side box draws and names it', () => {
    const s = step('usePaAngleStep');
    assert.match(s, /<PatternLobe [^\n]*pattern=\{pattern\} r=\{g \* 2\.4\} px=\{px\} \/>/);
    assert.match(s, /<MicOnPlan m=\{m\} px=\{px\} g=\{g\} lobe=\{false\} \/>/, 'never two shapes on one mic');
    assert.match(art, /<PatternLobe u=\{0\} v=\{-H\} dir=\{ang\} pattern=\{pattern\}/);
    assert.match(art, /pattern === 'supercardioid' \? 'SUPERCARDIOID' : 'CARDIOID'/);
  });
});

describe('decision 15: LOOKED AT names the item, no totals', () => {
  it('the venue and the immersive step print no count', () => {
    assert.doesNotMatch(pages, /\/ 8`|\/ 2`/);
    assert.match(step('useVenueTourStep'), /\{ k: 'LOOKED AT', v: L\.short, flex: 1 \}/);
    assert.match(step('useImmersiveStep'), /\{ k: 'LOOKED AT', v: S \? 'SURROUND' : 'AMBISONIC', flex: 1\.1 \}/);
  });

  it('the credit logic stays', () => {
    assert.match(step('useVenueTourStep'), /const done = seen\.size >= 6;/);
    assert.match(step('useImmersiveStep'), /seen\.size >= 2 \?/);
  });
});

describe('house words', () => {
  it('no "student" in the miking source touched here', () => {
    assert.doesNotMatch(pages + art, /student/i);
  });
});
