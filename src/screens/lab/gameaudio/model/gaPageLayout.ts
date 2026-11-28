/**
 * gaPageLayout — the Game Audio Lab's PAGE LAYOUT, and the one-time move of
 * saved page marks from the 22-page layout to the 24-page layout.
 *
 * WHY (owner, 2026-11-14, decision 5: "Split a page that holds two lessons
 * into two pages"). Page 4 (kinds of games + whose ears) and page 10 (zones +
 * loop joins) each held two lessons. They are four pages now, so the lab has
 * 24 pages, and every page after the old page 4 has a new number.
 *
 * HOW A PAGE MARK IS KEYED. The shared shell (kit/PagedLab) saves one record
 * per lab in `ape:game-audio:v1` (features/lab/pagedProgress): the INDEXES
 * of the finished pages, the index last open, and "lab done". An index is a
 * place in the page list, so a record saved before the split means other
 * pages after it. The lab's certificate credit (tr_game_audio) is NOT in
 * this record: it is reported once and kept by labCompletion, and nothing
 * here touches it.
 *
 * THE MAP (layout 1 index → layout 2 indexes). A finished old page 4 or 10
 * had every goal and both checks of BOTH its lessons, so it marks both of
 * the pages it became. Nothing earned is dropped, and nothing not earned is
 * added:
 *     0, 1, 2      →  0, 1, 2
 *     3            →  3 and 4      (Kinds of games · Whose ears)
 *     4 … 8        →  5 … 9
 *     9            →  10 and 11    (Ambience and zones · Loops and their joins)
 *     10 … 21      →  12 … 23
 * An index outside 0…21 (a damaged record) is dropped: it named no page.
 *
 * HOW THE DEVICE KNOWS WHICH LAYOUT A RECORD IS IN. The record itself cannot
 * say (the shell rewrites it whole). So this lab keeps one small device-level
 * value, `ape:onboarding:gaPageLayout`, in the family the account wipe keeps
 * (as features/intro/glossaryUseTimer does): the layout this device's record
 * is in. It has to survive the wipe, because a guest's finished pages are
 * written to the account AFTER the sign-in's wipe: a marker that was wiped
 * there would make the next visit move a 24-page record a second time.
 *     no value   this device has not run the 24-page lab: a stored record
 *                is in layout 1 and is moved once;
 *     { v: 2 }   the record, if any, is in layout 2: nothing is moved, ever.
 * THE MOVE CANNOT RUN TWICE, even if the app is closed in the middle: first
 * the old record is copied INTO the value ({ v: 1, old }), then the new
 * record is written FROM THAT COPY (so writing it again gives the same
 * record), then the value becomes { v: 2 }. The copy of the old record is
 * kept in the value afterward (`was`), so the pre-split marks can still be
 * read from the device.
 *
 * The lab screen runs `gaEnsurePageLayout` before it mounts the shell, so
 * the shell never reads a record that is still in layout 1.
 */
import { loadPagedProgress, isPagedProgressUnreadable, savePagedProgress, type PagedProgress } from '../../../../features/lab/pagedProgress';
import { createLocalStore } from '../../../../features/storage/localStore';

/** The layout this build's page list is in. 1 = the 22 pages of 2026-11-12;
 *  2 = the 24 pages of 2026-11-14 (pages 4 and 10 split). */
export const GA_PAGE_LAYOUT = 2;
export const GA_PAGES_LAYOUT_1 = 22;
export const GA_PAGES_LAYOUT_2 = 24;

/** Layout 1 index → the layout 2 indexes it became (see the header). */
export function gaIndexFromLayout1(i: number): number[] {
  if (!Number.isInteger(i) || i < 0 || i >= GA_PAGES_LAYOUT_1) return [];
  if (i < 3) return [i];
  if (i === 3) return [3, 4];
  if (i < 9) return [i + 1];
  if (i === 9) return [10, 11];
  return [i + 2];
}

/** A layout 1 record as the same marks in layout 2. Pure. `done` is kept:
 *  a finished lab stays finished (all 22 old pages map onto all 24). */
export function gaPagesFromLayout1(p: PagedProgress): PagedProgress {
  const completed = [...new Set(p.completed.flatMap(gaIndexFromLayout1))].sort((a, b) => a - b);
  const last = gaIndexFromLayout1(p.lastPage)[0] ?? 0;
  return { completed, lastPage: last, done: p.done };
}

