/**
 * Bug pass 2026-11-08, CODE-1-33: a forum alert tapped on a cold start (root
 * still Splash) or while signed out (root Auth) is parked, then opened once a
 * signed-in screen is the root, and only once.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FORUM_TAP_PARK_MS,
  forumTapLands,
  parkForumTap,
  takeParkedForumTap,
} from '../src/features/notifications/communityRules.ts';

const tap = { topicId: '3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b', postId: null };

describe('CODE-1-33: a forum tap waits for sign-in', () => {
  it('never lands on Splash or Auth', () => {
    assert.equal(forumTapLands('Splash'), false);
    assert.equal(forumTapLands('Auth'), false);
    assert.equal(forumTapLands('Main'), true);
  });
  it('a parked tap stays parked on Splash and Auth, then opens once on Main', () => {
    parkForumTap(tap, 1000);
    assert.equal(takeParkedForumTap('Splash', 2000), null);
    assert.equal(takeParkedForumTap('Auth', 3000), null);
    assert.equal(takeParkedForumTap(undefined, 3500), null);
    assert.deepEqual(takeParkedForumTap('Main', 4000), tap);
    assert.equal(takeParkedForumTap('Main', 5000), null, 'opened once only');
  });
  it('a tap parked too long is dropped', () => {
    parkForumTap(tap, 0);
    assert.equal(takeParkedForumTap('Main', FORUM_TAP_PARK_MS + 1), null);
  });
  it('App parks on a tap that cannot land and drains on every state change', () => {
    const app = readFileSync('App.tsx', 'utf8').replace(/\r\n/g, '\n');
    assert.match(app, /if \(!forumTapLands\(base\)\) \{\s*parkForumTap\(tap\);\s*return;/);
    assert.match(app, /onStateChange=\{drainParkedForumTap\}/);
    assert.match(app, /function drainParkedForumTap\(\): void \{[\s\S]*?takeParkedForumTap\(base\)/);
  });
});

describe('CODE-2-02: a thread for a different topic opens on top', () => {
  it('ForumThread has one screen per topic id', () => {
    const nav = readFileSync('src/navigation/RootNavigator.tsx', 'utf8').replace(/\r\n/g, '\n');
    assert.match(nav, /name="ForumThread"[\s\S]{0,120}getId=\{\(\{ params \}\) => \(params as \{ topicId\?: string \} \| undefined\)\?\.topicId\}/);
  });
});
