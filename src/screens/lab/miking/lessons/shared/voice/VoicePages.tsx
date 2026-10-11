/**
 * THE VOICE FAMILY'S OWN PAGES (LessonArt.pages) — where the kick-shaped
 * defaults do not fit a singer. Served by the journey (engine/restructure):
 *
 *   sound   → the second half of MEET IT — WHERE THE SOUND COMES FROM:
 *     WHERE THE VOICE COMES FROM (rack)  PREDICT FIRST, then the four events
 *                 on the singer in profile — breath, the folds, the throat
 *                 and mouth, out of the mouth (and the nose) — STEP through
 *                 them or PLAY ONCE (a staged reveal that stops at the end).
 *     THE AIR THAT COMES WITH IT (rack)  a vowel, a P or B, an S or T: what
 *                 leaves the lips besides sound (SOUND chooses).
 *     (a lesson's own step — E07: the instrument's sound)
 *     VOWELS AND CONSONANTS (read)  in words; where the highs go (words
 *                 only: no measured shape is drawn); then the checks.
 *   setting → its last step(s) on STARTING SETUPS:
 *     (a lesson's own MIC OR DI step, key 'path' — E07)
 *     BEFORE ANY MIC (read)  ask the singer, the headphones or the wedge,
 *                 hearing; then the checks.
 * FULLY SILENT; nothing loops (D8); every state is reachable by STEP.
 */
import { useState, type ReactNode } from 'react';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { copyOf } from '../../../engine/model/copy.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { useStepper } from '../hand/handPages';
import { VoiceAir, VoiceSequence, type AirKind } from './VoiceSoundArt';

type PageFn = (p: PageProps) => ReactNode;

export type VoiceSoundSpec = {
  /** The bezel cell per stage (4 values). */
  where: readonly string[];
  /** What leaves the lips, per kind of sound (the lesson's words). */
  air: Readonly<Record<AirKind, { title: string; text: string }>>;
  /** Where the highs go — in words (no measured directivity is drawn). */
  highs: string;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
  /** A lesson's own step before the checks (a hook: called on every render). */
  useExtra?: (p: PageProps) => MikingStep | null;
};

const AIR_LABEL: Record<AirKind, string> = { vowel: 'A VOWEL', plosive: 'P, B OR T', sibilant: 'S' };
const AIR_WORD: Record<AirKind, string> = { vowel: 'SOUND ONLY', plosive: 'A PUFF', sibilant: 'A HISS' };

