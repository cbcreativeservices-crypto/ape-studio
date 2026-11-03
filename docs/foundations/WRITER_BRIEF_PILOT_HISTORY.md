# Topic Foundations — writer brief, VERSION 3 (2026-11-03). This replaces BRIEF.md entirely.

## What this is
Pro Audio Training Academy app. Before a learner studies a topic's flashcards, they read one short Foundations lesson. Its only job: give a beginner the basic mental model of the topic, so the flashcard terms have somewhere to land. The flashcards teach the details and the vocabulary; this lesson does not.

## Why versions 1 and 2 were rejected (owner's words)
v1: "too advanced and confusing." v2: "it still seems to jump around and not be coherent. It requires the reader to keep switching between ideas rather than a flow of ideas built upon each other." The owner also said the earlier seven-part formula is NOT required — do better. So there is no template, no checklist of sections, no "situation / misconception / map" blocks.

## The one rule that matters: a single chain of thought, built from the ground up
- Start from something the reader already knows from everyday life, and build ONE line of reasoning upward, one step at a time.
- Every paragraph must grow out of the paragraph before it: it answers the question the previous paragraph left in the reader's mind. Its first sentence picks up exactly where the last one ended. If a paragraph could be moved or deleted without breaking the chain, it does not belong.
- Never change subject, never start a "second idea", never jump to a separate story, recap block, or list of extras. No "Here is a story", "Two more ideas", "Back to…", "One common mistake…", "First… Second…". If something cannot be reached naturally from the chain, leave it for the flashcards.
- Use ONE running example (if any) from the first paragraph to the last, and let it develop. Do not introduce a second scenario.
- A new term appears only at the moment the reader has just felt the need for it: describe the thing in plain words first, then give its name ("…that line is called the threshold"). At most 4 named terms, lowercase, one per sentence.
- The last paragraph closes the same thread: it shows, in 2–3 plain sentences, how the topic's flashcards grow out of the idea just built (you may name 2–4 broad areas in words, e.g. "the controls that shape it, the tools that guard against peaks…"). No bullet list, no term list.
- A safety topic still puts the dangers and the never-break limits early, but as part of the same chain (why this matters → what can hurt → therefore these rules).
- An advanced topic grows from the prerequisite idea as its first step (name the prerequisite topic once, in plain words), then climbs only as far as one paragraph-chain allows.

## Form
- 250–400 words. Title line `Topic Foundations: <short name>`, blank line, then plain paragraphs (4–7). No headings, bullets, bold, numbers (at most one, only if it truly helps), acronyms (spell out), or textbook tone.
- Short sentences (mostly under 18 words), everyday words, warm and calm. Second person is fine.
- Read-aloud test: it should sound like a good teacher explaining one thing to one curious 16-year-old, start to finish, without them ever asking "wait, why are we talking about this now?"

## Before writing, plan the chain
Write the chain as 5–7 linked questions (each the obvious next question after the previous answer). Put it in your report. Then write the lesson so each paragraph answers one link, in order.


## ⛔ VERSION 4 ADDITION (owner, 2026-11-03, after v3): SCOPE FIRST
Owner on v3: "much better, but I don't read the copy as really understanding the context of the terms in the topic. Specialized and Emerging Microphones talked mainly the whole way through about guitar pickups — that is not the proper intro to the topic. It is like the copy was written without the context of the title and the terms included and what they amount to and what is learned."
So, BEFORE planning the chain:
1. Read the topic TITLE and the ENTIRE live term list (every term, with plain_english), plus the Welcome text and the topic description (`select name, description, flashcard_welcome_body from achievements where global_sequence=<gs>`).
2. Group every term into the topic's real families (4–7 groups). Count the terms in each group. Write a one-sentence answer to: "What question does this whole topic answer, and what does a learner know after studying all of it?"
3. The lesson must introduce THE WHOLE TOPIC as named in its title, not one corner of it. Every group with roughly 10% or more of the terms must appear in the chain, in proportion to its size; smaller groups may be folded into the closing.
4. The chain still flows as one line of thought (all v3 rules stand), but its spine is the topic's own organizing question, and each step moves to the next family because of what the reader just learned. A running example is welcome only if it naturally spans the whole topic; otherwise use a short sequence of everyday moments linked by the organizing question. Never let one example take over the lesson.
5. The ending names, in plain words, what the learner will know once they finish the topic.
Report: the group table (group → count → 3 example terms), the organizing question, the chain, and which paragraph covers which group.

## Still mandatory
- Accuracy is non-negotiable. Simplify, never falsify; prefer "often/usually" to absolutes.
- Agree with the glossary's own plain_english for every term you name. Read BASE tables only (never glossary_study_v — it hides text): Supabase project `yjgolswjggmlpeowvtxr`, tool via ToolSearch "select:mcp__3275043b-c635-435c-b585-dd4ade415046__execute_sql":
  `select g.term, g.plain_english from glossary g join glossary_topics gt on gt.glossary_id=g.id join achievements a on a.id=gt.achievement_id where a.global_sequence=<gs> order by g.term;`
  Also read `select flashcard_welcome_body from achievements where global_sequence=<gs>` (shown just before; do not repeat it).
- No product, brand or company names (the flashcards teach those). Knowledge, not skills: never "you'll master / be able to". No citations. US spelling. No exclamation marks.

## Deliverable
Write to `...\scratchpad\foundations\<gs>.md` (overwrite). Report: word count; the chain of questions; the named terms; and, for each paragraph, its first sentence and how it continues the previous paragraph.

## ⛔ VERSION 5 ADDITION (owner, 2026-11-03): PLAIN INTERNATIONAL ENGLISH
Owner: "we need to not use terms that are confusing to not all English speakers… like 'cousin' or 'a hidden engine'… the English must not require specialized or localized understanding of non-standard descriptors/adjectives."
- Write for a reader who learned English as a second language. Every sentence must make sense read literally.
- No idioms, figures of speech, personification, slang, informal words ("gear", "bits", "tries"), cultural references, or phrasal verbs with a non-literal meaning ("set it off", "back out", "use it up").
- No vague sound adjectives (warm, bright, punchy, harsh, fat, smooth, strong) unless explained in literal terms (e.g. "more low frequencies").
- Prefer "imagine" to "picture"; "set level" to "line"; "frequency bands" to "slices".
- Final check: an independent reader as an intermediate English learner flags every phrase that needs a native speaker's knowledge.
