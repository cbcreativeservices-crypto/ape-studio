/**
 * CheckCreditScope — a module's CHECK YOURSELF cards report to their host
 * (owner's decision 1, 2026-11-14: "done = work done"). Every CheckQuestion
 * inside the scope registers itself on mount and reports a right answer; once
 * every card the module drew is answered right, `onComplete` fires ONCE.
 *
 * Outside a scope a CheckQuestion behaves exactly as before (no context, no
 * report), so the labs of other groups are untouched. Key the scope per unit
 * so a new module starts a fresh tally. Stored credit is never touched here:
 * a module already credited stays credited whatever happens on screen.
 */
import { createContext, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { allChecksSolved } from './checkCreditRules';

type CheckCreditApi = { register: (id: string) => () => void; solved: (id: string) => void };

export const CheckCreditContext = createContext<CheckCreditApi | null>(null);

export function CheckCreditScope({ onComplete, children }: { onComplete: () => void; children: ReactNode }) {
  const registered = useRef(new Set<string>());
  const solved = useRef(new Set<string>());
  const fired = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const check = useCallback(() => {
    if (fired.current || !allChecksSolved(registered.current, solved.current)) return;
    fired.current = true;
    onCompleteRef.current();
  }, []);
  const api = useMemo<CheckCreditApi>(
    () => ({
      register: (id) => {
        registered.current.add(id);
        return () => {
          registered.current.delete(id);
        };
      },
      solved: (id) => {
        solved.current.add(id);
        check();
      },
    }),
    [check],
  );
  return <CheckCreditContext.Provider value={api}>{children}</CheckCreditContext.Provider>;
}
