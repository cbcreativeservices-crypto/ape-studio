/**
 * THE BODY-WORN FAMILY — the look (charter §2 layer 3). Lab 7 group 2 (B05,
 * B02); shared with the later body-worn lessons. Real objects, lit from the
 * upper left, in the engine's two views (side: u = x, v = y; top: u = x,
 * v = z — frame V of the wearer, mm). Static: nothing moves by itself (D8).
 * The model is bodyWorn.ts.
 *
 *   Jacket       a jacket over the shared figure's shirt: its front edge and
 *                the lapel's roll from the side, the lapels from above, a tie
 *                (optional) — where a lav clips.
 *   LavClip      a lavalier's spring clip on a garment edge.
 *   LavCable     the lav's cable: the broadcast loop at the clip, down inside
 *                the shirt (dashed), the secondary loop and its tape, round
 *                to the pack at the back of the belt — drawn TAUT (no loops)
 *                when a move pulls on it, with a tug mark at the capsule.
 *   BeltPack     a bodypack transmitter on the belt with its antenna.
 *   FabricOver   one layer of shirt drawn over a concealed capsule.
 *   HeadsetFrame a headset's ear hook and its thin boom along the cheek to
 *                the capsule (the capsule itself is the mic art).
 *   BreathJet    the plosive air jet out of the lips (a simplified cone).
 *   StandingPresenter  the voice family's standing figure in a jacket, the
 *                bodypack on the belt (`headless` for a step that draws the
 *                head turned).
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { EAR, EAR_HALF, HEAD_C } from '../voice/voiceSpec.ts';
import { VoiceFigure } from '../voice/VoiceArt';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { SINGER_SIDE, SINGER_TOP } from '../voice/voicePose.ts';
import { BREATH_JET, BODY_DIMS, CHEST_X, NECK_Y, packAt } from './bodyWorn.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const DEG = Math.PI / 180;
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const JACKET = ['#4f535c', '#363940', '#24262b', '#141518'];
const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

/* ── the jacket and the tie ── */

function jacketPaths(view: ViewId, standing: boolean, tie: boolean) {
  const body = make();
  const roll = make();
  const tieP = make();
  const collar = make();
  const notch = make();
  const button = make();
  const welt = make();
  const X = CHEST_X;
  const hem = NECK_Y + (standing ? 600 : 470);
  if (view === 'side') {
    // The jacket's front panel seen edge-on over the shirt: a thin layer from
    // the shoulder down the chest to the hem, its lapel rolling open at the top.
    body.moveTo(X - 30, NECK_Y + 6);
    body.cubicTo(X - 6, NECK_Y + 40, X + 4, NECK_Y + 120, X + 5, NECK_Y + 230);
    body.lineTo(X + 7, hem - 30);
    body.cubicTo(X + 6, hem, X - 4, hem + 6, X - 18, hem);
    body.lineTo(X - 14, NECK_Y + 230);
    body.cubicTo(X - 16, NECK_Y + 120, X - 26, NECK_Y + 50, X - 44, NECK_Y + 14);
    body.close();
    // The lapel's roll line: from the collar out and down to the top button,
    // its notch standing a little off the chest near the collar.
    roll.moveTo(X - 26, NECK_Y + 10);
    roll.cubicTo(X + 2, NECK_Y + 60, X + 8, NECK_Y + 150, X + 4, NECK_Y + 250);
    notch.moveTo(X - 10, NECK_Y + 38);
    notch.lineTo(X + 12, NECK_Y + 66);
    notch.lineTo(X + 4, NECK_Y + 96);
    notch.lineTo(X - 6, NECK_Y + 90);
    notch.close();
    // A button at the waist, and a pocket's welt below it.
    button.addCircle(X + 8, NECK_Y + 300, 6.5);
    welt.moveTo(X - 2, hem - 150);
    welt.lineTo(X - 70, hem - 156);
    // The shirt collar's wing at the throat.
    collar.moveTo(X - 40, NECK_Y - 18);
    collar.lineTo(X - 6, NECK_Y + 2);
    collar.lineTo(X - 20, NECK_Y + 26);
    collar.close();
    if (tie) {
      tieP.moveTo(X - 6, NECK_Y + 2);
      tieP.lineTo(X + 4, NECK_Y + 22);
      tieP.lineTo(X + 6, NECK_Y + 420);
      tieP.lineTo(X - 2, NECK_Y + 440);
      tieP.lineTo(X - 6, NECK_Y + 418);
      tieP.lineTo(X - 6, NECK_Y + 22);
      tieP.close();
    }
  } else {
    // From above: the two lapels either side of the shirt front, open at the
    // collar (a V), lying on the chest's front face.
    for (const s of [-1, 1]) {
      body.moveTo(X - 40, s * 70);
      body.lineTo(X + 6, s * 30);
      body.lineTo(X + 4, s * 150);
      body.lineTo(X - 50, s * 196);
      body.close();
      roll.moveTo(X + 6, s * 30);
      roll.lineTo(X + 4, s * 150);
    }
    collar.addRRect(Skia.RRectXY(Skia.XYWHRect(X - 46, -36, 34, 72), 12, 12));
    if (tie) tieP.addRRect(Skia.RRectXY(Skia.XYWHRect(X - 4, -18, 10, 36), 4, 4));
  }
  return { body, roll, tieP, collar, notch, button, welt };
}

