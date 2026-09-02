/**
 * pagedProgress — persistence for the visual, paged labs (Sound Envelope,
 * Speech & Voice, Smart Processors). AsyncStorage `ape:<labId>:v1` keeps
 * only what reproduces the learner's place: completed pages, last page.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PagedProgress = { completed: number[]; lastPage: number; done: boolean };

const key = (labId: string) => `ape:${labId}:v1`;

const EMPTY = (): PagedProgress => ({ completed: [], lastPage: 0, done: false });

/** Only non-negative integers, each once, ascending — a damaged or hand-edited
 *  record can never make the page dots or the n/N counter lie. */
function cleanCompleted(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  for (const v of raw) if (typeof v === 'number' && Number.isInteger(v) && v >= 0) seen.add(v);
  return [...seen].sort((a, b) => a - b);
}

export async function loadPagedProgress(labId: string): Promise<PagedProgress> {
  try {
    const raw = await AsyncStorage.getItem(key(labId));
    if (!raw) return EMPTY();
    const p = JSON.parse(raw) as Partial<PagedProgress>;
    return {
      completed: cleanCompleted(p.completed),
      lastPage: typeof p.lastPage === 'number' && Number.isInteger(p.lastPage) && p.lastPage >= 0 ? p.lastPage : 0,
      done: !!p.done,
    };
  } catch {
    return EMPTY();
  }
}

export async function savePagedProgress(labId: string, p: PagedProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(key(labId), JSON.stringify(p));
  } catch {}
}

export async function resetPagedProgress(labId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(labId));
  } catch {}
}
