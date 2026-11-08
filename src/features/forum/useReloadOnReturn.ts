/**
 * Read a screen again when the member comes back to it (from a thread, the Ask
 * form, Edit and Repost). Not on the first focus: the screen's own read is
 * already out.
 */
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useReloadOnReturn(...reloads: (() => Promise<void>)[]): void {
  const latest = useRef(reloads);
  latest.current = reloads;
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      for (const reload of latest.current) void reload();
    }, []),
  );
}
