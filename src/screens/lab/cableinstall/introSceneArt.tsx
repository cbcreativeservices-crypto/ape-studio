/**
 * introSceneArt — the lab's opening scene, rebuilt in Skia (owner 2026-08-25).
 *
 * WHAT CHANGED AND WHY: this scene used to be outline rectangles with a flat
 * green line, a flat cyan line and a flat red line drawn through them. It was
 * the first thing a student saw, and it taught them nothing about the objects —
 * "an abstract covered line on the screen does not substitute for a cable."
 * Same composition, same install-itself choreography, same accessibility label;
 * every object now drawn as the object (see `cableArt.tsx`).
 *
 * The stage still reads left-to-right as real work: stage box → floor run under
 * a protector → wall raceway → conduit riser → ceiling tray → rack, with the
 * power feed deliberately arriving on the far side, separated from the signal.
 *
 * MOTION is unchanged in feel: structure fades up in layers, then each run
 * installs itself along its route in work order, via `Cable`'s `reveal` (Skia
 * path trimming) rather than strokeDashoffset. Reduced motion lands every run
 * fully installed on first paint.
 */
import { useEffect, useMemo } from 'react';
import { Canvas, Group, RoundedRect, Rect, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import { Easing, useSharedValue, withDelay, withTiming, cancelAnimation } from 'react-native-reanimated';
import {
  Cable,
  CableTray,
  Conduit,
  ConnectorEnd,
  FloorProtector,
  JHook,
  ZipTieSide,
  catenary,
} from './cableArt';

const VW = 360;
const VH = 200;

/** One run's install timing: when it starts and how long it takes to land. */
type RunSpec = { delay: number; dur: number };

function useReveal({ delay, dur }: RunSpec, run: boolean, reduce: boolean) {
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(v);
    if (reduce) {
      v.value = 1;
      return;
    }
    if (!run) {
      v.value = 0;
      return;
    }
    v.value = 0;
    v.value = withDelay(delay, withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduce, delay, dur]);
  return v;
}

/** Structure fades up in layers before anything is pulled. */
function useFade(delay: number, run: boolean, reduce: boolean) {
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(v);
    if (reduce) {
      v.value = 1;
      return;
    }
    v.value = 0;
    v.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduce, delay]);
  return v;
}

