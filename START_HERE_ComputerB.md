# COMPUTER B — START HERE (Master Authoring Run, 2026-08-06)

You are authoring + committee-checking 3,362 net-new AP&E glossary terms.

## Do this
1. Read `APE_ComputerB_AUTHORING_HANDOFF_MASTER_2026_08_06.md` in full — §A is the committee authoring standard (non-negotiable), §D is the accuracy+efficiency protocol.
2. Work **one wave at a time**, in order (WAVE_01 → WAVE_07). Do NOT start the next wave until Booth has committee-passed, merged, and re-deduped the current one (§B wave gating).
3. Within a wave, run the **6 agents in parallel** (A1–A6). Round 1 = batches 1–6, Round 2 = batches 7–10. Each batch file = 50 terms (last batch of the run = 12).
4. Author **all 8 content fields** per term per the §A OUTPUT FORMAT. Fill-only, flag-don't-guess, ≥2 sources (≥3 for safety/SPL). Never set structural fields (Rule 4).
5. Deliver each batch as a review log (not the DB). Committee-check every batch. Flagged terms → `~/dev/ape-studio/FLAGGED_TERMS/`.
6. At wave close: reconcile IDs-in==IDs-out, merge the category ledger, validate related_terms, then hand the wave to Booth for import.

## Defaults set by Booth-side prep (reversible; structural is Booth's at import)
- Packet IDs b0001–b3362; author-then-INSERT (no stub rows); difficulty intermediate [PROPOSED]; A–Z topic homing set by Booth at merge (author a PROPOSED category that matches sibling terms where a home is known).

## Files
- `BATCH_INDEX.csv` — every batch: wave, batch, agent, round, term count, file path.
- `WAVE_01/ … WAVE_07/` — the batch CSVs (packet_id, term, source_bucket, proposed_difficulty).
- `APE_ComputerB_MASTER_WAVE_MANIFEST.csv` — the full flat manifest.

## Wave map
Wave 1–5 + start of 6 = A–Z audio dictionary. Wave 6 tail = Numbers + start of Drums. Wave 7 = rest of Drums + all Career (job roles / professional skills / game-audio). Batches are domain-coherent — stay in the batch's subject.
