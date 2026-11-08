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
import { createContext, Fragment, useContext, useEffect, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { MikingRack, type MikingRackSpec } from './rack/MikingRack';
// Screen Guide (owner 2026-10-31): the step on screen, in its on-screen words.
import { stepInfoKey, stepInfoOf, type MikingStepInfo } from '../mikingScreenGuides';

export type StepKind = 'WATCH' | 'LEARN' | 'TRY' | 'COMPARE' | 'PLACE' | 'LIVE' | 'PAIR' | 'POLARITY' | 'CHECK' | 'PRACTICE' | 'READ';

export type MikingStep = { key: string; title: string; kind: StepKind } & (
  | { layout: 'rack'; rack: MikingRackSpec; well: ReactNode }
  | { layout: 'read'; body: ReactNode }
);

export type StepHost = {
  step: number;
  setStep: (i: number) => void;
  onSteps: (titles: string[]) => void;
  /** Screen Guide (owner 2026-10-31, additive): the step ON SCREEN — its
   *  strip label, layout, bezel keys and dock keys — reported when what it
   *  shows changes, so the header's ⓘ explains exactly this step. Only an
   *  active part reports. Absent = nothing reported. */
  onStepInfo?: (info: MikingStepInfo) => void;
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
  /** Miking page 2's title for this lesson (journey.setupsTitle): the
   *  step keyed 'setups' shows it in place of its internal name. */
  setupsTitle?: string;
};

export const StepHostContext = createContext<StepHost | null>(null);
export const useStepHost = (): StepHost | null => useContext(StepHostContext);

/** The steps a host shows (a composed page's part keeps some of them). */
export function keptSteps<T extends { key: string }>(steps: readonly T[], keep?: StepHost['keep']): T[] {
  return keep ? steps.filter((s, i) => keep(s.key, i, steps.length)) : [...steps];
}

export function PageSteps({ steps: raw }: { steps: MikingStep[] }) {
  const host = useContext(StepHostContext);
  const named = host?.setupsTitle;
  const all = named ? raw.map((s) => (s.key === 'setups' ? { ...s, title: named } : s)) : raw;
  const onSteps = host?.onSteps;
  const steps = keptSteps(all, host?.keep);
  const titleKey = steps.map((s) => (s.kind === s.title.toUpperCase() ? s.title : `${s.kind} · ${s.title}`)).join('\u0001');
  useEffect(() => {
    onSteps?.(titleKey ? titleKey.split('\u0001') : []);
  }, [onSteps, titleKey]);
  const n = steps.length;
  const i = Math.min(Math.max(0, host?.step ?? 0), Math.max(0, n - 1));
  // Screen Guide: report the step on screen (an inactive part stays quiet).
  const shown = !host?.inactive && n > 0 ? stepInfoOf(steps[i]) : null;
  const shownKey = stepInfoKey(shown);
  const onStepInfo = host?.onStepInfo;
  useEffect(() => {
    if (shown) onStepInfo?.(shown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by what the step shows
  }, [onStepInfo, shownKey]);
  if (host?.inactive || n === 0) return null;
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
  // Keyed by step (toddler pass 2026-10-13): unkeyed, NEXT from one read
  // step to the next reused the host's scroller and opened it scrolled down.
  return host ? <Fragment key={s.key}>{host.readWrap(body)}</Fragment> : <ScrollView key={s.key}>{body}</ScrollView>;
}
