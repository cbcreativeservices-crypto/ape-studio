/**
 * Cable Fundamentals drawing kit — pure colour/geometry helpers (no React).
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Darken toward black by `amt` (0..1). */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}
/** Lighten toward white by `amt` (0..1). */
export function tint(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

/** Hex-packed strand centres (mm, about 0,0) filling a bundle of Ø `d` with
 *  strands of Ø `s` — a fine-stranded conductor's real look end-on. */
export function strandCentres(d: number, s: number): [number, number][] {
  const out: [number, number][] = [];
  const R = d / 2 - s / 2;
  const dy = s * Math.sqrt(3) / 2;
  for (let row = -Math.ceil(R / dy); row <= Math.ceil(R / dy); row++) {
    const y = row * dy;
    const off = (row & 1) * (s / 2);
    for (let x = -R - s + off; x <= R + s; x += s) {
      if (x * x + y * y <= R * R + 1e-6) out.push([x, y]);
    }
  }
  return out;
}
