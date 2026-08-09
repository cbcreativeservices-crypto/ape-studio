/**
 * Shared "show links in definitions" preference for the glossary (owner
 * 2026-08-07).
 *
 * The control appears in every term's icon row, but the setting is GLOBAL — one
 * flag for the whole glossary — and now REMEMBERED across launches: the first
 * time ever (no stored value) links are ON; after that the user's last choice
 * wins. Mirrors features/tools/colorModePref.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:glossary:showLinks';

/** [linksOn, setLinksOn] — persisted; defaults ON until the user changes it. */
export function useGlossaryLinksPref(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(true); // first-ever = links ON (no stored value yet)
  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (alive && raw != null) setOn(raw === '1');
    })();
    return () => {
      alive = false;
    };
  }, []);
  const set = useCallback((v: boolean) => {
    setOn(v);
    void AsyncStorage.setItem(KEY, v ? '1' : '0');
  }, []);
  return [on, set];
}
