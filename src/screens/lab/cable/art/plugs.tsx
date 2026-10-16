/**
 * Connector drawings for Cable & Connector Fundamentals (fix pass 2026-10-16).
 *
 * All authored in MILLIMETRES (k = units per mm), cable entering from the
 * LEFT, mating end to the RIGHT (side views) or seen head-on (faces):
 *
 *   ¼-inch (6.35 mm) TS / TRS: from the tip — tip 8.6 + neck to 11,
 *     insulator to 13.5, ring to 18.5, insulator to 21, sleeve to 31;
 *     barrel Ø13 × 38, boot 25.
 *   3.5 mm TRS / TRRS: Ø3.5 shaft 14.5 long; tip 3 + neck to 4; rings 3 / 2.2.
 *   RCA: Ø3.2 centre pin, Ø8.2 slotted shell, Ø10 barrel.
 *   XLR faces: Ø19 body; Ø1.6 pins on a Ø9.6 circle (1 and 2 up, 3 down,
 *     latch/key at the top). Viewed from the mating face the male reads
 *     1-left / 2-right and the female 2-left / 1-right — mirror images,
 *     because the two faces meet each other.
 *   NEMA 5-15 plug face: narrow (line) 6.35 mm and wide (neutral) 7.9 mm
 *     blades 12.7 mm apart, Ø4.8 earth pin 11.9 mm below their centre line.
 *     Seen from the blade end with the earth pin down, the narrow blade is on
 *     the LEFT (it meets the receptacle's short right-hand slot).
 *
 * Metal contact zones are drawn as metal; their NAMES are labels on leaders.
 * What each contact carries depends on the application — the cards' rows
 * say so — so no drawing here colours a contact by role.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Connector } from '../../cableinstall/svgArt';
import type { ConnectorId } from '../cableTypes';
import { ART, Label, Leader, ScaleBar, useArtUid } from './kit';

/* ── shared paint ─────────────────────────────────────────────────────────── */

