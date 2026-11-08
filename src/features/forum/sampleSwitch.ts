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
  /** A refusal every category answers with. */
  refusal?: string;
  /** Draws the owner's rows in a thread. */
  admin?: boolean;
  /** Which directory tab opens. Forum unless it says otherwise. */
  tab?: 'forum' | 'directory';
  /** The Directory chip that starts selected. */
  chip?: 'all' | 'graduates' | 'employer' | 'company' | 'institution' | 'instructor';
  /** A part the harness cannot otherwise reach, drawn on the forum home. */
  panel?: 'kind-switch' | 'discuss-lab' | 'discuss-lab-new';
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
  correction: '00000000-0000-4000-8000-000000000106',
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
  { ...base, id: 'no-profile', label: 'Posting refused: publish your profile first', refusal: 'profile_unpublished' },
  { ...base, id: 'thread-correction', label: 'Thread: a correction to accept or decline', open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.correction } } },
  { ...base, id: 'thread-admin', label: 'Thread: owner sees Pin and Lock (header ···)', admin: true, open: { route: 'ForumThread', params: { topicId: SAMPLE_TOPIC.discussion } } },
  { ...base, id: 'mine', label: 'Your forum: level, badges, bookmarks', open: { route: 'ForumMine' } },
  { ...base, id: 'mine-empty', label: 'Your forum: nothing yet', face: 'empty', open: { route: 'ForumMine' } },
  { ...base, id: 'mine-unreadable', label: 'Your forum: could not be read', face: 'unreadable', open: { route: 'ForumMine' } },
  { ...base, id: 'discuss', label: 'Discuss this lab: thread exists', panel: 'discuss-lab' },
  { ...base, id: 'discuss-new', label: 'Discuss this lab: start the discussion', panel: 'discuss-lab-new' },
  { ...base, id: 'kind-switch', label: 'Employer to Company switch', panel: 'kind-switch' },
  { ...base, id: 'dir-all', label: '2 · Directory: All', tab: 'directory', chip: 'all' },
  { ...base, id: 'dir-graduates', label: '2 · Directory: Graduates', tab: 'directory', chip: 'graduates' },
  { ...base, id: 'dir-employers', label: '2 · Directory: Employers', tab: 'directory', chip: 'employer' },
  { ...base, id: 'dir-companies', label: '2 · Directory: Companies', tab: 'directory', chip: 'company' },
  { ...base, id: 'dir-institutions', label: '2 · Directory: Institutions', tab: 'directory', chip: 'institution' },
  { ...base, id: 'dir-instructors', label: '2 · Directory: Instructors', tab: 'directory', chip: 'instructor' },
  { ...base, id: 'dir-empty', label: '2 · Directory: nothing listed', tab: 'directory', chip: 'graduates', face: 'empty' },
  { ...base, id: 'dir-unreadable', label: '2 · Directory: could not be read', tab: 'directory', chip: 'graduates', face: 'unreadable' },
  { ...base, id: 'queue', label: 'Owner queue', admin: true, open: { route: 'ReportsAdmin', params: { tab: 'forum' } } },
  { ...base, id: 'queue-empty', label: 'Owner queue: nothing waiting', admin: true, face: 'empty', open: { route: 'ReportsAdmin', params: { tab: 'forum' } } },
  { ...base, id: 'queue-unreadable', label: 'Owner queue: could not be read', admin: true, face: 'unreadable', open: { route: 'ReportsAdmin', params: { tab: 'forum' } } },
  { ...base, id: 'queue-refused', label: 'Owner queue: not the owner', face: 'closed', open: { route: 'ReportsAdmin', params: { tab: 'forum' } } },
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
