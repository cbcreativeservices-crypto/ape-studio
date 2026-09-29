import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';
import { isTabletDisplay } from '../theme/useIsTablet';

/**
 * NAV_PORTRAIT — the default `orientation` every native stack in the app sets
 * in its screenOptions (bug hunt 2026-09-29).
 *
 * ⛔ ONE TOOL SCREEN UNLOCKED THE WHOLE APP (Android). The app is portrait
 * (App.tsx locks PORTRAIT_UP at boot through expo-screen-orientation; app.json
 * only says "default" so the OS will let the tool full screens turn). The SPL
 * Meter, Waveform, RTA and Spectrogram full screens drive rotation with
 * `navigation.setOptions({ orientation })`. The first time any screen sets that
 * option, react-native-screens marks orientation as "set" for the rest of the
 * process — and from then on every screen WITHOUT an orientation option is given
 * SCREEN_ORIENTATION_UNSPECIFIED when it comes into focus, which overrides the
 * boot lock. Open one full screen once and every later screen rotated with the
 * phone.
 *
 * Giving every screen an explicit portrait default means there is no "without"
 * any more. Screens that rotate still override it per screen (setOptions wins
 * over screenOptions).
 */
export const NAV_PORTRAIT = { orientation: 'portrait_up' } as const;

/**
 * ⛔ TABLETS ARE NOT PORTRAIT-LOCKED (owner 2026-09-29, Android large-screen
 * pass: "begin larger screens for android if they need any thought like we've
 * given to the iPads").
 *
 * The portrait lock is a PHONE rule. On a tablet it does harm three ways:
 *   • Android 12L–15 honours it by LETTERBOXING — a landscape tablet (the way
 *     most are held, and the only way one in a keyboard case can be) shows the
 *     app as a phone-shaped strip in the middle of black bars;
 *   • Android 16+ (this app targets SDK 36) ignores it on any display 600 dp
 *     or wider, so the app turns anyway and the lock only adds a flicker;
 *   • iPadOS ignores it for multitasking apps — which is why every iPad pass
 *     already had to lay the app out sideways.
 * So on a tablet-class DISPLAY (see `isTabletDisplay`) the stacks ask for
 * 'default' (the device's own rotation setting) and a full screen that closes
 * returns to 'default' instead of 'portrait'. Phones get exactly NAV_PORTRAIT
 * and 'portrait' / 'portrait_up', as before.
 */
export const NAV_FREE = { orientation: 'default' } as const;

function onDisplayChange(cb: () => void): () => void {
  const sub = Dimensions.addEventListener('change', cb);
  return () => sub.remove();
}

/** The stacks' screenOptions orientation. Re-renders only when the display
 *  CLASS flips (a foldable folding or unfolding), never on a plain rotation. */
export function useNavOrientation(): typeof NAV_PORTRAIT | typeof NAV_FREE {
  const tablet = useSyncExternalStore(onDisplayChange, isTabletDisplay, isTabletDisplay);
  return tablet ? NAV_FREE : NAV_PORTRAIT;
}

/** What a rotating screen goes back to when its full screen closes: the
 *  caller's own phone value on a phone, 'default' on a tablet. */
export function restingOrientation<P extends 'portrait' | 'portrait_up'>(phone: P): P | 'default' {
  return isTabletDisplay() ? 'default' : phone;
}
