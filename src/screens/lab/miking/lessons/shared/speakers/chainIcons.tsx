/**
 * THE SIGNAL-CHAIN ICONS (DiPath's nodes) — art pass 2026-10-10. Each node is
 * the real object, drawn to its real proportions inside the node's box of side
 * S (centred at 0, 0): an ICON ROW, so each icon is internally true; the
 * scale differs between icons. Everything is built in millimetres and scaled
 * by k = px per mm; hairlines are set in pixels (÷ k) so they survive the
 * small size, and the details resolve in FULL SCREEN.
 *
 * Real dimensions (mm) each icon is drawn to — code comments only, never shown:
 *   guitar      solid-body electric, the lesson's own drawing (ElectricArt):
 *               ≈ 990 long, body ≈ 455 × 320, 6 strings, audience view, the
 *               neck raised 25°; the instrument cable from its face jack
 *   bass        the lesson's four-string bass (ElectricArt): ≈ 1170 long
 *   steel       pedal steel from the audience side: body 900 × 90 on 4 legs
 *               (top 700 above the floor), 3 floor pedals on a rack, 4 knee
 *               levers, keyhead (left) and changer (right)
 *   pedals      a board 320 × 180 with three compact pedals 64 × 112 (knobs
 *               Ø 15, footswitch Ø 12 on an 18 nut, LED Ø 5), jacks on the
 *               sides, right-angle patch cables; seen from the AUDIENCE side
 *               (as the rest of the row), so the signal runs left → right
 *   volume      a steel guitar volume pedal from the side: base 280 × 45,
 *               rubber-treaded treadle hinged at the heel, side jacks
 *   di          a passive DI box 128 × 92 × 50, three-quarter view: the XLR
 *               male output (3 pins) and the ground-lift switch on the end
 *               facing right; the input and thru plugs at the far end
 *   ampOut      the amp's own direct out: a strip of the rear panel with an
 *               XLR male line out, its ground lift, and a ¼ in jack
 *   auxOut      an instrument's own ¼ in auxiliary output on its panel
 *   combo       1 × 12 combo FRONT: 622 × 445 (the lesson's model), control
 *               panel band 90 (2 inputs, 9 knobs, pilot lamp), grille cloth,
 *               the speaker 60 right of centre and 255 below the top, a strap
 *               handle 180 × 22
 *   head        compact bass head 330 × 75 × 250, three-quarter view
 *   guitarHead  a guitar valve head 600 × 250 front: vent grille, control
 *               panel (2 inputs, 8 knobs, 2 toggles, pilot jewel), handle
 *   cab112      a closed-back 1 × 12 cabinet 500 × 470 (the lesson's model),
 *               the speaker (frame Ø 309) centred behind the grille cloth
 *   speaker12   the bare 12 in guitar speaker, front: frame Ø 309, 4 mounting
 *               holes on a 297 PCD, cone Ø 283, surround, dust cap Ø 100,
 *               2 terminals with their leads
 *   bassCab     4 × 10 + horn bass cabinet front: 762 × 610, speakers on
 *               ±170 / ±150, horn 66 between the top pair, steel grille,
 *               metal corners
 *   mic         an instrument dynamic: Ø 32 grille, 157 long, aimed LEFT at
 *               the speaker; a clip, a short stand; the XLR cable plug (Ø 19 ×
 *               50) at the tail
 *   desk        a 12-channel compact console 450 × 420 seen from the mix
 *               position: strips 26 wide (7 knobs, mute, fader), a master
 *               section, a meter bridge
 *   rhodes      the lesson's 61-key tine piano (C to C) from the player's side:
 *               988 × 563, 36 white + 25 black keys, end blocks 71, the black
 *               harp cover
 *   wurli       a 64-key reed piano: 1000 × 460, 38 white keys, the moulded
 *               lid with its two slotted grilles facing the player
 *   wurliAmp    its built-in amplifier: a board ≈ 260 × 110 on a steel
 *               chassis plate, the heat sink with two power transistors,
 *               electrolytic capacitors, the output transformer
 *   wurliLid    the lid's front slope from the player: ≈ 1000 × 130, two oval
 *               grilles (≈ 200 × 100) near its ends, the speakers behind
 *
 * Light from the upper left, gradients for form, a soft contact shadow, the
 * house stroke hierarchy. Static (D8). No maker's shape, name or logo.
 */
import type { ReactNode } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { ElectricFront, buildElectric, electricExtent } from '../electric/ElectricArt';
import { BASS, GUITAR, type ElectricSpec } from '../electric/electricSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = readonly [number, number];
const make = () => Skia.Path.Make();
const CHROME = ['#f4f6fa', '#a6acb7', '#3a3d45'] as const;
const STEEL = ['#c9ced7', '#8a909b', '#4a4e57'] as const;
const TOLEX = ['#3a3b41', '#1d1e22', '#0f1012'] as const;
const INK = '#08080a';
const CABLE = '#3a3c44';

function rr(x: number, y: number, w: number, h: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
  return p;
}
function poly(pts: readonly P2[], close = true): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (close) p.close();
  return p;
}
function oval(cx: number, cy: number, rx: number, ry: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, 2 * rx, 2 * ry));
  return p;
}
/** A circle drawn on an oblique face: centre c, radius r, the face's two unit axes (screen). */
function ovalOn(c: P2, r: number, ax: P2, ay: P2, n = 28): SkPath {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([c[0] + r * (Math.cos(a) * ax[0] + Math.sin(a) * ay[0]), c[1] + r * (Math.cos(a) * ax[1] + Math.sin(a) * ay[1])]);
  }
  return poly(pts);
}
/** Scale (px per mm) that fits w × h mm into fw·S × fh·S. */
const fit = (S: number, w: number, h: number, fw = 1, fh = 1) => Math.min((S * fw) / w, (S * fh) / h);

/** A soft contact shadow under an object (mm, in the scaled group). */
function Shadow({ x, y, w, h, k, o = 0.5 }: { x: number; y: number; w: number; h: number; k: number; o?: number }) {
  return (
    <Path path={rr(x, y, w, h, h / 2)} color="#000" opacity={o}>
      <BlurMask blur={2.5 / k} style="normal" />
    </Path>
  );
}

/* ── the instruments ─────────────────────────────────────────────────── */

/** The guitar or the bass: the lesson's own face-on drawing, turned to the
 *  audience's view (neck to the right) and raised 25°, with its cable. */
function ElectricIcon({ s, S, out }: { s: ElectricSpec; S: number; out: 'right' | 'down' }) {
  const e = electricExtent(s);
  const uc = (e.u0 + e.u1) / 2;
  const tilt = (25 * Math.PI) / 180;
  const th = Math.PI - tilt;
  const len = e.u1 - e.u0;
  const wid = e.v1 - e.v0;
  const k = (1.3 * S) / (len * Math.cos(tilt) + wid * Math.sin(tilt));
  const cx = -0.12 * S;
  const cy = 0.02 * S;
  const b = buildElectric(s);
  const to = (u: number, v: number): P2 => [cx + k * ((u - uc) * Math.cos(th) - v * Math.sin(th)), cy + k * ((u - uc) * Math.sin(th) + v * Math.cos(th))];
  const j = to(b.jack.u, b.jack.v);
  const end: P2 = out === 'down' ? [0, S / 2] : [S / 2, 0];
  const cable = make();
  cable.moveTo(j[0], j[1]);
  if (out === 'down') cable.cubicTo(j[0] - 0.06 * S, j[1] + 0.22 * S, end[0] - 0.02 * S, end[1] - 0.2 * S, end[0], end[1]);
  else cable.cubicTo(j[0] - 0.05 * S, j[1] + 0.3 * S, end[0] - 0.2 * S, end[1] + 0.25 * S, end[0], end[1]);
  return (
    <Group>
      <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: th }, { scale: k }, { translateX: -uc }]}>
        <ElectricFront s={s} px={1 / k} turned />
      </Group>
      {/* The instrument cable: its straight plug seen end-on in the face jack. */}
      <Path path={cable} style="stroke" strokeWidth={3.4} strokeCap="round" color={INK} />
      <Path path={cable} style="stroke" strokeWidth={2.4} strokeCap="round" color={CABLE} />
      <Circle cx={j[0]} cy={j[1]} r={Math.max(1.2, 10 * k)} color="#141519" />
      <Circle cx={j[0]} cy={j[1]} r={Math.max(1.2, 10 * k)} style="stroke" strokeWidth={0.4} color="#5a5e68" />
    </Group>
  );
}

