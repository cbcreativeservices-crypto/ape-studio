/**
 * stageplot/spExport — getting the packet OUT of the app: a PDF file, the
 * phone's share menu, print, a browser download, copied text. Each is its
 * own operation with its own answer, because each can succeed or fail by
 * itself (handoff §7, §10):
 *
 *   spMakePdf       the packet → a PDF file with a readable name (phone)
 *   spSharePdf      that file → the phone's share menu
 *   spPrintNative   the phone's print dialog, on that same PDF
 *   spDownloadPdf   the PDF → a browser download (web)
 *   spPrintFrame    the web print view's own print (only from a press)
 *   spCopy          text → copied, ready to paste
 *
 * ONE PDF WRITER ON EVERY PLATFORM (owner decision, review 1). The pages are
 * written by the app's own writer (spPdf.ts) on a phone and in a browser, so
 * every platform gets the same pages, with the footer and the repeated table
 * headers that a phone's HTML-to-PDF converter is not expected to print. On
 * a phone the bytes are saved in the app's cache through expo-file-system
 * (as base64). The HTML sheet is kept for two things only: the web print
 * view, and the FALLBACK on a phone when that file cannot be written; each
 * answer says which of the two made the PDF (`via`).
 *
 * HONEST ANSWERS. An answer says only what this app can know:
 *   • a share menu that opened is "opened", never "sent": the app is not told
 *     what the person did in it;
 *   • on Android the print dialog reports nothing back, so the answer is
 *     "opened"; on an iPhone it reports a finished or a canceled print;
 *   • a browser download that was started is "started", not "saved";
 *   • a missing native half is "unavailable", and nothing here ever throws.
 *
 * NOTHING HERE PRINTS BY ITSELF. `spPrintFrame` is called from a button
 * press and from nowhere else: a browser's own print call stops the page
 * until its dialog is closed, and where the dialog cannot be shown the page
 * would hang.
 *
 * Every function is given ONE `SpDoc`: the caller builds it from one frozen
 * snapshot, so the pages of one output cannot come from two revisions. The
 * PDF file stays in the app's cache after it is made, so a canceled share
 * loses nothing.
 *
 * expo-print and expo-sharing come through optionalModule (the house gate: a
 * build made before a native module shipped gets null, not a crash);
 * expo-file-system is imported as certificatePdf.ts imports it. No
 * mail-composer package is in the app: an email goes through the share menu.
 * Deferred [MD:D60]: a composer with the PDF attached needs a native
 * package, so it waits for a store build.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { copyText, isCopyAvailable } from '../glossary/shareCopy';
import { optionalModule } from '../tools/capture/optionalModule';
import type { SpDoc } from './spDocTypes';
import { spBase64, spPdfPageCount } from './spPacket';
import { SP_PAGES, SP_PAGE_MARGIN, spPacketHtml } from './spPacketHtml';
import { spPdfBytes } from './spPdf';

type Margins = { top: number; right: number; bottom: number; left: number };
type HtmlOptions = { html: string; width: number; height: number; margins?: Margins; textZoom?: number };
type PrintLib = {
  printAsync(opts: HtmlOptions | { uri: string }): Promise<void>;
  printToFileAsync(opts: HtmlOptions): Promise<{ uri: string; numberOfPages?: number }>;
};
type SharingLib = {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>;
};

let printCached: PrintLib | null | undefined;
let shareCached: SharingLib | null | undefined;
const printLib = (): PrintLib | null => {
  if (printCached === undefined) printCached = optionalModule<PrintLib>('expo-print');
  return printCached;
};
const shareLib = (): SharingLib | null => {
  if (shareCached === undefined) shareCached = optionalModule<SharingLib>('expo-sharing');
  return shareCached;
};

/** The browser things this file uses, named narrowly so they are the same
 *  under every type library the app is checked with. */
type WebAnchor = { href: string; download: string; rel: string; style: { display: string }; click(): void };
type WebGlobals = {
  document?: { createElement(tag: 'a'): WebAnchor; body: { appendChild(n: unknown): void; removeChild(n: unknown): void } };
  Blob?: new (parts: unknown[], opts: { type: string }) => unknown;
  URL?: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
};
const web = (): WebGlobals => globalThis as unknown as WebGlobals;

export const SP_IS_WEB = Platform.OS === 'web';

