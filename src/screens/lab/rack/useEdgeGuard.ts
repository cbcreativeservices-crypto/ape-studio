/**
 * useEdgeGuard — measures a horizontal slider's track in its window and
 * returns the cap-travel insets that keep the cap ≥ 40 dp from both window
 * edges (laneEdgeGuard.ts holds the math and the why).
 *
 * Usage: put `ref` on the track view, call `measure()` from its onLayout,
 * draw the cap's travel inside `ins`, and read `insRef.current` in the
 * PanResponder (created once, so it must read through a ref).
 *
 * The measurement is re-taken when the window width changes (rotation, a
 * full-screen view turned sideways). Under Fabric measureInWindow reads the
 * shadow tree, so a native screen-push transform does not skew it; a frame
 * that is not wholly on screen is ignored anyway (laneEdgeInsets).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, type View } from 'react-native';
import { laneEdgeInsets, sameInsets, type LaneInsets } from './laneEdgeGuard';

export function useEdgeGuard({ capW, fallback }: { capW: number; fallback: LaneInsets }) {
  const ref = useRef<View>(null);
  const { width: winW } = useWindowDimensions();
  const winWRef = useRef(winW);
  winWRef.current = winW;
  const [ins, setIns] = useState<LaneInsets>(fallback);
  const insRef = useRef(ins);
  const optsRef = useRef({ capW, fallback });
  optsRef.current = { capW, fallback };
  const measure = useCallback(() => {
    const node = ref.current;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((x, _y, w) => {
      const next = laneEdgeInsets({ x, w }, winWRef.current, optsRef.current);
      if (!sameInsets(next, insRef.current)) {
        insRef.current = next;
        setIns(next);
      }
    });
  }, []);
  useEffect(() => {
    measure();
  }, [winW, measure]);
  return { ref, ins, insRef, measure };
}
