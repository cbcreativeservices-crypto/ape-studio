/**
 * labThanks — one thank-you, the first time someone comes back out of a lab
 * (owner 2026-11-05: "the first time a user returns backwards out of a lab").
 *
 * It lives at the root stack, not in the labs: a lab can be left by ‹, by
 * "Leave the lab", by the end screen or by Android BACK, and every one of them
 * pops the route. `labRouteName` is the catalog's one list of lab screens, so
 * a new lab is covered with no change here.
 *
 * Once per device, ever: the flag is on the KEEP and GUEST_KEEP lists
 * (clearLocalAccountData.ts), because it is not work and a guest would
 * otherwise be thanked again every session. A read that failed thanks nobody
 * (better one thank-you lost than a repeat), and while popups are suppressed
 * nothing is spent, so the next exit still says it.
 */
import { notify } from '../../lib/confirm';
import { labRouteName } from '../../screens/lab/labCatalog';
import { areOverlaysSuppressed } from '../dev/popupSuppressStore';
import { createLocalStore } from '../storage/localStore';

export const LAB_THANKS_TITLE = 'Thank you';
export const LAB_THANKS_BODY =
  'Thank you for being one of our very first users. We appreciate your support and your understanding as we resolve bugs, polish the details and fix errors.\n\nOur goal is to keep improving the app and to keep adding excellent content. There is so much to learn, and we are eager to bring you more and more topics, labs, subjects and technology.';

/** Long enough for the pop to finish; the dialog's own hold covers a modal still closing. */
const AFTER_POP_MS = 450;

type Thanks = { shown: boolean };

const store = createLocalStore<Thanks>({
  key: 'ape:labThanksShown',
  empty: () => ({ shown: false }),
  parse: (parsed) => ({ shown: (parsed as Thanks | null)?.shown === true }),
});

type StackState = { index: number; routes: readonly { key: string; name: string }[] };

/** Did this change take the front route out of a lab and back to something
 *  that is not one? Pure. Going deeper (a module, the glossary, the paywall)
 *  keeps the lab on the stack, and module → lab is still inside the lab. */
export function leftLabBackward(
  prev: StackState | null | undefined,
  next: StackState,
  isLab: (route: string) => boolean,
): boolean {
  if (!prev || next.routes.length >= prev.routes.length) return false;
  const was = prev.routes[prev.index];
  const now = next.routes[next.index];
  if (!was || !now) return false;
  return isLab(was.name) && !isLab(now.name) && !next.routes.some((r) => r.key === was.key);
}

let claiming = false;
let showTimer: ReturnType<typeof setTimeout> | undefined;

async function thankOnce(): Promise<void> {
  if (claiming) return;
  claiming = true;
  try {
    await store.hydrate();
    if (store.isUnreadable() || store.get().shown || areOverlaysSuppressed()) return;
    void store.set({ shown: true });
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => notify(LAB_THANKS_TITLE, LAB_THANKS_BODY), AFTER_POP_MS);
  } finally {
    claiming = false;
  }
}

/** Called by the root stack on every pop; loaded on the first one, so the
 *  catalog stays out of app start. */
export function onRootPop(prev: StackState, next: StackState): void {
  if (leftLabBackward(prev, next, (route) => labRouteName(route) !== undefined)) void thankOnce();
}
