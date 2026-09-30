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
  alignDefinitionTier,
  corpusStats,
  getMeta,
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

/**
 * ⛔ A RUN TOKEN, NOT A `running` + `cancelled` PAIR (bug hunt 2026-09-30,
 * pass 2). With the pair, a cancel followed by a restart inside the 8 s settle
 * — the Settings switch flicked off and on, an account switch from one member
 * to another — found `running` still true and returned, and then the old run
 * woke, saw `cancelled` and quit: no save at all for the rest of the session.
 * And `running` was only set AFTER the awaited preference read, so two calls in
 * the same moment both started a download.
 *
 * Every start and every cancel bumps `runId`; a run is live only while its own
 * id is still current, and a new start supersedes a cancelled one at once.
 */
let runId = 0;
let liveRun = 0;

/** Stop the current run (sign-out, the switch going off, the screen taking over). */
export function cancelGlossaryPrefetch(): void {
  runId += 1;
}

export function glossaryPrefetchRunning(): boolean {
  return liveRun !== 0 && liveRun === runId;
}

/**
 * Fill in whatever the device is missing. Safe to call repeatedly — it returns
 * immediately when a run is already in flight, and does nothing once complete.
 */
export async function prefetchGlossary(table: CorpusTable = 'glossary_browse_v'): Promise<void> {
  if (!OFFLINE_AVAILABLE || glossaryPrefetchRunning()) return;
  runId += 1;
  const mine = runId;
  liveRun = mine;
  const cancelled = () => runId !== mine;

  try {
    if (!(await autoOfflineEnabled())) return;
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    if (cancelled()) return;
    // Members only run this, so any teasers a free reader left behind go first
    // — otherwise they count as "saved" and are never replaced.
    await alignDefinitionTier(table, 'member');

    // The term list first — it is what makes the glossary OPEN offline at all.
    // ⛔ "Some terms" is not "the term list" (bug hunt 2026-09-30, pass 3). A
    // term save killed midway (backgrounded and reclaimed, a crash) leaves
    // rows but no completeness marker — loadTerms then reads the store as
    // EMPTY, so the glossary does not open offline at all — and `!stats.terms`
    // skipped the re-save for good. The marker must match the rows.
    const stats = await corpusStats(table);
    const complete = Number(await getMeta(`terms_complete:${table}`));
    if (!stats.terms || complete !== stats.terms) {
      const terms = await fetchCorpusTerms(table);
      if (cancelled()) return;
      await saveTerms(table, terms);
    }

    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      if (cancelled()) return;
      const ids = await idsMissingDefinitions(table, PAGE);
      if (!ids.length) return; // complete
      const rows = await fetchDefinitionsFor(table, ids);
      if (cancelled()) return;
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
    if (liveRun === mine) liveRun = 0;
  }
}
