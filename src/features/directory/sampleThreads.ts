/**
 * SAMPLE member chat — a development-only preview of the Audio Community
 * Directory › REQUESTS screens (owner 2026-11-01: "I need to see these
 * screens" without making accounts on the live database).
 *
 * The DEV · VISUAL INDEX turns it on and opens the directory on REQUESTS;
 * leaving the directory turns it off. While it is on, the contact functions
 * in api.ts answer from this in-memory set instead of the server, so nothing
 * is read from or written to the live database. Every person and message here
 * is made up.
 *
 * Off in any release build: `sampleDirectoryOn()` needs __DEV__.
 */
import type {
  CommunityProfile,
  ContactAllowance,
  ContactThread,
  ListResult,
  MyProfileLoad,
  ReportReason,
  ThreadMessage,
} from './api.ts';
import type { InboxRead } from './inboxCounts.ts';
import { sampleForumOn, subscribeSample } from '../forum/sampleSwitch.ts';

declare const __DEV__: boolean | undefined;

let enabled = false;

export function setSampleDirectory(on: boolean): void {
  enabled = on;
  // Fresh each time it opens, and nothing kept once the directory closes.
  resetSample();
  noteMode();
}

/**
 * WHICH WORLD A WRITE WAS QUEUED IN (bug pass 2026-11-08, P1 check). A save
 * is often SENT a microtask after it is queued: MY PROFILE's save-on-leave
 * runs after the directory's unmount has already switched the samples off,
 * so `sampleDirectoryOn()` at send time said "live" and the sample's profile
 * went to the real `community_profile_save`. `sampleGen()` changes every time
 * the sample turns on or off; a writer captures it when it QUEUES and drops
 * the write if it has changed by the time it runs (profileLeave.ts).
 *
 * Read lazily as well as on each switch, so a sample state lost any other way
 * (a dev Fast Refresh re-running the forum switch) still counts as a change.
 */
let gen = 0;
let lastOn = false;
function noteMode(): void {
  const on = sampleDirectoryOn();
  if (on !== lastOn) {
    lastOn = on;
    gen += 1;
  }
}

export function sampleGen(): number {
  noteMode();
  return gen;
}

// The forum's switch announces each change; flag-only changes (welcome seen,
// rules accepted) leave on/off alone and so do not count.
subscribeSample(noteMode);

/**
 * On while either dev sample is (bug pass 2026-11-08, P1). The forum's
 * preview (sampleSwitch.ts) opens this same screen, and its MY PROFILE and
 * REQUESTS tabs and the member sheet then wrote to the LIVE database: a chip
 * tap saved over the signed-in account's real community profile, and SEND A
 * CONTACT REQUEST / BLOCK sent the sample's made-up tokens to the server.
 * One switch for the whole directory, so a sample can never write live.
 */
export function sampleDirectoryOn(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true && (enabled || sampleForumOn());
}

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function base(): Omit<ContactThread, 'id' | 'direction' | 'otherDisplayName' | 'purposeLabel' | 'message' | 'status' | 'createdAt'> {
  return {
    otherToken: null,
    respondedAt: null,
    messageCount: 0,
    otherKind: 'member',
    otherVerified: false,
    otherWebsite: null,
    otherPageToken: null,
  };
}

