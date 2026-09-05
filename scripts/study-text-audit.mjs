#!/usr/bin/env node
/**
 * Study-method TEXT audit (owner brief 2026-09-05): run the app's REAL sentence
 * rules over EVERY active v3 topic's glossary rows and flag the ways a
 * Flashcard / Fill-in-the-Blank / Matching item can go wrong:
 *   • the answer is already written in the question (exact term, its word
 *     variants, or a word of a multi-word answer),
 *   • there is no way to know what is being asked (FIB sentence that never
 *     contains the term → no blank; too-short clues),
 *   • broken rows (empty / placeholder / self-referential definitions,
 *     duplicate terms in a topic).
 *
 * Read-only against Supabase through PostgREST with the PUBLISHABLE key from
 * `.env` (the same anon reads the app makes). No writes anywhere.
 *
 *   node scripts/study-text-audit.mjs baseline     → docs/study_text_audit_baseline.json
 *   node scripts/study-text-audit.mjs after        → docs/study_text_audit_after.json
 *   node scripts/study-text-audit.mjs after --pick → also prints the 15 seeded-random topics
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  splitSentences,
  termLeakPatterns,
  findLeaks,
  findSecondaryLeaks,
  matchingClueV2,
  fibSentence,
} from '../src/features/study/sentences.ts';

const V3 = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
const label = process.argv[2] ?? 'baseline';
const wantPick = process.argv.includes('--pick');

// ---- env ------------------------------------------------------------------
const env = Object.fromEntries(
  readFileSync(resolve('.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) throw new Error('EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY missing in .env');

async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=none' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ---- helpers mirroring the SCREENS' current behaviour -----------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** FillInBlankScreen.blankOut: the RAW term (parenthetical included), no word
 *  boundary, case-insensitive substring. */
const blankOutHits = (term, sentence) => new RegExp(escapeRe(term), 'i').test(sentence);
const currentMatchingLeaks = (term, s) => termLeakPatterns(term).some((re) => ((re.lastIndex = 0), re.test(s)));
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const PLACEHOLDER = /\b(tbd|todo|lorem|placeholder|coming soon|to be (written|added))\b|^\s*[-–—.]*\s*$/i;

// ---- seeded random (reproducible topic picks) ------------------------------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- run --------------------------------------------------------------------
const topics = await rest(
  `achievements?select=id,name,global_sequence,field,subject&curriculum_version_id=eq.${V3}&is_active=eq.true&order=global_sequence`,
);
const report = { label, generatedAt: new Date().toISOString(), topicCount: topics.length, topics: [], totals: {} };
const totals = {
  items: 0, topicsWithRows: 0,
  fc_emptyDef: 0, fc_placeholder: 0, fc_defIsTerm: 0, fc_dupTerm: 0,
  fib_noBlankAlways: 0, fib_noBlankSometimes: 0, fib_secondaryLeakAny: 0, fib_secondaryLeakAlways: 0,
  fib_v2_trailingBlank: 0, fib_v2_secondaryLeak: 0,
  m_currentLeaksV2: 0, m_fallbackMasked: 0, m_clueShort: 0, m_otherTermInClue: 0,
  m_v2_masked: 0, m_v2_hardLeak: 0, m_v2_partialLeft: 0, m_v2_otherTermInClue: 0, m_v2_otherOnSameBoard: 0,
};
const examples = { fib_noBlank: [], fib_secondary: [], m_currentLeaksV2: [], m_otherTerm: [], unrescuable: [] };
const pushEx = (arr, ex) => { if (arr.length < 40) arr.push(ex); };
/** Rows only the owner can fix (DB is frozen) — kept UNCAPPED so the list is complete. */
const corpusRows = [];
totals.corpus_unrescuable = 0;