function PaintDefs({ uid }: { uid: string }) {
  return (
    <Defs>
      <LinearGradient id={`${uid}ni`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#8f959e" />
        <Stop offset="0.28" stopColor="#f1f3f6" />
        <Stop offset="0.55" stopColor="#a9afb8" />
        <Stop offset="1" stopColor="#4a4f57" />
      </LinearGradient>
      <LinearGradient id={`${uid}au`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#9c7a2c" />
        <Stop offset="0.3" stopColor="#f6dc8c" />
        <Stop offset="0.6" stopColor="#c9a24a" />
        <Stop offset="1" stopColor="#6e5419" />
      </LinearGradient>
      <LinearGradient id={`${uid}bk`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#4b4e55" />
        <Stop offset="0.3" stopColor="#2a2c31" />
        <Stop offset="1" stopColor="#101114" />
      </LinearGradient>
      <LinearGradient id={`${uid}cb`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#4a4c52" />
        <Stop offset="0.35" stopColor="#2b2d32" />
        <Stop offset="1" stopColor="#141518" />
      </LinearGradient>
      <LinearGradient id={`${uid}ins`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3c3f46" />
        <Stop offset="0.28" stopColor="#6a6e77" />
        <Stop offset="0.55" stopColor="#2b2d33" />
        <Stop offset="1" stopColor="#111215" />
      </LinearGradient>
      <RadialGradient id={`${uid}pin`} cx="35%" cy="32%" r="75%">
        <Stop offset="0" stopColor="#fff3c4" />
        <Stop offset="0.5" stopColor="#d9b45a" />
        <Stop offset="1" stopColor="#7a5c1c" />
      </RadialGradient>
      <RadialGradient id={`${uid}face`} cx="45%" cy="40%" r="70%">
        <Stop offset="0" stopColor="#2b2d33" />
        <Stop offset="1" stopColor="#0d0e10" />
      </RadialGradient>
      <LinearGradient id={`${uid}ring`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#eef1f5" />
        <Stop offset="0.5" stopColor="#9aa0a9" />
        <Stop offset="1" stopColor="#4b5058" />
      </LinearGradient>
    </Defs>
  );
}

/* ── side views ───────────────────────────────────────────────────────────── */

type Zone = { name: string; x0: number; x1: number; r: number; metal: boolean };

/** Strain-relief boot from the cable (r0) to the handle (r1). */
function Boot({ uid, x0, x1, r0, r1 }: { uid: string; x0: number; x1: number; r0: number; r1: number }) {
  const ribs: string[] = [];
  for (let i = 1; i < 6; i++) {
    const x = x0 + ((x1 - x0) * i) / 6;
    const r = r0 + ((r1 - r0) * i) / 6;
    ribs.push(`M${x} ${-r} V${r}`);
  }
  return (
    <G>
      <Path d={`M${x0} ${-r0} L${x1} ${-r1} L${x1} ${r1} L${x0} ${r0} Z`} fill={`url(#${uid}bk)`} stroke="#0b0b0d" strokeWidth={0.15} />
      <Path d={ribs.join('')} stroke="#0b0c0e" strokeWidth={0.35} />
    </G>
  );
}

/** Cable stub leaving the boot to the left, ending in a break line. */
function CableStub({ uid, x0, x1, r }: { uid: string; x0: number; x1: number; r: number }) {
  return (
    <G>
      <Rect x={x0} y={-r} width={x1 - x0} height={2 * r} fill={`url(#${uid}cb)`} />
      <Path d={`M${x0} ${-r - 0.3} C${x0 + 1.4} ${-r / 2}, ${x0 - 1.4} ${r / 2}, ${x0} ${r + 0.3}`} stroke={ART.bg} strokeWidth={0.9} fill="none" />
    </G>
  );
}

export type PlugKind = 'ts' | 'trs' | 'trs35' | 'trrs35' | 'rca';

type PlugGeo = { len: number; r: number; zones: Zone[]; body: (uid: string) => ReactNode; cableR: number };

function phoneGeo(kind: 'ts' | 'trs'): PlugGeo {
  const tipEnd = 97;
  const T = (fromTip: number) => tipEnd - fromTip;
  const zones: Zone[] =
    kind === 'trs'
      ? [
          { name: 'SLEEVE', x0: 66, x1: T(21), r: 3.175, metal: true },
          { name: '', x0: T(21), x1: T(18.5), r: 3.175, metal: false },
          { name: 'RING', x0: T(18.5), x1: T(13.5), r: 3.175, metal: true },
          { name: '', x0: T(13.5), x1: T(11), r: 3.175, metal: false },
          { name: 'TIP', x0: T(11), x1: tipEnd, r: 3.175, metal: true },
        ]
      : [
          { name: 'SLEEVE', x0: 66, x1: T(13.5), r: 3.175, metal: true },
          { name: '', x0: T(13.5), x1: T(11), r: 3.175, metal: false },
          { name: 'TIP', x0: T(11), x1: tipEnd, r: 3.175, metal: true },
        ];
  return {
    len: tipEnd,
    r: 6.5,
    cableR: 3.0,
    zones,
    body: (uid) => (
      <G>
        <Boot uid={uid} x0={0} x1={25} r0={3.6} r1={5.2} />
        <Rect x={25} y={-6.5} width={38} height={13} rx={1.6} fill={`url(#${uid}ni)`} stroke="#2a2d33" strokeWidth={0.15} />
        <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${27 + i * 1.2} -6.3 V6.3`).join('')} stroke="#5d636c" strokeWidth={0.3} />
        <Rect x={63} y={-4.4} width={3} height={8.8} rx={0.5} fill="#16171a" />
      </G>
    ),
  };
}

function miniGeo(kind: 'trs35' | 'trrs35'): PlugGeo {
  const tipEnd = 39.5;
  const T = (f: number) => tipEnd - f;
  const r = 1.75;
  const zones: Zone[] =
    kind === 'trs35'
      ? [
          { name: 'SLEEVE', x0: 25, x1: T(9), r, metal: true },
          { name: '', x0: T(9), x1: T(8), r, metal: false },
          { name: 'RING', x0: T(8), x1: T(5), r, metal: true },
          { name: '', x0: T(5), x1: T(4), r, metal: false },
          { name: 'TIP', x0: T(4), x1: tipEnd, r, metal: true },
        ]
      : [
          { name: 'SLEEVE', x0: 25, x1: T(10.8), r, metal: true },
          { name: '', x0: T(10.8), x1: T(10), r, metal: false },
          { name: 'RING 2', x0: T(10), x1: T(7.8), r, metal: true },
          { name: '', x0: T(7.8), x1: T(7), r, metal: false },
          { name: 'RING 1', x0: T(7), x1: T(4.8), r, metal: true },
          { name: '', x0: T(4.8), x1: T(4), r, metal: false },
          { name: 'TIP', x0: T(4), x1: tipEnd, r, metal: true },
        ];
  return {
    len: tipEnd,
    r: 3.5,
    cableR: 1.75,
    zones,
    body: (uid) => (
      <G>
        <Boot uid={uid} x0={0} x1={10} r0={1.9} r1={3.0} />
        <Rect x={10} y={-3.5} width={14} height={7} rx={1.4} fill={`url(#${uid}bk)`} stroke="#0b0b0d" strokeWidth={0.12} />
        <Rect x={24} y={-2.4} width={1} height={4.8} fill="#16171a" />
      </G>
    ),
  };
}

function rcaGeo(): PlugGeo {
  return {
    len: 39.5,
    r: 5,
    cableR: 2.25,
    zones: [
      { name: 'SHELL', x0: 30, x1: 37, r: 4.1, metal: true },
      { name: 'CENTER PIN', x0: 37, x1: 39.5, r: 1.6, metal: true },
    ],
    body: (uid) => (
      <G>
        <Boot uid={uid} x0={0} x1={10} r0={2.4} r1={3.6} />
        <Rect x={10} y={-5} width={20} height={10} rx={1.2} fill={`url(#${uid}ni)`} stroke="#2a2d33" strokeWidth={0.12} />
        <Path d={[0, 1, 2, 3, 4, 5].map((i) => `M${12 + i * 1.1} -4.8 V4.8`).join('')} stroke="#5d636c" strokeWidth={0.25} />
      </G>
    ),
  };
}

function geoOf(kind: PlugKind): PlugGeo {
  return kind === 'ts' || kind === 'trs' ? phoneGeo(kind) : kind === 'rca' ? rcaGeo() : miniGeo(kind);
}

/** A plug, side-on, at (x, y) scale k. Returns the zone anchors (units) so a
 *  host can hang labels on them. */
function PlugSide({ uid, kind, x, y, k, gold = false, stub = 0 }: { uid: string; kind: PlugKind; x: number; y: number; k: number; gold?: boolean; stub?: number }) {
  const geo = geoOf(kind);
  const metal = `url(#${uid}${gold ? 'au' : 'ni'})`;
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      {stub > 0 ? <CableStub uid={uid} x0={-stub} x1={0.5} r={geo.cableR} /> : null}
      {geo.body(uid)}
      {geo.zones.map((z, i) => {
        const isTip = i === geo.zones.length - 1 && kind !== 'rca';
        if (kind === 'rca' && z.name === 'SHELL') {
          return (
            <G key={i}>
              <Rect x={z.x0} y={-z.r} width={z.x1 - z.x0} height={2 * z.r} fill={metal} stroke="#3a3e45" strokeWidth={0.12} />
              {[-2.6, 0, 2.6].map((dy) => (
                <Line key={dy} x1={z.x0 + 2.2} y1={dy} x2={z.x1} y2={dy} stroke="#2a2d33" strokeWidth={0.35} />
              ))}
            </G>
          );
        }
        if (kind === 'rca') {
          return <Path key={i} d={`M${z.x0} ${-z.r} H${z.x1 - 0.8} Q${z.x1} ${-z.r} ${z.x1} 0 Q${z.x1} ${z.r} ${z.x1 - 0.8} ${z.r} H${z.x0} Z`} fill={metal} stroke="#3a3e45" strokeWidth={0.1} />;
        }
        if (!z.metal)
          // black insulating washer — lit like the metal so the shaft reads
          // as ONE part, not floating pieces
          return (
            <G key={i}>
              <Rect x={z.x0 - 0.05} y={-z.r} width={z.x1 - z.x0 + 0.1} height={2 * z.r} fill={`url(#${uid}ins)`} />
            </G>
          );
        if (isTip) {
          // tip contact: neck groove, then the rounded nose
          const neckEnd = kind === 'ts' || kind === 'trs' ? z.x0 + 2.4 : z.x0 + 1.0;
          const nr = z.r * 0.72;
          return (
            <G key={i}>
              <Rect x={z.x0} y={-nr} width={neckEnd - z.x0} height={2 * nr} fill={metal} />
              <Path
                d={`M${neckEnd} ${-z.r} H${z.x1 - z.r * 0.9} Q${z.x1} ${-z.r} ${z.x1} 0 Q${z.x1} ${z.r} ${z.x1 - z.r * 0.9} ${z.r} H${neckEnd} Z`}
                fill={metal}
                stroke="#3a3e45"
                strokeWidth={0.1}
              />
            </G>
          );
        }
        return <Rect key={i} x={z.x0} y={-z.r} width={z.x1 - z.x0} height={2 * z.r} fill={metal} stroke="#3a3e45" strokeWidth={0.1} />;
      })}
    </G>
  );
}

/* ── faces ────────────────────────────────────────────────────────────────── */

/** Pin centres (mm) on a 4.8 mm radius: upper-left, upper-right, bottom. */
const XLR_POS = {
  ul: [-4.16, -2.4] as const,
  ur: [4.16, -2.4] as const,
  bot: [0, 4.8] as const,
};

/** XLR mating face. Male: pins in a shell sleeve with its key slot; female:
 *  sockets in a flush insert, key rib + latch at the top. Numbers sit beside
 *  each contact, as moulded on the real insert. */
function XlrFace({ uid, male, x, y, k, numbers = true }: { uid: string; male: boolean; x: number; y: number; k: number; numbers?: boolean }) {
  const pins: { n: string; p: readonly [number, number] }[] = male
    ? [
        { n: '1', p: XLR_POS.ul },
        { n: '2', p: XLR_POS.ur },
        { n: '3', p: XLR_POS.bot },
      ]
    : [
        { n: '2', p: XLR_POS.ul },
        { n: '1', p: XLR_POS.ur },
        { n: '3', p: XLR_POS.bot },
      ];
  const P = (mm: number) => mm * k;
  return (
    <G>
      {male ? (
        <G>
          <Circle cx={x} cy={y} r={P(9.5)} fill={`url(#${uid}ring)`} stroke="#25282d" strokeWidth={0.8} />
          <Circle cx={x} cy={y} r={P(7.95)} fill="#08090a" />
          {/* key slot in the sleeve at the top */}
          <Rect x={x - P(1.3)} y={y - P(9.0)} width={P(2.6)} height={P(1.2)} fill="#08090a" />
          <Circle cx={x} cy={y} r={P(7.3)} fill={`url(#${uid}face)`} />
          {pins.map(({ n, p }) => (
            <G key={n}>
              <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(0.8) + 0.6} fill="#050506" />
              <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(0.8)} fill={`url(#${uid}pin)`} />
            </G>
          ))}
        </G>
      ) : (
        <G>
          {/* latch tab above the shell */}
          <Rect x={x - P(2.4)} y={y - P(10.6)} width={P(4.8)} height={P(1.8)} rx={P(0.4)} fill={`url(#${uid}ring)`} stroke="#25282d" strokeWidth={0.6} />
          <Circle cx={x} cy={y} r={P(9.5)} fill={`url(#${uid}ring)`} stroke="#25282d" strokeWidth={0.8} />
          <Circle cx={x} cy={y} r={P(7.75)} fill={`url(#${uid}face)`} stroke="#050506" strokeWidth={0.8} />
          {/* key rib on the insert's rim */}
          <Rect x={x - P(1.1)} y={y - P(8.5)} width={P(2.2)} height={P(1.3)} fill="#2a2c31" />
          {pins.map(({ n, p }) => (
            <G key={n}>
              <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(1.2)} fill="#a98c43" stroke="#050506" strokeWidth={0.6} />
              <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(0.82)} fill="#050506" />
            </G>
          ))}
        </G>
      )}
      {numbers
        ? pins.map(({ n, p }) => {
            // moulded number beside each contact: outboard of the top pair,
            // to the right of the bottom contact
            // top pair: number just below each contact; bottom: to its right
            const nx = p[1] < 0 ? p[0] : p[0] + 3.1;
            const ny = p[1] < 0 ? p[1] + 3.2 : p[1];
            return <Label key={`n${n}`} x={x + P(nx)} y={y + P(ny) + 3.8} text={n} anchor="middle" size={10.5} color="#e9e2c8" weight="semibold" />;
          })
        : null}
    </G>
  );
}

/** The combo XLR/TRS panel jack, face-on: D-flange, XLR sockets around a
 *  ¼-inch opening, latch release above. */
function ComboFace({ uid, x, y, k }: { uid: string; x: number; y: number; k: number }) {
  const P = (mm: number) => mm * k;
  const holes = [
    { n: '2', p: XLR_POS.ul },
    { n: '1', p: XLR_POS.ur },
    { n: '3', p: XLR_POS.bot },
  ];
  return (
    <G>
      <Rect x={x - P(13)} y={y - P(15.5)} width={P(26)} height={P(31)} rx={P(1.8)} fill="#1d1f23" stroke="#0a0a0c" strokeWidth={0.8} />
      <Circle cx={x - P(9.5)} cy={y - P(12)} r={P(1.6)} fill="#08090a" stroke="#4a4e55" strokeWidth={0.6} />
      <Circle cx={x + P(9.5)} cy={y + P(12)} r={P(1.6)} fill="#08090a" stroke="#4a4e55" strokeWidth={0.6} />
      <Rect x={x - P(2.6)} y={y - P(13.6)} width={P(5.2)} height={P(2.4)} rx={P(0.5)} fill="#3b3e44" stroke="#0a0a0c" strokeWidth={0.5} />
      <Circle cx={x} cy={y} r={P(10.2)} fill={`url(#${uid}ring)`} stroke="#25282d" strokeWidth={0.8} />
      <Circle cx={x} cy={y} r={P(8.6)} fill={`url(#${uid}face)`} stroke="#050506" strokeWidth={0.8} />
      {holes.map(({ n, p }) => (
        <G key={n}>
          <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(1.2)} fill="#a98c43" stroke="#050506" strokeWidth={0.6} />
          <Circle cx={x + P(p[0])} cy={y + P(p[1])} r={P(0.82)} fill="#050506" />
        </G>
      ))}
      <Circle cx={x} cy={y} r={P(3.45)} fill="#9aa0a9" stroke="#050506" strokeWidth={0.6} />
      <Circle cx={x} cy={y} r={P(3.2)} fill="#040405" />
    </G>
  );
}

/* ── public figures ───────────────────────────────────────────────────────── */

const W = 340;

/** Hang a contact-zone label above or below each named zone. */
function zoneLabels(kind: PlugKind, x: number, y: number, k: number): ReactNode[] {
  const geo = geoOf(kind);
  const named = geo.zones.filter((z) => z.name);
  const out: ReactNode[] = [];
  named.forEach((z, i) => {
    const cx = x + ((z.x0 + z.x1) / 2) * k;
    const above = i % 2 === 1 || named.length <= 2 ? i % 2 === 1 : false;
    const ly = above ? y - z.r * k - 18 : y + z.r * k + 24;
    // keep the word inside the figure: slide it in, the leader still lands
    const half = z.name.length * 2.9 + 2;
    const tx = Math.min(W - 6 - half, Math.max(6 + half, cx));
    out.push(
      <G key={z.name}>
        <Leader x1={tx} y1={above ? ly + 3 : ly - 11} x2={cx} y2={above ? y - z.r * k : y + z.r * k} />
        <Label x={tx} y={ly} text={z.name} anchor="middle" />
      </G>,
    );
  });
  return out;
}

/** Contact anatomy of a plug, big, with every contact named. */
function anatomyGeo(kind: PlugKind) {
  const geo = geoOf(kind);
  const k = Math.min((W - 30) / (geo.len + 8), 8);
  // tall enough for the plug plus a label row above and below it
  const H = Math.round(2 * geo.r * k + 66);
  return { geo, k, H };
}

function PlugAnatomy({ kind }: { kind: PlugKind }) {
  const uid = useArtUid();
  const { geo, k, H } = anatomyGeo(kind);
  const stub = 8;
  const x = W - 12 - geo.len * k;
  const y = H / 2 - 2;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <PaintDefs uid={uid} />
      <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
      <PlugSide uid={uid} kind={kind} x={x} y={y} k={k} stub={stub} />
      {zoneLabels(kind, x, y, k)}
      <ScaleBar x={10} y={H - 9} k={k} mm={kind === 'ts' || kind === 'trs' ? 10 : 5} />
    </Svg>
  );
}