/** Pedal steel, audience side: body on four legs, pedal rack, knee levers. */
function SteelIcon({ S }: { S: number }) {
  // Body 900 long × 90 deep; top 700 above the floor; legs Ø 25.
  const k = fit(S, 940, 720, 1.25, 1);
  const L = 900;
  const top = -700;
  const bh = 90;
  const x0 = -L / 2;
  const legs = [x0 + 70, x0 + L - 70];
  const pedals = [-90, -10, 70];
  const knees = [-170, -60, 40, 150];
  const hw = 0.6 / k;
  return (
    <Group transform={[{ translateY: 0.5 * S - 0.04 * S }, { scale: k }]}>
      <Shadow x={x0} y={-18} w={L} h={26} k={k} o={0.45} />
      {/* Legs (chrome tubes) and the pedal rack between the front legs. */}
      {legs.map((u) => (
        <Path key={u} path={rr(u - 13, top + bh, 26, -top - bh - 8, 6)}>
          <LinearGradient start={vec(u - 13, 0)} end={vec(u + 13, 0)} colors={[...CHROME]} />
        </Path>
      ))}
      <Path path={rr(legs[0] - 24, -14, 48, 14, 4)} color="#16171b" />
      <Path path={rr(legs[1] - 24, -14, 48, 14, 4)} color="#16171b" />
      <Path path={rr(-150, -70, 300, 22, 6)}>
        <LinearGradient start={vec(0, -70)} end={vec(0, -48)} colors={[...CHROME]} />
      </Path>
      {/* Pedal rods up to the changer, the pedals hinged on the rack. */}
      {pedals.map((u) => (
        <Group key={u}>
          <Path path={poly([[u + 30, -70], [L / 2 - 60, top + bh + 4]], false)} style="stroke" strokeWidth={Math.max(5, hw)} color="#7d828c" />
          <Path path={poly([[u - 26, -46], [u + 30, -46], [u + 26, -24], [u - 22, -14]])}>
            <LinearGradient start={vec(u, -46)} end={vec(u, -14)} colors={['#3d4048', '#1d1e22', '#0f1012']} />
          </Path>
        </Group>
      ))}
      {/* Knee levers hanging under the body. */}
      {knees.map((u, i) => {
        // Each lever hangs from its cross rod and turns out toward a knee (left, right, left, right).
        const sd = i % 2 ? 1 : -1;
        return <Path key={u} path={poly([[u, top + bh], [u, top + bh + 95], [u + sd * 44, top + bh + 110]], false)} style="stroke" strokeWidth={Math.max(9, 1.1 / k)} strokeCap="round" strokeJoin="round" color="#b4b9c3" />;
      })}
      {/* The body: a lacquered box, keyhead (left) and changer (right). */}
      <Path path={rr(x0, top, L, bh, 10)}>
        <LinearGradient start={vec(0, top)} end={vec(0, top + bh)} colors={['#b2753e', '#7a4a22', '#3e230e']} />
      </Path>
      <Path path={rr(x0, top, L, bh, 10)} style="stroke" strokeWidth={hw} color={INK} />
      <Path path={rr(x0 - 6, top - 22, 70, bh + 26, 8)}>
        <LinearGradient start={vec(x0, top)} end={vec(x0 + 70, top + bh)} colors={[...CHROME]} />
      </Path>
      <Path path={rr(x0 + L - 70, top - 30, 76, bh + 32, 8)}>
        <LinearGradient start={vec(x0 + L - 70, top)} end={vec(x0 + L, top + bh)} colors={[...CHROME]} />
      </Path>
      <Path path={rr(x0 + 64, top - 8, L - 134, 10, 4)} color="#d9dce3" opacity={0.85} />
    </Group>
  );
}

/** The keyboard instrument from the player's side: case, keys, the cover over the action. */
function KeyboardIcon({ S, kind }: { S: number; kind: 'rhodes' | 'wurli' }) {
  const rh = kind === 'rhodes';
  // Width × depth (mm); the depth is seen foreshortened (×0.55) from the player's eye.
  const W = rh ? 988 : 1000;
  const D = rh ? 563 : 460;
  const f = 0.55;
  const whites = rh ? 36 : 38;
  const cheek = rh ? 71 : 50;
  const kbW = W - 2 * cheek;
  const kw = kbW / whites;
  const keyD = 150 * f;
  const front = 70; // the key fronts and the case's front rail, seen face-on
  const depth = D * f;
  const k = fit(S, W, depth + front, 1.0, 0.9);
  const x0 = -W / 2;
  const y0 = -(depth + front) / 2;
  const yKeys = y0 + depth - keyD;
  const caseCols = rh ? TOLEX : (['#8e4636', '#5e2a20', '#2e130e'] as const);
  const lid = rh ? rr(x0 + 6, y0, W - 12, depth - keyD - 14, 10) : wurliLidTop(x0, y0, W, depth - keyD - 8);
  const keys = make();
  for (let i = 1; i < whites; i++) {
    keys.moveTo(x0 + cheek + i * kw, yKeys);
    keys.lineTo(x0 + cheek + i * kw, yKeys + keyD + front * 0.45);
  }
  const blacks = make();
  for (let i = 0; i < whites - 1; i++) {
    // A black key follows the white keys C, D, F, G and A (C = 0 … B = 6); the
    // tine piano's lowest key is a C (0: the lesson's 61-key model), the reed piano's an A (5).
    const inOct = (i + (rh ? 0 : 5)) % 7;
    if (![0, 1, 3, 4, 5].includes(inOct)) continue;
    const bx = x0 + cheek + (i + 1) * kw - kw * 0.3;
    blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(bx, yKeys, kw * 0.6, keyD * 0.62), 0.6, 0.6));
  }
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={y0 + depth + front - 16} w={W - 20} h={26} k={k} />
      {/* The case: its top (foreshortened) and its front face. */}
      <Path path={rr(x0, y0, W, depth + front, 14)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + depth + front)} colors={[...caseCols]} />
      </Path>
      <Path path={rr(x0, y0, W, depth + front, 14)} style="stroke" strokeWidth={0.6 / k} color={INK} />
      {/* The cover over the action (black, tine piano) or the moulded lid with its grilles (reed piano). */}
      <Path path={lid}>
        <LinearGradient start={vec(0, y0)} end={vec(0, yKeys)} colors={rh ? ['#4d4f57', '#2a2c31', '#141519'] : ['#b05a44', '#7a3626', '#3a170f']} />
      </Path>
      <Path path={lid} style="stroke" strokeWidth={0.5 / k} color={rh ? '#6a6d76' : '#c27a62'} opacity={0.7} />
      {!rh ? (
        <>
          {[-1, 1].map((sd) => (
            <Group key={sd}>
              <Path path={oval(sd * W * 0.3, yKeys - 34, 100, 22)} color="#1a0b07" />
              {[-60, -30, 0, 30, 60].map((d) => (
                <Path key={d} path={poly([[sd * W * 0.3 + d, yKeys - 50], [sd * W * 0.3 + d, yKeys - 18]], false)} style="stroke" strokeWidth={8} color="#a65640" opacity={0.85} />
              ))}
            </Group>
          ))}
        </>
      ) : null}
      {/* The keys: white keys with the black keys between, then the key fronts. */}
      <Path path={rr(x0 + cheek, yKeys, kbW, keyD + front * 0.45, 2)}>
        <LinearGradient start={vec(0, yKeys)} end={vec(0, yKeys + keyD + front * 0.45)} colors={['#fbfbf8', '#e6e3dc', '#b9b6ad']} />
      </Path>
      <Path path={keys} style="stroke" strokeWidth={0.28 / k} color="#7d796f" />
      <Path path={blacks} color="#0d0d10" />
      <Path path={rr(x0 + cheek - 4, yKeys - 10, kbW + 8, 10, 2)} color={rh ? '#121316' : '#2a1410'} />
      <Path path={rr(x0, y0 + depth + front * 0.45, W, front * 0.55, 8)}>
        <LinearGradient start={vec(0, y0 + depth)} end={vec(0, y0 + depth + front)} colors={[...caseCols]} />
      </Path>
    </Group>
  );
}
/** The reed piano's moulded lid from above: a shallow dome, rounded at the ends. */
function wurliLidTop(x0: number, y0: number, W: number, d: number): SkPath {
  const p = make();
  p.moveTo(x0 + 30, y0 + d);
  p.cubicTo(x0 + 4, y0 + d, x0 + 4, y0 + 18, x0 + 60, y0 + 8);
  p.cubicTo(x0 + W * 0.3, y0 - 2, x0 + W * 0.7, y0 - 2, x0 + W - 60, y0 + 8);
  p.cubicTo(x0 + W - 4, y0 + 18, x0 + W - 4, y0 + d, x0 + W - 30, y0 + d);
  p.close();
  return p;
}

/* ── between the instrument and the amp ──────────────────────────────── */

