# Audio Community Directory — implementation record

**Pro Audio Training Academy** · built 2026-08-31 · branch `audio-tools-engine`

Implements the owner's master prompt of 2026-08-31: a compact, opt-in
professional directory with public profiles and a protected contact relay,
replacing the old "What You Work In" / Pro Registry experience.

---

## 1. The spec arrived truncated — read this first

The pasted specification **ended mid-sentence at §10.2** (“Each compact result
card”). Everything from there on was missing, including the result-card layout,
the public profile page spec, the entire contact-request/reply system,
accept/decline/block/report, server-side rate limiting, the migration
specifics, the test matrix, and the documentation requirements.

The owner instructed “go ahead, takeover, and finish”, so the missing pieces
were **designed from the parts that did arrive** — §2 (which lists the required
capabilities), §6.5 (a request purpose must match an active Open To selection),
§7 (no solicitation, no sensitive attributes) and §8.3 (email never exposed,
both parties identifiable to the Academy).

**Everything inferred is listed in §5 below with the exact value used, so it can
be corrected in one place.**

---

## 2. What was built

### Database (6 migrations)

| Migration | What it adds |
|---|---|
| `directory_taxonomy` | 13 areas · 119 specialties · 120 specialty↔area mappings · 11 roles · 8 Open To. Read-only reference data. |
| `community_profiles` | The profile, its five selection tables, featured-credential pointers, selection-cap triggers, the About safety constraint, RLS. |
| `community_profile_lifecycle` | save · publish · discoverable · contact · delete · 12-month inactivity pause. |
| `community_directory_search` | `directory_search`, the public profile read, the member's own draft read, and the profile's own share token. |
| `community_contact_relay` | Requests, messages, blocks, reports, rate limits, inbox/outbox/thread reads. |
| `directory_limit_and_self_fixes` | Two trigger fixes and self-exclusion from search (found by the test harness — see §6). |
| `migrate_registry_to_community` | Carries any server-side Pro Registry row across. Found **0 rows**; see §4. |

**Nothing is reachable by a direct table read or write.** Every path is a
`SECURITY DEFINER` RPC. `authenticated` is granted nothing on the contact tables
at all, and only its own rows on the profile tables. That is what makes the
caps, the age gate, block symmetry and the rate limits real rather than advisory.

### App

- `src/features/directory/api.ts` — the entire client/server contract.
- `src/features/directory/rules.ts` — dependency-free rules (caps, About
  validation, legacy mapping, slugify, error wording). Testable without RN.
- `src/features/directory/legacyMigration.ts` — the device-side carry-over offer.
- `src/screens/directory/AudioCommunityDirectoryScreen.tsx` — the shell, with
  Explore · My Profile · Requests, plus the member sheet, contact sheet and
  report sheet.
- `ExploreView` · `MyProfileView` · `RequestsView` · `directoryBits`.
- Route `AudioCommunityDirectory`; the old `Directory` route is **kept as an
  alias** so existing links still resolve.
- Entry point added to Profile, deliberately **separate** from the credential
  listing.

### Web

- `/u/<public_token>` — the public profile, `noindex, nofollow` via its layout.
- Kept distinct from `/registry/<qr_token>`, which verifies credentials.

### Tests

```bash
npm test                      # 24 rule tests, Node's runner, zero new deps
```
Plus `docs/APE_DIRECTORY_TESTS.sql` — database assertions covering privacy,
access control, contact safety, selection limits and deletion. It ends by
raising, which prints every result **and rolls the whole run back**, so it never
leaves test data behind.

---

## 3. The one thing deliberately NOT changed

**§4.4 conflicts with a decision the owner made earlier the same day.**

§4.4 says credentials “remain permanent and independently verifiable by their
credential ID and QR/verification URL” and “do not expire when … a community
profile is unpublished or deleted”.

Earlier on 2026-08-31 the owner explicitly approved gating
`public_verify_by_token` on `users.show_in_registry`, making the credential
verification page opt-in. Under §4.4 that gate should arguably come off, so a
credential QR always resolves.

