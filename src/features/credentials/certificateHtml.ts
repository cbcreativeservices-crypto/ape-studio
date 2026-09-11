import { sha256 } from 'js-sha256';
import { optionalModule } from '../tools/capture/optionalModule';
import { FONT_CSS, WIDTHS_500, WIDTHS_600, SEAL_SVG_BODY, WM_DEFS, PANTOGRAPH_DATAURI } from './certificateAssets';

// Pro Audio Training Academy | APPROVED: option 2, Modern Professional
// All brand colours live here. QR paper is intentionally always pure white.
export const GROUND = '#fbf9f4';
export const INK = '#14140f';
export const INK_SOFT = '#4a4740';
export const GOLD = '#b8860b';
export const GOLD_LIGHT = '#d8b04a';
export const RULE = '#ddd5c2';

export interface CertificateFields {
  holderName: string | null;
  credentialName: string;
  awardType: 'certificate' | 'program';
  earnedAt: string | null;
  qrToken: string | null;
  verifyUrl: string | null;
}

export interface QrMatrix {
  size: number;
  get(row: number, column: number): boolean | number;
}

/**
 * qrcode is reached through optionalModule (runtime require), NEVER a static
 * import — the certificatePdf house pattern. `qrcode` is only present as a
 * transitive dependency of react-native-qrcode-svg, so a static import would
 * make the whole module fail to resolve if that tree ever changes. Absent
 * library => no QR => the document falls back to the "verification
 * unavailable" panel, which is already the fail-closed path.
 */
type QrLib = {
  create: (value: string, opts: { errorCorrectionLevel: string }) => { modules: QrMatrix };
};
let qrLibCached: QrLib | null | undefined;
function qrLib(): QrLib | null {
  if (qrLibCached === undefined) qrLibCached = optionalModule<QrLib>('qrcode');
  return qrLibCached;
}

export interface CertificateOptions {
  /** Existing app matrix builder can be injected; it must use correction M. */
  createQrMatrix?: (url: string) => QrMatrix;
}

const VERIFY_BASE = 'https://www.proaudiotrainingacademy.com/registry/';
const VERIFY_HOST = 'proaudiotrainingacademy.com/registry';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QR_QUIET_ZONE = 4;
const QR_SIZE_PX = 108;


/** Escape every data-bearing text or attribute interpolation, exactly once. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
}

interface TextSlot {
  width: number;
  height: number;
  maxPt: number;
  minPt: number;
  lineHeight: number;
  trackingEm: number;
  metrics: Readonly<Record<number, number>>;
  preferredSingleLineWidth?: number;
}

/** Measured advances from the embedded font. Unknown glyphs receive a
 * conservative width budget. This is deterministic without a DOM or canvas.
 * Keep text intact: no ellipses, truncation, hidden overflow, or invented hyphens.
 */
function fitText(value: string, slot: TextSlot): { lines: string[]; size: number } {
  const units = (text: string): number => {
    const characters = Array.from(text);
    return characters.reduce((sum, character) => {
      const point = character.codePointAt(0)!;
      const advance = slot.metrics[point] ?? (/\p{M}/u.test(character) ? 0 : 1.2);
      return sum + advance;
    }, 0) + Math.max(0, characters.length - 1) * slot.trackingEm;
  };
  const sizeFor = (lines: string[]): number => Math.floor(Math.min(
    slot.maxPt,
    slot.width * 0.975 / Math.max(...lines.map(units), 0.01),
    slot.height / (slot.lineHeight * lines.length),
  ) * 10) / 10;
  const singleSize = sizeFor([value]);
  const preferOne = slot.preferredSingleLineWidth === undefined
    ? singleSize >= slot.maxPt * 0.78
    : units(value) * slot.maxPt <= slot.preferredSingleLineWidth;
  if (preferOne && singleSize >= slot.minPt) return { lines: [value], size: singleSize };

  const words = value.split(' ');
  let best: string[] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const candidate = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const width = Math.max(...candidate.map(units));
    if (width < bestWidth) { best = candidate; bestWidth = width; }
  }
  if (best && sizeFor(best) >= slot.minPt) return { lines: best, size: sizeFor(best) };
  if (singleSize >= slot.minPt) return { lines: [value], size: singleSize };
  throw new RangeError('Certificate text exceeds the supported two-line layout. Review the registry name or credential title before export. No clipped or truncated PDF was generated.');
}

