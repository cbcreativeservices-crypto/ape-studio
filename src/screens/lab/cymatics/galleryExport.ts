/**
 * galleryExport — the Pattern Gallery's PRINT / PDF / SVG paths (Phase 4),
 * beside harmoExport.ts, through the same optionalModule gate. Nothing here
 * ever throws; a missing native half returns an honest status and the panel
 * renders that control disabled with "available after the next app build".
 *
 *   PRINT  expo-print printAsync({ html, width, height }) — the HTML sheet
 *          (svgExport.sheetHtml) rendered by the OS print dialog. No view-shot.
 *   PDF    expo-print printToFileAsync → expo-sharing (mimeType application/pdf).
 *   SVG    string generation, so it works TODAY: with expo-sharing present the
 *          figure is written to the cache as a real .svg (expo-file-system is
 *          part of the expo core and native in every build — earPlayer.ts
 *          already relies on it) and shared as a file; without sharing, the
 *          SVG source goes out through React Native's core Share sheet as
 *          text, and the panel says so.
 *
 * PNG share / save-to-Photos stay on harmoExport (view-shot gates).
 */
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { optionalModule } from '../../../features/tools/capture/optionalModule';
import { PAGES, type PageId } from '../../../features/cymatics/svgExport';

type PrintLib = {
  printAsync(opts: { html?: string; uri?: string; width?: number; height?: number }): Promise<void>;
  printToFileAsync(opts: { html: string; width?: number; height?: number; base64?: boolean }): Promise<{ uri: string }>;
};
type SharingLib = {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>;
};

let prCached: PrintLib | null | undefined;
let shCached: SharingLib | null | undefined;
const printLib = (): PrintLib | null => {
  if (prCached === undefined) prCached = optionalModule<PrintLib>('expo-print');
  return prCached;
};
const sharing = (): SharingLib | null => {
  if (shCached === undefined) shCached = optionalModule<SharingLib>('expo-sharing');
  return shCached;
};

/** PRINT (HTML → the OS print dialog) needs expo-print only. */
export function isPrintHtmlAvailable(): boolean {
  return printLib() != null;
}
/** PDF (print to file, then share) needs expo-print + expo-sharing. */
export function isPdfAvailable(): boolean {
  return printLib() != null && sharing() != null;
}
/** SVG as a FILE needs expo-sharing; as TEXT it always works. */
export function isSvgFileAvailable(): boolean {
  return sharing() != null && !!FileSystem.cacheDirectory;
}

/** Open the print dialog on the sheet. false = unavailable, cancelled, or failed. */
export async function printHtml(html: string, page: PageId): Promise<boolean> {
  const pr = printLib();
  if (!pr) return false;
  try {
    const { w, h } = PAGES[page];
    await pr.printAsync({ html, width: w, height: h });
    return true;
  } catch {
    return false;
  }
}

export type PdfResult = 'shared' | 'unavailable' | 'failed';
/** Render the sheet to a PDF file and hand it to the share sheet. */
export async function sharePdf(html: string, page: PageId, dialogTitle: string): Promise<PdfResult> {
  const pr = printLib();
  const sh = sharing();
  if (!pr || !sh) return 'unavailable';
  try {
    const { w, h } = PAGES[page];
    const { uri } = await pr.printToFileAsync({ html, width: w, height: h });
    const ok = await sh.isAvailableAsync();
    if (!ok) return 'unavailable';
    await sh.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
    return 'shared';
  } catch {
    return 'failed';
  }
}

export type SvgResult = 'file' | 'text' | 'failed';
const safeName = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'pattern';

/** Share the SVG: a real file when sharing exists, the source as text otherwise. */
export async function shareSvg(svg: string, name: string, dialogTitle: string): Promise<SvgResult> {
  const sh = sharing();
  if (sh && FileSystem.cacheDirectory) {
    try {
      const uri = `${FileSystem.cacheDirectory}${safeName(name)}-${Date.now().toString(36)}.svg`;
      await FileSystem.writeAsStringAsync(uri, svg, { encoding: FileSystem.EncodingType.UTF8 });
      if (await sh.isAvailableAsync()) {
        await sh.shareAsync(uri, { mimeType: 'image/svg+xml', UTI: 'public.svg-image', dialogTitle });
        return 'file';
      }
    } catch {
      // fall through to the text share
    }
  }
  try {
    await Share.share({ message: svg, title: dialogTitle }, { dialogTitle, subject: `${name}.svg` });
    return 'text';
  } catch {
    return 'failed';
  }
}
