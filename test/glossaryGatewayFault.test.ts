/**
 * Glossary gateway faults (owner 2026-09-13).
 *
 * The gateway ships BEFORE the revokes, on purpose: revoke first and the
 * glossary dies in every build already on a phone. So the client must be able to
 * tell "the RPC isn't deployed yet" (fall back to the direct table read) from
 * "you are out of definitions" (show the lock) from "permission denied" (the
 * revokes have landed and this build has no gateway) — three outcomes that all
 * arrive as one PostgREST error object.
 *
 * ⚠️ The gateway's own refusals are matched on the MESSAGE. They are raised with
 * `errcode = 'PGRST'`, and how that reaches the client is a PostgREST
 * implementation detail; the message text is ours.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyGatewayError } from '../src/features/glossary/gatewayFault.ts';

test('no error is no fault', () => {
  assert.equal(classifyGatewayError(null), null);
});

test('a missing function or view means "not deployed yet" — fall back, do not fail', () => {
  // Postgres SQLSTATEs…
  assert.equal(classifyGatewayError({ code: '42883' }), 'not-deployed');
  assert.equal(classifyGatewayError({ code: '42P01' }), 'not-deployed');
  // …and PostgREST's own schema-cache answers, which is what usually arrives.
  assert.equal(classifyGatewayError({ code: 'PGRST202' }), 'not-deployed');
  assert.equal(
    classifyGatewayError({ code: null, message: 'Could not find the function public.get_glossary_definition' }),
    'not-deployed',
  );
});

test('the two metering refusals are told apart', () => {
  assert.equal(classifyGatewayError({ message: 'weekly_limit_reached' }), 'limit-reached');
  assert.equal(classifyGatewayError({ message: 'sign_in_required' }), 'sign-in-required');
});

test('a denial after the revokes is not mistaken for a missing object', () => {
  // This is the shape a build with no gateway gets once anon SELECT is revoked.
  assert.equal(classifyGatewayError({ code: '42501', message: 'permission denied for table glossary' }), 'denied');
});

test('anything else is an error, and errors fail open', () => {
  assert.equal(classifyGatewayError({ message: 'Network request failed' }), 'error');
});
