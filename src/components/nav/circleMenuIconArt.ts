/**
 * The CIRCLE MENU's drawn icons, as SVG source (48 × 48 art box).
 *
 * TRACED, NOT REDRAWN (protocol rule 21): Study Dashboard ("Var 2": two
 * stacked cards, "dB" and a bulb), Calculator,
 * Audio Tools ("Tools 3": meter + knob), Glossary ("Glossary 2": open book),
 * Help ("Help 1": speech bubble), Settings ("Knob 1": console channel knob),
 * Enrollment (the graduation mortarboard "cap") and Community (three people)
 * are the owner-approved mockup's own SVG, ported line for line from its
 * svgIcon() (scratchpad qnav-mock/index.html, 2026-11-20): the same paths,
 * gradients and shading. Only the order of definitions changed: every
 * gradient and clip sits in <defs> ahead of its first use, which both
 * renderers want.
 *
 * Home, Progress and Profile keep their bundled PNGs (assets/icons/nav); Labs
 * now wears the headphones PNG (nav-study.png, owner 2026-11-20). The
 * speaker art (`labs`) stays here, unused, should the owner want it back.
 *
 * Pure strings (no imports): node tests can read every icon's XML.
 */

export type IconArt = 'labs' | 'calc' | 'tools3' | 'gloss2' | 'help1' | 'knob1' | 'cap' | 'study3v2' | 'community';

function hexRgb(h: string): [number, number, number] {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(s.substr(i, 2), 16)) as [number, number, number];
}
/** The mockup's mix(): `h` moved toward `t` by `a`. */
export function mix(h: string, t: string, a: number): string {
  const c = hexRgb(h);
  const d = hexRgb(t);
  return 'rgb(' + c.map((v, i) => Math.round(v + (d[i] - v) * a)).join(',') + ')';
}

let UID = 0;
const EDGE = 'stroke="rgba(0,0,0,.38)" stroke-width=".9"';
const CUT = '#121212';

