/**
 * Put the glossary on the phone in the background, so it is already there.
 *
 * Owner 2026-09-22: "4MB seems small for a phone to carry and really matter…
 * can we not just have it loaded in the background while the user is doing
 * things after logging in? not start and wait until the user 'opens the
 * glossary'?" — correct. The whole corpus is 5.4 MB (1.5 terms + 3.8
 * definitions) across 31,858 rows. That is one photo. Making a member find a
 * button for it was the wrong default.
 *
 * MEMBERS ONLY, matching the ruling that saving the whole glossary is a
 * membership feature. A free reader still keeps whatever they actually read.
 *
 * ⚠️ IT CANNOT TELL WI-FI FROM CELLULAR. Neither expo-network nor netinfo is
 * installed, and adding one is a native dependency — a new build, not an
 * update. So this spends up to 5.4 MB of whatever connection is to hand. That
 * is cheap on wi-fi and not cheap on a ship's satellite link, which is the
 * exact reader this feature is for. Hence the off switch, which is honoured
 * here and offered in Settings. `expo-network` is on the next-build checklist;
 * once it lands, gate this on wi-fi and the caveat disappears.
 *
 * Deliberately unhurried: it waits for the app to settle after launch, works in
 * small pages, and yields between them. Nothing here should ever be the reason
 * a screen stutters.
 */
import {
  OFFLINE_AVAILABLE,
  corpusStats,
  idsMissingDefinitions,
  saveDefinitions,
  saveTerms,
} from './offlineCorpus';
import { fetchCorpusTerms, fetchDefinitionsFor, yieldToUi, type CorpusTable } from './corpusFetch';
import { autoOfflineEnabled } from './autoOfflinePref';

/** Small enough that a cancelled run has wasted almost nothing. */
const PAGE = 300;
/** 32,000 terms / 300 with headroom; a bound, never the expected count. */
const MAX_PASSES = 140;
/** Let the launch finish before competing with it for the network. */
const SETTLE_MS = 8000;

let running = false;
let cancelled = false;

/** Stop the current run (sign-out, the switch going off, the screen taking over). */
export function cancelGlossaryPrefetch(): void {
  cancelled = true;
}

export function glossaryPrefetchRunning(): boolean {
  return running;
}

/**
 * Fill in whatever the device is missing. Safe to call repeatedly — it returns
 * immediately when a run is already in flight, and does nothing once complete.
 */
export async function prefetchGlossary(table: CorpusTable = 'glossary_browse_v'): Promise<void> {
  if (!OFFLINE_AVAILABLE || running) return;
  if (!(await autoOfflineEnabled())) return;

  running = true;
  cancelled = false;
  try {
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    if (cancelled) return;

    // The term list first — it is what makes the glossary OPEN offline at all.
    const stats = await corpusStats(table);
    if (!stats.terms) {
      const terms = await fetchCorpusTerms(table);
      if (cancelled) return;
      await saveTerms(table, terms);
    }

    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      if (cancelled) return;
      const ids = await idsMissingDefinitions(table, PAGE);
      if (!ids.length) return; // complete
      const rows = await fetchDefinitionsFor(table, ids);
      if (cancelled) return;
      await saveDefinitions(table, rows);
      // A page where nothing was storable means those ids are NULL upstream and
      // will come back every pass — stop rather than spin.
      if (!rows.some((r) => r.definition)) return;
      await yieldToUi();
      await new Promise((r) => setTimeout(r, 250)); // stay out of the way
    }
  } catch {
    // Offline, rate-limited, signed out mid-run: keep whatever landed and try
    // again next launch. There is nothing here worth telling the reader about.
  } finally {
    running = false;
  }
}