/** A pedalboard of three compact pedals, from the audience side (signal left → right). */
function PedalsIcon({ S }: { S: number }) {
  const BW = 320;
  const BH = 180;
  const k = fit(S, BW, BH, 1.04, 0.8);
  const pw = 64;
  const ph = 112;
  const xs = [-92, 0, 92];
  const finish = [
    ['#d0a64a', '#9a7428', '#5a4214'],
    ['#4f8f8a', '#2c5e5a', '#163331'],
    ['#9c3b34', '#6a211c', '#3a110e'],
  ] as const;
  const hw = 0.5 / k;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={-BW / 2 + 6} y={BH / 2 - 14} w={BW - 12} h={22} k={k} />
      {/* The board: an aluminium frame with slats. */}
      <Path path={rr(-BW / 2, -BH / 2, BW, BH, 10)}>
        <LinearGradient start={vec(-BW / 2, -BH / 2)} end={vec(BW / 2, BH / 2)} colors={['#5a5e68', '#33363e', '#1a1c21']} />
      </Path>
      {[-40, 10, 60].map((y) => (
        <Path key={y} path={rr(-BW / 2 + 8, y - 4, BW - 16, 6, 3)} color="#0c0d10" opacity={0.8} />
      ))}
      <Path path={rr(-BW / 2, -BH / 2, BW, BH, 10)} style="stroke" strokeWidth={hw} color="#8a8f99" />
      {/* Right-angle patch cables, out of one pedal's right side into the next one's left. */}
      {[0, 1].map((i) => {
        const a = xs[i] + pw / 2;
        const b2 = xs[i + 1] - pw / 2;
        const y = 22;
        const c = make();
        c.moveTo(a + 6, y);
        c.cubicTo(a + 14, y + 26, b2 - 14, y + 26, b2 - 6, y);
        return (
          <Group key={i}>
            <Path path={c} style="stroke" strokeWidth={6} strokeCap="round" color="#121316" />
            <Path path={rr(a, y - 8, 10, 16, 3)} color="#2a2c32" />
            <Path path={rr(b2 - 10, y - 8, 10, 16, 3)} color="#2a2c32" />
          </Group>
        );
      })}
      {xs.map((x, i) => {
        const y0 = -ph / 2;
        return (
          <Group key={x}>
            <Path path={rr(x - pw / 2 + 3, y0 + 6, pw, ph, 7)} color="#000" opacity={0.5} />
            <Path path={rr(x - pw / 2, y0, pw, ph, 7)}>
              <LinearGradient start={vec(x - pw / 2, y0)} end={vec(x + pw / 2, y0 + ph)} colors={[...finish[i]]} />
            </Path>
            <Path path={rr(x - pw / 2, y0, pw, ph, 7)} style="stroke" strokeWidth={hw} color={INK} />
            {/* Footswitch (toward the player, the far side from the audience): hex nut and cap. */}
            <Circle cx={x} cy={y0 + 26} r={11}>
              <RadialGradient c={vec(x - 4, y0 + 22)} r={14} colors={[...CHROME]} />
            </Circle>
            <Circle cx={x} cy={y0 + 26} r={6.5} color="#d9dce3" />
            {/* LED between the switch and the knobs. */}
            <Circle cx={x} cy={y0 + 50} r={3.2} color={i === 1 ? '#ff4a3a' : '#5a1a14'} />
            {/* Two knobs at the end near the audience. */}
            {[-15, 15].map((dx) => (
              <Group key={dx}>
                <Circle cx={x + dx} cy={y0 + 84} r={9}>
                  <RadialGradient c={vec(x + dx - 3, y0 + 80)} r={12} colors={['#4b4e57', '#1b1c20', '#050506']} />
                </Circle>
                <Path path={poly([[x + dx, y0 + 84], [x + dx + 3, y0 + 76]], false)} style="stroke" strokeWidth={Math.max(1.6, 0.35 / k)} color="#eef0f4" />
              </Group>
            ))}
            {/* Side jacks (input left, output right as seen from the audience). */}
            <Path path={rr(x - pw / 2 - 5, y0 + 72, 6, 14, 2)} color="#8a8f99" />
            <Path path={rr(x + pw / 2 - 1, y0 + 72, 6, 14, 2)} color="#8a8f99" />
          </Group>
        );
      })}
    </Group>
  );
}

/** A steel guitar's volume pedal, from the side: base, treadle on its heel hinge, side jacks. */
function VolumeIcon({ S }: { S: number }) {
  const k = fit(S, 300, 140, 1.05, 0.8);
  const hw = 0.5 / k;
  // The treadle at mid travel: heel hinge at the left, the toe raised.
  const treadle = poly([[-128, -46], [132, -86], [136, -74], [-124, -36]]);
  const tread = make();
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + i * 0.1;
    const x = -128 + 260 * t;
    const y = -46 - 40 * t;
    tread.moveTo(x, y - 1);
    tread.lineTo(x + 3, y + 7);
  }
  return (
    <Group transform={[{ translateY: 0.32 * S }, { scale: k }]}>
      <Shadow x={-140} y={-10} w={280} h={18} k={k} />
      <Path path={rr(-140, -42, 280, 42, 8)}>
        <LinearGradient start={vec(0, -42)} end={vec(0, 0)} colors={[...STEEL]} />
      </Path>
      <Path path={rr(-140, -42, 280, 42, 8)} style="stroke" strokeWidth={hw} color={INK} />
      {/* Side jacks: input and output sockets in the base. */}
      {[-60, 20].map((x) => (
        <Group key={x}>
          <Circle cx={x} cy={-21} r={10} color="#141519" />
          <Circle cx={x} cy={-21} r={10} style="stroke" strokeWidth={Math.max(2, 0.4 / k)} color="#d9dce3" />
          <Circle cx={x} cy={-21} r={3.5} color="#000" />
        </Group>
      ))}
      {/* The heel hinge and the treadle with its rubber tread. */}
      <Circle cx={-126} cy={-42} r={9} color="#5a5e68" />
      <Path path={treadle}>
        <LinearGradient start={vec(0, -86)} end={vec(0, -36)} colors={['#3d4048', '#1d1e22', '#0f1012']} />
      </Path>
      <Path path={treadle} style="stroke" strokeWidth={hw} color="#7d828c" />
      <Path path={tread} style="stroke" strokeWidth={Math.max(3, 0.3 / k)} color="#4b4e57" />
    </Group>
  );
}

/** A passive DI box, three-quarter view: XLR out on the near end, input/thru plugs at the far end. */
function DiIcon({ S }: { S: number }) {
  // L 128 (along x), depth 92 (receding up-right at 30°, half scale), H 50.
  const L = 128;
  const H = 50;
  const dd = 92 * 0.5;
  const dx = dd * Math.cos(Math.PI / 6);
  const dy = -dd * Math.sin(Math.PI / 6);
  const plug = 60;
  const k = fit(S, L + dx + plug, H - dy, 1.05, 0.85);
  const x0 = -(L + dx + plug) / 2 + plug;
  const y0 = (H - dy) / 2;
  const F: P2[] = [[x0, y0], [x0 + L, y0], [x0 + L, y0 - H], [x0, y0 - H]];
  const T: P2[] = [[x0, y0 - H], [x0 + L, y0 - H], [x0 + L + dx, y0 - H + dy], [x0 + dx, y0 - H + dy]];
  const E: P2[] = [[x0 + L, y0], [x0 + L + dx, y0 + dy], [x0 + L + dx, y0 - H + dy], [x0 + L, y0 - H]];
  // The end face's own axes: along the depth (ax) and up (ay).
  const ax: P2 = [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)];
  const ay: P2 = [0, -1];
  const onEnd = (d: number, z: number): P2 => [x0 + L + d * 0.5 * ax[0], y0 + d * 0.5 * ax[1] - z];
  const xlr = onEnd(56, 25);
  const pins = [0, 1, 2].map((i) => {
    const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    return [xlr[0] + 5 * Math.cos(a) * ax[0] * 0.5, xlr[1] + 5 * Math.cos(a) * ax[1] * 0.5 - 5 * Math.sin(a)] as P2;
  });
  const lift = onEnd(18, 30);
  const hw = 0.5 / k;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 - 4} y={y0 - 8} w={L + dx + 6} h={14} k={k} />
      {/* Two cables plugged in at the far end: the input and the thru. */}
      {[14, 34].map((z, i) => (
        <Group key={z}>
          <Path path={poly([[x0 - plug + 6, y0 - z + 4 + i * 2], [x0 - 26, y0 - z]], false)} style="stroke" strokeWidth={7} strokeCap="round" color={CABLE} />
          <Path path={rr(x0 - 30, y0 - z - 6, 30, 12, 4)}>
            <LinearGradient start={vec(0, y0 - z - 6)} end={vec(0, y0 - z + 6)} colors={['#4b4e57', '#1b1c20', '#050506']} />
          </Path>
        </Group>
      ))}
      <Path path={poly(F)}>
        <LinearGradient start={vec(x0, y0 - H)} end={vec(x0, y0)} colors={['#4f7fb0', '#2f5a86', '#1a3452']} />
      </Path>
      <Path path={poly(T)}>
        <LinearGradient start={vec(x0, y0 - H + dy)} end={vec(x0 + L, y0 - H)} colors={['#86b0da', '#5584b4', '#36618e']} />
      </Path>
      <Path path={poly(E)}>
        <LinearGradient start={vec(x0 + L, 0)} end={vec(x0 + L + dx, 0)} colors={[...STEEL]} />
      </Path>
      {[F, T, E].map((q, i) => (
        <Path key={i} path={poly(q)} style="stroke" strokeWidth={hw} color={INK} />
      ))}
      {/* XLR male output: shell, insert, three pins; the ground-lift switch above it. */}
      <Path path={ovalOn(xlr, 13, [ax[0] * 0.5 * 2, ax[1] * 0.5 * 2], ay)} color="#2a2c32" />
      <Path path={ovalOn(xlr, 13, [ax[0] * 0.5 * 2, ax[1] * 0.5 * 2], ay)} style="stroke" strokeWidth={Math.max(1.4, 0.3 / k)} color="#d9dce3" />
      <Path path={ovalOn(xlr, 9, [ax[0] * 0.5 * 2, ax[1] * 0.5 * 2], ay)} color="#121316" />
      {pins.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.8} color="#e8d9a8" />
      ))}
      <Path path={poly([[lift[0] - 4, lift[1] + 2], [lift[0] + 6, lift[1] - 4], [lift[0] + 6, lift[1] + 2], [lift[0] - 4, lift[1] + 8]])} color="#121316" />
      {/* The top's corner screws. */}
      {[[x0 + 10, y0 - H - 3], [x0 + L - 8, y0 - H - 3], [x0 + dx + 8, y0 - H + dy + 4], [x0 + L + dx - 10, y0 - H + dy + 4]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.4} color="#c8ccd4" />
      ))}
    </Group>
  );
}

