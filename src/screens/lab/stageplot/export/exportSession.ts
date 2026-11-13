/**
 * exportSession — what the Export area must not forget when the user opens
 * another tab (must-do D60, review 1).
 *
 * The shell shows one work area at a time, so the Export area is taken off
 * the screen whenever the user goes to Setup to fix a phone number. Without
 * this, the PDF that was made, the message they edited and the two choices
 * (packet, paper) were lost on the way.
 *
 * Kept here, for each open stage plot, in memory only:
 *   • the packet kind and the paper size chosen
 *   • the edited subject and message (null = the suggested text)
 *   • the PDF that was made, so it can be shared again
 *   • the last line each button said, with the revision it was said about
 *
 * It is NOT saved data: nothing is written to the device, and it is gone when
 * the app closes. The account wipe clears it (it registers its own reset), so
 * one person's message can never be shown to the next person on the device.
 *
 * No React and no native modules. (Its imports have no extension, as the
 * account-wipe check reads them; the node test loads it through a resolver.)
 */
import { registerLocalStoreReset } from '../../../../features/storage/localStoreRegistry';
import type { SpPacketKind, SpPaper } from '../../../../features/stageplot/spTypes';

export type SpExportTone = 'plain' | 'warning' | 'good';
/** One line of words for each separate operation. */
export type SpExportLine = 'print' | 'pdf' | 'share' | 'download' | 'summary' | 'message';
export type SpExportSaid = {
  tone: SpExportTone;
  text: string;
  /** Read by a screen reader in place of `text` (it may say more, such as
   *  which engine made the PDF). */
  a11y?: string;
  /** The revision the line was said about: it is shown only for that one. */
  revision: number;
};
/** A PDF this app made and still holds in its cache. */
export type SpKeptPdf = { uri: string; fileName: string; pages: number | null; revision: number; via: 'writer' | 'html'; what: string };

export type SpExportSession = {
  packet: SpPacketKind;
  paper: SpPaper;
  mail: { subject: string; body: string } | null;
  kept: SpKeptPdf | null;
  said: Partial<Record<SpExportLine, SpExportSaid>>;
};

const sessions = new Map<string, SpExportSession>();
/** Stage plots remembered at once: the oldest is dropped past this. */
const CAP = 12;

/** The session of one stage plot; made from `start` the first time. */
export function spExportSession(projectId: string, start: () => SpExportSession): SpExportSession {
  let s = sessions.get(projectId);
  if (!s) {
    s = start();
    sessions.set(projectId, s);
    while (sessions.size > CAP) {
      const oldest = sessions.keys().next().value;
      if (oldest === undefined) break;
      sessions.delete(oldest);
    }
  }
  return s;
}

/** Change part of a session. Returns the new one (a new object each time). */
export function spPatchExportSession(projectId: string, patch: Partial<SpExportSession>, start: () => SpExportSession): SpExportSession {
  const next = { ...spExportSession(projectId, start), ...patch };
  sessions.set(projectId, next);
  return next;
}

export function resetSpExportSessions(): void {
  sessions.clear();
}
registerLocalStoreReset(resetSpExportSessions);
