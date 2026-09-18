/**
 * Module — Other Cymatic Systems (spec §3 item 8, Phase 3), on the RACK
 * (judge panel 2026-09-17): the chosen system's drawing PINS on the glass,
 * SYSTEM is a sticky tray whose blurb says what vibrates, HARMONIC rides the
 * lane (string / air column only — the key disappears for the rest and the
 * rack reconciles). Each drawing keeps its own strobe clock so the phase
 * ticks never re-render the rack.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../../features/tools/levelColor';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { DockParam } from '../../rack/rackTypes';
import type { RootStackParamList } from '../../../../navigation/types';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { CymaticsRackLayout } from './rackLayout';
import { P } from './shared';

const STOPS = WAVE_LEVEL_STOPS.map((s) => ({ offset: `${Math.round(s.offset * 100)}%`, color: s.color }));

/** A strobe clock local to a drawing: 10 Hz phase ticks stay inside the stage. */
function usePhase(running: boolean) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setPhase((p) => (p + 0.35) % (2 * Math.PI)), 100);
    return () => clearInterval(id);
  }, [running]);
  return phase;
}

/** A string's n-th harmonic as a standing wave, between a nut and a bridge. */
function StringDemo({ w, h, n, running }: { w: number; h: number; n: number; running: boolean }) {
  const phase = usePhase(running);
  const amp = Math.min(h * 0.3, 40);
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const x = 22 + u * (w - 44);
      const y = h / 2 - Math.sin(n * Math.PI * u) * Math.cos(phase) * amp;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [w, h, n, phase, amp]);
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="strg" x1="0" y1={h / 2 - amp} x2="0" y2={h / 2 + amp} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
        <SvgGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6b4a2b" />
          <Stop offset="100%" stopColor="#3b2a1c" />
        </SvgGradient>
      </Defs>
      {/* Nut (left) and bridge (right): lit from the upper-left */}
      <Rect x={10} y={h / 2 - 22} width={12} height={44} rx={2} fill="url(#wood)" stroke="#8a6a3a" />
      <Rect x={w - 22} y={h / 2 - 26} width={12} height={52} rx={2} fill="url(#wood)" stroke="#8a6a3a" />
      <Line x1={22} y1={h / 2} x2={w - 22} y2={h / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#strg)" strokeWidth={2.4} fill="none" />
      {Array.from({ length: n + 1 }, (_, k) => k).map((k) => (
        <Circle key={k} cx={22 + (k / n) * (w - 44)} cy={h / 2} r={3.4} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

/** An open pipe's pressure standing wave (n-th mode): a drawn tube with open ends. */
function PipeDemo({ w, h, n, running }: { w: number; h: number; n: number; running: boolean }) {
  const phase = usePhase(running);
  const amp = Math.min(h * 0.24, 30);
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const x = 24 + u * (w - 48);
      const y = h / 2 - Math.sin(n * Math.PI * u) * Math.cos(phase) * amp;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [w, h, n, phase, amp]);
  const top = h / 2 - amp - 16;
  const bot = h / 2 + amp + 16;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="pipg" x1="0" y1={h / 2 - amp} x2="0" y2={h / 2 + amp} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
        <SvgGradient id="tube" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#5a5d66" />
          <Stop offset="45%" stopColor="#2a2c33" />
          <Stop offset="100%" stopColor="#15161a" />
        </SvgGradient>
      </Defs>
      {/* The tube: a shaded wall with elliptical open ends */}
      <Rect x={24} y={top} width={w - 48} height={bot - top} fill="url(#tube)" />
      <Path d={`M 24 ${top} A 8 ${(bot - top) / 2} 0 0 0 24 ${bot}`} fill="#0b0b10" stroke="#8a8f99" strokeWidth={1.5} />
      <Path d={`M ${w - 24} ${top} A 8 ${(bot - top) / 2} 0 0 1 ${w - 24} ${bot}`} fill="#1c1e24" stroke="#8a8f99" strokeWidth={1.5} />
      <Line x1={24} y1={top} x2={w - 24} y2={top} stroke="#8a8f99" strokeWidth={1.2} />
      <Line x1={24} y1={bot} x2={w - 24} y2={bot} stroke="#6a6f78" strokeWidth={1.2} />
      <Line x1={24} y1={h / 2} x2={w - 24} y2={h / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#pipg)" strokeWidth={2.4} fill="none" />
      {Array.from({ length: n + 1 }, (_, k) => k).map((k) => (
        <Circle key={k} cx={24 + (k / n) * (w - 48)} cy={h / 2} r={3.4} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

/** Acoustic levitation: a standing wave between a transducer horn and a reflector holds beads at the pressure nodes. */
function LevitationDemo({ w, h, running }: { w: number; h: number; running: boolean }) {
  const phase = usePhase(running);
  const n = 5;
  const top = 26;
  const bot = h - 26;
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const y = top + u * (bot - top);
      const x = w / 2 + Math.sin(n * Math.PI * u) * Math.cos(phase) * 26;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [w, h, phase, top, bot]);
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="levg" x1={w / 2 - 26} y1="0" x2={w / 2 + 26} y2="0" gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
        <SvgGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6a6f78" />
          <Stop offset="100%" stopColor="#26282e" />
        </SvgGradient>
      </Defs>
      {/* Transducer with its horn (top) and the reflector plate (bottom) */}
      <Rect x={w / 2 - 22} y={2} width={44} height={14} rx={3} fill="url(#metal)" stroke="#8a8f99" />
      <Path d={`M ${w / 2 - 22} 16 L ${w / 2 - 36} ${top} L ${w / 2 + 36} ${top} L ${w / 2 + 22} 16 Z`} fill="url(#metal)" stroke="#8a8f99" />
      <Rect x={w / 2 - 40} y={bot} width={80} height={12} rx={2} fill="url(#metal)" stroke="#8a8f99" />
      <Line x1={w / 2} y1={top} x2={w / 2} y2={bot} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#levg)" strokeWidth={2} fill="none" />
      {Array.from({ length: n - 1 }, (_, k) => k + 1).map((k) => (
        <Circle key={k} cx={w / 2} cy={top + (k / n) * (bot - top)} r={4.5} fill="#efe2b8" stroke="#8a7a50" />
      ))}
    </Svg>
  );
}

/**
 * ── THE OTHER THREE GOT A DRAWING (2026-09-18, design review #6) ─────────────
 *
 * Three of the six systems — the dish, the loudspeaker and the bell — used to
 * put a SENTENCE on the rack stage: "the full simulation lives in the Liquid
 * Studio", and a button. In a lab whose entire premise is SOUND MADE VISIBLE,
 * half the systems were invisible, and the one panel built to hold a picture
 * held an apology for not having one.
 *
 * These three are deliberately smaller than the studios they point at — they
 * are the thumbnail that makes you want to open the studio, not a second copy
 * of it. The link stays underneath; it just is no longer the whole panel.
 */

/** A dish on a shaker. The DISH moves at the drive rate; the SURFACE ripples at HALF it. */
function WaterDemo({ w, h, running }: { w: number; h: number; running: boolean }) {
  const phase = usePhase(running);
  const lobes = 6;
  /** The two clocks are the teaching point, so they are written as two numbers. */
  const shake = Math.sin(phase) * 3;
  const surf = Math.cos(phase / 2);
  const left = 30;
  const right = w - 30;
  const rim = h * 0.34 + shake;
  const floor = h * 0.68 + shake;
  const restY = (rim + floor) / 2;
  const amp = Math.min(h * 0.1, 14);

  const surface = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const x = left + u * (right - left);
      const y = restY - Math.sin(lobes * Math.PI * u) * surf * amp;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [left, right, restY, surf, amp]);

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="watg" x1="0" y1={restY - amp} x2="0" y2={restY + amp} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
        <SvgGradient id="liq" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="rgba(90,160,220,.42)" />
          <Stop offset="100%" stopColor="rgba(30,70,120,.30)" />
        </SvgGradient>
        <SvgGradient id="shk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6a6f78" />
          <Stop offset="100%" stopColor="#26282e" />
        </SvgGradient>
      </Defs>

      {/* The liquid body, filled from the rippling surface down to the dish floor */}
      <Path d={`${surface} L ${right} ${floor} L ${left} ${floor} Z`} fill="url(#liq)" />
      <Path d={surface} stroke="url(#watg)" strokeWidth={2.2} fill="none" />

      {/* The dish: glass walls and a floor, drawn over the liquid so it reads as containing it */}
      <Path
        d={`M ${left - 6} ${rim} L ${left - 6} ${floor} L ${right + 6} ${floor} L ${right + 6} ${rim}`}
        fill="none"
        stroke="#8a8f99"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Line x1={left - 12} y1={rim} x2={left} y2={rim} stroke="#b9bec8" strokeWidth={2} />
      <Line x1={right} y1={rim} x2={right + 12} y2={rim} stroke="#b9bec8" strokeWidth={2} />

      {/* The shaker underneath, and the post that drives the dish */}
      <Rect x={w / 2 - 5} y={floor} width={10} height={h - 18 - floor} fill="url(#shk)" stroke="#8a8f99" strokeWidth={1} />
      <Rect x={w / 2 - 46} y={h - 18} width={92} height={14} rx={3} fill="url(#shk)" stroke="#8a8f99" />

      {/* The still points between the lobes — where the surface never moves */}
      {Array.from({ length: lobes + 1 }, (_, k) => k).map((k) => (
        <Circle key={k} cx={left + (k / lobes) * (right - left)} cy={restY} r={2.8} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

/** A loudspeaker in section, face up, with grains on the cone: piston below breakup, modes above it. */
function SpeakerDemo({ w, h, running }: { w: number; h: number; running: boolean }) {
  const phase = usePhase(running);
  const cx = w / 2;
  const R = Math.min(w * 0.36, 130);
  const rimY = h * 0.34;
  const depth = Math.min(h * 0.2, 34);
  const amp = Math.min(h * 0.07, 10);

  /** Radial mode with nodes at the centre, mid-radius and the surround. */
  const disp = (r: number) => Math.sin(2 * Math.PI * r) * Math.cos(phase) * amp;
  const coneY = (r: number) => rimY + (1 - r) * depth + disp(r);

  const cone = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 80; i++) {
      const u = i / 80; // -1 … +1 across the diameter
      const t = u * 2 - 1;
      const r = Math.abs(t);
      const x = cx + t * R;
      const y = coneY(r);
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, phase, R, rimY, depth, amp]);

  /** Grains: the two at an antinode bounce, the one at the node sits still. */
  const grains = [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75];

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="spkg" x1="0" y1={rimY - amp} x2="0" y2={rimY + depth + amp} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
        <SvgGradient id="mag" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#4a4e57" />
          <Stop offset="100%" stopColor="#1b1d22" />
        </SvgGradient>
      </Defs>

      {/* Basket rim and surround roll on both sides */}
      <Path d={`M ${cx - R - 16} ${rimY - 6} L ${cx - R - 4} ${rimY - 6} A 7 7 0 0 1 ${cx - R + 2} ${rimY}`} fill="none" stroke="#8a8f99" strokeWidth={2.4} />
      <Path d={`M ${cx + R + 16} ${rimY - 6} L ${cx + R + 4} ${rimY - 6} A 7 7 0 0 0 ${cx + R - 2} ${rimY}`} fill="none" stroke="#8a8f99" strokeWidth={2.4} />

      {/* The cone itself, tinted by the amplitude ramp */}
      <Path d={cone} stroke="url(#spkg)" strokeWidth={3} fill="none" strokeLinejoin="round" />

      {/* Motor: former, magnet and backplate hanging under the apex */}
      <Rect x={cx - 11} y={rimY + depth + 2} width={22} height={18} fill="url(#mag)" stroke="#8a8f99" strokeWidth={1} />
      <Rect x={cx - 26} y={rimY + depth + 20} width={52} height={20} rx={2} fill="url(#mag)" stroke="#8a8f99" />
      <Rect x={cx - 32} y={rimY + depth + 40} width={64} height={8} rx={2} fill="url(#mag)" stroke="#8a8f99" />

      {/* Grains, and the still ring they collect on */}
      {grains.map((t) => {
        const r = Math.abs(t);
        const still = Math.abs(Math.sin(2 * Math.PI * r)) < 0.02;
        const hop = still ? 0 : Math.abs(Math.sin(phase * 2)) * 7;
        return <Circle key={t} cx={cx + t * R} cy={coneY(r) - 4 - hop} r={3} fill={still ? MIDLINE_BLUE : '#efe2b8'} stroke="#8a7a50" strokeWidth={0.6} />;
      })}
      <Line x1={cx - R} y1={rimY + depth * 0.5} x2={cx + R} y2={rimY + depth * 0.5} stroke="transparent" />
    </Svg>
  );
}

/** A bell, with its mouth flexing in the (2,0) mode — the lowest way a bell can ring. */
function BellDemo({ w, h, running }: { w: number; h: number; running: boolean }) {
  const phase = usePhase(running);
  const cx = w / 2;
  const topY = 22;
  const mouthY = h - 40;
  const halfMouth = Math.min(w * 0.26, 76);
  const halfCrown = halfMouth * 0.3;
  /** The (2,0) mode: one diameter grows while the one at right angles shrinks. */
  const flex = Math.cos(phase) * 6;
  const span = mouthY - topY;

  /**
   * Two cubics a side, not one: shoulder down to a WAIST, then the flare out to
   * the mouth. A single curve gives a cone, and a cone is a lampshade.
   */
  const waistX = halfMouth * 0.5;
  const waistY = topY + span * 0.62;
  const body =
    `M ${cx - halfCrown} ${topY} ` +
    `C ${cx - halfCrown * 1.35} ${topY + span * 0.3}, ${cx - waistX * 0.92} ${topY + span * 0.4}, ${cx - waistX} ${waistY} ` +
    `C ${cx - waistX * 1.1} ${topY + span * 0.82}, ${cx - halfMouth * 0.82} ${mouthY - 8}, ${cx - halfMouth - flex} ${mouthY} ` +
    `L ${cx + halfMouth + flex} ${mouthY} ` +
    `C ${cx + halfMouth * 0.82} ${mouthY - 8}, ${cx + waistX * 1.1} ${topY + span * 0.82}, ${cx + waistX} ${waistY} ` +
    `C ${cx + waistX * 0.92} ${topY + span * 0.4}, ${cx + halfCrown * 1.35} ${topY + span * 0.3}, ${cx + halfCrown} ${topY} ` +
    `Z`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="bellg" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <Stop offset="0%" stopColor="#8a6a2e" />
          <Stop offset="38%" stopColor="#d9b268" />
          <Stop offset="72%" stopColor="#9c7a38" />
          <Stop offset="100%" stopColor="#5d4620" />
        </SvgGradient>
      </Defs>

      {/* Headstock and canons */}
      <Rect x={cx - 16} y={8} width={32} height={7} rx={3} fill="#4a4e57" stroke="#8a8f99" strokeWidth={1} />
      <Path d={`M ${cx - 9} ${topY} L ${cx - 7} 15 M ${cx + 9} ${topY} L ${cx + 7} 15`} stroke="#8a8f99" strokeWidth={3} />

      {/* The bell, flexing */}
      <Path d={body} fill="url(#bellg)" stroke="#e6c887" strokeWidth={1.4} />
      {/* The soundbow — the thick ring at the mouth a clapper strikes */}
      <Path
        d={`M ${cx - halfMouth - flex} ${mouthY} L ${cx + halfMouth + flex} ${mouthY}`}
        stroke="#f3dca6"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* The mouth seen in perspective: the ellipse that grows one way as it shrinks the other */}
      <Path
        d={`M ${cx - halfMouth - flex} ${mouthY} A ${halfMouth + flex} ${12 - flex * 0.6} 0 0 0 ${cx + halfMouth + flex} ${mouthY}`}
        fill="none"
        stroke="#c9ced8"
        strokeWidth={1.6}
      />

      {/* Clapper */}
      <Line x1={cx} y1={topY + 10} x2={cx} y2={mouthY - 14} stroke="#8a8f99" strokeWidth={2} />
      <Circle cx={cx} cy={mouthY - 10} r={7} fill="#4a4e57" stroke="#8a8f99" strokeWidth={1.2} />

      {/* The four nodal meridians: the places on the rim that stay still while the rest flexes */}
      {[-0.7, -0.24, 0.24, 0.7].map((t) => (
        <Circle key={t} cx={cx + t * halfMouth} cy={mouthY + 5 - Math.abs(t) * 3} r={3} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

type SystemId = 'string' | 'pipe' | 'water' | 'speaker' | 'bells' | 'levitation';
const SYSTEMS: {
  id: SystemId;
  title: string;
  short: string;
  vibrates: string;
  pattern: string;
  family: string;
  harmonic: boolean | null;
  label: string;
  /** What the drawing on the stage is showing, for the MODE / NODES readouts. */
  modeLabel?: string;
  nodesLabel?: string;
  link?: { label: string; go: (nav: NativeStackNavigationProp<RootStackParamList>) => void };
}[] = [
  { id: 'string', title: 'A string', short: 'Strng', vibrates: 'the string itself, transversely, fixed at both ends', pattern: 'the standing wave: still points (nodes) and swinging loops (antinodes) along its length', family: 'harmonic series f, 2f, 3f… — this is why a string has a pitch', harmonic: true, label: 'CALCULATED — standing wave on the amplitude ramp' },
  { id: 'pipe', title: 'An air column', short: 'Pipe', vibrates: 'the air inside a pipe, longitudinally — pressure rising and falling', pattern: 'pressure nodes and antinodes along the pipe; a flame or cork dust along the tube shows them', family: 'harmonic (open pipe) or odd harmonics only (closed at one end)', harmonic: true, label: 'CALCULATED — pressure standing wave, open pipe' },
  { id: 'water', title: 'A water surface', short: 'Water', vibrates: 'the free surface of a liquid, driven vertically', pattern: 'Faraday standing waves at HALF the drive frequency once a threshold is passed', family: 'container modes or a bulk lattice — the Liquid Studio', harmonic: false, label: 'CALCULATED / APPROXIMATED — in the Liquid Studio', modeLabel: 'Faraday f/2', nodesLabel: '7', link: { label: 'Open the Liquid Studio ›', go: (nav) => nav.navigate('CymaticsLiquidStudio', {}) } },
  { id: 'speaker', title: 'A loudspeaker with particles on it', short: 'Spkr', vibrates: 'a stiff cone meant to move as one piston — and, above breakup, the cone flexing in modes', pattern: 'grains on a cone dance in the antinodes and gather where the cone is still; below breakup that is nowhere', family: 'piston, then bell-like radial modes — the Membrane & Loudspeaker Studio', harmonic: false, label: 'ILLUSTRATIVE / CALCULATED — in the Loudspeaker view', modeLabel: 'breakup', nodesLabel: 'rim·mid·apex', link: { label: 'Open the Loudspeaker ›', go: (nav) => nav.navigate('CymaticsMembraneStudio', { preset: 'speaker-breakup' }) } },
  { id: 'bells', title: 'Bells, gongs and cymbals', short: 'Bells', vibrates: 'a curved shell — plate-like modes wrapped around a curve', pattern: 'nodal meridians and circles; a bell’s hum, prime, tierce, quint and nominal are its lowest modes', family: 'inharmonic, tuned by the founder toward near-harmonic partials — try the bell plate and the ring in the Plate Studio', harmonic: false, label: 'APPROXIMATED — bell plate and ring in the Plate Studio', modeLabel: '(2,0) hum', nodesLabel: '4 meridians', link: { label: 'Open the Plate Studio ›', go: (nav) => nav.navigate('CymaticsPlateStudio', {}) } },
  { id: 'levitation', title: 'Acoustic levitation', short: 'Levit', vibrates: 'the air between a transducer and a reflector, as a standing wave', pattern: 'small beads hang at the pressure nodes, a half-wavelength apart', family: 'a one-dimensional standing wave — the same nodes as the pipe', harmonic: null, label: 'ILLUSTRATIVE — a 40 kHz standing wave, beads at the nodes', modeLabel: '5 nodes', nodesLabel: '4 beads' },
];

export function SystemsModule({ focused, help }: CymaticsModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sys, setSys] = useState<SystemId>('string');
  const [n, setN] = useState(2);
  const s = SYSTEMS.find((x) => x.id === sys)!;
  const hasHarmonic = sys === 'string' || sys === 'pipe';

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'system',
      label: 'SYSTEM',
      valueLabel: s.short,
      options: SYSTEMS.map((x) => ({ id: x.id, label: x.title, blurb: `What vibrates: ${x.vibrates}.` })),
      selectedId: sys,
      onSelect: (id) => setSys(id as SystemId),
      sticky: true,
      helpKey: 'systems',
    },
    ...(hasHarmonic
      ? [
          {
            kind: 'fader',
            id: 'harmonic',
            label: 'HARMONIC',
            value: (n - 1) / 4,
            onChange: (v: number) => setN(1 + Math.round(Math.max(0, Math.min(1, v)) * 4)),
            format: () => (n === 1 ? 'fundamental · 1 loop' : `${n}f · ${n} loops · ${n + 1} nodes`),
            formatShort: () => (n === 1 ? 'fund' : `${n}f`),
            helpKey: 'systems',
          } as DockParam,
        ]
      : []),
  ];

  return (
    <CymaticsRackLayout
      rack={{
        size: 'M',
        badge: s.label,
        onHelp: help,
        onGuide: () => help('systems'),
        initialParam: 'harmonic',
        bezel: [
          { k: 'SYSTEM', v: s.short.toUpperCase(), helpKey: 'systems' },
          // ── NO MORE EM-DASHES (2026-09-18, design review #6) ────────────────
          // These two cells read "—" for the three systems that now have a
          // drawing on the stage. A live picture beside two blank readouts
          // looks like the readouts are broken; each drawing states the mode
          // it is actually showing.
          { k: 'MODE', v: hasHarmonic ? (n === 1 ? 'fund.' : `${n}f`) : (s.modeLabel ?? '—'), helpKey: 'systems' },
          { k: 'NODES', v: hasHarmonic ? `${n + 1}` : (s.nodesLabel ?? '—'), helpKey: 'systems' },
          { k: 'FAMILY', v: s.harmonic === null ? '1-D wave' : s.harmonic ? 'HARMONIC' : 'INHARM.', tint: s.harmonic === null ? undefined : s.harmonic ? '#37e05f' : '#ff6b5e', helpKey: 'harmonics', flex: 1.2 },
        ],
        stage: (w, h) =>
          sys === 'string' ? (
            <StringDemo w={w} h={h} n={n} running={focused} />
          ) : sys === 'pipe' ? (
            <PipeDemo w={w} h={h} n={n} running={focused} />
          ) : sys === 'levitation' ? (
            <LevitationDemo w={w} h={h} running={focused} />
          ) : (
            // The drawing takes the stage; the pointer to the full studio sits
            // under it rather than in place of it.
            <View style={{ width: w, height: h }}>
              <View style={{ flex: 1 }}>
                {sys === 'water' ? (
                  <WaterDemo w={w} h={h - 34} running={focused} />
                ) : sys === 'speaker' ? (
                  <SpeakerDemo w={w} h={h - 34} running={focused} />
                ) : (
                  <BellDemo w={w} h={h - 34} running={focused} />
                )}
              </View>
              {s.link ? (
                <Pressable
                  onPress={() => s.link!.go(navigation)}
                  style={[styles.go, styles.goStage]}
                  accessibilityRole="button"
                  accessibilityLabel={s.link.label}
                >
                  <Text style={styles.goText}>{s.link.label.toUpperCase()}</Text>
                </Pressable>
              ) : null}
            </View>
          ),
        params,
      }}
      caption="Open SYSTEM and step through what vibrates in each; for the string and the pipe, ride HARMONIC and count the nodes."
    >
      <Text style={P.body}>
        Plates and dishes are two of many things that show their vibration. In every case the pattern is the set of places that stay still —
        the nodes — of one of the system’s own modes. What differs is <Text style={P.strong}>what</Text> vibrates and whether its modes are harmonic.
      </Text>
      <View style={P.card}>
        <Text style={P.strong}>{s.title}</Text>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>What vibrates: </Text>{s.vibrates}.</Text></View>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>The visible pattern: </Text>{s.pattern}.</Text></View>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>Mode family: </Text>{s.family}.</Text></View>
        {sys === 'string' ? <Text style={P.caption}>Harmonic {n}: {n} loop{n === 1 ? '' : 's'}, {n + 1} still points including the ends. The blue dots are the nodes — a finger touched there lets the harmonic ring on.</Text> : null}
        {sys === 'pipe' ? <Text style={P.caption}>Open at both ends, the pressure has nodes at the ends and {n === 1 ? 'one antinode' : `${n - 1} more nodes`} inside. Close one end and only the odd modes survive.</Text> : null}
        {sys === 'levitation' ? <Text style={P.caption}>At 40 kHz the half-wavelength is ≈ 4.3 mm: the beads sit a half-wave apart, held where the pressure amplitude is smallest.</Text> : null}
        {s.link ? <View style={P.chips}><LabChip label={s.link.label} selected={false} onPress={() => s.link!.go(navigation)} /></View> : null}
      </View>
      <Text style={P.h}>WHAT THEY ALL SHARE</Text>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Stable patterns appear only at the system’s own resonances — never at an arbitrary frequency.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>The pattern marks the NODES: where the medium stands still, sand rests, beads hang, a flame is quiet.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Strings and air columns are harmonic, so they have a pitch; membranes, plates, bells and dishes are not, unless something (a kettle, a bell-founder) pulls their modes toward integers.</Text></View>
    </CymaticsRackLayout>
  );
}

const styles = StyleSheet.create({
  go: { borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)', paddingHorizontal: 14, paddingVertical: 9 },
  /** On the stage the link is a footer under the drawing, not a centred button. */
  goStage: { alignSelf: 'center', paddingVertical: 6, marginBottom: 4 },
  goText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.amber },
});