/** The amp's own direct output: a strip of its rear panel, XLR male line out, ground lift, ¼ in jack. */
function AmpOutIcon({ S, aux }: { S: number; aux: boolean }) {
  const W = aux ? 110 : 150;
  const Hh = 70;
  const k = fit(S, W, Hh, 0.95, 0.75);
  const hw = 0.5 / k;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={-W / 2 + 4} y={Hh / 2 - 8} w={W - 8} h={14} k={k} />
      <Path path={rr(-W / 2, -Hh / 2, W, Hh, 6)}>
        <LinearGradient start={vec(-W / 2, -Hh / 2)} end={vec(W / 2, Hh / 2)} colors={aux ? ['#5e2a20', '#3e1a14', '#1e0c08'] : ['#4b4e57', '#26282e', '#121316']} />
      </Path>
      <Path path={rr(-W / 2, -Hh / 2, W, Hh, 6)} style="stroke" strokeWidth={hw} color="#7d828c" />
      {[[-W / 2 + 8, -Hh / 2 + 8], [W / 2 - 8, -Hh / 2 + 8], [-W / 2 + 8, Hh / 2 - 8], [W / 2 - 8, Hh / 2 - 8]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.6} color="#9aa0ab" />
      ))}
      {/* ¼ in jack: hex nut, socket. */}
      <Group transform={[{ translateX: aux ? 0 : -42 }]}>
        <Path path={poly(Array.from({ length: 6 }, (_, i) => [13 * Math.cos((i * Math.PI) / 3), 13 * Math.sin((i * Math.PI) / 3)] as P2))}>
          <LinearGradient start={vec(-13, -13)} end={vec(13, 13)} colors={[...CHROME]} />
        </Path>
        <Circle cx={0} cy={0} r={6.5} color="#050506" />
      </Group>
      {!aux ? (
        <>
          {/* The ground-lift slide switch above, between the jack and the XLR. */}
          <Path path={rr(-20, -Hh / 2 + 6, 16, 8, 2)} color="#050506" />
          <Path path={rr(-20, -Hh / 2 + 6, 7, 8, 2)} color="#c8ccd4" />
        </>
      ) : null}
      {!aux ? (
        <Group transform={[{ translateX: 22 }]}>
          {/* XLR male: the round shell with its latch slot, three pins. */}
          <Circle cx={0} cy={0} r={22} color="#141519" />
          <Circle cx={0} cy={0} r={22} style="stroke" strokeWidth={Math.max(2.4, 0.4 / k)} color="#d9dce3" />
          <Circle cx={0} cy={0} r={15} color="#2a2c32" />
          {[0, 1, 2].map((i) => {
            const a = (i * 2 * Math.PI) / 3 + Math.PI / 6 + Math.PI;
            return <Circle key={i} cx={8 * Math.cos(a)} cy={8 * Math.sin(a)} r={2.4} color="#e8d9a8" />;
          })}
          <Path path={rr(-4, -22, 8, 6, 2)} color="#050506" />
        </Group>
      ) : null}
    </Group>
  );
}

/* ── amps and speakers ───────────────────────────────────────────────── */

/** The 1 × 12 combo from the front (the lesson's own proportions). */
function ComboIcon({ S }: { S: number }) {
  const W = 622;
  const H = 445;
  const k = fit(S, W, H + 26, 1.0, 0.92);
  const x0 = -W / 2;
  const y0 = -(H - 26) / 2;
  const panel = 90;
  const hw = 0.5 / k;
  const knobs = Array.from({ length: 9 }, (_, i) => x0 + 150 + (i * (W - 230)) / 8);
  const gx = x0 + 22;
  const gy = y0 + panel + 10;
  const gw = W - 44;
  const gh = H - panel - 32;
  const weave = make();
  for (let x = gx - gh; x < gx + gw; x += 9) {
    weave.moveTo(x, gy + gh);
    weave.lineTo(x + gh, gy);
  }
  const spk = { x: 60, y: y0 + 255 };
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={y0 + H - 16} w={W - 20} h={26} k={k} />
      {/* The strap handle on the top, its chrome end caps. */}
      <Path path={rr(-90, y0 - 24, 180, 22, 10)}>
        <LinearGradient start={vec(0, y0 - 24)} end={vec(0, y0 - 2)} colors={['#3a3b41', '#16171a', '#050506']} />
      </Path>
      {[-96, 78].map((x) => (
        <Path key={x} path={rr(x, y0 - 12, 18, 12, 3)} color="#b4b9c3" />
      ))}
      {/* The cabinet in black covering. */}
      <Path path={rr(x0, y0, W, H, 12)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + H)} colors={[...TOLEX]} />
      </Path>
      <Path path={rr(x0, y0, W, H, 12)} style="stroke" strokeWidth={hw} color="#5a5c64" />
      {/* The control panel: a chrome plate, two inputs, nine knobs, the pilot lamp. */}
      <Path path={rr(x0 + 14, y0 + 12, W - 28, panel - 18, 6)}>
        <LinearGradient start={vec(0, y0 + 12)} end={vec(0, y0 + panel - 6)} colors={['#f2f4f8', '#b4b9c3', '#6a6f7a']} />
      </Path>
      {[0, 1].map((i) => (
        <Circle key={i} cx={x0 + 55 + i * 40} cy={y0 + 50} r={10} color="#141518" />
      ))}
      {knobs.map((x) => (
        <Group key={x}>
          <Circle cx={x} cy={y0 + 49} r={14}>
            <RadialGradient c={vec(x - 5, y0 + 43)} r={20} colors={['#4b4e57', '#1b1c20', '#050506']} />
          </Circle>
          <Path path={poly([[x, y0 + 49], [x - 6, y0 + 38]], false)} style="stroke" strokeWidth={Math.max(2.4, 0.3 / k)} color="#e1e4ea" />
        </Group>
      ))}
      <Circle cx={x0 + W - 45} cy={y0 + 49} r={11}>
        <RadialGradient c={vec(x0 + W - 48, y0 + 45)} r={14} colors={['#ffd9a0', '#d0602a', '#5a1a08']} />
      </Circle>
      {/* The grille cloth (a fine weave), the speaker's shadow behind it, silver piping. */}
      <Path path={rr(gx, gy, gw, gh, 6)}>
        <LinearGradient start={vec(gx, gy)} end={vec(gx + gw, gy + gh)} colors={['#4a4b50', '#2e2f33', '#1c1d20']} />
      </Path>
      <Group clip={rr(gx, gy, gw, gh, 6)}>
        <Path path={weave} style="stroke" strokeWidth={Math.max(1.2, 0.22 / k)} color="#6a6c72" opacity={0.45} />
        <Circle cx={spk.x} cy={spk.y} r={152} color="#000" opacity={0.3} />
        <Circle cx={spk.x} cy={spk.y} r={50} color="#000" opacity={0.18} />
      </Group>
      <Path path={rr(gx, gy, gw, gh, 6)} style="stroke" strokeWidth={Math.max(4, 0.5 / k)} color="#c8ccd4" opacity={0.75} />
    </Group>
  );
}

