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
