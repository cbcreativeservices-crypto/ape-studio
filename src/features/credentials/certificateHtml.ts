/**
 * certificateHtml — the printable credential document (owner-approved
 * 2026-08-29, launch blocker #2).
 *
 * Produces a self-contained HTML string for expo-print. US Letter LANDSCAPE.
 *
 * PRINT-FIRST, deliberately: the app's dark near-black + gold system is right on
 * a screen and wrong on paper (it floods a page with ink and reads grey). This
 * inverts to a cream ground with near-black ink and keeps the brand gold as the
 * rule/accent colour, which is how a credential is expected to look and how it
 * survives a home printer. Reversible in one place — see PALETTE below.
 *
 * FONTS: the app's Oswald/Barlow are RN-loaded and are NOT available inside the
 * print webview, so this uses explicit system stacks. Never reference
 * theme/tokens fonts here — they would silently fall back to Times.
 *
 * The seal is an intentional empty gold ring, not a placeholder graphic: art is
 * the slow parallel track, and a ruled ring reads as designed restraint where a
 * "LOGO HERE" box would read as unfinished.
 */
import { optionalModule } from '../tools/capture/optionalModule';

/* ---- PALETTE (single point of change) ---- */
const INK = '#14140f';
const INK_SOFT = '#4a4740';
const GOLD = '#b8860b';
const GOLD_LIGHT = '#d8b04a';
const GROUND = '#fbf9f4';
const RULE = '#ddd5c2';

const DISPLAY = "'Georgia','Times New Roman',serif";
/* Printed under the QR. The full URL carries a uuid that wraps onto a second
   line and reads as clutter — the QR already carries the token, so the human
   line only needs to say where it resolves. */
const REGISTRY_HOST_LABEL = 'proaudiotrainingacademy.com/registry';
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

export type CertificateInput = {
  /** The holder's chosen registry name (Profile → "Name used in registry"). */
  holderName: string;
  /** e.g. "Live Sound Reinforcement" */
  credentialName: string;
  awardType: 'certificate' | 'program';
  /** ISO date the credential was earned/issued. */
  earnedAt: string | null;
  /** users.qr_token — drives the verification URL + QR. Null = no QR block. */
  qrToken: string | null;
  /** Full verification URL, from registryUrl(qrToken). */
  verifyUrl: string | null;
};

/** HTML-escape every interpolated value. A credential name or a user-chosen
 *  display name must never be able to inject markup into the document. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * QR as an inline SVG string. react-native-qrcode-svg renders RN components and
 * cannot be used inside the print webview, so we build the matrix ourselves from
 * the same underlying `qrcode` package and emit plain SVG rects.
 *
 * GUARDED require (the CredentialQr house pattern): `qrcode` pulls in
 * text-encoding and can throw at import on Hermes. A throw here must degrade to
 * a certificate without a QR — never take down the export.
 */
export function buildQrSvg(url: string, px: number): string | null {
  try {
    const mod = optionalModule<{
      create: (v: string, o: { errorCorrectionLevel: string }) => {
        modules: { size: number; get: (r: number, c: number) => number };
      };
    }>('qrcode');
    if (!mod?.create) return null;
    const { modules } = mod.create(url, { errorCorrectionLevel: 'M' });
    const n = modules.size;
    const quiet = 2;               // quiet zone in modules — required to scan
    const total = n + quiet * 2;
    const rects: string[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (modules.get(r, c)) {
          rects.push(`<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1"/>`);
        }
      }
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" ` +
      `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
      `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
      `<g fill="${INK}">${rects.join('')}</g></svg>`
    );
  } catch {
    return null;
  }
}

