// Generates docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql FROM the
// editorial map in src/data/labRequirements.ts, so the backend seed and the
// app can never drift (test/labCertRequirements_20261013.test.ts fails when
// the committed SQL is not exactly what this produces).
//
// Run from the repo root:  node scripts/gen-lab-cert-seed.mjs
// (Node >= 22.15 strips the .ts types natively; the modules it loads import
// each other with explicit .ts extensions.)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SEED_PATH = join(ROOT, 'docs', 'APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql');

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** The full SQL text (LF line endings), built from the TS map. */
export async function buildSeedSql() {
  const { LAB_REQUIREMENTS_BY_SLUG } = await import('../src/data/labRequirements.ts');
  const { describeLabKey, allLabKeys } = await import('../src/data/labKeyCatalog.ts');

  const rows = [];
  const labs = new Map();
  // Every reportable key gets a row, required or not (else lab_not_found → endless retries).
  for (const info of allLabKeys()) labs.set(info.key, info);
  for (const [slug, reqs] of Object.entries(LAB_REQUIREMENTS_BY_SLUG)) {
    const type = slug.startsWith('cert-') ? 'certificate' : slug.startsWith('prog-') ? 'program' : null;
    if (!type) throw new Error(`gen-lab-cert-seed: slug ${slug} is neither cert- nor prog-`);
    const seen = new Set();
    for (const r of reqs) {
      if (seen.has(r.key)) throw new Error(`gen-lab-cert-seed: ${slug} lists ${r.key} twice`);
      seen.add(r.key);
      const info = describeLabKey(r.key);
      if (!info) throw new Error(`gen-lab-cert-seed: ${slug} → unknown lab key ${r.key}`);
      labs.set(info.key, info);
      rows.push({ type, slug, key: r.key, why: r.why });
    }
  }
  const areaOrder = { training: 0, miking: 1, mixing: 2, ear: 3 };
  const labRows = [...labs.values()].sort((a, b) => areaOrder[a.area] - areaOrder[b.area] || a.key.localeCompare(b.key));
  rows.sort((a, b) => a.type.localeCompare(b.type) || a.slug.localeCompare(b.slug));

  const out = [];
  out.push(
    '-- AP&E Studio — training labs / lessons each certificate and program REQUIRES',
    '-- (required labs unlock the final exam; owner 2026-10-13).',
    '--',
    '-- ⛔ GENERATED — do not edit by hand. Source: src/data/labRequirements.ts',
    '-- Regenerate: node scripts/gen-lab-cert-seed.mjs   (ratchet: test/labCertRequirements_20261013.test.ts)',
    '-- STATUS: PROPOSED — HOLD until the owner approves the map',
    '-- (Downloads\\2026-10-13_LAB_CERT_REQUIREMENTS_MAP.md).',
    '--',
    '-- Assumes (Comp A creates them):',
    '--   labs(id uuid primary key default gen_random_uuid(), key text unique not null, name text not null, area text not null)',
    '--   credential_lab_requirements(credential_type text, credential_id uuid, lab_id uuid, why text,',
    '--                               primary key (credential_type, credential_id, lab_id))',
    '-- Idempotent: labs are inserted ON CONFLICT (key) DO NOTHING; requirements are upserted, and any',
    '-- requirement row NOT in this file is deleted — the map is the whole truth.',
    '-- Aborts (nothing written) if any slug or lab key fails to resolve.',
    `-- ${labRows.length} labs rows, ${rows.length} requirement rows, ${Object.keys(LAB_REQUIREMENTS_BY_SLUG).length} credentials.`,
    '',
    'BEGIN;',
    '',
    '-- 1. Every lab / lesson key the app can report (required or not).',
    'INSERT INTO labs (key, name, area) VALUES',
    labRows.map((l) => `  (${q(l.key)}, ${q(l.name)}, ${q(l.area)})`).join(',\n'),
    'ON CONFLICT (key) DO NOTHING;',
    '',
    '-- 2. The requirements, staged by slug and key.',
    'CREATE TEMP TABLE _lab_req_stage (credential_type text, slug text, lab_key text, why text) ON COMMIT DROP;',
    'INSERT INTO _lab_req_stage (credential_type, slug, lab_key, why) VALUES',
    rows.map((r) => `  (${q(r.type)}, ${q(r.slug)}, ${q(r.key)}, ${q(r.why)})`).join(',\n') + ';',
    '',
    '-- 3. Refuse to half-apply: every staged slug and key must resolve.',
    'DO $$',
    'DECLARE missing text;',
    'BEGIN',
    '  SELECT string_agg(DISTINCT s.credential_type || \':\' || s.slug, \', \') INTO missing',
    '  FROM _lab_req_stage s',
    '  LEFT JOIN certificates c ON s.credential_type = \'certificate\' AND c.slug = s.slug',
    '  LEFT JOIN programs p ON s.credential_type = \'program\' AND p.slug = s.slug',
    '  WHERE coalesce(c.id, p.id) IS NULL;',
    '  IF missing IS NOT NULL THEN RAISE EXCEPTION \'lab requirements seed: unknown credential slug(s): %\', missing; END IF;',
    '  SELECT string_agg(DISTINCT s.lab_key, \', \') INTO missing',
    '  FROM _lab_req_stage s LEFT JOIN labs l ON l.key = s.lab_key',
    '  WHERE l.id IS NULL;',
    '  IF missing IS NOT NULL THEN RAISE EXCEPTION \'lab requirements seed: unknown lab key(s): %\', missing; END IF;',
    'END $$;',
    '',
    '-- 4. Resolve and upsert.',
    'CREATE TEMP TABLE _lab_req_resolved ON COMMIT DROP AS',
    'SELECT s.credential_type, coalesce(c.id, p.id) AS credential_id, l.id AS lab_id, s.why',
    'FROM _lab_req_stage s',
    'LEFT JOIN certificates c ON s.credential_type = \'certificate\' AND c.slug = s.slug',
    'LEFT JOIN programs p ON s.credential_type = \'program\' AND p.slug = s.slug',
    'JOIN labs l ON l.key = s.lab_key;',
    '',
    'INSERT INTO credential_lab_requirements (credential_type, credential_id, lab_id, why)',
    'SELECT credential_type, credential_id, lab_id, why FROM _lab_req_resolved',
    'ON CONFLICT (credential_type, credential_id, lab_id) DO UPDATE SET why = EXCLUDED.why;',
    '',
    '-- 5. The map is the whole truth: drop any requirement it no longer lists.',
    'DELETE FROM credential_lab_requirements r',
    'WHERE NOT EXISTS (',
    '  SELECT 1 FROM _lab_req_resolved x',
    '  WHERE x.credential_type = r.credential_type AND x.credential_id = r.credential_id AND x.lab_id = r.lab_id',
    ');',
    '',
    'COMMIT;',
    '',
  );
  return out.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sql = await buildSeedSql();
  writeFileSync(SEED_PATH, sql, 'utf8');
  console.log(`wrote ${SEED_PATH}`);
}
