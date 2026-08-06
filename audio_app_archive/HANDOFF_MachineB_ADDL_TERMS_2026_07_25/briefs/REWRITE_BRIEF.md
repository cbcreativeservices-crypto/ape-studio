# AP&E Glossary — plain_english READABILITY REWRITE

These entries are LIVE and technically correct. Their `plain_english` reads too hard for the audience.

## THE TARGET
A **standard 14-year-old** must understand it. **Flesch-Kincaid grade <= 9**, Flesch Reading Ease >= 60.

## THE RULES
1. **Rewrite ONLY `plain_english`.** Nothing else. Do not touch `definition` (shown for context only).
2. **PRESERVE THE MEANING EXACTLY.** These are technically vetted. Simplify the LANGUAGE, never the facts.
   Do not add new claims, numbers, specs or standards. Do not remove a fact that is already there.
3. **The main problem is sentence length** — most are one giant run-on. Split into 2-4 short sentences.
   Aim <= 20 words per sentence. Use full stops, not semicolons or dashes.
4. Everyday words, active voice. Expand or drop unexplained jargon. Keep any accurate analogy that
   is already there.
5. Keep it roughly the same length overall (1-3 short sentences is ideal). Do not pad.
6. Do NOT use "(pending)" or any placeholder. Never leave it blank.

## OUTPUT — write exactly ONE JSON file (path in your task)
{ "batch": <n>,
  "rewrites": [ { "id": "<uuid unchanged>", "term": "<term unchanged>",
                  "plain_english": "<rewritten text>",
                  "note": "<one short line: what you changed>" } ] }
One entry per term in the packet. Validate the JSON parses before finishing.

## SELF-CHECK before you finish
For each rewrite, count: words / sentences. If any sentence is over ~20 words, split it again.
Read it aloud in your head as a 14-year-old would. If it needs a second read, simplify further.
