/**
 * Apply over-the-air updates on launch, without the member doing anything.
 *
 * ⛔ WHY THIS EXISTS. `expo-updates` downloads a new bundle in the background
 * and applies it on the NEXT launch. So seeing a change means: open, wait long
 * enough for a silent download, force-close, open again — and if you kill the
 * app too early the download is thrown away with no indication. The owner lost
 * real time to exactly that, twice, and reasonably went looking in TestFlight
 * for an update TestFlight can never deliver.
 *
 * This checks on start, downloads, and reloads straight into the new bundle,
 * so a publish reaches the phone on the next ordinary launch. One launch, not
 * three, and nothing to remember.
 *
 * ── ⛔ WHY IT IS JAVASCRIPT AND NOT A CONFIG FLAG ──────────────────────────
 * The obvious fix is `updates.fallbackToCacheTimeout` in app.json, which makes
 * the launch WAIT for the update. It is also unusable right now: app.json is a
 * FINGERPRINT INPUT, so editing it changes runtimeVersion, and every later
 * `eas update` would publish to a runtime no installed build has — succeeding
 * and reaching nobody, silently. That change can only ride along with a native
 * build. This file ships over the air today and changes no fingerprint.
 *
 * ── ⛔ THE RULES IT MUST NOT BREAK ─────────────────────────────────────────
 * 1. ONLY DURING STARTUP. A reload discards JS state — a half-typed profile,
 *    a lab mid-run, an unsent message. It is only ever safe in the first few
 *    seconds, before anyone has done anything, which is why the reload is
 *    abandoned if the work takes longer than `RELOAD_WINDOW_MS`. A late
 *    download is still KEPT; it simply applies on the next launch, which is
 *    the old behaviour and therefore never worse.
 * 2. NEVER IN DEV. `Updates.isEnabled` is false in Expo Go, dev clients and
 *    the web preview, where the calls throw. Bail before touching anything.
 * 3. NEVER THROW INTO THE APP. An update check failing is not a reason for a
 *    launch to fail. Everything is caught and dropped to a warn.
 * 4. NO LOOP. `checkForUpdateAsync` compares against the RUNNING update, so
 *    once applied the next launch finds nothing available. There is no state
 *    to reset and no counter to keep.
 */
/**
 * How long after launch a reload is still unobtrusive.
 *
 * Long enough for a check and a bundle on a normal connection, short enough
 * that nobody is mid-sentence. Past this the update is already downloaded and
 * waiting — it just applies the ordinary way.
 */
const RELOAD_WINDOW_MS = 12_000;

/**
 * ⚠️ THIS FILE IMPORTS NOTHING, and that is deliberate. `expo-updates` is a
 * native module the test runner cannot resolve, so the rules above could not
 * be tested at all from a file that imported it. The wiring lives next door
 * in `startAutoUpdate.ts`; everything worth getting right lives here.
 */
export async function runAutoUpdate(
  deps: {
    isEnabled: boolean;
    check: () => Promise<{ isAvailable: boolean }>;
    fetch: () => Promise<unknown>;
    reload: () => Promise<void>;
    now: () => number;
  },
  windowMs: number = RELOAD_WINDOW_MS,
): Promise<'disabled' | 'current' | 'reloaded' | 'deferred' | 'failed'> {
  if (!deps.isEnabled) return 'disabled';
  const startedAt = deps.now();
  try {
    const res = await deps.check();
    if (!res.isAvailable) return 'current';
    await deps.fetch();
    // ⛔ The window covers the WHOLE operation, not just the download: a slow
    // check leaves just as little room for a safe reload as a slow download.
    if (deps.now() - startedAt > windowMs) return 'deferred';
    await deps.reload();
    return 'reloaded';
  } catch {
    return 'failed';
  }
}
