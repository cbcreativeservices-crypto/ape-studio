/**
 * Tube Reference registry — the 30 owner-produced tube spec cards
 * (spec of record: docs/APE_TUBE_REFERENCE_SPEC_2026_08_09.md).
 *
 * DATA PRINCIPLE: this registry stores ONLY what browse/search need — name,
 * alternates, family, base, role, file. The electrical specs (heater V, max
 * plate, dissipation, gain, PIV…) live IN THE CARD IMAGE ONLY, which is the
 * single source of truth — never re-key them into code (calc source-of-truth
 * standard applies).
 *
 * Images are served from the public Supabase Storage bucket `tube-diagrams`
 * (2160×3840 PNG, ~0.7–1.1 MB each) — NOT bundled (~27 MB total). Native image
 * caching (Fresco / NSURLCache) keeps repeat views fast.
 */
import { SUPABASE_URL } from '../../../lib/env';

export type TubeFamily = 'preamp' | 'power' | 'dht' | 'rectifier';

export type TubeRef = {
  /** URL-safe route id (lowercased short name). */
  id: string;
  /** 1..30 — display and card order (matches the file number). */
  num: number;
  /** Primary short name as printed on the card, e.g. '12AX7'. */
  short: string;
  /** Full header line, e.g. '12AX7 / ECC83'. */
  name: string;
  /** Searchable alternates (equivalents, CV/military numbers). */
  alt: string[];
  family: TubeFamily;
  /** Base/socket, e.g. 'Noval (9-pin)'. */
  base: string;
  /** Role subtitle, e.g. 'Dual high-gain triode — preamp'. */
  role: string;
  /** Filename inside the tube-diagrams bucket. */
  file: string;
};

export const TUBE_FAMILY_META: { key: TubeFamily; title: string; note: string }[] = [
  { key: 'preamp', title: 'PREAMP & SMALL-SIGNAL TRIODES', note: 'Voltage gain at the front of the chain.' },
  { key: 'power', title: 'POWER PENTODES & BEAM TETRODES', note: 'Current into the output transformer.' },
  { key: 'dht', title: 'DIRECTLY-HEATED TRIODES', note: 'The filament IS the cathode — classic single-ended sound.' },
  { key: 'rectifier', title: 'RECTIFIERS', note: 'AC → DC for the B+ supply; sag and warm-up character.' },
];

const t = (
  num: number,
  short: string,
  name: string,
  alt: string[],
  family: TubeFamily,
  base: string,
  role: string,
  file: string,
): TubeRef => ({ id: short.toLowerCase(), num, short, name, alt, family, base, role, file });

