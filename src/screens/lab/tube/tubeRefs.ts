/**
 * Tube Reference registry — the 40 owner-produced tube spec cards
 * (spec of record: docs/APE_TUBE_REFERENCE_SPEC_2026_08_09.md).
 *
 * TWO PAGES PER TUBE (owner 2026-08-17): the corrected card set gives every
 * tube TWO full-screen pages (`<stem>-p1.png` and `<stem>-p2.png`) instead of
 * one. The registry stores the shared `stem`; the viewer requests each page.
 *
 * DATA PRINCIPLE: this registry stores ONLY what browse/search need — name,
 * alternates, family, base, role, stem. The electrical specs (heater V, max
 * plate, dissipation, gain, PIV…) live IN THE CARD IMAGE ONLY, which is the
 * single source of truth — never re-key them into code (calc source-of-truth
 * standard applies).
 *
 * The 10 tubes added 2026-08-17 (31–40) and the #28 rename had their browse
 * metadata (family/base/role/alternates) filled from standard references and
 * OWNER-APPROVED 2026-08-17. Nothing electrical is keyed — that lives in the card.
 *
 * Images are served from the public Supabase Storage bucket `tube-diagrams`
 * (2160×3840 PNG, ~0.9–1.1 MB each) — NOT bundled (~80 MB total now). Native
 * image caching (Fresco / NSURLCache) keeps repeat views fast.
 */
import { SUPABASE_URL } from '../../../lib/env';
import { supabase } from '../../../lib/supabase';

export type TubeFamily = 'preamp' | 'power' | 'dht' | 'rectifier';

export type TubeRef = {
  /** URL-safe route id (lowercased short name). */
  id: string;
  /** 1..40 — display and card order (matches the file number). */
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
  /** Shared filename stem in the bucket, e.g. '01-12AX7' — the viewer appends
   *  `-p1.png` / `-p2.png` for the two pages. */
  stem: string;
  /** Card pages for THIS tube (default TUBE_PAGES = 2). Generic single/double-
   *  page support; every current reference tube has 2. */
  pages?: 1 | 2;
};

/** Card pages for a tube (default TUBE_PAGES). */
export const pageCountOf = (ref: TubeRef): 1 | 2 => ref.pages ?? TUBE_PAGES;

/** Every tube has exactly two card pages (owner 2026-08-17). */
export const TUBE_PAGES = 2 as const;

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
  stem: string,
): TubeRef => ({ id: short.toLowerCase(), num, short, name, alt, family, base, role, stem });

