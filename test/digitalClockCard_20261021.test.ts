/**
 * Digital Lab, Module 8 (Errors & Limits) — the CLOCKING card (owner go
 * 2026-10-21). The blurb once promised "clocking" while only jitter was
 * taught; this card teaches it, to the wiring rule book (APPROVED v1):
 *   S5  one clock master; every other device follows it at the same rate.
 *   C9  word clock 75 Ω BNC · AES3 110 Ω XLR · S/PDIF 75 Ω RCA or optical
 *       TOSLINK · AES3id 75 Ω BNC.
 *   C12 Dante/AES67 over the network (PTP).
 * Plus what goes wrong with two masters or a wrong rate (clicks, pops,
 * dropouts — not just jitter). Plain words, reading grade ≤ 9.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { CLOCKING_CARD, CLOCKING_CHECK, clockingCardText } from '../src/screens/lab/digital/modules/clockingCard.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('the clocking card lives in the jitter module (Errors & Limits)', () => {
  const s = read('src/screens/lab/digital/modules/modDac.tsx');
  const errors = s.slice(s.indexOf('export function ErrorsModule'), s.indexOf('const local = StyleSheet.create'));
  it('ErrorsModule renders the card and its check, after the jitter reading and before the charter', () => {
    assert.ok(errors.length > 0);
    const card = errors.indexOf('<PanelHead title={CLOCKING_CARD.title}');
    assert.ok(card > errors.indexOf('Jitter is timing variation of the sampling instants'), 'after the jitter reading');
    assert.ok(card < errors.indexOf('MODULE 8 · MYTH vs REALITY'), 'before the charter panel');
    assert.match(errors, /\{CLOCKING_CARD\.intro\}/);
    assert.match(errors, /CLOCKING_CARD\.ways\.map/);
    assert.match(errors, /\{CLOCKING_CARD\.wrong\}/);
    assert.match(errors, /<CheckQuestion spec=\{CLOCKING_CHECK\} \/>/);
  });
  it('the module blurb promises the clock sharing it now teaches (and still names jitter)', () => {
    const line = read('src/screens/lab/digital/modules/registry.ts').split('\n').find((l) => l.includes("id: 'errors'"))!;
    assert.match(line, /jitter \(timing errors in the sample clock\)/);
    assert.match(line, /how devices share one clock/);
  });
  it('its ⓘ opens a real glossary entry', () => {
    assert.equal(CLOCKING_CARD.helpKey, 'clocking');
    const c = read('src/features/lab/guidedLessons/content.ts');
    assert.match(c, /\{ key: 'clocking', name: 'Clocking', definition: 'A digital system has one clock master\./);
  });
});

describe('what the card teaches (rule book S5, C9, C12)', () => {
  const ways = Object.fromEntries(CLOCKING_CARD.ways.map((w) => [w.label, w.text]));
  it('S5: one clock master, every other device follows at the same sample rate', () => {
    assert.match(CLOCKING_CARD.intro, /a digital system has one clock master\./);
    assert.match(CLOCKING_CARD.intro, /Every other device follows that master, at the same sample rate\./);
  });
  it('C9: word clock is 75 Ω coax on BNC, with termination per the manual', () => {
    assert.match(ways['WORD CLOCK'], /75 Ω coax with BNC plugs/);
    assert.match(ways['WORD CLOCK'], /termination/);
    assert.match(ways['WORD CLOCK'], /manual/);
  });
  it('C9: AES3 110 Ω XLR; S/PDIF 75 Ω coax RCA or optical TOSLINK; AES3id 75 Ω BNC', () => {
    const t = ways['CLOCK INSIDE THE AUDIO'];
    assert.match(t, /AES3 uses 110 Ω cable with XLR plugs/);
    assert.match(t, /plain mic cable is the wrong cable for AES3 over long runs/);
    assert.match(t, /S\/PDIF uses 75 Ω coax with RCA plugs, or light through an optical \(TOSLINK\) cable/);
    assert.match(t, /AES3id uses 75 Ω coax with BNC plugs/);
  });
  it('C12: Dante/AES67 keep time over the network (PTP)', () => {
    assert.match(ways['OVER A NETWORK'], /Dante and AES67 send audio over Ethernet/);
    assert.match(ways['OVER A NETWORK'], /PTP/);
  });
  it('two masters / wrong rate: clicks, pops, dropouts — named as more than jitter', () => {
    assert.match(CLOCKING_CARD.wrong, /two masters, or a device set to the wrong sample rate/);
    assert.match(CLOCKING_CARD.wrong, /clicks, pops or short dropouts/);
    assert.match(CLOCKING_CARD.wrong, /bigger fault than jitter/);
  });
  it('the check: two masters → clicks, pops or dropouts', () => {
    assert.equal(CLOCKING_CHECK.options[CLOCKING_CHECK.correctIdx], 'Clicks, pops or short dropouts');
    assert.match(CLOCKING_CHECK.reveal, /Pick one master/);
  });
});

describe('plain words', () => {
  const t = clockingCardText();
  it('reading grade ≤ 9 (Flesch–Kincaid, the repo’s formula)', () => {
    const words = t.replace(/[()—:,.]/g, ' ').split(/\s+/).filter((w) => /[a-z]/i.test(w));
    const sentences = t.split(/[.!?](\s|$)/).filter((s) => s && s.trim().length > 1).length;
    const syl = (w: string) => {
      const s = w.toLowerCase().replace(/[^a-z]/g, '');
      if (s.length <= 3) return 1;
      const m = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
      return Math.max(1, m ? m.length : 1);
    };
    const syllables = words.reduce((a, w) => a + syl(w), 0);
    const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
    assert.ok(grade <= 9, `grade ${grade.toFixed(1)}`);
  });
  it('"most/usually" for conventions; no gear maker names', () => {
    assert.match(t, /Most of the time/);
    assert.match(t, /usually/);
    assert.doesNotMatch(t, /Audinate|Apogee|Antelope|RME|Focusrite|Universal Audio|Avid|Yamaha|Behringer|Midas|Neutrik|Canare|Belden|Mogami|Sony|Philips|Toshiba/i);
  });
});