/** A jacket (and a tie) over the shared figure's shirt, on its chest. */
export function Jacket({ view, standing = true, tie = false }: { view: ViewId; standing?: boolean; tie?: boolean }) {
  const p = useMemo(() => jacketPaths(view, standing, tie), [view, standing, tie]);
  // From above the lapels lie flat on the chest's front: the figure's own
  // shoulders read better without them (drawn from the side only).
  if (view === 'top') return null;
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={JACKET} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={2.2} color="#0b0c0f" />
      <Path path={p.collar} color="#d9dde4" />
      <Path path={p.collar} style="stroke" strokeWidth={1.6} color="#7d838e" />
      <Path path={p.notch} color="#2b2d33" />
      <Path path={p.notch} style="stroke" strokeWidth={1.6} color="#0b0c0f" />
      <Path path={p.welt} style="stroke" strokeWidth={2.4} color="#101114" opacity={0.8} />
      <Path path={p.button} color="#15161a" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -1.5 }]}>
        <Path path={p.button} style="stroke" strokeWidth={1.2} color="#a7adb8" opacity={0.6} />
      </Group>
      <Path path={p.roll} style="stroke" strokeWidth={2.4} color="#0e0f12" opacity={0.85} />
      <Group transform={[{ translateX: -1.4 }, { translateY: -1.4 }]}>
        <Path path={p.roll} style="stroke" strokeWidth={1.2} color="#c3c8d2" opacity={0.4} />
      </Group>
      {tie ? (
        <>
          <Path path={p.tieP}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + 20, b.y + 300)} colors={['#7a3b3b', '#4d2222']} />
          </Path>
          <Path path={p.tieP} style="stroke" strokeWidth={1.4} color="#1d0c0c" />
        </>
      ) : null}
    </Group>
  );
}

/* ── the clip, the cable, the pack ── */

/** A lavalier's spring clip on a garment edge at `grip` (side: upright; from
 *  above: a small block on the chest). */
export function LavClip({ view, grip }: { view: ViewId; grip: Vec3 }) {
  const p = useMemo(() => {
    const body = make();
    const jaw = make();
    const u = grip.x;
    const v = vOf(view, grip);
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 3, v - 10, 7, 20), 2, 2));
    jaw.moveTo(u - 3, v - 10);
    jaw.lineTo(u - 6, v - 4);
    jaw.lineTo(u - 3, v + 2);
    return { body, jaw };
  }, [view, grip]);
  return (
    <Group>
      <Path path={p.body} color="#2a2c31" />
      <Path path={p.body} style="stroke" strokeWidth={1} color="#9aa0aa" />
      <Path path={p.jaw} style="stroke" strokeWidth={1.4} color="#b9bec8" />
    </Group>
  );
}

/**
 * The lav's cable from the capsule's tail `from` (side view): the broadcast
 * loop just under the clip, down the shirt (dashed: under the shirt), the
 * secondary loop with its tape strip, the belt, and round the waist to the
 * pack at `pack`. `taut` draws the loops pulled out — the move has used
 * their spare cable — and `tug` marks a pull reaching the capsule.
 */
