/**
 * Wiring round 6, DJ Systems Lab (round-4 grading, 2026-10-21) — each fix's
 * ratchet: the wrong wording or drawing fails here if it comes back.
 *   R4-DJ-01  Screen 21's LOOK said "two RCA plugs into one small stereo
 *             plug" whatever the TAP; with BOOTH OUT the drawing shows
 *             6.35 mm jack plugs. LOOK now follows the tap, exactly as the
 *             split lead is drawn.
 *   R4-DJ-02  Screen 20 SYSTEM, PASSIVE + AMP: the amp's AC IN was empty
 *             while its speaker lead was live, and CH B was empty with no
 *             note. A mains lead (IEC C13 seated in AC IN) now leaves the
 *             frame in its own lane, crossing and running beside no audio
 *             (rule book R1, R2, R8), and CH B's Speakon lead leaves the
 *             frame called out "TO TOP R".
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AMP_REAR, NL4, PASSIVE_REAR, SPEAKER_TAG, SYS_AMP_AT, SYS_TOP_AT, speakerLeadPts, speakerLeadXAt, speakerTagBox } from '../src/screens/lab/dj/geometry/eventGeometry.ts';
import { SPEAKER_W } from '../src/screens/lab/dj/geometry/gearGeometry.ts';
import { fitView } from '../src/screens/lab/dj/geometry/boothGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';
function block(src: string, head: RegExp): string {
  const m = head.exec(src);
  assert.ok(m, `${head} not found`);
  const rest = src.slice(m.index);
  const end = rest.slice(1).search(/\n(export )?(function|const|type) /);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

describe('R4-DJ-01 — Screen 21 LOOK follows the tap', () => {
  const p21 = read(DJ + 'pages/p21Rec.tsx');
  const look = block(p21, /export function lookFor\(/);
  const rg = read(DJ + 'art/RecorderGear.tsx');
  it('no tap-blind LOOK is left: Step 1 and the a11y both read lookFor(rec.tap)', () => {
    assert.doesNotMatch(p21, /const LOOK = /);
    assert.doesNotMatch(p21, /two RCA plugs into one small stereo plug/);
    assert.match(p21, /<Look>\{lookFor\(rec\.tap\)\}<\/Look>/);
    assert.match(p21, /a11y=\{`\$\{lookFor\(rec\.tap\)\} Tap:/);
  });
  it('REC OUT → two RCA plugs; BOOTH OUT → two ¼-inch (6.35 mm) jack plugs; both into one 3.5 mm plug in LINE IN', () => {
    const arm = (tap: string) => {
      const m = new RegExp(`case '${tap}':\\s*return '([^']*)';`).exec(look);
      assert.ok(m, tap);
      return m[1];
    };
    const rec = arm('REC_OUT');
    const booth = arm('BOOTH');
    assert.match(rec, /two RCA plugs \(white and red\) in the mixer’s REC OUT/);
    assert.doesNotMatch(rec, /jack/);
    assert.match(booth, /two ¼-inch \(6\.35 mm\) jack plugs in the mixer’s BOOTH OUT/);
    assert.doesNotMatch(booth, /RCA/);
    for (const t of [rec, booth]) assert.match(t, /into one small stereo plug \(3\.5 mm\) in the recorder’s LINE IN/);
    assert.match(arm('LOOPBACK'), /a laptop\. No lead joins them/);
    assert.match(look, /default:\s*return '[^']*recorder with nothing in its LINE IN/);
  });
  it('…which is what the drawing shows: TRS legs only on BOOTH, white/red RCA otherwise, one 3.5 mm plug', () => {
    assert.match(p21, /<SplitLead from=\{from\} y0=\{136\} to=\{lineIn\} live=\{live\} trs=\{tap === 'BOOTH'\}/);
    assert.match(rg, /kind=\{trs \? 'trs' : 'rca'\} colour=\{trs \? '#101113' : i === 0 \? INK\.rcaWhite : INK\.rcaRed\}/);
    assert.match(rg, /the 3\.5 mm TRS plug, seated in the recorder's LINE IN/);
  });
});

describe('R4-DJ-02 — Screen 20 SYSTEM: the amp is powered, CH B goes to TOP R', () => {
  const p20 = read(DJ + 'pages/p20Pa.tsx');
  const vg = read(DJ + 'art/VenueGear.tsx');
  const sv = block(p20, /export function SystemView\(/);
  const AMP_H = 88;
  const AMP_W = 482;
  const S_FRAME = { x: -40, y: -270, w: 1180, h: 1030 };
  const LANE_Y = SYS_AMP_AT.y + AMP_H + 8;
  const ac = { x: SYS_AMP_AT.x + AMP_REAR.ac.x, y: SYS_AMP_AT.y + AMP_REAR.ac.y };
  const outB = { x: SYS_AMP_AT.x + AMP_REAR.outB.x, y: SYS_AMP_AT.y + AMP_REAR.outB.y };
  const inA = { x: SYS_AMP_AT.x + AMP_REAR.inA.x, y: SYS_AMP_AT.y + AMP_REAR.inA.y };
  it('the geometry the test assumes is the source’s', () => {
    assert.match(vg, /export const AMP_W = 482;\nexport const AMP_H = 88;/);
    assert.match(p20, /export const S_FRAME: Box = \{ x: -40, y: -270, w: 1180, h: 1030 \};/);
    assert.match(p20, /export const AMP_MAINS_LANE_Y = SYS_AMP_AT\.y \+ AMP_H \+ 8;/);
  });
  it('a mains lead is drawn into AC IN: IEC C13 seated, ribbed mains cord at true scale, a mains plug at its far end', () => {
    assert.match(sv, /<CableRun r=\{\{ id: 'ampAc', kind: 'iec', colour: '#16171a', pts: AMP_AC, plugged: true, live: true, label: 'MAINS', farKind: 'mains' \}\} \/>/);
    assert.doesNotMatch(sv.match(/id: 'ampAc'[^}]*\}/)![0], /quiet/, 'full width (⌀ 6.2 drawn), not the thinned secondary cord');
    assert.match(read(DJ + 'art/cables.tsx'), /iec: 6\.2 \}/);
    assert.match(p20, /export const AMP_AC: \[number, number\]\[\] = \[\n  \[SYS_AMP_AT\.x \+ AMP_REAR\.ac\.x, SYS_AMP_AT\.y \+ AMP_REAR\.ac\.y\],\n  \[SYS_AMP_AT\.x \+ AMP_REAR\.ac\.x, AMP_MAINS_LANE_Y\],\n  \[S_FRAME\.x - AMP_LEAD_RUN_OFF, AMP_MAINS_LANE_Y\],\n\];/);
    assert.match(vg, /<IecInlet x=\{R\.ac\.x - 12\} y=\{R\.ac\.y - 8\} s=\{1\} \/>/);
  });
  it('its lane: drops from the plug, runs left under the chassis and out of the frame, crossing and beside no audio (R2, R8)', () => {
    // under the chassis (and its 7 mm shadow), above the passive top
    assert.ok(LANE_Y - 3.1 > SYS_AMP_AT.y + AMP_H, 'clear of the chassis');
    assert.ok(LANE_Y + 3.1 < SYS_TOP_AT.y, 'above the top');
    // its drop clears the fan guard and CH B's plug
    assert.ok(ac.x - 15 > SYS_AMP_AT.x + AMP_REAR.fan.x + AMP_REAR.fan.d / 2, 'the C13 body clear of the fan');
    assert.ok(ac.x + 15 < outB.x - NL4.plugD / 2, 'clear of CH B’s NL4 plug');
    // it never reaches the right of AC IN, where every audio lead is
    const lead = speakerLeadPts();
    const audioXs = [outB.x, inA.x, ...lead.map((p) => p[0])];
    for (const x of audioXs) assert.ok(x - NL4.cableD > ac.x + 15, `audio at x=${x} is right of the mains`);
    // the speaker lead starts below the amp's outputs, never above the lane's left run
    assert.ok(Math.min(...lead.map((p) => p[0])) > ac.x + 50);
    // it leaves the frame on the left, far off the glass
    assert.match(p20, /export const AMP_LEAD_RUN_OFF = 1200;/);
  });
  // Scene.textWidthPt, copied (Scene.tsx imports react-native); pinned to the source below
  const textWidthPt = (t: string, k = 1) => {
    let em = 0;
    for (const c of t) em += 'MW'.includes(c) ? 0.74 : ' .,:;·\'’|!I1()'.includes(c) ? 0.3 : c === '↔' || c === '→' ? 0.9 : 0.55;
    return em * 10 * k + t.length * 0.6 * k;
  };
  const SUB = { x: 500, y: 0, w: 550 };
  it('the speaker lead is named by a two-line tag LEFT of the top, tied to the lead (no flag on the lead)', () => {
    const sceneSrc = read(DJ + 'art/Scene.tsx');
    assert.ok(sceneSrc.includes("for (const c of t) em += 'MW'.includes(c) ? 0.74 : ' .,:;·\\'’|!I1()'.includes(c) ? 0.3 : c === '↔' || c === '→' ? 0.9 : 0.55;\n  return em * 10 * k + t.length * 0.6 * k;"), 'the copy matches Scene.textWidthPt');
    assert.match(sv, /<SpeakerLead pts=\{LEAD\} live=\{live\} \/>\n\s*<SpeakerLeadTag live=\{live\} \/>/);
    assert.doesNotMatch(sv, /labelAt=/, 'no flag ON the lead');
    assert.deepEqual([...SPEAKER_TAG.lines], ['SPEAKER CABLE', 'NL4']);
    const tag = block(vg, /export function SpeakerLeadTag\(/);
    assert.match(tag, /speakerTagBox\(s, textScale, speakerTagWidestPt\(textScale\)\)/);
    assert.match(tag, /<Circle cx=\{lx\} cy=\{y\}/, 'the tie ends in a dot ON the lead');
    assert.match(p20, /const b = speakerTagBox\(s, k, speakerTagWidestPt\(k\)\);\n  return \[\{ x: b\.x, y: b\.y, w: b\.w, h: b\.h \}\];/, 'no label may cover it');
    // the tie line runs across the top's plain rear: under the handle, above the connector cup
    assert.ok(SPEAKER_TAG.tieY > SYS_TOP_AT.y + 60 && SPEAKER_TAG.tieY < SYS_TOP_AT.y + PASSIVE_REAR.cup.y - 10);
    const lx = speakerLeadXAt(SPEAKER_TAG.tieY);
    assert.ok(lx > SYS_TOP_AT.x + PASSIVE_REAR.cup.x && lx < SYS_TOP_AT.x + PASSIVE_REAR.cup.x + PASSIVE_REAR.cup.w);
  });
  // k (the words' growth) exceeds 1 only when the stage itself is enlarged
  // (full screen: k = √(window ÷ glass)), so it is checked on the big glass
  for (const [W, H, ks] of [[360, 290, [1]], [390, 330, [1]], [820, 600, [1, 1.5]]] as const) {
    for (const k of ks) {
      it(`at ${W}×${H} (k ${k}) the tag is ≥ 9 pt, fully on the glass and clear of the sub, the top, the amp and the mains`, () => {
        const v = fitView(S_FRAME, W, H * 0.5, 6);
        const b = speakerTagBox(v.s, k, Math.max(...SPEAKER_TAG.lines.map((l) => textWidthPt(l, k))));
        assert.ok(SPEAKER_TAG.pt * k >= 9, 'text ≥ 9 pt');
        assert.ok(b.x + b.w < SUB.x - 4 / v.s, `clear of the sub (${(b.x + b.w).toFixed(0)} < ${SUB.x})`);
        assert.ok(b.x + b.w < SYS_TOP_AT.x, 'left of the top');
        assert.ok(b.y > LANE_Y + 3.1, 'below the mains lane and the amp');
        assert.ok(b.y + b.h < SYS_TOP_AT.y + 600, 'within the top’s height');
        const left = v.ox + b.x * v.s;
        assert.ok(left >= 0, `on the glass (left edge ${left.toFixed(1)} pt)`);
        // both lines fit the box
        assert.ok(textWidthPt('SPEAKER CABLE', k) / v.s < b.w);
      });
    }
  }
  it('CH B is not empty: a Speakon lead, seated, rises out of the frame in its own lane, called out TO TOP R (≥ 9 pt)', () => {
    assert.match(sv, /<SpeakerLead pts=\{AMP_OUT_B\} live=\{live\} \/>/);
    assert.match(p20, /export const AMP_OUT_B: \[number, number\]\[\] = \[\n  \[SYS_AMP_AT\.x \+ AMP_REAR\.outB\.x, SYS_AMP_AT\.y \+ AMP_REAR\.outB\.y\],\n  \[SYS_AMP_AT\.x \+ AMP_REAR\.outB\.x, S_FRAME\.y - AMP_LEAD_RUN_OFF\],\n\];/);
    // its lane: straight up, clear of the SPEAKER OUT legend and CH A's plug
    assert.ok(outB.x + NL4.cableD / 2 < (AMP_REAR.outB.x + AMP_REAR.outA.x) / 2 - 12, 'left of the SPEAKER OUT legend');
    assert.ok(outB.x + NL4.plugD / 2 < SYS_AMP_AT.x + AMP_REAR.outA.x - NL4.plugD / 2, 'clear of CH A’s plug');
    // the callout (Scene callouts are 10 pt × k, never under 9 pt)
    assert.match(p20, /\{ id: 'cb', text: 'TO TOP R', at: \{ x: AMP_OUT_B\[0\]\[0\], y: SYS_AMP_AT\.y - 75 \}, dx: -8, dy: 0, tone: 'plain' \}/);
    // beside its lead: the frame keeps a 150 mm band above the amp for it, and the XLR line's far end is off the glass too
    assert.ok(SYS_AMP_AT.y - S_FRAME.y >= 150);
    assert.ok(SYS_AMP_AT.y - 75 > S_FRAME.y + 40);
    assert.match(p20, /\[SYS_AMP_AT\.x \+ AMP_REAR\.inA\.x, S_FRAME\.y - AMP_LEAD_RUN_OFF\],/);
    assert.match(read(DJ + 'art/Scene.tsx'), /const fs = 10 \* k;/);
    // its lane is a label obstacle
    assert.match(p20, /up\(AMP_OUT_B, NL4\.plugD \/ 2\)/);
    assert.match(p20, /callouts=\{sysCalloutsNow\}/);
    assert.match(p20, /'PASSIVE TOP \(BACK\)'/);
    assert.match(p20, /'POWER AMP \(BACK\)'/);
  });
  it('the a11y and MODEL say so; the stale "CH B stands empty" is gone', () => {
    assert.match(p20, /The amp’s CH B output feeds the other top, TOP R, on its own Speakon lead out of view, and the amp’s mains lead is plugged into its AC IN\./);
    assert.doesNotMatch(p20, /CH B \(the\s+\* other top\) stands empty/);
    const model = read('docs/labs/dj/MODEL.md');
    assert.doesNotMatch(model, /CH B \(the other top\) stands empty/);
    assert.match(model, /R4-DJ-02/);
    assert.match(model, /R4-DJ-01, `lookFor`/);
  });
  it('the amp’s and the top’s placements are unchanged (R3-DJ-02 still holds)', () => {
    assert.deepEqual({ ...SYS_AMP_AT }, { x: 0, y: -120 });
    assert.deepEqual({ ...SYS_TOP_AT }, { x: 40, y: 60 });
    assert.ok(PASSIVE_REAR.input.x < SPEAKER_W);
    assert.ok(AMP_W > AMP_REAR.inA.x);
  });
});