**The gate was left in place.** Removing it makes a page public that the owner
had just made private, on an inference from a truncated document — the wrong way
round for a privacy change. The community profile has its **own** token and its
own opt-in, so the two systems are already properly separate; only the question
of whether an unlisted member's *credential* page should still resolve is open.

**Owner decision needed.** It is a one-line change to
`public_verify_by_token`.

---

## 4. Migration

- **Server:** `migrate_registry_to_community()` ran and found **0 rows** — no
  account had `registry_name`, `registry_bio` or `show_in_registry` set.
- **Device:** the real legacy data is each phone's `ape:publicProfile` blob. On
  first open of My Profile the member is *offered* the carry-over; it never
  applies silently, and it never publishes.
- **The mapping is the fix, not a copy.** The old flat list mixed domains,
  activities, technologies, work environments and roles. `Education` and `Sales`
  now become **roles**, not areas — they were never work areas. Values that do
  not fit the new caps are reported to the member rather than dropped silently,
  and a bio containing contact details is not carried over.
- Anything migrated arrives **unpublished** and flagged `needs_identity_review`,
  because the set of fields that go public has changed and consent to the old
  set is not consent to the new one.

---

## 5. Inferred values (from the truncated sections)

| Rule | Value used | Where |
|---|---|---|
| Contact requests per sender | **10 per rolling 7 days** | `contact_limits()` |
| Messages per sender | **40 per rolling 24 h** | `contact_limits()` |
| Pending requests per pair | **1** | `contact_requests_one_pending` |
| First-message length | **1–500 chars**, no links or contact details | `contact_requests` |
| Thread message length | **1–2000 chars** | `contact_messages` |
| Report reasons | spam · harassment · solicitation · impersonation · other | `contact_reports` |
| Sender must be published + adult-attested | yes | `contact_request_send` |
| Blocked/closed inbox share one message | yes — revealing a block invites retaliation | `contact_request_send` |
| Search text covers | display name + specialty labels, **not** About | `directory_search` |
| Result page size | 30, hard-capped at 50 | `directory_search` |

Adjusting any of these is a single edit at the location named.

---

## 6. Bugs the harness caught

The end-to-end SQL harness earned its keep before a line of UI existed:

1. **Selection caps never fired.** The triggers were created `DEFERRABLE
   INITIALLY DEFERRED`, so they only ran at COMMIT — untestable in a
   transaction, and in production they would have surfaced as a commit-time
   error detached from the statement that caused it. Now immediate.
2. **The specialty/area rule never fired**, same cause.
3. **Explore listed the caller's own profile**, which made the result count
   wrong and offered a Contact button pointing at yourself.

A fourth was caught by review rather than test: `MemberSheet` called a state
setter during render, which would have looped on every fetch resolve.

---

## 7. Still open

| # | Item | Owner or Claude |
|---|---|---|
| 1 | **Send §10.2 onward** so the inferred contact design can be checked against the real spec | Owner |
| 2 | **§4.4 credential-gate decision** (§3 above) | Owner |
| 3 | **Email verification has no UI.** The DB gates contact on `auth.users.email_confirmed_at`, but the app never reads it and there is no resend-verification flow. A member with an unverified email will be refused with a correct but unexplained message | Claude, on go-ahead |
| 4 | **Inactivity pause is not scheduled.** `community_profile_pause_inactive()` exists and is revoked from all client roles; it needs a cron entry | Owner |
| 5 | **Privacy Policy §12 is future-tense** and now understates reality. It must state that listings are not searchable by search engines, describe the contact relay, and bump `web/content/legal/_meta.json` | Owner or counsel |
| 6 | **Device pass.** Nothing in this feature has run on a phone yet | Owner |

---

## 8. Deliberately absent

No feed, posts, comments, message walls, followers, likes, reactions, profile
photographs, view counts, popularity indicators, online status or public
activity history. No filters or fields for religion, politics, union membership,
race, ethnicity, sexuality, health, citizenship, age or exact location — and
nothing infers them.

The curriculum's existing worship-audio content is untouched; it is simply not a
directory category, and studying it says nothing about a member's beliefs.
