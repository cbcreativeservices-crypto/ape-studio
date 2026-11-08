/**
 * How the Profile tab words a learner's progress (bug pass 2, S-2, 2026-11-08).
 *
 * Owner rule D117 (2026-10-29): learner progress never shows "N of total". A
 * row reading "1 of 12 topics complete" leads with how much is left, which is
 * intimidating and defeating. Progress says what was DONE, by count.
 *
 * Import-free so its node test runs bare.
 */

const topics = (n: number) => `${n} ${n === 1 ? 'topic' : 'topics'}`;

/**
 * A certificate / program / subject row's progress line.
 *
 * `done` is null while the progress read is out or failed: "—", never a zero
 * the learner's work has not been checked against (hunt 13).
 */
export function topicsDoneHint(done: number | null, total: number): string {
  if (done == null) return '—';
  if (done <= 0) return 'Not started yet';
  if (total > 0 && done >= total) return `All ${topics(total)} done`;
  return `${topics(done)} done`;
}

/**
 * The "Across the whole academy" line (opt-in). A count of what was done, no
 * percentage and no bar: both measure the learner against EVERYTHING the
 * academy offers, which not everyone is enrolled in or means to do (D117).
 *
 * Keyed on the COUNT, never on the floored percentage: with 166 topics, one
 * finished topic is floor(0.6) = 0%, and that read "Not started yet" over
 * finished work. `null` = the profile is unread: "—".
 */
export function academyTopicsDone(completeCount: number | null): string {
  if (completeCount == null) return '—';
  if (completeCount <= 0) return 'Not started yet';
  return `${topics(completeCount)} done`;
}

/** The MY PROGRESS section header: the goals the learner chose, and the
 *  whole-academy count only once they asked for it. */
export function myProgressSummary(goalCount: number, showBigPicture: boolean, completeCount: number | null): string {
  const goals = goalCount ? `${goalCount} ${goalCount === 1 ? 'goal' : 'goals'}` : '';
  if (!showBigPicture) return goals;
  const academy = academyTopicsDone(completeCount);
  return goals ? `${goals} · ${academy}` : academy;
}
