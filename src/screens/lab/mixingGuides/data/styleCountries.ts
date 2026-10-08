/**
 * Where each of the 50 styles comes from — the countries the hub's world map
 * fills (owner 2026-10-07: "when a user hovers over a music card it fills in
 * and shows the country's location on the map").
 *
 * Read from each guide's own `origin` line (data/index.ts): the country or
 * countries the style was BORN in or first took shape in — not everywhere it
 * later spread to. Keys are ISO 3166-1 numeric codes, matching
 * worldMap.ts COUNTRIES. A test pins that every style has at least one country
 * and every code has a shape.
 */
export const COUNTRY_LABEL: Readonly<Record<string, string>> = {
  '036': 'Australia',
  '040': 'Austria',
  '056': 'Belgium',
  '076': 'Brazil',
  '124': 'Canada',
  '156': 'China',
  '158': 'Taiwan',
  '170': 'Colombia',
  '192': 'Cuba',
  '214': 'Dominican Republic',
  '250': 'France',
  '276': 'Germany',
  '288': 'Ghana',
  '344': 'Hong Kong',
  '356': 'India',
  '360': 'Indonesia',
  '380': 'Italy',
  '388': 'Jamaica',
  '392': 'Japan',
  '410': 'South Korea',
  '422': 'Lebanon',
  '484': 'Mexico',
  '528': 'Netherlands',
  '566': 'Nigeria',
  '586': 'Pakistan',
  '591': 'Panama',
  '630': 'Puerto Rico',
  '710': 'South Africa',
  '724': 'Spain',
  '752': 'Sweden',
  '756': 'Switzerland',
  '792': 'Turkey',
  '818': 'Egypt',
  '826': 'United Kingdom',
  '840': 'United States',
};

const US = '840', UK = '826';

export const STYLE_COUNTRIES: Readonly<Record<string, readonly string[]>> = {
  pop: [US, UK],
  'hip-hop-rap': [US],
  rock: [US, UK],
  'contemporary-rnb': [US],
  'edm-festival-electronic': ['528', '752', '056', UK, US],
  country: [US],
  'latin-pop': ['724', '484', '076', US],
  reggaeton: ['591', '630'],
  'regional-mexican': ['484', US],
  'k-pop': ['410'],
  'alternative-indie-rock': [US, UK],
  'christian-contemporary-worship': [US, UK, '036'],
  'bollywood-indian-film-music': ['356'],
  afrobeats: ['566', '288', UK],
  'classical-orchestral': ['040', '276', '250', '380'],
  'film-video-game-score': [US, UK],
  trap: [US],
  house: [US],
  'heavy-metal': [UK, US, '276', '752'],
  gospel: [US],
  jazz: [US],
  soul: [US],
  'hard-rock': [UK, US],
  'j-pop': ['392'],
  'c-pop-mandopop': ['156', '158', '344'],
  'indie-pop': [UK, US],
  'punk-pop-punk': [US, UK],
  reggae: ['388'],
  sertanejo: ['076'],
  'punjabi-pop-bhangra': ['356', '586', UK, '124'],
  blues: [US],
  funk: [US],
  techno: [US, '276'],
  'folk-singer-songwriter': [US, '124', UK],
  'brazilian-funk': ['076'],
  dancehall: ['388'],
  amapiano: ['710'],
  salsa: [US, '192', '630'],
  bachata: ['214'],
  cumbia: ['170'],
  'arabic-pop': ['818', '422'],
  'turkish-pop': ['792'],
  dangdut: ['360'],
  'mpb-bossa-nova': ['076'],
  'drum-and-bass': [UK],
  'lo-fi-chillhop': [US, '392'],
  'bluegrass-americana': [US],
  'musical-theatre': [US, UK],
  'disco-nu-disco': [US, '276'],
  'french-variete-chanson': ['250', '056', '756', '124'],
};

/** "United States and United Kingdom", "Netherlands, Sweden, Belgium, United Kingdom and United States". */
export function countryList(styleId: string): string {
  const names = (STYLE_COUNTRIES[styleId] ?? []).map((c) => COUNTRY_LABEL[c] ?? c);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
