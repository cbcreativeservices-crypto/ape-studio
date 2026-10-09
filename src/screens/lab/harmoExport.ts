/**
 * harmoExport — SAVE-TO-PHOTOS and PRINT for the Harmonograph drawing card
 * (owner request 2026-08-23), through the same optional-require gate as the
 * calc share chain (shareImage.ts).
 *
 * HONESTY: react-native-view-shot + expo-sharing are installed but native-
 * gated (see shareImage.ts). expo-media-library and expo-print were JUST added
 * to package.json — their NATIVE halves DO NOT exist in the current dev build,
 * so they resolve through optionalModule() at runtime and every path returns
 * an honest failure ('unavailable' / false) instead of crashing or lying. The
 * caller renders the button disabled with "available after the next app
 * build" — never a dead or lying control.
 */
import { Platform } from 'react-native';
import { optionalModule } from '../../features/tools/capture/optionalModule';
import * as shareImage from './calc/shareImage';

type ViewShotLib = {
  captureRef: (
    ref: unknown,
    opts?: { format?: 'png' | 'jpg'; quality?: number; result?: 'tmpfile' | 'base64' | 'data-uri' },
  ) => Promise<string>;
};
type MediaLibraryLib = {
  requestPermissionsAsync(writeOnly?: boolean): Promise<{ granted: boolean }>;
  saveToLibraryAsync(localUri: string): Promise<void>;
};
type PrintLib = {
  printAsync(opts: { uri: string }): Promise<void>;
};

let vsCached: ViewShotLib | null | undefined;
let mlCached: MediaLibraryLib | null | undefined;
let prCached: PrintLib | null | undefined;
const viewShot = (): ViewShotLib | null => {
  if (vsCached === undefined) vsCached = optionalModule<ViewShotLib>('react-native-view-shot');
  return vsCached;
};
const mediaLib = (): MediaLibraryLib | null => {
  if (mlCached === undefined) mlCached = optionalModule<MediaLibraryLib>('expo-media-library');
  return mlCached;
};
const printLib = (): PrintLib | null => {
  if (prCached === undefined) prCached = optionalModule<PrintLib>('expo-print');
  return prCached;
};

const asFileUri = (uri: string) => (uri.startsWith('file://') ? uri : `file://${uri}`);

/** Share-as-image availability — delegates to the calc share chain. */
export function isShareAvailable(): boolean {
  return shareImage.isAvailable();
}
/** Save-to-Photos availability (view-shot AND expo-media-library present).
 *  ANDROID (owner 2026-10-09, Google Play photo-permission policy): the photo
 *  permissions are blocked in app.json, so SAVE opens the Share sheet — which
 *  offers "Save image" / Photos — and needs no permission at all. */
export function isSaveAvailable(): boolean {
  if (Platform.OS === 'android') return shareImage.isAvailable();
  return viewShot() != null && mediaLib() != null;
}
/** Print availability (view-shot AND expo-print present). */
export function isPrintAvailable(): boolean {
  return viewShot() != null && printLib() != null;
}

/** 'shared' (Android): the Share sheet opened; the person chose where it went. */
export type SaveResult = 'saved' | 'shared' | 'denied' | 'unavailable' | 'failed';

/** Capture the ref'd card as a PNG and save it to the device photo library.
 *  'unavailable' = a native half is missing (this build) — the caller says
 *  "available after the next app build"; 'denied' = the user refused the
 *  Photos permission; 'failed' = anything else went wrong. Never throws. */
export async function saveToPhotos(ref: unknown): Promise<SaveResult> {
  if (Platform.OS === 'android') {
    if (ref == null || !shareImage.isAvailable()) return 'unavailable';
    return (await shareImage.captureAndShare(ref, 'Save image')) ? 'shared' : 'failed';
  }
  const vs = viewShot();
  const ml = mediaLib();
  if (!vs || !ml || ref == null) return 'unavailable';
  try {
    const uri = await vs.captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    // ADD-ONLY access (writeOnly): saving a drawing never needs to read the
    // library, so iOS asks the narrower "add to Photos" question — matches the
    // savePhotosPermission text in app.json (build checklist 2026-09-05).
    const perm = await ml.requestPermissionsAsync(true);
    if (!perm.granted) return 'denied';
    await ml.saveToLibraryAsync(asFileUri(uri));
    return 'saved';
  } catch {
    return 'failed';
  }
}

/** Capture the ref'd card as a PNG and open the OS print dialog. Returns false
 *  on ANY failure — missing native halves, capture error, or the user backing
 *  out of the print dialog (iOS rejects on cancel) — the caller states the
 *  honest reason it knows (unavailable vs didn't complete). Never throws. */
export async function printCard(ref: unknown): Promise<boolean> {
  const vs = viewShot();
  const pr = printLib();
  if (!vs || !pr || ref == null) return false;
  try {
    const uri = await vs.captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    await pr.printAsync({ uri: asFileUri(uri) });
    return true;
  } catch {
    return false;
  }
}
