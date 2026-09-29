/**
 * GUARD — a double-tap on a glossary term spends ONE weekly lookup, not two.
 *
 * Bug hunt 2026-09-29: the server-metered read (`openViaGateway`) had no
 * in-flight guard. `detailsRef` only fills once the first read lands, so a
 * second tap on the same row/card called get_glossary_definition again, and
 * every call is charged. The pending read is now shared per term.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync(join(process.cwd(), 'src', 'screens', 'glossary', 'GlossaryScreen.tsx'), 'utf8');

test('the metered read is shared while in flight', () => {
  assert.match(src, /const gatewayInFlightRef = useRef<Map<string, Promise<boolean>>>\(new Map\(\)\);/);
  assert.match(src, /const pending = gatewayInFlightRef\.current\.get\(id\);\s*if \(pending\) return pending;/);
  assert.match(src, /gatewayInFlightRef\.current\.delete\(id\);/, 'the entry must be dropped when the read settles');
  assert.match(src, /openViaGatewayRef\.current = openViaGateway;/);
});

test('no raw Alert import is left in the glossary', () => {
  assert.doesNotMatch(src, /import \{[^}]*\bAlert\b[^}]*\} from 'react-native';/);
});