for (const t of topics) {
  const rows = await rest(
    `glossary_study_v?select=glossary_id,term,definition,plain_english&achievement_id=eq.${t.id}&limit=5000`,
  );
  const items = rows.map((r) => ({ id: r.glossary_id, term: (r.term ?? '').trim(), definition: (r.definition ?? '').trim() }));
  const tr = { id: t.id, gs: t.global_sequence, name: t.name, field: t.field, subject: t.subject, items: items.length, flags: {}, worst: [] };
  if (items.length === 0) { report.topics.push(tr); continue; }
  totals.topicsWithRows++;
  const termsLower = items.map((i) => i.term.toLowerCase());
  const seen = new Map();
  const otherTermRes = items.map((i) => new RegExp(`\\b${escapeRe(i.term.replace(/\s*\([^)]*\)\s*$/, ''))}\\b`, 'i'));
  const f = (k) => { tr.flags[k] = (tr.flags[k] ?? 0) + 1; totals[k]++; };

  items.forEach((it, idx) => {
    totals.items++;
    const { term, definition } = it;
    // ---- flashcards ----
    const row = (issue, text) => corpusRows.push({ topic: `${t.global_sequence} ${t.name}`, glossaryId: it.id, term, issue, text });
    if (!definition || definition.length < 20) { f('fc_emptyDef'); row('empty/short definition', definition); }
    if (definition && PLACEHOLDER.test(definition)) { f('fc_placeholder'); row('placeholder wording in definition', definition.slice(0, 160)); }
    if (definition && definition.toLowerCase() === term.toLowerCase()) { f('fc_defIsTerm'); row('definition is just the term', definition); }
    const tl = term.toLowerCase();
    if (seen.has(tl)) { f('fc_dupTerm'); row('duplicate term in topic', definition.slice(0, 100)); } else seen.set(tl, true);

    const sentences = splitSentences(definition);
    if (sentences.length === 0) return;

    // ---- fill-in-the-blank, CURRENT rule (random sentence, raw-term blankOut) ----
    const withBlank = sentences.filter((s) => blankOutHits(term, s));
    if (withBlank.length === 0) { f('fib_noBlankAlways'); pushEx(examples.fib_noBlank, { topic: t.name, term, sentence: sentences[0] }); }
    else if (withBlank.length < sentences.length) f('fib_noBlankSometimes');
    const secondary = sentences.map((s) => findSecondaryLeaks(term, s));
    const anySecondary = secondary.some((h) => h.length > 0);
    if (anySecondary) {
      f('fib_secondaryLeakAny');
      const i = secondary.findIndex((h) => h.length > 0);
      pushEx(examples.fib_secondary, { topic: t.name, term, sentence: sentences[i], leaks: secondary[i].map((h) => `${h.kind}:${h.match}`) });
    }
    if (secondary.every((h) => h.length > 0)) f('fib_secondaryLeakAlways');

    // ---- fill-in-the-blank, IMPROVED rule (fibSentence) ----
    const fb = fibSentence(term, definition);
    // hasBlank:false = the sentence DESCRIBES the answer without naming it; the
    // screen appends a trailing blank, so a blank is always visible.
    if (!fb.hasBlank) f('fib_v2_trailingBlank');
    if (findSecondaryLeaks(term, fb.masked).length > 0) f('fib_v2_secondaryLeak');

    // ---- matching, CURRENT rule ----
    const cleanCurrent = sentences.filter((s) => !currentMatchingLeaks(term, s));
    const cleanV2 = sentences.filter((s) => findLeaks(term, s).length === 0);
    if (cleanCurrent.length === 0) f('m_fallbackMasked');
    if (cleanCurrent.length > 0 && cleanCurrent.some((s) => findLeaks(term, s).length > 0)) {
      f('m_currentLeaksV2');
      const s = cleanCurrent.find((x) => findLeaks(term, x).length > 0);
      pushEx(examples.m_currentLeaksV2, { topic: t.name, term, clue: s, leaks: findLeaks(term, s).map((h) => `${h.kind}:${h.match}`) });
    }
    const clueCandidates = cleanCurrent.length > 0 ? cleanCurrent : sentences;
    if (clueCandidates.every((s) => s.length < 40 || words(s) < 6)) f('m_clueShort');
    const clueWithOther = clueCandidates.find((s) => otherTermRes.some((re, j) => j !== idx && termsLower[j] !== tl && re.test(s)));
    if (clueWithOther) { f('m_otherTermInClue'); pushEx(examples.m_otherTerm, { topic: t.name, term, clue: clueWithOther }); }

    // ---- matching, IMPROVED (tiered) rule — what MatchingScreen now shows ----
    // MatchingScreen passes the 4-pair BOARD's terms (consecutive slices of 4).
    const v2 = matchingClueV2(term, definition, items.slice(Math.floor(idx / 4) * 4, Math.floor(idx / 4) * 4 + 4).map((i) => i.term));
    if (v2.masked) f('m_v2_masked');
    if (v2.partialsLeft > 0) f('m_v2_partialLeft');
    if (findLeaks(term, v2.clue).some((h) => h.kind !== 'partial')) f('m_v2_hardLeak');
    if (otherTermRes.some((re, j) => j !== idx && termsLower[j] !== tl && re.test(v2.clue))) f('m_v2_otherTermInClue');
    // Only a term on the SAME 4-pair board can actually be mis-matched
    // (MatchingScreen boards = consecutive slices of 4 in fetch order).
    const boardStart = Math.floor(idx / 4) * 4;
    if (otherTermRes.some((re, j) => j !== idx && j >= boardStart && j < boardStart + 4 && termsLower[j] !== tl && re.test(v2.clue))) f('m_v2_otherOnSameBoard');

    // corpus-fix candidates: rules cannot rescue these
    if (findLeaks(term, v2.clue).some((h) => h.kind !== 'partial') || (v2.masked && v2.clue.replace(/___/g, '').trim().split(/\s+/).length < 4)) {
      f('corpus_unrescuable');
      pushEx(examples.unrescuable, { topic: t.name, term, clue: v2.clue });
    }
  });

  tr.worst = Object.entries(tr.flags).sort((a, b) => b[1] - a[1]).slice(0, 4);
  report.topics.push(tr);
  process.stderr.write(`• ${t.global_sequence} ${t.name}: ${items.length} items ${JSON.stringify(tr.flags)}\n`);
}

