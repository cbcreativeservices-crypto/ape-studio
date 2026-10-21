// The app's font families (src/theme/tokens.ts `fonts`), loaded synchronously
// from node_modules/@expo-google-fonts into CanvasKit typefaces, by family name.
const fs = require('node:fs');
const path = require('node:path');
const { Skia } = require('@shopify/react-native-skia/lib/commonjs/headless').getSkiaExports();

const root = path.dirname(require.resolve('@expo-google-fonts/oswald/package.json')).replace(/oswald$/, '');
const pkgOf = { Oswald: 'oswald', Barlow: 'barlow', BarlowCondensed: 'barlow-condensed', ShareTechMono: 'share-tech-mono', Cinzel: 'cinzel', ChakraPetch: 'chakra-petch', Yellowtail: 'yellowtail' };
const cache = new Map();

/** 'Oswald_500Medium' → its SkTypeface (unknown families fall back to Oswald 500). */
function typeface(family) {
  const fam = family && /_\d00/.test(family) ? family : 'Oswald_500Medium';
  if (cache.has(fam)) return cache.get(fam);
  const [name, weight] = fam.split('_');
  const file = path.join(root, pkgOf[name] ?? 'oswald', weight, `${fam}.ttf`);
  let tf = null;
  if (fs.existsSync(file)) tf = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(file))));
  if (!tf && fam !== 'Oswald_500Medium') tf = typeface('Oswald_500Medium');
  cache.set(fam, tf);
  return tf;
}

const fontCache = new Map();
/** An SkFont for (family, size), cached. */
function font(family, size) {
  const k = `${family}|${size}`;
  if (!fontCache.has(k)) {
    const f = Skia.Font(typeface(family), size);
    f.setSubpixel(true); // unrounded advances: small sizes drawn large stay evenly spaced
    f.setLinearMetrics(true);
    fontCache.set(k, f);
  }
  return fontCache.get(k);
}

module.exports = { typeface, font, provider: () => null };
