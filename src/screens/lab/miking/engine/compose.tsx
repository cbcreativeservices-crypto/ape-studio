/**
 * A COMPOSED journey page (owner restructure 2026-10-06): one page on the
 * strip, built from parts that are each an ordinary page component — MEET IT
 * is a lesson's orient page followed by its how-it-sounds page trimmed to
 * where the sound leaves; STARTING SETUPS is the engine's setups steps
 * followed by the lesson's "before any mic" step; MICROPHONES shows the mic
 * on the instrument before the lesson's own microphone page.
 *
 * Every part stays MOUNTED (its state survives a step change, as on any
 * page) and reports its step titles; the strip counts the parts' kept steps
 * end to end. The page GOAL heads the first part's first step, the takeaway
 * and credit line tail the last part's last step. Engine-level: no family
 * page knows it is a part.
 */
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StepHostContext, type StepHost } from './steps';
import type { PageProps } from '../pages/pageTypes';

export type PagePart = { key: string; Page: (p: PageProps) => ReactNode; keep?: StepHost['keep'] };

/** Which part a page-wide step falls in, and its step within that part. */
export function locateStep(counts: readonly number[], step: number): { part: number; local: number } {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return { part: 0, local: Math.max(0, step) };
  let s = Math.max(0, Math.min(step, total - 1));
  for (let i = 0; i < counts.length; i++) {
    if (s < counts[i]) return { part: i, local: s };
    s -= counts[i];
  }
  const last = counts.length - 1;
  return { part: last, local: Math.max(0, counts[last] - 1) };
}

export function ComposedPage({ parts, props }: { parts: readonly PagePart[]; props: PageProps }) {
  const host = useContext(StepHostContext);
  const [titles, setTitles] = useState<string[][]>(() => parts.map(() => []));
  const reporters = useMemo(
    () =>
      parts.map((_, i) => (t: string[]) =>
        setTitles((prev) => {
          const cur = prev[i] ?? [];
          if (cur.length === t.length && cur.every((x, k) => x === t[k])) return prev;
          const next = [...prev];
          next[i] = t;
          return next;
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one reporter per part
    [parts.length],
  );
  const all = titles.flat();
  const allKey = all.join('\u0001');
  const onSteps = host?.onSteps;
  useEffect(() => {
    if (allKey) onSteps?.(allKey.split('\u0001'));
  }, [onSteps, allKey]);

  const counts = titles.map((t) => t.length);
  const { part: active, local } = locateStep(counts, host?.step ?? 0);
  const offsets = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0));
  // The tail belongs to the last part that shows a step.
  let lastShown = parts.length - 1;
  while (lastShown > 0 && counts[lastShown] === 0) lastShown--;
  const setStep = host?.setStep;
  const setLocal = useCallback((i: number, k: number) => setStep?.(offsets[k] + i), [setStep, offsets.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {parts.map((p, k) => {
        const sub: StepHost = {
          step: k === active ? local : 0,
          setStep: (i) => setLocal(i, k),
          onSteps: reporters[k],
          head: k === 0 ? host?.head : null,
          tail: k === lastShown ? host?.tail : null,
          readWrap: host?.readWrap ?? ((b) => b),
          hidden: host?.hidden,
          keep: p.keep,
          inactive: k !== active,
        };
        const Page = p.Page;
        return (
          <StepHostContext.Provider key={p.key} value={sub}>
            <Page {...props} />
          </StepHostContext.Provider>
        );
      })}
    </>
  );
}
