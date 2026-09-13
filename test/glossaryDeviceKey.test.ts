/**
 * Glossary temporary device key — the consent decision (owner 2026-09-13).
 *
 * The brief was *"i need the database to be protected — so the definitions need
 * to come through a counting gateway on the server"*. Metering needs an identity
 * and a guest has none, so the glossary asks for a disposable one. This suite
 * pins the two ways that goes wrong:
 *
 *  1. **Asking someone who already has an identity.** A signed-in member must
 *     never see a dialog about device IDs, and a guest who already holds a key
 *     must not be asked again on every focus.
 *  2. **Deciding before the facts are in.** Both the entitlement read and the
 *     storage read are async. Acting on `isGuest === true` while either is still
 *     in flight raises the dialog in front of a paying member for one frame.
 *
 * ⚠️ The 'mint' state is NOT a re-ask. The nightly purge deletes keys older than
 * 7 days — that is the promise the dialog makes — so a returning device has
 * consent on file and no key. See the RENEWAL note in `deviceKey.ts`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceKeyState, classifyMintError, type ConsentRecord } from '../src/features/glossary/deviceKeyState.ts';

const GRANTED: ConsentRecord = { granted: true, at: 1_757_000_000_000 };

const base = {
  gatewayDeployed: true,
  isGuest: true,
  resolved: true,
  hasSession: false,
  consent: null as ConsentRecord | undefined,
  declinedThisVisit: false,
};

test('a fresh guest is asked', () => {
  assert.equal(deviceKeyState(base), 'ask');
});

test('NOBODY is asked until the server gateway exists', () => {
  // The client ships BEFORE the revokes on purpose. Until glossary_browse_v is
  // there, a device key buys the user nothing, so asking for one would be a
  // privacy prompt in exchange for nothing.
  assert.equal(deviceKeyState({ ...base, gatewayDeployed: false }), 'ready');
  assert.equal(deviceKeyState({ ...base, gatewayDeployed: false, consent: GRANTED }), 'ready');
  assert.equal(deviceKeyState({ ...base, gatewayDeployed: undefined }), 'unknown');
});

test('nothing is decided until entitlement has resolved', () => {
  assert.equal(deviceKeyState({ ...base, resolved: false }), 'unknown');
});

test('nothing is decided while the consent read is still in flight', () => {
  assert.equal(deviceKeyState({ ...base, consent: undefined }), 'unknown');
});

test('a real account is never asked — it is already metered by uid', () => {
  assert.equal(deviceKeyState({ ...base, isGuest: false }), 'ready');
  // …including before their session object has been handed to this screen.
  assert.equal(deviceKeyState({ ...base, isGuest: false, hasSession: false, consent: null }), 'ready');
});

test('a guest holding a key is ready, not asked again', () => {
  assert.equal(deviceKeyState({ ...base, hasSession: true }), 'ready');
});

test('consent on file with no key mints silently — the 7-day purge is not a re-ask', () => {
  assert.equal(deviceKeyState({ ...base, consent: GRANTED }), 'mint');
});

test('NOT NOW closes the glossary for the visit only', () => {
  assert.equal(deviceKeyState({ ...base, declinedThisVisit: true }), 'declined');
  // The screen offers the ask again; clearing the visit flag restores it.
  assert.equal(deviceKeyState({ ...base, declinedThisVisit: false }), 'ask');
});

test('declining does not strand a guest who is already signed in elsewhere', () => {
  assert.equal(deviceKeyState({ ...base, isGuest: false, declinedThisVisit: true }), 'ready');
});

test('anonymous sign-ins being OFF in the dashboard is distinguishable from a network blip', () => {
  // Off by default in Auth → Providers; the failure is a runtime 422, so the
  // screen must be able to fail open instead of looking broken.
  assert.equal(classifyMintError('Anonymous sign-ins are disabled'), 'disabled');
  assert.equal(classifyMintError('Signups not allowed for this instance'), 'disabled');
  assert.equal(classifyMintError('Network request failed'), 'network');
  assert.equal(classifyMintError('something else entirely'), 'unknown');
});
