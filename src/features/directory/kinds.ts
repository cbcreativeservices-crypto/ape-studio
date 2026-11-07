/**
 * The Directory's chips and plates (approved mockup, screen 2). Pure, so the
 * rule for who appears under a chip is tested.
 *
 * Only `directory_graduates` filters on the server. `directory_search` has no
 * kind filter and returns no kind, so a kind chip reads members and asks
 * `directory_badges` about them. SERVER GAPS covers the proper fix; until then
 * a list that stopped early says so rather than reading as everyone.
 */
import type { VerifierKind } from '../employer/verifierKind.ts';

export type DirectoryChip = 'all' | 'graduates' | VerifierKind;

export const DIRECTORY_CHIPS: { key: DirectoryChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'graduates', label: 'Graduates' },
  { key: 'employer', label: 'Employers' },
  { key: 'company', label: 'Companies' },
  { key: 'institution', label: 'Institutions' },
  { key: 'instructor', label: 'Instructors' },
];

/** How many pages of members a kind chip reads before it says it stopped. */
export const KIND_SCAN_PAGES = 3;
export const KIND_SCAN_SIZE = 30;

export type MemberBadge = { verifiedKind: VerifierKind | null; graduate: boolean };

export function badgeLabel(b: MemberBadge | null | undefined): string | null {
  if (!b) return null;
  if (b.verifiedKind) return b.verifiedKind.toUpperCase();
  return b.graduate ? 'GRADUATE' : null;
}

/** A row of `directory_badges`. Anything unrecognised wears no plate. */
export function badgeOf(row: { verified_kind?: unknown; graduate?: unknown }): MemberBadge {
  const k = row.verified_kind;
  return {
    verifiedKind: k === 'employer' || k === 'company' || k === 'institution' || k === 'instructor' ? k : null,
    graduate: row.graduate === true,
  };
}

/** The tokens of one kind, in the order they were listed. */
export function tokensOfKind(
  tokens: string[],
  badges: ReadonlyMap<string, MemberBadge>,
  kind: VerifierKind,
): string[] {
  return tokens.filter((t) => badges.get(t)?.verifiedKind === kind);
}

/** The line a kind chip shows when it did not read everyone. */
export function scanNote(scanned: number, total: number): string | null {
  return total > scanned ? `Looked through the first ${scanned} members. Search by name to find others.` : null;
}

export function chipEmpty(chip: DirectoryChip): { title: string; line: string } {
  const label = DIRECTORY_CHIPS.find((c) => c.key === chip)?.label.toLowerCase() ?? 'members';
  return { title: `No ${label} listed yet`, line: 'The directory is new, so it is still filling up.' };
}

/** "Maya R." under a tile; a long name keeps its first word. */
export function stripName(name: string): string {
  return name.length <= 10 ? name : name.split(/\s+/)[0];
}
