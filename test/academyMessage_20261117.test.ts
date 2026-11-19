// The academy's message on the main menu (owner 2026-11-17) [MD:D68].
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rd = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const badge = rd('src/features/directory/CommunityBadge.tsx');
const msg = rd('src/screens/academyMessage/AcademyMessageScreen.tsx');
const home = rd('src/screens/courses/CourseSelectionScreen.tsx');
const nav = rd('src/navigation/RootNavigator.tsx');
const types = rd('src/navigation/types.ts');

test('the owner-approved text is the one shipped', () => {
  assert.match(msg, /launched the app on Friday, November 6/);
  assert.match(msg, /Do it one more time: close it completely and open it again\./);
  assert.match(msg, /once a week/);
  assert.match(msg, /— Pro Audio Training Academy/);
  assert.doesNotMatch(msg, /November 5/);
  assert.doesNotMatch(msg, /New in Labs/); // owner removed that paragraph
});

test('nothing shows before the read flag is read; read hides it', () => {
  const body = badge.slice(badge.indexOf('export function academyMessageUnread'));
  assert.match(body, /return hydrated && !read\.has\(ACADEMY_MESSAGE_ID\)/);
});

test('it uses the shared safe store, never raw AsyncStorage', () => {
  assert.match(badge, /const academyRead = createLocalStore</);
  assert.match(badge, /key: 'ape:intro:academyMessagesRead:v1'/); // survives the guest wipe (onboarding family)
  assert.doesNotMatch(badge, /AsyncStorage/);
});

test('main menu: New Messages opens the academy message while unread, ahead of the inbox', () => {
  const i = home.indexOf('{academyUnread ? (');
  const j = home.indexOf('!SHOW_COMMUNITY_ON_HOME ? null : (badgeCount(inbox)');
  assert.ok(i > 0 && j > i, 'academy branch comes first');
  assert.match(home.slice(i, j), /navigate\('AcademyMessage'\)/);
  assert.match(home.slice(i, j), /New Messages/);
});

test('the screen is registered and marks the message read on open', () => {
  assert.match(types, /AcademyMessage: undefined;/);
  assert.match(nav, /name="AcademyMessage" getComponent=\{Lazy\.AcademyMessage\}/);
  const scr = rd('src/screens/academyMessage/AcademyMessageScreen.tsx');
  assert.match(scr, /markAcademyMessageRead\(\)/);
  assert.match(scr, /safeGoBack\(navigation\)/);
});