const cacheDir = (): string | null => (FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}stageplot/` : null);

/** The phone's print dialog can be opened. (On the web, expo-print only
 *  prints the page that is open: the print view prints itself instead.) */
export const spCanPrintNative = (): boolean => !SP_IS_WEB && printLib() != null;
/** A PDF file can be made on this phone: by the app's own writer when the
 *  cache can be written, or else by the phone's converter. */
export const spCanMakePdf = (): boolean => !SP_IS_WEB && (cacheDir() != null || printLib() != null);
/** A file can be handed to the phone's share menu. */
export const spCanShareFile = (): boolean => !SP_IS_WEB && shareLib() != null;
/** A PDF can be downloaded by this browser. */
export const spCanDownloadPdf = (): boolean => SP_IS_WEB && !!web().document && !!web().Blob && !!web().URL?.createObjectURL;
export const spCanCopy = (): boolean => isCopyAvailable();

/** Which engine made a PDF: the app's own writer (the same pages on every
 *  platform), or the phone's HTML-to-PDF converter (the fallback). */
export type SpPdfVia = 'writer' | 'html';

/** A PDF this app made and still holds. */
export type SpPdfFile = {
  uri: string;
  fileName: string;
  /** How many pages it has, when that is known. */
  pages: number | null;
  revision: number;
  via: SpPdfVia;
};
export type SpMakeOutcome = { state: 'made'; file: SpPdfFile } | { state: 'unavailable' } | { state: 'failed' };

const asFileUri = (uri: string): string => (uri.startsWith('file://') ? uri : `file://${uri}`);

/** The app's own writer: the bytes of the PDF, saved in the cache under the
 *  packet's readable name. Null when the file could not be written. */
async function writeOwnPdf(d: SpDoc): Promise<SpPdfFile | null> {
  const dir = cacheDir();
  if (!dir) return null;
  try {
    const bytes = spPdfBytes(d);
    if (!bytes || !bytes.length) return null;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const uri = `${dir}${encodeURIComponent(d.fileName)}`;
    await FileSystem.deleteAsync(uri, { idempotent: true });
    await FileSystem.writeAsStringAsync(uri, spBase64(bytes), { encoding: FileSystem.EncodingType.Base64 });
    return { uri, fileName: d.fileName, pages: spPdfPageCount(bytes) || null, revision: d.revision, via: 'writer' };
  } catch {
    return null;
  }
}

/** What the phone's HTML-to-PDF converter is asked for (the fallback). The
 *  margins are given in two places on purpose, as expo-print documents: an
 *  iPhone takes them from the `margins` option, Android takes them from the
 *  sheet's @page rule. On Android the text zoom is fixed at 100, so the
 *  phone's own text-size setting cannot change how the pages are laid out. */
function htmlOptions(d: SpDoc): HtmlOptions {
  const page = SP_PAGES[d.paper];
  const base = { html: spPacketHtml(d), width: page.w, height: page.h };
  if (Platform.OS === 'ios') return { ...base, margins: { ...SP_PAGE_MARGIN } };
  return Platform.OS === 'android' ? { ...base, textZoom: 100 } : base;
}

/** Copy a converter's file to its readable name (expo-print names it with a
 *  random id); on any failure the original file is kept and used. */
async function withReadableName(uri: string, name: string): Promise<string> {
  try {
    const dir = cacheDir();
    if (!dir) return uri;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${encodeURIComponent(name)}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: asFileUri(uri), to: dest });
    return dest;
  } catch {
    return uri;
  }
}

/** The fallback: the HTML sheet through the phone's converter. */
async function convertHtmlPdf(d: SpDoc): Promise<SpPdfFile | null> {
  const print = printLib();
  if (!print) return null;
  try {
    const made = await print.printToFileAsync(htmlOptions(d));
    if (!made?.uri) return null;
    const uri = await withReadableName(made.uri, d.fileName);
    return { uri, fileName: d.fileName, pages: typeof made.numberOfPages === 'number' && made.numberOfPages > 0 ? made.numberOfPages : null, revision: d.revision, via: 'html' };
  } catch {
    return null;
  }
}

/** Turn the packet into a PDF file on the phone: the app's own writer first,
 *  the phone's converter only when that file cannot be written. The file is
 *  kept in the app's cache whatever happens next. Never throws. */
export async function spMakePdf(d: SpDoc): Promise<SpMakeOutcome> {
  if (SP_IS_WEB || !spCanMakePdf()) return { state: 'unavailable' };
  const file = (await writeOwnPdf(d)) ?? (await convertHtmlPdf(d));
  return file ? { state: 'made', file } : { state: 'failed' };
}