/** The compact bass head, three-quarter view: a brushed front panel with its
 *  knobs, input and power switch; vents and a strap handle on top. */
function HeadIcon({ S }: { S: number }) {
  const W = 330;
  const H = 75;
  const dd = 250 * 0.45;
  const dx = dd * Math.cos(Math.PI / 6);
  const dy = -dd * Math.sin(Math.PI / 6);
  const k = fit(S, W + dx, H - dy + 14, 1.0, 0.85);
  const x0 = -(W + dx) / 2;
  const y0 = (H - dy + 14) / 2 - 7;
  const F: P2[] = [[x0, y0], [x0 + W, y0], [x0 + W, y0 - H], [x0, y0 - H]];
  const T: P2[] = [[x0, y0 - H], [x0 + W, y0 - H], [x0 + W + dx, y0 - H + dy], [x0 + dx, y0 - H + dy]];
  const E: P2[] = [[x0 + W, y0], [x0 + W + dx, y0 + dy], [x0 + W + dx, y0 - H + dy], [x0 + W, y0 - H]];
  const hw = 0.5 / k;
  const on = (u: number, t: number): P2 => [x0 + W * u + dx * t, y0 - H + dy * t];
  const vents = make();
  for (let i = 0; i < 9; i++) {
    const [ax, ay] = on(0.2 + i * 0.035, 0.3);
    const [bx, by] = on(0.2 + i * 0.035, 0.75);
    vents.moveTo(ax, ay);
    vents.lineTo(bx, by);
  }
  const strap = make();
  const [h0x, h0y] = on(0.62, 0.5);
  const [h1x, h1y] = on(0.86, 0.5);
  strap.moveTo(h0x, h0y);
  strap.cubicTo(h0x + 10, h0y - 16, h1x - 10, h1y - 16, h1x, h1y);
  const panel = rr(x0 + 6, y0 - H + 7, W - 12, H - 14, 4);
  const cy = y0 - H / 2;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0} y={y0 - 10} w={W + dx * 0.6} h={18} k={k} />
      <Path path={poly(T)}>
        <LinearGradient start={vec(x0, y0 - H + dy)} end={vec(x0 + W, y0 - H)} colors={['#4b4e57', '#2a2c32', '#16171b']} />
      </Path>
      <Path path={vents} style="stroke" strokeWidth={Math.max(5, 0.4 / k)} strokeCap="round" color="#0b0b0d" />
      <Path path={poly(E)}>
        <LinearGradient start={vec(x0 + W, 0)} end={vec(x0 + W + dx, 0)} colors={['#2a2b30', '#16171a', '#0b0b0d']} />
      </Path>
      <Path path={poly(F)} color="#121316" />
      {[F, T, E].map((q, i) => (
        <Path key={i} path={poly(q)} style="stroke" strokeWidth={hw} color="#55585f" />
      ))}
      {/* The strap handle on its two brackets. */}
      <Path path={strap} style="stroke" strokeWidth={9} strokeCap="round" color="#0b0b0d" />
      <Path path={strap} style="stroke" strokeWidth={5} strokeCap="round" color="#2e3036" />
      {/* The brushed front panel: input jack, seven knobs with skirts, the power rocker and its lamp. */}
      <Path path={panel}>
        <LinearGradient start={vec(0, y0 - H + 7)} end={vec(0, y0 - 7)} colors={['#e6e9ee', '#b4b9c3', '#7d828c']} />
      </Path>
      <Path path={panel} style="stroke" strokeWidth={hw} color={INK} />
      <Circle cx={x0 + 26} cy={cy} r={8.5} color="#0b0b0d" />
      <Circle cx={x0 + 26} cy={cy} r={8.5} style="stroke" strokeWidth={Math.max(2, 0.3 / k)} color="#f4f6fa" />
      {Array.from({ length: 7 }, (_, i) => x0 + 62 + i * 31).map((x) => (
        <Group key={x}>
          <Circle cx={x} cy={cy + 1.5} r={12} color="#000" opacity={0.35} />
          <Circle cx={x} cy={cy} r={11.5}>
            <RadialGradient c={vec(x - 4, cy - 4)} r={15} colors={['#4b4e57', '#1b1c20', '#050506']} />
          </Circle>
          <Path path={poly([[x, cy], [x - 5, cy - 9]], false)} style="stroke" strokeWidth={Math.max(2, 0.3 / k)} color="#f4f6fa" />
        </Group>
      ))}
      <Path path={rr(x0 + W - 52, cy - 12, 16, 24, 3)} color="#0b0b0d" />
      <Path path={rr(x0 + W - 50, cy - 10, 12, 10, 2)} color="#3a3d45" />
      <Circle cx={x0 + W - 22} cy={cy} r={4.5} color="#ff5a48" />
    </Group>
  );
}

/** A guitar valve amp head from the front: 600 × 250; the vent grille across
 *  the top of the front, the control panel below it (two inputs, eight knobs,
 *  standby and power toggles, the pilot jewel), a strap handle on top. */
function GuitarHeadIcon({ S }: { S: number }) {
  const W = 600;
  const H = 250;
  const k = fit(S, W, H + 24, 1.0, 0.8);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -(H - 24) / 2;
  const grille = rr(x0 + 18, y0 + 16, W - 36, 96, 5);
  const weave = make();
  for (let x = x0 + 18 - 96; x < x0 + W - 18; x += 9) {
    weave.moveTo(x, y0 + 112);
    weave.lineTo(x + 96, y0 + 16);
  }
  const panelY = y0 + 128;
  const knobs = Array.from({ length: 8 }, (_, i) => x0 + 150 + i * 44);
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={y0 + H - 14} w={W - 20} h={22} k={k} />
      <Path path={rr(-80, y0 - 22, 160, 20, 9)}>
        <LinearGradient start={vec(0, y0 - 22)} end={vec(0, y0 - 2)} colors={['#3a3b41', '#16171a', '#050506']} />
      </Path>
      <Path path={rr(x0, y0, W, H, 12)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + H)} colors={[...TOLEX]} />
      </Path>
      <Path path={rr(x0, y0, W, H, 12)} style="stroke" strokeWidth={hw} color="#5a5c64" />
      <Path path={grille}>
        <LinearGradient start={vec(0, y0 + 16)} end={vec(0, y0 + 112)} colors={['#4a4b50', '#2e2f33', '#1c1d20']} />
      </Path>
      <Group clip={grille}>
        <Path path={weave} style="stroke" strokeWidth={Math.max(1.2, 0.22 / k)} color="#6a6c72" opacity={0.45} />
      </Group>
      <Path path={grille} style="stroke" strokeWidth={Math.max(4, 0.5 / k)} color="#c8ccd4" opacity={0.7} />
      {/* The control panel. */}
      <Path path={rr(x0 + 18, panelY, W - 36, 96, 5)}>
        <LinearGradient start={vec(0, panelY)} end={vec(0, panelY + 96)} colors={['#e9dcb0', '#c2ad72', '#8a7642']} />
      </Path>
      {[0, 1].map((i) => (
        <Group key={i}>
          <Circle cx={x0 + 52 + i * 44} cy={panelY + 48} r={13} color="#141518" />
          <Circle cx={x0 + 52 + i * 44} cy={panelY + 48} r={5} color="#000" />
        </Group>
      ))}
      {knobs.map((x) => (
        <Group key={x}>
          <Circle cx={x} cy={panelY + 48} r={16}>
            <RadialGradient c={vec(x - 5, panelY + 42)} r={22} colors={['#4b4e57', '#1b1c20', '#050506']} />
          </Circle>
          <Path path={poly([[x, panelY + 48], [x - 7, panelY + 35]], false)} style="stroke" strokeWidth={Math.max(2.4, 0.3 / k)} color="#e1e4ea" />
        </Group>
      ))}
      {[x0 + W - 104, x0 + W - 74].map((x) => (
        <Path key={x} path={rr(x - 4, panelY + 30, 8, 22, 3)} color="#d9dce3" />
      ))}
      <Circle cx={x0 + W - 40} cy={panelY + 48} r={12}>
        <RadialGradient c={vec(x0 + W - 44, panelY + 44)} r={16} colors={['#ffd9a0', '#d0602a', '#5a1a08']} />
      </Circle>
    </Group>
  );
}

