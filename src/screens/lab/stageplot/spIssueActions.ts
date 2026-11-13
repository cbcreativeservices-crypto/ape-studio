/**
 * spIssueActions — what each ANSWER in the review list does (must-do D60).
 * spReview names the answers an issue offers (`SpIssueAction`); this file is
 * the one place that turns an answer into an edit of the project or a jump to
 * the row, so the same answer does the same thing in every work area.
 *
 * Two kinds of answer:
 *   • A DECISION the band can make from the list ("it is acoustic", "no
 *     monitor is intended", "the audience is meant to hear it"): one spModel
 *     edit, which UNDO reverses.
 *   • A JUMP to where the work is done ("place on the stage", "choose its
 *     mix", "add a monitor mix"): the area opens with the row selected.
 *     Nothing is changed.
 *
 * Nothing here guesses: an answer that would need a choice the band has not
 * made (which mix, which devices, what happens to a stereo DI device) is a
 * jump to the place that asks, never a silent pick.
 *
 * AN ANSWER THAT RENUMBERS A SHARED REVISION ASKS FIRST. The lab screen hands
 * this file its question popup (`setSpIssueAsk`, the house confirmDialog); a
 * file that node tests load cannot import it. With no popup set, the answer
 * runs directly (the tests).
 *
 * Pure apart from the editor it is handed (tests pass a small stand-in).
 */
import { spPairRestore, spPairToMono, spRenumber, spUpdateDevice, spUpdateInput, spUpdateObject, spUpdatePerformer, spUpdateSource } from '../../../features/stageplot/spModel.ts';
import type { SpIssue, SpIssueAction } from '../../../features/stageplot/spReview.ts';
import type { SpProject } from '../../../features/stageplot/spTypes.ts';
import type { SpEditor, SpSelection } from './spContext.tsx';

/** The part of the editor an answer needs. */
export type SpIssueEditor = Pick<SpEditor, 'project' | 'apply' | 'goTo'>;

/** A yes / cancel question: title, body, the word on the yes button, and
 *  what yes does. */
export type SpIssueAsk = (title: string, body: string, yesText: string, yes: () => void) => void;
let askFirst: SpIssueAsk | null = null;
/** Set once by the lab screen (the house confirmDialog); null runs an answer
 *  without asking. */
export function setSpIssueAsk(ask: SpIssueAsk | null): void {
  askFirst = ask;
}

/** True when this revision was already printed, shared or marked ready: the
 *  next change starts the next revision. */
export const spRevisionShared = (p: Pick<SpProject, 'revision' | 'frozenRevision'>): boolean => p.frozenRevision >= p.revision;

/** The row an issue is about, as a selection in its work area. */
export function spIssueSelection(issue: SpIssue): SpSelection {
  const { kind, id } = issue.target;
  if (!id) return null;
  if (kind === 'project') return null;
  // A patch issue (a duplicate channel number) points at one of its inputs.
  if (kind === 'patch') return { kind: 'input', id };
  return { kind, id };
}

/** "Go to": open the issue's own area with its row selected. */
export function goToIssue(ed: Pick<SpEditor, 'goTo'>, issue: SpIssue): void {
  ed.goTo(issue.area, spIssueSelection(issue));
}

/** The words on an answer's button, in capitals as every button is. */
export function spIssueActionLabel(action: SpIssueAction, issue?: SpIssue): string {
  switch (action) {
    case 'locate':
      // "Locate" only for something that IS on the stage (an object outside it).
      return issue?.rule === 'performer-unplaced' || issue?.rule === 'source-unplaced' ? 'PLACE ON THE STAGE' : 'LOCATE ON THE STAGE';
    case 'mark-offstage':
      return 'IT IS OFF THE STAGE ON PURPOSE';
    case 'mark-acoustic':
      return 'IT IS ACOUSTIC: NO INPUT NEEDED';
    case 'mark-self-contained':
      return 'IT IS SELF-CONTAINED: NO INPUT NEEDED';
    case 'add-inputs':
      return 'ADD ITS INPUTS';
    case 'mark-visual':
      return 'IT IS ONLY A DRAWING';
    case 'link-source':
      return 'LINK IT TO SOMETHING IN YOUR LISTS';
    case 'pair-restore':
      return 'PUT THE OTHER SIDE BACK';
    case 'pair-mono':
      return 'MAKE IT A MONO REQUEST';
    case 'assign-mix':
      return 'CHOOSE ITS MIX';
    case 'mark-self-contained-device':
      return 'IT IS PART OF YOUR BAND’S OWN RIG';
    case 'add-mix':
      return 'ADD A MONITOR MIX';
    case 'mark-no-monitor':
      return 'NO MONITOR IS INTENDED';
    case 'object-offstage-ok':
      return 'IT IS OFF THE STAGE ON PURPOSE';
    case 'renumber':
      return 'RENUMBER THIS LIST';
    case 'cue-audience-ok':
      return 'THE AUDIENCE IS MEANT TO HEAR IT';
    case 'edit':
      return 'GO TO IT';
  }
}

