/**
 * spSetupFolds — which parts of the Setup area are FOLDED, and the one line
 * each shows while it is.
 *
 * WHY (owner, 2026-11-14, decision 5: "Long pages: beginner core first. Keep
 * ALL content. Put the beginner part first and fold the depth under 'Go
 * deeper ▾'"). The beginner audit (G5, Stage Plot SETUP): "Roughly 25 fields
 * and switches on one scroll for an empty plot." A new plot needs two
 * things first: the band's name and its performers. Those stay open, with
 * the guided task above them. The five parts a venue also asks for (the gig,
 * the technical contact, the revision and status, the stage size, the
 * notes) are folded: one row each, with what it holds now in a line, so
 * nothing is hidden, only closed. Every field, switch, note and help text
 * is still there when a row is opened.
 *
 * A QUESTION IS NEVER FOLDED AWAY. A review question that is answered in a
 * folded part ("no technical contact") shows on the closed row, and GO TO
 * from the review opens the part (SetupArea).
 *
 * Pure TypeScript: the summaries are judged from the project alone.
 */
import { spDateWords } from './spPacket.ts';
import { SP_SHAPE_WORD, spShapeOf } from './spShape.ts';
import type { SpProject } from './spTypes.ts';

export type SpSetupFoldId = 'gig' | 'contact' | 'status' | 'size' | 'notes';

/** The folded parts, in the order Setup shows them. */
export const SP_SETUP_FOLDS: readonly { id: SpSetupFoldId; title: string }[] = [
  { id: 'gig', title: 'THE GIG' },
  { id: 'contact', title: 'TECHNICAL CONTACT' },
  { id: 'status', title: 'REVISION AND STATUS' },
  { id: 'size', title: 'STAGE SIZE' },
  { id: 'notes', title: 'NOTES' },
];

/** The words on a fold's button (the owner's own: "Go deeper ▾"). */
export const SP_FOLD_OPEN_WORD = 'GO DEEPER ▾';
export const SP_FOLD_CLOSE_WORD = 'HIDE ▴';

/** The line over the folded parts. */
export const SP_SETUP_DEEPER_LINE = 'Five more parts of the packet. All are optional: open one when you need it.';

const said = (s: string | null | undefined): string => (s ?? '').trim();

/** What a folded part holds NOW, in one line. Never empty: an untouched part
 *  says so, in words. */
export function spSetupFoldSummary(p: SpProject, id: SpSetupFoldId): string {
  switch (id) {
    case 'gig': {
      const parts = [said(p.venue), p.eventDate ? spDateWords(p.eventDate) : '', said(p.loadIn) ? `load-in ${said(p.loadIn)}` : '', said(p.soundcheck) ? `soundcheck ${said(p.soundcheck)}` : '', said(p.performance) ? `performance ${said(p.performance)}` : ''].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'The venue, the date and the times. Nothing typed yet.';
    }
    case 'contact': {
      const who = [said(p.contact.name), said(p.contact.role)].filter(Boolean).join(', ');
      const how = [said(p.contact.email), said(p.contact.phone)].filter(Boolean).join(' · ');
      const line = [who, how].filter(Boolean).join(' · ');
      return line || 'The person the venue’s engineer should ask. Nobody yet.';
    }
    case 'status':
      return `Revision ${p.revision} · ${p.status === 'ready' ? 'Ready to advance' : 'Draft'}`;
    case 'size': {
      const shape = SP_SHAPE_WORD[spShapeOf(p.stage)];
      const unit = p.stage.unit === 'm' ? 'm' : 'ft';
      const size = p.stage.width && p.stage.depth ? `${p.stage.width} × ${p.stage.depth} ${unit}` : 'no size yet (not to scale)';
      return `${shape} · ${size}`;
    }
    case 'notes': {
      const have = [said(p.notes) ? 'general' : '', said(p.accessNotes) ? 'access and setup' : '', said(p.viewNote) ? 'viewpoint' : ''].filter(Boolean);
      return have.length ? `Written: ${have.join(', ')}.` : 'Nothing written yet.';
    }
  }
}

/** The fold a review question of the Setup area is answered in (null: its
 *  field is in the open part, the band or the performers). */
export function spSetupFoldOfRule(rule: string | null | undefined): SpSetupFoldId | null {
  return rule === 'no-contact' ? 'contact' : null;
}

/** The review question shown on a CLOSED fold's row, so a question is never
 *  folded away. `issues` = the review list (rule + text). */
export function spSetupFoldAsk(issues: readonly { rule: string; text: string }[], id: SpSetupFoldId): string | null {
  const hit = issues.find((i) => spSetupFoldOfRule(i.rule) === id);
  return hit ? hit.text : null;
}

/** A sentence for a screen reader: trimmed, and closed with a full stop when
 *  it has no closing mark of its own ("Revision 1 · Draft" has none). */
const sentence = (s: string): string => {
  const t = s.trim();
  return !t || /[.!?…]$/.test(t) ? t : `${t}.`;
};

/** What a screen reader says for a fold's row. Each part is its own
 *  sentence: a summary such as "Revision 1 · Draft" or "Rectangle · 24 × 16
 *  ft" has no full stop on screen, and without one here it ran into "Show
 *  this part" (checker K2, 2026-11-14). */
export function spFoldRowSay(row: { title: string; summary: string; ask?: string | null; open: boolean }): string {
  if (row.open) return `${sentence(row.title)} Hide this part.`;
  return [sentence(row.title), sentence(row.summary), row.ask ? `A question: ${sentence(row.ask)}` : '', 'Show this part.'].filter(Boolean).join(' ');
}

/** How many fields and switches a NEW plot shows before anything is opened:
 *  the open part only (the band's two fields; a performer row adds its own
 *  when the user adds one). Was every field of all seven parts. */
export const SP_SETUP_OPEN_PARTS = ['THE BAND', 'PERFORMERS'] as const;
