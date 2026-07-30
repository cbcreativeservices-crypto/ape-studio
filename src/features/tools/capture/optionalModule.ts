/**
 * optionalModule — dynamic-require an npm/native module that MAY NOT be
 * installed yet (owner 2026-07-29). expo-location and expo-image-picker are
 * added for the snapshot GPS/photo backend, but until the owner runs
 * `npx expo install …` + a NEW dev build they are absent — so we must NOT
 * static-import them (that would break `tsc` and the Metro bundle for every
 * installed client). This resolves them at runtime and returns null when
 * absent, exactly the ape-dsp / ape-optical gate philosophy.
 */
export function optionalModule<T = unknown>(name: string): T | null {
  try {
    // Indirection keeps Metro from treating this as a hard dependency edge.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req: NodeRequire = eval('require');
    return req(name) as T;
  } catch {
    return null;
  }
}