/** Both XLR faces side by side, numbered. */
function XlrPair() {
  const uid = useArtUid();
  const H = 150;
  const k = 5;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <PaintDefs uid={uid} />
      <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
      <XlrFace uid={uid} male x={88} y={68} k={k} />
      <XlrFace uid={uid} male={false} x={252} y={68} k={k} />
      <Label x={88} y={136} text="MALE · PINS" anchor="middle" />
      <Label x={252} y={136} text="FEMALE · SOCKETS" anchor="middle" />
      <Label x={170} y={146} text="both seen from the mating face, key at the top" anchor="middle" color={ART.sub} size={9.5} weight="regular" />
    </Svg>
  );
}

function ComboAnatomy() {
  const uid = useArtUid();
  const H = 190;
  const k = 5;
  const cx = 120;
  const cy = 92;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <PaintDefs uid={uid} />
      <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
      <ComboFace uid={uid} x={cx} y={cy} k={k} />
      {[
        { n: '2', p: XLR_POS.ul, ty: 44, left: true },
        { n: '1', p: XLR_POS.ur, ty: 58, left: false },
        { n: '3', p: XLR_POS.bot, ty: 150, left: false },
      ].map(({ n, p, ty, left }) => (
        <G key={n}>
          {left ? (
            <>
              <Leader x1={44} y1={ty - 3.5} x2={cx + p[0] * k - 6} y2={cy + p[1] * k} />
              <Label x={8} y={ty} text={`XLR ${n}`} />
            </>
          ) : (
            <>
              <Leader x1={226} y1={ty - 3.5} x2={cx + p[0] * k + 6} y2={cy + p[1] * k} />
              <Label x={230} y={ty} text={`XLR ${n}`} />
            </>
          )}
        </G>
      ))}
      <Leader x1={226} y1={100} x2={cx + 3.45 * k} y2={cy} />
      <Label x={230} y={104} text="¼-INCH OPENING" />
      <Label x={230} y={117} text="(tip · ring · sleeve" color={ART.sub} size={9.5} weight="regular" />
      <Label x={230} y={129} text="contacts inside)" color={ART.sub} size={9.5} weight="regular" />
      <Label x={10} y={H - 8} text="panel jack, face-on" color={ART.sub} size={9.5} weight="regular" />
    </Svg>
  );
}