/** A closed-back 1 × 12 cabinet from the front: 500 × 470, grille cloth with
 *  the speaker (frame Ø 309) behind it at the centre, piping, metal corners. */
function Cab112Icon({ S }: { S: number }) {
  const W = 500;
  const H = 470;
  const k = fit(S, W, H + 22, 0.96, 0.96);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -(H - 22) / 2;
  const gx = x0 + 24;
  const gy = y0 + 24;
  const gw = W - 48;
  const gh = H - 48;
  const weave = make();
  for (let x = gx - gh; x < gx + gw; x += 9) {
    weave.moveTo(x, gy + gh);
    weave.lineTo(x + gh, gy);
  }
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={y0 + H - 16} w={W - 20} h={26} k={k} />
      <Path path={rr(-80, y0 - 22, 160, 20, 9)}>
        <LinearGradient start={vec(0, y0 - 22)} end={vec(0, y0 - 2)} colors={['#3a3b41', '#16171a', '#050506']} />
      </Path>
      <Path path={rr(x0, y0, W, H, 12)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + H)} colors={[...TOLEX]} />
      </Path>
      <Path path={rr(gx, gy, gw, gh, 6)}>
        <LinearGradient start={vec(gx, gy)} end={vec(gx + gw, gy + gh)} colors={['#4a4b50', '#2e2f33', '#1c1d20']} />
      </Path>
      <Group clip={rr(gx, gy, gw, gh, 6)}>
        <Path path={weave} style="stroke" strokeWidth={Math.max(1.2, 0.22 / k)} color="#6a6c72" opacity={0.45} />
        <Circle cx={0} cy={y0 + H / 2} r={154} color="#000" opacity={0.3} />
        <Circle cx={0} cy={y0 + H / 2} r={50} color="#000" opacity={0.18} />
      </Group>
      <Path path={rr(gx, gy, gw, gh, 6)} style="stroke" strokeWidth={Math.max(4, 0.5 / k)} color="#c8ccd4" opacity={0.75} />
      <Path path={rr(x0, y0, W, H, 12)} style="stroke" strokeWidth={hw} color="#5a5c64" />
      {[[x0, y0, 1, 1], [x0 + W, y0, -1, 1], [x0, y0 + H, 1, -1], [x0 + W, y0 + H, -1, -1]].map(([x, y, sx, sy], i) => (
        <Path key={i} path={poly([[x, y], [x + sx * 44, y], [x + sx * 44, y + sy * 14], [x + sx * 14, y + sy * 14], [x + sx * 14, y + sy * 44], [x, y + sy * 44]])}>
          <LinearGradient start={vec(x, y)} end={vec(x + sx * 44, y + sy * 44)} colors={[...CHROME]} />
        </Path>
      ))}
    </Group>
  );
}

/** A 12 in guitar speaker, front: steel frame with its holes, cone, surround, dust cap, terminals. */
function Speaker12Icon({ S }: { S: number }) {
  const R = 309 / 2;
  const k = fit(S, 2 * R + 24, 2 * R + 24, 0.98, 0.98);
  const rCone = 283 / 2;
  const rIn = rCone - 13;
  const hw = 0.5 / k;
  const ribs = make();
  for (let r = 70; r < rIn - 6; r += 16) ribs.addCircle(0, 0, r);
  return (
    <Group transform={[{ scale: k }]}>
      <Circle cx={6} cy={10} r={R} color="#000" opacity={0.45}>
        <BlurMask blur={3 / k} style="normal" />
      </Circle>
      {/* The stamped steel frame: its flange, 4 mounting holes on the 297 circle. */}
      <Circle cx={0} cy={0} r={R}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={['#6a6f7a', '#3a3d45', '#16171b']} />
      </Circle>
      <Circle cx={0} cy={0} r={R} style="stroke" strokeWidth={hw} color={INK} />
      {[45, 135, 225, 315].map((a) => {
        const t = (a * Math.PI) / 180;
        return <Circle key={a} cx={148.5 * Math.cos(t)} cy={148.5 * Math.sin(t)} r={5} color="#050506" />;
      })}
      {/* The gasket ring, then the surround (a roll) and the paper cone. */}
      <Circle cx={0} cy={0} r={rCone + 2} color="#1b1714" />
      <Circle cx={0} cy={0} r={rCone}>
        <RadialGradient c={vec(-30, -36)} r={rCone * 1.2} colors={['#5a4e44', '#3a322b', '#1f1a16']} />
      </Circle>
      <Circle cx={0} cy={0} r={rIn + 5} style="stroke" strokeWidth={9} color="#6b5d50" opacity={0.6} />
      <Circle cx={0} cy={0} r={rIn}>
        <RadialGradient c={vec(-36, -40)} r={rIn * 1.15} colors={['#4d433a', '#2e2721', '#171310']} />
      </Circle>
      <Path path={ribs} style="stroke" strokeWidth={Math.max(1.2, 0.18 / k)} color="#000" opacity={0.35} />
      {/* The dust cap: a dome lit from the upper left. */}
      <Circle cx={0} cy={0} r={50}>
        <RadialGradient c={vec(-16, -18)} r={62} colors={['#7a6f64', '#3b342e', '#1d1916']} />
      </Circle>
      <Circle cx={0} cy={0} r={50} style="stroke" strokeWidth={hw} color="#0b0908" />
      {/* The two terminals on the frame's edge, toward the speaker cable (left), and their leads. */}
      {[-14, 14].map((d) => (
        <Path key={d} path={rr(-R - 2, d - 6, 18, 12, 2)} color="#c9a24a" />
      ))}
      <Path path={poly([[-R - 2, -14], [-R - 16, -6]], false)} style="stroke" strokeWidth={4} color="#c0392b" />
      <Path path={poly([[-R - 2, 14], [-R - 16, 6]], false)} style="stroke" strokeWidth={4} color="#111" />
    </Group>
  );
}

/** A 4 × 10 + horn bass cabinet from the front (the lesson's own model). */
function BassCabIcon({ S }: { S: number }) {
  const W = 762;
  const H = 610;
  const k = fit(S, W, H, 0.98, 0.92);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -H / 2;
  const r10 = 257 / 2; // 10 in frame
  const mesh = make();
  for (let x = x0 + 30; x < x0 + W - 30; x += 14) for (let y = y0 + 30; y < y0 + H - 30; y += 14) mesh.addCircle(x + ((y / 14) % 2) * 7, y, 3.2);
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={y0 + H - 16} w={W - 20} h={26} k={k} />
      <Path path={rr(x0, y0, W, H, 10)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + H)} colors={[...TOLEX]} />
      </Path>
      {/* The speakers seen through the steel grille: 4 × 10 in and the horn. */}
      {[[-170, -150], [170, -150], [-170, 150], [170, 150]].map(([x, y]) => (
        <Group key={`${x}${y}`}>
          <Circle cx={x} cy={y} r={r10} color="#1a1715" />
          <Circle cx={x} cy={y} r={r10 - 10}>
            <RadialGradient c={vec(x - 26, y - 30)} r={r10 * 1.1} colors={['#4d433a', '#2e2721', '#171310']} />
          </Circle>
          <Circle cx={x} cy={y} r={40}>
            <RadialGradient c={vec(x - 12, y - 14)} r={50} colors={['#7a6f64', '#3b342e', '#1d1916']} />
          </Circle>
        </Group>
      ))}
      <Path path={rr(-33, -150 - 33, 66, 66, 4)} color="#0b0b0d" />
      <Path path={poly([[-33, -183], [-10, -160], [10, -160], [33, -183]], false)} style="stroke" strokeWidth={4} color="#3a3d45" />
      <Path path={poly([[-33, -117], [-10, -140], [10, -140], [33, -117]], false)} style="stroke" strokeWidth={4} color="#3a3d45" />
      <Path path={rr(x0 + 24, y0 + 24, W - 48, H - 48, 4)} color="#2a2c32" opacity={0.35} />
      <Path path={mesh} color="#0b0b0d" opacity={0.25} />
      <Path path={rr(x0 + 24, y0 + 24, W - 48, H - 48, 4)} style="stroke" strokeWidth={Math.max(8, 0.6 / k)} color="#4b4e57" />
      <Path path={rr(x0, y0, W, H, 10)} style="stroke" strokeWidth={hw} color="#5a5c64" />
      {/* Metal corners. */}
      {[[x0, y0, 1, 1], [x0 + W, y0, -1, 1], [x0, y0 + H, 1, -1], [x0 + W, y0 + H, -1, -1]].map(([x, y, sx, sy], i) => (
        <Path key={i} path={poly([[x, y], [x + sx * 60, y], [x + sx * 60, y + sy * 18], [x + sx * 18, y + sy * 18], [x + sx * 18, y + sy * 60], [x, y + sy * 60]])}>
          <LinearGradient start={vec(x, y)} end={vec(x + sx * 60, y + sy * 60)} colors={[...CHROME]} />
        </Path>
      ))}
    </Group>
  );
}