export function IntroSceneArt({ w, run, reduce }: { w: number; run: boolean; reduce: boolean }) {
  const h = Math.round(w * (VH / VW));
  const k = w / VW;

  const fStructure = useFade(0, run, reduce);
  const fPathway = useFade(80, run, reduce);
  const fGear = useFade(150, run, reduce);
  const fProtect = useFade(700, run, reduce);

  const rTray1 = useReveal({ delay: 210, dur: 760 }, run, reduce);
  const rTray2 = useReveal({ delay: 280, dur: 760 }, run, reduce);
  const rDrop = useReveal({ delay: 620, dur: 300 }, run, reduce);
  const rRaceway = useReveal({ delay: 360, dur: 420 }, run, reduce);
  const rFloor = useReveal({ delay: 430, dur: 620 }, run, reduce);
  const rFloor2 = useReveal({ delay: 600, dur: 420 }, run, reduce);
  const rPower = useReveal({ delay: 740, dur: 620 }, run, reduce);

  // Routes, authored as waypoints so every turn has a real bend radius.
  const trayRunA = useMemo(
    () => [
      { x: 40, y: 34 },
      { x: 140, y: 35.5 },
      { x: 250, y: 34 },
      { x: 276, y: 36 },
      { x: 292, y: 48 },
    ],
    [],
  );
  const trayRunB = useMemo(
    () => [
      { x: 40, y: 41 },
      { x: 140, y: 42.5 },
      { x: 248, y: 41 },
      { x: 280, y: 44 },
      { x: 300, y: 58 },
    ],
    [],
  );
  // Into the raceway and away up the riser. The run stops at the elbow because
  // from there it is INSIDE the conduit — drawing a cable over an opaque tube
  // is the kind of shortcut that teaches the wrong mental model.
  const racewayRun = useMemo(
    () => [
      { x: 28, y: 107 },
      { x: 70, y: 107.6 },
      { x: 108, y: 107 },
      { x: 122, y: 105.5 },
    ],
    [],
  );
  const floorRun = useMemo(
    () => [
      { x: 40, y: 152 },
      { x: 66, y: 154 },
      { x: 84, y: 164 },
      { x: 130, y: 165 },
      { x: 186, y: 165 },
    ],
    [],
  );
  const floorRun2 = useMemo(
    () => [
      { x: 186, y: 165 },
      { x: 240, y: 165 },
      { x: 282, y: 164 },
      { x: 296, y: 158 },
    ],
    [],
  );
  // The mains feed comes up the far wall, deliberately away from the signal and
  // BESIDE the rack rather than across its face — crossing the gear would read
  // as exactly the mistake this lab teaches against.
  const powerRun = useMemo(
    () => [
      { x: 356, y: 168 },
      { x: 356, y: 140 },
      { x: 355, y: 112 },
      { x: 353, y: 94 },
    ],
    [],
  );
  // A service loop at the rack — slack left on purpose for the next technician.
  const serviceLoop = useMemo(() => catenary({ x: 292, y: 48 }, { x: 300, y: 58 }, 9, 6), []);

  return (
    <Canvas
      style={{ width: w, height: h }}
      accessibilityLabel="Installation scene: stage, floor run, wall pathway, ceiling tray and equipment rack"
    >
      <Group transform={[{ scaleX: k }, { scaleY: k }]}>
        <RoundedRect x={0} y={0} width={VW} height={VH} r={12} color="#101014" />

        {/* ── structure: ceiling and floor planes ── */}
        <Group opacity={fStructure}>
          <Rect x={0} y={24} width={VW} height={3} color="#2c2c33" />
          <Rect x={0} y={0} width={VW} height={24}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 24)} colors={['#16161b', '#101014']} />
          </Rect>
          <Rect x={0} y={168} width={VW} height={3} color="#2c2c33" />
          <Rect x={0} y={171} width={VW} height={VH - 171}>
            <LinearGradient start={vec(0, 171)} end={vec(0, VH)} colors={['#141418', '#0d0d10']} />
          </Rect>
        </Group>

        {/* ── pathway: tray, J-hooks, conduit riser, raceway ── */}
        <Group opacity={fPathway}>
          <CableTray x={30} y={28} w={240} h={16} kind="ladder" />
          <JHook x={284} y={44} s={0.5} />
          <JHook x={310} y={44} s={0.5} />
          {/* Conduit riser — from the raceway UP to the tray only. A
              floor-to-ceiling tube reads as a structural column and swamps the
              scene; the riser exists to get the wall run into the tray, so it
              should be no longer, and no fatter, than that job needs. */}
          <Group transform={[{ translateX: 130 }, { translateY: 44 }, { rotate: Math.PI / 2 }]}>
            <Conduit x={0} y={-4.5} w={70} d={9} coupling={false} />
          </Group>
          {/* Surface raceway, cover OFF — the back channel is drawn here, the
              cable is seated into it, and the front lip goes on afterwards, so
              the run reads as lying INSIDE the raceway rather than painted on
              top of a closed box. */}
          <RoundedRect x={28} y={100} width={96} height={14} r={2} color="#191c21" />
          <RoundedRect x={28} y={100} width={96} height={4} r={1.6}>
            <LinearGradient start={vec(0, 100)} end={vec(0, 104)} colors={['#7b818b', '#42464e']} />
          </RoundedRect>
          <RoundedRect x={28} y={100} width={96} height={1} r={0.5} color="rgba(255,255,255,0.32)" />
          {/* the elbow where the raceway hands off to the riser */}
          <RoundedRect x={122} y={100} width={14} height={14} r={2.5}>
            <LinearGradient start={vec(122, 100)} end={vec(136, 114)} colors={['#5f646d', '#2a2d33']} />
          </RoundedRect>
        </Group>

        {/* ── gear: rack, wall plate, stage box ── */}
        <Group opacity={fGear}>
          {/* equipment rack */}
          <RoundedRect x={284} y={42} width={62} height={126} r={5} color="#0d0d10" />
          <RoundedRect x={284} y={42} width={62} height={126} r={5}>
            <LinearGradient start={vec(284, 42)} end={vec(346, 42)} colors={['#33363d', '#1c1e23', '#101216']} positions={[0, 0.5, 1]} />
          </RoundedRect>
          {/* rails */}
          <RoundedRect x={287} y={46} width={3} height={118} r={1.5} color="#4a4e56" />
          <RoundedRect x={340} y={46} width={3} height={118} r={1.5} color="#3a3e45" />
          {[52, 70, 88, 106, 124, 142].map((y) => (
            <Group key={y}>
              <RoundedRect x={292} y={y} width={46} height={14} r={2}>
                <LinearGradient start={vec(292, y)} end={vec(292, y + 14)} colors={['#2c2f36', '#191b1f']} />
              </RoundedRect>
              <RoundedRect x={292} y={y} width={46} height={1} r={0.5} color="rgba(255,255,255,0.16)" />
              {/* rack ears */}
              <Circle cx={294.5} cy={y + 7} r={1} color="#0c0d10" />
              <Circle cx={335.5} cy={y + 7} r={1} color="#0c0d10" />
            </Group>
          ))}
          {/* patch field on the top unit */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Group key={i}>
              <Circle cx={299 + i * 7} cy={59} r={2.4} color="#0a0b0d" />
              <Circle cx={299 + i * 7} cy={59} r={2.4} color="#6f757e" style="stroke" strokeWidth={0.6} />
            </Group>
          ))}

          {/* wall plate */}
          <RoundedRect x={16} y={94} width={16} height={24} r={2.5}>
            <LinearGradient start={vec(16, 94)} end={vec(32, 118)} colors={['#4c505a', '#22252a']} />
          </RoundedRect>
          <Circle cx={24} cy={101} r={2.6} color="#0a0b0d" />
          <Circle cx={24} cy={111} r={2.6} color="#0a0b0d" />

          {/* stage riser + stage box */}
          <RoundedRect x={12} y={138} width={92} height={30} r={3}>
            <LinearGradient start={vec(12, 138)} end={vec(12, 168)} colors={['#22252b', '#131519']} />
          </RoundedRect>
          <RoundedRect x={12} y={138} width={92} height={1.4} r={0.7} color="rgba(255,255,255,0.2)" />
          <RoundedRect x={20} y={146} width={22} height={14} r={2}>
            <LinearGradient start={vec(20, 146)} end={vec(20, 160)} colors={['#3c4048', '#1a1c20']} />
          </RoundedRect>
          <Circle cx={26} cy={153} r={2.4} color="#0a0b0d" />
          <Circle cx={35} cy={153} r={2.4} color="#0a0b0d" />
        </Group>

        {/* ── the runs, installing themselves in work order ── */}
        <Cable points={trayRunA} d={7.5} jacket="mic" reveal={rTray1} shadow={false} />
        <Cable points={trayRunB} d={6.5} jacket="network" reveal={rTray2} shadow={false} />
        <Cable points={racewayRun} d={6.5} jacket="line" reveal={rRaceway} shadow={false} />
        <Cable points={floorRun} d={8.5} jacket="line" reveal={rFloor} />
        <Cable points={floorRun2} d={8.5} jacket="line" reveal={rFloor2} />
        <Cable points={serviceLoop} d={6} jacket="mic" reveal={rDrop} shadow={false} />
        <Cable points={powerRun} d={7.5} jacket="power" matte reveal={rPower} shadow={false} />

        {/* the raceway's front lip, closing over the seated run */}
        <Group opacity={fPathway}>
          <RoundedRect x={28} y={110} width={96} height={4} r={1.6}>
            <LinearGradient start={vec(0, 110)} end={vec(0, 114)} colors={['#4d525a', '#20232a']} />
          </RoundedRect>
        </Group>

        {/* dressed at the tray, exactly as the lab will teach it */}
        <Group opacity={fProtect}>
          <ZipTieSide cx={92} cy={38} halfH={7.5} strap={2.6} tail="trimmed" />
          <ZipTieSide cx={186} cy={38} halfH={7.5} strap={2.6} tail="trimmed" />
          <ZipTieSide cx={244} cy={38} halfH={7.5} strap={2.6} tail="trimmed" />
          {/* protection where the floor run crosses the walkway */}
          <FloorProtector x={168} y={158} w={54} h={11} />
          {/* terminations — nothing in this lab ends in mid-air */}
          <ConnectorEnd kind="xlr" x={296} y={158} angle={-52} scale={0.5} jacket="line" />
        </Group>

        {/* The mains feed terminates INTO a wall enclosure, drawn over the
            cable end — an enclosure entry, not a line stopping in mid-air. */}
        <Group opacity={fGear}>
          <RoundedRect x={343} y={72} width={17} height={26} r={2.5} color="#0e1013" />
          <RoundedRect x={344} y={73} width={15} height={24} r={2}>
            <LinearGradient start={vec(344, 73)} end={vec(359, 97)} colors={['#4a4f58', '#20232a']} />
          </RoundedRect>
          <RoundedRect x={344} y={73} width={15} height={1} r={0.5} color="rgba(255,255,255,0.28)" />
          <Circle cx={351.5} cy={82} r={3} color="#0a0b0d" />
          <Circle cx={351.5} cy={82} r={3} color="#6f757e" style="stroke" strokeWidth={0.6} />
        </Group>
      </Group>
    </Canvas>
  );
}
