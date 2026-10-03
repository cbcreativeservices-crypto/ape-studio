/**
 * saveFailureNotice — the ONE shared "your change was not kept" notice for
 * device-local writes nobody else reports (owner ruling 2026-10-03: "if it
 * fails the user needs to know").
 *
 * Quick, fire-and-forget saves — a bookmark star, a Home book toggle, deck
 * order, tuner prefs, pace, mixing priorities, a cymatics tick — answer a
 * write result that their callers drop. A popup per tap would be noise, so
 * every such failure comes here and raises at most ONE notice per failure
 * burst: nothing more while it is up, and nothing more for QUIET_MS after it
 * was shown or dismissed.
 *
 * Who reports here:
 *   • createLocalStore, for every write the DEVICE REFUSED, unless the caller
 *     passed `{ reportFailure: false }` because it shows its own message
 *     (Home Setup, SPL calibration, Exposure settings, Scenarios' report…) or
 *     the write is app bookkeeping, not a change the user made. One message
 *     per failure, never two.
 *   • hand-rolled stores whose write failure used to reach only the console
 *     (Settings, a measurement's title/notes edit).
 * Never for a write dropped by the account wipe (the generation moved): that
 * is not a failure the user caused, and the data was the departing account's.
 *
 * Low-Light: this is the user's OWN action failing, so it may show there (the
 * owner's ruling is that they must know); the quiet window keeps it from
 * repeating.
 *
 * Pure — no react-native — so node tests load it with the stores. `App` wires
 * the real dialog (notify → AppDialog) once, at module scope.
 */

export const SAVE_FAILURE_TITLE = "Some changes couldn't be saved";
export const SAVE_FAILURE_BODY =
  "This phone couldn't save your latest changes, so they may be gone the next time the app opens. Free up some storage space, then try again.";

/** After the notice was shown or dismissed, further failures stay quiet this long. */
export const SAVE_FAILURE_QUIET_MS = 3 * 60 * 1000;
/** A notice whose dismissal never came back (a host that dropped it) stops
 *  blocking after this long. */
const STUCK_MS = 10 * 60 * 1000;

type Presenter = (title: string, body: string, onDismiss: () => void) => void;

let presenter: Presenter | null = null;
let showingSince: number | null = null;
let quietUntil = 0;
/** A failure before the presenter was wired: shown once it is. */
let pending = false;
let now: () => number = () => Date.now();

function present(): void {
  const p = presenter;
  if (!p) {
    pending = true;
    return;
  }
  pending = false;
  const at = now();
  showingSince = at;
  quietUntil = at + SAVE_FAILURE_QUIET_MS;
  try {
    p(SAVE_FAILURE_TITLE, SAVE_FAILURE_BODY, () => {
      showingSince = null;
      quietUntil = now() + SAVE_FAILURE_QUIET_MS;
    });
  } catch {
    showingSince = null;
  }
}

/** A device-local write was refused and no caller will say so. Raises the
 *  shared notice unless one is up or was seen within the quiet window.
 *  Answers whether a notice was raised (or held for the presenter). */
export function reportUnhandledSaveFailure(): boolean {
  const t = now();
  if (showingSince != null && t - showingSince < STUCK_MS) return false;
  if (t < quietUntil) return false;
  if (pending) return false;
  present();
  return true;
}

/** Wired once by App (notify). A failure that came first is shown now. */
export function setSaveFailurePresenter(fn: Presenter | null): void {
  presenter = fn;
  if (fn && pending) present();
}

/** Tests only: a fresh app session, with an optional clock. */
export function __resetSaveFailureNoticeForTests(clock?: () => number): void {
  presenter = null;
  showingSince = null;
  quietUntil = 0;
  pending = false;
  now = clock ?? (() => Date.now());
}
