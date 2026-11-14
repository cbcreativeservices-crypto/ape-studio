/**
 * topArtR2 — top-view art for round 2 of the added kinds (owner 2026-11-13:
 * "Yes, build them all"): marimba, timpani, flute, hand harmonium and
 * harmonica. See topArtTypes.ts for the contract: centered on 0,0, 32 floor
 * units to the meter, the FRONT toward the audience (+y), the PLAYER
 * UPSTAGE (−y) facing the audience, so the player's right hand is at −x
 * (stage right) and the left hand at +x.
 *
 * The geometry is the print symbol's (spSymbols: SP_MARIMBA, SP_TIMPANI,
 * SP_FLUTE, SP_HARMONIUM, SP_HARMONICA), so the screen and the paper agree
 * part for part. What is drawn:
 *   • marimba (5 octaves, C2–C7, 2.6 × 1.05 m): the tapered frame with its
 *     end boards, the resonators showing between the bars, the rosewood bars
 *     in two rows (naturals nearest the player, the low C at the player's
 *     LEFT, +x), the cord through each row at the bars' nodes;
 *   • timpani (32, 29, 26 and 23 in, American setup: the largest at the
 *     timpanist's left): each drum's copper bowl, its chrome counterhoop, the
 *     head, the tuning handles round the hoop, the tuning gauge and the pedal
 *     on the player's side; the timpanist's stool in the middle;
 *   • flute (a concert flute, 0.67 m, held to the player's right): the
 *     crown, the lip plate and embouchure hole, the head joint, the body
 *     with its key cups, the foot joint with its rollers. The tube is drawn
 *     about 1.3 × its real 19 mm so it reads at phone size;
 *   • hand harmonium (3¼ octaves, 39 keys, 0.60 × 0.30 m) on the rug the
 *     player sits on: the wooden case, the 23 white and 16 black keys toward
 *     the player, the row of stop and drone knobs behind the keys, the top
 *     cover with its grille, the bellows on the back panel, hinged at the
 *     player's right end and opened at the left end by the left hand;
 *   • harmonica: the player's dynamic microphone on a straight stand (the
 *     round cast base, the clip, the microphone toward the player, its cable
 *     along the floor), and the case of twelve harmonicas in several keys
 *     open on a small table at the player's right.
 *
 * Pure drawings: no state, no text, no image file.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { SP_FLUTE, SP_HARMONICA, SP_HARMONICA_HARPS, SP_HARMONIUM, SP_MARIMBA, SP_MARIMBA_ACC, SP_TIMPANI, spMarimbaFar, spMarimbaNear, spMarimbaW, spMarimbaX } from '../../../../features/stageplot/spSymbols';
import type { TopArtMap } from './topArtTypes';

/** Floor units to the meter. */
const M = 32;

/** How far each drawing reaches from its center, in floor units (the shadow
 *  aside). A test holds each inside its print symbol's footprint. */
export const TOP_ART_R2_EXTENT = {
  marimba: { hw: 41.5, hh: 16.65 },
  timpani: { hw: 41.0, hh: 24.25 },
  flute: { hw: 10.8, hh: 3.0 },
  harmonium: { hw: 15.55, hh: 15.85 },
  harmonica: { hw: 11.4, hh: 7.1 },
} as const;

const SHADOW = 'rgba(0,0,0,0.45)';
const SHADOW_AT = 'translate(0.8 1.2)';
const OUTLINE = '#0a0a0c';
const ROSEWOOD = '#8a3f22';
const ROSEWOOD_DK = '#3a160a';
const ROSEWOOD_LT = '#b0603a';
const FRAME = '#2a1c14';
const RESONATOR = '#15161a';
const CHROME = '#d4d6da';
const CHROME_DK = '#6d7179';
const SILVER = '#c9ccd2';
const HEAD = '#e9e2cc';
const TEAK = '#6b3d1f';
const TEAK_DK = '#2a180c';
const TEAK_LT = '#9a6638';
const IVORY = '#e8e6dd';
const EBONY = '#16171a';
const RUG = '#5a1e1e';
const RUBBER = '#15161a';
const LEATHER = '#2a2420';

/* ── marimba ── */

