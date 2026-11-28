/**
 * inputsFolds — which parts of the INPUTS area are FOLDED, and the one line
 * each shows while it is (the same rule as Setup's: features/stageplot/
 * spSetupFolds).
 *
 * WHY (beginner waves 2026-11-15, PLOT-02; owner 2026-11-15: "build waves 1
 * thru 3", after the owner's decision 5 of 2026-11-14: "Long pages: beginner
 * core first. Keep ALL content. Put the beginner part first and fold the
 * depth under 'Go deeper ▾'"). The beginner audit (G5, INPUTS) found every
 * advanced part open for a one-row list: the order tools, the DI devices,
 * the stage boxes, the equipment summary and the listed items. A first list
 * needs two things: ADD A SOURCE and the rows it makes. Those stay open, with
 * any question about the inputs above them. The five other parts are folded:
 * one row each, with what it holds now in a line, so nothing is hidden, only
 * closed. Every button, field, count, note and help text is still there when
 * a row is opened.
 *
 * A PROBLEM IS NEVER FOLDED AWAY. A part that holds something to correct (a
 * DI device asked to carry too much, a stage box with a doubled socket, an
 * open detail) says so on its closed row, as Setup's folds do (`ask`). The
 * questions of this area are not in a fold at all: they lead the area.
 *
 * Pure TypeScript: every line is judged from the project alone.
 */
import { spBoxUse, spDiTotals, type SpBoxUse } from '../../../../features/stageplot/spDerive.ts';
import { spPatch } from '../../../../features/stageplot/spModel.ts';
import { spNumbersFollowOrder } from '../../../../features/stageplot/spReview.ts';
import type { SpPatchId, SpProject } from '../../../../features/stageplot/spTypes.ts';
import { spReservedText, spSummaryCounts } from './inputsLogic.ts';

export type SpInputsFoldId = 'order' | 'di' | 'box' | 'summary' | 'extras';

/** The folded parts, in the order INPUTS shows them (under the list). */
export const SP_INPUTS_FOLDS: readonly SpInputsFoldId[] = ['order', 'di', 'box', 'summary', 'extras'];

/** The line over the folded parts. */
export const SP_INPUTS_DEEPER_LINE = 'Five more parts of the input list. Open one when you need it.';

/** A stage box that has something to correct: the same test as its NEEDS A
 *  CORRECTION badge in the stage box list. */
export const spBoxNeedsFix = (u: SpBoxUse): boolean =>
  !!(u.doubled.length || u.over.length || u.feedClash.length || u.feedPast.length || u.feedShort.length || u.returnsDoubled.length || u.returnsOver.length || u.retFeedClash.length || u.retFeedPast.length || u.retFeedShort.length);

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** What a folded part holds NOW, in one line, and what on it needs an answer
 *  (null: nothing). Never empty: an untouched part says so, in words.
 *  `openHere` = how many "to be confirmed" details this area holds. */
export function spInputsFoldLine(p: SpProject, id: SpInputsFoldId, patchId: SpPatchId, openHere = 0): { summary: string; ask: string | null } {
  switch (id) {
    case 'order': {
      const patch = spPatch(p, patchId);
      const reserved = patch ? spReservedText(patch.reserved) : '';
      const kept = reserved ? `Kept free: ${reserved}.` : '';
      if (!patch || !patch.order.length) return { summary: kept || 'No channel is kept free.', ask: null };
      const inStep = spNumbersFollowOrder(p, patchId);
      return { summary: [inStep ? 'The numbers follow the order.' : 'Some numbers do not follow the order, or are missing.', kept].filter(Boolean).join(' '), ask: null };
    }
    case 'di': {
      const t = spDiTotals(p);
      const over = t.overloaded[0];
      return { summary: t.summary, ask: over ? `${over.label} is asked to carry ${over.used} DI channels and has ${over.channels}.` : null };
    }
    case 'box': {
      const uses = spBoxUse(p);
      if (!uses.length) return { summary: 'No stage box yet.', ask: null };
      const used = uses.reduce((n, u) => n + u.used.length, 0);
      const free = uses.reduce((n, u) => n + u.free, 0);
      const fix = uses.find(spBoxNeedsFix);
      return {
        summary: [plural(uses.length, 'stage box', 'stage boxes'), plural(used, 'socket used', 'sockets used'), plural(free, 'socket free', 'sockets free')].join(' · '),
        ask: fix ? 'A stage box needs a correction: open this part to see it.' : null,
      };
    }
    case 'summary': {
      const counts = spSummaryCounts(p);
      return {
        summary: counts.length ? counts.map((c) => `${c.value} ${c.label}`).join(' · ') : 'Nothing is counted yet.',
        ask: openHere ? `${plural(openHere, 'detail is', 'details are')} still to be confirmed.` : null,
      };
    }
    case 'extras': {
      const names = p.extras.map((e) => e.label.trim()).filter(Boolean);
      return { summary: p.extras.length ? (names.length ? names.join(' · ') : plural(p.extras.length, 'item listed', 'items listed')) : 'Nothing is listed yet.', ask: null };
    }
  }
}
