/**
 * The forum's SAMPLE switch: a development-only preview of every forum screen
 * and state, in the style of directory/sampleThreads.ts. `forum_enabled` is
 * false on the server, so the real calls answer "closed" and there is nothing
 * to look at without this.
 *
 * The DEV · VISUAL INDEX and `#forumpreview` pick one of the states below and
 * open the directory on FORUM; leaving the directory turns it off. While it is
 * on, every call in api.ts answers from sampleData.ts, so nothing is read from
 * or written to the live database. Every person and post there is made up.
 *
 * Off in any release build: `sampleForumOn()` needs __DEV__, and api.ts only
 * requires sampleData.ts behind it.
 *
 * LEAF, no value imports: the dev index reads it.
 */

declare const __DEV__: boolean | undefined;

export type SampleFace = 'ok' | 'empty' | 'unreadable' | 'closed' | 'loading';

export type ForumSampleState = {
  id: string;
  label: string;
  /** Which of a list's faces the reads answer with. */
  face: SampleFace;
  /** The first-visit popup has already been seen. */
  welcomeSeen: boolean;
  /** The community rules have already been accepted. */
  rulesAccepted: boolean;
  /** A graduate or a verified account: may post in the Pro Lounge. */
  pro: boolean;
  /** The screen to open on top of the forum tab. */
  open?: { route: string; params?: Record<string, unknown> };
};

const base = { face: 'ok', welcomeSeen: true, rulesAccepted: true, pro: false } as const;

/** The topics sampleData.ts seeds, by the name the states below use. */
export const SAMPLE_TOPIC = {
  welcome: '00000000-0000-4000-8000-000000000101',
  solved: '00000000-0000-4000-8000-000000000102',
  discussion: '00000000-0000-4000-8000-000000000103',
  mine: '00000000-0000-4000-8000-000000000104',
  empty: '00000000-0000-4000-8000-000000000105',
} as const;

/** One row per mockup screen and state. */
export const FORUM_SAMPLE_STATES: ForumSampleState[] = [
  { ...base, id: 'welcome', label: '0 · First visit: welcome popup', welcomeSeen: false },
  {
    ...base,
    id: 'announcement',
    label: '0b · Welcome pinned in Announcements',
    open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.welcome } },
  },
  { ...base, id: 'home', label: '1 · Forum home' },
  { ...base, id: 'home-loading', label: '1 · Forum home: loading', face: 'loading' },
  { ...base, id: 'home-empty', label: '1 · Forum home: nothing posted yet', face: 'empty' },
  { ...base, id: 'home-unreadable', label: '1 · Forum home: could not be read', face: 'unreadable' },
  { ...base, id: 'home-closed', label: '1 · Forum home: not open yet', face: 'closed' },
  {
    ...base,
    id: 'lounge-readonly',
    label: '3 · Pro Lounge: read only',
    open: { route: 'ForumCategory', params: { lounge: true } },
  },
  {
    ...base,
    id: 'lounge-pro',
    label: '3 · Pro Lounge: graduate can post',
    pro: true,
    open: { route: 'ForumCategory', params: { lounge: true } },
  },
  {
    ...base,
    id: 'category',
    label: 'Category topic list',
    open: { route: 'ForumCategory', params: { slug: 'ask-the-community' } },
  },
  {
    ...base,
    id: 'category-empty',
    label: 'Category: nothing posted yet',
    face: 'empty',
    open: { route: 'ForumCategory', params: { slug: 'forensic-audio' } },
  },
  {
    ...base,
    id: 'category-unreadable',
    label: 'Category: could not be read',
    face: 'unreadable',
    open: { route: 'ForumCategory', params: { slug: 'ask-the-community' } },
  },
  {
    ...base,
    id: 'thread-solved',
    label: '4 · Thread with a solution (··· on any post)',
    open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.solved } },
  },
  {
    ...base,
    id: 'thread-discussion',
    label: '4 · Discussion: time order, no up-ranking',
    open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.discussion } },
  },
  {
    ...base,
    id: 'thread-mine',
    label: '7 · My thread: being reviewed and removed',
    open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.mine } },
  },
  {
    ...base,
    id: 'ask',
    label: '5 · Ask a question',
    open: { route: 'ForumAsk', params: { slug: 'ask-the-community' } },
  },
  {
    ...base,
    id: 'ask-first',
    label: '5 · Ask: rules to accept before a first post',
    rulesAccepted: false,
    open: { route: 'ForumAsk', params: { slug: 'ask-the-community' } },
  },
  { ...base, id: 'ideas', label: '6 · Ideas & Requests', open: { route: 'ForumIdeas' } },
  { ...base, id: 'moderation', label: '7 · When Claude steps in', open: { route: 'ForumNotices' } },
];

let state: ForumSampleState | null = null;
let openPending = false;
const listeners = new Set<() => void>();

/** A snapshot for `useSyncExternalStore`: changes only when a flag changes. */
let flags: { welcomeSeen: boolean; rulesAccepted: boolean } | null = null;

function emit(): void {
  for (const l of listeners) l();
}

export function setSampleForum(next: ForumSampleState | null): void {
  state = next;
  openPending = !!next?.open;
  flags = next ? { welcomeSeen: next.welcomeSeen, rulesAccepted: next.rulesAccepted } : null;
  emit();
}

export function sampleForumOn(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true && state !== null;
}

export function sampleState(): ForumSampleState | null {
  return sampleForumOn() ? state : null;
}

/** The screen a state opens on top of the forum tab, once. */
export function takeSampleOpen(): ForumSampleState['open'] | null {
  if (!sampleForumOn() || !openPending) return null;
  openPending = false;
  return state?.open ?? null;
}

export const sampleFlags = () => (sampleForumOn() ? flags : null);

export function setSampleFlags(patch: Partial<NonNullable<typeof flags>>): void {
  if (!flags) return;
  flags = { ...flags, ...patch };
  emit();
}

export function subscribeSample(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
