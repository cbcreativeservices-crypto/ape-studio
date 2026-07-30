/**
 * photo — room-photo backend for the Measurement Snapshot (owner 2026-07-29),
 * via the official `expo-image-picker` (system camera — no custom camera UI,
 * the lowest-risk photo path) accessed through the optional-require gate.
 *
 * Honesty: absent until expo-image-picker is installed AND in the running
 * build; callers keep the "coming with a future release" state until then.
 * The captured image URI is stored WITH the snapshot on-device; nothing is
 * uploaded.
 */
import { optionalModule } from './optionalModule';

type PickerLib = {
  requestCameraPermissionsAsync(): Promise<{ status: string; canAskAgain?: boolean }>;
  getCameraPermissionsAsync(): Promise<{ status: string; canAskAgain?: boolean }>;
  launchCameraAsync(opts?: {
    quality?: number;
    allowsEditing?: boolean;
    cameraType?: unknown;
  }): Promise<{ canceled: boolean; assets?: { uri: string; width?: number; height?: number }[] }>;
};

let cached: PickerLib | null | undefined;
function lib(): PickerLib | null {
  if (cached === undefined) cached = optionalModule<PickerLib>('expo-image-picker');
  return cached;
}

export function isAvailable(): boolean {
  return lib() != null;
}

export async function requestPermission(): Promise<'granted' | 'denied' | 'blocked'> {
  const P = lib();
  if (!P) return 'blocked';
  const res = await P.requestCameraPermissionsAsync();
  if (res.status === 'granted') return 'granted';
  return res.canAskAgain === false ? 'blocked' : 'denied';
}

export async function currentStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const P = lib();
  if (!P) return 'undetermined';
  const res = await P.getCameraPermissionsAsync();
  return res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'undetermined';
}

/** Launch the system camera. Assumes permission already granted (call the flow
 *  first). Returns the captured image URI, or null if cancelled/unavailable. */
export async function capture(): Promise<string | null> {
  const P = lib();
  if (!P) return null;
  try {
    const res = await P.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    if (res.canceled || !res.assets || res.assets.length === 0) return null;
    return res.assets[0].uri;
  } catch {
    return null;
  }
}
