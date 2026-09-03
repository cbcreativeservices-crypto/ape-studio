/**
 * useEnrollmentProgress — per-topic completion % + status for a set of gs, for
 * the Enrollment screen's progress bars, core-course rows, and the "Continue
 * Learning" card (user request 2026-07-22).
 *
 * Reuses fetchEnrollmentDashboard (resolves gs→achievements + loads progress).
 * NON-BLOCKING: returns an empty map until the fetch resolves, and an empty map
 * on any error (e.g. anon RLS), so bars simply read 0% rather than failing.
 *
 * Display % is computed the SAME way as the Dashboard's topic meter (Booth
 * 2026-07-15 model, user bug 2026-07-23): the device-local method mirror is
 * merged OVER the server rows and the mean of the applicable methods' smooth
 * display % is taken — so a topic the user just studied (flashcards, etc.)
 * reflects progress here immediately, even with no account or before the
 * server write lands. Reading server `completion_pct` alone read 0 in those
 * cases, which is why the meters looked stuck.
 *
 * The formula itself is the Dashboard's `topicOverallPct` (features/dashboard/
 * topicPct) — scenarios from server completion_pct, the scenarios exemption,
 * required_passes fallback and a single Math.floor — imported, not re-derived,
 * so the two screens cannot drift apart again (bug hunt B-087: DAW read 100% on
 * the Dashboard and 75% here; Safety 20% vs 21%).
 */
import { useEffect, useState } from 'react';
import { fetchEnrollmentDashboard, type MethodProgressRow, type TopicStatus } from '../dashboard/api';
import { topicOverallPct } from '../dashboard/topicPct';
import { loadAllLocalMethodStates, mergeItemStates } from '../study/localProgress';
import { useScenarioExempt } from '../study/scenarioExempt';

export type TopicProg = { pct: number; status: TopicStatus };

// Every real topic offers all four study methods (owner 2026-08-13). This is the
// canonical order — the same one the Dashboard uses (DashboardScreen METHOD_ORDER).
// We do NOT read achievements.applicable_methods (legacy/incomplete) or gate on
// methodConfigs (EMPTY for a guest, since study_methods 403s for anon) — doing so
// made every guest topic read 0% and disagree with the Dashboard (launch-triage).
const STUDY_METHOD_KEYS = ['flashcards', 'fill_in_blank', 'matching', 'scenarios'] as const;

export function useEnrollmentProgress(gsList: number[]): Map<number, TopicProg> {
  const [map, setMap] = useState<Map<number, TopicProg>>(new Map());
  const key = [...gsList].sort((a, b) => a - b).join(',');
  // Subscribe to scenario exemptions exactly like the Dashboard: hydrates the
  // set (an Enrollments-first open would otherwise read it EMPTY and show an
  // exempt topic at 75%) and recomputes when a topic is confirmed empty.
  const exemptVersion = useScenarioExempt();
  useEffect(() => {
    if (!gsList.length) {
      setMap(new Map());
      return;
    }
    let alive = true;
    (async () => {
      try {
        const d = await fetchEnrollmentDashboard(gsList);

        // Merge the device-local progress mirror OVER the server rows for
        // DISPLAY, exactly like DashboardScreen — so work done offline / before
        // the server write, or without an account, still shows here.
        const localRows = await loadAllLocalMethodStates();
        const rows: MethodProgressRow[] = [...d.methodRows];
        for (const lr of localRows) {
          const existing = rows.find(
            (r) => r.achievement_id === lr.achievement_id && r.method_key === lr.method_key,
          );
          if (existing) {
            existing.item_states = mergeItemStates(existing.item_states, lr.item_states);
          } else {
            rows.push({
              achievement_id: lr.achievement_id,
              method_key: lr.method_key,
              completion_pct: 0,
              engagement_seconds: 0,
              answered_count: 0,
              correct_count: 0,
              item_states: lr.item_states,
            });
          }
        }
        // required_passes per method, falling back to 2 when study_methods is
        // unavailable (guest) — matches the Dashboard's rpFor.
        const rpFor = (k: string) => d.methodConfigs.find((c) => c.key === k)?.required_passes ?? 2;
        const out = new Map<number, TopicProg>();
        for (const t of d.topics) {
          const itemCount = d.itemCountByTopic.get(t.id) ?? 0;
          // Floor of the mean of all four methods' smooth display % — the SAME
          // helper the Dashboard topic card's overallPct uses, so the two
          // screens always agree.
          const pct = topicOverallPct(
            STUDY_METHOD_KEYS,
            (k) => rows.find((r) => r.achievement_id === t.id && r.method_key === k),
            itemCount,
            t.id,
            rpFor,
          );
          if (t.global_sequence != null) {
            out.set(t.global_sequence, { pct, status: d.progressByTopic.get(t.id)?.status ?? 'locked' });
          }
        }
        if (alive) setMap(out);
      } catch {
        if (alive) setMap(new Map());
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, exemptVersion]);
  return map;
}
