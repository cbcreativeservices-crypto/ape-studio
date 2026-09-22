/**
 * subjectMetaAudit — does every LIVE v3 subject have copy, and vice versa?
 *
 * Run: node scripts/subjectMetaAudit.mjs
 *
 * ⚠️ KEYS ARE WRITTEN TWO WAYS. Most subject names need quoting ('Stage & Venue'),
 * but six are valid JS identifiers and are written bare — Microphones, Podcast,
 * Mastering, Mixing, Immersive, Scoring. A quoted-only regex finds 44 of 50 and
 * reports six live subjects as having no copy, which is false. This matches both.
 */
import { readFileSync } from 'node:fs';

/** The 50 live subjects of the ACTIVE v3 curriculum (achievements.subject). */
export const LIVE_SUBJECTS = [
  'Acoustics & Room Behavior', 'Measurement & Analysis', 'Forensic & Investigative',
  'Human & Heritage Acoustics', 'Life, Earth & Space Acoustics', 'Physical & Advanced Acoustics',
  'Sound Visualization & Imaging', 'AI Audio', 'Audio Networking',
  'Cabling, Connectors & Infrastructure', 'Consoles & Control', 'Loudspeakers & Amplification',
  'Microphones', 'Recording Hardware & Media', 'Broadcast & Air Chain', 'Podcast',
  'Professional Practice', 'DAWs & MIDI', 'Sampling & Beat-Making', 'Synthesis & Sound Design',
  'Build & Manufacturing', 'Components & Circuits', 'Foundations of Sound & Signal',
  'Safety & Electrical', 'Critical Listening & Ear Training', 'Hearing & Psychoacoustics',
  'Consumer & Vehicle Audio', 'System Design & Install', 'DJ Performance', 'Live Mixing & Crew',
  'Live Systems & Deployment', 'Mastering', 'Mixing', 'Analog Formats & Machines',
  'Preservation & Restoration', 'Dynamics & EQ', 'Plugins & Processing Platforms',
  'Time-Based & Creative FX', 'Immersive', 'Localization & Game', 'Post Production', 'Scoring',
  'Sound Law & Compliance', 'Technical Standards', 'Recording Craft', 'Maintenance & Repair',
  'System Troubleshooting', 'Show Control & Cueing', 'Stage & Venue', 'Theatrical & Worship',
];

const src = readFileSync(new URL('../src/data/subjectMeta.ts', import.meta.url), 'utf8');
// ⚠️ lastIndexOf: 'SUBJECT_META_RATIFIED' also appears in the header comment
// ABOVE the data, so indexOf gives an end BEFORE the start and an empty slice —
// which reports all 50 live subjects as having no copy. It does not.
const body = src.slice(src.indexOf('SUBJECT_META: Record'), src.lastIndexOf('SUBJECT_META_RATIFIED'));

/** Quoted OR bare key at two-space indent, with its block. */
const entries = [...body.matchAll(/^ {2}(?:'([^']+)'|([A-Za-z_$][\w$]*)):\s*\{([\s\S]*?)^ {2}\},/gm)].map((m) => {
  const key = m[1] ?? m[2];
  const block = m[3];
  const desc = /description:\s*'([\s\S]*?)',\s*$/m.exec(block)?.[1] ?? '';
  const careers = /careers:\s*'([\s\S]*?)',\s*$/m.exec(block)?.[1] ?? '';
  return { key, desc, careers };
});

const keys = entries.map((e) => e.key);
const missing = LIVE_SUBJECTS.filter((s) => !keys.includes(s));
const orphan = keys.filter((k) => !LIVE_SUBJECTS.includes(k));

export { entries, keys, missing, orphan };

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  console.log(`live subjects: ${LIVE_SUBJECTS.length} | meta keys: ${keys.length}`);
  console.log(`LIVE WITH NO COPY : ${missing.length ? missing.join(' | ') : 'none'}`);
  console.log(`ORPHAN KEYS       : ${orphan.length ? orphan.join(' | ') : 'none'}`);
  const noDesc = entries.filter((e) => !e.desc).map((e) => e.key);
  const noCareers = entries.filter((e) => !e.careers).map((e) => e.key);
  console.log(`MISSING DESCRIPTION: ${noDesc.length ? noDesc.join(' | ') : 'none'}`);
  console.log(`MISSING CAREERS    : ${noCareers.length ? noCareers.join(' | ') : 'none'}`);
}
