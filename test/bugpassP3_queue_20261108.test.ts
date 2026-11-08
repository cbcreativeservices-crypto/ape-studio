/**
 * Bug pass 3, group "queue" (2026-11-08): the owner's forum queue
 * (src/screens/admin/ForumQueueView.tsx).
 *
 *  CODE-3-05  PLEASE EDIT / Suspend / Ban: when the member action landed but
 *             "take it off the queue" failed, the next tap sent the member
 *             action again (a second notice, a suspension restarted), or was
 *             refused at step one and could never clear the item
 *  CODE-3-13  the appeal and tracked-topic popups: CANCEL stayed live during
 *             SAVE, and a failure after CANCEL was never shown
 *
 * The faces module is imported as a namespace so a helper that did not exist yet
 * fails its own test instead of the whole file.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const QUEUE = 'src/screens/admin/ForumQueueView.tsx';
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const between = (src: string, from: string, to: string) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

type Res = { ok: true } | { ok: false; error: string };
type Memo = { landed(id: number, a: string): boolean; mark(id: number, a: string): void; clear(id: number): void };
type Outcome = { ok: true } | { ok: false; step: 'member' | 'queue'; error: string };
type Faces = {
  createMemberStepMemo: () => Memo;
  runTwoStep: (m: Memo, id: number, action: string, member: () => Promise<Res>, queue: () => Promise<Res>) => Promise<Outcome>;
  memberDoneQueueFailed: (again: string) => { title: string; body: string };
};
const faces = async () => (await import('../src/screens/admin/forumQueueFaces.ts')) as unknown as Faces;

/** A fake server: counts each call, and answers from a script. */
function fake(answers: Res[]) {
  let calls = 0;
  const fn = async (): Promise<Res> => {
    const a = answers[Math.min(calls, answers.length - 1)];
    calls += 1;
    return a;
  };
  return { fn, calls: () => calls };
}

