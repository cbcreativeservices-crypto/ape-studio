/**
 * The MEASUREMENT family's page parts (F11–F16): steps a lesson composes
 * into its own pages (LessonArt.pages), beside the engine's shared pages
 * (MEET IT's parts, STARTING SETUPS, the Placement Studio, Troubleshoot,
 * Practice).
 *
 *   useFieldStep       the sound field at the capsule (FieldScene)
 *   beforePage         STARTING SETUPS' "before any mic" read step: the
 *                      lesson's points, its exact safety lines, its checks
 *   checkStep          a page's CHECK read step (its scenarios, FROM EARLIER)
 *
 * The words are the lesson's (walked by the learner-text test). Suggested
 * starting points; no source, brand or standard named on screen (owner
 * decision D-6B-3: "the method you were given"); safety exact, in plain words.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { DockParam } from '../../../../rack/rackTypes';
import type { Lesson, Prediction, SourcePageId } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { PageSteps } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { FieldScene, wavelengthMm } from './FieldScene';
import { FIELD_TYPES, type FieldType } from './measureSpec.ts';

export type Pt = { title: string; text: string };

/** A page's CHECK step: optional words above its scenarios. */
export function checkStep(lesson: Lesson, page: SourcePageId, answers: PageProps['answers'], onAnswered: PageProps['onAnswered'], intro?: ReactNode, title = 'Check'): MikingStep {
  return {
    key: 'check',
    title,
    kind: 'CHECK',
    layout: 'read',
    body: (
      <>
        {intro}
        <ScenarioList items={lesson.scenarios.filter((s) => s.page === page)} answers={answers} onAnswered={onAnswered} />
      </>
    ),
  };
}

/* ── the sound field at the capsule ── */

export type FieldStepWords = { title: string; badge: string; looking: string; prompt: string; notes: Readonly<Record<FieldType, string>>; after: string };

const FREQS = [1000, 4000, 10000] as const;

export function useFieldStep(words: FieldStepWords, opts: { fields?: readonly FieldType[]; prediction?: Prediction; onTried?: () => void } = {}): MikingStep {
  const fields = opts.fields ?? (['freeField', 'pressure', 'random'] as const);
  const [field, setField] = useState<FieldType>(fields[0]);
  const [angle, setAngle] = useState(0);
  const [freq, setFreq] = useState<number>(10000);
  const [tried, setTried] = useState<ReadonlySet<FieldType>>(() => new Set([fields[0]]));
  const [predicted, setPredicted] = useState<string | null>(null);
  const F = FIELD_TYPES.find((f) => f.id === field)!;
  const pick = (f: FieldType) => {
    setField(f);
    setTried((s) => (s.has(f) ? s : new Set(s).add(f)));
  };
  const all = tried.size === fields.length;
  const onTried = opts.onTried;
  useEffect(() => {
    if (all) onTried?.();
  }, [all, onTried]);
  const lam = wavelengthMm(freq);
  const params: DockParam[] = [
    { kind: 'options', id: 'field', label: 'FIELD', valueLabel: F.short, selectedId: field, onSelect: (id) => pick(id as FieldType), sticky: true, options: FIELD_TYPES.filter((f) => fields.includes(f.id)).map((f) => ({ id: f.id, label: f.label, blurb: f.field })) },
    ...(field === 'freeField'
      ? [{ kind: 'fader' as const, id: 'angle', label: 'ANGLE', value: angle / 180, home: 0, onChange: (v: number) => setAngle(Math.round(v * 36) * 5), format: () => `${angle}° off the mic’s axis`, formatShort: () => `${angle}°` }]
      : []),
    { kind: 'options', id: 'freq', label: 'PITCH', valueLabel: freq >= 1000 ? `${freq / 1000} kHz` : `${freq} Hz`, selectedId: String(freq), onSelect: (id) => setFreq(Number(id)), options: FREQS.map((f) => ({ id: String(f), label: `${f / 1000} kHz`, blurb: `Wavefronts about ${Math.round(wavelengthMm(f))} mm apart.` })) },
  ];
  const a11y = `A 1/2 inch measurement microphone drawn at true size, pointing left. ${F.label}: ${F.field}${field === 'freeField' ? ` Sound arriving ${angle} degrees off its axis.` : ''} Wavefronts about ${Math.round(lam)} millimetres apart at ${freq} hertz.`;
  return {
    key: 'field',
    title: words.title,
    kind: 'LEARN',
    layout: 'rack',
    rack: {
      render: (w, h) => <FieldScene w={w} h={h} field={field} angleDeg={angle} freqHz={freq} accessibilityLabel={a11y} />,
      badge: words.badge,
      bezel: [
        { k: 'FIELD', v: F.short, flex: 1.2 },
        { k: 'FROM', v: field === 'freeField' ? `${angle}°` : field === 'random' ? 'ALL ROUND' : 'SEALED', flex: 1 },
        { k: 'WAVELENGTH', v: `${Math.round(lam)} mm`, sub: `${(lam / 25.4).toFixed(1)} in`, flex: 1 },
      ],
      params,
      initialParam: 'field',
    },
    well: (
      <>
        {opts.prediction ? <PredictCard p={opts.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${words.looking} · ${F.label}`} prompt={words.prompt} />
        <Card>
          <Point title={F.label.toUpperCase()}>{`${F.field} ${F.aim}`}</Point>
          <Body>{words.notes[field]}</Body>
        </Card>
        {tried.size === fields.length ? <Note>{words.after}</Note> : <Note>{`Looked at ${tried.size} of ${fields.length} fields — try each in FIELD.`}</Note>}
      </>
    ),
  };
}

/* ── STARTING SETUPS' "before any mic" ── */

export type BeforeWords = { points: readonly Pt[]; safety: readonly string[] };

/** The setting page a measurement lesson gives: one read step, kept by the
 *  journey as STARTING SETUPS' last step (it carries the checks). */
export function makeBeforePage(words: BeforeWords) {
  function BeforeAnyMic({ lesson, answers, onAnswered }: PageProps) {
    const steps: MikingStep[] = [
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {words.points.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            {words.safety.map((s) => (
              <Note key={s.slice(0, 32)} tone="warn">
                {s}
              </Note>
            ))}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }
  return BeforeAnyMic;
}