const m = (v: number): number => v * M;
const MB_FRAME = `M${m(-SP_MARIMBA.frameX)} ${m(spMarimbaNear(-SP_MARIMBA.frameX)).toFixed(2)} L${m(SP_MARIMBA.frameX)} ${m(spMarimbaNear(SP_MARIMBA.frameX)).toFixed(2)} L${m(SP_MARIMBA.frameX)} ${m(spMarimbaFar(SP_MARIMBA.frameX)).toFixed(2)} L${m(-SP_MARIMBA.frameX)} ${m(spMarimbaFar(-SP_MARIMBA.frameX)).toFixed(2)} Z`;
/** A bar's width at t (1 = the low end), floor units: 42 mm to 62 mm. */
const mbW = (t: number): number => m(spMarimbaW(t));

function MarimbaTop() {
  const bar = (x: number, y0: number, len: number, w: number, key: string) => (
    <G key={key}>
      <Rect x={x - w / 2} y={y0} width={w} height={len} rx={0.3} fill={ROSEWOOD} stroke={ROSEWOOD_DK} strokeWidth={0.15} />
      <Line x1={x - w / 2 + 0.3} y1={y0 + 0.4} x2={x - w / 2 + 0.3} y2={y0 + len - 0.4} stroke={ROSEWOOD_LT} strokeWidth={0.14} />
    </G>
  );
  const nat = Array.from({ length: SP_MARIMBA.naturals }, (_, n) => spMarimbaX(n));
  const acc = SP_MARIMBA_ACC.map((n) => (spMarimbaX(n) + spMarimbaX(n + 1)) / 2);
  const L = (x: number): number => m(SP_MARIMBA.len(SP_MARIMBA.t(x)));
  // the cords through each row's bars, at the nodes (22.4 % from each end)
  const cord = (sign: number, shorten: number) => [0.224, 0.776].map((f) => [m(SP_MARIMBA.x1), m(SP_MARIMBA.x0)].map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${(sign * (0.96 + (L(x / M) - shorten) * f)).toFixed(2)}`).join(' ')).join(' ');
  return (
    <G>
      <Path d={MB_FRAME} fill={SHADOW} transform={SHADOW_AT} />
      {/* the frame, the resonators under the bars (they show in the gaps) */}
      <Path d={MB_FRAME} fill={FRAME} stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
      <Path
        d={`M${m(SP_MARIMBA.x0) - 0.8} ${(m(spMarimbaNear(SP_MARIMBA.x0)) + 0.8).toFixed(2)} L${m(SP_MARIMBA.x1) + 0.8} ${(m(spMarimbaNear(SP_MARIMBA.x1)) + 0.8).toFixed(2)} L${m(SP_MARIMBA.x1) + 0.8} -0.5 L${m(SP_MARIMBA.x0) - 0.8} -0.5 Z`}
        fill={RESONATOR}
      />
      <Path
        d={`M${m(SP_MARIMBA.x0) - 0.8} 0.5 L${m(SP_MARIMBA.x1) + 0.8} 0.5 L${m(SP_MARIMBA.x1) + 0.8} ${(m(spMarimbaFar(SP_MARIMBA.x1)) - 0.8).toFixed(2)} L${m(SP_MARIMBA.x0) - 0.8} ${(m(spMarimbaFar(SP_MARIMBA.x0)) - 0.8).toFixed(2)} Z`}
        fill={RESONATOR}
      />
      {/* each bar's resonator tube under it: the openings' rims show in the gaps */}
      {nat.map((x, i) => (
        <Circle key={`rn${i}`} cx={m(x)} cy={-(0.96 + L(x) / 2)} r={mbW(SP_MARIMBA.t(x)) / 2 + 0.25 + 0.1 * SP_MARIMBA.t(x)} fill="#1e1a12" stroke="#8a7a3a" strokeWidth={0.18} />
      ))}
      {acc.map((x, i) => (
        <Circle key={`ra${i}`} cx={m(x)} cy={0.96 + (L(x) - 0.64) / 2} r={mbW(SP_MARIMBA.t(x)) / 2 + 0.25 + 0.1 * SP_MARIMBA.t(x)} fill="#1e1a12" stroke="#8a7a3a" strokeWidth={0.18} />
      ))}
      <Path d={cord(-1, 0) + cord(1, 0.64)} stroke="#d9cfb8" strokeWidth={0.14} />
      {/* the bars: naturals nearest the player, accidentals beyond */}
      {nat.map((x, i) => bar(m(x), -(0.96 + L(x)), L(x), mbW(SP_MARIMBA.t(x)), `n${i}`))}
      {acc.map((x, i) => bar(m(x), 0.96, L(x) - 0.64, mbW(SP_MARIMBA.t(x)), `a${i}`))}
      {/* the end boards */}
      <Rect x={m(-SP_MARIMBA.frameX)} y={m(spMarimbaNear(-SP_MARIMBA.frameX))} width={1.3} height={m(spMarimbaFar(-SP_MARIMBA.frameX) - spMarimbaNear(-SP_MARIMBA.frameX))} rx={0.35} fill="#4a3324" stroke={OUTLINE} strokeWidth={0.2} />
      <Rect x={m(SP_MARIMBA.frameX) - 1.3} y={m(spMarimbaNear(SP_MARIMBA.frameX))} width={1.3} height={m(spMarimbaFar(SP_MARIMBA.frameX) - spMarimbaNear(SP_MARIMBA.frameX))} rx={0.35} fill="#4a3324" stroke={OUTLINE} strokeWidth={0.2} />
    </G>
  );
}

/* ── timpani ── */

/** The tuning handles round a drum: eight on the two large drums, six on
 *  the small ones. */
const handles = (size: number): number => (size >= 29 ? 8 : 6);

function Drum({ d }: { d: (typeof SP_TIMPANI.drums)[number] }) {
  const cx = m(d.x);
  const cy = m(d.y);
  const rb = m(d.bowl);
  const rh = m(d.head);
  // toward the timpanist's stool: the gauge and the pedal are on that side
  const vx = SP_TIMPANI.stool.x - d.x;
  const vy = SP_TIMPANI.stool.y - d.y;
  const l = Math.hypot(vx, vy);
  const ux = vx / l;
  const uy = vy / l;
  const deg = (Math.atan2(uy, ux) * 180) / Math.PI;
  const n = handles(d.size);
  return (
    <G>
      {/* the pedal, under the bowl on the player's side */}
      <G transform={`translate(${cx} ${cy}) rotate(${deg})`}>
        <Rect x={rb - 0.8} y={-2.2} width={4.0} height={4.4} rx={0.6} fill="#2a2c31" stroke={OUTLINE} strokeWidth={0.25} />
        <Rect x={rb + 0.2} y={-1.7} width={2.6} height={3.4} rx={0.4} fill="#4a4e56" />
        <Path d={`M${rb + 0.6} -1.2 h1.8 M${rb + 0.6} 0 h1.8 M${rb + 0.6} 1.2 h1.8`} stroke="#2a2c31" strokeWidth={0.25} />
      </G>
      {/* from above the chrome counterhoop is the outermost ring: the copper
          bowl is under it. Its band, its shine, then the head */}
      <Circle cx={cx} cy={cy} r={rb} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.3} />
      <Circle cx={cx} cy={cy} r={(rb + rh) / 2} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.2} />
      <Circle cx={cx} cy={cy} r={rh} fill={HEAD} stroke="#9a937f" strokeWidth={0.22} />
      <Circle cx={cx - rh * 0.35} cy={cy - rh * 0.35} r={rh * 0.4} fill="rgba(255,255,255,0.12)" />
      {/* the tuning handles, standing on the hoop */}
      {Array.from({ length: n }, (_, i) => {
        const a = ((360 / n) * i + 180 / n) * (Math.PI / 180);
        const hx = cx + Math.cos(a) * ((rb + rh) / 2);
        const hy = cy + Math.sin(a) * ((rb + rh) / 2);
        return <Rect key={i} x={-1.0} y={-0.28} width={2.0} height={0.56} rx={0.25} fill={SILVER} stroke={CHROME_DK} strokeWidth={0.12} transform={`translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${((a * 180) / Math.PI + 90).toFixed(1)})`} />;
      })}
      {/* the tuning gauge, over the head's edge on the player's side */}
      <G transform={`translate(${cx} ${cy}) rotate(${deg})`}>
        <Path d={`M${rh - 2.2} -1.6 A2.4 2.4 0 0 1 ${rh - 2.2} 1.6`} fill="none" stroke="#3a3d44" strokeWidth={0.45} />
        <Line x1={rh - 3.2} y1={0} x2={rh - 1.4} y2={0} stroke="#c0392b" strokeWidth={0.22} />
      </G>
    </G>
  );
}

function TimpaniTop() {
  const s = SP_TIMPANI.stool;
  return (
    <G>
      {SP_TIMPANI.drums.map((d) => (
        <Circle key={`s${d.size}`} cx={m(d.x) + 0.8} cy={m(d.y) + 1.2} r={m(d.bowl)} fill={SHADOW} />
      ))}
      <Circle cx={m(s.x) + 0.6} cy={m(s.y) + 0.9} r={m(s.r)} fill={SHADOW} />
      {/* the timpanist's stool: its footrest ring, the padded seat */}
      <Circle cx={m(s.x)} cy={m(s.y)} r={m(s.r)} fill="none" stroke={CHROME_DK} strokeWidth={0.45} />
      <Circle cx={m(s.x)} cy={m(s.y)} r={m(s.r) * 0.72} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.3} />
      <Circle cx={m(s.x)} cy={m(s.y)} r={m(s.r) * 0.45} fill="none" stroke="#2e3036" strokeWidth={0.25} />
      {SP_TIMPANI.drums.map((d) => (
        <Drum key={d.size} d={d} />
      ))}
    </G>
  );
}

/* ── flute ── */

function FluteTop() {
  const F = SP_FLUTE;
  const len = Math.hypot(F.crown.x - F.foot.x, F.crown.y - F.foot.y) * M;
  const deg = (Math.atan2(F.foot.y - F.crown.y, F.foot.x - F.crown.x) * 180) / Math.PI;
  // drawn along +x from the crown, then turned and placed: s = distance from the crown
  const r = 0.4; // the tube's half width (about 1.3 × a real 19 mm tube)
  // the key cups (distance from the crown, floor units): the left hand's
  // group (the closed C, the open-ring A and G, the G# cup beside them), a
  // gap, the right hand's open rings (F, E, D); `ring` = an open-hole key
  const keys: { s: number; ring: boolean; side?: number }[] = [
    { s: 8.8, ring: false },
    { s: 9.6, ring: true },
    { s: 10.4, ring: true },
    { s: 10.9, ring: false, side: 0.75 },
    { s: 12.8, ring: true },
    { s: 13.6, ring: true },
    { s: 14.4, ring: true },
  ];
  const place = (dx: number, dy: number) => `translate(${(m(F.crown.x) + dx).toFixed(2)} ${(m(F.crown.y) + dy).toFixed(2)}) rotate(${deg.toFixed(2)})`;
  return (
    <G>
      {/* the shadow falls down and to the right on the deck, as every shadow does */}
      <Rect x={0} y={-r} width={len} height={2 * r} rx={r} fill={SHADOW} transform={place(0.8, 1.2)} />
      <G transform={place(0, 0)}>
        {/* the tube: head joint, body, foot joint, and its shine */}
        <Rect x={0} y={-r} width={len} height={2 * r} rx={r} fill={SILVER} stroke={CHROME_DK} strokeWidth={0.12} />
        <Line x1={0.4} y1={-r * 0.45} x2={len - 0.4} y2={-r * 0.45} stroke="rgba(255,255,255,0.7)" strokeWidth={0.12} />
        <Rect x={6.6} y={-r - 0.08} width={0.45} height={2 * r + 0.16} rx={0.12} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.08} />
        <Rect x={len - 3.4} y={-r - 0.08} width={0.45} height={2 * r + 0.16} rx={0.12} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.08} />
        {/* the crown at the player's left, the lip plate and its embouchure hole */}
        <Rect x={-0.15} y={-r - 0.1} width={0.6} height={2 * r + 0.2} rx={0.25} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.1} />
        <Ellipse cx={m(F.lip)} cy={-0.05} rx={0.75} ry={0.5} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.1} />
        <Ellipse cx={m(F.lip)} cy={-0.05} rx={0.3} ry={0.2} fill="#1a1c20" />
        {/* the key cups along the body, the trill keys and the foot's rollers */}
        <Line x1={8.4} y1={r - 0.05} x2={len - 1.0} y2={r - 0.05} stroke={CHROME_DK} strokeWidth={0.12} />
        {keys.map((k) => (
          <G key={k.s}>
            <Circle cx={k.s} cy={k.side ?? 0} r={0.38} fill={SILVER} stroke={CHROME_DK} strokeWidth={0.1} />
            {k.ring ? <Circle cx={k.s} cy={0} r={0.14} fill="#34373d" /> : null}
          </G>
        ))}
        {/* the foot joint's two cups and the roller keys */}
        <Circle cx={len - 2.3} cy={0} r={0.38} fill={SILVER} stroke={CHROME_DK} strokeWidth={0.1} />
        <Circle cx={len - 1.3} cy={0} r={0.38} fill={SILVER} stroke={CHROME_DK} strokeWidth={0.1} />
        <Rect x={len - 2.9} y={0.15} width={0.9} height={0.3} rx={0.15} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.06} />
      </G>
    </G>
  );
}

/* ── hand harmonium on its rug ── */

/** 23 white keys from C, and the 16 black keys among them (no black key
 *  after E or B), counted from the LOW end, which is at the player's left
 *  (+x), as on any keyboard played facing the audience. */
const HM_WHITE = 23;
const HM_BLACK = Array.from({ length: HM_WHITE - 1 }, (_, i) => i).filter((i) => !'EB'.includes('CDEFGAB'[i % 7]!));

function HarmoniumTop() {
  const H = SP_HARMONIUM;
  const R = m(H.rug);
  const x0 = m(H.x0);
  const x1 = m(H.x1);
  const y0 = m(H.y0);
  const y1 = m(H.y1);
  const kx0 = x0 + 1.6;
  const kx1 = x1 - 1.6;
  const kw = (kx1 - kx0) / HM_WHITE;
  const ky0 = y0 + 0.25;
  const ky1 = m(H.keysTo);
  const fringe = Array.from({ length: 30 }, (_, i) => -R + 1.2 + i * ((2 * R - 2.4) / 29));
  const bellows = `M${x0} ${y1} L${x1} ${y1} L${x1} ${(y1 + m(H.bellowsOpen)).toFixed(2)} L${x0} ${(y1 + m(H.bellowsHinge)).toFixed(2)} Z`;
  return (
    <G>
      <Rect x={-R + 0.6} y={-R + 0.8} width={2 * R} height={2 * R} rx={0.3} fill={SHADOW} />
      {/* the rug the player sits on: its fringe, the border, the field */}
      <Path d={fringe.map((x) => `M${x.toFixed(2)} ${-R} v-0.45 M${x.toFixed(2)} ${R} v0.45`).join('')} stroke="#c9b48a" strokeWidth={0.2} />
      <Rect x={-R} y={-R} width={2 * R} height={2 * R} rx={0.3} fill={RUG} stroke={OUTLINE} strokeWidth={0.35} />
      <Rect x={-R + 1.4} y={-R + 1.4} width={2 * R - 2.8} height={2 * R - 2.8} fill="none" stroke="#8a6a3c" strokeWidth={0.9} />
      <Rect x={-R + 2.8} y={-R + 2.8} width={2 * R - 5.6} height={2 * R - 5.6} fill="#4a1818" stroke="#6a2a22" strokeWidth={0.3} />
      {/* the harmonium's shadow, then the bellows on its back panel: the
          folds, and the outer board opened at the left-hand end */}
      <Rect x={x0 + 0.6} y={y0 + 0.9} width={x1 - x0} height={y1 - y0 + m(H.bellowsOpen)} rx={0.4} fill={SHADOW} />
      <Path d={bellows} fill={LEATHER} stroke={OUTLINE} strokeWidth={0.3} strokeLinejoin="round" />
      {[0.25, 0.5, 0.75].map((f) => (
        <Line key={f} x1={x0 + 0.6} y1={y1 + m(H.bellowsHinge) * f} x2={x1 - 0.4} y2={y1 + m(H.bellowsOpen) * f} stroke="#5a5048" strokeWidth={0.18} />
      ))}
      <Line x1={x0} y1={y1 + m(H.bellowsHinge)} x2={x1} y2={y1 + m(H.bellowsOpen)} stroke={TEAK} strokeWidth={0.7} strokeLinecap="round" />
      <Rect x={x1 - 1.4} y={y1 + m(H.bellowsOpen) - 0.9} width={1.0} height={1.2} rx={0.3} fill={TEAK_LT} stroke={TEAK_DK} strokeWidth={0.12} />
      {/* the wooden case and its plain top cover: the lid's edge, its hinge
          along the back, and its two brass catches */}
      <Rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={0.4} fill={TEAK} stroke={OUTLINE} strokeWidth={0.35} />
      <Rect x={x0 + 0.9} y={m(H.stopsY) + 0.9} width={x1 - x0 - 1.8} height={y1 - m(H.stopsY) - 1.6} rx={0.3} fill="#5e3419" stroke={TEAK_DK} strokeWidth={0.2} />
      <Line x1={x0 + 1.4} y1={y1 - 1.05} x2={x1 - 1.4} y2={y1 - 1.05} stroke={TEAK_DK} strokeWidth={0.18} />
      <Path
        d={`M${x0 + 2} ${(m(H.stopsY) + 2.4).toFixed(2)} C${x0 + 8} ${(m(H.stopsY) + 2.0).toFixed(2)} ${x1 - 8} ${(m(H.stopsY) + 2.8).toFixed(2)} ${x1 - 2} ${(m(H.stopsY) + 2.3).toFixed(2)}`}
        fill="none"
        stroke="rgba(30,14,4,0.3)"
        strokeWidth={0.15}
      />
      {[x0 + 3.2, x1 - 4.0].map((x) => (
        <Rect key={`c${x}`} x={x} y={m(H.stopsY) + 0.65} width={0.8} height={0.5} rx={0.12} fill="#c9a24a" stroke="#5a4a18" strokeWidth={0.08} />
      ))}
      {/* the keys toward the player: white keys, then the black keys */}
      <Rect x={kx0 - 0.3} y={ky0 - 0.15} width={kx1 - kx0 + 0.6} height={ky1 - ky0 + 0.3} fill={EBONY} />
      {Array.from({ length: HM_WHITE }, (_, i) => (
        <Rect key={`w${i}`} x={kx1 - (i + 1) * kw + 0.05} y={ky0} width={kw - 0.1} height={ky1 - ky0} rx={0.08} fill={IVORY} />
      ))}
      {HM_BLACK.map((i) => (
        <Rect key={`b${i}`} x={kx1 - (i + 1) * kw - kw * 0.3} y={(ky0 + ky1) / 2 - 0.2} width={kw * 0.6} height={(ky1 - ky0) / 2 + 0.2} rx={0.08} fill={EBONY} stroke="#3a3c42" strokeWidth={0.06} />
      ))}
      {/* the stop and drone knobs in a row behind the keys: they pull out
          toward the player, so from above each is a short stem with its
          round cap seen side-on */}
      {[-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18].map((x) => (
        <G key={`k${x}`}>
          <Rect x={m(x) - 0.14} y={m(H.stopsY) - 0.35} width={0.28} height={0.9} fill="#3a2414" />
          <Rect x={m(x) - 0.32} y={m(H.stopsY) - 0.75} width={0.64} height={0.42} rx={0.18} fill={TEAK_LT} stroke={TEAK_DK} strokeWidth={0.1} />
        </G>
      ))}
    </G>
  );
}

/* ── harmonica: the player's microphone and the harmonica case ── */

function HarmonicaTop() {
  const A = SP_HARMONICA;
  const bx = m(A.base.x);
  const by = m(A.base.y);
  const t = { x0: m(A.table.x0), x1: m(A.table.x1), y0: m(A.table.y0), y1: m(A.table.y1) };
  const c = { x0: m(A.case.x0), x1: m(A.case.x1), y0: m(A.case.y0), y1: m(A.case.y1) };
  const tail = m(A.mic.y0);
  const tip = m(A.mic.y1);
  // a harmonica as it stands in its slot, holes up: 102 × 22 mm, ten holes
  const HL = m(0.102);
  const HW = m(0.022);
  return (
    <G>
      <Rect x={t.x0 + 0.8} y={t.y0 + 1.2} width={t.x1 - t.x0} height={t.y1 - t.y0} rx={0.5} fill={SHADOW} />
      <Circle cx={bx + 0.6} cy={by + 0.9} r={m(A.base.r)} fill={SHADOW} />
      {/* the small wooden table */}
      <Rect x={t.x0} y={t.y0} width={t.x1 - t.x0} height={t.y1 - t.y0} rx={0.5} fill="#5a3a22" stroke={OUTLINE} strokeWidth={0.35} />
      <Path
        d={`M${t.x0 + 0.8} ${t.y0 + 2.5} C${t.x0 + 4} ${t.y0 + 2.1} ${t.x1 - 4} ${t.y0 + 2.9} ${t.x1 - 0.8} ${t.y0 + 2.4} M${t.x0 + 0.8} ${t.y1 - 2.2} C${t.x0 + 4} ${t.y1 - 2.6} ${t.x1 - 4} ${t.y1 - 1.8} ${t.x1 - 0.8} ${t.y1 - 2.3}`}
        fill="none"
        stroke="rgba(30,14,4,0.35)"
        strokeWidth={0.15}
      />
      {/* the open case: its shadow, its black shell, the felt, the lid
          folded back along the hinge on the far side */}
      <Rect x={c.x0 + 0.4} y={c.y0 + 0.6} width={c.x1 - c.x0} height={c.y1 - c.y0} rx={0.4} fill="rgba(0,0,0,0.4)" />
      <Rect x={c.x0} y={c.y0} width={c.x1 - c.x0} height={c.y1 - c.y0} rx={0.4} fill="#141518" stroke="#4a4e56" strokeWidth={0.2} />
      <Rect x={c.x0 + 0.35} y={c.y0 + 0.35} width={c.x1 - c.x0 - 0.7} height={c.y1 - c.y0 - 0.7} rx={0.25} fill="#4a1a22" />
      <Rect x={c.x0} y={c.y1} width={c.x1 - c.x0} height={0.7} rx={0.2} fill="#26282d" stroke="#4a4e56" strokeWidth={0.15} />
      {/* twelve harmonicas standing in their slots, the ten holes up */}
      {SP_HARMONICA_HARPS.map((h, i) => (
        <G key={i}>
          <Rect x={m(h.x)} y={m(h.y)} width={HL} height={HW} rx={0.12} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.08} />
          <Rect x={m(h.x) + 0.25} y={m(h.y) + HW * 0.28} width={HL - 0.5} height={HW * 0.44} fill="#1b1c20" />
          <Path d={Array.from({ length: 9 }, (_, k) => `M${(m(h.x) + 0.25 + ((HL - 0.5) * (k + 1)) / 10).toFixed(2)} ${(m(h.y) + HW * 0.28).toFixed(2)} v${(HW * 0.44).toFixed(2)}`).join(' ')} stroke="#d4d6da" strokeWidth={0.1} />
        </G>
      ))}
      {/* the cable: from the microphone's tail down the pole, then along the
          floor toward the audience */}
      <Path d={`M${bx} ${tail} L${bx} ${by} C${bx} ${by + m(A.base.r) + 1.0} ${m(A.cableEnd.x) + 0.6} ${m(A.cableEnd.y) - 1.4} ${m(A.cableEnd.x)} ${m(A.cableEnd.y)}`} fill="none" stroke={RUBBER} strokeWidth={0.42} strokeLinecap="round" />
      {/* the stand: the round cast base, the pole's top, the clip on it */}
      <Circle cx={bx} cy={by} r={m(A.base.r)} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={bx} cy={by} r={m(A.base.r) * 0.7} fill="none" stroke="#2e3036" strokeWidth={0.25} />
      <Circle cx={bx} cy={by} r={0.55} fill={CHROME} stroke={CHROME_DK} strokeWidth={0.15} />
      <Rect x={bx - 0.4} y={by - 1.1} width={0.8} height={0.95} rx={0.25} fill="#3a3d44" stroke={OUTLINE} strokeWidth={0.1} />
      {/* the microphone, its grille toward the player: the handle, the band
          seam and the mesh of the ball grille */}
      <Path d={`M${bx - 0.5} ${tail} L${bx + 0.5} ${tail} L${bx + 0.75} ${tip + 2.0} L${bx - 0.75} ${tip + 2.0} Z`} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.2} />
      <Circle cx={bx} cy={tip + 1.0} r={1.0} fill="#9aa0a8" stroke={CHROME_DK} strokeWidth={0.2} />
      <Line x1={bx - 0.95} y1={tip + 1.0} x2={bx + 0.95} y2={tip + 1.0} stroke="#5d6068" strokeWidth={0.2} />
      <Path d={`M${bx - 0.6} ${tip + 0.45} h1.2 M${bx - 0.8} ${tip + 0.7} h1.6 M${bx - 0.8} ${tip + 1.3} h1.6 M${bx - 0.6} ${tip + 1.55} h1.2`} stroke="#7d8189" strokeWidth={0.08} />
    </G>
  );
}

export const TOP_ART_R2: TopArtMap = {
  marimba: MarimbaTop,
  timpani: TimpaniTop,
  flute: FluteTop,
  harmonium: HarmoniumTop,
  harmonica: HarmonicaTop,
};