function seedThreads(): ContactThread[] {
  return [
    {
      ...base(),
      id: id(1),
      direction: 'incoming',
      otherDisplayName: 'Maya R.',
      otherToken: 'sample-maya',
      purposeLabel: 'Collaboration',
      message:
        'Hi! I saw you completed the Live Sound System Engineer certificate. I run sound for a small venue and would love to compare notes on gain staging for a 16-channel board.',
      status: 'pending',
      createdAt: ago(3),
    },
    {
      ...base(),
      id: id(2),
      direction: 'incoming',
      otherDisplayName: 'Harbor Sound Co.',
      purposeLabel: 'Work opportunity',
      message:
        'We are hiring a part-time A2 for our corporate events season. Your verified credentials match what we look for. Would you be open to a short call?',
      status: 'pending',
      createdAt: ago(20),
      otherKind: 'employer',
      otherVerified: true,
      otherWebsite: 'https://example.com',
    },
    {
      ...base(),
      id: id(3),
      direction: 'incoming',
      otherDisplayName: 'Diego M.',
      otherToken: 'sample-diego',
      purposeLabel: 'Mentoring',
      message: 'Could I ask you a few questions about getting started in studio recording?',
      status: 'accepted',
      createdAt: ago(72),
      respondedAt: ago(70),
      messageCount: 1,
    },
    {
      ...base(),
      id: id(4),
      direction: 'outgoing',
      otherDisplayName: 'Priya S.',
      otherToken: 'sample-priya',
      purposeLabel: 'Collaboration',
      message: 'Hi Priya, I would like to talk about field recording for a nature documentary project.',
      status: 'pending',
      createdAt: ago(30),
    },
    {
      ...base(),
      id: id(5),
      direction: 'incoming',
      otherDisplayName: 'Alex T.',
      otherToken: 'sample-alex',
      purposeLabel: 'Collaboration',
      message: 'Want to start a band?',
      status: 'declined',
      createdAt: ago(200),
      respondedAt: ago(190),
    },
  ];
}

function seedMessages(): Record<string, ThreadMessage[]> {
  return {
    [id(3)]: [
      { id: 'm1', mine: false, body: 'Thanks for accepting! Which microphone types should I learn first for vocals?', createdAt: ago(69) },
      { id: 'm2', mine: true, body: 'Start with how a dynamic and a large-diaphragm condenser differ. The Mic Selection lab walks through both.', createdAt: ago(68) },
      { id: 'm3', mine: false, body: 'Great, I will go through it this week. Is a pop filter always needed?', createdAt: ago(5) },
    ],
  };
}

let threads: ContactThread[] = seedThreads();
let messages: Record<string, ThreadMessage[]> = seedMessages();
let nextMsg = 100;

function resetSample(): void {
  threads = seedThreads();
  messages = seedMessages();
  nextMsg = 100;
  profile = null;
}

const ok = { ok: true as const };

export function sampleThreads(): ListResult<ContactThread> {
  return { ok: true, rows: threads.map((t) => ({ ...t })) };
}

export function sampleMessages(requestId: string): ListResult<ThreadMessage> {
  return { ok: true, rows: (messages[requestId] ?? []).map((m) => ({ ...m })) };
}

export function sampleRespond(requestId: string, action: 'accept' | 'decline' | 'withdraw'): { ok: true } {
  const status: ContactThread['status'] = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'withdrawn';
  threads = threads.map((t) => (t.id === requestId ? { ...t, status, respondedAt: new Date().toISOString() } : t));
  return ok;
}

export function sampleSend(requestId: string, body: string): { ok: true } {
  const list = messages[requestId] ?? [];
  messages = { ...messages, [requestId]: [...list, { id: `m${nextMsg++}`, mine: true, body, createdAt: new Date().toISOString() }] };
  return ok;
}

export function sampleBlock(requestId: string): { ok: true } {
  threads = threads.map((t) => (t.id === requestId ? { ...t, status: 'blocked' } : t));
  return ok;
}

export function sampleReport(_input: { reason: ReportReason }): { ok: true } {
  return ok;
}

/** The member sheet's SEND A CONTACT REQUEST: nothing leaves the phone. */
export function sampleContactRequest(_toToken: string, _purpose: string, _message: string): { ok: true } {
  return ok;
}

/** The member sheet's BLOCK (a token, not a thread). */
export function sampleBlockMember(_token: string, _on: boolean): { ok: true } {
  return ok;
}

