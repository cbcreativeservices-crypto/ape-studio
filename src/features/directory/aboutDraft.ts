/**
 * A first sentence for "About my work", written FROM the member's own picks.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The profile editor opened on a blank text box and asked people to describe
 * themselves. Nine accounts had produced zero started profiles. A blank box is
 * the hardest question on the screen and it was effectively the first one.
 *
 * By the time this runs the member has already tapped areas, a role and what
 * they are open to — so we know enough to hand them a true sentence they can
 * edit or delete. Editing something is a far smaller ask than authoring
 * something, and this is never submitted silently: it is a DRAFT the member
 * sees, in an editable field, which they can clear.
 *
 * ── RULES IT MUST RESPECT ───────────────────────────────────────────────────
 *
 * It must produce text that `aboutIsSafe` accepts and the server will store:
 * at most LIMITS.about characters, no email, url, phone or @handle. It only
 * ever composes our own taxonomy labels, so it cannot introduce any of those —
 * but it is length-capped here regardless, because a 200-char server refusal
 * on a sentence the app itself wrote would be our bug, not the member's.
 *
 * Pure and dependency-free so it is testable without booting React Native.
 */
import { LIMITS } from './rules';

/** The area that means "I don't know yet" — it cannot be used in a sentence. */
const EXPLORING_AREA = 'exploring-not-sure-yet';

/**
 * Role slug → a phrase that survives "<phrase> in <area>."
 *
 * The raw labels do not: "Enthusiast or hobbyist in Hi-Fi" and "Sales or
 * product support in Live Sound" both read as though a word is missing. Any
 * slug not listed falls back to its own label, so a new role added to the
 * taxonomy degrades to something merely plain rather than something broken.
 */
const ROLE_PHRASE: Record<string, string> = {
  'learning-exploring': 'Learning and exploring',
  'working-professionally': 'Working professionally',
  'creating-performing': 'Creating and performing',
  researching: 'Researching',
  'teaching-mentoring': 'Teaching and mentoring',
  'designing-consulting': 'Designing and consulting',
  'installing-operating': 'Installing and operating systems',
  'building-manufacturing-repairing': 'Building and repairing',
  'sales-product-support': 'Working in sales and product support',
  'managing-hiring': 'Managing and hiring',
  'enthusiast-hobbyist': 'An enthusiast',
};

/** "a, b and c" — an Oxford-free list, because this is prose, not a spec. */
function list(items: string[]): string {
  const v = items.filter(Boolean);
  if (v.length === 0) return '';
  if (v.length === 1) return v[0];
  return `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
}

export type AboutDraftInput = {
  primaryArea: string | null;
  areas: string[];
  roles: string[];
  specialties: string[];
  openTo: string[];
};

/**
 * Build the draft. Returns '' when there is not enough to say something true —
 * an empty box is better than a sentence that states nothing.
 */
export function draftAbout(
  p: AboutDraftInput,
  label: (kind: 'areas' | 'roles' | 'specialties' | 'openTo', slug: string) => string,
): string {
  const area = p.primaryArea ?? p.areas[0] ?? null;
  const exploring = area === EXPLORING_AREA || (!area && p.areas.includes(EXPLORING_AREA));
  const roleSlug = p.roles[0];
  const rolePhrase = roleSlug ? (ROLE_PHRASE[roleSlug] ?? label('roles', roleSlug)) : null;

  const sentences: string[] = [];

  // 1 · who you are and where. "Still exploring" is a state, not a place, so it
  //     gets its own sentence rather than being wedged in after "in".
  if (exploring) {
    sentences.push(
      rolePhrase
        ? `${rolePhrase} across audio, and still finding my direction.`
        : 'Still exploring audio and finding my direction.',
    );
  } else if (area && rolePhrase) {
    sentences.push(`${rolePhrase} in ${label('areas', area)}.`);
  } else if (area) {
    sentences.push(`Working in ${label('areas', area)}.`);
  } else if (rolePhrase) {
    sentences.push(`${rolePhrase} in audio.`);
  }

  // 2 · what you focus on. Two is enough for an opening line; the full set is
  //     already shown as chips on the profile, so repeating all six is noise.
  const specs = p.specialties.slice(0, 2).map((s) => label('specialties', s));
  if (specs.length) sentences.push(`Focused on ${list(specs).toLowerCase()}.`);

  // 3 · what you want out of being listed — the reason anyone reads this.
  const open = p.openTo.slice(0, 3).map((s) => label('openTo', s));
  if (open.length) sentences.push(`Open to ${list(open).toLowerCase()}.`);

  const text = sentences.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  // Never hand back something the server would refuse. Drop whole sentences
  // from the end rather than truncating mid-word into an ellipsis.
  if (text.length <= LIMITS.about) return text;
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > LIMITS.about) break;
    out = next;
  }
  return out;
}
