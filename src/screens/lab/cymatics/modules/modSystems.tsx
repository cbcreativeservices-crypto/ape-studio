/**
 * Module — Other Cymatic Systems (spec §3 item 8, Phase 3): strings, air
 * columns, water surfaces, a loudspeaker with particles, bells / gongs /
 * cymbals, acoustic levitation — for each, WHAT is actually vibrating, what
 * the visible pattern is, and which mode family it belongs to. Small live
 * drawings where the physics is cheap (a string's harmonic, a pipe's pressure
 * nodes, a standing-wave levitator); links into the studios where it is not.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../../features/tools/levelColor';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { RootStackParamList } from '../../../../navigation/types';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { P } from './shared';

const STOPS = WAVE_LEVEL_STOPS.map((s) => ({ offset: `${Math.round(s.offset * 100)}%`, color: s.color }));

/** A string's n-th harmonic as a standing wave, strobed. */
function StringDemo({ width, n, phase }: { width: number; n: number; phase: number }) {
  const h = 72;
  const amp = 22;
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const x = 14 + u * (width - 28);
      const y = h / 2 - Math.sin(n * Math.PI * u) * Math.cos(phase) * amp;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [width, n, phase]);
  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgGradient id="strg" x1="0" y1={h / 2 - amp} x2="0" y2={h / 2 + amp} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
      </Defs>
      <Rect x={6} y={h / 2 - 16} width={8} height={32} fill="#3a3a42" />
      <Rect x={width - 14} y={h / 2 - 16} width={8} height={32} fill="#3a3a42" />
      <Line x1={14} y1={h / 2} x2={width - 14} y2={h / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#strg)" strokeWidth={2.2} fill="none" />
      {Array.from({ length: n + 1 }, (_, k) => k).map((k) => (
        <Circle key={k} cx={14 + (k / n) * (width - 28)} cy={h / 2} r={3.2} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

/** An open pipe's pressure standing wave (n-th mode) — nodes where a probe reads silence. */
function PipeDemo({ width, n, phase }: { width: number; n: number; phase: number }) {
  const h = 84;
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const x = 14 + u * (width - 28);
      const y = h / 2 - Math.sin(n * Math.PI * u) * Math.cos(phase) * 22;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [width, n, phase]);
  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgGradient id="pipg" x1="0" y1={h / 2 - 22} x2="0" y2={h / 2 + 22} gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
      </Defs>
      <Rect x={14} y={12} width={width - 28} height={h - 24} rx={4} fill="none" stroke="#6a6a74" strokeWidth={2} />
      <Line x1={14} y1={h / 2} x2={width - 14} y2={h / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#pipg)" strokeWidth={2.2} fill="none" />
      {Array.from({ length: n + 1 }, (_, k) => k).map((k) => (
        <Circle key={k} cx={14 + (k / n) * (width - 28)} cy={h / 2} r={3.2} fill={MIDLINE_BLUE} />
      ))}
    </Svg>
  );
}

/** Acoustic levitation: a standing wave between a transducer and a reflector holds beads at the pressure nodes. */
function LevitationDemo({ width, phase }: { width: number; phase: number }) {
  const h = 150;
  const n = 5;
  const d = useMemo(() => {
    let s = '';
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const y = 18 + u * (h - 36);
      const x = width / 2 + Math.sin(n * Math.PI * u) * Math.cos(phase) * 26;
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [width, phase]);
  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgGradient id="levg" x1={width / 2 - 26} y1="0" x2={width / 2 + 26} y2="0" gradientUnits="userSpaceOnUse">
          {STOPS.map((s, k) => (
            <Stop key={k} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGradient>
      </Defs>
      <Rect x={width / 2 - 34} y={4} width={68} height={14} rx={3} fill="#3a3a42" stroke="#6a6a74" />
      <Rect x={width / 2 - 34} y={h - 18} width={68} height={14} rx={3} fill="#3a3a42" stroke="#6a6a74" />
      <Line x1={width / 2} y1={18} x2={width / 2} y2={h - 18} stroke={MIDLINE_BLUE} strokeWidth={1} />
      <Path d={d} stroke="url(#levg)" strokeWidth={2} fill="none" />
      {Array.from({ length: n - 1 }, (_, k) => k + 1).map((k) => (
        <Circle key={k} cx={width / 2} cy={18 + (k / n) * (h - 36)} r={4} fill="#efe2b8" stroke="#8a7a50" />
      ))}
    </Svg>
  );
}

type SystemId = 'string' | 'pipe' | 'water' | 'speaker' | 'bells' | 'levitation';
const SYSTEMS: { id: SystemId; title: string; vibrates: string; pattern: string; family: string; label: string }[] = [
  { id: 'string', title: 'A string', vibrates: 'the string itself, transversely, fixed at both ends', pattern: 'the standing wave: still points (nodes) and swinging loops (antinodes) along its length', family: 'harmonic series f, 2f, 3f… — this is why a string has a pitch', label: 'CALCULATED' },
  { id: 'pipe', title: 'An air column', vibrates: 'the air inside a pipe, longitudinally — pressure rising and falling', pattern: 'pressure nodes and antinodes along the pipe; a flame or cork dust along the tube shows them', family: 'harmonic (open pipe) or odd harmonics only (closed at one end)', label: 'CALCULATED' },
  { id: 'water', title: 'A water surface', vibrates: 'the free surface of a liquid, driven vertically', pattern: 'Faraday standing waves at HALF the drive frequency once a threshold is passed', family: 'container modes or a bulk lattice — the Liquid Studio', label: 'CALCULATED / APPROXIMATED' },
  { id: 'speaker', title: 'A loudspeaker with particles on it', vibrates: 'a stiff cone meant to move as one piston — and, above breakup, the cone flexing in modes', pattern: 'grains on a cone dance in the antinodes and gather where the cone is still; below breakup that is nowhere', family: 'piston, then bell-like radial modes — the Membrane & Loudspeaker Studio', label: 'ILLUSTRATIVE / CALCULATED' },
  { id: 'bells', title: 'Bells, gongs and cymbals', vibrates: 'a curved shell — plate-like modes wrapped around a curve', pattern: 'nodal meridians and circles; a bell’s hum, prime, tierce, quint and nominal are its lowest modes', family: 'inharmonic, tuned by the founder toward near-harmonic partials — try the bell plate and the ring in the Plate Studio', label: 'APPROXIMATED' },
  { id: 'levitation', title: 'Acoustic levitation', vibrates: 'the air between a transducer and a reflector, as a standing wave', pattern: 'small beads hang at the pressure nodes, a half-wavelength apart', family: 'a one-dimensional standing wave — the same nodes as the pipe', label: 'ILLUSTRATIVE' },
];

export function SystemsModule({ width, focused, help }: CymaticsModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sys, setSys] = useState<SystemId>('string');
  const [n, setN] = useState(2);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!focused) return;
    const id = setInterval(() => setPhase((p) => (p + 0.35) % (2 * Math.PI)), 100);
    return () => clearInterval(id);
  }, [focused]);
  const s = SYSTEMS.find((x) => x.id === sys)!;
  const inner = width - 26;

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Plates and dishes are two of many things that show their vibration. In every case the pattern is the set of places that stay still
        — the nodes — of one of the system’s own modes. What differs is <Text style={P.strong}>what</Text> vibrates and whether its modes are harmonic.
      </Text>
      <View style={P.chips}>
        {SYSTEMS.map((x) => (
          <LabChip key={x.id} label={x.title} selected={sys === x.id} onPress={() => setSys(x.id)} onLongPress={() => help('systems')} />
        ))}
      </View>
      <View style={P.card}>
        <Text style={P.strong}>{s.title}</Text>
        {sys === 'string' || sys === 'pipe' ? (
          <View style={P.chips}>
            {[1, 2, 3, 4, 5].map((k) => (
              <LabChip key={k} label={`${k === 1 ? 'fundamental' : `${k}f`}`} selected={n === k} onPress={() => setN(k)} />
            ))}
          </View>
        ) : null}
        <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#0b0b10' }}>
          {sys === 'string' ? <StringDemo width={inner} n={n} phase={phase} /> : null}
          {sys === 'pipe' ? <PipeDemo width={inner} n={n} phase={phase} /> : null}
          {sys === 'levitation' ? <LevitationDemo width={inner} phase={phase} /> : null}
          {sys === 'water' || sys === 'speaker' || sys === 'bells' ? (
            <View style={{ padding: 12, gap: 8 }}>
              <Text style={P.caption}>{sys === 'water' ? 'The full simulation lives in the Liquid Studio.' : sys === 'speaker' ? 'The full simulation lives in the Membrane & Loudspeaker Studio.' : 'Bell-like shapes live in the Plate Studio: try BELL PLATE and RING · CLAMPED HUB.'}</Text>
              <View style={P.chips}>
                {sys === 'water' ? <LabChip label="Open the Liquid Studio ›" selected={false} onPress={() => navigation.navigate('CymaticsLiquidStudio', {})} /> : null}
                {sys === 'speaker' ? <LabChip label="Open the Loudspeaker ›" selected={false} onPress={() => navigation.navigate('CymaticsMembraneStudio', { preset: 'speaker-breakup' })} /> : null}
                {sys === 'bells' ? <LabChip label="Open the Plate Studio ›" selected={false} onPress={() => navigation.navigate('CymaticsPlateStudio', {})} /> : null}
              </View>
            </View>
          ) : null}
          <Text style={[P.badge, { position: 'absolute', right: 8, bottom: 6 }]}>{s.label}</Text>
        </View>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>What vibrates: </Text>{s.vibrates}.</Text></View>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>The visible pattern: </Text>{s.pattern}.</Text></View>
        <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}><Text style={P.strong}>Mode family: </Text>{s.family}.</Text></View>
        {sys === 'string' ? <Text style={P.caption}>Harmonic {n}: {n} loop{n === 1 ? '' : 's'}, {n + 1} still points including the ends. The blue dots are the nodes — a finger touched there lets the harmonic ring on.</Text> : null}
        {sys === 'pipe' ? <Text style={P.caption}>Open at both ends, the pressure has nodes at the ends and {n === 1 ? 'one antinode' : `${n - 1} more nodes`} inside. Close one end and only the odd modes survive.</Text> : null}
        {sys === 'levitation' ? <Text style={P.caption}>At 40 kHz the half-wavelength is ≈ 4.3 mm: the beads sit a half-wave apart. The pressure amplitude drawn here is on the Academy ramp; the beads are held where it is smallest.</Text> : null}
      </View>
      <Text style={P.h}>WHAT THEY ALL SHARE</Text>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Stable patterns appear only at the system’s own resonances — never at an arbitrary frequency.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>The pattern marks the NODES: where the medium stands still, sand rests, beads hang, a flame is quiet.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Strings and air columns are harmonic, so they have a pitch; membranes, plates, bells and dishes are not, unless something (a kettle, a bell-founder) pulls their modes toward integers.</Text></View>
      <Pressable onPress={() => help('systems')} accessibilityRole="button" accessibilityLabel="Open the lesson for other cymatic systems">
        <Text style={P.badge}>ⓘ LONG-PRESS A SYSTEM FOR ITS LESSON</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({});
void styles;
void colors;
void fonts;
