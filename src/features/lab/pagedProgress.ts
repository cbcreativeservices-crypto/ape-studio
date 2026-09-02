/**
 * pagedProgress — persistence for the visual, paged labs (Sound Envelope,
 * Speech & Voice, Smart Processors). AsyncStorage `ape:<labId>:v1` keeps
 * only what reproduces the learner's place: completed pages, last page.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PagedProgress = { completed: number[]; lastPage: number; done: boolean };

const key = (labId: string) => `ape:${labId}:v1`;

export async function loadPagedProgress(labId: string): Promise<PagedProgress> {
  try {
    const raw = await AsyncStorage.getItem(key(labId));
    if (!raw) return { completed: [], lastPage: 0, done: false };
    const p = JSON.parse(raw) as Partial<PagedProgress>;
    return { completed: Array.isArray(p.completed) ? p.completed : [], lastPage: typeof p.lastPage === 'number' ? p.lastPage : 0, done: !!p.done };
  } catch {
    return { completed: [], lastPage: 0, done: false };
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
