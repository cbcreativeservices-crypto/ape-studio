/**
 * Chapter 0 — Welcome and Listening Setup (spec Stage 2). The central
 * question, a bare pitch rail, and an optional Hear the Question sequence.
 * Nothing plays until the learner asks.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, Lead, Row, type RailMarker } from '../components/primitives';

export function Ch0Welcome({ ctx }: ChapterProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [scope, setScope] = useState(false);
  const faint: RailMarker[] = Array.from({ length: 11 }, (_, k) => ({ id: `f${k}`, cents: (k + 1) * 100, label: stage >= 3 ? '?' : '', role: 'muted' as const }));
  const markers: RailMarker[] = [
    { id: 'root', cents: 0, label: 'root 1:1', role: stage >= 1 ? 'active' : 'neutral', emphasis: stage >= 1 },
    { id: 'oct', cents: 1200, label: 'octave 2:1', role: stage >= 2 ? 'octave' : 'neutral', emphasis: stage >= 2 },
    ...faint,
  ];

  const hearRoot = () => {
    setStage(1);
    void ctx.player.play(renderNotes([ctx.rootHz], 1.2, 'rich'), 'root');
    setTimeout(() => {
      setStage(2);
      void ctx.player.play(renderNotes([ctx.rootHz * 2], 1.2, 'rich'), 'octave');
      setTimeout(() => setStage(3), 1300);
    }, 1400);
  };

  return (
    <View style={{ gap: 12 }}>
      <Lead>An octave is simple: double the frequency. The difficult question is where to place every note between.</Lead>
      <Body>Different tuning systems answer that question in different ways. Each preserves some relationships and compromises others.</Body>
      <CentsRail markers={markers} divisions={false} reduceMotion={ctx.reduceMotion} />
      {stage >= 3 ? <Text style={styles.question}>Where should the other notes go?</Text> : null}
      <Row>
        <Btn label="HEAR THE QUESTION" onPress={hearRoot} a11y="Hear the question: root, then octave" />
        <Btn label="■ STOP" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
        <Btn label={scope ? 'HIDE SCOPE' : 'SCOPE ⓘ'} onPress={() => setScope(!scope)} />
      </Row>
      <Card>
        <Body>🔈 Keep the volume low before you press play. Headphones are recommended, not required — every relationship in this lab is also shown visually and numerically.</Body>
      </Card>
      {scope ? (
        <Card>
          <Body>This lab examines several influential Western tuning approaches. It is not a complete history of tuning and does not represent every musical culture or pitch system.</Body>
        </Card>
      ) : null}
      {!ctx.isDone ? <Btn label="BEGIN LAB ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  question: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 1 },
});