/** The reed piano's built-in amplifier: chassis plate, board, heat sink, transistors, capacitors, transformer. */
function WurliAmpIcon({ S }: { S: number }) {
  const W = 280;
  const H = 150;
  const k = fit(S, W, H, 1.0, 0.8);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -H / 2;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 6} y={y0 + H - 10} w={W - 12} h={18} k={k} />
      <Path path={rr(x0, y0, W, H, 4)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + H)} colors={[...STEEL]} />
      </Path>
      <Path path={rr(x0, y0, W, H, 4)} style="stroke" strokeWidth={hw} color={INK} />
      {/* The board. */}
      <Path path={rr(x0 + 14, y0 + 40, 200, 96, 3)}>
        <LinearGradient start={vec(x0, y0 + 40)} end={vec(x0 + 200, y0 + 136)} colors={['#3f7a50', '#285a38', '#163a22']} />
      </Path>
      {/* Resistors in rows. */}
      {Array.from({ length: 10 }, (_, i) => (
        <Path key={i} path={rr(x0 + 26 + (i % 5) * 26, y0 + 54 + Math.floor(i / 5) * 22, 16, 6, 3)} color="#d9c49a" />
      ))}
      {/* Electrolytic capacitors (cans from above). */}
      {[[x0 + 170, y0 + 64, 14], [x0 + 192, y0 + 64, 10], [x0 + 176, y0 + 104, 18]].map(([x, y, r], i) => (
        <Group key={i}>
          <Circle cx={x} cy={y} r={r}>
            <RadialGradient c={vec(x - r * 0.4, y - r * 0.4)} r={r * 1.4} colors={['#5a7ab0', '#2c4a7a', '#14243e']} />
          </Circle>
          <Path path={poly([[x - r * 0.5, y], [x + r * 0.5, y]], false)} style="stroke" strokeWidth={1.6} color="#c8ccd4" />
          <Path path={poly([[x, y - r * 0.5], [x, y + r * 0.5]], false)} style="stroke" strokeWidth={1.6} color="#c8ccd4" />
        </Group>
      ))}
      {/* The heat sink along the top edge, fins, two power transistors. */}
      <Path path={rr(x0 + 14, y0 + 8, 200, 26, 2)}>
        <LinearGradient start={vec(0, y0 + 8)} end={vec(0, y0 + 34)} colors={[...CHROME]} />
      </Path>
      {Array.from({ length: 12 }, (_, i) => (
        <Path key={i} path={poly([[x0 + 22 + i * 16, y0 + 8], [x0 + 22 + i * 16, y0 + 34]], false)} style="stroke" strokeWidth={Math.max(2, 0.3 / k)} color="#5a5e68" />
      ))}
      {[x0 + 70, x0 + 150].map((x) => (
        <Path key={x} path={oval(x, y0 + 21, 20, 11)}>
          <LinearGradient start={vec(x - 20, y0 + 10)} end={vec(x + 20, y0 + 32)} colors={['#e0e3e8', '#9aa0ab', '#4a4e57']} />
        </Path>
      ))}
      {/* The output transformer: laminations and its windings. */}
      <Path path={rr(x0 + 226, y0 + 46, 44, 64, 3)}>
        <LinearGradient start={vec(x0 + 226, 0)} end={vec(x0 + 270, 0)} colors={['#5a5e68', '#3a3d45', '#1a1c21']} />
      </Path>
      <Path path={rr(x0 + 232, y0 + 62, 32, 32, 3)} color="#b0763a" />
    </Group>
  );
}

/** The reed piano's lid from the player, a little above: its moulded top,
 *  then the front slope with two slotted grilles, the oval speakers behind. */
function WurliLidIcon({ S }: { S: number }) {
  const W = 1000;
  const top = 300 * 0.42; // the lid's top, foreshortened
  const H = 150;
  const k = fit(S, W, top + H, 1.04, 0.72);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -(top + H) / 2;
  const ys = y0 + top; // where the top meets the front slope
  const lidTop = make();
  lidTop.moveTo(x0 + 20, ys);
  lidTop.cubicTo(x0 - 4, ys, x0 + 6, y0 + 20, x0 + 70, y0 + 8);
  lidTop.cubicTo(x0 + W * 0.3, y0 - 2, x0 + W * 0.7, y0 - 2, x0 + W - 70, y0 + 8);
  lidTop.cubicTo(x0 + W - 6, y0 + 20, x0 + W + 4, ys, x0 + W - 20, ys);
  lidTop.close();
  const slope = make();
  slope.moveTo(x0 + 20, ys);
  slope.lineTo(x0 + W - 20, ys);
  slope.cubicTo(x0 + W + 2, ys + 10, x0 + W + 2, ys + H - 10, x0 + W - 12, ys + H);
  slope.lineTo(x0 + 12, ys + H);
  slope.cubicTo(x0 - 2, ys + H - 10, x0 - 2, ys + 10, x0 + 20, ys);
  slope.close();
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 10} y={ys + H - 14} w={W - 20} h={22} k={k} />
      <Path path={lidTop}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, ys)} colors={['#c0684f', '#8e4636', '#5a281c']} />
      </Path>
      <Path path={lidTop} style="stroke" strokeWidth={hw} color="#c27a62" opacity={0.7} />
      <Path path={slope}>
        <LinearGradient start={vec(0, ys)} end={vec(0, ys + H)} colors={['#a85540', '#7a3a2a', '#3e1a12']} />
      </Path>
      <Path path={slope} style="stroke" strokeWidth={hw} color={INK} />
      {[-1, 1].map((sd) => {
        const cx = sd * 300;
        const cy = ys + H * 0.52;
        return (
          <Group key={sd}>
            {/* The oval speaker (4 × 8 in) seen through its grille. */}
            <Path path={oval(cx, cy, 104, 50)} color="#140806" />
            <Path path={oval(cx, cy, 92, 40)}>
              <RadialGradient c={vec(cx - 26, cy - 14)} r={100} colors={['#4d433a', '#2e2721', '#171310']} />
            </Path>
            <Path path={oval(cx, cy, 22, 16)} color="#3b342e" />
            {/* The slotted grille moulded in the slope. */}
            {Array.from({ length: 9 }, (_, i) => cx - 88 + i * 22).map((x) => (
              <Path key={x} path={rr(x - 5, cy - 50, 10, 100, 5)} color="#7a3a2a" />
            ))}
          </Group>
        );
      })}
    </Group>
  );
}

/* ── the mic and the desk ────────────────────────────────────────────── */

/** An instrument dynamic on a short stand, side view, aimed LEFT at the speaker. */
function MicIcon({ S }: { S: number }) {
  // Grille Ø 32 (front 42 long), body tapering to Ø 25, 157 overall; XLR plug Ø 19 × 50 and its boot.
  // Set right of centre so the air arcs in front of it stay clear of the grille.
  const total = 157 + 70;
  const k = fit(S, total, total, 0.86, 1.0);
  const hw = 0.5 / k;
  const xF = (0.5 * S) / k - total; // the grille's front face (the plug's boot ends at the box's right edge)
  const yA = 0; // the mic's axis, level with the cable to the desk
  const body = make();
  body.moveTo(xF + 46, yA - 15.5);
  body.cubicTo(xF + 80, yA - 14.5, xF + 110, yA - 12.5, xF + 157, yA - 12.5);
  body.lineTo(xF + 157, yA + 12.5);
  body.cubicTo(xF + 110, yA + 12.5, xF + 80, yA + 14.5, xF + 46, yA + 15.5);
  body.close();
  const grille = rr(xF, yA - 16, 44, 32, 7);
  const mesh = make();
  for (let x = xF + 5; x < xF + 42; x += 4.5) {
    mesh.moveTo(x, yA - 15);
    mesh.lineTo(x, yA + 15);
  }
  for (let y = yA - 12; y < yA + 14; y += 4.5) {
    mesh.moveTo(xF + 2, y);
    mesh.lineTo(xF + 42, y);
  }
  // The cable plug in the tail, its boot, the cable down and out to the desk (right edge).
  const cable = make();
  cable.moveTo(xF + 216, yA);
  cable.lineTo(S / 2 / k + 1, 0);
  // The clip around the body and the stand below it.
  const cx = xF + 104;
  const floor = (0.5 * S) / k;
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={cx - 60} y={floor - 8} w={120} h={10} k={k} o={0.4} />
      {/* A short stand: tube, a low tripod base. */}
      <Path path={rr(cx - 5, yA + 26, 10, floor - yA - 34, 4)}>
        <LinearGradient start={vec(cx - 5, 0)} end={vec(cx + 5, 0)} colors={[...CHROME]} />
      </Path>
      <Path path={poly([[cx - 56, floor - 2], [cx, floor - 22], [cx + 56, floor - 2]], false)} style="stroke" strokeWidth={Math.max(7, 0.7 / k)} strokeCap="round" color="#2a2c32" />
      {/* The clip: a ring round the body with its swivel. */}
      <Path path={rr(cx - 16, yA - 17, 32, 34, 6)} color="#121316" />
      <Path path={rr(cx - 7, yA + 14, 14, 16, 3)} color="#1b1c20" />
      <Path path={cable} style="stroke" strokeWidth={3 / k} color={CABLE} />
      {/* The XLR cable plug: a chrome barrel, then the rubber boot. */}
      <Path path={rr(xF + 150, yA - 9.5, 50, 19, 4)}>
        <LinearGradient start={vec(0, yA - 9.5)} end={vec(0, yA + 9.5)} colors={[...CHROME]} />
      </Path>
      <Path path={poly([[xF + 200, yA - 8], [xF + 222, yA - 4], [xF + 222, yA + 4], [xF + 200, yA + 8]])} color="#121316" />
      {/* The body (dark satin), the band, the grille. */}
      <Path path={body}>
        <LinearGradient start={vec(0, yA - 15)} end={vec(0, yA + 15)} colors={['#5a5e68', '#22242a', '#0b0b0d']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={hw} color={INK} />
      <Path path={rr(xF + 41, yA - 16.5, 7, 33, 2)}>
        <LinearGradient start={vec(0, yA - 16.5)} end={vec(0, yA + 16.5)} colors={[...CHROME]} />
      </Path>
      <Path path={grille}>
        <LinearGradient start={vec(0, yA - 16)} end={vec(0, yA + 16)} colors={['#d0d4dc', '#8a909b', '#3a3d45']} />
      </Path>
      <Group clip={grille}>
        <Path path={mesh} style="stroke" strokeWidth={Math.max(0.9, 0.16 / k)} color="#2a2c32" opacity={0.55} />
      </Group>
      <Path path={grille} style="stroke" strokeWidth={hw} color={INK} />
    </Group>
  );
}

