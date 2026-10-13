/**
 * Lab ↔ certificate requirements ratchet (owner 2026-10-13: required labs
 * unlock the final exam, so every requirement must be real and resolvable).
 *
 *  • Every key in LAB_REQUIREMENTS_BY_SLUG is a real training key: a tr_ key
 *    in TRAINING_LABS, a mk_ lesson in the miking registry, a mxb_/mxa_ page
 *    in MIXING_*_PAGE_IDS, an ear_ module in EAR_MODULE_IDS — and resolves to a
 *    name/route through labKeyCatalog.
 *  • Every slug is one of the 160 live credentials (fixture below, exported
 *    2026-10-13 from the live certificates/programs tables).
 *  • Never Mixing Guides, never the Calculator Lab.
 *  • Every `why` is a non-empty single sentence, no duplicates per credential.
 *  • The SQL seed is byte-for-byte what scripts/gen-lab-cert-seed.mjs makes
 *    from the map (no drift between app and backend).
 *  • labKeyCatalog's mixing / ear / training names match their sources.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { LAB_REQUIREMENTS_BY_SLUG, labRequirementsFor } from '../src/data/labRequirements.ts';
import { describeLabKey, EAR_MODULE_TITLES, MIXING_PAGE_TITLES, TRAINING_LAB_NAMES } from '../src/data/labKeyCatalog.ts';
import { EAR_MODULE_IDS, MIXING_ADV_PAGE_IDS, MIXING_BEG_PAGE_IDS, TRAINING_LABS } from '../src/features/lab/trainingLabKeys.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

/** The 160 active credential slugs (124 certificates + 36 programs), live DB 2026-10-13. */
const LIVE_SLUGS: readonly string[] = [
  'cert-ableton-live-specialist-v3',
  'cert-adr-and-voice-recording-v3',
  'cert-ai-audio-production-v3',
  'cert-ai-voice-and-speech-synthesis-v3',
  'cert-amplifier-technology-v3',
  'cert-analog-console-recording-v3',
  'cert-analog-electronics-for-audio-v3',
  'cert-analog-tape-engineering-v3',
  'cert-archaeoacoustics-and-heritage-v3',
  'cert-assisted-listening-and-accessibility-v3',
  'cert-astroacoustics-and-sonification-v3',
  'cert-audio-archival-and-restoration-v3',
  'cert-audio-career-and-business-v3',
  'cert-audio-dsp-and-machine-learning-v3',
  'cert-audio-foundations-v3',
  'cert-audio-hardware-manufacturing-v3',
  'cert-audio-measurement-and-analysis-v3',
  'cert-audio-networking-dante-and-av-v3',
  'cert-audio-standards-specialist-v3',
  'cert-audio-troubleshooting-specialist-v3',
  'cert-av-over-ip-systems-v3',
  'cert-band-tracking-specialist-v3',
  'cert-beat-making-and-sampling-v3',
  'cert-bioacoustics-and-ecoacoustics-v3',
  'cert-broadcast-engineer-v3',
  'cert-car-audio-installation-v3',
  'cert-compression-and-dynamics-v3',
  'cert-consumer-and-home-audio-v3',
  'cert-corporate-and-event-production-v3',
  'cert-critical-listening-and-ear-training-v3',
  'cert-data-sonification-v3',
  'cert-daw-power-user-v3',
  'cert-dialogue-editor-v3',
  'cert-digital-archiving-v3',
  'cert-distributed-and-paging-systems-v3',
  'cert-dj-and-club-sound-v3',
  'cert-drum-mixing-v3',
  'cert-drum-recording-and-mixing-v3',
  'cert-effects-and-pedal-design-v3',
  'cert-electronic-live-performance-v3',
  'cert-electronics-repair-technician-v3',
  'cert-eq-and-tonal-shaping-v3',
  'cert-field-and-location-recording-v3',
  'cert-film-music-technology-v3',
  'cert-film-scoring-v3',
  'cert-foh-engineering-v3',
  'cert-foley-performance-and-recording-v3',
  'cert-forensic-audio-v3',
  'cert-gain-staging-and-signal-flow-v3',
  'cert-game-audio-v3',
  'cert-guitar-tone-and-recording-v3',
  'cert-hearing-health-and-conservation-v3',
  'cert-home-studio-starter-v3',
  'cert-home-theater-design-v3',
  'cert-horn-and-waveguide-design-v3',
  'cert-how-sound-behaves-in-a-room-v3',
  'cert-immersive-audio-production-v3',
  'cert-instrument-recognition-percussion-v3',
  'cert-instrument-recognition-winds-and-brass-v3',
  'cert-instrument-sound-identification-v3',
  'cert-interactive-and-game-music-v3',
  'cert-live-mixing-specialist-v3',
  'cert-live-sound-system-engineer-v3',
  'cert-live-wireless-mic-systems-v3',
  'cert-localization-and-dubbing-v3',
  'cert-logic-pro-producer-v3',
  'cert-loudness-and-delivery-specialist-v3',
  'cert-loudspeaker-design-engineer-v3',
  'cert-loudspeaker-systems-and-measurement-v3',
  'cert-mastering-engineer-v3',
  'cert-media-migration-and-metadata-v3',
  'cert-medical-and-clinical-acoustics-v3',
  'cert-microphone-building-v3',
  'cert-microphone-technology-specialist-v3',
  'cert-mix-bus-and-automation-v3',
  'cert-mixing-console-specialist-v3',
  'cert-mixing-engineer-v3',
  'cert-monitor-engineering-iem-and-wedges-v3',
  'cert-music-business-and-industry-v3',
  'cert-nearfield-acoustic-holography-v3',
  'cert-noise-control-engineering-v3',
  'cert-noise-law-and-compliance-v3',
  'cert-orchestral-recording-and-mixing-v3',
  'cert-pa-loudspeaker-systems-v3',
  'cert-pcb-and-assembly-technician-v3',
  'cert-physical-and-molecular-acoustics-v3',
  'cert-plugin-and-processing-power-user-v3',
  'cert-podcast-production-v3',
  'cert-preamp-and-converter-design-v3',
  'cert-psychoacoustics-and-listening-v3',
  'cert-re-recording-mixer-v3',
  'cert-room-acoustics-and-treatment-v3',
  'cert-seismoacoustics-and-infrasound-v3',
  'cert-session-editing-and-comping-v3',
  'cert-show-control-and-cueing-v3',
  'cert-signal-flow-and-connections-v3',
  'cert-sound-design-and-sfx-v3',
  'cert-sound-design-with-synthesis-v3',
  'cert-sound-visualization-and-imaging-v3',
  'cert-source-separation-and-restoration-v3',
  'cert-space-and-earth-acoustics-v3',
  'cert-spectrogram-and-stft-analysis-v3',
  'cert-speech-and-voice-science-v3',
  'cert-stage-patch-and-signal-distribution-v3',
  'cert-stagecraft-and-rigging-v3',
  'cert-streaming-mastering-and-loudness-v3',
  'cert-studio-miking-specialist-v3',
  'cert-studio-recording-engineer-v3',
  'cert-studio-wiring-and-infrastructure-v3',
  'cert-system-tuning-and-alignment-v3',
  'cert-tape-restoration-v3',
  'cert-test-and-calibration-technician-v3',
  'cert-theatrical-sound-v3',
  'cert-time-based-and-creative-fx-v3',
  'cert-touring-and-road-crew-v3',
  'cert-tube-amp-building-v3',
  'cert-tube-audio-equipment-specialist-v3',
  'cert-ultrasonics-and-ndt-v3',
  'cert-underwater-and-sonar-acoustics-v3',
  'cert-vinyl-and-disc-mastering-v3',
  'cert-vocal-mixing-specialist-v3',
  'cert-vocal-recording-and-production-v3',
  'cert-vr-ar-spatial-sound-v3',
  'cert-worship-audio-v3',
  'prog-acoustics-and-psychoacoustics-research-v3',
  'prog-ai-audio-production-v3',
  'prog-analog-and-vintage-audio-engineering-v3',
  'prog-applied-and-physical-acoustics-science-v3',
  'prog-audio-acoustics-and-system-optimization-v3',
  'prog-audio-dsp-and-machine-learning-v3',
  'prog-audio-electronics-service-and-repair-v3',
  'prog-audio-networking-and-infrastructure-v3',
  'prog-audio-preservation-restoration-and-archival-science-v3',
  'prog-audio-standards-and-technical-compliance-v3',
  'prog-audio-systems-engineering-v3',
  'prog-bioacoustics-and-ecoacoustics-v3',
  'prog-broadcast-podcast-and-streaming-audio-v3',
  'prog-commercial-audio-and-av-systems-v3',
  'prog-concert-and-festival-production-v3',
  'prog-dj-and-club-audio-v3',
  'prog-earth-space-and-seismoacoustics-v3',
  'prog-electronic-music-production-and-synthesis-v3',
  'prog-environmental-noise-and-regulatory-acoustics-v3',
  'prog-film-scoring-and-music-production-v3',
  'prog-forensic-and-investigative-audio-v3',
  'prog-game-and-interactive-audio-v3',
  'prog-hearing-science-and-psychoacoustics-v3',
  'prog-immersive-and-spatial-audio-v3',
  'prog-live-sound-engineering-v3',
  'prog-medical-and-clinical-acoustics-v3',
  'prog-mixing-and-mastering-engineering-v3',
  'prog-music-production-v3',
  'prog-post-production-audio-v3',
  'prog-sound-visualization-and-acoustic-imaging-v3',
  'prog-studio-recording-engineering-v3',
  'prog-theater-venue-and-entertainment-audio-v3',
  'prog-transducer-and-audio-hardware-engineering-v3',
  'prog-ultrasonics-and-industrial-acoustics-v3',
  'prog-vehicle-and-consumer-audio-systems-v3',
  'prog-worship-audio-production-v3',
];

