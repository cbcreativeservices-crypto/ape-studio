/**
 * Home "Explore Certificates & Programs" cards: the owner's own left-to-right
 * order (2026-10-27, picked on the card-order page). Pinned so it can't drift.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const home = readFileSync(new URL('../src/screens/courses/CourseSelectionScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('showcase cards are in the owner-chosen order', () => {
  const block = home.match(/const SHOWCASE_CARDS: readonly string\[\] = \[([\s\S]*?)\];/)![1];
  const names = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(names, [
    'Music Production', 'Recording Arts', 'Live Sound Engineering', 'Worship Audio', 'Architectural Acoustics',
    'DJ Production', 'Theatrical Sound Design', 'Podcasting & Broadcast', 'Sound for Film & Games',
    'System Design & Maintenance', 'Sound Reinforcement', 'Corporate & Event AV', 'Commercial 70V Systems',
    'Assisted Listening', 'HiFi & Consumer Audio', 'Audio Electronics', 'Vehicle Audio', 'Audio Technician',
    'Road Crew & Touring', 'Career & Business', 'Mixing & Mastering', 'Audio Restoration & Archiving', 'Acoustics Science',
  ]);
});