function linesHtml(lines: string[]): string {
  return lines.map(line => `<span class="text-line">${escapeHtml(line)}</span>`).join('');
}

/** UTC makes an ISO award date independent of the phone's current time zone. */
function awardDate(earnedAt: string | null): string | null {
  if (!earnedAt) return null;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(earnedAt)) return null;
  const [year, month, day] = earnedAt.slice(0, 10).split('-').map(Number);
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(0, 0, 0, 0);
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) return null;
  const date = new Date(earnedAt);
  if (!Number.isFinite(date.getTime())) return null;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// ── Covert security layers (Computer A handoff 2026-09-11; secured design of
// 2026-09-05). Layer 0 (registry QR → Supabase UUID) is unchanged and remains
// the ONLY cryptographic anchor; these are deterrents + by-eye checks. ──────

/** Layer 1: microprint hairline — the lower rule becomes ~2 pt repeating text
 *  carrying the credential ID + registry URL. textLength stretches one built
 *  string to the rule width; legible only under a loupe / >400% zoom. */
function microprintLine(shortId: string): string {
  const unit =
    `PRO AUDIO TRAINING ACADEMY · REGISTERED CREDENTIAL ${shortId} ` +
    `· VERIFY AT PROAUDIOTRAININGACADEMY.COM/REGISTRY · `;
  return unit.repeat(7); // repeat count is cosmetic; textLength fits it
}

/** Layer 3: ID-glyph derived from the credential UUID. SHA-256(uuid): first
 *  24 bits → 24 ticks (tall=1 / short=0); next 3 hex digits → 3 dot radii.
 *  Deterministic per credential — a swapped name/ID won't reproduce it.
 *  Purely a by-eye offline check. */
function idGlyphSvg(uuid: string, cx = 648, baseline = 372, n = 24, step = 1.9): string {
  const hx = sha256(uuid); // 64 hex chars
  const bits = parseInt(hx.slice(0, 6), 16).toString(2).padStart(24, '0');
  const x0 = cx - ((n - 1) * step) / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (x0 + i * step).toFixed(2);
    const top = (baseline - (bits[i] === '1' ? 3.1 : 1.6)).toFixed(2);
    out += `<line x1="${x}" y1="${baseline}" x2="${x}" y2="${top}" stroke="${GOLD}" stroke-width="0.5" opacity="0.62"/>`;
  }
  for (let j = 0; j < 3; j++) {
    const r = (0.5 + (parseInt(hx[6 + j], 16) / 15) * 0.7).toFixed(2);
    const dx = (cx - 3.8 + j * 3.8).toFixed(2);
    out += `<circle cx="${dx}" cy="${(baseline + 2.2).toFixed(2)}" r="${r}" fill="${GOLD}" opacity="0.62"/>`;
  }
  return out;
}

function verifiedUrl(fields: CertificateFields): string | null {
  // Fail closed: a link/QR must agree with the token and expected registry host.
  if (!fields.verifyUrl || !fields.qrToken || !UUID.test(fields.qrToken)) return null;
  const expected = VERIFY_BASE + fields.qrToken;
  return fields.verifyUrl === expected ? expected : null;
}

/** Trusted markup is constructed only from a validated numeric QR matrix.
 * Never pass user HTML/SVG here. If anything fails, the caller gets no QR.
 */
/** The holder-name slot, shared by the renderer and the entry-time check so
 *  the two can never disagree about what fits. */
const HOLDER_SLOT: TextSlot = {
  width: 450, height: 56, maxPt: 45, minPt: 20, lineHeight: 1.1, trackingEm: -0.05, metrics: WIDTHS_500,
};

