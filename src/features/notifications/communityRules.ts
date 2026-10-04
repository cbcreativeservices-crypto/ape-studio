/**
 * Notifications between members (owner decision 2026-10-04: "user should be
 * able to turn on and use notifications between each other") — the PURE half.
 *
 * Everything here is import-free so the node tests can load it: the tap
 * payload contract, the deep-link path it opens, the foreground presentation
 * rule (quiet in Low-Light), the stored-preference mapping, and every word the
 * user reads about it.
 *
 * The server half (who is told, when, with what text) is a DRAFT for Comp A:
 * supabase/migrations/2026100401_community_notifications.sql and
 * docs/APE_COMMUNITY_NOTIFICATIONS_SERVER_DRAFT_2026_10_04.md.
 */

/** Android channel for member-to-member alerts — separate from the weekly
 *  concept so a person can silence one in the phone's own settings and keep
 *  the other. */
export const COMMUNITY_CHANNEL_ID = 'community';
export const COMMUNITY_CHANNEL_NAME = 'Messages and requests';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A contact request / conversation id, as the server issues them. */
export function isThreadId(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v);
}

export type CommunityTap = { kind: 'message' | 'request'; requestId: string };

/**
 * The `data` of a tapped member alert, or null when it is not one (or is
 * malformed). Strict on purpose: the id lands in a navigation path, so only a
 * real uuid is accepted, and the kind must be one we send.
 */
export function communityTapFrom(data: unknown): CommunityTap | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.type !== 'community') return null;
  if (d.kind !== 'message' && d.kind !== 'request') return null;
  if (!isThreadId(d.requestId)) return null;
  return { kind: d.kind, requestId: d.requestId };
}

/** True for any payload that SAYS it is a member alert (even a malformed one),
 *  so the foreground rule below can hold it back in Low-Light. */
export function isCommunityData(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as Record<string, unknown>).type === 'community';
}

/**
 * The app path a tap opens: the directory's REQUESTS tab, with that thread.
 * Goes through the ordinary deep-link table (linking.ts) and the pendingLink
 * rules, so a tap while signed out resumes after sign-in like any app link.
 */
export function communityPath(tap: CommunityTap): string {
  return `directory/requests/${tap.requestId}`;
}

/** The directory screen's route params, validated (a link can carry anything). */
export function directoryParams(params: unknown): { requests: boolean; thread: string | null } {
  const p = (params && typeof params === 'object' ? params : {}) as Record<string, unknown>;
  const requests = p.tab === 'requests';
  return { requests, thread: requests && isThreadId(p.thread) ? p.thread : null };
}

export type ForegroundPresentation = {
  shouldShowBanner: boolean;
  shouldShowList: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
};

/**
 * How an alert that arrives WHILE THE APP IS OPEN is presented.
 *
 * Low-Light Production Mode rule (owner): nothing auto-appears. A member alert
 * is held out of the banner and makes no sound while the mode is on — or while
 * its stored value could not be read, the same "hold back" rule every overlay
 * uses. It still goes into the notification list, so nothing is lost, and the
 * in-app badges update quietly. Every other kind keeps its existing behaviour.
 */
export function foregroundPresentation(community: boolean, lowLightHolds: boolean): ForegroundPresentation {
  if (community && lowLightHolds) {
    return { shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false };
  }
  return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
}

/* ── Preferences (server row, via RPC) ─────────────────────────────────── */

export type CommunityNotifyPrefs = {
  /** The opt-in. OFF by default — nothing is sent until the person turns it on. */
  pushEnabled: boolean;
  messages: boolean;
  requests: boolean;
  /** Show the first line of a message in the alert (and so on the lock
   *  screen). OFF by default: the alert says only who wrote. */
  showPreview: boolean;
};

export const DEFAULT_COMMUNITY_PREFS: CommunityNotifyPrefs = {
  pushEnabled: false,
  messages: true,
  requests: true,
  showPreview: false,
};

/** Map the RPC row. Anything missing falls back to the SAFE default — never on. */
export function prefsFromRow(row: unknown): CommunityNotifyPrefs {
  const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
  return {
    pushEnabled: r.push_enabled === true,
    messages: r.notify_messages !== false,
    requests: r.notify_requests !== false,
    showPreview: r.show_preview === true,
  };
}

/**
 * "This server does not have that function yet" — PostgREST's PGRST202, or
 * Postgres' undefined_function. Kept apart from every other failure: until
 * Comp A applies the migration the feature simply is not offered (no promise,
 * no error), whereas a network failure is told as one.
 */
export function isMissingRpc(err: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === 'PGRST202' || err.code === '42883') return true;
  return /could not find the function/i.test(err.message ?? '');
}

/* ── Words ─────────────────────────────────────────────────────────────── */

export const COMMUNITY_COPY = {
  section: 'MESSAGES & REQUESTS',
  intro: 'Alerts when another member messages you or asks to contact you.',
  masterLabel: 'Alert me on this phone',
  masterHint: 'Off until you switch it on. Your phone asks for permission first.',
  messagesLabel: 'New messages',
  messagesHint: 'Someone in an open conversation writes to you.',
  requestsLabel: 'Contact requests',
  requestsHint: 'Someone asks to contact you.',
  previewLabel: 'Show message text',
  previewHint:
    'Off: an alert shows only who wrote and “sent you a message”. On: the start of the message shows too — including on your lock screen.',
  footer:
    'Members you have blocked, and accounts the Academy has restricted, never send you an alert. While Low-Light Production Mode is on, alerts do not pop up over the app.',
  loading: 'Loading your alert settings…',
  loadFailed: 'Couldn’t load your alert settings — check your connection.',
  retryA11y: 'Retry loading message and request alert settings',
  webOnly: 'Alerts can only be delivered to the app on a phone.',
  permissionBlocked:
    'Notifications are turned off for this app in your phone’s settings. Allow them there, then switch this on again.',
  askedNotTo:
    'You chose not to be asked about alerts. To be asked again, use “Ask about permissions again” under ONBOARDING HINTS.',
  registerFailed:
    'This phone couldn’t be registered for alerts. Nothing was changed — check your connection and try again.',
  onFailed: 'Alerts couldn’t be switched on. Nothing was changed — check your connection and try again.',
  offFailed: 'Alerts couldn’t be switched off. Check your connection and try again.',
  changeFailed: 'That change couldn’t be saved. Check your connection and try again.',
  noticeTitle: 'Alerts',
} as const;

/** The alert text the SERVER sends (mirrored in the edge-function draft so the
 *  two cannot drift without a test noticing). Never message content unless the
 *  recipient opted in to previews. */
export const PUSH_TEXT = {
  messageBody: 'sent you a message',
  requestBody: 'asked to contact you',
  /** Several messages in one batch from the same person. */
  messagesBody: (n: number) => `sent you ${n} messages`,
} as const;