export const TUBE_REFS: TubeRef[] = [
  // ── Preamp / small-signal triodes (01–09) ─────────────────────────────────
  t(1, '12AX7', '12AX7 / ECC83', ['ECC83', '7025'], 'preamp', 'Noval (9-pin)', 'Dual high-gain triode — signal preamplification', '01-12AX7'),
  t(2, '12AY7', '12AY7', ['6072'], 'preamp', 'Noval (9-pin)', 'Dual medium-mu triode — low-noise preamp', '02-12AY7'),
  t(3, '12AT7', '12AT7 / ECC81', ['ECC81'], 'preamp', 'Noval (9-pin)', 'Dual triode — preamp & phase inverter', '03-12AT7'),
  t(4, '5751', '5751', ['12AX7 family'], 'preamp', 'Noval (9-pin)', 'Dual triode — lower-gain 12AX7 substitute (µ 70)', '04-5751'),
  t(5, '12BH7', '12BH7', ['12BH7A'], 'preamp', 'Noval (9-pin)', 'Dual medium-mu triode — driver stage', '05-12BH7'),
  t(6, '6CG7', '6CG7 / 6FQ7', ['6FQ7'], 'preamp', 'Noval (9-pin)', 'Dual triode — driver (a 6SN7 in Noval)', '06-6CG7'),
  t(7, '5687', '5687', ['7044'], 'preamp', 'Noval (9-pin)', 'Dual triode — high-current driver', '07-5687'),
  t(8, '6SN7', '6SN7', ['6SN7GTB', 'CV181'], 'preamp', 'Octal (8-pin)', 'Dual medium-mu triode — driver', '08-6SN7'),
  t(9, '6SL7', '6SL7', ['6SL7GT'], 'preamp', 'Octal (8-pin)', 'Dual high-mu triode — preamp', '09-6SL7'),
  // ── Power pentodes & beam tetrodes (10–19) ────────────────────────────────
  t(10, 'EL84', 'EL84 / 6BQ5', ['6BQ5'], 'power', 'Noval (9-pin)', 'Power pentode — audio output', '10-EL84'),
  t(11, 'EL34', 'EL34 / 6CA7', ['6CA7'], 'power', 'Octal (8-pin)', 'Power pentode — audio output', '11-EL34'),
  t(12, 'KT77', 'KT77', ['EL34 upgrade'], 'power', 'Octal (8-pin)', 'Kinkless tetrode — audio output', '12-KT77'),
  t(13, '6L6GC', '6L6GC', ['5881', '7581'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '13-6L6GC'),
  t(14, '6V6GT', '6V6GT', ['6V6'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '14-6V6GT'),
  t(15, 'KT66', 'KT66', ['6L6 family'], 'power', 'Octal (8-pin)', 'Beam tetrode — audio output', '15-KT66'),
  t(16, 'KT88', 'KT88', ['CV5220'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '16-KT88'),
  t(17, '6550', '6550', ['6550A'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '17-6550'),
  t(18, 'KT120', 'KT120', [], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '18-KT120'),
  t(19, 'KT150', 'KT150', [], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '19-KT150'),
  // ── Directly-heated triodes (20–23) ───────────────────────────────────────
  t(20, '300B', '300B', ['WE300B'], 'dht', 'UX4 (4-pin)', 'Directly-heated triode — single-ended power', '20-300B'),
  t(21, '2A3', '2A3', [], 'dht', 'UX4 (4-pin)', 'Directly-heated triode — single-ended power', '21-2A3'),
  t(22, '845', '845', [], 'dht', '4-pin jumbo · top-cap anode', 'Directly-heated transmitting triode — SE power', '22-845'),
  t(23, '211', '211', ['VT-4C'], 'dht', '4-pin jumbo · top-cap anode', 'Directly-heated transmitting triode — SE power', '23-211'),
  // ── Rectifiers (24–30) ────────────────────────────────────────────────────
  t(24, '5AR4', '5AR4 / GZ34', ['GZ34', 'CV1377'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '24-5AR4'),
  t(25, 'GZ37', 'GZ37', ['CV378'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '25-GZ37'),
  t(26, '5U4GB', '5U4GB', ['5U4G'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '26-5U4GB'),
  t(27, '5Y3GT', '5Y3GT', ['5Y3'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '27-5Y3GT'),
  // #28 renamed 5R4GY → 5R4 to match the corrected card set (owner 2026-08-17).
  t(28, '5R4', '5R4', ['5R4GY', '5R4GB'], 'rectifier', 'Octal (8-pin)', 'Full-wave rectifier — B+ power supply', '28-5R4'),
  t(29, 'EZ81', 'EZ81 / 6CA4', ['6CA4'], 'rectifier', 'Noval (9-pin)', 'Full-wave rectifier — B+ power supply', '29-EZ81'),
  t(30, 'EZ80', 'EZ80 / 6V4', ['6V4'], 'rectifier', 'Noval (9-pin)', 'Full-wave rectifier — B+ power supply', '30-EZ80'),

  // ── NEW 2026-08-17 (31–40) — browse metadata owner-approved 2026-08-17 ─────
  // Power pentodes & beam tetrodes
  t(31, '6CA7', '6CA7', ['EL34'], 'power', 'Octal (8-pin)', 'Power pentode / beam — audio output (EL34 family)', '31-6CA7'),
  t(32, '7189', '7189', ['7189A', 'EL84 family'], 'power', 'Noval (9-pin)', 'Power pentode — rugged EL84 (audio output)', '32-7189'),
  t(33, '5881', '5881', ['6L6WGB', '6L6 family'], 'power', 'Octal (8-pin)', 'Beam power tetrode — audio output', '33-5881'),
  t(34, '7581A', '7581A', ['7581', '6L6GC'], 'power', 'Octal (8-pin)', 'Beam power tetrode — heavy-duty 6L6GC (audio output)', '34-7581A'),
  t(35, '7408', '7408', ['6V6GT', '6V6'], 'power', 'Octal (8-pin)', 'Beam power tetrode — industrial 6V6 (audio output)', '35-7408'),
  // Directly-heated triodes
  t(36, '2A3-40', '2A3-40', ['2A3'], 'dht', 'UX4 (4-pin)', 'Directly-heated triode — high-power 2A3 variant (SE power)', '36-2A3-40'),
  t(37, '845W', '845W', ['845'], 'dht', '4-pin jumbo · top-cap anode', 'Directly-heated transmitting triode — rugged 845 (SE power)', '37-845W'),
  // Preamp / small-signal triodes
  t(38, '6FQ7', '6FQ7 / 6CG7', ['6CG7'], 'preamp', 'Noval (9-pin)', 'Dual triode — driver (6CG7 equivalent)', '38-6FQ7'),
  t(39, '7044', '7044', ['5687 family'], 'preamp', 'Noval (9-pin)', 'Dual triode — high-current / long-life driver', '39-7044'),
  t(40, '7119', '7119 / E182CC', ['E182CC'], 'preamp', 'Noval (9-pin)', 'Dual triode — high-current, low-impedance driver', '40-7119'),
];

export function getTubeRef(id: string): TubeRef | undefined {
  return TUBE_REFS.find((r) => r.id === id);
}

// Card pages are served through Supabase image transformations (Pro plan): a
// resized WebP is ~4–5× smaller than the source PNG (~882 KB → ~190 KB) and is
// CDN-cached, so cards load far faster with NO re-upload (owner 2026-08-17).
// - width 2048 ≈ the 2160-px source, so pinch-zoom stays legible.
// - format=webp forces WebP even when the client sends no `Accept: image/webp`
//   (React Native's Image often doesn't), else it would fall back to PNG.
// Source of truth is still the uploaded 2160×3840 PNG; this only changes delivery.
const TUBE_CARD_WIDTH = 2048;
const TUBE_CARD_QUALITY = 75;

/** Optimized public URL for one card page (bucket `tube-diagrams`, public read).
 *  `page` is 1 or 2; the underlying file is `<stem>-p<page>.png`.
 *
 *  DEPRECATED for display (owner 2026-08-19): the tube cards are paid content
 *  and are now served through the entitlement-gated `tube-image` Edge Function
 *  via `fetchTubePageUri` below. Kept only as a reference to the legacy path;
 *  do not use for rendering. Once every client uses the gated path, the
 *  `tube-diagrams` bucket is flipped to private and this URL stops resolving. */
export function tubePageUrl(stem: string, page: 1 | 2): string {
  const file = `${stem}-p${page}.png`;
  return `${SUPABASE_URL}/storage/v1/render/image/public/tube-diagrams/${file}?width=${TUBE_CARD_WIDTH}&quality=${TUBE_CARD_QUALITY}&format=webp`;
}

/**
 * Secured card-page URL (owner 2026-08-19). Calls the `tube-image` Edge
 * Function, which verifies the caller's session + active academy entitlement
 * server-side and returns a short-lived (120 s) signed URL for the requested
 * page. Returns null when not entitled, not signed in, or unreachable — the
 * viewer then shows its load-failure state. supabase.functions.invoke attaches
 * the current session's access token automatically.
 */
export async function fetchTubePageUri(stem: string, page: 1 | 2): Promise<string | null> {
  const r = await fetchTubePage(stem, page);
  return r.url;
}

/** Reasoned fetch (fix 2026-08-31): a signed-out/lapsed caller used to get the
 *  same null as a network drop, so the card said "check your connection" for a
 *  failure RETRY could never fix. */
export async function fetchTubePage(
  stem: string,
  page: 1 | 2,
): Promise<{ url: string | null; reason: 'ok' | 'auth' | 'network' }> {
  const { data: sess } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!sess?.session) return { url: null, reason: 'auth' };
  try {
    const { data, error } = await supabase.functions.invoke('tube-image', {
      body: { stem, page },
    });
    if (error) {
      // The gated fn refuses non-members with a 4xx — surface it as auth.
      const status = (error as { context?: { status?: number } }).context?.status;
      return { url: null, reason: status != null && status >= 400 && status < 500 ? 'auth' : 'network' };
    }
    const url = (data as { url?: string } | null)?.url;
    return url ? { url, reason: 'ok' } : { url: null, reason: 'network' };
  } catch {
    return { url: null, reason: 'network' };
  }
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
