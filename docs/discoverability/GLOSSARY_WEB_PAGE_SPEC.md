# Glossary web page specification

The 26,847-term glossary is the largest search asset the company owns, and today none of it is indexable: the app is not crawlable, and the website has no glossary pages. This document specifies how one term becomes one public page, so the website day is execution rather than design.

**This is a presentation spec. It does not rewrite Academy content.** Every field below is rendered from the approved database row exactly as stored.

## 1. Before building: two blockers that are not in this document

1. **The whole site is currently `noindex`.** `web/lib/gate.ts` has `GATE_ENABLED = true`, which applies a sitewide noindex. Until that flips at launch, nothing built here can be indexed. It is the real precondition for every web SEO task.
2. **Do not mass-publish thin pages.** A term whose row has only a one-line definition and nothing else does not deserve a public page; it will be treated as thin, near-duplicate content and can drag down the pages that are genuinely good. See §5.

## 2. Page anatomy

URL: `/glossary/{term-slug}`, slug from the shared rule in `src/navigation/linkPaths.ts` (`slugify`). The app and the website must use the identical function or their links will diverge.

| Element | Source column | Notes |
|---|---|---|
| `<title>` | `term` | `{Term} — Audio Glossary — Pro Audio Training Academy` |
| `<h1>` | `term` | Exactly one, the term itself. |
| Short answer | first sentence of `plain_english`, else `definition` | Above the fold. This is what a search snippet and an AI overview quote. |
| Full definition | `definition` | Verbatim, never summarised. |
| In plain English | `plain_english` | Its own labelled section. |
| Why it matters | `purpose_function` | |
| In practice | `practical_application` | |
| Where you meet it | `scenario_contexts` | A list. Strong, concrete, and unique per term. |
| Related terms | `related_terms` | Internal links to sibling pages. This is what makes the corpus crawlable. |
| Category | `category` | Breadcrumb tail and a link to the category hub. |
| Level | `difficulty` | A small badge. |
| Open in the app | — | Universal link `https://proaudiotrainingacademy.com/glossary/{slug}` plus store badges. |
| Common mistakes | `common_mistakes` | **Members only.** Masked server-side by entitlement; anonymous reads return null. Must never be rendered publicly. |

Breadcrumb: Home → Glossary → `{category}` → `{term}`.

## 3. Metadata for every term page

- Canonical URL, self-referencing.
- Meta description: the short answer, trimmed to about 155 characters. Never the same string on two pages.
- Open Graph and Twitter card: title, description, and a generated image carrying the term. This is what a shared link shows in Messages, WhatsApp and LinkedIn.
- JSON-LD `DefinedTerm`, with `inDefinedTermSet` pointing at the glossary, and `termCode` set to the slug.
- Safari smart app banner and the Android `alternate` link, both pointing at this same path so an installed app opens the term directly.
- No `aggregateRating`, no fabricated review markup.

## 4. Worked example — a real row

Term: **Phantom Power** (`glossary_full_v`, read 2026-09-05). Category `Microphone Powering`, difficulty `advanced`.

- **URL** `/glossary/phantom-power`
- **`<title>`** `Phantom Power — Audio Glossary — Pro Audio Training Academy`
- **`<h1>`** Phantom Power
- **Short answer**, from the stored `plain_english`: "Phantom power is DC electricity a mixer sends up the microphone cable."
- **Full definition**, stored verbatim, opens: "Phantom power is a DC supply, standardised in IEC 61938, that feeds condenser microphones and active DI boxes through the same balanced audio cable that carries their signal." It goes on to specify P48 at +48 V with a ±4 V tolerance, fed to XLR pins 2 and 3 through matched 6.8 kΩ resistors with the pin-1 shield as the return, and names the lower-voltage P24 and P12 variants.
- **Why it matters**, from `purpose_function`: one balanced cable both powers the microphone and carries its audio, so active mics need no batteries or separate supply.
- **In practice**, from `practical_application`: switch it on at the preamp before using a condenser, and confirm it is off when patching ribbon or dynamic mics.
- **Where you meet it**, from `scenario_contexts`: four stored scenarios, including powering a large-diaphragm condenser for a vocal session, running an active DI for bass, and confirming the phantom switch when troubleshooting a dead condenser on a live console.
- **Related terms**, stored: Condenser microphone · Balanced audio · XLR connector · Ribbon microphone · Plug-in power · Microphone preamplifier. Six internal links, all of which are themselves strong pages.
- **Common mistakes**: present for members, absent from the public page.

This row is a model page: a precise standards-referenced definition, a plain-English version, purpose, practice, four concrete scenarios, and six related terms. Roughly this depth is the bar for publishing.

## 5. Which terms get a page

Publish a term only when it clears all of:

- `definition` is present and longer than a single clause;
- at least two of `plain_english`, `purpose_function`, `practical_application`, `scenario_contexts` are populated;
- at least two `related_terms`, so the page is not a dead end.

Everything else stays in the app and appears on its category hub as an entry without its own URL. **Run this filter and report the counts before building**: if only part of the corpus qualifies, that is a content decision for the owner, not a reason to publish weak pages.

## 6. Hubs and crawl paths

Individual pages need routes into them:

- `/glossary` — the index, linking to category hubs, not to 26,000 items.
- `/glossary/category/{category-slug}` — every term in that category. `Microphone Powering` is one of these.
- Related-term links between pages, which do most of the crawling work.
- Sitemaps split by letter or category; a single 26,000-URL sitemap is unwieldy and exceeds the practical limit.

## 7. Rendering

Each page must serve meaningful HTML without JavaScript. At this scale, generating every page at build time is likely impractical and would make every content edit a full redeploy. Incremental static regeneration, or server rendering with a cache, is the sensible architecture; that is a website decision, recorded here because it changes the build and hosting plan. Do not force static generation of the whole corpus without measuring the build first.
