/**
 * GLOSSARY — hunt 7 (2026-10-03). Re-audit of 8be3c78e (SESSION_FALLBACK_CHARGED,
 * limit wording), then the area.
 *
 * 1. GlossaryTermPopup after a SLOW probe. probeGateway() answers 'absent' for a
 *    transient fault without caching it; the popup then looked the term up in
 *    `glossary_browse_v` (a 120-character teaser for any non-member) and
 *    returned before the metered read — the teaser showed as the whole
 *    definition in every lab / calculator term popup, with no note. Hunt 6
 *    fixed the same thing on the Glossary screen; the popup was missed.
 * 2. Glossary screen: a cross-link hop is free and fills the term's detail from
 *    `glossary_study_v` (no definition column). openViaGateway treated "has a
 *    detail" as "already read through the gateway", so a free reader who hopped
 *    to a term and then opened it deliberately was never sent the metered read:
 *    the row / card showed the browse teaser as the full definition for the
 *    rest of the visit, silently.
 *
 * Receipts: the first three tests FAILED on HEAD c2864ab1; the last is a guard
 * (cross-links stay free) and passes on both.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const POPUP = readFileSync(new URL('../src/features/glossary/GlossaryTermPopup.tsx', import.meta.url), 'utf8');
const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');

describe('GlossaryTermPopup: a transient "absent" probe is asked again', () => {
  const afterHit = POPUP.slice(POPUP.indexOf('setRow(hit);'), POPUP.indexOf('const full = await readOnce(hit.id);'));
  it('no bare return on the first probe answer', () => {
    assert.doesNotMatch(afterHit, /if \(probe !== 'deployed'\) return;/);
  });
  it('re-probes before deciding the row is whole, and honours a close meanwhile', () => {
    assert.match(afterHit, /const live = probe === 'deployed' \|\| \(await probeGateway\(\)\) === 'deployed';/);
    assert.match(afterHit, /if \(cancelled \|\| !live\) return;/);
  });
});

describe('GlossaryScreen: a cross-link detail is not a paid read', () => {
  const start = SCREEN.indexOf('const openViaGateway = useCallback(');
  const body = SCREEN.slice(start, SCREEN.indexOf('openViaGatewayRef.current = openViaGateway;', start));
  it('the free short-circuit needs a gateway read this session (or a member)', () => {
    assert.doesNotMatch(body, /if \(detailsRef\.current\[id\]\) return Promise\.resolve\(true\);/);
    assert.match(
      body,
      /if \(detailsRef\.current\[id\] && \(isMember \|\| sessionDefinition\(id, isMember\)\)\) return Promise\.resolve\(true\);/,
    );
    assert.match(body, /\[readViaGateway, isMember\],/);
  });
  it('cross-links stay free: openLinked still fills the detail without the gate', () => {
    const linked = SCREEN.slice(SCREEN.indexOf('const openLinked = useCallback('), SCREEN.indexOf('const onLinkPress = useCallback('));
    assert.match(linked, /void fetchDetails\(id\);/);
    assert.doesNotMatch(linked, /gateDefinitionOpen|openViaGateway/);
  });
});
