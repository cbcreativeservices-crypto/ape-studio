/**
 * labProbe — TEMP on-device diagnostics line for the lab touch probe
 * (2026-09-28, owner's iPhone: ▶ in the Bass lab fetches the recording but no
 * sound is heard; ? and ⓘ do nothing). Any module can `labProbe('…')`; the
 * LabShell probe line (triple-tap the lab title) shows the last few entries.
 * REMOVE with the probe once the fault is found.
 */
import { useEffect, useState } from 'react';

let lines: string[] = [];
const listeners = new Set<() => void>();

export function labProbe(msg: string): void {
  const t = new Date();
  const stamp = `${t.getMinutes()}:${String(t.getSeconds()).padStart(2, '0')}`;
  lines = [...lines, `${stamp} ${msg}`].slice(-6);
  listeners.forEach((l) => l());
}

export function useLabProbeLines(): string[] {
  const [snap, setSnap] = useState(lines);
  useEffect(() => {
    const l = () => setSnap(lines);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
