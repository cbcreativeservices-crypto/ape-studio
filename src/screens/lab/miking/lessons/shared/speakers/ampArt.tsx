/**
 * THE AMPLIFIED CHAIN — the look of the combo's control panel and chassis
 * and of the bass head, drawn over the speaker family's own cabinet art
 * (SpeakerArt.tsx, unchanged) from ampModel.ts, and the LessonArt the
 * engine's placement scene draws with for Lab 4's amp lessons.
 *
 *   combo, front   the control panel across the top of the front: a chrome
 *                  plate with the player's knobs and the input jacks
 *   combo, side    the same panel in section, and the chassis hanging inside
 *                  the top of the box with its valves below it (hot and live:
 *                  never a place for a mic, a hand or a stand)
 *   bass head      the amplifier in its own box on top of the cabinet (front
 *                  and side)
 *
 * Generic finishes, no maker's likeness or logo. Static (D8).
 */
import { Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import { CabSection, SPK } from './SpeakerArt';
import { cabHitTest, cabLabels } from './cabLabels.ts';
import { bassHead, cabOf, comboParts, type AmpRig } from './ampModel.ts';
import type { CabExplorerView, CabExtras } from './CabExplorer';
import type { Back } from './cabGeometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
const AMBER = '#ffc64d';

/* ── the combo ──
 * A 1 × 12 two-channel valve combo, 622 W × 445 H × 241 D (speakerModel
 * combo12, the maker's manual). Its front control panel (ampModel COMBO,
 * 90 mm band) carries the classic two-channel layout: channel 1 — two input
 * jacks (Ø22 nuts), volume, treble, bass; channel 2 — two inputs, volume,
 * treble, bass, reverb, speed, intensity; a pilot jewel Ø22 at the right.
 * Skirted knobs Ø30 skirt / Ø21 cap, 18 mm proud, on 40 mm centres (drawing
 * defaults). A leather strap handle on the top, 200 long. Generic finish:
 * brushed aluminium panel, black knobs with silver skirts, no legend. */
const KNOB_R = 15;
const CAP_R = 10.5;
function comboFrontLayout(z0: number) {
  // Positions across the panel, measured from the left edge (mm).
  const jacks = [38, 66, 232, 260].map((d) => z0 + d);
  const knobs = [108, 148, 188, 302, 342, 382, 422, 462, 502].map((d) => z0 + d);
  return { jacks, knobs, jewel: z0 + 560 };
}

function ComboFront({ hi }: { hi: string | null }) {
  const { c, panel } = comboParts();
  const { z0, z1, y0 } = c.box;
  const cy = y0 + 50;
  const L = comboFrontLayout(z0);
  const plate = rr(z0 + 14, y0 + 12, z1 - 14, panel.y1 - 6, 4);
  // Brushed grain and the dividing line between the two channels.
  const grain = make();
  for (let v = y0 + 16; v < panel.y1 - 8; v += 3.2) {
    grain.moveTo(z0 + 16, v);
    grain.lineTo(z1 - 16, v);
  }
  const divide = make();
  divide.moveTo(z0 + 210, y0 + 20);
  divide.lineTo(z0 + 210, panel.y1 - 14);
  // Each knob: skirt ticks (11 positions over 300°), the pointer at "5".
  const ticks = make();
  for (const u of L.knobs)
    for (let i = 0; i <= 10; i++) {
      const a = ((-150 + i * 30) * Math.PI) / 180;
      ticks.moveTo(u + Math.sin(a) * (KNOB_R - 3.2), cy - Math.cos(a) * (KNOB_R - 3.2));
      ticks.lineTo(u + Math.sin(a) * (KNOB_R - 0.8), cy - Math.cos(a) * (KNOB_R - 0.8));
    }
  const pointers = make();
  for (const u of L.knobs) {
    pointers.moveTo(u, cy - 1);
    pointers.lineTo(u, cy - CAP_R + 1.5);
  }
  // The top handle, seen end-on above the box.
  const handleEnd = rr((z0 + z1) / 2 - 16, y0 - 22, (z0 + z1) / 2 + 16, y0 + 1, 7);
  return (
    <Group>
      <Path path={handleEnd}>
        <LinearGradient start={vec(0, y0 - 22)} end={vec(0, y0)} colors={['#3d3330', '#1d1816', '#0d0b0a']} />
      </Path>
      <Path path={handleEnd} style="stroke" strokeWidth={1} color="#08080a" />
      <Path path={rr(z0 + 4, y0 + 4, z1 - 4, panel.y1, 8)} color="#0d0d10" />
      <Path path={plate}>
        <LinearGradient start={vec(z0, y0)} end={vec(z0, panel.y1)} colors={['#e9ecf1', '#c3c8d0', '#9ba1ab', '#7d838d']} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={grain} style="stroke" strokeWidth={0.5} color="#ffffff" opacity={0.12} />
      <Path path={divide} style="stroke" strokeWidth={1.2} color="#3a3d45" opacity={0.7} />
      <Path path={plate} style="stroke" strokeWidth={1.2} color="#08080a" />
      {/* Input jacks: a chrome nut round the socket. */}
      {L.jacks.map((u, i) => (
        <Group key={`j${i}`}>
          <Circle cx={u} cy={cy} r={11}>
            <RadialGradient c={vec(u - 4, cy - 4)} r={14} colors={['#f6f7fa', '#a3a9b3', '#4a4e57']} />
          </Circle>
          <Circle cx={u} cy={cy} r={11} style="stroke" strokeWidth={0.8} color="#08080a" />
          <Circle cx={u} cy={cy} r={6.4} color="#050506" />
          <Circle cx={u} cy={cy} r={6.4} style="stroke" strokeWidth={1} color="#6a6f7a" />
        </Group>
      ))}
      {/* Skirted knobs, lit from the upper left. */}
      {L.knobs.map((u, i) => (
        <Group key={`k${i}`}>
          <Circle cx={u + 2.5} cy={cy + 3.5} r={KNOB_R} color="#000" opacity={0.35} />
          <Circle cx={u} cy={cy} r={KNOB_R}>
            <RadialGradient c={vec(u - 5, cy - 6)} r={KNOB_R * 1.5} colors={['#eef1f5', '#b9bec7', '#5d626c']} />
          </Circle>
          <Circle cx={u} cy={cy} r={KNOB_R} style="stroke" strokeWidth={0.8} color="#08080a" />
          <Circle cx={u} cy={cy} r={CAP_R}>
            <RadialGradient c={vec(u - 3.5, cy - 4)} r={CAP_R * 1.6} colors={['#55585f', '#1c1d21', '#08080a']} />
          </Circle>
          <Circle cx={u - 3} cy={cy - 3.5} r={3} color="#ffffff" opacity={0.12} />
        </Group>
      ))}
      <Path path={ticks} style="stroke" strokeWidth={0.9} color="#202228" />
      <Path path={pointers} style="stroke" strokeWidth={1.6} strokeCap="round" color="#e6e8ec" />
      {/* Pilot jewel: a faceted red lens in a chrome bezel. */}
      <Circle cx={L.jewel} cy={cy} r={12}>
        <RadialGradient c={vec(L.jewel - 4, cy - 4)} r={15} colors={['#f6f7fa', '#a3a9b3', '#4a4e57']} />
      </Circle>
      <Circle cx={L.jewel} cy={cy} r={8.5}>
        <RadialGradient c={vec(L.jewel - 2.5, cy - 3)} r={11} colors={['#ffd9a0', '#e04a28', '#5a1208']} />
      </Circle>
      <Circle cx={L.jewel - 2.5} cy={cy - 3} r={2.2} color="#fff4e0" opacity={0.8} />
      {hi === 'amp.panel' ? <Path path={rr(z0 + 4, y0 + 2, z1 - 4, panel.y1 + 2, 10)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* The chassis from the side (cut with the cabinet through the speaker's
 * axis). A valve combo's chassis is an upside-down steel tray bolted under
 * the top panel: its front apron is the control panel, its valves and
 * transformers hang DOWN from it into the box toward the open back, where a
 * tech reaches them. Drawing defaults (typical of the class): tray 1.2 mm
 * steel (drawn 3), 80 tall (ampModel COMBO.chassisH); a power transformer
 * ≈ 70 × 52 (laminated core, end bell) at the rear; a power valve
 * (octal, Ø30 × 78 overall, pointing down, in its spring retainer);
 * a preamp valve Ø22 × 48 glass + 9 pins in front of it; a fibre eyelet
 * board with parts inside the tray; two chassis straps to the top panel. */
function ComboSide({ hi }: { hi: string | null }) {
  const { c, panel, chassis, tubes } = comboParts();
  const plate = rr(c.grilleX - 6, c.box.y0 + 2, c.grilleX + 2, panel.y1, 2);
  const kv = c.box.y0 + 49;
  const T = 3; // drawn sheet thickness
  const { x0, x1, y0, y1 } = chassis;
  // The tray in section: the bottom (socket) plate and the two aprons.
  const tray = make();
  tray.addRect(Skia.XYWHRect(x0, y1 - T, x1 - x0, T));
  tray.addRect(Skia.XYWHRect(x0, y0 + 6, T, y1 - y0 - 6));
  tray.addRect(Skia.XYWHRect(x1 - T, y0 + 6, T, y1 - y0 - 6));
  const inside = rr(x0 + T, y0 + 6, x1 - T, y1 - T, 1);
  const board = rr(x0 + 16, y1 - T - 26, x1 - 20, y1 - T - 20, 1);
  // Resistors and coupling caps standing on the board (seen edge-on), and
  // two tubular filter caps lying in the tray.
  const parts = make();
  for (let i = 0; i < 9; i++) parts.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 20 + i * ((x1 - x0 - 44) / 9), y1 - T - 34, 5, 8), 2, 2));
  const fcaps = [rr(x0 + 24, y0 + 12, x0 + 70, y0 + 26, 6), rr(x0 + 80, y0 + 12, x0 + 126, y0 + 26, 6)];
  const straps = [x0 + 18, x1 - 22].map((x) => rr(x - 5, c.box.y0 + c.panel - 1, x + 5, y0 + 10, 1));
  // A power transformer hanging at the rear (seen beyond the cut, behind
  // the valve).
  const ptX0 = x0 + 8;
  const pt = rr(ptX0, y1, ptX0 + 70, y1 + 52, 3);
  const ptBell = rr(ptX0 - 3, y1, ptX0 + 73, y1 + 12, 4);
  const lams = make();
  for (let v = y1 + 16; v < y1 + 50; v += 5) {
    lams.moveTo(ptX0 + 3, v);
    lams.lineTo(ptX0 + 67, v);
  }
  // The power valve (octal base at the top, glass Ø30 pointing down; 78
  // overall), in its spring retainer.
  const t0 = tubes[0];
  const pv = { x: t0.x - 6, y: y1 };
  const pBase = rr(pv.x - 14, pv.y, pv.x + 14, pv.y + 20, 3);
  const pGlass = make();
  pGlass.moveTo(pv.x - 15, pv.y + 18);
  pGlass.lineTo(pv.x - 15, pv.y + 62);
  pGlass.quadTo(pv.x - 15, pv.y + 72, pv.x - 5, pv.y + 73);
  pGlass.lineTo(pv.x - 2, pv.y + 78);
  pGlass.lineTo(pv.x + 2, pv.y + 78);
  pGlass.lineTo(pv.x + 5, pv.y + 73);
  pGlass.quadTo(pv.x + 15, pv.y + 72, pv.x + 15, pv.y + 62);
  pGlass.lineTo(pv.x + 15, pv.y + 18);
  pGlass.close();
  const pPlate = rr(pv.x - 8, pv.y + 26, pv.x + 8, pv.y + 58, 2);
  const pMica = make();
  pMica.moveTo(pv.x - 12, pv.y + 24);
  pMica.lineTo(pv.x + 12, pv.y + 24);
  pMica.moveTo(pv.x - 12, pv.y + 60);
  pMica.lineTo(pv.x + 12, pv.y + 60);
  const getter = rr(pv.x - 11, pv.y + 63, pv.x + 11, pv.y + 72, 5);
  const retainer = make();
  retainer.moveTo(pv.x - 17.5, pv.y + 2);
  retainer.lineTo(pv.x - 17.5, pv.y + 66);
  retainer.quadTo(pv.x - 17.5, pv.y + 76, pv.x, pv.y + 77);
  retainer.quadTo(pv.x + 17.5, pv.y + 76, pv.x + 17.5, pv.y + 66);
  retainer.lineTo(pv.x + 17.5, pv.y + 2);
  // A preamp valve nearer the front (9-pin, glass Ø22 × 48, pointing down).
  const qv = { x: pv.x + 50, y: y1 };
  const qPins = make();
  for (const dx of [-6, -2, 2, 6]) {
    qPins.moveTo(qv.x + dx, qv.y);
    qPins.lineTo(qv.x + dx, qv.y + 6);
  }
  const qSocket = rr(qv.x - 14, qv.y, qv.x + 14, qv.y + 5, 2);
  const qGlass = make();
  qGlass.moveTo(qv.x - 11, qv.y + 6);
  qGlass.lineTo(qv.x - 11, qv.y + 46);
  qGlass.quadTo(qv.x - 11, qv.y + 54, qv.x - 3, qv.y + 55);
  qGlass.lineTo(qv.x, qv.y + 59);
  qGlass.lineTo(qv.x + 3, qv.y + 55);
  qGlass.quadTo(qv.x + 11, qv.y + 54, qv.x + 11, qv.y + 46);
  qGlass.lineTo(qv.x + 11, qv.y + 6);
  qGlass.close();
  const qPlates = rr(qv.x - 6, qv.y + 14, qv.x + 6, qv.y + 38, 1.5);
  const qGetter = rr(qv.x - 8, qv.y + 44, qv.x + 8, qv.y + 53, 5);
  // A skirted pointer knob in profile on the front panel.
  const skirt = rr(c.grilleX + 2, kv - 15, c.grilleX + 6, kv + 15, 1.5);
  const cap = rr(c.grilleX + 6, kv - 10.5, c.grilleX + 20, kv + 10.5, 4);
  // The top handle in profile (strap between two end caps).
  const hx = (c.box.x0 + c.box.x1) / 2 - 10;
  const hy = c.box.y0;
  const strap = make();
  strap.moveTo(hx - 92, hy - 6);
  strap.cubicTo(hx - 70, hy - 26, hx + 70, hy - 26, hx + 92, hy - 6);
  const caps = [rr(hx - 108, hy - 10, hx - 80, hy + 1, 4), rr(hx + 80, hy - 10, hx + 108, hy + 1, 4)];
  return (
    <Group>
      {/* Top handle. */}
      <Path path={strap} style="stroke" strokeWidth={9} strokeCap="round" color="#0d0b0a" />
      <Path path={strap} style="stroke" strokeWidth={6} strokeCap="round" color="#3a302b" />
      <Path path={strap} style="stroke" strokeWidth={1} color="#8a7a70" opacity={0.5} />
      {caps.map((p, i) => (
        <Group key={`hc${i}`}>
          <Path path={p}>
            <LinearGradient start={vec(0, hy - 10)} end={vec(0, hy)} colors={['#e3e6ec', '#8a8f99', '#3c3f47']} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color="#08080a" />
        </Group>
      ))}
      {/* Power transformer beyond the cut (its laminations and end bell). */}
      <Path path={pt}>
        <LinearGradient start={vec(ptX0, y1)} end={vec(ptX0 + 70, y1 + 52)} colors={['#4a4d55', '#2a2c32', '#141519']} />
      </Path>
      <Path path={lams} style="stroke" strokeWidth={0.6} color="#7a7f8a" opacity={0.35} />
      <Path path={ptBell}>
        <LinearGradient start={vec(0, y1)} end={vec(0, y1 + 12)} colors={['#3a3d45', '#1d1e22']} />
      </Path>
      <Path path={pt} style="stroke" strokeWidth={0.8} color="#08080a" />
      {/* The tray, its straps, the eyelet board inside. */}
      {straps.map((p, i) => (
        <Path key={`s${i}`} path={p} color="#5d616c" />
      ))}
      <Path path={inside} color="#0e0f12" />
      <Path path={board} color="#5a3a1c" />
      <Path path={parts}>
        <LinearGradient start={vec(x0, y1 - 40)} end={vec(x1, y1 - 26)} colors={['#a08a5a', '#7d6a48', '#9a7e52', '#6e5d40']} />
      </Path>
      {fcaps.map((p, i) => (
        <Path key={`fc${i}`} path={p}>
          <LinearGradient start={vec(0, y0 + 12)} end={vec(0, y0 + 26)} colors={['#9aa0ab', '#5d616c', '#2a2c32']} />
        </Path>
      ))}
      <Path path={tray}>
        <LinearGradient start={vec(x0, y0)} end={vec(x1, y1)} colors={['#d6dae1', '#8a8f99', '#4a4e57']} />
      </Path>
      <Path path={tray} style="stroke" strokeWidth={0.6} color="#08080a" />
      {/* Power valve in its retainer: base up, glass pointing down. */}
      <Path path={pBase}>
        <LinearGradient start={vec(pv.x - 15, 0)} end={vec(pv.x + 15, 0)} colors={['#3a2a1c', '#1a120b', '#0b0806']} />
      </Path>
      <Path path={pPlate} color="#3a3d45" />
      <Path path={pMica} style="stroke" strokeWidth={1.4} color="#c9ccd3" opacity={0.7} />
      <Path path={getter}>
        <LinearGradient start={vec(pv.x - 12, 0)} end={vec(pv.x + 12, 0)} colors={['#e8ebf0', '#7a7f8a', '#c9ccd3']} />
      </Path>
      <Path path={pGlass}>
        <LinearGradient start={vec(pv.x - 16, 0)} end={vec(pv.x + 16, 0)} colors={['rgba(240,244,250,0.42)', 'rgba(200,210,225,0.12)', 'rgba(120,130,145,0.28)']} />
      </Path>
      <Path path={pGlass} style="stroke" strokeWidth={1} color="#c9d2de" opacity={0.65} />
      <Path path={retainer} style="stroke" strokeWidth={1.4} color="#aab0ba" opacity={0.85} />
      {/* Preamp valve (9-pin) nearer the front. */}
      <Path path={qSocket} color="#2a2b30" />
      <Path path={qPins} style="stroke" strokeWidth={1} color="#c9ccd3" />
      <Path path={qPlates} color="#45484f" />
      <Path path={qGetter}>
        <LinearGradient start={vec(qv.x - 8, 0)} end={vec(qv.x + 8, 0)} colors={['#e8ebf0', '#7a7f8a', '#c9ccd3']} />
      </Path>
      <Path path={qGlass}>
        <LinearGradient start={vec(qv.x - 11, 0)} end={vec(qv.x + 11, 0)} colors={['rgba(240,244,250,0.42)', 'rgba(200,210,225,0.12)', 'rgba(120,130,145,0.28)']} />
      </Path>
      <Path path={qGlass} style="stroke" strokeWidth={0.9} color="#c9d2de" opacity={0.65} />
      {/* The control panel at the front of the tray, a knob standing proud. */}
      <Path path={plate}>
        <LinearGradient start={vec(0, c.box.y0)} end={vec(0, panel.y1)} colors={['#e9ecf1', '#b4b9c3', '#6a6f7a']} />
      </Path>
      <Path path={plate} style="stroke" strokeWidth={0.6} color="#08080a" />
      <Path path={skirt}>
        <LinearGradient start={vec(0, kv - 15)} end={vec(0, kv + 15)} colors={['#eef1f5', '#9aa0ab', '#4a4e57']} />
      </Path>
      <Path path={cap}>
        <LinearGradient start={vec(0, kv - 10)} end={vec(0, kv + 10)} colors={['#55585f', '#1c1d21', '#08080a']} />
      </Path>
      <Path path={cap} style="stroke" strokeWidth={0.6} color="#08080a" />
      {hi === 'amp.panel' ? <Path path={rr(c.grilleX - 14, c.box.y0 - 6, c.grilleX + 30, panel.y1 + 6, 8)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
      {hi === 'amp.chassis' ? <Path path={rr(chassis.x0 - 8, chassis.y0 - 6, chassis.x1 + 8, chassis.y1 + 78, 8)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── the bass head ──
 * A compact bass head on the 4 × 10 (ampModel BASS_HEAD: 330 W × 75 H ×
 * 250 D, flush with the cabinet's front). Drawing defaults typical of the
 * class: a 3 mm black front panel, inset 6; one input jack (left), gain,
 * four-band EQ and master knobs (Ø20, 22 proud), a mute toggle and a power
 * rocker (right); side vent slots; at the back the speaker outputs and the
 * DI XLR stand 12 mm proud; four rubber feet 8 mm (inside the drawn box). */
function HeadArt({ view, hi }: { view: 'front' | 'side'; hi: string | null }) {
  const h = bassHead();
  const u0 = view === 'front' ? h.z0 : h.x0;
  const u1 = view === 'front' ? h.z1 : h.x1;
  const top = h.y0;
  const bot = h.y1 - 8; // the feet stand under the case
  const box = rr(u0, top, u1, bot, 5);
  const cy = (top + bot) / 2 + 2;
  const feet = (view === 'front' ? [u0 + 22, u1 - 22] : [u0 + 26, u1 - 26]).map((u) => rr(u - 13, bot - 1, u + 13, h.y1, 3));
  if (view === 'front') {
    const panel = rr(u0 + 6, top + 6, u1 - 6, bot - 6, 2);
    const knobs = Array.from({ length: 6 }, (_, i) => u0 + 78 + i * 34);
    const ticks = make();
    for (const u of knobs)
      for (let i = 0; i <= 10; i++) {
        const a = ((-150 + i * 30) * Math.PI) / 180;
        ticks.moveTo(u + Math.sin(a) * 13, cy - Math.cos(a) * 13);
        ticks.lineTo(u + Math.sin(a) * 15.5, cy - Math.cos(a) * 15.5);
      }
    const pointers = make();
    for (const u of knobs) {
      pointers.moveTo(u, cy);
      pointers.lineTo(u - 4, cy - 7.5);
    }
    const sep = make();
    sep.moveTo(u0 + 58, top + 12);
    sep.lineTo(u0 + 58, bot - 12);
    sep.moveTo(u1 - 72, top + 12);
    sep.lineTo(u1 - 72, bot - 12);
    return (
      <Group>
        {feet.map((p, i) => (
          <Path key={`f${i}`} path={p} color="#0b0b0d" />
        ))}
        <Path path={box}>
          <LinearGradient start={vec(u0, top)} end={vec(u1, bot)} colors={[...SPK.tolex]} />
        </Path>
        <Path path={box} style="stroke" strokeWidth={1.4} color="#55585f" opacity={0.8} />
        <Path path={panel}>
          <LinearGradient start={vec(0, top)} end={vec(0, bot)} colors={['#2e2f35', '#17181b', '#0b0b0d']} />
        </Path>
        <Path path={panel} style="stroke" strokeWidth={0.8} color="#4a4e57" />
        <Path path={sep} style="stroke" strokeWidth={0.8} color="#6a6f7a" opacity={0.6} />
        <Path path={ticks} style="stroke" strokeWidth={0.9} color="#c9ccd3" opacity={0.7} />
        {/* Input jack. */}
        <Circle cx={u0 + 30} cy={cy} r={9}>
          <RadialGradient c={vec(u0 + 27, cy - 3)} r={12} colors={['#f6f7fa', '#a3a9b3', '#4a4e57']} />
        </Circle>
        <Circle cx={u0 + 30} cy={cy} r={5.2} color="#050506" />
        {knobs.map((u, i) => (
          <Group key={i}>
            <Circle cx={u + 2} cy={cy + 2.5} r={10} color="#000" opacity={0.4} />
            <Circle cx={u} cy={cy} r={10}>
              <RadialGradient c={vec(u - 3, cy - 4)} r={15} colors={['#6a6e77', '#25272c', '#0b0b0d']} />
            </Circle>
            <Circle cx={u} cy={cy} r={10} style="stroke" strokeWidth={0.8} color="#8a8f99" opacity={0.6} />
          </Group>
        ))}
        <Path path={pointers} style="stroke" strokeWidth={1.6} strokeCap="round" color="#f2f4f8" />
        {/* Mute toggle and power rocker. */}
        <Circle cx={u1 - 52} cy={cy} r={5} color="#9aa0ab" />
        <Path path={rr(u1 - 54, cy - 14, u1 - 50, cy - 2, 2)} color="#e3e6ec" />
        <Path path={rr(u1 - 36, cy - 11, u1 - 16, cy + 11, 3)} color="#050506" />
        <Path path={rr(u1 - 34, cy - 9, u1 - 18, cy + 1, 2)} color="#b8452f" />
        {hi === 'amp.head' ? <Path path={rr(u0 - 8, h.y0 - 8, u1 + 14, h.y1 + 4, 10)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
      </Group>
    );
  }
  // Side: the case in profile — knobs standing proud at the front (u1), the
  // output jacks at the back (u0), vent slots along the side.
  const vents = make();
  for (let u = u0 + 40; u < u1 - 50; u += 14) vents.addRRect(Skia.RRectXY(Skia.XYWHRect(u, top + 20, 6, bot - top - 40), 3, 3));
  const knob = rr(u1, cy - 10, u1 + 18, cy + 10, 4);
  const jacks = [rr(u0 - 12, top + 14, u0, top + 34, 3), rr(u0 - 10, top + 40, u0, top + 56, 3)];
  return (
    <Group>
      {feet.map((p, i) => (
        <Path key={`f${i}`} path={p} color="#0b0b0d" />
      ))}
      <Path path={box}>
        <LinearGradient start={vec(u0, top)} end={vec(u1, bot)} colors={[...SPK.tolex]} />
      </Path>
      <Path path={vents} color="#050506" />
      <Path path={box} style="stroke" strokeWidth={1.4} color="#55585f" opacity={0.8} />
      <Path path={rr(u1 - 3, top + 4, u1, bot - 4, 1)} color="#17181b" />
      <Path path={knob}>
        <LinearGradient start={vec(0, cy - 10)} end={vec(0, cy + 10)} colors={['#6a6e77', '#25272c', '#0b0b0d']} />
      </Path>
      {jacks.map((p, i) => (
        <Path key={`j${i}`} path={p}>
          <LinearGradient start={vec(0, top)} end={vec(0, top + 56)} colors={['#c8ccd4', '#5d616c', '#2a2c32']} />
        </Path>
      ))}
      {hi === 'amp.head' ? <Path path={rr(u0 - 8, h.y0 - 8, u1 + 14, h.y1 + 4, 10)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── the explorer's extras (page 1) ── */
export function ampExtras(rig: AmpRig, highlight: string | null): CabExtras {
  if (rig === 'combo') {
    const { c, panel, chassis } = comboParts();
    return {
      render: (view: CabExplorerView) => (view === 'front' ? <ComboFront hi={highlight} /> : view === 'side' ? <ComboSide hi={highlight} /> : null),
      hit: (view, u, v, tol) => {
        if (view === 'front' && v >= c.box.y0 - tol && v <= panel.y1 && u >= c.box.z0 && u <= c.box.z1) return 'amp.panel';
        if (view === 'side') {
          if (u >= c.grilleX - 20 - tol && u <= c.grilleX + 30 && v >= c.box.y0 && v <= panel.y1) return 'amp.panel';
          if (u >= chassis.x0 && u <= chassis.x1 && v >= chassis.y0 && v <= chassis.y1 + 70) return 'amp.chassis';
        }
        return null;
      },
      labels: (view) =>
        view === 'front'
          ? [{ id: 'panel', text: 'CONTROL PANEL', short: 'CONTROLS', u: (c.box.z0 + c.box.z1) / 2, v: c.box.y0 - 30, align: 'center', tone: 'muted' }]
          : view === 'side'
            ? [{ id: 'chassis', text: 'CHASSIS · VALVES', short: 'CHASSIS', u: chassis.x0 - 10, v: c.box.y0 - 30, align: 'left', tone: 'muted' } as StaticLabel]
            : [],
    };
  }
  const h = bassHead();
  return {
    above: 90,
    render: (view) => (view === 'front' || view === 'side' ? <HeadArt view={view} hi={highlight} /> : null),
    hit: (view, u, v, tol) => {
      if (v < h.y0 - tol || v > h.y1) return null;
      if (view === 'front' && u >= h.z0 && u <= h.z1) return 'amp.head';
      if (view === 'side' && u >= h.x0 && u <= h.x1) return 'amp.head';
      return null;
    },
    labels: (view) => (view === 'front' || view === 'side' ? [{ id: 'head', text: 'HEAD', u: view === 'front' ? h.z1 + 16 : h.x0 - 16, v: (h.y0 + h.y1) / 2, align: view === 'front' ? 'left' : 'right', tone: 'muted' }] : []),
  };
}

/* ── the placement scene's art ── */
const made = new Map<AmpRig, LessonArt>();
const backOf = (rig: AmpRig): Back => (rig === 'combo' ? 'open' : 'closed');

export function ampLessonArt(rig: AmpRig): LessonArt {
  let a = made.get(rig);
  if (a) return a;
  const kind = cabOf(rig);
  const back = backOf(rig);
  const ex = ampExtras(rig, null);
  a = {
    Instrument: ({ view }: { view: ViewId; variant: VariantId }) => (
      <Group>
        <CabSection kind={kind} back={back} view={view} />
        {view === 'side' ? ex.render?.('side') ?? null : null}
      </Group>
    ),
    labels: (view) => [...cabLabels(kind, back, view), ...(view === 'side' ? (ex.labels?.('side') ?? []).map((l) => ({ ...l, tone: 'muted' as const })) : [])],
    hitTest: (view, _variant, u, v, tol) => ex.hit?.(view, u, v, tol) ?? cabHitTest(kind, back, view, u, v, tol),
  };
  made.set(rig, a);
  return a;
}
