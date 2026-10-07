/**
 * Lesson STEPS — the drumtuning/steps.tsx pattern, local to the Miking Labs
 * (blueprint §7). A page is a run of steps: a RACK step (the scene on the
 * glass, controls in the dock, prose in the well) or a READ step (a document
 * page). The host keeps the page MOUNTED across its steps (poses, answers and
 * the chosen mic survive a step change), puts the GOAL on the first step and
 * the takeaway + credit line on the last. The way forward is the shared
 * LabNextButton (RackUnit appends it to a rack well; the host's readWrap to a
 * read step).
 *
 * A journey page may be COMPOSED of parts (engine/compose.tsx — MEET IT is a
 * lesson's orient page and its trimmed how-it-sounds page): each part's
 * steps run under a part host that offsets the step index, keeps only the
 * steps the part shows (`keep`), and renders nothing while another part's
 * step is on screen (`inactive`) — the part stays mounted, so its state
 * survives, and still reports its step titles.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { MikingRack, type MikingRackSpec } from './rack/MikingRack';

export type StepKind = 'WATCH' | 'LEARN' | 'TRY' | 'COMPARE' | 'PLACE' | 'LIVE' | 'PAIR' | 'POLARITY' | 'CHECK' | 'PRACTICE' | 'READ';

export type MikingStep = { key: string; title: string; kind: StepKind } & (
  | { layout: 'rack'; rack: MikingRackSpec; well: ReactNode }
  | { layout: 'read'; body: ReactNode }
);

export type StepHost = {
  step: number;
  setStep: (i: number) => void;
  onSteps: (titles: string[]) => void;
  head?: ReactNode;
  tail?: ReactNode;
  readWrap: (body: ReactNode) => ReactNode;
  /** The what's-left screen covers the page (it stays mounted). */
  hidden?: boolean;
  /** A composed page's part: which of its steps it shows (key, index, count). */
  keep?: (key: string, i: number, n: number) => boolean;
  /** A composed page's part whose steps are not on screen: render nothing
   *  (but stay mounted and report the titles). */
  inactive?: boolean;
};

export const StepHostContext = createContext<StepHost | null>(null);
export const useStepHost = (): StepHost | null => useContext(StepHostContext);

/** The steps a host shows (a composed page's part keeps some of them). */
export function keptSteps<T extends { key: string }>(steps: readonly T[], keep?: StepHost['keep']): T[] {
  return keep ? steps.filter((s, i) => keep(s.key, i, steps.length)) : [...steps];
}

export function PageSteps({ steps: all }: { steps: MikingStep[] }) {
  const host = useContext(StepHostContext);
  const onSteps = host?.onSteps;
  const steps = keptSteps(all, host?.keep);
  const titleKey = steps.map((s) => (s.kind === s.title.toUpperCase() ? s.title : `${s.kind} · ${s.title}`)).join('\u0001');
  useEffect(() => {
    onSteps?.(titleKey ? titleKey.split('\u0001') : []);
  }, [onSteps, titleKey]);
  const n = steps.length;
  if (host?.inactive || n === 0) return null;
  const i = Math.min(Math.max(0, host?.step ?? 0), n - 1);
  const s = steps[i];
  const head = i === 0 ? host?.head : null;
  const tail = i === n - 1 ? host?.tail : null;
  if (s.layout === 'rack') {
    return (
      <MikingRack key={s.key} spec={s.rack}>
        {head}
        {s.well}
        {tail}
      </MikingRack>
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
