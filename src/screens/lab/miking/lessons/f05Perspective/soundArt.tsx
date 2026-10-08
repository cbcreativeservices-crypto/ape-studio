/**
 * F05 FOLEY PERSPECTIVE — MEET IT's pictures (LESSON_JOURNEY §6 stage 1):
 *
 *   StrikeSequence  the key ring's one action in four events — group 1's F03
 *                   PropStrike (the same keys), reused, not copied
 *   CoupledHeads    NEAR OR FAR (copy.sound.pair), from above: the keys on the
 *                   marked path, the close mic and the room mic; the straight
 *                   path to each and two reflections off the back wall and the
 *                   side wall — the close mic hears mostly the direct sound,
 *                   the room mic the same direct sound later and weaker, with
 *                   the reflections close behind it. SWING carries the keys
 *                   along the path. Where the sound goes, never its level.
 * Static (D8): the learner's finger moves SWING.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { SoundCanvas } from '../shared/smallperc/soundKit';
import { KeyRing } from '../shared/foley/props';
import { StageFloorPlan } from '../shared/foley/StageArt';
import { MikingMicArt, ShotgunMountMic } from '../../../../../features/lab/micDrawings';
import { PathMarks } from './art';
import { HALF_PATH } from './geometry.ts';
import { F05_ZONES } from './model.ts';

export { PropStrike as KeysStrike } from '../f03Props/soundArt';

const BOX = { u0: -2000, u1: 3500, v0: -2200, v1: 2200 };
/** The walls the reflections come from (a drawing default, the stage room). */
const BACK_X = -1700;
const SIDE_Z = 2100;
const AMBER = '#ffc64d';
const BLUE = '#8fbcff';

const pose = (id: string) => F05_ZONES.find((z) => z.id === id)!.start;

export function NearFarKeys({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const near = mode === 'together';
  const kz = Math.max(-1, Math.min(1, swing)) * HALF_PATH;
  const close = pose('f05.mono').p;
  const room = pose('f05.room').p;
  const g = useMemo(() => {
    const mic = near ? close : room;
    const direct = Skia.Path.Make();
    direct.moveTo(0, kz);
    direct.lineTo(mic.x, mic.z);
    // Reflections: the image of the keys in each wall, the straight line from
    // that image to the mic, drawn from its wall point on.
    const refl = Skia.Path.Make();
    const via = (img: { x: number; z: number }, wall: 'x' | 'z') => {
      const t = wall === 'x' ? (BACK_X - img.x) / (mic.x - img.x) : (SIDE_Z - img.z) / (mic.z - img.z);
      const px = img.x + t * (mic.x - img.x);
      const pz = img.z + t * (mic.z - img.z);
      refl.moveTo(0, kz);
      refl.lineTo(px, pz);
      refl.lineTo(mic.x, mic.z);
    };
    via({ x: 2 * BACK_X, z: kz }, 'x');
    via({ x: 0, z: 2 * SIDE_Z - kz }, 'z');
    const walls = Skia.Path.Make();
    walls.moveTo(BACK_X, BOX.v0);
    walls.lineTo(BACK_X, BOX.v1);
    walls.moveTo(BOX.u0, SIDE_Z);
    walls.lineTo(BOX.u1, SIDE_Z);
    return { direct, refl, walls };
  }, [near, kz, close, room]);
  const micRot = (p: { x: number; z: number }) => Math.atan2(-(kz - p.z), -(0 - p.x)) - Math.PI / 2;
  const labels: StaticLabel[] = [
    { id: 'keys', text: 'KEYS', u: 260, v: kz - 120, align: 'left', tone: 'amber' },
    { id: 'close', text: near ? 'CLOSE MIC · MOSTLY DIRECT' : 'CLOSE MIC', short: 'CLOSE', u: close.x + 120, v: close.z + 320, align: 'left', tone: near ? 'amber' : 'muted' },
    { id: 'room', text: near ? 'ROOM MIC' : 'ROOM MIC · LATER, WITH THE ROOM', short: 'ROOM', u: room.x, v: room.z - 330, align: 'center', tone: near ? 'muted' : 'amber' },
    { id: 'wall', text: 'STAGE WALLS', short: 'WALLS', u: BACK_X + 120, v: SIDE_Z - 160, align: 'left', tone: 'muted' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={BOX} label={accessibilityLabel} labels={labels}>
      <StageFloorPlan u0={BOX.u0} u1={BOX.u1} v0={BOX.v0} v1={BOX.v1} />
      <PathMarks />
      <Path path={g.walls} style="stroke" strokeWidth={60} color="#6b6e76" />
      <Path path={g.refl} style="stroke" strokeWidth={14} color={BLUE} opacity={near ? 0.35 : 0.85}>
        <DashPathEffect intervals={[70, 50]} />
      </Path>
      <Path path={g.direct} style="stroke" strokeWidth={22} strokeCap="round" color={AMBER} opacity={0.9} />
      {[close, room].map((p, i) => (
        <Group key={i} transform={[{ translateX: p.x }, { translateY: p.z }, { rotate: micRot(p) }, { scale: 2.2 }]} opacity={(i === 0) === near ? 1 : 0.5}>
          {i === 0 ? <ShotgunMountMic r={9.5} len={50} fore={200} mount={false} /> : <MikingMicArt art="sideLdc" r={59} len={80} cross={118} />}
        </Group>
      ))}
      <Group transform={[{ translateY: kz }, { scale: 3 }]}>
        <KeyRing view="top" />
      </Group>
    </SoundCanvas>
  );
}