const ENTRIES = Object.entries(LAB_REQUIREMENTS_BY_SLUG);
const ALL = ENTRIES.flatMap(([slug, reqs]) => reqs.map((r) => ({ slug, ...r })));

describe('lab ↔ certificate requirements (2026-10-13)', () => {
  it('the slug fixture is the full live catalog', () => {
    assert.equal(LIVE_SLUGS.length, 160);
    assert.equal(new Set(LIVE_SLUGS).size, 160);
    assert.equal(LIVE_SLUGS.filter((s) => s.startsWith('cert-')).length, 124);
    assert.equal(LIVE_SLUGS.filter((s) => s.startsWith('prog-')).length, 36);
  });

  it('every slug in the map is a live credential', () => {
    const live = new Set(LIVE_SLUGS);
    const unknown = ENTRIES.map(([s]) => s).filter((s) => !live.has(s));
    assert.deepEqual(unknown, []);
  });

  it('every key is a real training key and resolves to a name and route', () => {
    const tr = new Set(TRAINING_LABS.map((l) => l.key));
    const mk = new Set(LESSONS.map((l) => `mk_${l.id}`));
    const mx = new Set([...MIXING_BEG_PAGE_IDS.map((p) => `mxb_${p}`), ...MIXING_ADV_PAGE_IDS.map((p) => `mxa_${p}`)]);
    const ear = new Set((EAR_MODULE_IDS as readonly string[]).map((m) => `ear_${m}`));
    const bad = ALL.filter((r) => !(tr.has(r.key) || mk.has(r.key) || mx.has(r.key) || ear.has(r.key)) || !describeLabKey(r.key));
    assert.deepEqual(bad.map((r) => `${r.slug} → ${r.key}`), []);
  });

  it('never requires Mixing Guides or the Calculator Lab', () => {
    const banned = ALL.filter((r) => /mixingguide|mixing_guide|calclab|calc_lab|^tr_calc|^tr_mixing_guides/i.test(r.key));
    assert.deepEqual(banned, []);
    for (const r of ALL) {
      const route = describeLabKey(r.key)?.route;
      assert.notEqual(route, 'MixingGuides', r.key);
      assert.notEqual(route, 'CalcLab', r.key);
    }
  });

  it('every why is one non-empty learner sentence, and no credential lists a key twice', () => {
    for (const r of ALL) {
      assert.ok(r.why && r.why.trim().length >= 20, `${r.slug} ${r.key}: why too short`);
      assert.match(r.why, /[.?!]$/, `${r.slug} ${r.key}: why must end as a sentence`);
      assert.doesNotMatch(r.why, /\b(TODO|TBD|lorem)\b/i, `${r.slug} ${r.key}`);
    }
    for (const [slug, reqs] of ENTRIES) {
      const keys = reqs.map((r) => r.key);
      assert.equal(new Set(keys).size, keys.length, `${slug} lists a key twice`);
      assert.ok(reqs.length > 0, `${slug} is in the map with no requirement — omit it instead`);
    }
  });

  it('labRequirementsFor returns the row, and [] for an unknown slug', () => {
    assert.equal(labRequirementsFor('cert-drum-recording-and-mixing-v3'), LAB_REQUIREMENTS_BY_SLUG['cert-drum-recording-and-mixing-v3']);
    assert.deepEqual(labRequirementsFor('nope'), []);
  });

  it('the owner example holds: a drum recording cert requires the kit lessons and the cymbals', () => {
    const keys = new Set(labRequirementsFor('cert-drum-recording-and-mixing-v3').map((r) => r.key));
    for (const k of ['mk_M01', 'mk_M02', 'mk_M03', 'mk_M09', 'mk_M10', 'mk_M11', 'mk_I01a', 'mk_I01b', 'mk_I01c', 'mk_I01d', 'mk_I01e']) {
      assert.ok(keys.has(k), k);
    }
  });

  it('the SQL seed is exactly what the generator produces from the map', async () => {
    const { buildSeedSql } = await import('../scripts/gen-lab-cert-seed.mjs');
    const expected: string = await buildSeedSql();
    const actual = read('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql').replace(/\r\n/g, '\n');
    assert.equal(actual, expected, 'seed is stale — run: node scripts/gen-lab-cert-seed.mjs');
    for (const [slug, reqs] of ENTRIES) for (const r of reqs) assert.ok(actual.includes(`'${slug}', '${r.key}'`), `${slug} ${r.key}`);
  });

  it('labKeyCatalog names match their sources', () => {
    // Mixing page titles = the `title` beside each `short` in the page files.
    const fromFiles = (files: string[]) =>
      files.flatMap((f) => [...read(`src/screens/lab/mixing/${f}`).matchAll(/\{ title: '([^']+)', short: '([^']+)'/g)].map((m) => m[1]));
    assert.deepEqual(fromFiles(['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx']), MIXING_BEG_PAGE_IDS.map((p) => MIXING_PAGE_TITLES.beg[p]));
    assert.deepEqual(fromFiles(['pagesAdvA.tsx', 'pagesAdvB.tsx', 'pagesAdvC.tsx', 'pagesAdvD.tsx']), MIXING_ADV_PAGE_IDS.map((p) => MIXING_PAGE_TITLES.adv[p]));
    // Ear module titles = the module files' own `title` after `id: '<module>'`.
    const earSrc = ['tone', 'dynamics', 'time', 'defects', 'spatial', 'pitch'].map((f) => read(`src/features/ear/modules/${f}.ts`)).join('\n');
    for (const id of EAR_MODULE_IDS) {
      const m = earSrc.match(new RegExp(`id: '${id}',[\\s\\S]{0,80}?title: '([^']+)'`));
      assert.equal(EAR_MODULE_TITLES[id], m?.[1], id);
    }
    // Every training lab has a name that begins with its catalog name.
    const catalog = read('src/screens/lab/labCatalog.ts');
    for (const lab of TRAINING_LABS) {
      const name = TRAINING_LAB_NAMES[lab.key];
      assert.ok(name, `${lab.key} has no name`);
      const m = catalog.match(new RegExp(`name: '([^']+)',[^\\n]*route: '${lab.route}'`));
      assert.ok(m, `${lab.route} not in the catalog`);
      assert.ok(name.startsWith(m[1].split(':')[0]), `${lab.key}: "${name}" vs catalog "${m[1]}"`);
    }
  });
});