/* ── SAMPLE "MY PROFILE" (bug pass 2026-11-08, P1) ─────────────────────────
 * The editor and the setup guide save every chip tap. In the sample they save
 * HERE, in memory, so the guide can be walked end to end without touching the
 * signed-in account's real community profile. Starts empty (the guide shows),
 * and is dropped whenever the sample opens or closes. */
let profile: CommunityProfile | null = null;

const EMPTY: CommunityProfile = {
  displayName: '',
  about: '',
  countryCode: '',
  region: '',
  workPref: null,
  published: false,
  discoverable: false,
  contactEnabled: false,
  adultConfirmed: false,
  needsIdentityReview: false,
  publicToken: null,
  primaryArea: null,
  areas: [],
  specialties: [],
  roles: [],
  openTo: [],
  languages: [],
  featuredCredentialIds: [],
};

const copy = (p: CommunityProfile): CommunityProfile => ({
  ...p,
  areas: [...p.areas],
  specialties: [...p.specialties],
  roles: [...p.roles],
  openTo: [...p.openTo],
  languages: [...p.languages],
  featuredCredentialIds: [...p.featuredCredentialIds],
});

export function sampleMyProfile(): MyProfileLoad {
  return profile ? { status: 'ok', profile: copy(profile) } : { status: 'none' };
}

/** The fields `community_profile_save` writes; the switches are not among them. */
export function sampleSaveProfile(p: CommunityProfile): { ok: true } {
  const cur = profile ?? EMPTY;
  profile = copy({
    ...cur,
    displayName: p.displayName.trim(),
    about: p.about,
    countryCode: p.countryCode,
    region: p.region,
    workPref: p.workPref,
    primaryArea: p.primaryArea,
    areas: p.areas,
    specialties: p.specialties,
    roles: p.roles,
    openTo: p.openTo,
    languages: p.languages,
    needsIdentityReview: false,
  });
  return ok;
}

export function sampleSetFeatured(ids: string[]): { ok: true } {
  profile = copy({ ...(profile ?? EMPTY), featuredCredentialIds: ids });
  return ok;
}

export function samplePublish(on: boolean, adult: boolean): { ok: true } | { ok: false; error: string } {
  const cur = profile ?? EMPTY;
  if (on && (!cur.displayName.trim() || !cur.primaryArea || !cur.roles.length)) {
    return { ok: false, error: 'Add a public display name, one primary area and How I’m Involved before publishing.' };
  }
  profile = copy({
    ...cur,
    published: on,
    adultConfirmed: cur.adultConfirmed || adult,
    publicToken: on ? 'sample-me' : cur.publicToken,
    discoverable: on ? cur.discoverable : false,
    contactEnabled: on ? cur.contactEnabled : false,
  });
  return ok;
}

export function sampleSetSwitch(key: 'discoverable' | 'contactEnabled', on: boolean): { ok: true } {
  profile = copy({ ...(profile ?? EMPTY), [key]: on });
  return ok;
}

export function sampleDeleteProfile(): { ok: true } {
  profile = null;
  return ok;
}

export function sampleAllowance(): ContactAllowance {
  return {
    requestsLeftThisWeek: 4,
    messagesLeftToday: 18,
    messagesLeftThisWeek: 60,
    messagesLeftHereToday: 9,
    messageMaxChars: 1000,
    awaitingReply: false,
  };
}

/**
 * SAMPLE unread count (owner 2026-11-01: see the PROFILE tab's count on
 * Home). The visual index turns it on; it stays on until turned off there or
 * the app restarts. Same __DEV__ guard. Matches the sample chat: two
 * requests waiting and one unread message from Diego.
 */
let inboxEnabled = false;

export function setSampleInbox(on: boolean): void {
  inboxEnabled = on;
}

export function sampleInboxOn(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true && inboxEnabled;
}

export function sampleInboxCounts(): InboxRead {
  return { ok: true, counts: { pending: 2, unreadMessages: 1, byThread: { [id(3)]: 1 } } };
}
