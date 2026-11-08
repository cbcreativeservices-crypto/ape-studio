/**
 * Bug pass 2026-11-08, pass 1, group "directory" (Audio Community screens and
 * src/features/directory). One block per bug ID; see
 * scratchpad/bugpass/FIX_P1_directory.md for the write-up.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  sampleDeleteProfile,
  sampleDirectoryOn,
  sampleMyProfile,
  samplePublish,
  sampleSaveProfile,
  sampleSetSwitch,
  setSampleDirectory,
} from '../src/features/directory/sampleThreads.ts';
import { FORUM_SAMPLE_STATES, setSampleFlags, setSampleForum } from '../src/features/forum/sampleSwitch.ts';
import {
  currentKey,
  keyStale,
  leaveDecision,
  mergeUnsaved,
  noteLeaveSave,
  profileSaveChain,
  stashUnsaved,
  takeUnsaved,
} from '../src/features/directory/profileLeave.ts';
import { reportDetail, requestsLeftLine } from '../src/features/directory/rules.ts';
import { chipNoun, memberCardA11y } from '../src/features/directory/kinds.ts';
import type { CommunityProfile } from '../src/features/directory/api.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Source with comments blanked, so a comment can never satisfy a check. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

const API = 'src/features/directory/api.ts';
const MY = 'src/screens/directory/MyProfileView.tsx';
const HOST = 'src/screens/directory/AudioCommunityDirectoryScreen.tsx';

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

/** The body of `export async function name(` up to its first `try {`. */
function head(src: string, name: string): string {
  const at = src.indexOf(`export async function ${name}(`);
  assert.ok(at >= 0, `${name} not found`);
  return src.slice(at, src.indexOf('try {', at));
}

describe('UI code-read: the directory sample never writes to the live database', () => {
  it('the forum sample turns the directory sample on too (a dev build only)', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    try {
      setSampleDirectory(false);
      assert.equal(sampleDirectoryOn(), false);
      setSampleForum(FORUM_SAMPLE_STATES[0]);
      assert.equal(sampleDirectoryOn(), true, 'MY PROFILE / REQUESTS / the member sheet were live under the forum sample');
      setSampleForum(null);
      assert.equal(sampleDirectoryOn(), false);
    } finally {
      setSampleForum(null);
      delete (globalThis as { __DEV__?: boolean }).__DEV__;
    }
    setSampleForum(FORUM_SAMPLE_STATES[0]);
    assert.equal(sampleDirectoryOn(), false, 'never on outside __DEV__');
    setSampleForum(null);
  });

  it('every member-sheet and MY PROFILE call answers from the sample first', () => {
    const api = read(API);
    for (const fn of [
      'sendContactRequest',
      'blockMember',
      'fetchMyCommunityProfile',
      'saveCommunityProfile',
      'setFeaturedCredentials',
      'publishCommunityProfile',
      'setDiscoverable',
      'setContactEnabled',
      'deleteCommunityProfile',
    ]) {
      assert.match(head(api, fn), /if \(sampleDirectoryOn\(\)\) return sample\w+\(/, `${fn} reaches the server in the sample`);
    }
  });

  it('the sample profile saves in memory, walks to published, and resets', () => {
    setSampleDirectory(true);
    assert.deepEqual(sampleMyProfile(), { status: 'none' });
    sampleSaveProfile({ ...EMPTY, displayName: '  Alex P. ', areas: ['live'], primaryArea: 'live', roles: ['working'], published: true });
    const saved = sampleMyProfile();
    assert.equal(saved.status, 'ok');
    if (saved.status !== 'ok') return;
    assert.equal(saved.profile.displayName, 'Alex P.');
    assert.equal(saved.profile.published, false, 'a save never flips a switch');
    assert.equal(samplePublish(true, true).ok, true);
    sampleSetSwitch('discoverable', true);
    const pub = sampleMyProfile();
    assert.ok(pub.status === 'ok' && pub.profile.published && pub.profile.discoverable && pub.profile.adultConfirmed);
    sampleDeleteProfile();
    assert.deepEqual(sampleMyProfile(), { status: 'none' });
    sampleSaveProfile({ ...EMPTY, displayName: 'X' });
    setSampleDirectory(false);
    assert.deepEqual(sampleMyProfile(), { status: 'none' }, 'closing the sample drops it');
  });

  it('publishing an unfinished sample profile is refused, as the server would', () => {
    setSampleDirectory(true);
    assert.equal(samplePublish(true, true).ok, false);
    setSampleDirectory(false);
  });
});