/**
 * Can this name be engraved on a certificate?
 *
 * WHY THIS EXISTS: the fitter deliberately refuses to truncate — no ellipses,
 * no invented hyphens — and throws instead. That is the right call for a
 * credential, but the registry-name field had no validation, so a name the
 * layout cannot take (a single unbroken word past ~26 characters; spaced names
 * run far longer because they can split across two lines) was accepted
 * silently and only failed at DOWNLOAD, with an error inviting a retry that
 * could never succeed. The certificate was permanently un-downloadable.
 *
 * Callers validate at ENTRY with this, using the very same measurement, so the
 * person is told while they can still fix it.
 */
export function certificateNameFits(value: string): boolean {
  // normalizeText, not trim: the export normalizes before measuring, so anything
  // less here would disagree with it on doubled spaces or decomposed accents.
  const holder = normalizeText(value);
  if (!holder) return true; // empty falls back to a generated label, never engraved as-is
  try {
    fitText(holder, HOLDER_SLOT);
    return true;
  } catch {
    return false;
  }
}

export function buildQrSvg(url: string, createMatrix: (url: string) => QrMatrix): string {
  try {
    const matrix = createMatrix(url);
    const n = matrix.size;
    if (!Number.isInteger(n) || n < 21 || n > 177 || (n - 21) % 4 !== 0) return '';
    const side = n + 2 * QR_QUIET_ZONE;
    const rectangles: string[] = [];
    for (let row = 0; row < n; row++) {
      for (let column = 0; column < n; column++) {
        const value = matrix.get(row, column);
        if (value !== 0 && value !== 1 && value !== true && value !== false) return '';
        if (value) rectangles.push(`<rect x="${escapeHtml(column + QR_QUIET_ZONE)}" y="${escapeHtml(row + QR_QUIET_ZONE)}" width="1" height="1"/>`);
      }
    }
    if (!rectangles.length) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${escapeHtml(QR_SIZE_PX)}" height="${escapeHtml(QR_SIZE_PX)}" viewBox="0 0 ${escapeHtml(side)} ${escapeHtml(side)}" role="img" aria-label="QR code for the public registry" shape-rendering="crispEdges"><rect width="${escapeHtml(side)}" height="${escapeHtml(side)}" fill="#ffffff"/><g fill="${escapeHtml(INK)}">${rectangles.join('')}</g></svg>`;
  } catch {
    return '';
  }
}

/** Approved option 2. Returns a single offline HTML string for expo-print.
 * Font and ornament strings are fixed build-owned assets. All variable text,
 * attributes, sizes and palette values are HTML-escaped at insertion.
 */
