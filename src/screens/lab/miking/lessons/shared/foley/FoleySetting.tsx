/**
 * THE FOLEY FAMILY'S "BEFORE ANY MIC" (LessonArt.pages.setting; served on
 * STARTING SETUPS by engine/restructure): the voice family's page shape
 * (makeVoiceSetting) with one addition — a lesson's own decision step (key
 * 'path', kept on STARTING SETUPS) may carry an illustrated, expandable figure:
 * F04's three sensing paths (air, water, structure) drawn side by side.
 *
 *   (path)          the lesson's decision, its points, its figure
 *   BEFORE ANY MIC  the lesson's points, the hearing note, then the checks.
 * FULLY SILENT; static.
 */
import type { ReactNode } from 'react';
import { copyOf } from '../../../engine/model/copy.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Note, Point, ScenarioList } from '../../../engine/kit';
import { ExpandableFigure } from '../../../../kit/ExpandableFigure';
import type { PageProps } from '../../../pages/pageTypes';

type PageFn = (p: PageProps) => ReactNode;

export type FoleySettingSpec = {
  hearing: string;
  path?: {
    title: string;
    points: readonly { title: string; text: string }[];
    note?: string;
    figure?: { badge: string; title: string; aspect: number; render: (w: number, h: number) => ReactNode };
  };
};

export function makeFoleySetting(spec: FoleySettingSpec): PageFn {
  return function FoleySetting({ lesson, answers, onAnswered }: PageProps) {
    const C = copyOf(lesson);
    const path = spec.path;
    const steps: MikingStep[] = [
      ...(path
        ? [
            {
              key: 'path',
              title: path.title,
              kind: 'LEARN',
              layout: 'read',
              body: (
                <>
                  {path.figure ? <ExpandableFigure badge={path.figure.badge} title={path.figure.title} aspect={path.figure.aspect} render={path.figure.render} /> : null}
                  <Card>
                    {path.points.map((b) => (
                      <Point key={b.title} title={b.title}>
                        {b.text}
                      </Point>
                    ))}
                  </Card>
                  {path.note ? <Note>{path.note}</Note> : null}
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