describe('CODE-1-04: MY PROFILE shares one save queue, and the mount read waits behind it', () => {
  const my = code(MY);
  it('the queue is the module one, not a per-instance ref', () => {
    assert.match(my, /const saveChain = profileSaveChain;/);
    assert.doesNotMatch(my, /const saveChain = useRef/);
  });
  it('the first read runs after any save still out', () => {
    assert.match(my, /saveChain\.current\.then\(\(\) => fetchMyCommunityProfile\(\)\)/);
  });
  it('a leave flush queued by one visit is awaited by the next', async () => {
    const order: string[] = [];
    profileSaveChain.current = profileSaveChain.current.then(async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push('flush');
    });
    await profileSaveChain.current.then(() => order.push('read'));
    assert.deepEqual(order, ['flush', 'read']);
  });
});

describe('CODE-1-11: a refused save on the way out keeps the words and says why', () => {
  const edit: CommunityProfile = { ...EMPTY, displayName: 'Alex', about: 'mail me at alex@studio.com' };
  it('an About the rules refuse is never sent', () => {
    const d = leaveDecision(edit);
    assert.equal(d.send, false);
    assert.match(d.send ? '' : d.error, /not saved\. Remove the email address\. Your words are still here\./);
    assert.deepEqual(leaveDecision({ ...edit, about: 'FOH engineer, theatre.' }), { send: true });
  });
  it('a refused flush is kept for the next visit, for this account only', () => {
    noteLeaveSave(edit, { ok: false, error: 'Remove any email address.' }, { wipe: 3, gen: 0 });
    assert.equal(takeUnsaved({ wipe: 4, gen: 0 }), null, 'another account never gets it');
    noteLeaveSave(edit, { ok: false, error: 'No connection. Try again.' }, { wipe: 3, gen: 0 });
    const back = takeUnsaved({ wipe: 3, gen: 0 });
    assert.equal(back?.profile, edit);
    assert.match(back?.error ?? '', /No connection/);
    assert.equal(takeUnsaved({ wipe: 3, gen: 0 }), null, 'taken once');
  });
  it('a later save clears it', () => {
    stashUnsaved(edit, 'x', { wipe: 1, gen: 0 });
    noteLeaveSave(edit, { ok: true }, { wipe: 1, gen: 0 });
    assert.equal(takeUnsaved({ wipe: 1, gen: 0 }), null);
  });
  it('the kept words lay over the server switches, not the other way round', () => {
    const loaded = { ...EMPTY, published: true, discoverable: true, publicToken: 't', about: 'old' };
    const m = mergeUnsaved(loaded, { ...edit, published: false });
    assert.equal(m.about, edit.about);
    assert.equal(m.published, true);
    assert.equal(m.publicToken, 't');
  });
  it('the view runs the decision, notes the answer, and puts the words back on mount', () => {
    const my = code(MY);
    const flush = my.slice(my.indexOf('const go = leaveDecision(latest);'));
    assert.ok(my.includes('const go = leaveDecision(latest);'));
    assert.match(flush, /stashUnsaved\(latest, go\.error, key\);\s*return;/);
    assert.match(flush, /\.then\(\(\) => \(stale\(\) \? undefined : saveCommunityProfile\(latest\)\)\)\s*\.then\(\(r\) => noteLeaveSave\(latest, r, key\)\)/);
    assert.match(my, /hydrated\.current = true;\s*const left = takeUnsaved\(mountKey\(\)\);/);
    assert.match(my, /setErr\(left\.error\);/);
  });
});

describe('CODE-1-12: the publish consent and the preview cover every published field', () => {
  const my = read(MY);
  it('the consent names them all', () => {
    const consent = my.match(/export const PUBLISH_CONSENT =\s*'([^']+)'/)?.[1] ?? '';
    for (const w of ['display name', 'areas', 'specialties', 'How I’m Involved', 'Open To', 'About My Work', 'country', 'region', 'languages', 'way of working', 'credentials you chose']) {
      assert.ok(consent.includes(w), `consent leaves out ${w}`);
    }
    assert.match(code(MY), /'Publish your community profile\?',\s*PUBLISH_CONSENT,/);
  });
  it('the preview draws the meta line (country, region, languages, how you work) and OPEN TO', () => {
    const sheet = code(MY).slice(code(MY).indexOf('function PreviewSheet('));
    assert.match(sheet, /previewMeta\(p, label\)/);
    assert.match(sheet, /<Eyebrow>OPEN TO<\/Eyebrow>/);
    const meta = code(MY).slice(code(MY).indexOf('export function previewMeta('), code(MY).indexOf('function PreviewSheet('));
    for (const f of ['p.countryCode', 'p.region', 'p.languages', 'workPrefLabel(p.workPref)']) assert.ok(meta.includes(f), f);
  });
});