export function buildCertificateHtml(fields: CertificateFields, options: CertificateOptions = {}): string {
  const holder = normalizeText(fields.holderName) || 'Academy Member';
  const credential = normalizeText(fields.credentialName);
  if (!credential) throw new TypeError('A credential title is required before export.');
  if (fields.awardType !== 'certificate' && fields.awardType !== 'program') throw new TypeError('Unsupported award type.');
  const holderLayout = fitText(holder, HOLDER_SLOT);
  const credentialLayout = fitText(credential, {width: 450, height: 64, maxPt: 25.5, minPt: 15, lineHeight: 1.17, trackingEm: -0.02, metrics: WIDTHS_600, preferredSingleLineWidth: 300});
  const kicker = fields.awardType === 'program' ? 'Professional program' : 'Specialization';
  const date = awardDate(fields.earnedAt);
  const shortId = fields.qrToken && UUID.test(fields.qrToken) ? fields.qrToken.slice(0, 8).toUpperCase() : null;
  const url = verifiedUrl(fields);
  // Covert layers draw only with a valid credential token — fail-closed like
  // the QR: no token → no microprint, no glyph (handoff §4.5).
  const uuid = fields.qrToken && UUID.test(fields.qrToken) ? fields.qrToken : null;
  const microHtml = shortId ? `<text x="75" y="456.6" textLength="642" lengthAdjust="spacing" font-family="Barlow,Arial,sans-serif" font-weight="500" font-size="2.0" letter-spacing="0.15" fill="${escapeHtml(INK_SOFT)}" opacity="0.6" style="text-transform:uppercase">${escapeHtml(microprintLine(shortId))}</text>` : '';
  const glyphHtml = uuid ? idGlyphSvg(uuid) : '';
  const lib = qrLib();
  const factory = options.createQrMatrix
    ?? (lib ? (payload: string) => lib.create(payload, {errorCorrectionLevel: 'M'}).modules : null);
  const qr = url && factory ? buildQrSvg(url, factory) : '';
  const metaHtml = date ? `<div class="metadata"><div><div class="label">Awarded</div><div class="value">${escapeHtml(date)}</div></div>${shortId ? `<div><div class="label">Credential</div><div class="value">${escapeHtml(shortId)}</div></div>` : ''}</div>` : '';
  const qrHtml = qr
    ? `<a class="qr" href="${escapeHtml(url)}" aria-label="Open the public credential registry">${qr}</a>`
    : '<div class="qr-fallback" aria-hidden="true"></div>';
  const verifyLabel = qr ? 'Scan to verify' : url ? 'Verify online' : 'Verification unavailable';
  const verifyHost = url
    ? `<a class="qr-host" href="${escapeHtml(url)}">${escapeHtml(VERIFY_HOST)}</a>`
    : '<div class="qr-host">Please contact the Academy.</div>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1056"><title>${escapeHtml(credential)} | Pro Audio Training Academy</title><style>
${FONT_CSS}

@page { size: letter landscape; margin: 0; }
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body{margin:0;padding:0;background:${escapeHtml(GROUND)};}
body{font-family:'Barlow','Helvetica Neue',Arial,sans-serif;color:${escapeHtml(INK)};}
.sheet{width:11in;height:8.5in;position:relative;background:${escapeHtml(GROUND)};page-break-inside:avoid;}
h1,h2,p{margin:0;font-weight:inherit;}
.caps{text-transform:uppercase;}
.qr{width:81pt;height:81pt;line-height:0;}
.qr svg{width:108px;height:108px;}
.qr-label{font-size:6.8pt;line-height:1.4;letter-spacing:.13em;text-transform:uppercase;color:${escapeHtml(INK_SOFT)};}
.qr-host{font-size:6pt;line-height:1.4;color:${escapeHtml(INK_SOFT)};white-space:nowrap;}
.signature{position:absolute;}
.signature-rule{height:.6pt;background:${escapeHtml(INK_SOFT)};}
.signature-name{font-size:8.5pt;font-weight:600;letter-spacing:.01em;}
.signature-role{font-size:6.5pt;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${escapeHtml(INK_SOFT)};}
.decor{position:absolute;pointer-events:none;}


.masthead{position:absolute;left:76pt;top:59pt;font-size:15pt;font-weight:600;line-height:1.28;letter-spacing:.025em;text-transform:uppercase;color:${escapeHtml(GROUND)};}
.masthead span{display:block;}
.header-note{position:absolute;left:329pt;top:65pt;font-size:6.6pt;letter-spacing:.12em;color:${escapeHtml(GOLD_LIGHT)};line-height:1.55;text-transform:uppercase;}
.kicker{position:absolute;left:76pt;top:148pt;font-size:8pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${escapeHtml(GOLD)};}
.document-heading{position:absolute;left:74pt;top:168pt;width:455pt;font-size:35pt;font-weight:500;letter-spacing:-.055em;line-height:1;}
.lede{position:absolute;left:77pt;top:225pt;font-size:9pt;color:${escapeHtml(INK_SOFT)};}
.holder{position:absolute;left:73pt;top:244pt;font-size:45pt;font-weight:500;letter-spacing:-.05em;line-height:1.1;}
.statement{position:absolute;left:77pt;top:310pt;font-size:9pt;color:${escapeHtml(INK_SOFT)};}
.credential{position:absolute;left:75pt;top:334pt;width:482pt;font-size:25.5pt;line-height:1.17;font-weight:600;letter-spacing:-.02em;}
.credential span{display:block;}
.metadata{position:absolute;left:77pt;top:412pt;width:340pt;display:flex;}
.metadata>div{width:170pt;flex:none;}
.metadata .label{font-size:6.2pt;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${escapeHtml(GOLD)};}
.metadata .value{margin-top:5pt;font-size:8.4pt;font-weight:500;}
.signature{left:77pt;top:508pt;width:241pt;}
.signature-name{margin-top:8pt;}
.signature-role{margin-top:5pt;}
.footer-note{position:absolute;left:365pt;top:512pt;font-size:6.5pt;line-height:1.7;text-transform:uppercase;letter-spacing:.11em;color:${escapeHtml(INK_SOFT)};}
.verification{position:absolute;right:72pt;top:459pt;width:182pt;text-align:right;}
.verification .qr{margin-left:auto;}
.qr-label{margin-top:5pt;}
.qr-host{margin-top:2pt;}


a { color: inherit; text-decoration: none; }
.text-line { display: block; white-space: nowrap; }
.holder { width: 450pt; font-size: ${escapeHtml(holderLayout.size)}pt; }
.credential { width: 450pt; font-size: ${escapeHtml(credentialLayout.size)}pt; }
.verification .qr { display: block; }
.verification .qr-host { display: block; }
.qr-fallback { height: 81pt; }

</style></head><body><main class="sheet">
<svg class="decor wm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 792 612" width="792pt" height="612pt" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs>${WM_DEFS}</defs>
<rect x="0" y="0" width="792" height="612" fill="url(#wmB)" opacity="0.13"/><rect x="0" y="0" width="792" height="612" fill="url(#wmB2)" opacity="0.13"/>
<image href="${PANTOGRAPH_DATAURI}" x="70" y="300" width="440" height="165" opacity="0.17" preserveAspectRatio="none"/></svg>
<svg class="decor frame" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 792 612" width="792pt" height="612pt" aria-hidden="true">
<rect x="42" y="43" width="708" height="80" fill="${escapeHtml(INK)}"/>
<path d="M42 43V569 M42 43H750 M42 569H750" stroke="${escapeHtml(RULE)}" stroke-width=".6" fill="none"/>
<path d="M42 43H117 M42 43V118" stroke="${escapeHtml(GOLD)}" stroke-width="3" fill="none"/>
<path d="M75 123H717" stroke="${escapeHtml(RULE)}" stroke-width=".6" fill="none"/>
${microHtml}
<svg x="553" y="169.5" width="190" height="190" viewBox="0 0 220 220" overflow="visible">${SEAL_SVG_BODY}</svg>
${glyphHtml}
<path d="M63 451H87" stroke="${escapeHtml(GOLD)}" stroke-width="1.5"/>
<path d="M75 439V463" stroke="${escapeHtml(GOLD)}" stroke-width="1.5"/>
</svg>
<header class="masthead"><span>Pro Audio</span><span>Training Academy</span></header>
<p class="header-note">Professional audio<br>Education &amp; training</p>
<div class="kicker">${escapeHtml(kicker)}</div>
<h1 class="document-heading">Certificate of Achievement</h1>
<p class="lede">This certifies that</p>
<h2 class="holder">${linesHtml(holderLayout.lines)}</h2>
<p class="statement">has satisfied every requirement and is hereby awarded the</p>
<div class="credential">${linesHtml(credentialLayout.lines)}</div>
${metaHtml}
<div class="signature"><div class="signature-rule"></div><div class="signature-name">Professor Channing “Cháno” Booth</div><div class="signature-role">Program Director</div></div>
<div class="footer-note">Pro Audio<br>Training Academy</div>
<div class="verification">${qrHtml}<div class="qr-label">${escapeHtml(verifyLabel)}</div>${verifyHost}</div>
</main></body></html>`;
}

export default buildCertificateHtml;