/** A compact 12-channel console from the mix position. */
function DeskIcon({ S }: { S: number }) {
  const W = 450;
  const D = 420 * 0.55; // the top, foreshortened
  const front = 36;
  const meter = 34;
  const k = fit(S, W, D + front + meter, 1.04, 0.85);
  const hw = 0.5 / k;
  const x0 = -W / 2;
  const y0 = -(D + front + meter) / 2 + meter;
  const strips = 12;
  const sw = 26;
  const sx0 = x0 + 16;
  const master = sx0 + strips * sw + 8;
  const knobRows = [16, 34, 50, 64, 78, 92, 108];
  const caps = ['#d84a3a', '#e9e6dd', '#5a8fd0', '#5a8fd0', '#58b06a', '#e0b84a', '#e9e6dd'];
  const items: ReactNode[] = [];
  for (let s = 0; s < strips; s++) {
    const cx = sx0 + s * sw + sw / 2;
    knobRows.forEach((ky, i) => items.push(<Circle key={`k${s}-${i}`} cx={cx} cy={y0 + ky * 0.55 * 1.6} r={5} color={caps[i]} />));
    items.push(<Path key={`m${s}`} path={rr(cx - 6, y0 + 126 * 0.55 * 1.6 - 4, 12, 7, 1.5)} color={s === 4 ? '#ffb14a' : '#c8ccd4'} />);
    items.push(<Path key={`sl${s}`} path={rr(cx - 1.5, y0 + 150 * 0.55 * 1.2, 3, 70 * 0.55 * 1.2, 1)} color="#050506" />);
    const fy = y0 + (150 + 20 + (s % 3) * 10) * 0.55 * 1.2;
    items.push(<Path key={`f${s}`} path={rr(cx - 7, fy, 14, 8, 2)} color="#d9dce3" />);
  }
  return (
    <Group transform={[{ scale: k }]}>
      <Shadow x={x0 + 8} y={y0 + D + front - 14} w={W - 16} h={22} k={k} />
      {/* The meter bridge at the back, its LED ladders. */}
      <Path path={rr(x0 + W * 0.55, y0 - meter, W * 0.42, meter, 4)}>
        <LinearGradient start={vec(0, y0 - meter)} end={vec(0, y0)} colors={['#3a3d45', '#1d1e22', '#0f1012']} />
      </Path>
      {Array.from({ length: 2 }, (_, c) =>
        Array.from({ length: 8 }, (_, i) => <Path key={`l${c}-${i}`} path={rr(x0 + W * 0.62 + c * 40 + i * 14, y0 - meter + 12, 10, 8, 1)} color={i < 5 ? '#4adf6a' : i < 7 ? '#ffc64d' : '#ff5a48'} opacity={i < 4 + c ? 1 : 0.3} />),
      )}
      {/* The top surface and the front edge. */}
      <Path path={rr(x0, y0, W, D, 8)}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + D)} colors={['#5a5e68', '#3a3d45', '#22242a']} />
      </Path>
      <Path path={rr(x0, y0 + D - 6, W, front + 6, 6)}>
        <LinearGradient start={vec(0, y0 + D)} end={vec(0, y0 + D + front)} colors={['#2a2c32', '#16171b', '#0b0b0d']} />
      </Path>
      <Path path={rr(x0, y0, W, D + front, 8)} style="stroke" strokeWidth={hw} color={INK} />
      {/* Strip dividers. */}
      {Array.from({ length: strips - 1 }, (_, s) => (
        <Path key={`d${s}`} path={poly([[sx0 + (s + 1) * sw, y0 + 6], [sx0 + (s + 1) * sw, y0 + D - 8]], false)} style="stroke" strokeWidth={Math.max(1, 0.2 / k)} color="#1a1c21" />
      ))}
      {items}
      {/* The master section: two faders, a few knobs. */}
      <Path path={rr(master, y0 + 6, x0 + W - master - 8, D - 14, 3)} color="#2a2c32" />
      {[0, 1].map((i) => (
        <Group key={`mf${i}`}>
          <Path path={rr(master + 30 + i * 30, y0 + 150 * 0.55 * 1.2, 3, 70 * 0.55 * 1.2, 1)} color="#050506" />
          <Path path={rr(master + 24 + i * 30, y0 + 170 * 0.55 * 1.2, 15, 8, 2)} color="#e64a3a" />
        </Group>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Circle key={`mk${i}`} cx={master + 20 + (i % 2) * 40} cy={y0 + 22 + Math.floor(i / 2) * 26} r={5.5} color="#e9e6dd" />
      ))}
    </Group>
  );
}

/* ── the switch ──────────────────────────────────────────────────────── */

export type IconArt = 'guitar' | 'bass' | 'steel' | 'pedals' | 'volume' | 'di' | 'ampOut' | 'auxOut' | 'combo' | 'head' | 'guitarHead' | 'cab112' | 'speaker12' | 'bassCab' | 'mic' | 'desk' | 'rhodes' | 'wurli' | 'wurliAmp' | 'wurliLid';

/** One node's drawing, centred at 0, 0, in a box of side S. */
export function ChainIcon({ art, S, out = 'right' }: { art: IconArt; S: number; out?: 'right' | 'down' }) {
  switch (art) {
    case 'guitar':
      return <ElectricIcon s={GUITAR} S={S} out={out} />;
    case 'bass':
      return <ElectricIcon s={BASS} S={S} out={out} />;
    case 'steel':
      return <SteelIcon S={S} />;
    case 'pedals':
      return <PedalsIcon S={S} />;
    case 'volume':
      return <VolumeIcon S={S} />;
    case 'di':
      return <DiIcon S={S} />;
    case 'ampOut':
      return <AmpOutIcon S={S} aux={false} />;
    case 'auxOut':
      return <AmpOutIcon S={S} aux />;
    case 'combo':
      return <ComboIcon S={S} />;
    case 'head':
      return <HeadIcon S={S} />;
    case 'guitarHead':
      return <GuitarHeadIcon S={S} />;
    case 'cab112':
      return <Cab112Icon S={S} />;
    case 'speaker12':
      return <Speaker12Icon S={S} />;
    case 'bassCab':
      return <BassCabIcon S={S} />;
    case 'mic':
      return <MicIcon S={S} />;
    case 'desk':
      return <DeskIcon S={S} />;
    case 'rhodes':
      return <KeyboardIcon S={S} kind="rhodes" />;
    case 'wurli':
      return <KeyboardIcon S={S} kind="wurli" />;
    case 'wurliAmp':
      return <WurliAmpIcon S={S} />;
    case 'wurliLid':
      return <WurliLidIcon S={S} />;
    default:
      return null;
  }
}
