/**
 * Receipt — userNotifications (owner decision 2026-10-04: "user should be able
 * to turn on and use notifications between each other").
 *
 * In-app unread counts (badges) + opt-in alerts between members:
 *  - a failed / unknown count read shows NO badge (never a false 0, never the
 *    last number), and an account wipe drops the count and any read in flight;
 *  - newest read wins;
 *  - the alert switch is opt-in, asks the OS only after our explainer, and
 *    registers the phone before it says "on";
 *  - a tapped alert opens the conversation through the deep-link table and
 *    the pendingLink rules (`directory/requests/<uuid>`);
 *  - member alerts are held out of the banner in Low-Light;
 *  - Log out releases this phone before signing out;
 *  - the server draft never sends message text unless the recipient opted in.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const root = new URL('../', import.meta.url);
const src = (p: string) => readFileSync(new URL(p, root), 'utf8');
const has = (p: string) => existsSync(new URL(p, root));

const UUID = '3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b';

describe('userNotifications — the pure rules', async () => {
  const R = has('src/features/notifications/communityRules.ts')
    ? await import('../src/features/notifications/communityRules.ts')
    : null;

  it('the rules module exists', () => {
    assert.ok(R, 'src/features/notifications/communityRules.ts');
  });

  it('a tap payload is strict: type, kind and a real uuid', () => {
    assert.ok(R);
    assert.deepEqual(R.communityTapFrom({ type: 'community', kind: 'message', requestId: UUID }), {
      kind: 'message',
      requestId: UUID,
    });
    assert.equal(R.communityTapFrom({ type: 'community', kind: 'message', requestId: '../x' }), null);
    assert.equal(R.communityTapFrom({ type: 'community', kind: 'spam', requestId: UUID }), null);
    assert.equal(R.communityTapFrom({ type: 'weekly', concept: 'x' }), null);
    assert.equal(R.communityPath({ kind: 'request', requestId: UUID }), `directory/requests/${UUID}`);
  });

  it('directory route params are validated', () => {
    assert.ok(R);
    assert.deepEqual(R.directoryParams({ tab: 'requests', thread: UUID }), { requests: true, thread: UUID });
    assert.deepEqual(R.directoryParams({ tab: 'requests', thread: 'nope' }), { requests: true, thread: null });
    assert.deepEqual(R.directoryParams({ tab: 'explore', thread: UUID }), { requests: false, thread: null });
    assert.deepEqual(R.directoryParams(undefined), { requests: false, thread: null });
  });

  it('Low-Light: a member alert is held out of the banner and silent; others unchanged', () => {
    assert.ok(R);
    const held = R.foregroundPresentation(true, true);
    assert.equal(held.shouldShowBanner, false);
    assert.equal(held.shouldPlaySound, false);
    assert.equal(held.shouldShowList, true, 'still in the list — nothing lost');
    assert.equal(R.foregroundPresentation(true, false).shouldShowBanner, true);
    assert.equal(R.foregroundPresentation(false, true).shouldShowBanner, true, 'weekly concept behaviour unchanged');
  });

  it('preferences default to OFF (opt-in) and message text OFF', () => {
    assert.ok(R);
    assert.equal(R.DEFAULT_COMMUNITY_PREFS.pushEnabled, false);
    assert.equal(R.DEFAULT_COMMUNITY_PREFS.showPreview, false);
    const empty = R.prefsFromRow({});
    assert.equal(empty.pushEnabled, false);
    assert.equal(empty.showPreview, false);
    assert.deepEqual(R.prefsFromRow({ push_enabled: true, notify_messages: false, notify_requests: true, show_preview: true }), {
      pushEnabled: true,
      messages: false,
      requests: true,
      showPreview: true,
    });
  });

  it('a missing server function is told apart from a failure', () => {
    assert.ok(R);
    assert.equal(R.isMissingRpc({ code: 'PGRST202', message: 'x' }), true);
    assert.equal(R.isMissingRpc({ code: '42883' }), true);
    assert.equal(R.isMissingRpc({ message: 'Could not find the function public.contact_inbox_counts' }), true);
    assert.equal(R.isMissingRpc({ code: '08006', message: 'AbortError: timeout after 30000ms' }), false);
    assert.equal(R.isMissingRpc(null), false);
  });
});

describe('userNotifications — unread counts store', async () => {
  const S = has('src/features/directory/inboxCounts.ts')
    ? await import('../src/features/directory/inboxCounts.ts')
    : null;
  const reg = await import('../src/features/storage/localStoreRegistry.ts');
  const ok = (pending: number, unread: number | null, byThread: Record<string, number> = {}) => async () =>
    ({ ok: true as const, counts: { pending, unreadMessages: unread, byThread } });

  it('the store exists', () => {
    assert.ok(S, 'src/features/directory/inboxCounts.ts');
  });

  it('a good read shows its number; a FAILED read after it shows NO badge, not the old number or 0', async () => {
    assert.ok(S);
    S.resetInbox();
    await S.refreshInbox(ok(2, 1), { force: true });
    assert.equal(S.badgeCount(S.getInboxState()), 3);
    await S.refreshInbox(async () => ({ ok: false as const }), { force: true });
    assert.equal(S.getInboxState().status, 'unknown');
    assert.equal(S.badgeCount(S.getInboxState()), null);
    await S.refreshInbox(async () => {
      throw new Error('network');
    }, { force: true });
    assert.equal(S.badgeCount(S.getInboxState()), null);
  });

  it('no account → no badge; zero → no badge', async () => {
    assert.ok(S);
    await S.refreshInbox(async () => ({ ok: false as const, signedOut: true }), { force: true });
    assert.equal(S.getInboxState().status, 'signedOut');
    assert.equal(S.badgeCount(S.getInboxState()), null);
    await S.refreshInbox(ok(0, 0), { force: true });
    assert.equal(S.badgeCount(S.getInboxState()), null);
  });

  it('unread messages not known yet (pre-migration) count requests only', async () => {
    assert.ok(S);
    await S.refreshInbox(ok(2, null), { force: true });
    assert.equal(S.badgeCount(S.getInboxState()), 2);
    assert.equal(S.badgeA11y(S.getInboxState()), '2 contact requests waiting');
  });

  it('NEWEST read wins: an older answer landing last is dropped', async () => {
    assert.ok(S);
    S.resetInbox();
    let releaseOld!: () => void;
    const old = S.refreshInbox(
      () => new Promise((res) => (releaseOld = () => res({ ok: true, counts: { pending: 9, unreadMessages: 9, byThread: {} } }))),
      { force: true },
    );
    await S.refreshInbox(ok(1, 0), { force: true });
    releaseOld();
    await old;
    assert.equal(S.badgeCount(S.getInboxState()), 1);
  });

  it('ACCOUNT WIPE: the count is dropped, and a read in flight for the old account never lands', async () => {
    assert.ok(S);
    await S.refreshInbox(ok(4, 0), { force: true });
    let release!: () => void;
    const inflight = S.refreshInbox(
      () => new Promise((res) => (release = () => res({ ok: true, counts: { pending: 7, unreadMessages: 0, byThread: {} } }))),
      { force: true },
    );
    reg.resetRegisteredLocalStores(); // the real wipe entry point
    assert.equal(S.badgeCount(S.getInboxState()), null);
    release();
    await inflight;
    assert.equal(S.getInboxState().status, 'unknown', 'the departing account’s answer was dropped');
  });

  it('a conversation marked read leaves the badge at once; bad server values never reach it', async () => {
    assert.ok(S);
    await S.refreshInbox(ok(1, 3, { [UUID]: 2, other: 1 }), { force: true });
    assert.equal(S.threadUnread(S.getInboxState(), UUID), 2);
    S.markThreadSeen(UUID);
    assert.equal(S.threadUnread(S.getInboxState(), UUID), 0);
    assert.equal(S.badgeCount(S.getInboxState()), 2);
    await S.refreshInbox(ok(-3, Number.NaN, { x: -1 }), { force: true });
    assert.equal(S.badgeCount(S.getInboxState()), null);
    assert.equal(S.badgeText(150), '99+');
  });
});

describe('userNotifications — deep link + pendingLink', async () => {
  const { isClaimedPath } = await import('../src/navigation/linkPaths.ts');
  const { setPendingLink, consumePendingLink, pendingLinkUrl } = await import('../src/navigation/pendingLink.ts');

  it('`directory/requests/<uuid>` is claimed; anything looser is not', () => {
    assert.equal(isClaimedPath('directory'), true);
    assert.equal(isClaimedPath('directory/requests'), true);
    assert.equal(isClaimedPath(`directory/requests/${UUID}`), true);
    assert.equal(isClaimedPath('directory/requests/not-a-uuid'), false);
    assert.equal(isClaimedPath(`directory/explore/${UUID}`), false);
    assert.equal(isClaimedPath(`directory/requests/${UUID}/more`), false);
  });

  it('a tap while signed out is held as a pending link and resumes after sign-in', () => {
    assert.equal(setPendingLink(pendingLinkUrl(`directory/requests/${UUID}`)), true);
    assert.equal(consumePendingLink(), `directory/requests/${UUID}`);
  });

  it('the navigator declares the params', () => {
    assert.match(src('src/navigation/linking.ts'), /AudioCommunityDirectory: 'directory\/:tab\?\/:thread\?'/);
  });

  it('the real router resolves the alert path to the directory with both params (and bare `directory` still works)', async () => {
    const { createRequire } = await import('node:module');
    const req = createRequire(new URL('../node_modules/@react-navigation/native/package.json', import.meta.url));
    const corePkg = req.resolve('@react-navigation/core/package.json');
    const { getStateFromPath } = await import(
      pathToFileURL(corePkg.replace(/package\.json$/, 'lib/module/getStateFromPath.js')).href
    );
    const LINKING = src('src/navigation/linking.ts');
    const start = LINKING.indexOf('config: {') + 'config: '.length;
    const body = LINKING.slice(start, LINKING.indexOf('\n};', start)).replace(/,\s*$/, '');
    const config = new Function(`return (${body});`)();
    const leaf = (p: string) => getStateFromPath(p, config)?.routes?.at(-1);
    const r = leaf(`/directory/requests/${UUID}`);
    assert.equal(r?.name, 'AudioCommunityDirectory');
    assert.deepEqual(r?.params, { tab: 'requests', thread: UUID });
    assert.equal(leaf('/directory')?.name, 'AudioCommunityDirectory');
  });
});

describe('userNotifications — wiring', () => {
  it('push.ts presents member alerts by the Low-Light rule and routes their taps', () => {
    const p = src('src/features/notifications/push.ts');
    assert.match(p, /rules\(\)\.foregroundPresentation\(\s*rules\(\)\.isCommunityData\(/);
    assert.match(p, /getLowLight\(\) \|\| isLowLightUnreadable\(\)/);
    assert.match(p, /communityTapFrom\(data\)/);
    assert.match(p, /community\.open\(rules\(\)\.communityPath\(tap\)\)/);
  });

  it('App opens a tap through pendingLink + the link table, parks it on cold start, and reads counts on foreground', () => {
    const a = src('App.tsx');
    assert.match(a, /function openCommunityPath[\s\S]*?setPendingLink\(pendingLinkUrl\(path\)\)[\s\S]*?if \(base === 'Auth'\) return;[\s\S]*?navigateToPath\(path\)/);
    assert.match(a, /flushCommunityPathNav\(openCommunityPath\)/);
    assert.match(a, /queueCommunityPath\(path\)/);
    assert.match(a, /refreshCommunityInbox\(true\)/);
    assert.match(a, /syncCommunityDevice\(\)/);
  });

  it('Settings: the section is rendered, and Log out releases this phone BEFORE signing out', () => {
    const s = src('src/screens/settings/SettingsScreen.tsx');
    assert.match(s, /<CommunityNotifySection \/>/);
    const rel = s.indexOf('releaseCommunityDevice()');
    const out = s.indexOf("supabase.auth.signOut({ scope: 'local' })");
    assert.ok(rel > 0 && out > rel, 'release comes before signOut');
  });

  it('the switch: explainer → OS → phone registered → setting saved (never ON with no phone behind it)', () => {
    const c = src('src/features/notifications/CommunityNotifySection.tsx');
    const ask = c.indexOf('await flow.request()');
    const regi = c.indexOf('await registerCommunityDevice()');
    const save = c.indexOf('saveCommunityPrefs({ pushEnabled: true })');
    assert.ok(ask > 0 && regi > ask && save > regi, 'order');
    assert.match(c, /usePermissionFlow\('notifications'/);
    assert.match(c, /latch\.run\(/, 'writes are latched');
  });

  it('the permission explainer exists for alerts and resets with the others', () => {
    assert.match(src('src/features/permissions/PermissionPrompt.tsx'), /notifications: \{\s*title: 'Get alerts for messages and requests\?'/);
    assert.match(src('src/features/permissions/permissionStore.ts'), /\['camera', 'location', 'photo', 'mic', 'notifications'\]/);
  });

  it('badges: Profile tab, the directory entry points, the REQUESTS tab, and per conversation', () => {
    assert.match(src('src/components/nav/TabBar.tsx'), /name === 'Profile' \? <CommunityBadge/);
    assert.match(src('src/screens/profile/ProfileScreen.tsx'), /<CommunityBadge /);
    assert.match(src('src/screens/directory/DirectoryScreen.tsx'), /<CommunityBadge /);
    assert.match(src('src/screens/directory/AudioCommunityDirectoryScreen.tsx'), /t\.key === 'requests' \? <CommunityBadge/);
    const rv = src('src/screens/directory/RequestsView.tsx');
    assert.match(rv, /markThreadRead\(id\)\.then\(\(ok\) => \{\s*if \(ok\) markThreadSeen\(id\);/);
    assert.match(rv, /conversationLabel\(t, unread\)/);
  });
});

describe('userNotifications — server draft (privacy, opt-in, grants)', () => {
  const sql = has('supabase/migrations/2026100401_community_notifications.sql')
    ? src('supabase/migrations/2026100401_community_notifications.sql')
    : '';
  const fn = has('docs/drafts/community-push/index.ts') ? src('docs/drafts/community-push/index.ts') : '';

  it('exists', () => {
    assert.ok(sql, 'migration draft');
    assert.ok(fn, 'edge function draft');
  });

  it('opt-in and no message text by default', () => {
    assert.match(sql, /push_enabled\s+boolean not null default false/);
    assert.match(sql, /show_preview\s+boolean not null default false/);
    // The outbox carries ids, never the message body.
    const queue = sql.slice(sql.indexOf('create table if not exists public.community_push_queue'), sql.indexOf('create index if not exists community_push_queue_open_idx'));
    assert.ok(queue.length > 0);
    assert.doesNotMatch(queue, /\bbody\b/);
    assert.match(sql, /case when coalesce\(pr\.show_preview, false\) and g\.kind = 'message'/);
  });

  it('blocks both ways and restricted accounts never alert', () => {
    const due = sql.slice(sql.indexOf('create or replace function public.community_push_due'));
    assert.match(due, /not public\.account_restricted\(g\.sender\)/);
    assert.match(due, /not public\.account_restricted\(g\.recipient\)/);
    assert.match(due, /b\.blocker_user = g\.recipient and b\.blocked_user = g\.sender/);
    assert.match(due, /b\.blocker_user = g\.sender and b\.blocked_user = g\.recipient/);
  });

  it('grants: nothing to anon; sender functions to service_role only', () => {
    assert.match(sql, /revoke all on function public\.contact_inbox_counts\(\)\s+from public, anon;/);
    assert.match(sql, /grant execute on function public\.community_push_due\(\)\s+to service_role;/);
    assert.match(sql, /revoke all on public\.push_devices from public, anon, authenticated;/);
  });

  it('the edge function words match the app’s PUSH_TEXT', async () => {
    const { PUSH_TEXT } = await import('../src/features/notifications/communityRules.ts');
    assert.ok(fn.includes(`messageBody: "${PUSH_TEXT.messageBody}"`));
    assert.ok(fn.includes(`requestBody: "${PUSH_TEXT.requestBody}"`));
    assert.ok(fn.includes('`sent you ${n} messages`') && PUSH_TEXT.messagesBody(3) === 'sent you 3 messages');
    assert.match(fn, /data: \{ type: "community", kind: d\.kind, requestId: d\.request_id \}/);
  });
});
