/**
 * MUST-DO R1 + H2 (owner GO 2026-10-27) — instructor/school accounts (app
 * half) and the student's "Allow my instructor to see my progress" switch.
 *
 * Pinned against the LIVE server (definitions read with SELECT only,
 * 2026-10-27, project yjgolswjggmlpeowvtxr):
 *   my_verifier_kind() → text: employer_profiles.kind of directory_me() where
 *       revoked_at is null, else null. authenticated only.
 *   contact_threads().other_kind → ep.kind ('employer' | 'instructor') or 'member'.
 *   employer_application_mine / employer_pending_list / employer_active_list
 *       → `kind` as the last column.
 *   employer_profiles_set_kind() → a TRIGGER (not an RPC).
 *   instructor_share_lookup(p_code) → (instructor_name, school)
 *   instructor_share_on(p_code) → (instructor_name, school, granted_at,
 *       instructor_active); raises 'please sign in first' |
 *       'that instructor code is not right' | 'that is your own instructor code'
 *   instructor_share_off() → boolean
 *   instructor_share_mine() → same 4 columns; no row = off
 *   instructor_my_code() → text (null unless an active instructor)
 *
 * The api modules run for real on a stubbed Supabase client; the screens load
 * React Native, so they are pinned by source text in the house style.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it, beforeEach } from 'node:test';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

type Rpc = { name: string; args: unknown };
type Ctl = {
  session: unknown;
  sessionHangs: boolean;
  rpcs: Rpc[];
  answer: (name: string, args: unknown) => { data: unknown; error: { message: string } | null };
};
const ctl = (): Ctl => g.__IAS__;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  const C = () => globalThis.__IAS__;
  export const supabase = {
    auth: {
      getSession() {
        if (C().sessionHangs) return Promise.reject(new Error('stalled'));
        return Promise.resolve({ data: { session: C().session }, error: null });
      },
    },
    async rpc(name, args) { C().rpcs.push({ name, args }); return C().answer(name, args); },
  };`);
registerHooks({
  resolve(specifier, context, next) {
    if (/(^|\/)lib\/supabase$/.test(specifier)) return { url: SUPABASE, shortCircuit: true };
    if (/(^|\/)storage\/localStoreRegistry$/.test(specifier)) {
      return next(specifier + '.ts', context);
    }
    if (/^\.\.?\/.*(boundedCall|rules|getSessionSafe)$/.test(specifier)) return next(specifier + '.ts', context);
    return next(specifier, context);
  },
});

const ACCOUNT = { user: { id: 'auth-1', is_anonymous: false } };
function reset(over: Partial<Ctl> = {}) {
  g.__IAS__ = {
    session: ACCOUNT,
    sessionHangs: false,
    rpcs: [],
    answer: () => ({ data: null, error: null }),
    ...over,
  } satisfies Ctl;
}
reset();

const kinds = await import('../src/features/employer/verifierKind.ts');
const employer = await import('../src/features/employer/api.ts');
const directory = await import('../src/features/directory/api.ts');
const share = await import('../src/features/instructor/api.ts');
const rules = await import('../src/features/instructor/shareRules.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// ── R1: the kind ─────────────────────────────────────────────────────────────

describe('R1 · the contact kind is carried through, never flattened to member', () => {
  it('contactKindOf keeps employer and instructor; anything else is a plain member', () => {
    assert.equal(kinds.contactKindOf('employer'), 'employer');
    assert.equal(kinds.contactKindOf('instructor'), 'instructor');
    assert.equal(kinds.contactKindOf('member'), 'member');
    // An unknown or missing kind must never earn a badge.
    assert.equal(kinds.contactKindOf('school'), 'member');
    assert.equal(kinds.contactKindOf(undefined), 'member');
    assert.equal(kinds.contactKindOf(null), 'member');
  });

  it('a verifier row of an unknown kind keeps the employer wording (the column default)', () => {
    assert.equal(kinds.verifierKindOf('instructor'), 'instructor');
    assert.equal(kinds.verifierKindOf('employer'), 'employer');
    assert.equal(kinds.verifierKindOf('something-new'), 'employer');
  });

  it('each kind has its own badge', () => {
    assert.equal(kinds.VERIFIER_COPY.employer.badge, 'VERIFIED EMPLOYER');
    assert.equal(kinds.VERIFIER_COPY.instructor.badge, 'VERIFIED INSTRUCTOR');
    assert.equal(kinds.VERIFIER_COPY.instructor.accountHead, 'INSTRUCTOR ACCOUNT');
    assert.match(kinds.VERIFIER_COPY.instructor.badgeA11y, /^Verified instructor\./);
  });

  it('fetchContactThreads maps other_kind through (instructor stays instructor)', async () => {
    const row = (k: unknown) => ({
      id: 'r', direction: 'incoming', other_display_name: 'Miramar College', other_token: null,
      purpose_label: 'Work', message: 'hi', status: 'pending', created_at: '2026-10-27T00:00:00Z',
      responded_at: null, unread_hint: 0, other_kind: k, other_verified: k !== 'member', other_website: 'https://x.edu',
    });
    reset({ answer: () => ({ data: [row('instructor'), row('employer'), row('member'), row('school')], error: null }) });
    const res = await directory.fetchContactThreads();
    assert.ok(res.ok);
    assert.deepEqual(
      res.rows.map((r) => r.otherKind),
      ['instructor', 'employer', 'member', 'member'],
    );
    assert.equal(res.rows[0].otherVerified, true);
    assert.deepEqual(ctl().rpcs.map((r) => r.name), ['contact_threads']);
  });

  it('the old flattening is gone from the source', () => {
    assert.doesNotMatch(read('src/features/directory/api.ts'), /other_kind === 'employer' \? 'employer' : 'member'/);
    assert.match(read('src/features/directory/api.ts'), /otherKind: contactKindOf\(r\.other_kind\)/);
  });

  it('the thread header badges a verified instructor with its own words', () => {
    const s = code('src/screens/directory/RequestsView.tsx');
    assert.match(s, /const verifier = t\.otherKind === 'member' \? null : VERIFIER_COPY\[t\.otherKind\];/);
    assert.match(s, /\{verifier && t\.otherVerified \? \(/);
    assert.match(s, /<Text style=\{st\.verifiedTagText\}>\{verifier\.badge\}<\/Text>/);
    assert.doesNotMatch(s, />VERIFIED EMPLOYER</);
  });
});

describe('R1 · "am I verified" asks my_verifier_kind', () => {
  beforeEach(() => reset());

  it('calls my_verifier_kind and returns the kind', async () => {
    reset({ answer: (n) => ({ data: n === 'my_verifier_kind' ? 'instructor' : null, error: null }) });
    assert.equal(await employer.myVerifierKind(), 'instructor');
    assert.deepEqual(ctl().rpcs.map((r) => r.name), ['my_verifier_kind']);
  });

  it('null is "none"; a failed read or a stalled session is "unknown", never "none"', async () => {
    reset({ answer: () => ({ data: null, error: null }) });
    assert.equal(await employer.myVerifierKind(), 'none');
    reset({ answer: () => ({ data: null, error: { message: 'Failed to fetch' } }) });
    assert.equal(await employer.myVerifierKind(), 'unknown');
    reset({ sessionHangs: true });
    assert.equal(await employer.myVerifierKind(), 'unknown');
    assert.deepEqual(ctl().rpcs, []);
  });

  it('no session is "none" without asking the server', async () => {
    reset({ session: null });
    assert.equal(await employer.myVerifierKind(), 'none');
    assert.deepEqual(ctl().rpcs, []);
  });

  it('the application and both admin lists carry the kind', async () => {
    reset({
      answer: (n) => ({
        data:
          n === 'employer_application_mine'
            ? [{ id: 'a', status: 'pending', company_name: 'Miramar', checks: {}, created_at: 'x', kind: 'instructor' }]
            : n === 'employer_pending_list'
              ? [{ id: 'p', kind: 'instructor', queue_reasons: [] }, { id: 'q', kind: 'employer', queue_reasons: [] }]
              : [{ user_id: 'u', kind: 'instructor' }],
        error: null,
      }),
    });
    const mine = await employer.fetchMyEmployerApplication();
    assert.equal(mine.state === 'have' && mine.application.kind, 'instructor');
    assert.deepEqual((await employer.fetchPendingApplications())?.map((a) => a.kind), ['instructor', 'employer']);
    assert.deepEqual((await employer.fetchActiveEmployers())?.map((a) => a.kind), ['instructor']);
  });

  it('Profile asks myVerifierKind and words the section by kind', () => {
    const s = code('src/screens/profile/EmployerSection.tsx');
    assert.match(s, /myVerifierKind\(\)/);
    assert.doesNotMatch(s, /amIVerifiedEmployer/);
    assert.match(s, /const isVerified = who === 'unknown' \? null : who !== 'none';/);
    assert.match(s, /VERIFIER_COPY\[verifierKind \?\? app\?\.kind \?\? 'employer'\]/);
    assert.match(s, /\{copy\.accountHead\}/);
    // The instructor's code row is for instructors only.
    assert.match(s, /\{verified && verifierKind === 'instructor' \? <InstructorCodeRow \/> : null\}/);
  });

  it('the admin lists show the kind (the admin does not pick it: the server sets it)', () => {
    const s = code('src/screens/admin/EmployerAdminScreen.tsx');
    assert.match(s, /\{VERIFIER_COPY\[a\.kind\]\.adminTag\}/);
    assert.match(s, /\{VERIFIER_COPY\[e\.kind\]\.adminTag\}/);
  });

  // Owner 2026-10-27: "anyone can verify" — public_verify_credentials(p_code) is
  // anon-executable and not gated by show_in_registry (checked live).
  it('copy: anyone can verify by the printed code; the Registry is for being found', () => {
    for (const f of ['src/lib/copy.ts', 'src/screens/about/AboutHomeSheet.tsx']) {
      assert.match(read(f), /nyone can verify (them|your credentials) online with the code printed on them/);
      assert.doesNotMatch(code(f), /Pro Registry and employers and instructors can verify/);
    }
  });

  it('H2: sharing needs a certificate name first (owner 2026-10-27)', () => {
    const s = code('src/screens/profile/InstructorShareSection.tsx');
    assert.match(s, /name = await fetchMyRegistryName\(\)/);
    assert.match(s, /if \(!name\) \{\s*notify\(SHARE_COPY\.nameFirstTitle, SHARE_COPY\.nameFirstBody\);\s*return;\s*\}\s*openPopup\(\);/);
    // A failed read is not "no name": it says it couldn't check, and opens nothing.
    assert.match(s, /catch \{\s*notify\(SHARE_COPY\.notConfirmedTitle, SHARE_COPY\.readFailed\);\s*return;\s*\}/);
  });
});

describe('R1 · the instructor code', () => {
  it('instructor_my_code: a code, null for everyone else, "error" on a failed read', async () => {
    reset({ answer: () => ({ data: 'ABCD2345', error: null }) });
    assert.equal(await share.fetchMyInstructorCode(), 'ABCD2345');
    assert.deepEqual(ctl().rpcs.map((r) => r.name), ['instructor_my_code']);
    reset({ answer: () => ({ data: null, error: null }) });
    assert.equal(await share.fetchMyInstructorCode(), null);
    reset({ answer: () => ({ data: null, error: { message: 'x' } }) });
    assert.equal(await share.fetchMyInstructorCode(), 'error');
  });
});

// ── H2: the student's switch ─────────────────────────────────────────────────

describe('H2 · the share flow calls the right functions', () => {
  beforeEach(() => reset());

  it('the current state is instructor_share_mine: no row = off, a row = on', async () => {
    reset({ answer: () => ({ data: [], error: null }) });
    assert.deepEqual(await share.fetchMyInstructorShare(), { state: 'off' });
    reset({
      answer: () => ({
        data: [{ instructor_name: 'Ina S', school: 'Miramar College', granted_at: '2026-10-27T10:00:00Z', instructor_active: true }],
        error: null,
      }),
    });
    const on = await share.fetchMyInstructorShare();
    assert.equal(on.state, 'on');
    assert.deepEqual(on.state === 'on' && on.share, {
      instructorName: 'Ina S', school: 'Miramar College', grantedAt: '2026-10-27T10:00:00Z', instructorActive: true,
    });
    assert.deepEqual(ctl().rpcs.map((r) => r.name), ['instructor_share_mine']);
  });

  it('a failed read is "error", never "off"', async () => {
    reset({ answer: () => ({ data: null, error: { message: 'Failed to fetch' } }) });
    assert.deepEqual(await share.fetchMyInstructorShare(), { state: 'error' });
    reset({ sessionHangs: true });
    assert.deepEqual(await share.fetchMyInstructorShare(), { state: 'error' });
    assert.deepEqual(ctl().rpcs, []);
  });

  it('a guest (no session, or an anonymous device key) is "guest" and the server is never asked', async () => {
    for (const session of [null, { user: { id: 'anon', is_anonymous: true } }]) {
      reset({ session });
      assert.deepEqual(await share.fetchMyInstructorShare(), { state: 'guest' });
      const on = await share.shareWithInstructor('ABCD2345');
      assert.equal(on.ok, false);
      assert.equal(!on.ok && on.error, rules.SHARE_COPY.needsAccount);
      assert.deepEqual(ctl().rpcs, []);
    }
  });

  it('lookup shows WHO before anything is shared (instructor_share_lookup, p_code)', async () => {
    reset({ answer: () => ({ data: [{ instructor_name: 'Ina S', school: 'Miramar College' }], error: null }) });
    assert.deepEqual(await share.lookupInstructor('abcd-2345'), { ok: true, instructorName: 'Ina S', school: 'Miramar College' });
    assert.deepEqual(ctl().rpcs, [{ name: 'instructor_share_lookup', args: { p_code: 'abcd-2345' } }]);
    reset({ answer: () => ({ data: [], error: null }) });
    assert.deepEqual(await share.lookupInstructor('ZZZZ9999'), { ok: false, error: rules.SHARE_COPY.codeWrong });
  });

  it('turning on is instructor_share_on(p_code), and "on" comes only from its row', async () => {
    reset({
      answer: () => ({
        data: [{ instructor_name: 'Ina S', school: null, granted_at: '2026-10-27T10:00:00Z', instructor_active: true }],
        error: null,
      }),
    });
    const r = await share.shareWithInstructor('ABCD2345');
    assert.ok(r.ok);
    assert.equal(r.ok && r.share.instructorName, 'Ina S');
    assert.deepEqual(ctl().rpcs, [{ name: 'instructor_share_on', args: { p_code: 'ABCD2345' } }]);
    // An empty answer is NOT a success.
    reset({ answer: () => ({ data: [], error: null }) });
    assert.equal((await share.shareWithInstructor('ABCD2345')).ok, false);
  });

  it("the server's refusals read in plain words", async () => {
    for (const [msg, copy] of [
      ['that instructor code is not right', rules.SHARE_COPY.codeWrong],
      ['that is your own instructor code', rules.SHARE_COPY.ownCode],
      ['please sign in first', rules.SHARE_COPY.needsAccount],
      ['Failed to fetch', rules.SHARE_COPY.notConfirmed],
    ] as const) {
      reset({ answer: () => ({ data: null, error: { message: msg } }) });
      assert.deepEqual(await share.shareWithInstructor('ABCD2345'), { ok: false, error: copy });
    }
  });

  it('turning off is instructor_share_off()', async () => {
    reset({ answer: () => ({ data: true, error: null }) });
    assert.deepEqual(await share.stopSharingWithInstructor(), { ok: true });
    assert.deepEqual(ctl().rpcs.map((r) => r.name), ['instructor_share_off']);
    reset({ answer: () => ({ data: null, error: { message: 'Failed to fetch' } }) });
    assert.equal((await share.stopSharingWithInstructor()).ok, false);
  });
});

describe('H2 · the words', () => {
  it('codes: letters and digits only, 8 long', () => {
    assert.equal(rules.cleanInstructorCode(' ab-cd 23_45 '), 'ABCD2345');
    assert.equal(rules.codeLooksRight('abcd-2345'), true);
    assert.equal(rules.codeLooksRight('abc'), false);
  });

  it('what the instructor sees matches the owner rulings and the server function', () => {
    const sees = rules.SHARE_COPY.sees.join(' ');
    // 2026-10-26: enrolled topics AND every completed topic, even before sharing.
    assert.match(sees, /enrolled in, have studied or have completed — including topics you completed before you turned this on/);
    // Study methods (flashcards included) and quiz attempts: count, score, date.
    assert.match(sees, /flashcards included/);
    assert.match(sees, /quiz attempts, practice ones too: how many, each score and the date/);
    // Labs scope (2026-10-26) + other labs listed apart.
    assert.match(sees, /certificates and the Audio Fundamentals labs, plus any other lab you finished/);
    assert.match(sees, /final exam attempts/);
    assert.match(sees, /certificates you have earned/);
    // person_label prefers registry_name; a certificate name is required before
    // sharing (owner 2026-10-27), so the email-derived fallback is never reached.
    assert.match(sees, /^Your name: the name on your certificates \(fill in “Name on your certificates” in Profile before you share\)\./);
    assert.doesNotMatch(sees, /before the @/);
    // Never answers; employers never.
    assert.match(rules.SHARE_COPY.never.join(' '), /Your answers to any question/);
    assert.equal(rules.SHARE_COPY.employersNever, 'Employers never see this.');
    assert.equal(rules.SHARE_COPY.switchLabel, 'Allow my instructor to see my progress');
  });

  it('the confirm line names the instructor and school', () => {
    assert.match(rules.confirmLine({ instructorName: 'Ina S', school: 'Miramar College' }), /^Share your progress with Ina S · Miramar College\?/);
    assert.match(
      rules.sharingSince({ instructorName: 'Ina S', school: null, grantedAt: '2026-10-27T10:00:00Z', instructorActive: true }),
      /^Sharing with Ina S since 27 Oct 2026\.$/,
    );
  });
});

describe('H2 · the Profile section uses the house helpers', () => {
  const s = code('src/screens/profile/InstructorShareSection.tsx');

  it('popup (DimModal), latched async buttons, confirmDialog/notify — never Alert.alert', () => {
    assert.match(read('src/screens/profile/InstructorShareSection.tsx'), /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
    assert.match(s, /const onFind = useLatchedPress\(/);
    assert.match(s, /const onShare = useLatchedPress\(/);
    assert.match(s, /const stop = useLatchedPress\(/);
    assert.match(s, /confirmDialog\(SHARE_COPY\.stopTitle/);
    assert.doesNotMatch(s, /Alert\.alert/);
  });

  it('the switch asserts nothing until the server answered', () => {
    assert.match(s, /on=\{share\?\.state === 'on'\}/);
    assert.match(s, /disabled=\{share === null \|\| share\.state === 'error'\}/);
    // A guest gets the account note, never a switch.
    assert.match(s, /share\?\.state === 'guest' \? \(\s*<Text style=\{styles\.warn\}>\{SHARE_COPY\.guest\}<\/Text>/);
  });

  it('turning on goes name check → code → lookup → confirm → on', () => {
    assert.match(s, /if \(share\?\.state === 'off' && next\) void startShare\(\);/);
    assert.match(s, /const r = await lookupInstructor\(code\);/);
    assert.match(s, /const r = await shareWithInstructor\(code\);/);
    assert.match(s, /setShare\(\{ state: 'on', share: r\.share \}\);/);
  });

  it('Profile mounts it right after WHO CAN SEE ME, and the guest Profile returns before it', () => {
    const p = read('src/screens/profile/ProfileScreen.tsx');
    const who = p.indexOf('title="WHO CAN SEE ME"');
    const mine = p.indexOf('<InstructorShareSection />');
    const work = p.indexOf('title="WHAT I WORK IN"');
    assert.ok(who > 0 && who < mine && mine < work);
    assert.ok(p.indexOf('if (registryGuest) {') < mine);
  });
});

describe('R1 + H2 · the server-only allow-list shrank', () => {
  const allow = (JSON.parse(read('docs/live/SERVER_ONLY_ALLOWLIST.json')) as { allow: Record<string, string> }).allow;
  it('every function the app now calls has left it', () => {
    for (const f of [
      'my_verifier_kind',
      'instructor_share_lookup',
      'instructor_share_on',
      'instructor_share_off',
      'instructor_share_mine',
      'instructor_my_code',
    ]) {
      assert.ok(!(f in allow), `${f} is called by the app now`);
    }
  });
  it('employer_profiles_set_kind is explained as the trigger it is', () => {
    assert.match(allow.employer_profiles_set_kind, /^server-internal: trigger employer_profiles\./);
  });
});
