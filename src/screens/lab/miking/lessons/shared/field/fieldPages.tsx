/**
 * THE FIELD FAMILY'S PAGE PARTS (Lab 6 group 2): the read steps the field
 * lessons share — the "before any mic" page with its safety cards, a check
 * step, and a plain read card. The interactive steps are in fieldSteps.tsx.
 * Words are the lesson's (walked by the learner-text test).
 */
import type { ReactNode } from 'react';
import type { Lesson, SourcePageId } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { safetyCards, type SafetyId } from './safety.ts';

export type Pt = { title: string; text: string };

/** A page's CHECK step: optional words above its scenarios. */
export function fieldCheckStep(lesson: Lesson, page: SourcePageId, answers: PageProps['answers'], onAnswered: PageProps['onAnswered'], intro?: ReactNode, title = 'Check'): MikingStep {
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

/** A read step of points. */
export function readStep(key: string, title: string, points: readonly Pt[], notes: readonly ReactNode[] = []): MikingStep {
  return {
    key,
    title,
    kind: 'LEARN',
    layout: 'read',
    body: (
      <>
        <Card>
          {points.map((p) => (
            <Point key={p.title} title={p.title}>
              {p.text}
            </Point>
          ))}
        </Card>
        {notes}
      </>
    ),
  };
}

/** STARTING SETUPS' "before any mic" for a field site: the lesson's points,
 *  the safety cards it needs (exact, plain words), and its checks. */
export function makeFieldBefore(words: { points: readonly Pt[]; safety: readonly SafetyId[]; note?: string }) {
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
            {safetyCards(words.safety).map((c) => (
              <Note key={c.id} tone="warn">
                {`${c.title} · ${c.text}`}
              </Note>
            ))}
            {words.note ? <Note>{words.note}</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }
  return BeforeAnyMic;
}
