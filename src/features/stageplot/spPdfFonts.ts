/**
 * stageplot/spPdfFonts — what the PDF writer (spPdf.ts) must know about its
 * fonts: how wide every character is, and which byte stands for it.
 *
 * The packet uses the PDF standard fonts Helvetica and Helvetica-Bold, which
 * every PDF reader carries, so no font file is put in the PDF. A standard
 * font is asked for by NAME only, so the writer has to know the advance
 * widths itself to wrap a line, center a label or size a table cell.
 *
 * THE WIDTHS are the published Adobe AFM advance widths (1000 units = the
 * font size), for the WinAnsi character codes 32–255. Both tables were
 * checked on 2026-11-12, code by code, against the Base-14 metric fonts of
 * a PDF engine (MuPDF's `helv` and `hebo`): 0 differences. (Arial is NOT a
 * safe reference: it differs from Helvetica at 5 codes: 175, 177, 181, 183,
 * 247.) The codes WinAnsi leaves undefined (127, 129, 141, 143, 144, 157)
 * are 0 here, and `spPdfEncode` never produces them.
 *
 * THE ENCODING is WinAnsi (Windows code page 1252), so á é í ó ú ñ ü ’ – —
 * are one byte each and print correctly. A character outside WinAnsi is
 * replaced with plain text that keeps its meaning ("≥" → ">="), an accented
 * letter with its base letter, and anything unknown with "?": a character
 * is never dropped silently, except the invisible ones.
 *
 * The four check and cross marks (✓ ✔ ✗ ✘) are not in WinAnsi. They are
 * printed from the third standard font, ZapfDingbats, so "✓" stays a real,
 * selectable "✓". Their widths were checked the same way (MuPDF `zadb`).
 *
 * Pure data and pure functions: no Node, no DOM, no React.
 */

/** Helvetica: advance widths of WinAnsi codes 32–255 (index = code − 32). */
// prettier-ignore
export const SP_PDF_HELVETICA: readonly number[] = [
  /*  32 */ 278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  /*  48 */ 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  /*  64 */ 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  /*  80 */ 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  /*  96 */ 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  /* 112 */ 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0,
  /* 128 */ 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  /* 144 */ 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
  /* 160 */ 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  /* 176 */ 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  /* 192 */ 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  /* 208 */ 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  /* 224 */ 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
  /* 240 */ 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
];

/** Helvetica-Bold: advance widths of WinAnsi codes 32–255 (index = code − 32). */
// prettier-ignore
export const SP_PDF_HELVETICA_BOLD: readonly number[] = [
  /*  32 */ 278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  /*  48 */ 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  /*  64 */ 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  /*  80 */ 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  /*  96 */ 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  /* 112 */ 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0,
  /* 128 */ 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  /* 144 */ 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
  /* 160 */ 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  /* 176 */ 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  /* 192 */ 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  /* 208 */ 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  /* 224 */ 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
  /* 240 */ 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
];

/**
 * ENCODED TEXT: a string in which every character code is a WinAnsi byte
 * (32–255), a line break (10), or one of the marks below. The writer works
 * on encoded text only, so a width and the printed bytes always agree.
 */
export type SpPdfText = string;

/** The marks printed from ZapfDingbats. `code` is this module's own code for
 *  the mark inside encoded text (above 255, so it can never be a WinAnsi
 *  byte); `byte` is the mark's code in the ZapfDingbats font. */
export const SP_PDF_MARKS: readonly { char: string; code: number; byte: number; width: number }[] = [
  { char: '✓', code: 0x100, byte: 0x33, width: 755 }, // ✓ (glyph a19)
  { char: '✔', code: 0x101, byte: 0x34, width: 846 }, // ✔ (a20)
  { char: '✗', code: 0x102, byte: 0x37, width: 571 }, // ✗ (a23)
  { char: '✘', code: 0x103, byte: 0x38, width: 677 }, // ✘ (a24)
];
export const spPdfIsMark = (code: number): boolean => code >= 0x100 && code <= 0x103;

/** Unicode → WinAnsi for the 27 characters of the 128–159 block (the rest of
 *  WinAnsi, 32–126 and 160–255, has the same code as Unicode). */
const HIGH: Record<number, number> = {
  0x20ac: 128, 0x201a: 130, 0x0192: 131, 0x201e: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135, 0x02c6: 136, 0x2030: 137,
  0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017d: 142, 0x2018: 145, 0x2019: 146, 0x201c: 147, 0x201d: 148, 0x2022: 149,
  0x2013: 150, 0x2014: 151, 0x02dc: 152, 0x2122: 153, 0x0161: 154, 0x203a: 155, 0x0153: 156, 0x017e: 158, 0x0178: 159,
};

/** A character outside WinAnsi → text that keeps its meaning. The value is
 *  ordinary text and is encoded in turn. */