describe('CODE-3-05: a repeat tap after "still listed" sends only the queue step', () => {
  it('member step landed, queue step failed: the retry never resends the member action', async () => {
    const { createMemberStepMemo, runTwoStep } = await faces();
    const memo = createMemberStepMemo();
    const member = fake([{ ok: true }]);
    const queue = fake([{ ok: false, error: 'No connection.' }, { ok: true }]);

    const first = await runTwoStep(memo, 7, 'please_edit', member.fn, queue.fn);
    assert.deepEqual(first, { ok: false, step: 'queue', error: 'No connection.' });
    assert.equal(member.calls(), 1);
    assert.equal(memo.landed(7, 'please_edit'), true);

    const second = await runTwoStep(memo, 7, 'please_edit', member.fn, queue.fn);
    assert.deepEqual(second, { ok: true });
    assert.equal(member.calls(), 1, 'the member was not sent it a second time');
    assert.equal(queue.calls(), 2);
    assert.equal(memo.landed(7, 'please_edit'), false, 'forgotten once the item left the queue');
  });

  it('a server that refuses the repeat ("already…") can no longer trap the item', async () => {
    const { createMemberStepMemo, runTwoStep } = await faces();
    const memo = createMemberStepMemo();
    const member = fake([{ ok: true }, { ok: false, error: 'Already suspended.' }]);
    const queue = fake([{ ok: false, error: 'Timed out.' }, { ok: true }]);
    await runTwoStep(memo, 3, 'suspended:7', member.fn, queue.fn);
    const again = await runTwoStep(memo, 3, 'suspended:7', member.fn, queue.fn);
    assert.equal(again.ok, true);
  });

  it('a member step that failed is not remembered, and a different choice is a new action', async () => {
    const { createMemberStepMemo, runTwoStep } = await faces();
    const memo = createMemberStepMemo();
    const member = fake([{ ok: false, error: 'No connection.' }, { ok: true }]);
    const queue = fake([{ ok: false, error: 'No connection.' }]);
    const r = await runTwoStep(memo, 9, 'suspended:7', member.fn, queue.fn);
    assert.deepEqual(r, { ok: false, step: 'member', error: 'No connection.' });
    assert.equal(queue.calls(), 0, 'no queue step after a failed member step');
    assert.equal(memo.landed(9, 'suspended:7'), false);
    await runTwoStep(memo, 9, 'suspended:7', member.fn, queue.fn);
    assert.equal(memo.landed(9, 'suspended:7'), true);
    assert.equal(memo.landed(9, 'suspended:30'), false, '30 days after 7 is a new member action');
    assert.equal(memo.landed(19, 'suspended:7'), false, 'per item: 19 is not 9');
  });

  it('the words say plainly what happened and what the next tap does', async () => {
    const { memberDoneQueueFailed } = await faces();
    const m = memberDoneQueueFailed('PLEASE EDIT');
    assert.equal(m.title, 'Done for the member');
    assert.match(m.body, /^Clearing it from the queue failed; tap PLEASE EDIT to try that again\./);
    assert.doesNotMatch(`${m.title}${m.body}`, /—|still listed/);
  });

  it('PLEASE EDIT and Suspend / Ban both go through the memo; the old "Done, but still listed" is gone', () => {
    const list = between(code(QUEUE), 'function QueueList', 'function AppealList');
    assert.doesNotMatch(list, /Done, but still listed/);
    const onPost = between(list, 'const onPost', 'const onUser');
    assert.match(onPost, /runTwoStep\(\s*memberStep,\s*item\.logId,\s*action,/);
    assert.match(onPost, /memberDoneQueueFailed\(/);
    const stand = between(list, 'const stand', 'const memberItems');
    assert.match(stand, /runTwoStep\(\s*memberStep,\s*item\.logId,\s*step,/);
    assert.match(stand, /const step = status === 'banned' \? 'banned' : `suspended:\$\{days\}`;/);
    // Nothing new goes to the member on a retry, so the YES question is skipped.
    assert.match(stand, /const already = memberStep\.landed\(item\.logId, step\);/);
    assert.match(stand, /already \? null : body,/);
    // The card keeps the line after the popup is gone.
    assert.match(list, /\{partial\[item\.logId\] \? <Text style=\{st\.partial\}>/);
  });
});

describe('CODE-3-13: CANCEL, the scrim and BACK are held while a write is out', () => {
  it('appeals: CANCEL is disabled while saving, and close() refuses while SAVE is out', () => {
    const body = between(code(QUEUE), 'function AppealList', 'function TrackedList');
    assert.match(body, /<QuietButton label="CANCEL" onPress=\{close\} disabled=\{saving\} \/>/);
    // The Popup's onRequestClose and scrim call `close`, which is guarded.
    assert.match(body, /<Popup visible=\{visible\} onClose=\{close\}/);
    assert.match(between(body, 'const close = () =>', '};'), /if \(savingRef\.current\) return;/);
    const save = between(body, 'const save = useLatchedPress', 'if (read.face');
    assert.ok(save.indexOf('savingRef.current = true;') < save.indexOf('await decideAppeal'));
    assert.match(save, /finally \{\s*savingRef\.current = false;/);
    // SAVE's own success closes through `shut`, past the guard.
    assert.match(save, /shut\(\);/);
    assert.doesNotMatch(save, /\bclose\(\);/);
  });

  it('tracked: CANCEL is disabled while SAVE, PIN or LOCK is out, and close() refuses then', () => {
    const body = code(QUEUE).slice(code(QUEUE).indexOf('function TrackedList'));
    assert.match(body, /<QuietButton label="CANCEL" onPress=\{close\} disabled=\{saving \|\| flagging\} \/>/);
    assert.match(body, /<Popup visible=\{visible\} onClose=\{close\}/);
    assert.match(between(body, 'const close = () =>', '};'), /if \(inFlight\.current > 0\) return;/);
    const save = between(body, 'const save = useLatchedPress', 'const flag = useLatchedPress');
    assert.ok(save.indexOf('inFlight.current += 1;') < save.indexOf('await setTrackedStatus'));
    assert.match(save, /finally \{\s*inFlight\.current -= 1;/);
    assert.match(save, /shut\(\);/);
    assert.doesNotMatch(save, /\bclose\(\);/);
    const flag = between(body, 'const flag = useLatchedPress', 'if (read.face');
    assert.ok(flag.indexOf('inFlight.current += 1;') < flag.indexOf('await setTopicFlags'));
    assert.match(flag, /finally \{\s*inFlight\.current -= 1;\s*setFlagging\(false\);/);
  });
});

describe('CODE-3-05 check follow-ups (CHECK_P3_queue.md)', () => {
  it('F-1: Suspend 7, then 30, then 7 again (queue step failing): the third is a new member action', async () => {
    const { createMemberStepMemo, runTwoStep } = await faces();
    const memo = createMemberStepMemo();
    const sent: string[] = [];
    const member = (k: string) => async (): Promise<Res> => {
      sent.push(k);
      return { ok: true };
    };
    const fail = async (): Promise<Res> => ({ ok: false, error: 'No connection.' });
    await runTwoStep(memo, 1, 'suspended:7', member('7d'), fail);
    await runTwoStep(memo, 1, 'suspended:30', member('30d'), fail);
    // Only the LAST member action that landed is remembered.
    assert.equal(memo.landed(1, 'suspended:30'), true);
    assert.equal(memo.landed(1, 'suspended:7'), false, 'the older choice is forgotten, so it asks YES again');
    await runTwoStep(memo, 1, 'suspended:7', member('7d'), async () => ({ ok: true }));
    assert.deepEqual(sent, ['7d', '30d', '7d'], 'the member ends on the 7 days the line reports');
    // A repeat of the last one is still a queue-only retry.
    await runTwoStep(memo, 2, 'banned', member('ban'), fail);
    await runTwoStep(memo, 2, 'banned', member('ban'), fail);
    assert.deepEqual(sent.filter((s) => s === 'ban'), ['ban']);
  });

  it('F-2: the memory and the card line live above the tab switch, and the words promise only that', async () => {
    const src = code(QUEUE);
    const view = between(src, 'export function ForumQueueView', 'function Failed');
    // Held by the screen, before its early return (hook order).
    const memo = view.indexOf('const memberStep = useRef(createMemberStepMemo()).current;');
    const line = view.indexOf('const [partial, setPartial] = useState<Record<number, string>>({});');
    assert.ok(memo > 0 && line > 0, 'ForumQueueView holds both');
    assert.ok(memo < view.indexOf('if (usage.face'), 'before the early return');
    // Handed down through a context, so QueueList keeps its plain signature.
    assert.match(view, /<QueueMemory\.Provider value=\{\{ memberStep, partial, setPartial \}\}>\s*<QueueList \/>/);
    const list = between(src, 'function QueueList()', 'function AppealList');
    assert.match(list, /const \{ memberStep, partial, setPartial \} = memory;/);
    assert.doesNotMatch(list, /createMemberStepMemo\(\)|useState<Record<number, string>>/, 'QueueList no longer owns them');
    const { memberDoneQueueFailed } = await faces();
    const m = memberDoneQueueFailed('PLEASE EDIT');
    assert.match(m.body, /Only the queue step is sent again while you stay on this screen\.$/);
    assert.doesNotMatch(m.body, /never/);
  });
});