/** `opened` = the share menu was shown. It is never "sent": the app is not
 *  told what the person chose there, or whether they closed it. */
export type SpShareOutcome = 'opened' | 'no-target' | 'unavailable' | 'failed';

/** Hand a PDF this app made to the phone's share menu. Never throws. */
export async function spSharePdf(file: Pick<SpPdfFile, 'uri' | 'fileName'>): Promise<SpShareOutcome> {
  const share = shareLib();
  if (SP_IS_WEB || !share) return 'unavailable';
  try {
    if (!(await share.isAvailableAsync())) return 'no-target';
    await share.shareAsync(asFileUri(file.uri), { mimeType: 'application/pdf', dialogTitle: file.fileName, UTI: 'com.adobe.pdf' });
    return 'opened';
  } catch {
    return 'failed';
  }
}

/** `sent` = an iPhone reported a finished print. `opened` = the dialog was
 *  shown and nothing more is known (Android). */
export type SpPrintOutcome = 'sent' | 'opened' | 'canceled' | 'unavailable' | 'failed';
export type SpPrintResult = { outcome: SpPrintOutcome; via: SpPdfVia | null };

/** Open the phone's print dialog on the packet: on the PDF the app's own
 *  writer made, or on the HTML sheet when that file cannot be written.
 *  Never throws. */
export async function spPrintNative(d: SpDoc): Promise<SpPrintResult> {
  const print = printLib();
  if (SP_IS_WEB || !print) return { outcome: 'unavailable', via: null };
  const own = await writeOwnPdf(d);
  const via: SpPdfVia = own ? 'writer' : 'html';
  try {
    await print.printAsync(own ? { uri: asFileUri(own.uri) } : htmlOptions(d));
    return { outcome: Platform.OS === 'ios' ? 'sent' : 'opened', via };
  } catch (e) {
    // An iPhone rejects when the person closes the dialog without printing.
    const words = `${(e as { code?: unknown } | null)?.code ?? ''} ${(e as { message?: unknown } | null)?.message ?? ''}`;
    return { outcome: /incomplete|did not complete|cancel/i.test(words) ? 'canceled' : 'failed', via };
  }
}

/** `started` = the browser was given the file. Where it saved it, and
 *  whether it did, is the browser's to say. */
export type SpDownloadOutcome = 'started' | 'unavailable' | 'failed';

let lastDownloadUrl: string | null = null;

/** Web: write the PDF (spPdf.ts) and start a download of it. Never throws. */
export function spDownloadPdf(d: SpDoc): SpDownloadOutcome {
  if (!spCanDownloadPdf()) return 'unavailable';
  const { document: doc, Blob: BlobCtor, URL: urls } = web();
  if (!doc || !BlobCtor || !urls) return 'unavailable';
  try {
    const bytes = spPdfBytes(d);
    if (!bytes || !bytes.length) return 'failed';
    // The address of the last download is given back only now, so the
    // browser had all the time it needed to read that file.
    if (lastDownloadUrl) urls.revokeObjectURL(lastDownloadUrl);
    const url = urls.createObjectURL(new BlobCtor([bytes], { type: 'application/pdf' }));
    lastDownloadUrl = url;
    const a = doc.createElement('a');
    a.href = url;
    a.download = d.fileName;
    a.rel = 'noopener';
    a.style.display = 'none';
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    return 'started';
  } catch {
    return 'failed';
  }
}

/** `opened` = the browser's print dialog was asked for. */
export type SpFramePrintOutcome = 'opened' | 'failed';

/** Web: print the print view (an iframe that holds the sheet and nothing
 *  else), so the browser prints the packet and not the app around it.
 *  ONLY FROM A BUTTON PRESS: the call stops the page until the browser's
 *  dialog is closed. */
export function spPrintFrame(frame: unknown): SpFramePrintOutcome {
  try {
    const win = (frame as { contentWindow?: { focus?: () => void; print?: () => void } | null } | null)?.contentWindow;
    if (!win || typeof win.print !== 'function') return 'failed';
    win.focus?.();
    win.print();
    return 'opened';
  } catch {
    return 'failed';
  }
}

export type SpCopyOutcome = 'copied' | 'unavailable' | 'failed';

/** Copy text, ready to paste. Never throws. */
export async function spCopy(text: string): Promise<SpCopyOutcome> {
  if (!isCopyAvailable()) return 'unavailable';
  return (await copyText(text)) ? 'copied' : 'failed';
}
