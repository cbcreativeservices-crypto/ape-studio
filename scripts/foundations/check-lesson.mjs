// Topic Foundations step 5: mechanical check (docs/foundations/TOPIC_FOUNDATIONS_STANDARD.md §5, §7, §8).
// Usage: node scripts/foundations/check-lesson.mjs <lesson.md> [terms.json]
//   terms.json = array of the topic's live glossary terms (strings); enables the named-term check.
// Exit 0 = pass (warnings allowed), 1 = at least one failure.
import { readFileSync } from 'node:fs';

const [, , lessonPath, termsPath] = process.argv;
if (!lessonPath) { console.error('usage: check-lesson.mjs <lesson.md> [terms.json]'); process.exit(2); }

const text = readFileSync(lessonPath, 'utf8').replace(/\r\n/g, '\n').trim();
const [title, ...rest] = text.split('\n');
const body = rest.join('\n').trim();
const fails = [];
const warns = [];

if (!/^Topic Foundations: \S/.test(title)) fails.push(`title line must start "Topic Foundations: " (got "${title}")`);
if (rest[0] !== '') fails.push('line 2 must be blank');

const paras = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
if (paras.length < 6 || paras.length > 8) fails.push(`paragraphs ${paras.length} (need 6–8)`);
if (paras.some((p) => p.includes('\n'))) fails.push('a paragraph contains a line break');

const words = body.split(/\s+/).filter(Boolean).length;
if (words < 400 || words > 480) fails.push(`words ${words} (need 400–480)`);

if (/^\s*([-*•]|#|\d+\.)\s/m.test(body)) fails.push('list or heading marker found');
if (/\*\*|__|\[[^\]]+\]\(/.test(body)) fails.push('bold or link markup found');
if (/\d/.test(body)) fails.push(`digit found: "${body.match(/.{0,20}\d.{0,20}/)[0]}"`);
if (/!/.test(body)) fails.push('exclamation mark found');

const sentences = body.split(/(?<=[.?])\s+/).filter(Boolean);
const lens = sentences.map((s) => s.split(/\s+/).length);
const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
if (avg > 15) fails.push(`average sentence ${avg.toFixed(1)} words (need ≤15)`);
const over20 = lens.filter((n) => n > 20).length;
if (over20 > 8) fails.push(`${over20} sentences over 20 words (need ≤8)`);
sentences.forEach((s, i) => { if (lens[i] > 30) warns.push(`long sentence (${lens[i]} words): "${s.slice(0, 70)}…"`); });

// §8 banned words (whole words, case-insensitive). Grows with every owner note.
const BANNED = [
  'cousin', 'engine', 'gear', 'bits', 'tries', 'ride', 'rides', 'riding', 'grab', 'grabs', 'lid', 'slice', 'slices',
  'punchy', 'punch', 'warm', 'warmer', 'bright', 'brighter', 'harsh', 'harsher', 'fat', 'sweet spot', 'day one',
  'set it off', 'back out', 'use it up', 'uses it up', 'travel together', 'under the hood', 'rule of thumb', 'go-to',
  'tricky', 'trickier', 'master', 'mastering the', 'be able to', "you'll", 'studies show', 'research shows',
];
// Literal uses that are allowed (batch 1, 2026-11-03): warm/cool air, digital bits.
const literal = body.replace(/\bwarm(er)? (air|layers?|and cool)\b/gi, '').replace(/\bbits?\b/gi, (m) => (/\bbit depth\b|\bdigital\b/i.test(body) ? '' : m));
for (const w of BANNED) {
  const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  if (re.test(literal)) fails.push(`banned word/phrase: "${w}"`);
}
// Similes (batch 1): "like a/an ..." comparisons are not allowed; "like the keys of a piano" style examples are flagged for review.
for (const m of body.matchAll(/\b(?:like|as if|as though) (?:a|an) [a-z]+(?: [a-z]+)?/gi)) warns.push(`possible simile/comparison: "${m[0]}"`);
// Abbreviations and regional references (batch 1).
for (const m of body.matchAll(/\b[A-Z]{2,}s?\b/g)) fails.push(`abbreviation "${m[0]}" (spell it out)`);
for (const r of ['North America', 'Europe', 'European', 'the United States', 'the US', 'the UK', 'Britain', 'British', 'American']) if (body.includes(r)) warns.push(`regional reference "${r}" (allowed only if the topic is about a region)`);
if (/\bpicture (a|an|the|your|this)\b/i.test(body)) fails.push('"picture" used as a verb (use "imagine")');
if (/\bsmooth(er|ly)?\b/i.test(body)) warns.push('"smooth" found: only allowed in a literal, non-sound sense');

// US spelling (common UK forms).
const UK = ['colour', 'behaviour', 'centre', 'metre', 'analyse', 'organise', 'recognise', 'realise', 'programme', 'favour', 'labour', 'licence', 'defence', 'travelling', 'modelling', 'labelled', 'grey'];
for (const w of UK) if (new RegExp(`\\b${w}`, 'i').test(body)) fails.push(`UK spelling: "${w}"`);

// Brand / company names (starter list; product names in the glossary are intentional but never belong in a lesson).
const BRANDS = ['Pro Tools', 'Avid', 'Logic Pro', 'Ableton', 'Cubase', 'Shure', 'Neumann', 'Sennheiser', 'Yamaha', 'Apple', 'Microsoft', 'Dolby', 'Fender', 'Gibson', 'Universal Audio', 'Waves', 'iZotope', 'Microflown', 'Teletronix', 'UREI', 'Fairchild', 'Focusrite', 'Behringer', 'Roland', 'Moog', 'Korg', 'JBL', 'Bose', 'Meyer', 'L-Acoustics', 'd&b', 'QSC', 'Crown', 'Steinberg', 'Spotify', 'YouTube', 'Netflix', 'OSHA', 'NIOSH', 'AES', 'IEC', 'ISO', 'EBU', 'ITU'];
for (const b of BRANDS) if (new RegExp(`\\b${b.replace(/[&]/g, '\\&')}\\b`).test(body)) fails.push(`brand/organization name: "${b}"`);

// Capitalized words mid-sentence (possible names) -> warning for the human read.
const caps = new Set();
for (const s of sentences) {
  s.split(/\s+/).slice(1).forEach((w) => { const m = w.match(/^["(]?([A-Z][a-zA-Z-]+)/); if (m && !['I'].includes(m[1])) caps.add(m[1]); });
}
if (caps.size) warns.push(`capitalized words mid-sentence (check they are not names): ${[...caps].join(', ')}`);

// Named terms must exist in the topic's live list.
const named = [...body.matchAll(/\b(?:is|are) called (?:the |a |an |your )?([^.,;:]+?)[.,;:]/g)].map((m) => m[1].trim());
if (termsPath) {
  const terms = JSON.parse(readFileSync(termsPath, 'utf8')).map((t) => t.toLowerCase());
  for (const n of named) {
    const ln = n.toLowerCase();
    const hit = terms.some((t) => t === ln || t.replace(/\s*\([^)]*\)/g, '') === ln || t.startsWith(ln + ' (') || t === ln + 's' || t + 's' === ln);
    if (!hit) warns.push(`named term "${n}" not found exactly in the topic's list (check a close match exists)`);
  }
}

console.log(JSON.stringify({ file: lessonPath, words, paragraphs: paras.length, sentences: sentences.length, avgSentence: +avg.toFixed(1), over20, named, fails, warns }, null, 1));
process.exit(fails.length ? 1 : 0);
