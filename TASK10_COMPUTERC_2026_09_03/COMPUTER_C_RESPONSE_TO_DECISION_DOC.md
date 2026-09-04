# Computer C response to TASK10_COMPUTERC_DECISION_DOC_2026_09_03

Read in full. Every count the doc re-derived matches ours. Four corrections or additions, then
what is in this package.

## Corrections to the decision doc

1. **Decision 1 scope is 15 items, not ~10.** Three glossary ids generate 15 Part A records:
   Sample-based Track 5 (all flagged), HEAT e9c93b33 5 (3 flagged, 2 cleared), HEAT cae583a0 5
   (3 flagged, 2 cleared). The doc's "4 K2 + 1 K3 across 5 items" for HEAT misses 60370455 (013,
   K3 orphan stem "this technology") which is a cae583a0 item; HEAT is 4 K2 + 2 K3 across 6
   flagged items, plus 4 cleared items that share the entry. The four cleared items are in scope
   if the route is regenerate. Full list: `DECISION1_REGENERATE_SCOPE.json`.
2. **Two HEAT glossary entries exist** (e9c93b33 and cae583a0). That is a duplicate-headword
   finding in its own right; the handoff draft asks Computer A to check whether to merge.
3. **19aca9ec**: the doc says the correct repair is a rewrite of the scenario. It is narrower
   than that: rewording the keyed option ("Disconnect power cables from one device, then
   reconnect one at a time" -> "Disconnect power from all the devices, then reconnect them one at
   a time ...") repairs it, but that makes it a third paired-correct_answer record. An optional,
   fully specified fix is in `OPTIONAL_FIX_19aca9ec.json`; adopt or leave as advisory.
4. **Topic name**: the doc says "Grounding & Electrical"; the rows in the package carry
   `topic = "Grounding & Shielding"`. If the topic-name codify renamed it, fine; if not, the doc
   should use the stored name so the SQL package filters correctly.

Confirmed from our side: 69 of 299 Part B rewrites are pure deletions (`new_span` = ""); the
3,822 raw file count is 2,222 + 800 + 800 (pass1/pass2 copies); Part B ordering for the four
shared Safety ids is Part B first, then Part A.

## Delivered here

- `HANDOFF_A_task10_regenerate_DRAFT.md` - Decisions 1 and 3 handoff to Computer A, drafted.
  States what each corrected glossary record must and must not say, with the primary sources
  fetched today (Avid HEAT Option Guide: "HEAT provides global controls for Drive and Tone. These
  affect all audio tracks where HEAT is not bypassed"; "not applied to Instrument, Auxiliary Input,
  or Master tracks". Avid Pro Tools help and Sound On Sound on sample-based vs tick-based
  timebase). Lists the 11 item-level fixes to withdraw from the mechanical package if regeneration
  goes ahead, and the order of operations.
- `DECISION1_REGENERATE_SCOPE.json` - the 15 items with glossary id, severity and fix field; the
  3 off-domain question ids (Part B slices carry no glossary_id, so Computer A resolves by
  question id).
- `T9_GLOSSARY_RESIDUE_RETURN.json` - Decision 4 done: all 45 Task 9 residues rewritten in Task 9
  format, class HARD, matched GLOS, `base_text` = the Task 9 `new_full_field` (the occurrence guard
  is the Task 9 text, not the original row, so Task 9 must be applied first for each id). 44 are
  pure deletions of the "(glossary definition)" parenthetical. One (412f99be) exceeds the 25%
  length band because the original row contains the same sentence twice and the span removes the
  duplicate along with both citations; it carries a `length_band_exception` note and should be
  escalated if the band is binding. All 45 verified: splice invariant holds, no leak pattern
  remains, no smart quotes or dashes.
- `OPTIONAL_FIX_19aca9ec.json` - see correction 3.

## Not done, deliberately

Decision 2 (50 optionless `standard` rows). Authoring options and keys for 50 safety questions is
content creation, not audit; if that route is chosen it needs a brief and a double-pass read like
the Safety topic got, and Computer C can run that when asked. Decision 5 (SQL package) is
Computer A's / the desk's, per the doc.
