/**
 * shareCopy — copy shared glossary text to the clipboard via expo-clipboard,
 * loaded through the optional-require gate (same honesty pattern as shareImage:
 * the JS package is declared, but its NATIVE half only exists from the next dev
 * build onward). isCopyAvailable() gates the button so it is never a dead or
 * lying control; copyText returns false on any failure so the caller can fall
 * back to the share sheet.
 */
import { optionalModule } from '../tools/capture/optionalModule';

type ClipboardLib = { setStringAsync(text: string): Promise<boolean> };

let cached: ClipboardLib | null | undefined;
const clipboard = (): ClipboardLib | null => {
  if (cached === undefined) cached = optionalModule<ClipboardLib>('expo-clipboard');
  return cached;
};

export function isCopyAvailable(): boolean {
  return clipboard() != null;
}

export async function copyText(text: string): Promise<boolean> {
  const cb = clipboard();
  if (!cb) return false;
  try {
    await cb.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
