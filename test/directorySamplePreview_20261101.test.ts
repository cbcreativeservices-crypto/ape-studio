/**
 * Dev-only SAMPLE member chat (owner 2026-11-01: see the chat screens without
 * accounts). Ratchets:
 *  - it can never switch on outside a development build (__DEV__);
 *  - every contact call in api.ts answers from the sample while it is on, so
 *    nothing reaches the live database;
 *  - leaving the directory turns it off, and the screen says SAMPLE DATA.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  sampleDirectoryOn,
  sampleMessages,
  sampleRespond,
  sampleSend,
  sampleThreads,
  setSampleDirectory,
} from '../src/features/directory/sampleThreads.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('dev-only sample member chat', () => {
  it('never switches on without __DEV__ (a release build)', () => {
    setSampleDirectory(true);
    assert.equal(sampleDirectoryOn(), false);
    setSampleDirectory(false);
  });

  it('every contact call checks the sample first', () => {
    const api = read('src/features/directory/api.ts');
    for (const fn of ['fetchContactThreads', 'fetchThreadMessages', 'respondToRequest', 'fetchContactAllowance', 'sendThreadMessage', 'blockThread', 'reportMember']) {
      const at = api.indexOf(`export async function ${fn}(`);
      assert.ok(at > 0, fn);
      const head = api.slice(at, api.indexOf('try {', at));
      assert.match(head, /if \(sampleDirectoryOn\(\)\) return sample/, `${fn} must answer from the sample first`);
    }
    assert.match(read('src/features/directory/inboxApi.ts'), /if \(sampleDirectoryOn\(\)\) return true;/);
  });

  it('shows every state: incoming, verified employer, open conversation, declined, sent', () => {
    setSampleDirectory(true);
    const r = sampleThreads();
    assert.ok(r.ok);
    const rows = r.ok ? r.rows : [];
    assert.ok(rows.some((t) => t.direction === 'incoming' && t.status === 'pending' && t.otherKind === 'member'));
    assert.ok(rows.some((t) => t.otherKind === 'employer' && t.otherVerified));
    assert.ok(rows.some((t) => t.status === 'accepted'));
    assert.ok(rows.some((t) => t.status === 'declined'));
    assert.ok(rows.some((t) => t.direction === 'outgoing'));
    setSampleDirectory(false);
  });

  it('answers and replies change only the in-memory sample, and reset on reopen', () => {
    setSampleDirectory(true);
    const first = sampleThreads();
    const pending = first.ok ? first.rows.find((t) => t.status === 'pending' && t.direction === 'incoming')! : null;
    sampleRespond(pending!.id, 'accept');
    const after = sampleThreads();
    assert.equal(after.ok && after.rows.find((t) => t.id === pending!.id)!.status, 'accepted');
    sampleSend(pending!.id, 'hello');
    const msgs = sampleMessages(pending!.id);
    assert.equal(msgs.ok && msgs.rows.at(-1)!.body, 'hello');
    setSampleDirectory(true); // reopening starts fresh
    const fresh = sampleThreads();
    assert.equal(fresh.ok && fresh.rows.find((t) => t.id === pending!.id)!.status, 'pending');
    setSampleDirectory(false);
  });

  it('the directory turns it off on close, and the list labels it SAMPLE DATA', () => {
    assert.match(read('src/screens/directory/AudioCommunityDirectoryScreen.tsx'), /useEffect\(\(\) => \(\) => setSampleDirectory\(false\), \[\]\)/);
    assert.match(read('src/screens/directory/RequestsView.tsx'), /sampleDirectoryOn\(\) \? \([\s\S]{0,80}SAMPLE DATA/);
  });
});
