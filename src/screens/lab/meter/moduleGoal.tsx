/**
 * "DONE = WORK DONE" (owner's decision 1, phase 3, 2026-11-14): a module
 * counts when its own goal or check is met, never when it is opened.
 *
 * Shared by F6's module labs (Visual Audio Analysis, Digital Audio Systems,
 * Gain Staging, Vacuum Tube Fundamentals):
 *
 *   - The host wraps the module in <ModuleGoalProvider need={n} onMet={…}>,
 *     where `need` is how many CHECK YOURSELF questions the module holds
 *     (MODULE_CHECKS below). onMet fires ONCE per visit, the moment the last
 *     one is answered right.
 *   - The module draws its checks with <GoalCheck spec={…} /> (the shared
 *     CheckQuestion, which already retries until right) instead of
 *     <CheckQuestion>.
 *   - A module whose goal is hands-on (no check) calls useGoalMet() and runs
 *     it when the goal is reached (`need` is then 0, so only that call counts).
 *
 * Credit already earned is never touched: this only decides when NEW credit
 * is written.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { CheckQuestion, type CheckSpec } from '../foundations/bits';

type Goal = { solved: (key: string) => void; met: () => void };
const GoalCtx = createContext<Goal | null>(null);

/** Distinct right answers needed: enough once every check is solved. */
export function goalReached(solved: ReadonlySet<string>, need: number): boolean {
  return need > 0 && solved.size >= need;
}

export function ModuleGoalProvider({ need, onMet, resetKey, children }: { need: number; onMet: () => void; resetKey: string; children: ReactNode }) {
  const solvedRef = useRef<Set<string>>(new Set());
  const firedRef = useRef(false);
  const onMetRef = useRef(onMet);
  onMetRef.current = onMet;
  // A new module (or a new visit) starts with nothing answered.
  useEffect(() => {
    solvedRef.current = new Set();
    firedRef.current = false;
  }, [resetKey]);
  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onMetRef.current();
  }, []);
  const value = useMemo<Goal>(
    () => ({
      solved: (key) => {
        solvedRef.current.add(key);
        if (goalReached(solvedRef.current, need)) fire();
      },
      met: fire,
    }),
    [need, fire],
  );
  return <GoalCtx.Provider value={value}>{children}</GoalCtx.Provider>;
}

/** The shared CHECK YOURSELF card, reporting its right answer to the goal. */
export function GoalCheck({ spec, onSolved }: { spec: CheckSpec; onSolved?: () => void }) {
  const goal = useContext(GoalCtx);
  return (
    <CheckQuestion
      spec={spec}
      onSolved={() => {
        goal?.solved(spec.question);
        onSolved?.();
      }}
    />
  );
}

/** For a hands-on goal: call the returned function when the goal is reached. */
export function useGoalMet(): () => void {
  const goal = useContext(GoalCtx);
  return useCallback(() => goal?.met(), [goal]);
}

/** Runs `met` once `reached` turns true (a hands-on goal read from state). */
export function useMetWhen(reached: boolean): void {
  const met = useGoalMet();
  useEffect(() => {
    if (reached) met();
  }, [reached, met]);
}
