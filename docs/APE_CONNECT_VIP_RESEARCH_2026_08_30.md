# /connect — VIP welcome research (before design)
# Pro Audio Training Academy
# Date: 2026-08-30
# Status: research complete; routing stub live; **do not design the experience yet**

Audience: people Booth has personally handed a card at AES, academic symposia, and audio conventions. Prospective **employer and institutional buyers** of site licenses and custom program configs. Not a public marketing page.

Brand: always “Pro Audio Training Academy” / “the Academy”. Do not call this VIP in the copy.

---

## 1. What this page is for

The card is the invitation. `/connect` continues a conversation that already happened in a hallway, not a cold visit from search.

Job of the page (one job):

> Recognize that we met, show that the Academy is a serious institutional product, and make the next step for a site license / custom config effortless.

Not the job: acquire app consumers, rank in Google, or dump them into `/membership` and `/get`.

---

## 2. What others do (and what actually transfers)

### Closest analogue: invite-only event microsite

**Clinuvel (Chris Monks, 2026)** — physical codes from curated events unlock a pre-launch experience. The brief changed once they accepted every visitor was already invited: it could not behave like a marketing page chasing a cold audience. Entry doubled as sign-up (code + name + email) and then stopped asking. Past the door, the job shifted from converting to hosting.

Transfer: card recipients are already invited. Do not re-qualify them with a second password if the URL is the invite. Make entry feel like being let in, not like applying.

**Trade-show invitation landing pages** (industry pattern, e.g. “Convene” class templates) — single column, no site nav, print-matched palette, one RSVP. Scarcity is stated as courtesy (“space is limited”), not a countdown gimmick. Personalized URLs pre-fill email.

Transfer: print and URL should feel like the same object. QR + printed `proaudiotrainingacademy.com/connect` as backup (conference Wi-Fi and cameras fail).

**Dedicated landing pages vs homepage (FoundryCRO 2026 compilation of paid-traffic tests)** — dedicated pages convert on the order of **4–5×** homepages for campaign traffic (cited median 6.6% vs 2–3%). Pages with 1–2 links at **13.5%** vs 3.8% for 10+ links. One test: **removing navigation doubled** conversion (3% → 6%). Single-CTA pages cited **266%** higher than multi-CTA pages.

Those numbers are ads, not handshake traffic. Direction still holds: a conference card is a campaign. Sending them to the homepage (Get the app / Membership / Verify / Curriculum) is the expensive mistake.

### Luxury / private-client pattern

Forbes Technology Council (Kimbrell / InList, 2026): exclusivity is a **system**, not a toggle. Friction must feel intentional and explained. Scarcity without a consistent experience inside collapses. Vetting should feel human. FOMO has a shelf life — once inside, shift from aspiration to usefulness. Identity (“you are the kind of person this is for”) matters more than the lock icon.

Christoph Gey (“Golden Second”): high-end buyers treat a cold form as an interrogation. Progressive reveal, not a 12-field procurement dump on first paint.

Transfer: **do not label the page “VIP.”** Exclusivity is the missing nav, the recognition copy, and the fact that Booth handed them the URL. Fake velvet-rope UX (password theater, gold gradients, “members only”) reads as costume to deans and studio owners.

### B2B buyer reality (against consumer waitlists)

Superhuman / Clubhouse waitlists are the **wrong** model. Those sell consumer FOMO. This audience is procurement, department chairs, and facility owners. They research privately (“silent B2B buyers”).

Consistent finding across 2025–2026 B2B writing (Sexton “demo-gate tax”, Raze, Methodborne “show the damn product”):

- A form **before** they understand the product is a tax, not a qualifier.
- 75% of B2B buyers want a rep-free look first.
- Ask for contact details when they want a quote / a saved result — after they have seen something real.

Transfer: show the product (curriculum shape, credentials, licensing model) **then** one conversation CTA. Do not open with “Book a demo” and twelve fields.

### Print → phone

QR-on-card is table stakes. Dynamic QR (destination changeable after print) is useful if the page is still being designed — print `/connect` once, retarget later. Per-event `?from=` (or a short path later) attributes AES vs a campus symposium without reprinting a different URL every time.

Do **not** send the QR to LinkedIn, a Linktree, or the homepage. That wastes the handshake.

### Microsite vs path on the main domain

involve.me and similar: a **landing page** (one URL, no nav, one CTA) fits a single conversion. A separate microsite/domain is for multi-week campaigns with their own story — and it splits analytics and SEO authority.

Transfer: stay on `proaudiotrainingacademy.com/connect`. Do not invent `vip.proaudiotrainingacademy.com` or a second brand. Hide it from nav/sitemap; keep the domain.

---

## 3. Best practices (do these)

