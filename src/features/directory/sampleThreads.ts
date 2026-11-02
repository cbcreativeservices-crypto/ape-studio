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
import type { ContactAllowance, ContactThread, ListResult, ReportReason, ThreadMessage } from './api.ts';

declare const __DEV__: boolean | undefined;

let enabled = false;

export function setSampleDirectory(on: boolean): void {
  enabled = on;
  if (on) resetSample();
}

export function sampleDirectoryOn(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true && enabled;
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
