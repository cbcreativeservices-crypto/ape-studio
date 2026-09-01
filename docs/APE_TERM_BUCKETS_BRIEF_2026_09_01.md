# Overnight brief — two curated daily-term buckets from the glossary

**For: Computer B (overnight run) · Commissioned by the owner 2026-09-01**

## Mission

The app is adding two new DAILY notification streams. From the app's glossary
(~26,800 terms), curate two mutually exclusive lists:

| Bucket | What it is | Target size |
|---|---|---|
| **MISUNDERSTOOD** | Terms working audio people genuinely, commonly get wrong — each entry names the actual misconception and sets it straight | **1,095** (3 years of dailies); hard floor 1,000 |
| **ODD** | Rare, odd, historical or delightful audio terms most people have never met — each entry tells the surprising bit | **1,095**; hard floor 1,000 |

These are not samples — they are **editorial selections** made after search,
analysis and consideration, with every inclusion justified by the qualifiers
below. The app plays each list in FILE ORDER, one entry per calendar day,
identically on every device — so the order you deliver is the order three
years of users will experience.

## Step 0 — the source data

You need the glossary export — ALL ~26,800 rows.

⚠ The Supabase **SQL editor's** CSV download only exports the visible results
page (the owner's first attempt returned 100 rows). Use the **Table Editor**
instead: Dashboard → Table Editor → `glossary` → the export/download control →
"Export table as CSV" — that path exports every row. (If exporting via SQL is
preferred, the query is `select id, term, definition, plain_english from
glossary order by term;` but the download must not be the results-pane page.)

**Sanity-check the file before starting**: it must have ~26,800 data rows and
the header `id,term,definition,plain_english` (extra columns from a full table
export are fine — ignore them). If it has ~100 rows, it is the truncated page
export — stop and get the full one.

Work ONLY from this export. **Every fact in every body you write must be
derivable from that row's `definition` / `plain_english` text.** You are
curating and compressing, never authoring audio facts. If you believe a
glossary definition is itself wrong, do NOT correct it silently — exclude the
term and log it in the CONCERNS list (below) for the owner.

## Output — exact contract

Two JSON files, drop-in replacements for the app's placeholders:

- `misunderstoodTerms.json` → `src/features/notifications/curated/misunderstoodTerms.json`
- `oddTerms.json` → `src/features/notifications/curated/oddTerms.json`

Each is an array of:

```json
{ "term": "<byte-identical glossary term string>", "body": "<≤160 chars>" }
```

Hard rules, validated by script before delivery:

1. `term` must **byte-match** a `term` in the export exactly (case, spacing,
   punctuation) — it is the future deep-link key. Zero mismatches.
2. `body` ≤ 160 characters, plain text, no markdown, no emoji, no line breaks.
3. No `term` appears twice in a file, and **no term appears in both files**
   (mutual exclusion — check after normalising case/plurals/hyphens, but the
   stored string stays the glossary's exact form).
4. MISUNDERSTOOD body shape: states the myth, then the truth. Preferred
   pattern: `Myth: <the misconception>. Actually: <the correction>.` —
   vary the wording so 1,095 of them don't read stamped, but the myth must be
   SPECIFIC ("more watts = twice as loud"), never generic ("often confused").
5. ODD body shape: the hook first — the surprising/delightful fact — then
   just enough definition to land it. It must be intelligible to a
   student without three more lookups.
6. The notification title is built by the app as `Often misunderstood: <term>`
   / `Odd term: <term>` — so prefer terms that read as titles: roughly
   ≤ 32 characters, no full sentences.

## Bucket 1 — MISUNDERSTOOD: qualifiers

A term qualifies only if it is BOTH common AND carries a real, specific,
widespread misconception. Harvest candidates in these families (report counts
per family):

- **Confusable pairs/families** — terms routinely swapped for a neighbour:
  phase vs polarity, dBu/dBV/dBFS/dB SPL, gain vs volume vs level, impedance
  vs resistance, latency vs jitter, condenser vs dynamic behaviours.
- **Everyday words with a technical meaning** that differs from street usage:
  bright, warm, dry, wet, hot, pad, bus, trim, presence, headroom.
- **Myth carriers** — terms around which a folk belief circulates: wattage
  and loudness, "more dB is always louder", gold connectors, burn-in,
  frequency-response flatness, cable directionality.
- **Spec-sheet traps** — numbers buyers misread: sensitivity, SNR, THD,
  dynamic range, max SPL, frequency response ranges.
- **Procedure terms commonly done wrong** — gain staging, unity gain, phantom
  power expectations, ground lift.

**Exclude** (log counts per filter):
- Rare/obscure terms — if most users won't meet it, it cannot be *commonly*
  misunderstood. (Those may belong in ODD.)
- Brand, product and model names.
- Terms whose glossary definition is too thin to ground a correction — the
  body may not invent the missing half.
- Acronym + spelled-out duplicates: pick the form people actually say.
- Anything safety-critical that cannot be stated safely in one line
  (mains/electrical practice): exclude and log, never compress.

## Bucket 2 — ODD: qualifiers

A term qualifies if a working engineer would say *"huh — neat"*. Families to
harvest (report counts):

- **Historical / vintage** — terms from tape, tube, broadcast and disc-cutting
  eras that still echo today.
- **Studio slang with real currency** — colourful working language that is in
  the glossary because people actually say it.
- **Psychoacoustic and physics oddities** — effects and phenomena with
  surprising names or surprising behaviour.
- **Onomatopoeia and descriptors** — the vocabulary of describing sound
  itself, where the word is the delight.
- **Regional / cross-trade terms** — words that differ across countries or
  crossed in from film, theatre or broadcast.

**Exclude** (log counts per filter):
- Anything common enough to be daily vocabulary (wrong bucket or no bucket).
- Anything selected for Bucket 1.
- Bare standards numbers and product/model identifiers.
- Terms whose only oddity is spelling.
- Dated slang that reads as offensive today.
- Terms whose definition cannot be made intelligible in one line — a daily
  notification that needs a lecture is a bad daily notification.

## Process — do it in passes, and show your work

1. **Load + census.** Report the export's row count and any rows with empty
   definitions (excluded up front).
2. **Harvest** candidates per family above (both buckets), generously — aim
   for 2–3× the target before cutting. Report per-family counts.
3. **Score and cut.** Rank within each bucket on (a) strength of qualifier
   fit, (b) body quality achievable from the definition text, (c) breadth —
   the final lists should span the whole field (acoustics, electronics,
   recording, live, digital…), not cluster in one corner.
4. **Dedupe + mutual exclusion** after normalisation; keep the stronger
   placement when a term qualifies for both (a misunderstood term beats an
   odd one — commonness wins).
5. **Order for variety.** File order = play order: no two adjacent entries
   from the same family, no alphabetical runs, spread the very best entries
   through the whole span rather than front-loading (a year-3 subscriber
   deserves good ones too).
6. **Validate:** byte-match every term against the export; length-check every
   body; uniqueness + exclusion checks; print all counts. Zero failures.
7. **If the glossary cannot honestly support 1,000 in a bucket** — deliver
   fewer and SAY SO with the shortfall analysis. Padding with weak entries to
   hit a number is the one unforgivable outcome; the app repeats the list
   sooner and nobody is harmed.

## Deliverables

1. The two JSON files (contract above).
2. `APE_TERM_BUCKETS_REPORT.md`: census, per-family harvest counts, per-filter
   exclusion counts, final counts, 20-entry preview of each bucket (spread,
   not the first 20), and the **CONCERNS list** — every glossary definition
   that looked wrong or too thin, with the term and one line on why.

The owner reviews the report and spot-checks the previews before the lists go
into the app (all bodies are user-facing copy and need owner ratification).