const SUBSTITUTE: Record<number, string> = {
  0x2265: '>=', 0x2264: '<=', 0x2260: '!=', 0x2248: '~', 0x2192: '->', 0x2190: '<-', 0x2194: '<->', 0x21d2: '=>',
  0x2212: '-', 0x2010: '-', 0x2011: '-', 0x2012: '–', 0x2015: '—', 0x2032: "'", 0x2033: '"', 0x2044: '/', 0x2215: '/',
  0x2126: 'ohm', 0x03a9: 'ohm', 0x03bc: 'µ', 0x2103: '°C', 0x2109: '°F', 0x2116: 'No.', 0x266f: '#', 0x266d: 'b',
  0x24d8: '(i)', 0x2139: '(i)', 0x26a0: '(!)', 0x2715: '✗', 0x2716: '✘', 0x2611: '✓', 0x2705: '✓', 0x274c: '✗',
  0x25cf: '•', 0x25e6: '•', 0x2023: '•', 0x2043: '-', 0x25aa: '•', 0x25a0: '•',
  0xfb01: 'fi', 0xfb02: 'fl', 0x0142: 'l', 0x0141: 'L', 0x0111: 'd', 0x0110: 'D', 0x0131: 'i', 0x0127: 'h', 0x0126: 'H',
  0x201b: '’', 0x201f: '”', 0x2e3a: '——', 0x2e3b: '———',
};

/** Spaces of other widths → a plain space. */
const isOtherSpace = (cp: number): boolean => cp === 0x09 || cp === 0x1680 || (cp >= 0x2000 && cp <= 0x200a) || cp === 0x205f || cp === 0x3000;
/** Invisible characters: the only ones that are left out. */
const isInvisible = (cp: number): boolean =>
  cp === 0xad || (cp >= 0x200b && cp <= 0x200f) || cp === 0x2060 || cp === 0xfeff || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x0300 && cp <= 0x036f);

const MARK_BY_CHAR: Record<number, number> = {};
for (const m of SP_PDF_MARKS) MARK_BY_CHAR[m.char.charCodeAt(0)] = m.code;

/** The base letter of an accented letter that WinAnsi lacks ("ć" → "c"), or
 *  '' when there is none. `normalize` is guarded: an engine without it gives
 *  '' and the caller prints "?". */
function baseLetter(ch: string): string {
  try {
    if (typeof ch.normalize !== 'function') return '';
    const d = ch.normalize('NFD');
    let out = '';
    for (let i = 0; i < d.length; i++) {
      const c = d.charCodeAt(i);
      if (c >= 0x0300 && c <= 0x036f) continue;
      out += d[i];
    }
    return out !== ch && out.length > 0 ? out : '';
  } catch {
    return '';
  }
}

/** Any text → encoded text (see `SpPdfText`). Line breaks are kept as code
 *  10 (CR LF and CR become one); a tab becomes a space. */
export function spPdfEncode(text: string, depth = 0): SpPdfText {
  let s = String(text ?? '');
  // "e" + a combining accent becomes the one character "é" first, so the
  // accent is printed and not left out
  if (depth === 0) {
    try {
      if (typeof s.normalize === 'function') s = s.normalize('NFC');
    } catch {
      // an engine that cannot normalize: the text is used as it is
    }
  }
  let out = '';
  for (let i = 0; i < s.length; i++) {
    let cp = s.charCodeAt(i);
    // a surrogate pair is ONE character
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < s.length) {
      const lo = s.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        cp = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00);
        i++;
      }
    }
    if (cp === 13) {
      if (s.charCodeAt(i + 1) === 10) i++;
      out += '\n';
    } else if (cp === 10 || cp === 0x2028 || cp === 0x2029) out += '\n';
    else if ((cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255 && cp !== 0xad)) out += String.fromCharCode(cp);
    else if (HIGH[cp] !== undefined) out += String.fromCharCode(HIGH[cp]);
    else if (MARK_BY_CHAR[cp] !== undefined) out += String.fromCharCode(MARK_BY_CHAR[cp]);
    else if (isOtherSpace(cp) || cp === 0x202f) out += cp === 0x202f ? String.fromCharCode(160) : ' ';
    else if (isInvisible(cp) || cp < 32 || (cp >= 127 && cp < 160)) continue;
    else if (SUBSTITUTE[cp] !== undefined && depth < 2) out += spPdfEncode(SUBSTITUTE[cp], depth + 1);
    else {
      const base = cp <= 0xffff && depth < 2 ? baseLetter(String.fromCharCode(cp)) : '';
      out += base ? spPdfEncode(base, depth + 1) : '?';
    }
  }
  return out;
}

/** The advance width of ONE code of encoded text, in 1/1000 of the font size. */
export function spPdfCodeWidth(code: number, bold: boolean): number {
  if (code >= 32 && code <= 255) return (bold ? SP_PDF_HELVETICA_BOLD : SP_PDF_HELVETICA)[code - 32];
  if (spPdfIsMark(code)) return SP_PDF_MARKS[code - 0x100].width;
  return 0;
}

/** The printed width of encoded text on one line, in points. */
export function spPdfWidth(text: SpPdfText, size: number, bold: boolean): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) w += spPdfCodeWidth(text.charCodeAt(i), bold);
  return (w * size) / 1000;
}