describe('CODE-1-13: the setup review never calls a required field optional', () => {
  const flow = code('src/screens/directory/ProfileSetupFlow.tsx');
  it('Areas, How you’re involved and Shown as are marked required', () => {
    assert.match(flow, /<Summary title="Areas" required /);
    assert.match(flow, /<Summary title="How you’re involved" required /);
    assert.match(flow, /<Summary title="Shown as" required /);
    assert.match(flow, /<Summary title="Open to" values=/);
  });
  it('an empty required row says it is needed, with no em dash', () => {
    assert.doesNotMatch(flow, /Not set — optional/);
    assert.match(flow, /return required \? 'Not set yet\. Needed to publish\.' : 'Not set yet\. Optional\.';/);
  });
});

describe('CODE-1-10: Pro Registry SET UP MY PROFILE opens Profile, where the Registry name lives', () => {
  it('no longer lands on the community DIRECTORY search', () => {
    const src = code('src/screens/directory/DirectoryScreen.tsx');
    assert.match(src, /onPress=\{\(\) => \(navigation as any\)\.popTo\('Main', \{ screen: 'Profile' \}\)\}/);
    assert.doesNotMatch(src, /navigate\('AudioCommunityDirectory'\)/);
  });
});

describe('CODE-1-18: a member alert tap closes an open member sheet first', () => {
  it('the params effect clears the sheet before it switches tab', () => {
    const host = code(HOST);
    const fx = host.slice(host.indexOf('const lastParams = useRef(params);'), host.indexOf('}, [params]);'));
    const clear = fx.indexOf('if (wanted || next.thread) setMemberToken(null);');
    assert.ok(clear > 0, 'the member sheet stays up over REQUESTS');
    assert.ok(clear < fx.indexOf('if (wanted) setTab(wanted);'));
  });
});

describe('CODE-1-28: a report starts clean and its detail is trimmed', () => {
  it('reportDetail trims, and spaces-only is nothing', () => {
    assert.equal(reportDetail('  he keeps messaging  '), 'he keeps messaging');
    assert.equal(reportDetail('   '), null);
    assert.equal(reportDetail(undefined), null);
    assert.match(code(API), /p_detail: reportDetail\(input\.detail\),/);
  });
  it('the member-sheet report box clears after a report went through', () => {
    const sheet = code(HOST).slice(code(HOST).indexOf('function ReportSheet('));
    assert.match(sheet, /useEffect\(\(\) => \{\s*if \(sentCount === 0\) return;\s*setDetail\(''\);\s*setReason\('spam'\);\s*\}, \[sentCount\]\);/);
    const member = code(HOST).slice(code(HOST).indexOf('function MemberSheet('), code(HOST).indexOf('function ContactSheet('));
    assert.match(member, /setReported\(b\?\.ok \? 'blocked' : 'reported'\);\s*setReportsSent\(\(n\) => n \+ 1\);/);
    assert.match(member, /sentCount=\{reportsSent\}/);
  });
});

describe('CODE-1-29: the contact allowance line describes a rolling window', () => {
  it('never "this week"', () => {
    for (const n of [0, 1, 3]) assert.doesNotMatch(requestsLeftLine(n), /this week/i);
    assert.equal(requestsLeftLine(1), '1 contact request left for now. Each one frees up 7 days after you send it.');
    assert.match(requestsLeftLine(0), /^No contact requests left for now\./);
    assert.doesNotMatch(code(HOST), /left this week/);
    assert.match(code(HOST), /requestsLeftLine\(allow\.requestsLeftThisWeek\)/);
  });
});

describe('CODE-1-30: a kind chip counts its own noun', () => {
  it('chipNoun', () => {
    assert.equal(chipNoun('employer', 45), 'employers');
    assert.equal(chipNoun('company', 2), 'companies');
    assert.equal(chipNoun('institution', 1), 'institution');
    assert.equal(chipNoun('all', 3), 'members');
  });
  it('the "Showing N of M" line uses it', () => {
    const v = code('src/screens/directory/ExploreView.tsx');
    assert.match(v, /`Showing \$\{visibleRows\.length\} of \$\{visibleTotal\} \$\{chipNoun\(chip, visibleTotal\)\}`/);
    assert.doesNotMatch(v, /chip === 'graduates' \? 'graduates' : 'members'/);
  });
});

