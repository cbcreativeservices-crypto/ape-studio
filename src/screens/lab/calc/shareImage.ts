/**
 * shareImage — share a workflow-results card as a rendered PNG (Phase 5,
 * owner spec 2026-08-06) via react-native-view-shot + expo-sharing through the
 * optional-require gate.
 *
 * HONESTY: the JS packages are installed, but their NATIVE halves only exist
 * from the next dev build onward. isAvailable() gates the button; capture
 * failures return false so the caller can say "needs the next app build" and
 * point at share-as-text — never a dead or lying control.
 */
import { optionalModule } from '../../../features/tools/capture/optionalModule';

type ViewShotLib = {
  captureRef: (
    ref: unknown,
    opts?: { format?: 'png' | 'jpg'; quality?: number; result?: 'tmpfile' | 'base64' | 'data-uri' },
  ) => Promise<string>;
};
type SharingLib = {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>;
};

let vsCached: ViewShotLib | null | undefined;
let shCached: SharingLib | null | undefined;
const viewShot = (): ViewShotLib | null => {
  if (vsCached === undefined) vsCached = optionalModule<ViewShotLib>('react-native-view-shot');
  return vsCached;
};
const sharing = (): SharingLib | null => {
  if (shCached === undefined) shCached = optionalModule<SharingLib>('expo-sharing');
  return shCached;
};

export function isAvailable(): boolean {
  return viewShot() != null && sharing() != null;
}

/** Capture the ref'd view as a PNG and open the native share sheet.
 *  Returns false on ANY failure (including a build without the native
 *  modules) — the caller surfaces the honest fallback message. */
export async function captureAndShare(ref: unknown, dialogTitle: string): Promise<boolean> {
  const vs = viewShot();
  const sh = sharing();
  if (!vs || !sh || ref == null) return false;
  try {
    const uri = await vs.captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    const ok = await sh.isAvailableAsync();
    if (!ok) return false;
    await sh.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, {
      mimeType: 'image/png',
      dialogTitle,
      UTI: 'public.png',
    });
    return true;
  } catch {
    return false;
  }
}
