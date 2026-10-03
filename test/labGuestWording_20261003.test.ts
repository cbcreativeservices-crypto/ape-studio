/**
 * LAB GUEST WORDING (2026-10-03) — the tier sweep carried into the labs' own
 * in-lab save wording.
 *
 * Owner ruling 2026-10-03: a signed-in member whose membership check FAILED
 * must never be told "you're not signed in". Five labs said it from their own
 * resolved-based guest flag (useLabEndGuest(), which also drives blocking and
 * session carry): Sound Systems, Drum Tuning, Room Design, Cable Install (and
 * Mastering, whose only guest wording is the shared end screen — already
 * fixed in 1e9f0f9d). The calculator workflow runner's SAVE RESULT said
 * "Sign in to save results" the same way.
 *
 * Now the identity CLAIM comes from useGuestWording() (a KNOWN guest only);
 * the 'checking' / 'unconfirmed' account state gets labEnd's honest line
 * (accountWhy). The hold / block / carry rules are byte-for-byte unchanged.
 *
 * Receipt: every test below FAILED against the HEAD files (each edited file
 * copied aside, the HEAD version put in place, this file run, the copies
 * restored and checked with cmp).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

type Fn = (...a: never[]) => unknown;
const call = (m: Record<string, unknown>, name: string, ...a: unknown[]) => {
  const f = m[name];
  assert.equal(typeof f, 'function', `${name} is exported`);
  return (f as (...x: unknown[]) => unknown)(...a);
};
const labEnd = (await import('../src/screens/lab/kit/labEnd.ts')) as unknown as Record<string, Fn>;
const cc = (await import('../src/screens/lab/cableinstall/completeCopy.ts')) as unknown as Record<string, Fn>;
const rd = (await import('../src/screens/lab/roomdesign/labCtx.ts')) as unknown as Record<string, Fn>;

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const NC = 'Couldn’t confirm your membership on this phone. Check your connection and reopen the app.';
const NOT_SIGNED_IN = /not signed in|sign in/i;

describe('the shared sentence (labEnd.accountWhy)', () => {
  it('one honest line per state, reused by endLead', () => {
    assert.equal(call(labEnd, 'accountWhy', 'unconfirmed'), NC);
    assert.equal(call(labEnd, 'accountWhy', 'checking'), 'Still checking your account.');
    const w = (labEnd.whatsLeft as unknown as (u: unknown, c: Set<string>) => unknown)([{ id: 'a', label: 'A', num: 1 }], new Set());
    assert.ok(String(call(labEnd, 'endLead', w, { mode: 'credit', noun: 'module', account: 'unconfirmed' })).includes(NC));
  });
});

describe('Sound Systems — the WHAT IS LEFT lead', () => {
  const s = read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
  it('the blocking flag is untouched; the wording asks useGuestWording first', () => {
    assert.match(s, /const guest = useLabEndGuest\(\);/);
    assert.match(s, /const wording = useGuestWording\(\);/);
    const lead = s.slice(s.indexOf('{guest\n'), s.indexOf("'Everything you have done is saved."));
    const acct = lead.indexOf('!wording.guest');
    assert.ok(acct > 0 && acct < lead.indexOf('You are not signed in'), 'account branch before "not signed in"');
    assert.match(lead, /accountWhy\(wording\.account \?\? 'checking'\)/);
  });
});

describe('Drum Tuning — Chapter 6 tuning notes', () => {
  const host = read('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx');
  const ch6 = read('src/screens/lab/drumtuning/modules/ch6Kit.tsx');
  it('the host keeps its hold rule and passes the account state', () => {
    assert.match(host, /const guest = useLabEndGuest\(\);\n\s*const \{ resolved \} = useEntitlement\(\);\n\s*const blocked = guest \|\| !resolved;\n\s*setDrumSaveBlocked\(blocked\);/);
    assert.match(host, /const wording = useGuestWording\(\);/);
    assert.match(host, /guest=\{resolved && guest\} preview=\{preview\} account=\{wording\.account\}/);
    assert.match(read('src/screens/lab/drumtuning/modules/shared.tsx'), /account\?: AccountWording;/);
  });
  it('the note, the list heading and the SAVE flash never claim "not signed in" for an account state', () => {
    assert.match(ch6, /: account \? accountNotesLine\(account\) : 'You are not signed in: notes/);
    assert.match(ch6, /\{account \? 'THIS SESSION ONLY — NOT SAVED' : guest \?/);
    assert.match(ch6, /: guest && !account \? 'Kept for this session — sign in before you close the app/);
    assert.match(ch6, /`Kept for this session only — not saved on this device\. \$\{accountWhy\(account \?\? 'checking'\)\}`/);
    // behaviour reads of `guest` untouched
    assert.match(ch6, /const kept = notes\.filter\(\(x\) => guest \|\| !unsavedIds\?\.has\(x\.id\)\);/);
    assert.match(ch6, /const isUnsaved = \(n: TuningNote\) => !guest && !!unsavedIds\?\.has\(n\.id\);/);
  });
});

describe('Room Design — intro, EXPLORE save tray, REVIEW', () => {
  it('the pure lines say the honest state and never "not signed in"', () => {
    for (const a of ['checking', 'unconfirmed'] as const) {
      const line = String(call(rd, 'accountDesignsLine', a));
      assert.doesNotMatch(line, NOT_SIGNED_IN, line);
      assert.ok(line.includes(String(call(labEnd, 'accountWhy', a))));
      for (const held of [true, false]) {
        const s = String(call(rd, 'accountSaveLine', a, held));
        assert.doesNotMatch(s, NOT_SIGNED_IN, s);
        assert.match(s, held ? /^Kept for this session/ : /^Kept on screen only/);
      }
    }
  });
  it('the host keeps the guest rule and adds the account state to ctx', () => {
    const h = read('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
    assert.match(h, /setRoomDesignSaveBlocked\(!resolved \|\| guest\);/);
    assert.match(h, /guest: !resolved \? false : guest,\s*preview,\s*resolved,\s*account: !resolved \|\| !guest \? undefined : wording\.account,/);
    assert.match(read('src/screens/lab/roomdesign/labCtx.ts'), /account\?: AccountWording;/);
  });
  it('every "not signed in" line has an account branch before it', () => {
    assert.match(read('src/screens/lab/roomdesign/modules/modIntro.tsx'), /: ctx\.account \? accountDesignsLine\(ctx\.account\) : 'You are not signed in: design freely/);
    const ex = read('src/screens/lab/roomdesign/modules/modExplore.tsx');
    assert.match(ex, /: account \? 'SAVE \(NOT KEPT YET\)' : 'SAVE \(SIGN IN TO KEEP IT\)'/);
    assert.match(ex, /: asGuest && asAccount\s*\? accountSaveLine\(asAccount, held\)\s*: asGuest\s*\? held\s*\? SAVE_HELD/);
    assert.match(ex, /: account \? accountDesignsLine\(account\) : 'You can design freely\. Nothing is saved until you sign in/);
    assert.match(read('src/screens/lab/roomdesign/modules/modReview.tsx'), /: account\s*\? accountDesignsLine\(account\)\s*: 'You are not signed in, so designs are not saved yet\./);
  });
});

describe('Cable Install — the completion notice', () => {
  it('a failed read is not a guest to talk to and is never sold membership', () => {
    const guest = call(cc, 'ciSaveState', { endGuest: true, noAccount: true, isMember: false });
    assert.equal(guest, 'guest', 'the save rule is unchanged');
    assert.equal(call(cc, 'ciSaveWording', guest, undefined), 'guest');
    for (const a of ['checking', 'unconfirmed'] as const) {
      const st = call(cc, 'ciSaveWording', guest, a);
      assert.equal(st, a);
      const n = call(cc, 'ciSaveNotice', st) as { title: string; body: string; join?: string; signIn?: string };
      assert.ok(n, 'still told the run is not saved');
      assert.doesNotMatch(n.body, NOT_SIGNED_IN);
      assert.ok(n.body.includes(String(call(labEnd, 'accountWhy', a))));
      assert.equal(n.join, undefined, 'no membership offer');
      assert.equal(n.signIn, undefined);
      assert.doesNotMatch(String(call(cc, 'ciLeftLead', st, { unbanked: 2, replayOnly: 0, total: 9 })), /saved|credited/);
    }
    // preview and saved states keep their meaning
    assert.equal(call(cc, 'ciSaveWording', 'preview', 'unconfirmed'), 'preview');
    assert.equal(call(cc, 'ciSaveWording', 'saved', 'unconfirmed'), 'saved');
  });
  it('the screen wraps the unchanged rule and hides an absent offer', () => {
    const s = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(s, /saveState=\{ciSaveWording\(ciSaveState\(\{ endGuest, noAccount: noAccountRef\.current, isMember \}\), wording\.account\)\}/);
    assert.match(s, /noAccountRef\.current = resolved && entitlement === 'anonymous';/);
    assert.match(s, /\{notice\.join \? <GlassButton label=\{notice\.join\}/);
  });
});

describe('the same pattern elsewhere — calculator workflow SAVE RESULT', () => {
  it('a failed read hears "not confirmed", never "Sign in to save results"', () => {
    const s = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
    const save = s.slice(s.indexOf('const saveResult = '), s.indexOf("notify('Sign in to save results'"));
    assert.match(save, /if \(limits\.savedResults === 0 && tierUnconfirmed\) \{/);
    assert.match(save, /MEMBERSHIP_NOT_CONFIRMED/);
  });
});