function SpeakonSide() {
  const H = 120;
  const k = 2.6;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
      <Rect x={60} y={H / 2 + 4 - 4.6 * k * 0.5} width={60} height={4.6 * k} fill="#2b2d32" />
      <Connector kind="speakon" x={116} y={H / 2 + 4} k={k} jacket="black" shadow={false} />
      <Leader x1={116 + 55 * k} y1={16} x2={116 + 55 * k} y2={H / 2 + 4 - 16 * k + 1} />
      <Label x={116 + 55 * k} y={12} text="TWIST-LOCK COLLAR" anchor="middle" />
      <Label x={10} y={H - 8} text="cable connector, side-on" color={ART.sub} size={9.5} weight="regular" />
    </Svg>
  );
}

const ASPECT: Partial<Record<ConnectorId, number>> = {
  xlr3: W / 150,
  ts_quarter: W / anatomyGeo('ts').H,
  ts_speaker_legacy: W / anatomyGeo('ts').H,
  trs_quarter: W / anatomyGeo('trs').H,
  trs_35: W / anatomyGeo('trs35').H,
  trrs_35: W / anatomyGeo('trrs35').H,
  rca: W / anatomyGeo('rca').H,
  combo_xlr_trs: W / 190,
  speakon_nl2: W / 120,
  speakon_nl4: W / 120,
};