export function makeVoiceSound(spec: VoiceSoundSpec): PageFn {
  return function VoiceSound(p: PageProps) {
    const { lesson, answers, onAnswered, hidden } = p;
    const S = lesson.sound;
    const n = S.stages.length;
    const st = useStepper(n, hidden);
    const [predicted, setPredicted] = useState<string | null>(null);
    const [kind, setKind] = useState<AirKind>('vowel');
    const [tried, setTried] = useState<ReadonlySet<AirKind>>(() => new Set(['vowel']));
    const pred = lesson.predictions.sound;
    const stage = S.stages[st.shown - 1];
    const extra = spec.useExtra?.(p) ?? null;
    const seqBezel: BezelItem[] = [
      { k: 'STEP', v: `${st.shown} / ${n}`, flex: 0.8 },
      { k: 'EVENT', v: stage.title.toUpperCase(), flex: 2 },
      { k: 'WHERE', v: spec.where[st.shown - 1] ?? '—', flex: 1.2 },
    ];
    const airParams: DockParam[] = [
      {
        kind: 'options',
        id: 'sound',
        label: 'SOUND',
        valueLabel: AIR_LABEL[kind],
        selectedId: kind,
        onSelect: (id) => {
          const k = id as AirKind;
          setKind(k);
          setTried((prev) => (prev.has(k) ? prev : new Set([...prev, k])));
        },
        sticky: true,
        options: (['vowel', 'plosive', 'sibilant'] as const).map((k) => ({ id: k, label: AIR_LABEL[k], blurb: spec.air[k].title })),
      },
    ];
    const steps: MikingStep[] = [
      {
        key: 'seq',
        title: 'Where the voice comes from',
        kind: 'WATCH',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <VoiceSequence w={w} h={h} shown={st.shown} accessibilityLabel={`A singer in profile, the head and neck cut through the middle to show the airway, step ${st.shown} of ${n}: ${stage.title}. ${stage.text}`} />
          ),
          badge: 'A simplified picture: a cut through the middle of the head · the order of events, not their speed or size · silent',
          bezel: seqBezel,
          params: st.params,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking="Side view · the singer from the right, cut through the middle" prompt="STEP through how breath becomes a voice — or PLAY ONCE. It stops at the end." />
            <Card>
              <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
            </Card>
            {st.shown >= n && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${spec.reveal}`}</Note> : null}
          </>
        ),
      },
      {
        key: 'breathOut',
        title: 'The air that comes with it',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => <VoiceAir w={w} h={h} kind={kind} accessibilityLabel={`A singer in profile with the mouth’s axis dashed straight out of the lips. ${AIR_LABEL[kind]}: ${spec.air[kind].text}`} />,
          badge: 'A simplified picture: the air drawn as a shape — its real angle and reach vary with the singer and the word · silent',
          bezel: [
            { k: 'SOUND', v: AIR_LABEL[kind], flex: 1.2 },
            { k: 'WHAT ELSE LEAVES', v: AIR_WORD[kind], flex: 1.4 },
            { k: 'TRIED', v: `${tried.size} / 3`, flex: 0.8 },
          ],
          params: airParams,
          initialParam: 'sound',
        },
        well: (
          <>
            <Landing looking="Side view · the singer from the right" prompt="Switch SOUND: a vowel, a P, B or T, an S. What leaves the lips besides the sound?" />
            <Card>
              <Point title={spec.air[kind].title.toUpperCase()}>{spec.air[kind].text}</Point>
            </Card>
            {tried.size === 3 ? <Note tone="ok">A vowel sends out sound only; a P, B or T also pushes a puff of air straight out along the mouth’s axis; an S sends a narrow hiss forward. The air and the hiss both travel along the axis — off it, much less of them.</Note> : null}
          </>
        ),
      },
      ...(extra ? [extra] : []),
      {
        key: 'body',
        title: 'Vowels and consonants',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="CONSONANTS">{S.attack}</Point>
              <Point title="VOWELS">{S.body}</Point>
              <Point title="WHERE THE HIGHS GO">{spec.highs}</Point>
            </Card>
            <Note>{spec.silentNote}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/** The voice family's hearing note (BEFORE ANY MIC). */
export const VOICE_HEARING =
  'Protect hearing — the singer’s and yours. Keep the headphone and monitor mix comfortable: a useful balance should never need a dangerous level. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that — a limit for PEOPLE, measured where a person listens; a mic’s maximum SPL rating says nothing about it. If a singer reports pain, ringing or a change in their hearing, stop and deal with the level.';

export type VoiceSettingSpec = {
  /** The hearing note (warn). */
  hearing: string;
  /** A lesson's MIC OR DI step (kept on STARTING SETUPS: key 'path'). */
  path?: { title: string; points: readonly { title: string; text: string }[]; note?: string };
};

export function makeVoiceSetting(spec: VoiceSettingSpec): PageFn {
  return function VoiceSetting({ lesson, answers, onAnswered }: PageProps) {
    const C = copyOf(lesson);
    const steps: MikingStep[] = [
      ...(spec.path
        ? [
            {
              key: 'path',
              title: spec.path.title,
              kind: 'LEARN',
              layout: 'read',
              body: (
                <>
                  <Card>
                    {spec.path.points.map((b) => (
                      <Point key={b.title} title={b.title}>
                        {b.text}
                      </Point>
                    ))}
                  </Card>
                  {spec.path.note ? <Note>{spec.path.note}</Note> : null}
                </>
              ),
            } satisfies MikingStep,
          ]
        : []),
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {C.setting.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{spec.hearing}</Note>
            <Body>Then the checks.</Body>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