export function LavCable({ view, from, pack, loops, taut = false, tug = false, standing = true }: { view: ViewId; from: Vec3; pack: Vec3; loops: { broadcast: boolean; secondary: boolean }; taut?: boolean; tug?: boolean; standing?: boolean }) {
  const p = useMemo(() => {
    const out = make();
    const under = make();
    const tape = make();
    const pull = make();
    const X = CHEST_X + 3;
    const belt = NECK_Y + (standing ? 520 : 470);
    const secY = NECK_Y + 300;
    if (view === 'side') {
      const u0 = from.x;
      const v0 = from.y;
      // Out of the capsule's tail, down past the clip.
      out.moveTo(u0, v0);
      out.lineTo(u0 - 1, v0 + 26);
      if (loops.broadcast && !taut) {
        // A small loop hanging under the clip, then in at the next button.
        out.cubicTo(u0 + 18, v0 + 44, u0 + 16, v0 + 74, u0 + 2, v0 + 70);
        out.cubicTo(u0 - 10, v0 + 66, u0 - 6, v0 + 46, X - 2, v0 + 52);
      } else {
        out.lineTo(X - 2, v0 + 46);
      }
      // Under the shirt: down the chest.
      under.moveTo(X - 2, v0 + 52);
      if (loops.secondary && !taut) {
        under.lineTo(X - 4, secY - 24);
        under.cubicTo(X + 18, secY - 10, X + 16, secY + 26, X - 2, secY + 22);
        under.cubicTo(X - 14, secY + 18, X - 10, secY, X - 6, secY + 8);
        tape.addRRect(Skia.RRectXY(Skia.XYWHRect(X - 16, secY - 34, 24, 16), 3, 3));
      } else {
        under.lineTo(X - 6, secY + 8);
      }
      under.lineTo(X - 10, belt - 10);
      // Round the waist to the pack at the back of the belt.
      under.cubicTo(X - 40, belt + 4, pack.x + 80, belt + 4, pack.x + 20, pack.y - 20);
      if (tug) {
        pull.moveTo(u0 + 22, v0 + 40);
        pull.lineTo(u0 + 22, v0 + 90);
        pull.moveTo(u0 + 14, v0 + 80);
        pull.lineTo(u0 + 22, v0 + 92);
        pull.lineTo(u0 + 30, v0 + 80);
      }
    } else {
      // From above: the cable leaves the clip and runs round the side of the
      // waist to the pack (under the jacket: dashed).
      out.moveTo(from.x, from.z);
      out.lineTo(from.x - 4, from.z + 4);
      under.moveTo(from.x - 4, from.z + 4);
      under.cubicTo(CHEST_X - 40, -180, pack.x + 60, -220, pack.x, pack.z);
    }
    return { out, under, tape, pull };
  }, [view, from, pack, loops.broadcast, loops.secondary, taut, tug, standing]);
  return (
    <Group>
      <Path path={p.out} style="stroke" strokeWidth={3.4} strokeCap="round" strokeJoin="round" color="#08090b" />
      <Path path={p.out} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" color={taut ? RED : '#3d4049'} />
      <Path path={p.under} style="stroke" strokeWidth={2.4} strokeCap="round" strokeJoin="round" color={taut ? RED : '#8a8f99'} opacity={0.75}>
        <DashPathEffect intervals={[7, 6]} />
      </Path>
      <Path path={p.tape} color="#c9b98f" opacity={0.85} />
      {view === 'side' ? <Path path={p.pull} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color={RED} /> : null}
    </Group>
  );
}

/** A bodypack transmitter on the back of the belt, its antenna hanging. */
export function BeltPack({ view, at }: { view: ViewId; at: Vec3 }) {
  const p = useMemo(() => {
    const box = make();
    const ant = make();
    const W = BODY_DIMS.packW.mm;
    const H = BODY_DIMS.packH.mm;
    const D = BODY_DIMS.packD.mm;
    if (view === 'side') {
      box.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - D / 2, at.y - H / 2, D, H), 5, 5));
      ant.moveTo(at.x, at.y + H / 2);
      ant.cubicTo(at.x - 4, at.y + H / 2 + 30, at.x + 4, at.y + H / 2 + 60, at.x, at.y + H / 2 + 80);
    } else {
      box.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - D / 2, at.z - W / 2, D, W), 4, 4));
    }
    return { box, ant };
  }, [view, at]);
  const b = p.box.getBounds();
  return (
    <Group>
      <Path path={p.ant} style="stroke" strokeWidth={2.4} strokeCap="round" color="#121317" />
      <Group transform={[{ translateX: -3 }, { translateY: 4 }]}>
        <Path path={p.box} color="#000" opacity={0.35}>
          <BlurMask blur={5} style="normal" />
        </Path>
      </Group>
      <Path path={p.box}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#5a5e68', '#2c2e34', '#15161a']} />
      </Path>
      <Path path={p.box} style="stroke" strokeWidth={1.4} color="#08080a" />
    </Group>
  );
}

/** One layer of shirt over a concealed capsule at `at` (side view). */
export function FabricOver({ view, at }: { view: ViewId; at: Vec3 }) {
  const p = useMemo(() => {
    const panel = make();
    const seam = make();
    if (view === 'side') {
      panel.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - 6, at.y - 34, 16, 70), 6, 6));
      seam.moveTo(at.x + 8, at.y - 30);
      seam.lineTo(at.x + 8, at.y + 32);
    } else {
      panel.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - 6, at.z - 30, 16, 60), 6, 6));
    }
    return { panel, seam };
  }, [view, at]);
  const b = p.panel.getBounds();
  return (
    <Group>
      <Path path={p.panel} opacity={0.94}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#76839e', '#55617b', '#3a4357']} />
      </Path>
      <Path path={p.seam} style="stroke" strokeWidth={1.2} color="#c3cde2" opacity={0.5}>
        <DashPathEffect intervals={[3, 3]} />
      </Path>
    </Group>
  );
}