export function buildCertificateHtml(input: CertificateInput): string {
  const kicker = input.awardType === 'program' ? 'PROFESSIONAL PROGRAM' : 'SPECIALIZATION CERTIFICATE';
  const holder = esc(input.holderName.trim() || 'Academy Member');
  const name = esc(input.credentialName.trim() || 'Credential');
  const date = fmtDate(input.earnedAt);
  const qrSvg = input.verifyUrl ? buildQrSvg(input.verifyUrl, 108) : null;
  const shortId = input.qrToken ? input.qrToken.slice(0, 8).toUpperCase() : null;

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @page { size: letter landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin:0; padding:0; background:${GROUND}; }
  .sheet {
    width: 11in; height: 8.5in; padding: 0.42in;
    background: ${GROUND}; position: relative;
    font-family: ${SANS}; color: ${INK};
  }
  .frame {
    position:absolute; inset:0.42in; border:2px solid ${GOLD};
  }
  .frame::after {
    content:''; position:absolute; inset:7px; border:1px solid ${GOLD_LIGHT};
  }
  .inner {
    position:relative; height:100%; padding:0.52in 0.72in;
    display:flex; flex-direction:column; text-align:center;
  }
  /* The core award statement is centred in the space between the masthead and
     the footer. Without this the block sits hard against the top and leaves a
     dead band above the signature line. */
  .body { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .academy {
    font-size:12.5pt; letter-spacing:.34em; font-weight:700; color:${INK};
    text-transform:uppercase;
  }
  .rule-sm { width:74px; height:2px; background:${GOLD}; margin:11px auto 0; }
  .kicker {
    margin-top:17px; font-size:8.6pt; letter-spacing:.30em; color:${GOLD};
    font-weight:700; text-transform:uppercase;
  }
  .lede { margin-top:0; font-family:${DISPLAY}; font-style:italic;
          font-size:13pt; color:${INK_SOFT}; }
  .holder {
    margin-top:9px; font-family:${DISPLAY}; font-size:37pt; line-height:1.1;
    color:${INK};
  }
  .holder-rule { width:57%; height:1px; background:${RULE}; margin:15px auto 0; }
  .lede2 { margin-top:16px; font-family:${DISPLAY}; font-style:italic;
           font-size:12pt; color:${INK_SOFT}; }
  .credential {
    margin-top:10px; font-size:21pt; font-weight:700; letter-spacing:.055em;
    text-transform:uppercase; color:${GOLD}; line-height:1.22;
  }
  .foot {
    display:flex; align-items:flex-end;
    justify-content:space-between; text-align:left; gap:22px;
  }
  .sig { width:2.85in; }
  .sig-line { height:1px; background:${INK_SOFT}; margin-bottom:6px; }
  .sig-name { font-size:9.2pt; font-weight:700; letter-spacing:.045em; }
  .sig-role { font-size:7.6pt; letter-spacing:.14em; color:${INK_SOFT};
              text-transform:uppercase; margin-top:2px; }
  .seal {
    width:1.02in; height:1.02in; border:1.5px solid ${GOLD}; border-radius:50%;
    display:flex; align-items:center; justify-content:center; flex-direction:column;
    color:${GOLD}; flex:none;
  }
  .seal-in { width:.82in; height:.82in; border:1px solid ${GOLD_LIGHT};
             border-radius:50%; display:flex; align-items:center;
             justify-content:center; text-align:center; }
  .seal-txt { font-size:6.1pt; letter-spacing:.16em; line-height:1.5; font-weight:700; }
  .verify { width:2.85in; text-align:right; }
  .qr { display:inline-block; line-height:0; }
  .verify-label { font-size:7pt; letter-spacing:.15em; color:${INK_SOFT};
                  text-transform:uppercase; margin-top:6px; }
  .verify-url { font-size:6.7pt; color:${INK_SOFT}; margin-top:2px;
                word-break:break-all; }
  .meta { margin-top:14px; font-size:7.6pt; letter-spacing:.13em;
          color:${INK_SOFT}; text-transform:uppercase; }
</style></head><body>
<div class="sheet">
  <div class="frame"></div>
  <div class="inner">
    <div class="academy">The Pro Audio Training Academy</div>
    <div class="rule-sm"></div>
    <div class="kicker">${kicker}</div>

    <div class="body">
    <div class="lede">This certifies that</div>
    <div class="holder">${holder}</div>
    <div class="holder-rule"></div>

    <div class="lede2">has satisfied every requirement of and is hereby awarded the</div>
    <div class="credential">${name}</div>

    ${date ? `<div class="meta">Awarded ${esc(date)}${shortId ? ` &nbsp;&middot;&nbsp; Credential ${esc(shortId)}` : ''}</div>` : ''}
    </div>

    <div class="foot">
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-name">Professor Channing &ldquo;Ch&aacute;no&rdquo; Booth</div>
        <div class="sig-role">Program Director</div>
      </div>

      <div class="seal">
        <div class="seal-in"><div class="seal-txt">PRO&nbsp;AUDIO<br/>TRAINING<br/>ACADEMY</div></div>
      </div>

      <div class="verify">
        ${qrSvg ? `<div class="qr">${qrSvg}</div>` : ''}
        <div class="verify-label">${qrSvg ? 'Scan to verify' : 'Verify online'}</div>
        ${input.verifyUrl ? `<div class="verify-url">${esc(REGISTRY_HOST_LABEL)}</div>` : ''}
      </div>
    </div>
  </div>
</div>
</body></html>`;
}
