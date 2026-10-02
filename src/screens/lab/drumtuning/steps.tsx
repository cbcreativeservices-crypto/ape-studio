/**
 * Drum Tuning chapter STEPS — the mastering/steps.tsx pattern, local to
 * this lab, with the owner's flow names: LEARN → HEAR → ADJUST → PRACTICE →
 * REVIEW. A chapter is a run of steps: a RACK step (a drawing on the glass,
 * controls in the dock, prose in the well) or a READ step (a document
 * page). The host (DrumTuningLabScreen) runs the shared lab strip in
 * sub-step mode, keeps the chapter component MOUNTED across its steps
 * (fader positions, answers and a rendered strike survive a step change),
 * puts the OBJECTIVE at the top of the first step and the takeaway + credit
 * at the end of the last. The way forward is the shared LabNextButton:
 * RackUnit appends it to a rack well; the host's readWrap appends it to a
 * read step.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { DrumRack, type DrumRackSpec } from './DrumRack';

export type StepKind = 'LEARN' | 'HEAR' | 'ADJUST' | 'PRACTICE' | 'REVIEW';

export type DrumStep = { key: string; title: string; kind: StepKind } & (
  | { layout: 'rack'; rack: DrumRackSpec; well: ReactNode }
  | { layout: 'read'; body: ReactNode }
);

export type StepHost = {
  step: number;
  setStep: (i: number) => void;
  onSteps: (titles: string[]) => void;
  head?: ReactNode;
  tail?: ReactNode;
  readWrap: (body: ReactNode) => ReactNode;
  /** The what's-left screen is covering the chapter (it stays mounted, so
   *  ‹ PREV returns to it exactly as it was): sound and animation stop. */
  hidden?: boolean;
};

export const StepHostContext = createContext<StepHost | null>(null);

export function ChapterSteps({ steps }: { steps: DrumStep[] }) {
  const host = useContext(StepHostContext);
  const onSteps = host?.onSteps;
  // "REVIEW · Review" would read "NEXT: REVIEW · REVIEW ›" on the strip:
  // drop the kind when it equals the title.
  const titleKey = steps.map((s) => (s.kind === s.title.toUpperCase() ? s.title : `${s.kind} · ${s.title}`)).join('\u0001');
  useEffect(() => {
    onSteps?.(titleKey.split('\u0001'));
  }, [onSteps, titleKey]);
  const n = steps.length;
  const i = Math.min(Math.max(0, host?.step ?? 0), n - 1);
  const s = steps[i];
  const head = i === 0 ? host?.head : null;
  const tail = i === n - 1 ? host?.tail : null;
  if (s.layout === 'rack') {
    return (
      <DrumRack key={s.key} spec={s.rack}>
        {head}
        {s.well}
        {tail}
      </DrumRack>
    );
  }
  const body = (
    <>
      {head}
      {s.body}
      {tail}
    </>
  );
  return host ? <>{host.readWrap(body)}</> : <ScrollView key={s.key}>{body}</ScrollView>;
}
