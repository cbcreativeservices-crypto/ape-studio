/**
 * Amp module STEPS — how a module with several live rigs is laid out on the
 * Rack Unit (rack rebuild, owner 2026-09-30). One rack can pin ONE display, so
 * a module declares its reading order as steps: a RACK step (one rig or
 * diagram on the glass, its controls in the dock, its prose in the well) or a
 * READ step (a document page — calculators, cards, the final assessment).
 * The host screen (AmpModuleScreen) shows the shared lab strip in sub-step
 * mode, keeps the module component MOUNTED across steps (its state —
 * sliders, scores, the final's answers — survives), puts the OBJECTIVE at the
 * top of the first step and the checks / takeaway / MARK COMPLETE at the end
 * of the last. The way forward at the end of every step is the shared
 * LabNextButton ("NEXT: <step> ›" / FINISH): a RackUnit well appends it under
 * the host's LabNavProvider, and the host's readWrap appends it to a read
 * step — nothing is drawn here.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { AmpRack, type AmpRackSpec } from './AmpRack';

export type AmpStep = { key: string; title: string } & (
  | { kind: 'rack'; rack: AmpRackSpec; well: ReactNode }
  | { kind: 'read'; body: ReactNode }
);

export type AmpStepHost = {
  step: number;
  setStep: (i: number) => void;
  /** The module reports its step titles (stable callback). */
  onSteps: (titles: string[]) => void;
  /** Rendered at the top of the FIRST step (the objective). */
  head?: ReactNode;
  /** Rendered at the end of the LAST step (checks, takeaway, credit). */
  tail?: ReactNode;
  /** The host's document scroller for a READ step (ends with LabNextButton). */
  readWrap: (body: ReactNode) => ReactNode;
};

export const AmpStepHostContext = createContext<AmpStepHost | null>(null);

export function AmpModuleSteps({ steps }: { steps: AmpStep[] }) {
  const host = useContext(AmpStepHostContext);
  const onSteps = host?.onSteps;
  const titleKey = steps.map((s) => s.title).join('\u0001');
  useEffect(() => {
    onSteps?.(titleKey.split('\u0001'));
  }, [onSteps, titleKey]);
  const n = steps.length;
  const i = Math.min(Math.max(0, host?.step ?? 0), n - 1);
  const s = steps[i];
  const head = i === 0 ? host?.head : null;
  const tail = i === n - 1 ? host?.tail : null;
  if (s.kind === 'rack') {
    return (
      <AmpRack key={s.key} spec={s.rack}>
        {head}
        {s.well}
        {tail}
      </AmpRack>
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
