/**
 * Research more (owner 2026-10-24, build 39) — a quiet invitation under a term
 * to keep exploring it on the open web: Wikipedia or a Google search, opened
 * in the phone's OWN browser (never an in-app browser: that would count as
 * "unrestricted web access" in Apple's age rating). Nothing comes back into
 * the app — no text, no image, no thumbnail.
 *
 * Wikipedia: the exact article when the server has one for the term
 * (`wikipedia_url`, found by Computer B, loaded by Computer A — 2026-10-24),
 * otherwise a Wikipedia search for the bare term (Wikipedia jumps straight to
 * an exact-title article; "audio" pulled safety terms like AED off theirs).
 * Google: the term + "audio", to keep a general search on topic.
 *
 * A stored URL is used ONLY if it is an English
 * Wikipedia article URL, so a bad row can never open another site.
 */
import { Linking } from 'react-native';
import { confirmDialog, notify } from '../../lib/confirm';

import { googleImagesUrlFor, googleUrlFor, wikipediaUrlFor } from './researchUrls';

function open(url: string, host: string): void {
  Linking.openURL(url).catch(() => {
    notify('Page unavailable', `We couldn’t open the page — visit ${host} in your browser.`);
  });
}

/** View images ↗ (owner 2026-10-24): straight to Google Images, no popup. */
export function openViewImages(term: string): void {
  const name = term.trim();
  if (name) open(googleImagesUrlFor(name), 'google.com');
}

/** The owner-approved popup (2026-10-24): Wikipedia · Google · Not now. */
export function openResearchMore(term: string, storedWikipediaUrl?: unknown): void {
  const name = term.trim();
  if (!name) return;
  confirmDialog(
    'Research and learn more',
    `Keep exploring “${name}” — see pictures, history and other explanations. These open in your browser, outside the Academy.`,
    'Wikipedia',
    () => open(wikipediaUrlFor(name, storedWikipediaUrl), 'en.wikipedia.org'),
    {
      cancelText: 'Not now',
      alt: { text: 'Google', onPress: () => open(googleUrlFor(name), 'google.com') },
    },
  );
}