/** Does the record hold anything worth moving? */
const holdsMarks = (p: PagedProgress): boolean => p.completed.length > 0 || p.lastPage > 0 || p.done;

type LayoutValue = {
  /** 0 = never set · 1 = the move is under way (`old` holds the layout 1 record) · 2 = layout 2. */
  v: number;
  /** While v is 1: the layout 1 record, as read. */
  old?: PagedProgress;
  /** After a move: the layout 1 record that was moved, kept for the record. */
  was?: PagedProgress;
};

function cleanRecord(raw: unknown): PagedProgress | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Partial<PagedProgress>;
  if (!Array.isArray(r.completed)) return undefined;
  return {
    completed: r.completed.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0),
    lastPage: typeof r.lastPage === 'number' && Number.isInteger(r.lastPage) && r.lastPage >= 0 ? r.lastPage : 0,
    done: !!r.done,
  };
}

const layoutStore = createLocalStore<LayoutValue>({
  // the device-level family the account wipe keeps (see the header)
  key: 'ape:onboarding:gaPageLayout',
  empty: () => ({ v: 0 }),
  parse: (parsed) => {
    if (!parsed || typeof parsed !== 'object') throw new Error('gaPageLayout: not a layout value');
    const p = parsed as Partial<LayoutValue>;
    if (typeof p.v !== 'number' || !Number.isFinite(p.v)) throw new Error('gaPageLayout: no layout number');
    const out: LayoutValue = { v: p.v };
    const old = cleanRecord(p.old);
    const was = cleanRecord(p.was);
    if (old) out.old = old;
    if (was) out.was = was;
    return out;
  },
});

export type GaLayoutResult = 'current' | 'moved' | 'fresh' | 'unread';

/**
 * Make sure this device's saved page marks are in the layout this build
 * uses. Resolves when the shell may read the record:
 *   'current'  already layout 2: nothing done
 *   'moved'    a layout 1 record was moved (or a move begun earlier finished)
 *   'fresh'    nothing was stored: the device is marked layout 2
 *   'unread'   the device could not be read or would not write: NOTHING was
 *              changed, and the next visit tries again
 * It never throws, and a lab never waits on it for long: the caller mounts
 * the shell whatever it answers (labs never block).
 */
export async function gaEnsurePageLayout(labId: string): Promise<GaLayoutResult> {
  try {
    await layoutStore.hydrate();
    if (layoutStore.isUnreadable()) return 'unread';
    let at = layoutStore.get();
    if (at.v >= GA_PAGE_LAYOUT) return 'current';

    if (at.v !== 1 || !at.old) {
      // Never set on this device: whatever is stored is a layout 1 record.
      const stored = await loadPagedProgress(labId);
      if (isPagedProgressUnreadable(labId)) return 'unread';
      if (!holdsMarks(stored)) {
        const ok = await layoutStore.set({ v: GA_PAGE_LAYOUT });
        return ok ? 'fresh' : 'unread';
      }
      // step 1: the old record goes INTO the value before anything is rewritten
      const began = await layoutStore.set({ v: 1, old: stored });
      if (!began) return 'unread';
      at = layoutStore.get();
    }
    const old = at.old as PagedProgress;
    // step 2: the new record, always worked out from the copy taken in step 1
    const want = gaPagesFromLayout1(old);
    await savePagedProgress(labId, want);
    // read it back: the save answers nothing, and a record the device refused
    // must not be called moved
    const check = await loadPagedProgress(labId);
    const landed = !isPagedProgressUnreadable(labId) && want.completed.every((i) => check.completed.includes(i)) && (!want.done || check.done) && check.lastPage === want.lastPage;
    if (!landed) return 'unread';
    // step 3: only now is the device layout 2
    const ok = await layoutStore.set({ v: GA_PAGE_LAYOUT, was: old });
    return ok ? 'moved' : 'unread';
  } catch {
    return 'unread';
  }
}

/** The layout value as stored (tests and the lab's own checks). */
export const gaPageLayoutValue = (): LayoutValue => layoutStore.get();
/** Read the value again from the device (tests: a new app start). */
export async function gaPageLayoutReload(): Promise<void> {
  layoutStore.reset();
  await layoutStore.hydrate();
}
