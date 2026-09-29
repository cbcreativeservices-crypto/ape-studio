/**
 * withKeepAwake — keep the screen on while a live measuring tool is the screen
 * in front (tester feedback, TestFlight 2026-09-29: "It would be great if the
 * screen did not dim or autolock engage when you're using the tuner or other
 * tools"). Tuning a guitar, reading an SPL meter or watching an RTA all mean
 * hands on the instrument, not the phone — the auto-lock would black the
 * display mid-reading.
 *
 * Focus-scoped: activated on focus, released on blur/unmount, so leaving the
 * tool (or backgrounding the app, which blurs nothing but lets iOS/Android
 * handle it) never keeps the phone awake behind the user. Uses expo-keep-awake
 * through `optionalModule` in the house idiom — a build without it simply
 * doesn't keep awake, it never crashes. The full-screen tuners already did
 * this for themselves; this brings every live tool screen in line.
 */
import { useCallback, type ComponentType } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { optionalModule } from './capture/optionalModule';

type KeepAwakeLib = {
  activateKeepAwakeAsync?: (tag?: string) => Promise<void>;
  deactivateKeepAwake?: (tag?: string) => Promise<void> | void;
};

export function useKeepAwakeWhileFocused(tag: string): void {
  useFocusEffect(
    useCallback(() => {
      const ka = optionalModule<KeepAwakeLib>('expo-keep-awake');
      void ka?.activateKeepAwakeAsync?.(tag).catch(() => {});
      return () => {
        Promise.resolve()
          .then(() => ka?.deactivateKeepAwake?.(tag))
          .catch(() => {});
      };
    }, [tag]),
  );
}

export function withKeepAwake<P extends object>(Screen: ComponentType<P>, tag: string): ComponentType<P> {
  function KeptAwake(props: P) {
    useKeepAwakeWhileFocused(tag);
    return <Screen {...props} />;
  }
  KeptAwake.displayName = `WithKeepAwake(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return KeptAwake;
}