/** Carry out one answer. An answer that does not fit the issue's row does
 *  nothing (the list was made for another state of the project). */
export function runIssueAction(ed: SpIssueEditor, issue: SpIssue, action: SpIssueAction): void {
  const { kind, id } = issue.target;
  const sel = spIssueSelection(issue);
  switch (action) {
    case 'edit':
      goToIssue(ed, issue);
      return;

    /* ── jumps ── */
    case 'locate':
    case 'link-source':
      // The stage shows the row: a source or a performer still to be placed,
      // or the object that is off the stage or has no link yet.
      ed.goTo('stage', sel);
      return;
    case 'add-inputs':
      ed.goTo('inputs', sel);
      return;
    case 'assign-mix':
      ed.goTo('monitors', sel);
      return;
    case 'add-mix':
      // The same door as the ADD A MIX button: Monitors opens with this
      // performer selected and proposes the mix WITH its usual devices before
      // anything is added. Nothing is added from here.
      if (kind === 'performer' && id) ed.goTo('monitors', { kind: 'performer', id });
      return;

    /* ── decisions ── */
    case 'mark-offstage':
      if (kind === 'source' && id) ed.apply((p) => spUpdateSource(p, id, { offstage: true }));
      return;
    case 'mark-acoustic':
      if (kind === 'source' && id) ed.apply((p) => spUpdateSource(p, id, { connection: 'none', noneReason: 'acoustic' }));
      return;
    case 'mark-self-contained':
      if (kind === 'source' && id) ed.apply((p) => spUpdateSource(p, id, { connection: 'none', noneReason: 'self-contained' }));
      return;
    case 'mark-visual':
      if (kind === 'object' && id) ed.apply((p) => spUpdateObject(p, id, { visualOnly: true }));
      return;
    case 'object-offstage-ok':
      if (kind === 'object' && id) ed.apply((p) => spUpdateObject(p, id, { offstageOk: true }));
      return;
    case 'pair-restore':
      if (kind === 'input' && id) ed.apply((p) => spPairRestore(p, id).p);
      return;
    case 'pair-mono': {
      if (kind !== 'input' || !id) return;
      // The side that is left sits on a STEREO DI device: whether the band
      // keeps that device for one channel is theirs to say (handoff §11). The
      // input's own editor asks it, so this answer opens that editor.
      const left = ed.project.inputs.find((i) => i.id === id);
      const device = left?.diDeviceId ? ed.project.diDevices.find((d) => d.id === left.diDeviceId) : undefined;
      if (device && device.channels === 2) {
        ed.goTo('inputs', { kind: 'input', id });
        return;
      }
      ed.apply((p) => spPairToMono(p, id));
      return;
    }
    case 'mark-self-contained-device':
      if (kind === 'device' && id) ed.apply((p) => spUpdateDevice(p, id, { selfContained: true }));
      return;
    case 'mark-no-monitor':
      if (kind === 'performer' && id) ed.apply((p) => spUpdatePerformer(p, id, { noMonitor: true }));
      return;
    case 'cue-audience-ok':
      // The band says the audience is meant to hear this click or cue. The
      // routing is not changed; the question is answered.
      if (kind === 'input' && id) ed.apply((p) => spUpdateInput(p, id, { cueAudienceOk: true }));
      return;
    case 'renumber': {
      const patchId = issue.target.patchId ?? 'house';
      // Numbered again in the list's own order; reserved channels stay free.
      const run = () => ed.apply((p) => spRenumber(p, patchId, { keepReserved: true }));
      const p = ed.project;
      // Never renumber a revision that already went out without asking first.
      if (askFirst && spRevisionShared(p)) {
        askFirst(
          'Renumber a shared revision?',
          `Revision ${p.revision} of this stage plot was already shared or marked ready. Renumbering starts revision ${p.frozenRevision + 1} as a draft, and its channel numbers will differ from the ones you sent.`,
          'Renumber',
          run,
        );
        return;
      }
      run();
      return;
    }
  }
}
