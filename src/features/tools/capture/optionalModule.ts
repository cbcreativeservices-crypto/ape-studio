/**
 * optionalModule — load an npm/native module that MAY NOT be usable in this
 * binary (owner 2026-07-29): a package can be in package.json before the dev
 * client that carries its native half has been built. Callers get the module
 * or null and render an honest "available after the next app build".
 *
 * THE TRAP THIS FIXES (owner report 2026-09-06, the first build with every
 * module in it): the original implementation used `eval('require')(name)` to
 * hide the dependency from Metro. That hid it TOO well — Metro never bundled
 * the JavaScript half of any of these packages, so on the new build the native
 * side was present but `require` still failed, and the Harmonograph SAVE /
 * SHARE / PRINT keys kept saying "next app build" forever.
 *
 * Now: every package that IS installed gets a LITERAL `require` inside a
 * try/catch. Metro sees the literal and bundles the module; on a client built
 * BEFORE the package's native half existed, evaluating it throws ("Cannot find
 * native module …") and the catch returns null exactly as before. Packages that
 * are NOT installed (expo-location, expo-image-picker, qrcode) must stay off
 * this table — a literal require of an absent package fails the whole bundle —
 * so they keep the dynamic path and resolve to null until they are installed
 * AND added here.
 *
 * ADDING A MODULE: `npx expo install <pkg>`, add one line to LOADERS, add the
 * row to docs/APE_NEXT_BUILD_CHECKLIST.md.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const LOADERS: Record<string, () => unknown> = {
  'react-native-view-shot': () => require('react-native-view-shot'),
  'expo-media-library': () => require('expo-media-library'),
  'expo-print': () => require('expo-print'),
  'expo-sharing': () => require('expo-sharing'),
  'expo-clipboard': () => require('expo-clipboard'),
  // Launch readiness (owner 2026-09-06): the native store-review prompt and the
  // installed app version it is keyed on.
  'expo-store-review': () => require('expo-store-review'),
  'expo-application': () => require('expo-application'),
  // In-app purchases (OpenIAP). Installed 2026-09-06; the paywall's lazy loader
  // in features/commercial/purchase.ts resolves it through here.
  'expo-iap': () => require('expo-iap'),
};
/* eslint-enable @typescript-eslint/no-var-requires */

export function optionalModule<T = unknown>(name: string): T | null {
  try {
    const load = LOADERS[name];
    if (load) return load() as T;
    // Not installed (or not yet listed above): the eval keeps Metro from
    // treating this as a dependency edge; it resolves to null at runtime.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req: NodeRequire = eval('require');
    return req(name) as T;
  } catch {
    return null;
  }
}