report.totals = totals;
report.examples = examples;
report.corpusRows = corpusRows;
if (wantPick) {
  const rnd = mulberry32(20260905);
  const pool = report.topics.filter((x) => x.items > 0);
  const picks = [];
  while (picks.length < 15 && pool.length) picks.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  report.picks = picks.map((p) => ({ gs: p.gs, name: p.name, id: p.id, items: p.items, subject: p.subject }));
}
const out = resolve(`docs/study_text_audit_${label}.json`);
writeFileSync(out, JSON.stringify(report, null, 2));

// ---- markdown summary to stdout --------------------------------------------
const pct = (n) => `${((100 * n) / Math.max(1, totals.items)).toFixed(1)}%`;
console.log(`# Study text audit — ${label} (${topics.length} topics, ${totals.topicsWithRows} with rows, ${totals.items} items)\n`);
console.log('| Pattern | Items | Share |\n|---|---|---|');
for (const [k, v] of Object.entries(totals)) if (!['items', 'topicsWithRows'].includes(k)) console.log(`| ${k} | ${v} | ${pct(v)} |`);
console.log(`\nJSON: ${out}`);
if (corpusRows.length) {
  console.log(`\n## Corpus rows for the owner (${corpusRows.length})`);
  for (const r of corpusRows) console.log(`- ${r.topic} · "${r.term}" · ${r.issue} · ${r.glossaryId}${r.text ? ` · "${r.text}"` : ''}`);
}
if (report.picks) {
  console.log('\n## 15 seeded-random topics (seed 20260905)');
  for (const p of report.picks) console.log(`- gs ${p.gs} · ${p.name} (${p.subject}) · ${p.items} items · ${p.id}`);
}
