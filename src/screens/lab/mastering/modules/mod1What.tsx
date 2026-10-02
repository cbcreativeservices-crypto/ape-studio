/**
 * Module 1 — What mastering is. LEARN (rack: where mastering fits) →
 * LEARN (read: can / cannot / objectivity) → LISTEN (rack: louder is not
 * better, at matched level) → PRACTICE (mix issue or mastering issue?) →
 * REVIEW.
 */
import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { faderParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, PlaybackStatus, Point, ScenarioDeck, SectionTitle, lufsTint, matchBezel, measureBezel, unmatchedWarning } from '../kit';
import { KEY_TERMS, TRIAGE_SCENARIOS } from '../masteringContent';
import { PIPELINE, PIPELINE_ASPECT, PIPELINE_SHORT, PipelineStage, WAVE_ASPECT, WaveOverviewStage } from '../stages';
import { useMasterPlayback, type MasterVariant } from '../useMasterPlayback';
import { RENDER_BADGE, type ModuleProps } from './shared';

const CEILING = -0.3;

export function Mod1What({ onAnswered }: ModuleProps) {
  const [stage, setStage] = useState(3);
  const [matched, setMatched] = useState(true);

  // Louder is not better: the mix as delivered, the same mix driven 8 dB
  // into a limiter, and — with MATCH on — both heard at the quieter one's
  // loudness so only the dynamics differ.
  const variants = useMemo<MasterVariant[]>(
    () => [
      { id: 'mix', label: 'THE MIX', process: {}, matchGroup: 'g' },
      { id: 'loud', label: 'LOUDER', process: { driveDb: 8, ceilingDb: CEILING }, matchGroup: 'g' },
    ],
    [],
  );
  const pb = useMasterPlayback(variants, matched);
  const shown = pb.active ?? pb.pending ?? 'loud';
  const m = pb.measured[shown];
  const mix = pb.measured.mix;
  const loud = pb.measured.loud;

  return (
    <ModuleSteps
      steps={[
        {
          key: 'fits', title: 'Where mastering fits', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <PipelineStage width={w} height={h} index={stage} />,
            aspect: PIPELINE_ASPECT,
            badge: 'DIAGRAM · the project chain',
            bezel: [
              { k: 'STAGE', v: `${stage + 1} / ${PIPELINE.length}` },
              { k: 'NAME', v: PIPELINE[stage], flex: 2 },
              // One word each: at 375 wide the cell holds ~11 characters, and a
              // value that would crop is never ellipsized (the drawing names
              // "ONE stereo file" in full).
              { k: 'WORKS ON', v: stage <= 2 ? 'TRACKS' : stage === 3 ? 'STEREO' : 'FILES', flex: 1.4 },
            ],
            params: [
              faderParam({ id: 'stage', label: 'STAGE', value: stage, min: 0, max: PIPELINE.length - 1, step: 1, format: (v) => PIPELINE[Math.round(v)], formatShort: (v) => PIPELINE_SHORT[Math.round(v)], onChange: (v) => setStage(Math.round(v)), home: 3 }),
            ],
            initialParam: 'stage',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride STAGE across the chain: mastering is the last listening, decision-making and delivery stage before the music leaves the building.</Body>
              <Card>
                <Point title="One file in, one file out">The mastering engineer usually receives a finished stereo (or multichannel) mix. Everything that follows acts on the whole programme at once.</Point>
                <Point title="Which is the foundation of this lab">Mastering can improve and unify a project. It cannot independently rebalance the individual tracks inside a stereo mix — the bezel's WORKS ON cell says why.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'can', title: 'What mastering can and cannot do', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>WHAT MASTERING CAN ADDRESS</SectionTitle>
              <Card>
                <Point title="Overall tonal balance">A programme that leans dull, bright, thin or heavy as a whole.</Point>
                <Point title="Dynamics and level">Density, peak control and the level appropriate to the content and the destination.</Point>
                <Point title="Consistency across a collection">Tracks that sit together in tone and level, so an album feels like one record.</Point>
                <Point title="Sequencing and release preparation">Order, gaps, fades, formats, metadata, documentation.</Point>
              </Card>
              <SectionTitle>WHAT IT CANNOT DO</SectionTitle>
              <Card tone="warn">
                <Body>A stereo master generally gives no independent control over the vocal, the drums, the bass or any other element. An EQ move at the vocal's frequencies moves everything that lives there. If one element needs a substantial change, the honest move is to request a revised mix — or stems, by agreement.</Body>
              </Card>
              <SectionTitle>THE PURPOSE OF OBJECTIVITY</SectionTitle>
              <Body>A fresh listener, a reliable monitoring room and careful comparisons reveal issues that were harder to hear during mixing, after days inside the same session. Objectivity is a method, not a talent: listen first, compare at matched level, verify with a meter, decide.</Body>
            </>
          ),
        },
        {
          key: 'listen', title: 'Louder is not better', kind: 'LISTEN', layout: 'rack',
          rack: {
            render: (w, h) => (
              <WaveOverviewStage width={w} height={h} ov={m?.overview ?? null} grDb={m?.grDb} maxGrDb={m?.maxGrDb} ceilingDb={shown === 'loud' ? CEILING : null} label={variants.find((v) => v.id === shown)?.label ?? ''} matchDb={m?.matchDb} progress={pb.progress} playing={pb.active != null} pending={pb.pending != null} onTap={() => (pb.active || pb.pending ? pb.stop() : pb.play(shown))} />
            ),
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              ...measureBezel(m, CEILING),
              matchBezel(matched, loud?.matchDb, 'LOUDER'),
            ],
            params: [
              { kind: 'toggle', id: 'match', label: 'MATCH LEVEL', value: matched, onToggle: () => setMatched((v) => !v) },
              { kind: 'action', id: 'a', label: '▶ MIX', onPress: () => pb.play('mix') },
              { kind: 'action', id: 'b', label: '▶ LOUDER', onPress: () => pb.play('loud') },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: pb.stop, tint: colors.green },
            ],
            initialParam: 'match',
            hideDragTag: true,
          },
          well: (
            <>
              <PlaybackStatus versions={variants} active={pb.active} pending={pb.pending} rendering={pb.status === 'rendering'} matched={matched} matchDb={m?.matchDb} labels="▶ MIX or ▶ LOUDER" />
              <Body>
                Play THE MIX, then LOUDER: the same mix driven 8 dB into a peak limiter with its ceiling at {CEILING} dBFS. With MATCH LEVEL on, both play at the loudness of the quieter one — the louder version is turned DOWN by the difference between the two loudness estimates, in LU (1 LU = 1 dB), attenuation only, so nothing clips.
              </Body>
              <Card tone="warn">
                <Point title="Before you switch MATCH off">{unmatchedWarning(mix?.lufs, loud?.lufs, 'LOUDER')} Unmatched, nothing replays by itself after a change — you press ▶ each time. Then hear what the extra level does to your judgement.</Point>
              </Card>
              {mix && loud ? (
                <Card tone="accent">
                  <Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 }}>
                    Measured: THE MIX <Text style={{ color: lufsTint(mix.lufs) }}>{mix.lufs.toFixed(1)} LUFS</Text>, PLR {mix.plr.toFixed(1)} dB · LOUDER <Text style={{ color: lufsTint(loud.lufs) }}>{loud.lufs.toFixed(1)} LUFS</Text>, PLR {loud.plr.toFixed(1)} dB, max gain reduction {loud.maxGrDb.toFixed(1)} dB.
                    {matched ? ` LOUDER is played at ${loud.matchDb.toFixed(1)} dB so both sit at ${Math.min(mix.lufs, loud.lufs).toFixed(1)} LUFS.` : ' Unmatched: the louder version will read fuller and brighter simply because it is louder.'}
                  </Text>
                  <Body>TRUE PK reads over 0 dBTP here on purpose: this is a sample-peak limiter with no look-ahead. A release limiter reads true peak (oversampled) and leaves margin for the encoder — Modules 6 and 7.</Body>
                </Card>
              ) : null}
              <Card>
                <Point title="What to listen for at matched level">The transients of the kick and snare, the space between hits, the sense of movement. Limiting trades those for density. Sometimes that is the right trade; it is never automatically "better".</Point>
                <Point title="Honesty">An offline render of a synthesized session through your phone's uncalibrated output: the comparison is real, the absolute numbers are estimates.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Mix issue or mastering issue?', kind: 'PRACTICE', layout: 'read',
          body: (
            <ScenarioDeck scenarios={TRIAGE_SCENARIOS} keepOrder onAnswered={onAnswered} intro="Each situation has a likely next step: a mastering adjustment, a mix revision, or more information from the client. Decide, then read why." />
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Mastering sits between mixing and release: the final creative and technical stage.</Body>
                <Body>• It addresses the whole programme — tone, dynamics, level, consistency, sequencing, delivery.</Body>
                <Body>• It cannot rebalance the elements inside a stereo mix; that is a mix revision.</Body>
                <Body>• Fresh ears, a reliable room and matched-level comparisons are what make its judgements trustworthy.</Body>
                <Body>• Louder is not better. It is only louder.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.what} />
            </>
          ),
        },
      ]}
    />
  );
}
