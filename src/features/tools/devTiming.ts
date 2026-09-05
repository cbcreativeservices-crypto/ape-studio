/**
 * Dev-only timing marks for the tools section (owner report 2026-09-05: a
 * tool's start screen took ~15 s to open on the phone). Nothing here runs in a
 * release build; in a dev client the marks print to Metro, which is where
 * Claude reads them — so the NEXT slow open says exactly where the time went:
 *   [tools] tap→navigate    — the tile's press hold + hub mic handoff
 *   [tools] navigate→mount  — React Navigation push + first render of the screen
 *   [tools] mic acquire     — the engine's warm adopt vs cold start
 */
let tapAt = 0;
let navAt = 0;
let tapTool = '';

export function markToolTap(tool: string): void {
  if (!__DEV__) return;
  tapAt = Date.now();
  navAt = 0;
  tapTool = tool;
}

export function markToolNavigate(tool: string): void {
  if (!__DEV__) return;
  navAt = Date.now();
  if (tapAt) console.log(`[tools] tap→navigate ${tool}: ${navAt - tapAt} ms`);
}

export function markToolMount(screen: string, tool: string): void {
  if (!__DEV__) return;
  const from = navAt || tapAt;
  if (!from || tool !== tapTool) return;
  console.log(`[tools] navigate→mount ${screen}(${tool}): ${Date.now() - from} ms (tap→mount ${Date.now() - tapAt} ms)`);
}

export function markMicAcquire(label: string, startedAt: number, outcome: string): void {
  if (!__DEV__) return;
  console.log(`[tools] mic acquire ${label}: ${Date.now() - startedAt} ms — ${outcome}`);
}
