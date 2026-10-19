/**
 * keyArt — Screen 14's plots, drawn from the same maths the audio runs
 * (model/djKey): the PITCH-vs-TEMPO plot (semitones against the tempo
 * fader: 12·log2(1 + t) with key lock off, flat at the key shift with it
 * on) with the deck's own point, and a CHROMATIC KEY STRIP (twelve equal
 * semitone columns, black and white like a piano's) with each deck's tonic
 * where it SOUNDS — a fraction of a semitone off sits between two columns.
 * Screen points; text ≥ 9.5 pt.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { SceneText } from './sceneText';
import { NOTE_NAMES } from '../model/djKey';
import type { Box } from '../geometry/boothGeometry';

function Frame({ b, title, k }: { b: Box; title: string; k: number }) {
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={9.5 * k} text={title} color={INK.amber} face="label" minPt={9.5} />
    </Group>
  );
}

/** Semitones (y) against the tempo change in % (x), ±range. */
export function PitchPlot({ b, pitch, range, keyLock, shift, k = 1 }: { b: Box; pitch: number; range: number; keyLock: boolean; shift: number; k?: number }) {
  const inner = { x: b.x + 26 * k, y: b.y + 20 * k, w: b.w - 34 * k, h: b.h - 34 * k };
  const ST = 3.5;
  const xOf = (pc: number) => inner.x + ((pc + range) / (2 * range)) * inner.w;
  const yOf = (st: number) => inner.y + ((ST - Math.max(-ST, Math.min(ST, st))) / (2 * ST)) * inner.h;
  const curve = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i <= 80; i++) {
      const pc = -range + (2 * range * i) / 80;
      const st = 12 * Math.log2(1 + pc / 100) + shift;
      if (i === 0) p.moveTo(xOf(pc), yOf(st));
      else p.lineTo(xOf(pc), yOf(st));
    }
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, shift, inner.x, inner.y, inner.w, inner.h]);
  const st = keyLock ? shift : 12 * Math.log2(1 + pitch / 100) + shift;
  const fs = 9.5 * k;
  return (
    <Group>
      <Frame b={b} title="PITCH vs TEMPO · DECK B" k={k} />
      {[-3, -2, -1, 1, 2, 3].map((s) => (
        <Line key={s} p1={vec(inner.x, yOf(s))} p2={vec(inner.x + inner.w, yOf(s))} color="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      <Line p1={vec(inner.x, yOf(0))} p2={vec(inner.x + inner.w, yOf(0))} color="rgba(255,255,255,0.25)" strokeWidth={1} />
      <Line p1={vec(xOf(0), inner.y)} p2={vec(xOf(0), inner.y + inner.h)} color="rgba(255,255,255,0.18)" strokeWidth={1} />
      {/* key lock OFF: the pitch follows the speed */}
      <Path path={curve} style="stroke" strokeWidth={keyLock ? 1.4 : 2.4} color={keyLock ? 'rgba(244,246,248,0.35)' : INK.white} />
      {/* key lock ON: flat at the key shift */}
      <Line p1={vec(inner.x, yOf(shift))} p2={vec(inner.x + inner.w, yOf(shift))} color={INK.blue} strokeWidth={keyLock ? 2.4 : 1.2} opacity={keyLock ? 1 : 0.4} />
      <Circle cx={xOf(pitch)} cy={yOf(st)} r={7} color={keyLock ? INK.blue : INK.white} opacity={0.35}>
        <BlurMask blur={4} style="normal" />
      </Circle>
      <Circle cx={xOf(pitch)} cy={yOf(st)} r={4} color={keyLock ? INK.blue : INK.white} />
      <SceneText x={inner.x - 4} y={yOf(2) + 3.5} size={fs} text="+2" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={inner.x - 4} y={yOf(0) + 3.5} size={fs} text="0" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={inner.x - 4} y={yOf(-2) + 3.5} size={fs} text="−2" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={inner.x} y={b.y + b.h - 4} size={fs} text={`−${range}%`} color={INK.printDim} minPt={9.5} />
      <SceneText x={xOf(0)} y={b.y + b.h - 4} size={fs} text="TEMPO" color={INK.printDim} align="center" minPt={9.5} />
      <SceneText x={inner.x + inner.w} y={b.y + b.h - 4} size={fs} text={`+${range}%`} color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={b.x + b.w - 8} y={b.y + 13 * k} size={fs} text="SEMITONES" color={INK.printDim} face="label" align="right" minPt={9.5} />
      <SceneText x={inner.x + inner.w - 2} y={yOf(12 * Math.log2(1 + range / 100) + shift) - 5} size={fs} text="LOCK OFF" color={INK.white} face="label" align="right" minPt={9.5} />
      <SceneText x={inner.x + inner.w - 2} y={yOf(shift) + 13 * k} size={fs} text="LOCK ON" color={INK.blue} face="label" align="right" minPt={9.5} />
    </Group>
  );
}

/** One octave, twelve equal columns; markers at each deck's sounding tonic. */
export function KeyStrip({ b, a, bTonic, aWord, bWord, relation, k = 1 }: { b: Box; a: number | null; bTonic: number | null; aWord: string; bWord: string; relation: string; k?: number }) {
  const inner = { x: b.x + 8, y: b.y + 34 * k, w: b.w - 16, h: b.h - 50 * k };
  const col = inner.w / 12;
  const xOf = (pc: number) => inner.x + (((pc % 12) + 12) % 12 + 0.5) * col;
  const fs = 9.5 * k;
  const black = [1, 3, 6, 8, 10];
  const tri = (x: number, y: number, up: boolean) => {
    const p = Skia.PathBuilder.Make();
    const s = 6 * k;
    p.moveTo(x, y);
    p.lineTo(x - s, up ? y + s * 1.4 : y - s * 1.4);
    p.lineTo(x + s, up ? y + s * 1.4 : y - s * 1.4);
    p.close();
    return p.detach();
  };
  const bad = relation === 'OUT OF TUNE';
  return (
    <Group>
      <Frame b={b} title="WHERE EACH TONIC SOUNDS" k={k} />
      <SceneText x={b.x + b.w - 8} y={b.y + 13 * k} size={fs} text={relation} color={bad ? INK.red : INK.green} face="label" align="right" minPt={9.5} />
      {Array.from({ length: 12 }, (_, i) => (
        <Group key={i}>
          <RoundedRect x={inner.x + i * col + 1} y={inner.y} width={col - 2} height={inner.h} r={2} color={black.includes(i) ? '#17181c' : '#c9ccd2'} />
          <SceneText x={inner.x + (i + 0.5) * col} y={inner.y + 12 * k} size={fs} text={NOTE_NAMES[i]} color={black.includes(i) ? INK.print : '#2a2c31'} face="label" align="center" minPt={9.5} />
        </Group>
      ))}
      {a != null ? (
        <Group>
          <Path path={tri(xOf(a), inner.y - 2, false)} color={INK.white} />
          <SceneText x={xOf(a)} y={inner.y - 12 * k} size={fs} text="A" color={INK.white} face="label" align="center" minPt={9.5} />
        </Group>
      ) : null}
      {bTonic != null ? (
        <Group>
          <Line p1={vec(xOf(bTonic), inner.y + 17 * k)} p2={vec(xOf(bTonic), inner.y + inner.h)} color={bad ? INK.red : INK.blue} strokeWidth={2.4} />
          <Path path={tri(xOf(bTonic), inner.y + inner.h + 2, true)} color={bad ? INK.red : INK.blue} />
        </Group>
      ) : null}
      <SceneText x={b.x + 8} y={b.y + 27 * k} size={fs} text={`A · ${aWord}`} color={INK.white} face="label" minPt={9.5} />
      <SceneText x={b.x + b.w - 8} y={b.y + 27 * k} size={fs} text={`B · ${bWord.replace(' st', '')}`} color={bad ? INK.red : INK.blue} face="label" align="right" minPt={9.5} />
    </Group>
  );
}