export const TUBE_REFS: TubeRef[] = [
  // ── Preamp / small-signal triodes (01–09) ─────────────────────────────────
  t(1, '12AX7', '12AX7 / ECC83', ['ECC83', '7025'], 'preamp', 'Noval (9-pin)', 'Dual high-gain triode — signal preamplification', '01-12AX7.png'),
  t(2, '12AY7', '12AY7', ['6072'], 'preamp', 'Noval (9-pin)', 'Dual medium-mu triode — low-noise preamp', '02-12AY7.png'),
  t(3, '12AT7', '12AT7 / ECC81', ['ECC81'], 'preamp', 'Noval (9-pin)', 'Dual triode — preamp & phase inverter', '03-12AT7.png'),
  t(4, '5751', '5751', ['12AX7 family'], 'preamp', 'Noval (9-pin)', 'Dual triode — lower-gain 12AX7 substitute (µ 70)', '04-5751.png'),
  t(5, '12BH7', '12BH7', ['12BH7A'], 'preamp', 'Noval (9-pin)', 'Dual medium-mu triode — driver stage', '05-12BH7.png'),
  t(6, '6CG7', '6CG7 / 6FQ7', ['6FQ7'], 'preamp', 'Noval (9-pin)', 'Dual triode — driver (a 6SN7 in Noval)', '06-6CG7.png'),
  t(7, '5687', '5687', ['7044'], 'preamp', 'Noval (9-pin)', 'Dual triode — high-current driver', '07-5687.png'),
  t(8, '6SN7', '6SN7', ['6SN7GTB', 'CV181'], 'preamp', 'Octal (8-pin)', 'Dual medium-mu triode — driver', '08-6SN7.png'),
  t(9, '6SL7', '6SL7', ['6SL7GT'], 'preamp', 'Octal (8-pin)', 'Dual high-mu triode — preamp', '09-6SL7.png'),
  // ── Power pentodes & beam tetrodes (10–19) ────────────────────────────────
  t(10, 'EL84', 'EL84 / 6BQ5', ['6BQ5'], 'power', 'Noval (9-pin)', 'Power pentode — audio output', '10-EL84.png'),
  t(11, 'EL34', 'EL34 / 6CA7', ['6CA7'], 'power', 'Octal (8-pin)', 'Power pentode — audio output', '11-EL34.png'),
  t(12, 'KT77', 'KT77', ['EL34 upgrade'], 'power', 'Octal (8-pin)', 'Kinkless tetrode — audio output', '12-KT77.png'),
  t(13, '6L6GC', '6L6GC', ['5881', '7581'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '13-6L6GC.png'),
  t(14, '6V6GT', '6V6GT', ['6V6'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '14-6V6GT.png'),
  t(15, 'KT66', 'KT66', ['6L6 family'], 'power', 'Octal (8-pin)', 'Beam tetrode — audio output', '15-KT66.png'),
  t(16, 'KT88', 'KT88', ['CV5220'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '16-KT88.png'),
  t(17, '6550', '6550', ['6550A'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '17-6550.png'),
  t(18, 'KT120', 'KT120', [], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '18-KT120.png'),
  t(19, 'KT150', 'KT150', [], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '19-KT150.png'),
  // ── Directly-heated triodes (20–23) ───────────────────────────────────────
  t(20, '300B', '300B', ['WE300B'], 'dht', 'UX4 (4-pin)', 'Directly-heated triode — single-ended power', '20-300B.png'),
  t(21, '2A3', '2A3', [], 'dht', 'UX4 (4-pin)', 'Directly-heated triode — single-ended power', '21-2A3.png'),
  t(22, '845', '845', [], 'dht', '4-pin jumbo · top-cap anode', 'Directly-heated transmitting triode — SE power', '22-845.png'),
  t(23, '211', '211', ['VT-4C'], 'dht', '4-pin jumbo · top-cap anode', 'Directly-heated transmitting triode — SE power', '23-211.png'),
  // ── Rectifiers (24–30) ────────────────────────────────────────────────────
  t(24, '5AR4', '5AR4 / GZ34', ['GZ34', 'CV1377'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '24-5AR4.png'),
  t(25, 'GZ37', 'GZ37', ['CV378'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '25-GZ37.png'),
  t(26, '5U4GB', '5U4GB', ['5U4G'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '26-5U4GB.png'),
  t(27, '5Y3GT', '5Y3GT', ['5Y3'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '27-5Y3GT.png'),
  t(28, '5R4GY', '5R4GY', ['5R4GB'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '28-5R4GY.png'),
  t(29, 'EZ81', 'EZ81 / 6CA4', ['6CA4'], 'rectifier', 'Noval (9-pin)', 'Full-wave rectifier — B+ power supply', '29-EZ81.png'),
  t(30, 'EZ80', 'EZ80 / 6V4', ['6V4'], 'rectifier', 'Noval (9-pin)', 'Full-wave rectifier — B+ power supply', '30-EZ80.png'),
];

export function getTubeRef(id: string): TubeRef | undefined {
  return TUBE_REFS.find((r) => r.id === id);
}

/** Public Storage URL for a card image (bucket `tube-diagrams`, public read). */
export function tubeImageUrl(file: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/tube-diagrams/${file}`;
}

/** Case-insensitive search over short name, header name, alternates, base and
 *  role — "ecc83", "gz34", "cv5220", "octal", "rectifier" all hit. */
export function searchTubes(query: string): TubeRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return TUBE_REFS;
  return TUBE_REFS.filter((r) =>
    [r.short, r.name, r.base, r.role, ...r.alt].some((s) => s.toLowerCase().includes(q)),
  );
}

/** The card native aspect ratio (2160×3840) — the viewer sizes around this. */
export const TUBE_CARD_ASPECT = 2160 / 3840;
