/**
 * Calculation Chain — the lab's signature feature (owner spec 2026-07-29):
 * send a computed value from one workspace into a matching input of another
 * (e.g. mic sensitivity → mic voltage → required preamp gain → headroom).
 *
 * In-memory only, one value at a time: press "SEND →" on a result, then any
 * input field of the SAME quantity kind (in any workspace) offers a one-tap
 * "USE <label>" fill. Deliberately no persistence — a chain is a working
 * gesture, not saved state.
 */
import { useEffect, useState } from 'react';
import type { QuantityKind } from './calcUnits';

export type ChainValue = {
  label: string;
  quantity: QuantityKind;
  /** In the quantity's BASE unit. */
  baseValue: number;
  fromWorkspace: string;
};

let current: ChainValue | null = null;
const listeners = new Set<() => void>();

export function setChainValue(v: ChainValue | null) {
  current = v;
  listeners.forEach((fn) => fn());
}

export function getChainValue(): ChainValue | null {
  return current;
}

export function useChainValue(): ChainValue | null {
  const [v, setV] = useState(current);
  useEffect(() => {
    const fn = () => setV(current);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return v;
}
