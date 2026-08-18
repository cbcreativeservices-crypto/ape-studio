// SVGR config for react-native-svg-transformer (Booth 2026-08-17).
// svgo:false keeps the Measurement-tool strip SVGs EXACTLY as delivered —
// the design team hand-suffixed every gradient id (amb_b06, mir_b06, …) to
// stop cross-tile collisions when all 8 render on one screen. SVGO's default
// id-minification renames them back to a,b,c,… and reintroduces that bug on
// web. Disabling SVGO honors the work order's "do not run SVGO" rule.
module.exports = { svgo: false };