describe('UI-1-17: member card screen-reader labels', () => {
  it('no double full stop after an initial, and a singular credential', () => {
    const label = memberCardA11y({
      displayName: 'Aiko K.',
      plate: 'GRADUATE',
      primaryArea: 'Broadcast',
      roles: [],
      credentialCount: 1,
      contactEnabled: true,
    });
    assert.equal(label, 'Aiko K. GRADUATE. Broadcast. 1 verified credential. open to contact');
    assert.match(memberCardA11y({ displayName: 'Maya', plate: null, primaryArea: null, roles: ['A', 'B'], credentialCount: 2, contactEnabled: false }), /^Maya\. A, B\. 2 verified credentials$/);
    assert.match(code('src/screens/directory/ExploreView.tsx'), /accessibilityLabel=\{memberCardA11y\(\{/);
  });
});

describe('CODE-1-27: a failed re-read for a tapped alert hands the link back', () => {
  const v = code('src/screens/directory/RequestsView.tsx');
  it('a failed read is counted, and the count consumes a waiting link', () => {
    assert.match(v, /setLoadErr\(r\.error\);\s*setLoadFails\(\(n\) => n \+ 1\);\s*return;/);
    const fx = v.slice(v.indexOf('const seenFails = useRef(0);'));
    assert.match(fx, /if \(threads === null \|\| !openThreadId \|\| freshFor\.current !== openThreadId\) return;\s*freshFor\.current = null;\s*onOpenedRef\.current\?\.\(\);\s*\}, \[loadFails, threads, openThreadId\]\);/);
  });
  it('the stale-list banner has a way to try again', () => {
    assert.match(v, /Showing the last list that loaded\.`\}<\/Banner>[\s{}]*<RetryOrSignIn message=\{loadErr\} onRetry=\{\(\) => void load\(\)\} \/>/);
  });
});

describe('CODE-1-31: a known guest is not offered RETRY on Recent graduates', () => {
  it('the strip draws nothing where the list says SIGN IN', () => {
    const v = code('src/screens/directory/DirectoryChips.tsx');
    const skip = v.indexOf("if (state.face === 'failed' && needsSignIn(guest, state.error)) return null;");
    assert.ok(skip > 0);
    assert.ok(skip < v.indexOf('accessibilityLabel="Retry recent graduates"'));
  });
});

describe('CODE-1-24: an action that threw does not talk about changes on the screen', () => {
  it('accept / decline / block / report say it did not go through', () => {
    const api = read(API);
    for (const fn of ['respondToRequest', 'blockThread', 'blockMember', 'reportMember']) {
      const at = api.indexOf(`export async function ${fn}(`);
      const body = api.slice(at, api.indexOf('\n}\n', at));
      assert.match(body, /return \{ ok: false, error: ACTION_FAILED \};/, fn);
      assert.doesNotMatch(body, /still on this screen/, fn);
    }
    assert.match(api, /export const ACTION_FAILED = 'Something went wrong, so that didn’t go through\. Try again\.';/);
  });
});

/* ── P1 check follow-up (CHECK_P1_directory.md) ─────────────────────────── */

const DEV = (on: boolean) => {
  if (on) (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  else delete (globalThis as { __DEV__?: boolean }).__DEV__;
};

describe('Hole 1: a save queued in the sample never runs live after the sample turns off', () => {
  const edit: CommunityProfile = { ...EMPTY, displayName: 'Sample person', about: 'typed, not blurred' };

  /** The view's flush, step for step: queued behind the one chain, fenced by the mount key. */
  function queueFlush(key: ReturnType<typeof currentKey>, save: () => Promise<{ ok: true }>) {
    profileSaveChain.current = profileSaveChain.current
      .then(() => (keyStale(key) ? undefined : save()))
      .then((r) => noteLeaveSave(edit, r, key))
      .catch(() => {});
  }

  for (const how of ['directory sample', 'forum sample'] as const) {
    it(`${how}: the directory unmount switches it off in the same commit; the flush is dropped`, async () => {
      DEV(true);
      try {
        if (how === 'directory sample') setSampleDirectory(true);
        else setSampleForum(FORUM_SAMPLE_STATES[0]);
        const key = currentKey(); // MyProfileView mounts in the sample
        let sent = 0;
        queueFlush(key, async () => {
          sent += 1;
          return { ok: true };
        });
        // AudioCommunityDirectoryScreen's unmount, synchronously, before the
        // queued save gets its microtask.
        setSampleDirectory(false);
        setSampleForum(null);
        const liveAtSend = !sampleDirectoryOn();
        await profileSaveChain.current;
        assert.equal(liveAtSend, true, 'at send time the api would have gone live');
        assert.equal(sent, 0, 'the sample profile reached the live community_profile_save');
      } finally {
        setSampleDirectory(false);
        setSampleForum(null);
        DEV(false);
      }
    });
  }

  it('a LIVE visit is not fenced by the same unmount (the switches were already off)', async () => {
    DEV(true);
    try {
      const key = currentKey();
      let sent = 0;
      queueFlush(key, async () => {
        sent += 1;
        return { ok: true };
      });
      setSampleDirectory(false);
      setSampleForum(null);
      await profileSaveChain.current;
      assert.equal(sent, 1, 'a real edit made on the way out must still be saved');
    } finally {
      DEV(false);
    }
  });

  it('a forum flag change inside one sample visit is not a change of world', () => {
    DEV(true);
    try {
      setSampleForum(FORUM_SAMPLE_STATES[0]);
      const key = currentKey();
      setSampleFlags({ welcomeSeen: true });
      assert.equal(keyStale(key), false);
    } finally {
      setSampleForum(null);
      DEV(false);
    }
  });

  it('MyProfileView fences every queued write with the mount key, featured included', () => {
    const my = code(MY);
    assert.match(my, /const sampleGenAtMount = useRef\(sampleGen\(\)\);/);
    assert.match(my, /const stale = \(\) => keyStale\(mountKey\(\)\);/);
    assert.match(my, /const setFeaturedCredentials = \(ids: string\[\]\) =>\s*stale\(\) \? Promise\.resolve\(null\) : sendFeaturedCredentials\(ids\);/);
    assert.match(my, /\.then\(\(\) => setFeaturedCredentials\(ids\)\)\s*\.then\(\(r\) => \{\s*if \(!r\) return;/);
    assert.match(my, /setFeaturedCredentials as sendFeaturedCredentials,/);
  });
});

describe('Hole 2: kept words never cross between the sample and the live profile', () => {
  const words: CommunityProfile = { ...EMPTY, displayName: 'Sample person', about: 'mail me at x@y.com' };
  it('sample words are gone once the sample closes', () => {
    DEV(true);
    try {
      setSampleDirectory(true);
      stashUnsaved(words, 'refused', currentKey());
      setSampleDirectory(false);
      assert.equal(takeUnsaved(currentKey()), null, 'sample words landed on the real profile');
    } finally {
      setSampleDirectory(false);
      DEV(false);
    }
  });
  it('real words do not show up in the sample, by either switch', () => {
    DEV(true);
    try {
      stashUnsaved(words, 'refused', currentKey());
      setSampleForum(FORUM_SAMPLE_STATES[0]);
      assert.equal(takeUnsaved(currentKey()), null);
      setSampleForum(null);
      stashUnsaved(words, 'refused', currentKey());
      setSampleDirectory(true);
      assert.equal(takeUnsaved(currentKey()), null);
    } finally {
      setSampleDirectory(false);
      setSampleForum(null);
      DEV(false);
    }
  });
  it('the same world still gets its words back', () => {
    stashUnsaved(words, 'refused', currentKey());
    assert.equal(takeUnsaved(currentKey())?.profile, words);
  });
});

describe('P1 check (low): featured-credential writes share the one queue', () => {
  it('featuredChain is the module queue the mount read waits behind', () => {
    const my = code(MY);
    assert.match(my, /const featuredChain = profileSaveChain;/);
    assert.doesNotMatch(my, /const featuredChain = useRef/);
  });
});

describe('P1 check (low): the member sheet composer and report box are per member', () => {
  it('ContactSheet and ReportSheet are keyed by the open member', () => {
    const host = code(HOST);
    assert.match(host, /<ContactSheet\s+key=\{`contact-\$\{token\}`\}/);
    assert.match(host, /<ReportSheet\s+key=\{`report-\$\{token\}`\}/);
  });
});
