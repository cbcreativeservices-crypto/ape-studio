# Topic Foundations — writer brief (final, 2026-11-03)

You are writing ONE Topic Foundations lesson for the Pro Audio Training Academy app. Follow this brief exactly. The full standard is `docs/foundations/TOPIC_FOUNDATIONS_STANDARD.md` (same folder); this brief is the part you need.

## What the lesson is
A short lesson a learner reads right before a topic's flashcards. It gives a beginner the mental picture of the WHOLE topic, so the flashcard terms have somewhere to land. The flashcards teach the details and vocabulary; you do not.

## Read the five owner-approved lessons first
`docs/foundations/approved/3060.md, 3970.md, 3350.md, 3110.md, 4740.md` (in C:\Users\profe\dev\ape-workbench). Match their level, flow, length and plain English. They are the standard.

## Step 1 — pull the data (read-only; Supabase project `yjgolswjggmlpeowvtxr`; load the tool with ToolSearch "select:mcp__3275043b-c635-435c-b585-dd4ade415046__execute_sql")
```sql
select id, global_sequence, name, field, subject, description, flashcard_welcome_title, flashcard_welcome_body
from achievements where global_sequence = <gs> and is_active;
select g.term, g.plain_english
from glossary g join glossary_topics gt on gt.glossary_id = g.id
where gt.achievement_id = '<id>' order by g.term;
```
- Read EVERY term with its plain English (page with limit/offset if needed). NEVER use `glossary_study_v` (it hides text).
- Save the topic's term names as a JSON array of strings to `<gs>.terms.json` next to your lesson file (used by the mechanical check).
- Product and company names in the glossary are intentional; do not mention them in the lesson.

## Step 2 — scope map
Sort EVERY term into 4–7 groups. Count each group (counts must add up to the total). Write: the organizing question the whole topic answers, and what a learner knows after the whole topic. Note sibling topics (listed in your task) so your lesson covers THIS topic's own ground and does not repeat a sibling's; name a sibling or prerequisite topic once, in plain words, only if this topic builds on it.

## Step 3 — chain plan
5–7 linked questions, each the obvious next question after the previous answer. Map each to a paragraph and to the group(s) it covers. Every group with about 10% or more of the terms must be in the chain, with space in rough proportion to its size.

## Step 4 — write
- **Shape:** paragraph 1 starts from what the reader already knows (an everyday scene, or for a "next step" topic a plain recap of the prerequisite) and ends on the topic's question. Paragraphs 2–6: one link of the chain each; the first sentence picks up exactly where the last paragraph ended. Last paragraph: what the flashcards cover, in plain words (no list), then "By the end, you will know…".
- **Flow:** one line of thought. No side blocks ("Here is a story", "One common mistake", "First… Second…"), no second unrelated example. Describe a thing in plain words first, then name it ("…That level is called the threshold."). Name 2–6 terms, each spelled as in this topic's list (lowercase in prose is fine) and agreeing with its plain English.
- **Level:** a curious 16-year-old who has never studied the topic. Detail, numbers, specifications and lists of variants stay in the flashcards.
- **Plain international English:** every sentence must make sense read literally by someone who learned English as a second language. No idioms, figures of speech, personification, slang, informal words, cultural references, phrasal verbs with a non-literal meaning, or vague sound adjectives (warm, bright, punchy, harsh, fat, smooth, strong) unless explained literally ("more low frequencies"). Use: imagine (not picture), set level (not line), frequency bands (not slices), equipment (not gear), parts (not bits), attempts (not tries), trigger (not set off), exit routes (not way out).
- **House rules:** no product, brand or company names; knowledge, not skills (never "you'll master / be able to / build / mix"); technique is common practice or a starting point, never the one correct setting; no citations or authorities; do not repeat the Welcome text; safety topics put the dangers and never-break rules early, inside the chain; simplify, never falsify ("often/usually" where there are exceptions); no numbers (at most one if it truly helps); US spelling; no exclamation marks.
- **Topics named after a product or about slang:** if the topic's own title names a product or system (for example "DAW: Logic", "DAW: Ableton Live", "Dante"), the lesson may use that name, and only that one. If the topic is about slang or jargon, the slang terms are the content: name them and explain each one in literal words.
- **Batch 1 lessons (2026-11-03):** no similes or comparisons ("like a growing bubble"); no regional references ("in North America") unless the topic itself is about a region; spell out every abbreviation in words (write "ground fault circuit interrupter", not the letters); do not fill the word limit — aim for 420–460 words and 7 paragraphs, like the approved five.
- **Format:** line 1 `Topic Foundations: <short topic name>`, blank line, then 6–8 plain paragraphs separated by one blank line (7 is normal). 400–480 words in the body, aiming for 420–460. Average sentence 15 words or fewer; split any sentence over 30 words unless it is a plain list. No headings, bullets, bold, links, tables or digits.

## Deliverable
Write the lesson to the path given in your task (overwrite). Edit no repo files. Report back, briefly:
1. Word count (body).
2. The group table: group → count → 3 example terms (counts add to the total).
3. The organizing question and what the learner knows at the end.
4. The chain, and which paragraph covers which group.
5. The named terms, each with a short quote of its glossary plain English showing agreement.
6. Anything you were unsure of and left out.