function pol(cx: number, cy: number, a: number, r: number): [string, string] {
  return [(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(2), (cy - r * Math.sin((a * Math.PI) / 180)).toFixed(2)];
}
function arcP(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const p1 = pol(cx, cy, a1, r);
  const p2 = pol(cx, cy, a2, r);
  return `M${p1[0]} ${p1[1]} A${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}`;
}
function ticksP(cx: number, cy: number, r1: number, r2: number, angs: number[]): string {
  return angs
    .map((a) => {
      const p1 = pol(cx, cy, a, r1);
      const p2 = pol(cx, cy, a, r2);
      return `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`;
    })
    .join(' ');
}

/** The "dB" written on the Study Dashboard card: Oswald Bold 13.5 at (6.2, 37.2)
 *  on the 48 box, ink #3a2614 (the mockup's <text>), converted to outline
 *  paths from the app's own Oswald_700Bold.ttf so iPhone and Android draw the
 *  same letters with no font lookup inside the SVG. */
const DB_INK = '<path fill="#3a2614" d="M8.58 37.34Q7.71 37.34 7.24 36.73Q6.77 36.12 6.77 34.93V31.71Q6.77 30.98 6.97 30.43Q7.17 29.88 7.58 29.57Q7.98 29.26 8.58 29.26Q9.01 29.26 9.4 29.43Q9.79 29.6 10.12 29.88V26.27H12.32V37.2H10.12V36.59Q9.75 36.94 9.36 37.14Q8.97 37.34 8.58 37.34ZM9.53 35.93Q9.64 35.93 9.8 35.88Q9.95 35.82 10.12 35.73V30.8Q9.98 30.73 9.83 30.68Q9.68 30.63 9.55 30.63Q9.25 30.63 9.12 30.88Q8.98 31.13 8.98 31.48V35.07Q8.98 35.31 9.04 35.51Q9.09 35.7 9.21 35.82Q9.33 35.93 9.53 35.93Z M13.8 37.2V26.27H16.65Q17.35 26.27 17.98 26.37Q18.61 26.48 19.09 26.78Q19.58 27.09 19.86 27.65Q20.13 28.21 20.13 29.13Q20.13 29.79 19.94 30.24Q19.74 30.69 19.38 30.96Q19.02 31.23 18.53 31.33Q19.16 31.41 19.59 31.74Q20.02 32.07 20.25 32.62Q20.47 33.18 20.47 33.96Q20.47 34.81 20.25 35.42Q20.02 36.04 19.61 36.43Q19.19 36.82 18.57 37.01Q17.96 37.2 17.16 37.2ZM16.22 35.51H16.73Q17.53 35.51 17.83 35.11Q18.13 34.7 18.13 33.92Q18.13 33.3 18 32.93Q17.86 32.57 17.55 32.4Q17.24 32.23 16.72 32.23H16.22ZM16.22 30.64H16.69Q17.24 30.64 17.53 30.47Q17.81 30.3 17.91 29.98Q18.01 29.65 18.01 29.19Q18.01 28.76 17.86 28.47Q17.7 28.18 17.4 28.03Q17.09 27.89 16.64 27.89H16.22Z"/>';

/** One icon's full <svg> source in colour `c`. */
export function iconXml(name: IconArt, c: string): string {
  const u = 'cm' + UID++;
  const g = `url(#${u})`;
  const g2 = `url(#${u}b)`;
  const lt = mix(c, '#ffffff', 0.45);
  const dk = mix(c, '#000000', 0.35);
  let defs =
    `<linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.28)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.24)}"/></linearGradient>` +
    `<radialGradient id="${u}b" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="${mix(c, '#000000', 0.55)}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.1)}"/></radialGradient>` +
    `<linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#262626"/></linearGradient>` +
    `<linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f0cf93"/></linearGradient>` +
    `<linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd9df"/></linearGradient>` +
    `<radialGradient id="${u}m" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".6" stop-color="#9a9a9e"/><stop offset="1" stop-color="#4a4a4e"/></radialGradient>`;
  const S = `url(#${u}s)`;
  const K = `url(#${u}k)`;
  const F = `url(#${u}f)`;
  const PG = `url(#${u}p)`;
  const M = `url(#${u}m)`;
  let body = '';

  if (name === 'community') {
    // The Audio Community: three people, the front one stepping forward.
    const bust = (cx: number, cy: number, hr: number, sw: number, sh: number, fill: string) =>
      `<path d="M${cx - sw} ${cy + hr + sh} C${cx - sw} ${cy + hr + 3} ${cx - sw * 0.55} ${cy + hr + 1.2} ${cx} ${cy + hr + 1.2} C${cx + sw * 0.55} ${cy + hr + 1.2} ${cx + sw} ${cy + hr + 3} ${cx + sw} ${cy + hr + sh} Z" fill="${fill}" ${EDGE}/>` +
      `<circle cx="${cx}" cy="${cy}" r="${hr}" fill="${fill}" ${EDGE}/>`;
    const back = mix(c, '#000000', 0.28);
    defs += `<linearGradient id="${u}bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.12)}"/><stop offset="1" stop-color="${back}"/></linearGradient>`;
    body = `${bust(11.6, 15.2, 5, 8.8, 15, `url(#${u}bk)`)}${bust(36.4, 15.2, 5, 8.8, 15, `url(#${u}bk)`)}
    <path d="M10.4 44 C10.4 33 16.2 28.6 24 28.6 C31.8 28.6 37.6 33 37.6 44 Z" fill="#121212" opacity=".55"/>
    <circle cx="24" cy="18.6" r="8" fill="#121212" opacity=".55"/>
    ${bust(24, 18.4, 6.6, 12.2, 17.2, g)}
    <ellipse cx="21.6" cy="15.2" rx="2.8" ry="2" fill="#fff" opacity=".4"/>
    <path d="M16.2 33.4 C18.4 31 21 30.4 24 30.4 C27 30.4 29.6 31 31.8 33.4" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-linecap="round"/>
    <path d="M7.4 21.6 C8.6 21 10 20.8 11.6 20.8" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".8" stroke-linecap="round"/>
    <path d="M40.6 21.6 C39.4 21 38 20.8 36.4 20.8" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".8" stroke-linecap="round"/>`;
  }

  if (name === 'tools3') {
    // Meter + knob: VU face on top, knurled gain knob and two LEDs below.
    const x = 7.2, y = 7.6, w = 33.6, h = 18.6, cx = 24, cy = 31.6, r = 18.6, needle = 68;
    defs += `<clipPath id="${u}v"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6"/></clipPath>`;
    const vuFace = `<rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="2.4" fill="${K}"/>
    <g clip-path="url(#${u}v)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${F}"/>
      <path d="${arcP(cx, cy, r, 142, 62)}" fill="none" stroke="#2a2a2a" stroke-width="1.1"/>
      <path d="${arcP(cx, cy, r, 62, 40)}" fill="none" stroke="#d8261c" stroke-width="2.6"/>
      <path d="${ticksP(cx, cy, r - 2.4, r, [142, 124, 106, 88, 72])}" stroke="#2a2a2a" stroke-width="1"/>
      <path d="${ticksP(cx, cy, r - 2.4, r, [56, 46])}" stroke="#d8261c" stroke-width="1"/>
      <line x1="${cx}" y1="${cy}" x2="${pol(cx, cy, needle, r + 1.5)[0]}" y2="${pol(cx, cy, needle, r + 1.5)[1]}" stroke="#141414" stroke-width="1.15" stroke-linecap="round"/>
      <path d="M${x} ${y} H${x + w * 0.55} L${x + w * 0.22} ${y + h} H${x} Z" fill="#fff" opacity=".18"/></g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
    let knurl = '';
    for (let i = 0; i < 24; i++) {
      const a = i * 15;
      const kr = i % 2 ? 5.9 : 6.6;
      knurl += (i ? 'L' : 'M') + pol(31.5, 35, a, kr).join(' ') + ' ';
    }
    body = `<rect x="3" y="3.5" width="42" height="41" rx="5" fill="${g}" ${EDGE}/>
    <rect x="3" y="3.5" width="42" height="15" rx="5" fill="${S}" opacity=".55"/>
    <rect x="4.4" y="4.9" width="39.2" height="38.2" rx="3.9" fill="none" stroke="rgba(255,255,255,.32)" stroke-width=".8"/>
    ${vuFace}
    <circle cx="11.4" cy="32.6" r="1.9" fill="${K}"/><circle cx="11.4" cy="32.6" r="1.25" fill="#5bff85"/><circle cx="11.4" cy="32.6" r="2.6" fill="#5bff85" opacity=".25"/>
    <circle cx="11.4" cy="38.6" r="1.9" fill="${K}"/><circle cx="11.4" cy="38.6" r="1.25" fill="#7a1d16"/>
    <rect x="15" y="32" width="6.5" height="1.2" rx=".6" fill="rgba(0,0,0,.4)"/><rect x="15" y="38" width="6.5" height="1.2" rx=".6" fill="rgba(0,0,0,.4)"/>
    <circle cx="31.5" cy="35.6" r="7" fill="rgba(0,0,0,.35)"/>
    <path d="${knurl}Z" fill="#2b2b2e" stroke="rgba(0,0,0,.6)" stroke-width=".4"/>
    <circle cx="31.5" cy="35" r="4.6" fill="${M}" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>
    <line x1="31.5" y1="35" x2="${pol(31.5, 35, 128, 4)[0]}" y2="${pol(31.5, 35, 128, 4)[1]}" stroke="#1a1a1a" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  if (name === 'gloss2') {
    // Open dictionary: A on the left page, Z on the right, ribbon.
    defs += `<linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
    body = `<path d="M2.4 14.5 L24 18 L45.6 14.5 V39.6 L24 43.6 L2.4 39.6 Z" fill="${g}" ${EDGE} stroke-linejoin="round"/>
    <path d="M4 38.6 C11 36.4 18 37.2 24 40.8 M44 38.6 C37 36.4 30 37.2 24 40.8" fill="none" stroke="#c4ced5" stroke-width="1.6"/>
    <path d="M4.2 12 C11 9.4 18 10.4 24 14 V39.6 C18 36.2 11 35.4 4.2 37.6 Z" fill="${PG}" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>
    <path d="M43.8 12 C37 9.4 30 10.4 24 14 V39.6 C30 36.2 37 35.4 43.8 37.6 Z" fill="${PG}" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>
    <rect x="20.5" y="13" width="7" height="27" fill="url(#${u}g)"/>
    <g fill="none" stroke="${mix(c, '#000000', 0.45)}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 30.4 L12.9 17 L16.8 30.4 M10.4 25.8 H15.4"/><path d="M30.6 17.4 H38.6 L30.6 30 H38.6"/></g>
    <path d="M8.6 34 C11.6 33.2 14.6 33.2 17.6 34.2 M30.4 34.2 C33.4 33.2 36.4 33.2 39.4 34" fill="none" stroke="#b4bfc6" stroke-width=".8"/>
    <path d="M24.8 39.4 V46.4 L26.3 45 L27.8 46.4 V38.6 Z" fill="#ff5a48"/>`;
  }

  if (name === 'help1') {
    // Thick glossy speech bubble with an embossed question mark.
    const bubbleA =
      'M24 4 C35.6 4 44.5 11.2 44.5 20.2 C44.5 29.2 35.6 36.4 24 36.4 C21.7 36.4 19.6 36.1 17.6 35.6 L9 42 L11 32.4 C6.4 29.5 3.5 25.1 3.5 20.2 C3.5 11.2 12.4 4 24 4 Z';
    const qMark = (dx: number, dy: number, sc: number, col: string, w: number) =>
      `<g transform="translate(${dx} ${dy}) scale(${sc})"><path d="M-4.6 -6.2 A4.9 4.9 0 1 1 2.6 -1.6 C1 -.7 0 .2 0 2.2 V3.1" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><circle cx="0" cy="8.4" r="${w * 0.62}" fill="${col}"/></g>`;
    body = `<path d="${bubbleA}" transform="translate(0 2.2)" fill="${dk}"/>
    <path d="${bubbleA}" fill="${g}" ${EDGE} stroke-linejoin="round"/>
    <path d="M24 5.4 C34.2 5.4 42.4 11.2 43 18.8 C38 13.2 31.4 11.4 24 11.4 C16.6 11.4 10 13.2 5 18.8 C5.6 11.2 13.8 5.4 24 5.4 Z" fill="${S}" opacity=".85"/>
    <path d="M7 27 C10 31.6 16.4 34.8 24 34.8 C31.6 34.8 38 31.6 41 27" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>
    ${qMark(24.7, 20.9, 1, 'rgba(0,0,0,.35)', 3.6)}${qMark(24, 20.2, 1, '#ffffff', 3.6)}`;
  }

  if (name === 'labs') {
    // The app's official Labs mark: a loudspeaker (cabinet, tweeter, woofer, dust cap).
    body = `<rect x="10" y="2.5" width="28" height="43" rx="4.5" fill="${g}" ${EDGE}/>
    <rect x="11.3" y="3.8" width="25.4" height="40.4" rx="3.5" fill="none" stroke="rgba(255,255,255,.28)" stroke-width=".8"/>
    <g fill="${CUT}" opacity=".7"><circle cx="14.2" cy="6.8" r="1.05"/><circle cx="33.8" cy="6.8" r="1.05"/><circle cx="14.2" cy="41.2" r="1.05"/><circle cx="33.8" cy="41.2" r="1.05"/></g>
    <circle cx="24" cy="12.6" r="5.3" fill="${CUT}"/><circle cx="24" cy="12.6" r="3.7" fill="${g2}"/><circle cx="23.4" cy="12" r="1.9" fill="${lt}"/>
    <circle cx="24" cy="30.2" r="11.2" fill="${CUT}"/><circle cx="24" cy="30.2" r="9.7" fill="none" stroke="${mix(c, '#ffffff', 0.15)}" stroke-width="1.5"/>
    <circle cx="24" cy="30.2" r="8.2" fill="${g2}"/><circle cx="24" cy="30.2" r="3.5" fill="${g}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/><ellipse cx="23" cy="29" rx="1.3" ry=".9" fill="rgba(255,255,255,.55)"/>`;
  }

  if (name === 'calc') {
    let keys = '';
    const xs = [13, 18.95, 24.9, 30.85];
    const ys = [20.6, 26.4, 32.2, 38];
    ys.forEach((y, r) =>
      xs.forEach((x, ci) => {
        if (ci === 3 && r >= 2) {
          if (r === 2) keys += `<rect x="${x}" y="${y}" width="4.4" height="9.9" rx="1" fill="${lt}" opacity=".95"/>`;
          return;
        }
        keys += `<rect x="${x}" y="${y}" width="4.4" height="4.1" rx="1" fill="${CUT}" opacity=".82"/>`;
      }),
    );
    body = `<rect x="9" y="2.5" width="30" height="43" rx="5" fill="${g}" ${EDGE}/>
    <rect x="10.3" y="3.8" width="27.4" height="40.4" rx="4" fill="none" stroke="rgba(255,255,255,.26)" stroke-width=".8"/>
    <rect x="13" y="7" width="22.25" height="10" rx="1.7" fill="${CUT}"/>
    <g fill="${lt}"><rect x="22.6" y="10.1" width="2.6" height="3.9" rx=".5"/><rect x="26.2" y="10.1" width="2.6" height="3.9" rx=".5"/><rect x="29.8" y="10.1" width="2.6" height="3.9" rx=".5"/></g>${keys}`;
  }

  if (name === 'study3v2') {
    // Study Dashboard (owner's FINAL pick 2026-11-20, "Var 2: two stacked
    // cards"): an orange back card offset up and right, a white front card with
    // a bold "dB", and a small lit bulb with four rays at the top right. The
    // mockup's study3v2 (with its bulbG helper), traced; the bulb's nested
    // translate/scale is folded into one matrix (0.66 about 33,15, moved 5.4,
    // -3.8) and its outline keeps the mockup's 0.7 / 0.66 stroke.
    let rays = '';
    [35, 70, 105, 140].forEach((a) => {
      const p1 = pol(33, 15.4, a, 11.6);
      const p2 = pol(33, 15.4, a, 14.6);
      rays += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="#ffd24d" stroke-width="1.9" stroke-linecap="round"/>`;
    });
    defs +=
      `<radialGradient id="${u}bv" cx=".42" cy=".36" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="${c}"/></radialGradient>` +
      `<radialGradient id="${u}gw" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd24d" stop-opacity=".45"/><stop offset="1" stop-color="#ffd24d" stop-opacity="0"/></radialGradient>`;
    body = `<rect x="8" y="15" width="31" height="22" rx="2.2" fill="${g}" ${EDGE}/>
    <rect x="8" y="15" width="31" height="6" rx="2.2" fill="${S}" opacity=".45"/>
    <rect x="3" y="20" width="31" height="22.5" rx="2.2" transform="translate(.8 1.4)" fill="rgba(0,0,0,.42)"/>
    <rect x="3" y="20" width="31" height="22.5" rx="2.2" fill="${PG}" stroke="rgba(0,0,0,.38)" stroke-width=".7"/>
    <line x1="4.4" y1="25" x2="32.6" y2="25" stroke="${c}" stroke-width="1.1"/>
    ${DB_INK}
    <path d="M6.6 40.2 H20" stroke="#a9c3d6" stroke-width=".9" stroke-linecap="round"/>
    <g transform="matrix(.66 0 0 .66 16.62 1.3)">
      <circle cx="33" cy="15.4" r="12.5" fill="url(#${u}gw)"/>${rays}
      <path d="M33 6.6 C38 6.6 41.4 10.2 41.4 14.6 C41.4 17.8 39.6 19.6 38.2 21 C37.4 21.8 36.8 22.8 36.8 24 H29.2 C29.2 22.8 28.6 21.8 27.8 21 C26.4 19.6 24.6 17.8 24.6 14.6 C24.6 10.2 28 6.6 33 6.6 Z" fill="url(#${u}bv)" stroke="rgba(0,0,0,.4)" stroke-width="1.06"/>
      <path d="M30.4 21.6 C30.4 18.6 31.2 16.6 31.8 15.6 C32.4 14.6 33.6 14.6 34.2 15.6 C34.8 16.6 35.6 18.6 35.6 21.6" fill="none" stroke="#c0600a" stroke-width=".9"/>
      <ellipse cx="30.2" cy="10.6" rx="2.4" ry="1.6" fill="#fff" opacity=".7"/>
      <rect x="29" y="24" width="8" height="5.6" rx="1" fill="${M}" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>
      <path d="M29.2 25.8 H36.8 M29.2 27.6 H36.8" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>
      <path d="M30.6 29.6 H35.4 L34.2 31.4 H31.8 Z" fill="#2b2b2b"/>
    </g>`;
  }

  if (name === 'cap') {
    // Enrollment (owner 2026-11-20): a graduation mortarboard with a gold
    // tassel, the mockup's final "cap", traced line for line.
    defs +=
      `<linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c, '#000000', 0.35)}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.6)}"/></linearGradient>` +
      `<linearGradient id="${u}tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#e0a020"/></linearGradient>`;
    body = `<path d="M11.4 22.4 V31.2 C11.4 35.8 17 38.6 24 38.6 C31 38.6 36.6 35.8 36.6 31.2 V22.4 L24 28.2 Z" fill="url(#${u}sk)" ${EDGE}/>
    <path d="M13 31.6 C15.6 34.2 19.6 35.4 24 35.4 C28.4 35.4 32.4 34.2 35 31.6" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".9"/>
    <path d="M2.6 17.2 L24 26.2 L45.4 17.2 V19.6 L24 28.6 L2.6 19.6 Z" fill="${dk}" ${EDGE} stroke-linejoin="round"/>
    <path d="M24 8 L45.4 17.2 L24 26.2 L2.6 17.2 Z" fill="${g}" ${EDGE} stroke-linejoin="round"/>
    <path d="M24 9.6 L41.6 17.2 L24 13.6 L6.4 17.2 Z" fill="${S}" opacity=".7"/>
    <path d="M24 17.2 C30 18.2 36 19.4 39.4 20.6 V31.4" fill="none" stroke="url(#${u}tg)" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="24" cy="17.2" r="1.9" fill="url(#${u}tg)" stroke="rgba(0,0,0,.35)" stroke-width=".4"/>
    <path d="M38 31 H40.8 L41.9 38.6 H36.9 Z" fill="url(#${u}tg)" stroke="rgba(0,0,0,.35)" stroke-width=".4"/>
    <path d="M38.2 33 L37.8 38.4 M39.4 33 V38.4 M40.6 33 L41 38.4" stroke="rgba(120,70,0,.55)" stroke-width=".4"/>
    <rect x="37.6" y="30.2" width="3.6" height="1.6" rx=".6" fill="#c98a12"/>`;
  }

  if (name === 'knob1') {
    // Settings (owner 2026-11-20: "Knob 1, console channel knob"): a channel-
    // strip pot seen from above: an 11-tick scale, a knurled silver-grey
    // skirt, a dark charcoal cap with a concave highlight and a white pointer.
    // The mockup's knob1, traced line for line.
    let ticks = '';
    for (let i = 0; i < 11; i++) {
      const a = 225 - i * 27;
      const r1 = i % 5 === 0 ? 18.6 : 19.6;
      const r2 = 22.2;
      const p1 = pol(24, 24, a, r1);
      const p2 = pol(24, 24, a, r2);
      ticks += `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} `;
    }
    let knurl = '';
    for (let i = 0; i < 36; i++) {
      const a = i * 10;
      const kr = i % 2 ? 15.2 : 16.4;
      knurl += (i ? 'L' : 'M') + pol(24, 24.6, a, kr).join(' ') + ' ';
    }
    const pt = pol(24, 24, 132, 9.4);
    const pb = pol(24, 24, 132, 3.2);
    defs += `<radialGradient id="${u}cp" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#5a5d63"/><stop offset=".55" stop-color="#2a2c30"/><stop offset="1" stop-color="#16171a"/></radialGradient>`;
    body = `<path d="${ticks}" stroke="${lt}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="24" cy="25.6" r="16.4" fill="rgba(0,0,0,.45)"/>
    <path d="${knurl}Z" fill="${g}" stroke="rgba(0,0,0,.5)" stroke-width=".5"/>
    <circle cx="24" cy="24.6" r="13.4" fill="${dk}"/>
    <circle cx="24" cy="24" r="11.4" fill="url(#${u}cp)" stroke="rgba(0,0,0,.6)" stroke-width=".6"/>
    <ellipse cx="21" cy="19.4" rx="5.2" ry="2.8" fill="#fff" opacity=".14"/>
    <line x1="${pb[0]}" y1="${pb[1]}" x2="${pt[0]}" y2="${pt[1]}" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>`;
  }

  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
}

/** The art each drawn circle uses (owner's picks, 2026-11-20). */
export const DRAWN_ICON: Readonly<Record<string, IconArt>> = {
  study: 'study3v2',
  calc: 'calc',
  tools: 'tools3',
  gloss: 'gloss2',
  help: 'help1',
  set: 'knob1',
  enroll: 'cap',
  comm: 'community',
};

/** The MENU button's own mark: a little ring of 11 dots (a picture of the
 *  circle menu), 23.5 pt across — the mockup's menuMark(). */
export function menuMarkXml(): string {
  let d = '';
  for (let i = 0; i < 11; i++) {
    const a = ((270 - (i * 360) / 11) * Math.PI) / 180;
    d += `<circle cx="${(8 + 5.6 * Math.cos(a)).toFixed(2)}" cy="${(8 - 5.6 * Math.sin(a)).toFixed(2)}" r="1.25"/>`;
  }
  return `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g fill="#d9d9dc">${d}</g></svg>`;
}
