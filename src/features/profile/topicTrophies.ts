/**
 * topicTrophies — a topic-NAME → trophy-art lookup (owner 2026-08-07).
 *
 * New model: every topic has its OWN trophy, earned by passing that topic's
 * quiz (grayed in the Achievements grid until earned), but the trophy art is
 * ALSO used as the topic's image on its dashboard — always full brightness,
 * regardless of earned state.
 *
 * v3 topic rows carry no art of their own, so we bridge by NAME to any
 * achievement that does have `icon_url`. Names drifted in the v3 rename, so only
 * the topics whose names still align light up today (~13); the rest fall back to
 * the dashboard placeholder and will light up as trophy art is authored/renamed
 * for v3. Matched case/whitespace-insensitively.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Process-wide cache — the map is small and static for a session.
let cache: Map<string, string> | null = null;
let inflight: Promise<Map<string, string>> | null = null;

async function load(): Promise<Map<string, string>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const m = new Map<string, string>();
      try {
        const { data } = await supabase
          .from('achievements')
          .select('name, icon_url')
          .not('icon_url', 'is', null);
        for (const r of (data ?? []) as { name: string | null; icon_url: string | null }[]) {
          if (r.name && r.icon_url) {
            const k = norm(r.name);
            if (!m.has(k)) m.set(k, r.icon_url); // first art for a name wins
          }
        }
      } catch {
        // leave empty — the dashboard falls back to its placeholder
      }
      cache = m;
      return m;
    })();
  }
  return inflight;
}

/** Hook: name→icon_url map (empty until the one-time fetch resolves). */
export function useTopicTrophies(): Map<string, string> {
  const [map, setMap] = useState<Map<string, string>>(cache ?? new Map());
  useEffect(() => {
    let alive = true;
    void load().then((m) => {
      if (alive) setMap(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}

/** The trophy icon_url (storage path) for a topic name, or null if none matches.
 *  Feed the result to <TrophyImage iconUrl=… /> (it resolves + falls back). */
export function trophyForTopicName(
  map: Map<string, string>,
  name: string | null | undefined,
): string | null {
  if (!name) return null;
  return map.get(norm(name)) ?? null;
}
