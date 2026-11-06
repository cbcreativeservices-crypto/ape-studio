/**
 * ape-meta-init — JS side (1.0.1). See the Kotlin file for why it exists.
 *
 * DEGRADES TO "NO": on iOS, on web and on any build without this module the
 * native side is absent, so this answers false and Meta stays off. The gate is
 * requireOptionalNativeModule, the house pattern (ape-dsp, ape-optical).
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type Native = { initialize(): Promise<boolean> };

const native = Platform.OS === 'android' ? requireOptionalNativeModule<Native>('ApeMetaInit') : null;

export async function initializeMetaSdkAndroid(): Promise<boolean> {
  if (!native) return false;
  try {
    return (await native.initialize()) === true;
  } catch {
    return false;
  }
}
