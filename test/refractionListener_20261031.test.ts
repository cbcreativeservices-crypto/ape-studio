/**
 * REFRACTION LISTENER (owner 2026-10-31) — ratchet.
 *
 * Owner: "the head in the Refraction Laboratory is way too big … it looks like
 * it's about close listening with the head so large, when in reality the head
 * is 150 m away." The owner chose a SMALL STANDING PERSON: the house standing
 * figure (appendStanding + StandingHead, as Diffraction's listener), feet on
 * the ground, drawn uniformly at the scene's one stated exaggeration
 * (HEIGHT ×GRAD_V_EXAG) so a ray at a standing ear's 1.6 m reaches its head.
 * Pins: GradientSceneView draws that figure (never a lone head icon), behind
 * an opaque fill so the rays pass behind it; the figure stays a modest share
 * of the sky; the "150 m" and "HEIGHT ×" labels stay.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SRC = 'src/screens/lab/wave/vizWave.tsx';
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const src = read(SRC);

/** The GradientSceneView function body (up to the next top-level declaration). */
function gradientScene(): string {
  const start = src.indexOf('export function GradientSceneView(');
  assert.ok(start >= 0, 'GradientSceneView exists');
  const rest = src.slice(start + 1);
  const end = rest.search(/\n(?:export )?(?:function|const) /);
  return src.slice(start, end < 0 ? undefined : start + 1 + end);
}

const num = (name: string): number => {
  const m = src.match(new RegExp(`const ${name} = ([0-9.]+);`));
  assert.ok(m, `${name} is a literal constant`);
  return Number(m[1]);
};

describe('Refraction listener — a small standing person 150 m out (owner 2026-10-31)', () => {
  const body = gradientScene();

  it('is the house standing figure at the ×20 height scale, never a lone head icon', () => {
    assert.match(body, /appendStanding\(path, listenerX, groundY, ppmY\)/);
    assert.match(body, /<StandingHead x=\{listenerX\} gy=\{groundY\} u=\{ppmY\} \/>/);
    assert.doesNotMatch(body, /<HeadIcon\b/, 'no line-art head icon in the refraction scene');
    assert.doesNotMatch(body, /SIDE_CANON|headIconScale|listenerHead/, 'the old ×20 head-icon sizing is gone');
  });

  it('the rays pass BEHIND the person (opaque fill under the line-art body)', () => {
    const fill = body.indexOf('<Path path={listenerBody} color="#0b0c10" />');
    const line = body.indexOf('<LineBust path={listenerBody}');
    const head = body.indexOf('<StandingHead x={listenerX}');
    const rays = body.indexOf('<GlowStroke path={rays.hot}');
    assert.ok(rays >= 0 && fill > rays, 'figure drawn after (over) the ray fan');
    assert.ok(fill >= 0 && line > fill && head > line, 'opaque fill → line body → head');
  });

  it("the head sits at a standing ear's height, so a 1.6 m ray reaches it", () => {
    // StandingHead centres the head 1.63 m up, 0.23 m crown→chin.
    assert.match(src, /cy=\{gy - 1\.63 \* u\} h=\{0\.23 \* u\}/);
    assert.ok(1.63 - 0.115 < 1.6 && 1.6 < 1.63 + 0.115, '1.6 m falls inside the head');
  });

  it('stays a modest figure — not a dramatic close-up (phone width)', () => {
    const sceneM = num('GRAD_SCENE_M');
    const exag = num('GRAD_V_EXAG');
    const aspect = num('SIDE_SCENE_ASPECT');
    const w = 390;
    const h = w / aspect;
    const groundY = h - 16;
    const ppmY = (w / sceneM) * exag;
    const figurePx = 1.75 * ppmY;
    const headPx = 0.23 * ppmY;
    // The old lone side head icon stood ≈ 48 px tall here (box ≈ 1.6·ppmY/29.9·45.6).
    assert.ok(figurePx < 0.2 * groundY, `figure ${figurePx.toFixed(1)} px < 20 % of the ${groundY} px sky`);
    assert.ok(headPx < 8, `head ${headPx.toFixed(1)} px reads as a person far away`);
  });

  it('keeps the distance label and the stated exaggeration', () => {
    assert.match(body, /\{`\$\{GRAD_LISTENER_M\} m`\}/);
    assert.match(body, /\{`HEIGHT ×\$\{GRAD_V_EXAG\}`\}/);
    assert.match(src, /const GRAD_LISTENER_M = 150;/);
  });
});
