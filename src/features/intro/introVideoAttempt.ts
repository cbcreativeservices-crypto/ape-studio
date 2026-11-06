/**
 * introVideoAttempt — has the intro video ever started playing on this device?
 * (owner 2026-11-05, after launch feedback: an interrupted first viewing
 * restarted from zero with no way past it, and the video runs 2:35.)
 *
 * The first viewing keeps its no-skip rule (owner 2026-10-09). Any later
 * viewing offers Skip: an interrupted one, and a new account on a phone that
 * has already played it, which still gets the video (owner 2026-10-23).
 *
 * The key sits in the `ape:onboarding:` family, so the account wipe keeps it
 * (isOnboardingFlag), and neither resetScreenIntros nor resetOnboarding removes
 * it. An unreadable store answers "not started": the rule stays as it was.
 */
import { createLocalStore } from '../storage/localStore';

type Attempt = { started: boolean };

const store = createLocalStore<Attempt>({
  key: 'ape:onboarding:introVideoStarted',
  empty: () => ({ started: false }),
  parse: (parsed) => ({ started: (parsed as Attempt | null)?.started === true }),
});

/** Read once, BEFORE this viewing marks itself: a mark made first would offer Skip on the first viewing. */
export async function introVideoStartedBefore(): Promise<boolean> {
  await store.hydrate();
  return !store.isUnreadable() && store.get().started;
}

export function markIntroVideoStarted(): void {
  void store.set({ started: true });
}