/** True when a connector has a code-drawn anatomy figure. */
export function hasConnectorArt(id: ConnectorId): boolean {
  return ASPECT[id] != null;
}
/** width ÷ height of a connector's anatomy figure. */
export function connectorArtAspect(id: ConnectorId): number {
  return ASPECT[id] ?? 1;
}

/** The connector's anatomy drawing for its card (pins / contacts named). */
export function ConnectorAnatomy({ id, width }: { id: ConnectorId; width: number }) {
  const aspect = ASPECT[id];
  if (!aspect || width <= 0) return null;
  const body =
    id === 'xlr3' ? (
      <XlrPair />
    ) : id === 'combo_xlr_trs' ? (
      <ComboAnatomy />
    ) : id === 'speakon_nl2' || id === 'speakon_nl4' ? (
      <SpeakonSide />
    ) : (
      <PlugAnatomy kind={id === 'trs_quarter' ? 'trs' : id === 'trs_35' ? 'trs35' : id === 'trrs_35' ? 'trrs35' : id === 'rca' ? 'rca' : 'ts'} />
    );
  return (
    <View style={{ width, height: Math.round(width / aspect) }} accessible accessibilityRole="image" accessibilityLabel={`Drawing of the ${id.replace(/_/g, ' ')} connector with its contacts named`}>
      {body}
    </View>
  );
}

