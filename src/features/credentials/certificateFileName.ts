/**
 * A readable file name for the saved/shared PDF (owner 2026-10-25: "i got a
 * crazy garbled mess of a name"). expo-print names its file with a random id;
 * we copy it to e.g.
 *   "Jane Doe - Live Sound System Engineer Certificate - Pro Audio Training Academy.pdf"
 * Accents are folded and characters no file system accepts are dropped, so the
 * name survives mail, Files, Drive and Windows. No name set → the holder part
 * is left out rather than printing "Academy Member".
 */
export function certificateFileName(holderName: string | null, credentialName: string, awardType: 'certificate' | 'program'): string {
  const clean = (t: string) =>
    t
      .normalize('NFKD')
      .replace(/\p{M}/gu, '') // accents: e + combining mark -> e
      // Curly apostrophe -> ', any other non-ASCII (curly quotes, emoji) dropped.
      .replace(/[^\x20-\x7e]/g, (c) => (c === String.fromCharCode(0x2019) ? "'" : ''))
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const kind = awardType === 'program' ? 'Program' : 'Certificate';
  const cred = clean(credentialName) || 'Credential';
  const holder = holderName ? clean(holderName) : '';
  const credKind = new RegExp(`\\b${kind}$`, 'i').test(cred) ? cred : `${cred} ${kind}`;
  const base = [holder, credKind, 'Pro Audio Training Academy'].filter(Boolean).join(' - ');
  return `${base.slice(0, 150).trim()}.pdf`;
}
