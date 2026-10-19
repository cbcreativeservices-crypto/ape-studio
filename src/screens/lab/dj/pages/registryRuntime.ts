/**
 * registryRuntime — the closing screen reads the page registry at RENDER
 * time from here (pages/index sets it once), so the last page never imports
 * the index that imports it (no import cycle).
 */
import type { PageDef } from '../../kit/PagedLab';

let reg: { pages: readonly PageDef[]; numbers: readonly number[] } = { pages: [], numbers: [] };

export function setDjRegistry(pages: readonly PageDef[], numbers: readonly number[]): void {
  reg = { pages, numbers };
}

export const getDjRegistry = () => reg;
