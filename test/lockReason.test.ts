/**
 * A tapped dead rack panel must say something TRUE.
 *
 * The staged power sequence is deliberate, but tapping a powered-off panel did
 * nothing whatsoever — no movement, no message. These tests pin the two things
 * that make the new notice worth having: it names only what is actually LEFT,
 * and it never tells a learner to finish something they have already finished.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { lockReason, remainingFor, type MethodGates } from '../src/features/study/lockReason.ts';

const NONE: MethodGates = {
  flashcardsSeenAll: false,
  fillInBlankComplete: false,
  matchingComplete: false,
  scenariosComplete: false,
};
const ALL: MethodGates = {
  flashcardsSeenAll: true,
  fillInBlankComplete: true,
  matchingComplete: true,
  scenariosComplete: true,
};

test('a homework panel only ever waits on flashcards', () => {
  assert.deepEqual(remainingFor('fill_in_blank', NONE), ['Flashcards']);
  assert.deepEqual(remainingFor('matching', NONE), ['Flashcards']);
  // Its OWN completeness is irrelevant to whether it is powered.
  assert.deepEqual(remainingFor('matching', { ...NONE, flashcardsSeenAll: true }), []);
});

test('scenarios waits on flashcards plus BOTH core homeworks', () => {
  assert.deepEqual(remainingFor('scenarios', NONE), ['Flashcards', 'Fill in the Blank', 'Matching']);
});

test('what is already done is left OUT — the learner is told what is LEFT', () => {
  // The exact case the Pixel run hit: flashcards at 100%, both homeworks at 99%.
  const g = { ...NONE, flashcardsSeenAll: true };
  assert.deepEqual(remainingFor('scenarios', g), ['Fill in the Blank', 'Matching']);
  assert.equal(lockReason('scenarios', g), 'Finish Fill in the Blank and Matching to power on Scenarios.');
});

test('one remaining method reads as a sentence, not a list of one', () => {
  const g = { ...NONE, flashcardsSeenAll: true, fillInBlankComplete: true };
  assert.equal(lockReason('scenarios', g), 'Finish Matching to power on Scenarios.');
});

test('the quiz names all four, and calls itself by name', () => {
  assert.equal(
    lockReason('quiz', NONE),
    'Finish Flashcards, Fill in the Blank, Matching and Scenarios to power on the Topic Quiz.',
  );
});

test('⛔ nothing left = say so, never "finish" something already finished', () => {
  // A method completed offline has not synced yet, so the gate can read closed
  // for a beat after the work is genuinely done. Telling that learner to finish
  // it is worse than silence.
  for (const panel of ['fill_in_blank', 'matching', 'scenarios', 'quiz'] as const) {
    const msg = lockReason(panel, ALL);
    assert.ok(!msg.startsWith('Finish'), `${panel} told a finished learner to finish something: ${msg}`);
    assert.match(msg, /syncing/);
  }
});
