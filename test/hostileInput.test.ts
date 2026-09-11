/**
 * HOSTILE / HUGE / UNICODE STRING tests (edge-case QA night 2026-09-11).
 *
 * Everything a member can type into a box that the app then has to lay out,
 * publish, or print: a name, an About line, a search query. The question here
 * is not "is the maths right" but "what happens when the string is enormous,
 * is all emoji, reads right-to-left, or is a single unbreakable word".
 *
 * The certificate exporter is the sharp edge. It REFUSES rather than clip — a
 * credential with a silently truncated name is worse than no PDF — so the
 * tests below pin that refusal AND the exact length at which it starts, which
 * is the number the profile screen needs a cap for.
 *
 * LOADER NOTE: certificateHtml reaches `qrcode` through a runtime
 * optionalModule and uses extensionless relative imports, so this file installs
 * a resolve hook and imports it dynamically, local to this test process.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  LIMITS, aboutIsSafe, aboutProblem, mapLegacyInterests, readableError, slugify,
} from '../src/features/directory/rules.ts';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { buildCertificateHtml, escapeHtml, certificateNameFits } =
  await import('../src/features/credentials/certificateHtml.ts');

// ── Some strings that break naive code ──────────────────────────────────────
const EMOJI = '😀'; // one astral char = 2 UTF-16 code units
const RTL = 'محمد عبد الله'; // right-to-left
const COMBINING = 'Zoé Nguyẽn'; // base letters + combining marks
const ZALGO = 'A' + '́'.repeat(80); // one letter under 80 combining marks

// ═══════════════════════════════════════════════════════════════════════════
// The certificate exporter — the only place a user string becomes a PDF
// ═══════════════════════════════════════════════════════════════════════════

const CERT = {
  holderName: 'Alex Rivera',
  credentialName: 'Certificate in Audio Fundamentals',
  awardType: 'certificate' as const,
  earnedAt: '2026-09-11',
  qrToken: null,
  verifyUrl: null,
};

const buildWithName = (holderName: string | null) =>
  buildCertificateHtml({ ...CERT, holderName });

describe('certificate — ordinary and awkward names all render', () => {
  it('a plain two-word name produces HTML containing that name', () => {
    const html = buildWithName('Alex Rivera');
    assert.ok(html.includes('Alex') && html.includes('Rivera'));
  });
  it('a MISSING name does not crash the exporter', () => assert.doesNotThrow(() => buildWithName(null)));
  it('an EMPTY name does not crash the exporter', () => assert.doesNotThrow(() => buildWithName('')));
  it('a whitespace-only name does not crash the exporter', () =>
    assert.doesNotThrow(() => buildWithName('     ')));
  it('a name with emoji renders (astral characters get the fallback advance)', () =>
    assert.doesNotThrow(() => buildWithName(`Ana ${EMOJI} Rivera`)));
  it('a right-to-left name renders', () => assert.doesNotThrow(() => buildWithName(RTL)));
  it('a name with combining marks renders — the marks cost zero width, as intended', () =>
    assert.doesNotThrow(() => buildWithName(COMBINING)));
  it('a zalgo-stacked name still fits, because combining marks add no advance', () =>
    assert.doesNotThrow(() => buildWithName(ZALGO)));
  it('a hyphenated double-barrel name renders', () =>
    assert.doesNotThrow(() => buildWithName('María José Fernández-Ortiz')));
});

describe('certificate — the two-line layout is a HARD limit, not a truncation', () => {
  // Deliberate design (certificateHtml.ts:83): "Keep text intact: no ellipses,
  // truncation, hidden overflow, or invented hyphens." A credential with a
  // silently clipped name would be worse than no PDF. These tests pin WHERE
  // the refusal starts, because that is the number the profile input needs.
  const fits = (name: string) => {
    try { buildWithName(name); return true; } catch { return false; }
  };

  it('a SINGLE unbreakable word fits up to 26 characters', () => {
    assert.ok(fits('W'.repeat(26)), '26 characters should still fit');
  });
  it('a SINGLE unbreakable word of 27+ characters is REFUSED — there is no second line to use', () => {
    assert.ok(!fits('W'.repeat(27)), '27 characters should be refused');
    assert.throws(() => buildWithName('W'.repeat(40)), RangeError);
  });
  it('a name WITH spaces fits far longer, because it can break across two lines', () => {
    assert.ok(fits('Willia '.repeat(18).trim()), 'a 125-character spaced name should fit');
  });
  it('even a spaced name is refused once two lines cannot hold it', () => {
    assert.ok(!fits('Willia '.repeat(30).trim()));
  });
  it('the refusal is a RangeError whose message names the fields to review', () => {
    assert.throws(() => buildWithName('W'.repeat(60)), (err: unknown) => {
      assert.ok(err instanceof RangeError);
      assert.match(err.message, /registry name|credential title/i);
      // It must be explicit that nothing clipped was produced.
      assert.match(err.message, /truncated|clipped/i);
      return true;
    });
  });
  it('a long single-word CREDENTIAL title is refused the same way', () => {
    assert.throws(
      () => buildCertificateHtml({ ...CERT, credentialName: 'Verylongsingleword'.repeat(6) }),
      RangeError,
    );
  });
});

describe('certificate — entry-time validation can never disagree with export', () => {
  // The profile screen rejects an unengravable registry name while the person
  // is still typing. If certificateNameFits ever said yes where the export says
  // no, we would be back to the original defect: a certificate that is earned
  // and permanently un-downloadable. Both sides must measure identically.
  const exportAccepts = (name: string) => {
    try { buildWithName(name); return true; } catch { return false; }
  };

  const CASES = [
    '', '   ', 'A', 'Rachel A. Booth', 'María José Fernández-Ortiz', RTL,
    `Anna ${EMOJI} Lee`, 'W'.repeat(25), 'W'.repeat(26), 'W'.repeat(27), 'W'.repeat(40),
    'W'.repeat(60), 'Willia '.repeat(18).trim(), 'Willia '.repeat(30).trim(),
    '  Rachel   A.   Booth  ', 'Jean-Baptiste Emmanuel Zorg the Considerably Extended',
    'Kátia Wu', // decomposed accent — NFC-normalised before measuring
  ];

  for (const name of CASES) {
    it(`agrees with the export for ${JSON.stringify(name.slice(0, 34))}`, () => {
      assert.equal(
        certificateNameFits(name),
        exportAccepts(name),
        'the entry check and the export disagree — one of them would strand a member',
      );
    });
  }

  it('an empty name is allowed through (the export falls back to a generated label)', () => {
    assert.equal(certificateNameFits(''), true);
    assert.equal(certificateNameFits('   '), true);
  });

  it('still pins the 26/27 single-word boundary from the entry side', () => {
    assert.equal(certificateNameFits('W'.repeat(26)), true);
    assert.equal(certificateNameFits('W'.repeat(27)), false);
  });
});

describe('certificate — a user string can never inject markup into the PDF', () => {
  it('escapeHtml neutralises every dangerous character', () => {
    const out = escapeHtml(`<script>alert("x")&'`);
    assert.ok(!out.includes('<script'), out);
    for (const ch of ['<', '>']) assert.ok(!out.includes(ch), `raw ${ch} survived: ${out}`);
  });
  it('escapeHtml survives null and undefined without printing them raw as markup', () => {
    for (const v of [null, undefined, 0, false]) assert.equal(typeof escapeHtml(v), 'string');
  });
  it('a name containing a script tag reaches the HTML escaped, not live', () => {
    const html = buildWithName('Al <b>Ri</b>');
    assert.ok(!html.includes('Al <b>Ri</b>'), 'the raw tag must not survive');
    assert.ok(html.includes('&lt;b&gt;'), 'it must appear escaped instead');
  });
});

describe('certificate — a malformed earned date never prints as "Invalid Date"', () => {
  const buildWithDate = (earnedAt: string | null) =>
    buildCertificateHtml({ ...CERT, earnedAt });
  // The page embeds base64 fonts, so a substring search for "NaN" hits the
  // font data. Compare against the NO-DATE build instead: a date the exporter
  // cannot trust must be dropped, producing byte-identical HTML.
  const noDate = buildWithDate(null);

  for (const bad of ['', 'not-a-date', '2026-13-45', '2026-02-30', '11/09/2026', '0000-00-00', '2026-09-11T99:99']) {
    it(`drops ${JSON.stringify(bad)} entirely rather than printing a nonsense date`, () =>
      assert.equal(buildWithDate(bad), noDate, `${JSON.stringify(bad)} changed the certificate`));
  }
  it('a real date DOES appear, so the guard above is not just hiding everything', () => {
    const good = buildWithDate('2026-09-11');
    assert.notEqual(good, noDate, 'a valid date must actually print');
    assert.ok(good.includes('2026'), 'the year must appear');
  });
  it('a valid date with a time and zone also prints', () =>
    assert.notEqual(buildWithDate('2026-09-11T10:30:00Z'), noDate));
});

// ═══════════════════════════════════════════════════════════════════════════
// The public About field — the one user string the app publishes
// ═══════════════════════════════════════════════════════════════════════════

describe('About My Work — enormous and exotic input', () => {
  it('exactly at the cap is allowed; one over is refused', () => {
    assert.equal(aboutIsSafe('a'.repeat(LIMITS.about)), true);
    assert.equal(aboutIsSafe('a'.repeat(LIMITS.about + 1)), false);
  });
  it('a megabyte of text is refused, not processed and published', () => {
    assert.equal(aboutIsSafe('a'.repeat(1_000_000)), false);
    assert.match(aboutProblem('a'.repeat(1_000_000)) ?? '', /characters/);
  });
  it('a megabyte of text does not hang the regex checks (runs well under a second)', () => {
    const t0 = Date.now();
    aboutIsSafe('a b '.repeat(250_000));
    assert.ok(Date.now() - t0 < 1000, 'About validation must not stall the keystroke path');
  });
  it('the cap counts UTF-16 code units, so 100 emoji already fill a 200-unit budget', () => {
    // Worth knowing: Postgres length() counts CODE POINTS, so the mirrored
    // server check is LOOSER here. The client being the stricter of the two
    // fails safe — a member is stopped before the server would refuse.
    assert.equal(aboutIsSafe(EMOJI.repeat(100)), true);
    assert.equal(aboutIsSafe(EMOJI.repeat(101)), false);
  });
  it('right-to-left and combining-mark text is accepted as ordinary prose', () => {
    assert.equal(aboutIsSafe(RTL), true);
    assert.equal(aboutIsSafe(COMBINING), true);
  });
  it('whitespace-only About counts as empty, not as content', () =>
    assert.equal(aboutIsSafe('   \n\t  '), true));
  it('a clean About has no problem to report', () =>
    assert.equal(aboutProblem('Live sound engineer, mostly theatre.'), null));
  it('an email hidden inside an otherwise enormous About is still caught', () =>
    assert.equal(aboutIsSafe('a'.repeat(150) + ' me@example.com'), false));
});

describe('slugify — labels that contain nothing sluggable', () => {
  it('an empty label slugs to an empty string rather than a stray separator', () =>
    assert.equal(slugify(''), ''));
  it('a label of only separators does not leave a leading or trailing hyphen', () => {
    assert.equal(slugify('---'), '');
    assert.equal(slugify('   &  '), '');
  });
  it('emoji and right-to-left labels slug to empty — they carry no ASCII to keep', () => {
    assert.equal(slugify(EMOJI.repeat(3)), '');
    assert.equal(slugify(RTL), '');
  });
  it('accented Latin loses the accented letter but never emits a double separator', () => {
    const s = slugify('Café Sonido');
    assert.ok(!s.includes('--'), s);
    assert.ok(!s.startsWith('-') && !s.endsWith('-'), s);
  });
  it('a very long label slugs without hanging', () => {
    const s = slugify('Live Sound & Event Production '.repeat(2000));
    assert.ok(!s.startsWith('-') && !s.endsWith('-'));
  });
});

describe('mapLegacyInterests — nothing to migrate, and far too much', () => {
  it('an EMPTY interest list migrates to an empty profile, not to nulls', () => {
    const m = mapLegacyInterests([]);
    assert.deepEqual(m.areas, []);
    assert.deepEqual(m.specialties, []);
    assert.deepEqual(m.roles, []);
    assert.deepEqual(m.dropped, []);
    assert.equal(m.primaryArea, null);
  });
  it('a primary interest alone still produces a primary area', () => {
    const m = mapLegacyInterests([], 'Live Sound');
    assert.equal(m.primaryArea, 'live-sound-event-production');
  });
  it('a thousand duplicates collapse to one area, with nothing wrongly dropped', () => {
    const m = mapLegacyInterests(new Array(1000).fill('Live Sound'));
    assert.equal(m.areas.length, 1);
    assert.equal(m.specialties.length, 1);
    assert.equal(m.dropped.length, 0);
  });
  it('a list of pure garbage drops everything and keeps no phantom area', () => {
    const m = mapLegacyInterests(['', '   ', EMOJI, RTL]);
    assert.deepEqual(m.areas, []);
    assert.equal(m.primaryArea, null);
    assert.equal(m.dropped.length, 4);
  });
});

describe('readableError — a member never sees a blank or raw failure', () => {
  it('an undefined message becomes the generic apology', () =>
    assert.match(readableError(undefined), /went wrong/i));
  it('an EMPTY message becomes the generic apology, not an empty banner', () => {
    assert.match(readableError(''), /went wrong/i);
    assert.match(readableError('   '), /went wrong/i);
  });
  it('an unrecognised failure is passed through rather than given an invented cause', () =>
    assert.equal(readableError('constraint xyz_fkey violated'), 'constraint xyz_fkey violated'));
  it('every returned message is non-empty, whatever goes in', () => {
    for (const m of [undefined, '', '   ', '\n', 'boom', 'Failed to fetch'])
      assert.ok(readableError(m).trim().length > 0, `empty result for ${JSON.stringify(m)}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Code-unit vs code-point slicing — the bug class, stated as a rule
// ═══════════════════════════════════════════════════════════════════════════

describe('splitting a user string must not cut a character in half', () => {
  /** The GlossaryScreen two-tone term split, as it is now written. */
  const splitByCodePoint = (s: string) => {
    const chars = Array.from(s);
    const mid = Math.ceil(chars.length / 2);
    return [chars.slice(0, mid).join(''), chars.slice(mid).join('')];
  };
  /** The naive version it replaced. */
  const splitByCodeUnit = (s: string) => {
    const mid = Math.ceil(s.length / 2);
    return [s.slice(0, mid), s.slice(mid)];
  };
  const hasLoneSurrogate = (s: string) => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);

  it('the two halves always rejoin to the original', () => {
    for (const s of ['impedance', 'dB SPL', `${EMOJI}${EMOJI}${EMOJI}`, COMBINING, RTL, ZALGO])
      assert.equal(splitByCodePoint(s).join(''), s, s);
  });
  it('an all-ASCII term splits identically to the naive version — no behaviour change', () => {
    for (const s of ['impedance', 'phase cancellation', 'dB', 'Q'])
      assert.deepEqual(splitByCodePoint(s), splitByCodeUnit(s), s);
  });
  it('a term containing an astral character no longer yields a lone surrogate', () => {
    const s = `a${EMOJI}b`;
    assert.ok(hasLoneSurrogate(splitByCodeUnit(s)[0]), 'the naive split really was broken');
    for (const half of splitByCodePoint(s))
      assert.ok(!hasLoneSurrogate(half), `lone surrogate in ${JSON.stringify(half)}`);
  });
  it('neither half is ever a lone surrogate for any astral-bearing term', () => {
    for (const s of [EMOJI, `${EMOJI}x`, `x${EMOJI}`, `${EMOJI}${EMOJI}`, `ab${EMOJI}cd`])
      for (const half of splitByCodePoint(s))
        assert.ok(!hasLoneSurrogate(half), `${JSON.stringify(s)} → ${JSON.stringify(half)}`);
  });
});
