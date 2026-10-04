/**
 * HUNT 12 — Area 9 (community + careers + awards), 2026-10-04.
 * Each block is a receipt that FAILS on c0debb14.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/* ── A scripted Supabase client (H12-1) ─────────────────────────────────────
 * Each getSession() answers the next scripted answer (the last one repeats).
 * The users row and the gallery rows are a signed-in member's. */
type SessionAnswer = { data: { session: unknown }; error?: unknown };
const sb = {
  sessions: [] as SessionAnswer[],
  galleryReads: 0,
};
(globalThis as Record<string, unknown>).__H12_SB__ = sb;
const STUB = `
const sb = globalThis.__H12_SB__;
function builder(table) {
  const b = {};
  for (const m of ['select', 'eq', 'not', 'order', 'is', 'in', 'limit']) b[m] = () => b;
  b.maybeSingle = async () => (table === 'users' ? { data: { id: 'member-row' }, error: null } : { data: null, error: null });
  b.then = (ok, bad) => {
    if (table === 'student_achievement_progress') sb.galleryReads += 1;
    const rows = table === 'student_achievement_progress'
      ? [{ achievement_id: 'a1', date_earned: '2026-10-01T00:00:00Z', achievements: { name: 'Gain Staging', icon_url: null, subject: 'Signal', global_sequence: 999999 } }]
      : [];
    return Promise.resolve({ data: rows, error: null }).then(ok, bad);
  };
  return b;
}
export const supabase = {
  auth: {
    async getSession() {
      return sb.sessions.length > 1 ? sb.sessions.shift() : sb.sessions[0];
    },
  },
  from: (t) => builder(t),
  async rpc() { return { data: null, error: { message: 'not in this test' } }; },
};
`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) {
      return { url: `data:text/javascript,${encodeURIComponent(STUB)}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const MEMBER = { data: { session: { user: { id: 'auth-member' } } }, error: null };
const UNREACHED = { data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'fetch failed' } };
const SIGNED_OUT = { data: { session: null }, error: null };

describe('H12-1 Trophy Case shared reads: an unknown session is not the guest (K1/K5)', () => {
  it('a member read keyed while the session was UNREACHABLE is never served to the guest who follows', async () => {
    const ach = await import('../src/features/achievements/api.ts');
    // Expired token, dead connection: the identity read comes back
    // { session: null, AuthRetryableFetchError }; a moment later the users-row
    // read gets the member's session and reads their gallery.
    sb.sessions = [UNREACHED, MEMBER];
    const first = await ach.fetchGalleryV3Shared();
    assert.equal(first.length, 1, 'the member read their own gallery');
    // Then the member signs out (inside the 8 s sharing window).
    sb.sessions = [SIGNED_OUT];
    const before = sb.galleryReads;
    const guest = await ach.fetchGalleryV3Shared();
    assert.deepEqual(guest, [], "the guest is shown nothing — never the departed member's trophies");
    assert.equal(sb.galleryReads, before, 'and no member read is made for a guest');
  });

  it('identityKey uses the house safeSessionResult and shares nothing on an unknown read', () => {
    const src = read('src/features/achievements/api.ts');
    const at = src.indexOf('async function identityKey(');
    const body = src.slice(at, src.indexOf('\n}', at));
    assert.match(body, /safeSessionResult\(supabase\.auth\.getSession\(\), 'achievements identity'\)/);
    assert.match(body, /if \(timedOut\) return null;/);
    assert.doesNotMatch(body, /withDeadline/);
  });
});

describe('H12-2 Career Finder hub: an unreadable record is not a fresh start (K2)', () => {
  const src = read('src/screens/careerfinder/CareerFinderScreen.tsx');
  const at = src.indexOf('label="START CAREER FINDER"');
  const branch = src.slice(at, src.indexOf('</View>', at));

  it('START does not promise "Progress is saved as you go" while the store cannot save', () => {
    assert.match(branch, /hint=\{saving \? `Begins the \$\{QUESTION_COUNT\} questions\. Progress is saved as you go\.` : /);
  });

  it('the note says the saved answers could not be read, instead of the trust line', () => {
    // 2026-10-04 (guestCareer, on the house store): answers given while the
    // record is unreadable are QUEUED and written if a later read succeeds,
    // so "will not be saved" became the present-tense truth.
    assert.match(branch, /\{saving \? \(upsell \? FINDER_INTRO\.trust : 'Your answers stay on this phone\.'\) : 'Your saved answers could not be read on this phone, so answers you give now are not being saved\.'\}/);
  });
});

describe('H12-3 Pro Registry: a failed name read is not "Add your Registry name" (K2)', () => {
  const src = read('src/screens/directory/DirectoryScreen.tsx');

  it('an empty name is checked with the strict (throwing) read before it is called missing', () => {
    assert.match(src, /import \{ fetchMyQrToken, fetchMyRegistryName \} from '\.\.\/\.\.\/features\/profile\/api';/);
    // Hunt 13 keeps the strict read and also shows a name it returns.
    assert.match(src, /if \(name \|\| !accountConfirmed\) return;\s*\n\s*try \{[\s\S]*?await fetchMyRegistryName\(\);[\s\S]*?\} catch \{\s*\n\s*if \(alive\) setNameUnread\(true\);/);
  });

  it('the tile says it could not load the name, and only a genuine none asks to add one', () => {
    assert.match(src, /\{registryName \|\|\s*\n\s*\(nameUnread\s*\n\s*\? 'Couldn’t load your Registry name — check your connection\.'\s*\n\s*: 'Add your Registry name — tap SET UP MY PROFILE below'\)\}/);
  });

  it("an older account state's answer lands nowhere", () => {
    assert.match(src, /\.then\(async \(p\) => \{\s*\n\s*if \(!alive\) return;/);
  });
});