/* ── Lesson 3: the analog family lineup ───────────────────────────────────── */

const LINEUP: { id: ConnectorId; name: string; h: number }[] = [
  { id: 'xlr3', name: '3-PIN XLR', h: 56 },
  { id: 'ts_quarter', name: '¼-INCH TS', h: 40 },
  { id: 'trs_quarter', name: '¼-INCH TRS', h: 40 },
  { id: 'trs_35', name: '3.5 MM TRS', h: 30 },
  { id: 'trrs_35', name: '3.5 MM TRRS', h: 30 },
  { id: 'rca', name: 'RCA', h: 32 },
  { id: 'combo_xlr_trs', name: 'COMBO XLR/TRS', h: 86 },
];
export const LINEUP_H = LINEUP.reduce((a, r) => a + r.h, 0) + 26;

/**
 * All seven analog connectors at ONE scale (2.4 units per mm), so their real
 * sizes compare honestly. Tapping a row picks that connector's card.
 */
export function AnalogLineup({ width, selected, onSelect }: { width: number; selected: ConnectorId; onSelect: (id: ConnectorId) => void }) {
  const uid = useArtUid();
  const k = 2.4;
  const x0 = 96;
  let yy = 6;
  const rows = LINEUP.map((r) => {
    const top = yy;
    yy += r.h;
    return { ...r, top, cy: top + r.h / 2 };
  });
  const H = LINEUP_H;
  const scale = width / W;
  return (
    <View style={{ width, height: (H * width) / W }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={(H * width) / W} viewBox={`0 0 ${W} ${H}`}>
        <PaintDefs uid={uid} />
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
        {rows.map((r) => {
          const on = r.id === selected;
          return (
            <G key={r.id}>
              {on ? <Rect x={3} y={r.top + 1} width={W - 6} height={r.h - 2} rx={6} fill="#1a1409" stroke="rgba(255,198,77,.55)" strokeWidth={0.8} /> : null}
              <Label x={10} y={r.cy + 3.5} text={r.name} color={on ? ART.hi : ART.label} />
              {r.id === 'xlr3' ? (
                <G>
                  <Connector kind="xlrM" x={x0} y={r.cy} k={k} jacket="black" shadow={false} />
                  <Label x={x0 + 66 * k} y={r.cy + 3.5} text="male plug" size={9.5} color={ART.sub} weight="regular" />
                </G>
              ) : r.id === 'combo_xlr_trs' ? (
                <ComboFace uid={uid} x={x0 + 40} y={r.cy} k={k} />
              ) : (
                <PlugSide
                  uid={uid}
                  kind={r.id === 'ts_quarter' ? 'ts' : r.id === 'trs_quarter' ? 'trs' : r.id === 'trs_35' ? 'trs35' : r.id === 'trrs_35' ? 'trrs35' : 'rca'}
                  x={x0}
                  y={r.cy}
                  k={k}
                />
              )}
            </G>
          );
        })}
        <ScaleBar x={10} y={H - 10} k={k} mm={20} />
        <Label x={W - 8} y={H - 7} text="all drawn at one scale" anchor="end" color={ART.sub} size={9.5} weight="regular" />
      </Svg>
      {/* Tap targets over each row (SVG onPress is unreliable on web). */}
      {rows.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => onSelect(r.id)}
          accessibilityRole="button"
          accessibilityLabel={`${r.name} — show its card`}
          style={{ position: 'absolute', left: 0, right: 0, top: r.top * scale, height: r.h * scale }}
        />
      ))}
    </View>
  );
}

