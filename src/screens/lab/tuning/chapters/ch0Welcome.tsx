/**
 * Chapter 0 — Welcome and Listening Setup (spec Stage 2). The central
 * question, a bare pitch rail, and an optional Hear the Question sequence.
 * Nothing plays until the learner asks.
 *
 * ON THE RACK (2026-09-30): the rail is the stage; HEAR IT and ■ STOP are
 * dock keys; the question, the volume note and BEGIN LAB read in the well.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { concatWithGap, renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, CENTS_RAIL_W, Lead, Row, usePreloadClips, type RailMarker } from '../components/primitives';
import { StageFit } from '../../rack/StageFit';
import { TuningRackLayout, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const RAIL_H = 96;

export function Ch0Welcome({ ctx }: ChapterProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [scope, setScope] = useState(false);
  const status = usePlayerStatus(ctx.player);
  // The two-note sequence is paced with timers. They MUST be cleared when the
  // learner stops or leaves: an orphaned timer used to start the octave clip
  // after the shell had already stopped the lab's audio on chapter change.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const faint: RailMarker[] = Array.from({ length: 11 }, (_, k) => ({ id: `f${k}`, cents: (k + 1) * 100, label: stage >= 3 ? '?' : '', role: 'muted' as const }));
  const markers: RailMarker[] = [
    { id: 'root', cents: 0, label: 'root 1:1', role: stage >= 1 ? 'active' : 'neutral', emphasis: stage >= 1 },
    { id: 'oct', cents: 1200, label: 'octave 2:1', role: stage >= 2 ? 'octave' : 'neutral', emphasis: stage >= 2 },
    ...faint,
  ];

  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  // ONE clip, root then octave (bug hunt 2026-09-30): the octave used to be a
  // second play fired by a 1.4 s timer, which the footer ■, shake-to-mute and
  // another lab's claim never cleared — so it sounded after STOP, raised the
  // sound popup by itself after a mute, or played over another lab. Any stop
  // now silences the whole question; the timers only pace the picture.
  const questionClip = () => concatWithGap(renderNotes([ctx.rootHz], 1.2, 'rich'), renderNotes([ctx.rootHz * 2], 1.2, 'rich'), 0.2);
  usePreloadClips(ctx.player, () => [questionClip], String(ctx.rootHz));

  const hearRoot = () => {
    clearTimers();
    setStage(1);
    void ctx.player.renderAndPlay(questionClip, 'root, then octave');
    timers.current.push(setTimeout(() => {
      setStage(2);
      timers.current.push(setTimeout(() => setStage(3), 1300));
    }, 1400));
  };
  const stop = () => {
    clearTimers();
    ctx.player.stop();
  };

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'hear',
        bezel: [
          { k: 'ROOT', v: `${ctx.rootHz.toFixed(2)} Hz`, tint: stage >= 1 ? colors.cyanBright : undefined, flex: 1.2 },
          { k: 'OCTAVE', v: `${(ctx.rootHz * 2).toFixed(2)} Hz`, tint: stage >= 2 ? colors.blue : undefined, flex: 1.2 },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <CentsRail markers={markers} divisions={false} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
          </StageFit>
        ),
        params: [
          { kind: 'action', id: 'hear', label: 'HEAR IT', onPress: hearRoot },
          { kind: 'action', id: 'stop', label: '■ STOP', onPress: stop, tint: colors.red },
        ],
      }}
      caption="Press HEAR IT: the root sounds, then its octave, and the rail lights each one. Keep the volume low first."
    >
      <Lead>An octave is simple: double the frequency. The difficult question is where to place every note between.</Lead>
      <Body>Different tuning systems answer that question in different ways. Each preserves some relationships and compromises others.</Body>
      {stage >= 3 ? <Text style={styles.question} accessibilityRole="header">Where should the other notes go?</Text> : null}
      <Card>
        <Body>🔈 Keep the volume low before you press play. Headphones are recommended, not required — every relationship in this lab is also shown visually and numerically.</Body>
      </Card>
      <Row>
        <Btn label={scope ? 'HIDE SCOPE' : 'SCOPE ⓘ'} onPress={() => setScope(!scope)} a11y={scope ? 'Hide the scope note' : 'Show what this lab does and does not cover'} />
      </Row>
      {scope ? (
        <Card>
          <Body>This lab examines several influential Western tuning approaches. It is not a complete history of tuning and does not represent every musical culture or pitch system.</Body>
        </Card>
      ) : null}
      {!ctx.isDone ? <Btn label="BEGIN LAB ›" tone="primary" onPress={ctx.markDone} /> : null}
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  question: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 1 },
});
