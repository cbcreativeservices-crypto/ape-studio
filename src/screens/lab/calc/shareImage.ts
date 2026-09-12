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
import { Platform, Share } from 'react-native';
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
 *
 *  `message` (optional) rides along with the image where the platform supports
 *  it. This matters more than it looks: a file-only share DROPS the text, so a
 *  shared measurement arrived as a bare picture with no company name and no
 *  tappable link — the owner noticed the missing link immediately (2026-09-11).
 *  iOS's share sheet takes both through RN's Share (`url` + `message`); Android
 *  ignores `url` there, so it keeps the expo-sharing file path.
 *
 *  Returns false on ANY failure (including a build without the native
 *  modules) — the caller surfaces the honest fallback message. */
export async function captureAndShare(ref: unknown, dialogTitle: string, message?: string): Promise<boolean> {
  const vs = viewShot();
  const sh = sharing();
  if (!vs || !sh || ref == null) return false;
  try {
    const raw = await vs.captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    const uri = raw.startsWith('file://') ? raw : `file://${raw}`;
    if (message && Platform.OS === 'ios') {
      // Both, in one sheet: the picture AND the words that say whose it is and
      // where to find more. Messages renders the URL in the text as a tappable
      // link, which the file-only path cannot do.
      await Share.share({ url: uri, message }, { dialogTitle });
      return true;
    }
    const ok = await sh.isAvailableAsync();
    if (!ok) return false;
    await sh.shareAsync(uri, { mimeType: 'image/png', dialogTitle, UTI: 'public.png' });
    return true;
  } catch {
    return false;
  }
}
