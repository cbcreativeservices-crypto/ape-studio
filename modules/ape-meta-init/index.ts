/**
 * ape-meta-init — JS side (1.0.1). See the native files for why it exists.
 *
 * DEGRADES TO "NO": on web and on any build without this module the native side
 * is absent, so these answer false. The gate is requireOptionalNativeModule,
 * the house pattern (ape-dsp, ape-optical).
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type Native = {
  /** Android only. */
  initialize?(): Promise<boolean>;
  activateApp(): Promise<boolean>;
};

const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<Native>('ApeMetaInit');

export async function initializeMetaSdkAndroid(): Promise<boolean> {
  if (!native?.initialize) return false;
  try {
    return (await native.initialize()) === true;
  } catch {
    return false;
  }
}

/** Meta's real activate call. True once it is handed over, false when this
 *  build has no such call. A failure later on sends nothing and stays quiet. */
export function activateMetaApp(): boolean {
  if (!native) return false;
  void native.activateApp().catch(() => {});
  return true;
}