1. **Message match the card.** Headline should complete “we just met,” not “Welcome to the Academy” generic home copy.
2. **No public nav / footer.** Every extra link is an exit to a consumer funnel that is not this buyer.
3. **One primary CTA.** Continue the conversation (email or a short request). Not also Get the app, Verify, Membership.
4. **URL is the invite.** Security through unlisted URL + `noindex` + no sitemap. A second password on top of the card is usually insulting unless Booth wants a shared event code printed on the card (Clinuvel-style). Recommendation: **no extra password** for v1.
5. **Bypass the public site gate.** While `GATE_ENABLED` is on, card recipients must reach `/connect` without the preview key. Visiting `/connect` must **not** unlock the rest of the site.
6. **Show the product.** A short, honest picture of site licenses and custom configs — the thing they would pay for — not a mood film.
7. **Capture after value, and keep it short.** Name, organization, role, email, what they need (employer seats vs institutional program). Progressive, not a grant application.
8. **Mobile first.** They will open this in a noisy hall on a phone. Large type, one column, tap-sized CTA, works on bad Wi-Fi.
9. **Print backup.** Human-readable URL on the card, not QR-only.
10. **Discretion in sharing.** `noindex, nofollow`. If they paste the link in Slack, a calm Open Graph title is fine; it should not look like an ad.
11. **Attribution later.** Reserve `?from=` (e.g. `aes`, `nab`, campus slug) so Booth can print event-specific cards without new routes.
12. **Respond like a human.** The page should promise a real reply from Booth, not a ticket queue. Contact SLA on `/contact` is 3–5 days; for this audience, aim faster and say so when we design.

---

## 4. Worst practices (do not do these)

| Anti-pattern | Why it fails here |
| --- | --- |
| Send them to the homepage | Homepage serves students, verifiers, and press. They bounce. |
| Put `/connect` in the footer “for fun” | Stops being exclusive the week a student finds it. |
| Second password + site gate | Card in hand, then a key they were not told. Feels like a broken link. |
| “VIP / exclusive access” in the headline | Sounds like a nightclub. These are buyers. |
| Fake scarcity / countdown | They can smell it. Undermines a credentialing academy. |
| Demo-gate: 12 fields before any substance | Silent buyers leave. You never hear they were interested. |
| Primary CTA = Get the app | Wrong product. They buy **seats and configs**, not a personal subscription. |
| Separate splash domain | Splits measurement; looks like a campaign microsite for a product that is the Academy itself. |
| Luxury-template costume (gold foil, video ballroom, custom cursor) | Off-genre. Audio-education gravitas, not gala. |
| Endless scroll of every public page | Recreates the homepage without calling it that. |
| No way to continue the conversation | Recognition without a next step is a dead end. |
| Indexing / sitemap | Search traffic is the wrong audience and dilutes exclusivity. |
| Treating waitlist FOMO as the model | Consumer growth hack; wrong buyer psychology. |

---

## 5. Recommended architecture (when design starts)

**Stay a landing page, not a mini-site.** One route. Optional later: `/connect` with in-page sections, not `/connect/employers` and `/connect/institutions` unless the two stories truly cannot share a scroll.

**Suggested scroll (not built yet):**

1. Recognition — we met; you are in the right place.
2. What the Academy is in three sentences (credentialed professional audio education; the app is the classroom; this site is verification and institutional sales).
3. What they can buy — bulk/site licenses now; custom topics, certificates, programs, and configuration as the institutional tier (honest “available / planned” split, matching `/institutions`).
4. Proof — one concrete picture (curriculum shape, credential verify, or a short product view). No claim of WCAG AA or regulatory compliance.
5. One CTA — continue with Booth (mailto with a prepared subject, later a form).
6. Optional quiet line: if they meant to download the learner app, a small text link — not a button competing with the license CTA.

**Two audiences, one page:** employers (verify talent + train staff) and institutions (seat packs + custom programs). Same CTA; copy can name both. Split pages only if conversion data later says they conflict.

**Do not design yet.** Routing stub is live so the URL on the card is real.

---

## 6. Routing decisions (implemented 2026-08-30)

| Decision | Implementation |
| --- | --- |
| Path | `https://www.proaudiotrainingacademy.com/connect` |
| Not in Nav, Footer, sitemap | omitted on purpose |
| Robots | layout `noindex, nofollow`; `robots.ts` disallows `/connect` when the site is public |
| Preview gate | `/connect` is allowlisted in `web/proxy.ts`; does not set the gate cookie |
| Chrome | Nav and Footer hidden on this path |
| `?from=` | accepted, unused until design |
| Extra password | not in v1 |

Resume design from this doc + the canvas. Do not invent a different pipeline.

---

## Sources (consulted 2026-08-30)

- Chris Monks — Clinuvel invite-only microsite (physical event codes, “already invited”)  
  https://chrismonks.co.uk/projects/clinuvel-microsite
- Gideon Kimbrell — “Inside The Design Playbook Of Truly Exclusive Digital Platforms,” Forbes Technology Council, 2026-06-26
- Christoph Gey — “The Golden Second” (high-end form friction / progressive reveal)
- FoundryCRO — Homepage vs landing page for campaign traffic, 2026 data compilation
- roast.page — “Stop Sending Ad Clicks to Your Homepage”
- involve.me — Landing page vs microsite
- Koka Sexton — “Demo-Gate Tax”; Methodborne — “Show the damn product”; Raze — frictionless B2B capture
- Industry invitation-page patterns (single column, no nav, print match) via trade-show / RSVP template analyses
- QR-on-card / PURL practice (dynamic QR, printed URL backup)

_End of research._
