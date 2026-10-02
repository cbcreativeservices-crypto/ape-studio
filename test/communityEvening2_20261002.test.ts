/**
 * GUARDS — community / careers / awards, evening toddler hunt PASS 2 (2026-10-02).
 *
 *  F1  Career family START HERE rows toggled with no lock: a tap on DAW
 *      Fundamentals (gs3970, free) or on a required co-requisite under 100%
 *      (gs4370, in four families' first three rows) REMOVED it from the study
 *      list. The Enrollments row refuses exactly that with "This topic stays".
 *      The family rows now run the same rule and the same repeat-tap guard
 *      (a double tap added the topic and removed it again).
 *  F2  CORRECTION to pass 1 E2 (My Profile). Pass 1 cleared the error inside
 *      refresh(), which runs only AFTER the save chain. sendPublish first saves
 *      the unsent edit IN that chain: when the server refused it (About rules),
 *      persist() rolled the field back and set the refusal — and the publish
 *      succeeding then cleared it. The About reverted with no word. The clear
 *      now happens when the new attempt starts (publish / the two switches).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('evening pass 2 — community / careers / awards', () => {
  test('F1 the data: a free topic and a required core really sit in career families', () => {
    const fams = JSON.parse(read('src/data/careerFamilies.json')) as { id: string; topicGs: number[] }[] | Record<string, { topicGs: number[] }>;
    const list = Array.isArray(fams) ? fams : Object.values(fams);
    const all = list.flatMap((f) => f.topicGs ?? []);
    assert.ok(all.includes(3970), 'gs3970 (free) is in a family');
    assert.ok(all.includes(4370), 'gs4370 (core co-requisite) is in a family');
  });

  test('F1 career family rows never toggle a free topic or a locked core off the list', () => {
    const fam = code('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.doesNotMatch(fam, /onPress=\{\(\) => toggleTopic\(gs\)\}/, 'the row toggles with no lock again');
    assert.match(fam, /onPress=\{\(\) => tapTopic\(gs\)\}/);
    const tap = fam.slice(fam.indexOf('const tapTopic = (gs: number) => {'));
    assert.ok(tap.length > 0 && fam.includes('const tapTopic = (gs: number) => {'));
    const body = tap.slice(0, tap.indexOf('toggleTopic(gs);'));
    assert.match(body, /COREQ_TOPIC_GS\.includes\(gs\) && \(coreProg\.get\(gs\)\?\.pct \?\? 0\) < 100/, 'core lock = Enrollments rule');
    assert.match(body, /enrolledGs\.has\(gs\) && \(coreLocked \|\| isFreeEnrollGs\(gs\)\)/, 'free/core lock on an enrolled row');
    assert.match(body, /notify\(\s*'This topic stays'/, 'same words as Enrollments');
    assert.match(body, /lastRowTap\.current\.gs === gs && now - lastRowTap\.current\.at < ROW_REPEAT_MS\) return;/, 'repeat-tap guard');
    assert.match(fam, /useEnrollmentProgress\(coreGsHere\)/);
    // The words match the Enrollments row's own notice.
    const enr = read('src/screens/enrollment/EnrollmentScreen.tsx');
    assert.ok(enr.includes("'Required co-requisites stay in your list until you complete them.'"));
    assert.ok(fam.includes("'Required co-requisites stay in your list until you complete them.'"));
    assert.ok(fam.includes("'This topic is always part of your list.'"));
  });

  test('F2 My Profile: a refusal of the edit saved ahead of a publish is not wiped by the publish succeeding', () => {
    const v = code('src/screens/directory/MyProfileView.tsx');
    const send = v.slice(v.indexOf('const sendPublish = (on: boolean, adult?: boolean) => {'));
    const clear = send.indexOf('setErr(null);');
    const flush = send.indexOf('void persist(pRef.current);');
    assert.ok(clear >= 0 && flush > clear, 'the stale error is cleared at the START of the attempt, before the unsent edit is saved');
    const refresh = v.slice(v.indexOf('const refresh = useCallback(async () => {'));
    const head = refresh.slice(0, refresh.indexOf('await saveChain.current;'));
    assert.doesNotMatch(head, /setErr\(null\)/, 'refresh cleared AFTER the chained save had set its refusal');
    for (const fn of ['setDiscoverable', 'setContactEnabled']) {
      assert.match(v, new RegExp(`onChange=\\{\\(v\\) => \\{ setErr\\(null\\); void ${fn}\\(v\\)\\.then\\(\\(r\\) => \\(r\\.ok \\? refresh\\(\\) : setErr\\(r\\.error\\)\\)\\); \\}\\}`), `${fn}: cleared at the tap`);
    }
  });
});