/* ── Lesson 7: NEMA 5-15 plug face ────────────────────────────────────────── */

const NEMA_CONTACTS = [
  { key: 'narrow', match: /narrow/i, name: 'NARROW BLADE' },
  { key: 'wide', match: /wide/i, name: 'WIDE BLADE' },
  { key: 'round', match: /round|earth|ground/i, name: 'ROUND PIN' },
] as const;

/** The NA wall plug's face. `selected` = the record's contact label in
 *  focus; tapping a contact calls onSelect with that label. */
export function NemaPlugFace({ width, labels, selected, onSelect }: { width: number; labels: string[]; selected: number; onSelect: (i: number) => void }) {
  const uid = useArtUid();
  const H = 196;
  const k = 4.6;
  const cx = 150;
  const cy = 96;
  const P = (mm: number) => mm * k;
  const bladeY = cy - P(5.6);
  const groundY = bladeY + P(11.9);
  const idxOf = (re: RegExp) => labels.findIndex((l) => re.test(l));
  const iN = idxOf(NEMA_CONTACTS[0].match);
  const iW = idxOf(NEMA_CONTACTS[1].match);
  const iR = idxOf(NEMA_CONTACTS[2].match);
  const on = (i: number) => i >= 0 && i === selected;
  const blade = (bx: number, wmm: number, i: number) => (
    <G>
      {on(i) ? <Rect x={bx - P(0.75) - 3} y={bladeY - P(wmm / 2) - 3} width={P(1.5) + 6} height={P(wmm) + 6} rx={3} fill="none" stroke={ART.hi} strokeWidth={1.6} /> : null}
      <Rect x={bx - P(0.75)} y={bladeY - P(wmm / 2)} width={P(1.5)} height={P(wmm)} rx={0.8} fill={`url(#${uid}ring)`} stroke="#3a3e45" strokeWidth={0.5} />
    </G>
  );
  const scale = width / W;
  return (
    // Not one accessible element: the three contacts inside are each a
    // button (an accessible wrapper would hide them on iOS).
    <View style={{ width, height: (H * width) / W }} accessible={false}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={(H * width) / W} viewBox={`0 0 ${W} ${H}`}>
        <PaintDefs uid={uid} />
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
        {/* moulded plug body */}
        <Rect x={cx - P(16)} y={cy - P(19)} width={P(32)} height={P(38)} rx={P(7)} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.8} />
        <Rect x={cx - P(14.5)} y={cy - P(17.5)} width={P(29)} height={P(35)} rx={P(6)} fill="#1c1e22" />
        {blade(cx - P(6.35), 6.35, iN)}
        {blade(cx + P(6.35), 7.9, iW)}
        {on(iR) ? <Circle cx={cx} cy={groundY} r={P(2.4) + 3} fill="none" stroke={ART.hi} strokeWidth={1.6} /> : null}
        <Circle cx={cx} cy={groundY} r={P(2.4)} fill={`url(#${uid}ring)`} stroke="#3a3e45" strokeWidth={0.5} />
        {/* labels on leaders, outside the plug */}
        <Leader x1={52} y1={bladeY - 30} x2={cx - P(6.35) - P(0.75)} y2={bladeY - P(2)} />
        <Label x={8} y={bladeY - 34} text="NARROW BLADE" color={on(iN) ? ART.hi : ART.label} />
        <Leader x1={242} y1={bladeY - 30} x2={cx + P(6.35) + P(0.75)} y2={bladeY - P(2.5)} />
        <Label x={238} y={bladeY - 34} text="WIDE BLADE" color={on(iW) ? ART.hi : ART.label} />
        <Leader x1={242} y1={groundY + 30} x2={cx + P(2.4)} y2={groundY + P(1)} />
        <Label x={238} y={groundY + 42} text="ROUND PIN" color={on(iR) ? ART.hi : ART.label} />
        <ScaleBar x={10} y={H - 10} k={k} mm={10} />
        <Label x={W - 8} y={H - 7} text="seen from the blade end, round pin down" anchor="end" color={ART.sub} size={9.5} weight="regular" />
      </Svg>
      {[
        { i: iN, x: cx - P(6.35), y: bladeY, w: 34, h: 46 },
        { i: iW, x: cx + P(6.35), y: bladeY, w: 34, h: 50 },
        { i: iR, x: cx, y: groundY, w: 40, h: 40 },
      ]
        .filter((t) => t.i >= 0)
        .map((t) => (
          <Pressable
            key={t.i}
            onPress={() => onSelect(t.i)}
            accessibilityRole="button"
            accessibilityLabel={`${labels[t.i]} on the wall plug's face — show its job`}
            style={{ position: 'absolute', left: (t.x - t.w / 2) * scale, top: (t.y - t.h / 2) * scale, width: t.w * scale, height: t.h * scale }}
          />
        ))}
    </View>
  );
}

