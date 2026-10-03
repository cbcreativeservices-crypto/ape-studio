/**
 * GLOSSARY — hunt 6 (2026-10-03). Re-audit of 38dc0a4a / 401bb4bf, then the area.
 *
 * 1. The Common Mistakes veil said "🔒 Common Mistakes are available in academy
 *    mode." to a learner whose membership was still being checked, or whose
 *    read FAILED (`mistakesReadable={isMember}` is false for both). The tier
 *    sweep (1e9f0f9d) moved the topic picker's hint and the footer to
 *    `upsell ? … : tierUnconfirmedCopy` — "never a 🔒 or an upsell to a
 *    member" — but the veil's line was missed. The veil itself stays.
 * 2. The fallback meter after a SLOW probe. probeGateway() answers 'absent' for
 *    a transient fault (a stall past 8 s) without caching it, but the screen
 *    kept that answer for the whole visit: with the gateway live, every open
 *    then charged glossary_consume() and showed only the browse view's
 *    120-character teaser as the definition (a lookup spent, the full text
 *    never fetched), and a term already read this session through the gateway
 *    paid again — against the owner's "once opened, it is free for the
 *    session". The fallback now re-asks the probe before it charges.
 *
 * Receipts: every test below FAILED on HEAD 89f2dd18.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SRC = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');

/** The body of a top-level `const name = useCallback(` up to its deps line. */
function callbackBody(name: string): string {
  const start = SRC.indexOf(`const ${name} = useCallback(`);
  assert.ok(start >= 0, `${name} not found`);
  const end = SRC.indexOf('\n  );', start);
  return SRC.slice(start, end);
}

describe('GlossaryScreen: Common Mistakes veil line follows the tier sweep', () => {
  it('the veil line is a prop, not a hard-coded lock line', () => {
    const veil = SRC.slice(SRC.indexOf('styles.veilLock'), SRC.indexOf('styles.veilLock') + 80);
    assert.doesNotMatch(veil, /COPY\.lockCommonMistakes/);
    assert.match(veil, /\{mistakesLockLine\}/);
  });
  it('the 🔒 lock line only for a known non-member (upsell), else the honest words', () => {
    assert.match(SRC, /const mistakesLockLine = upsell \? MISTAKES_LOCK_LINE : tierUnconfirmedCopy;/);
    assert.match(SRC, /const MISTAKES_LOCK_LINE = `🔒 \$\{COPY\.lockCommonMistakes\}`;/);
  });
  it('both TermDetails sites pass it, and the list repaints when it changes', () => {
    const sites = SRC.match(/mistakesReadable=\{isMember\}\s*\n\s*mistakesLockLine=\{mistakesLockLine\}/g) ?? [];
    assert.equal(sites.length, 2);
    const extra = SRC.slice(SRC.indexOf('const rowExtraData = useMemo('), SRC.indexOf('const rowExtraData = useMemo(') + 600);
    assert.match(extra, /defRev, mistakesLockLine\]/);
  });
  it('the content stays closed: mistakesReadable is still real membership', () => {
    assert.equal((SRC.match(/mistakesReadable=\{isMember\}/g) ?? []).length, 2);
  });
});

describe('GlossaryScreen: the fallback meter re-asks the probe before charging', () => {
  const body = callbackBody('gateDefinitionOpen');
  it('a gateway that is there takes the open (one charge, full text, session cache)', () => {
    const probe = body.indexOf("(await probeGateway()) === 'deployed'");
    const consume = body.indexOf('consumeGlossary(capMode)');
    assert.ok(probe > 0, 'no re-probe in the fallback path');
    assert.ok(probe < consume, 're-probe must come before the fallback charge');
    const branch = body.slice(probe, body.indexOf('}', probe));
    assert.match(branch, /setGateway\('deployed'\)/);
    assert.match(branch, /return openViaGatewayRef\.current\(id\)/);
  });
  it('only for a reader the meter applies to, and not after a failed key mint', () => {
    const probe = body.indexOf("(await probeGateway()) === 'deployed'");
    assert.ok(body.indexOf('if (!capped) return true;') < probe);
    assert.match(body, /if \(!keyFailedOpen && \(await probeGateway\(\)\) === 'deployed'\)/);
    assert.match(SRC, /\[capped, capMode, serverMeters, keyFailedOpen\],/);
  });
});
