/**
 * The website pages Profile › ON THE WEBSITE links to (owner 2026-11-01).
 * Pure data, no React: test/profileWebsiteLinks_20261101 imports it.
 *
 * Every path here must stay PUBLIC while the site gate is on (web/proxy.ts,
 * "Pages the APP links to"), so an employer or an App Store reviewer never
 * lands on the key screen. The test pins that.
 */
import { websiteUrl } from '../commercial/brand.ts';

/** [path, label, one-line description]. The path is joined to websiteUrl(). */
export const WEBSITE_LINKS: readonly (readonly [string, string, string])[] = [
  ['employers', 'FOR EMPLOYERS', 'What Academy training means for a team, and how a credential is earned.'],
  ['verify', 'VERIFY A CREDENTIAL', 'Check any Academy credential by its code.'],
  ['about', 'OUR MISSION', 'Why the Academy exists and what it believes.'],
  ['credentials', 'HOW CREDENTIALS WORK', 'Certificates, programs, and what each one requires.'],
];

export function websiteLink(path: string): string {
  return `${websiteUrl()}/${path}`;
}
