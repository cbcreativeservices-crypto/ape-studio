/**
 * The quiet "which build am I on?" line (testers 2026-10-08: they could not
 * find the build or version number). Pure — the native reads live in
 * readBuildLabel.ts so the test runner can import this.
 *
 * "Version 1.0.3 (34) · update 1a2b3c" — the update id is the running OTA
 * bundle's id, shortened; a build with no OTA applied reads "built-in".
 */
export type BuildInfo = {
  version: string | null;
  build: string | null;
  updateId: string | null;
  isEmbedded?: boolean;
};

export function shortUpdateId(id: string | null | undefined): string | null {
  const clean = (id ?? '').replace(/-/g, '').trim();
  return clean ? clean.slice(0, 6) : null;
}

export function formatBuildLabel(b: BuildInfo): string {
  const version = b.version?.trim() || 'unknown';
  const build = b.build?.trim();
  const head = `Version ${version}${build ? ` (${build})` : ''}`;
  const short = shortUpdateId(b.updateId);
  const tail = short && !b.isEmbedded ? `update ${short}` : 'built-in update';
  return `${head} · ${tail}`;
}
