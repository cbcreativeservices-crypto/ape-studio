/**
 * Native half of the build label (see buildLabel.ts). Uses only modules the app
 * already ships — expo-application (through optionalModule, the house idiom),
 * expo-updates and expo-constants. No new native dependency.
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { optionalModule } from '../tools/capture/optionalModule';
import { formatBuildLabel } from './buildLabel';

type AppLib = { nativeApplicationVersion: string | null; nativeBuildVersion: string | null };

export function readBuildLabel(): string {
  const app = optionalModule<AppLib>('expo-application');
  let updateId: string | null = null;
  let isEmbedded = true;
  try {
    updateId = Updates.updateId ?? null;
    isEmbedded = Updates.isEmbeddedLaunch;
  } catch {
    /* web / no updates module — reads "built-in update" */
  }
  return formatBuildLabel({
    version: app?.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null,
    build: app?.nativeBuildVersion ?? null,
    updateId,
    isEmbedded,
  });
}