/* ── the headset ── */

/** The headset's frame: a hook over the near ear and a thin boom along the
 *  cheek to `capsule` (frame V, the head facing ahead — wrap it in the
 *  head's turn to turn it). */
export function HeadsetFrame({ view, capsule }: { view: ViewId; capsule: Vec3 }) {
  const p = useMemo(() => {
    const hook = make();
    const boom = make();
    if (view === 'side') {
      // The hook curls over and behind the ear.
      hook.moveTo(EAR.x + 18, EAR.y - 30);
      hook.cubicTo(EAR.x + 6, EAR.y - 62, EAR.x - 40, EAR.y - 50, EAR.x - 38, EAR.y + 2);
      hook.cubicTo(EAR.x - 36, EAR.y + 36, EAR.x - 14, EAR.y + 50, EAR.x - 6, EAR.y + 44);
      // The boom from the front of the hook along the cheek to the capsule.
      boom.moveTo(EAR.x + 18, EAR.y - 30);
      boom.cubicTo(EAR.x + 60, EAR.y - 10, capsule.x - 70, capsule.y + 10, capsule.x - 8, capsule.y);
    } else {
      hook.addOval(Skia.XYWHRect(EAR.x - 30, EAR_HALF - 10, 52, 24));
      boom.moveTo(EAR.x + 18, EAR_HALF + 6);
      boom.cubicTo(HEAD_C.x + 60, EAR_HALF + 4, capsule.x - 30, capsule.z + 22, capsule.x - 8, capsule.z);
    }
    return { hook, boom };
  }, [view, capsule]);
  return (
    <Group>
      <Path path={p.hook} style="stroke" strokeWidth={9} strokeCap="round" color="#0a0b0d" />
      <Path path={p.hook} style="stroke" strokeWidth={6} strokeCap="round" color="#3a3d45" />
      <Path path={p.boom} style="stroke" strokeWidth={5} strokeCap="round" color="#0a0b0d" />
      <Path path={p.boom} style="stroke" strokeWidth={3} strokeCap="round" color="#5a5e68" />
      <Group transform={[{ translateX: -0.8 }, { translateY: -1 }]}>
        <Path path={p.boom} style="stroke" strokeWidth={1} strokeCap="round" color="#d4d8e0" opacity={0.5} />
      </Group>
    </Group>
  );
}

/* ── the breath ── */

/** The plosive air jet straight out of the lips: a cone of BREATH_JET's
 *  half-angle and reach (a simplified picture), faint amber, dashed edges. */
export function BreathJet({ view, hit = false }: { view: ViewId; hit?: boolean }) {
  const p = useMemo(() => {
    const cone = make();
    const edges = make();
    const a = BREATH_JET.halfDeg * DEG;
    const r = BREATH_JET.reach;
    cone.moveTo(0, 0);
    cone.lineTo(r * Math.cos(a), -r * Math.sin(a));
    cone.lineTo(r, 0);
    cone.lineTo(r * Math.cos(a), r * Math.sin(a));
    cone.close();
    edges.moveTo(r * Math.cos(a), -r * Math.sin(a));
    edges.lineTo(0, 0);
    edges.lineTo(r * Math.cos(a), r * Math.sin(a));
    void view;
    return { cone, edges };
  }, [view]);
  return (
    <Group>
      <Path path={p.cone} color={hit ? RED : AMBER} opacity={hit ? 0.16 : 0.1} />
      <Path path={p.edges} style="stroke" strokeWidth={2.4} color={hit ? RED : AMBER} opacity={0.7}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
    </Group>
  );
}

/* ── a standing presenter ── */

const SIDE_HEADLESS = { ...SINGER_SIDE, head: { ...SINGER_SIDE.head, r: 1 } };
const TOP_HEADLESS = { ...SINGER_TOP, head: { ...SINGER_TOP.head, r: 1 } };

/** The voice family's standing figure in a jacket, the bodypack on the back
 *  of the belt (frame V). `headless` leaves the head off (a step draws it
 *  turned); `pack` false hides the pack. */
export function StandingPresenter({ view, headless = false, pack = true, tie = false }: { view: ViewId; headless?: boolean; pack?: boolean; tie?: boolean }) {
  const pose = view === 'side' ? SIDE_HEADLESS : TOP_HEADLESS;
  const at = packAt(true);
  return (
    <Group>
      {pack && view === 'side' ? <BeltPack view="side" at={at} /> : null}
      {headless ? (
        <Group>
          <PlayerBehind pose={pose} />
          <PlayerInFront pose={pose} hands={view === 'side'} />
        </Group>
      ) : (
        <VoiceFigure view={view} variant="studio" />
      )}
      <Jacket view={view} standing tie={tie} />
      {pack && view === 'top' ? <BeltPack view="top" at={at} /> : null}
    </Group>
  );
}