/* ── Lesson 4: the shared plug of a look-alike pair ───────────────────────── */

export type SharedPlug = 'ts' | 'trs' | 'xlr' | 'rca' | 'bnc' | 'rj45';

/** One plug, side-on, with a short cable — the shape both sides share. */
export function SharedPlugFigure({ plug, width }: { plug: SharedPlug; width: number }) {
  const uid = useArtUid();
  const H = 64;
  const cy = 30;
  const len = plug === 'ts' || plug === 'trs' ? 97 : plug === 'xlr' ? 63 : plug === 'rca' ? 39.5 : plug === 'bnc' ? 51 : 33;
  const dia = plug === 'ts' || plug === 'trs' ? 13 : plug === 'xlr' ? 19 : plug === 'rca' ? 10 : plug === 'bnc' ? 14 : 14;
  // fit BOTH ways: the whole plug, end to end and top to bottom
  const k = Math.min(4.2, (W - 70) / len, (H - 18) / dia);
  const x = W - 16 - len * k;
  return (
    <View style={{ width, height: (H * width) / W }} accessible accessibilityRole="image" accessibilityLabel="Drawing of the plug both cables share">
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={(H * width) / W} viewBox={`0 0 ${W} ${H}`}>
        <PaintDefs uid={uid} />
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
        <Rect x={12} y={cy - 3 * k} width={x - 10} height={6 * k} fill={`url(#${uid}cb)`} />
        {plug === 'xlr' ? <Connector kind="xlrM" x={x} y={cy} k={k} jacket="black" shadow={false} /> : null}
        {plug === 'bnc' ? <Connector kind="bnc" x={x} y={cy} k={k} jacket="black" shadow={false} /> : null}
        {plug === 'rj45' ? <Connector kind="rj45" x={x} y={cy} k={k} jacket="blue" shadow={false} /> : null}
        {plug === 'ts' || plug === 'trs' || plug === 'rca' ? <PlugSide uid={uid} kind={plug} x={x} y={cy} k={k} /> : null}
        <ScaleBar x={12} y={H - 8} k={k} mm={10} />
      </Svg>
    </View>
  );
}
