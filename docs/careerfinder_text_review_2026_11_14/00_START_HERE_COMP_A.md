# For Comp A: review the Career Finder text for AI slop and bad English (2026-11-14)

**From:** ccode (the Code tab), at the owner's request on 2026-11-14:
> "create a handoff for comp A to review all career finder text copy looking for any AI slop or bad/odd language/english/grammar"

**Must-do row:** D63 in docs/APE_LAUNCH_MUST_DO.md.

---

## 1. What to do

1. Open **CAREER_FINDER_TEXT_FOR_REVIEW.html** (or the .md, which has the same content). It holds every piece of text a learner can read in the Career Finder, pulled straight from the app's code. Every piece has an ID.
2. Read all of it, Parts E, A, D and T. Mark every piece that has one of the problems in section 3.
3. Write your findings to **one file**: `C:\Users\profe\Downloads\<date>_FROM_COMP_A_CAREER_FINDER_TEXT_REVIEW.md`, with an .html copy. The format is in section 5.
4. **Do not change anything.** Change no repo file, no app file and nothing on the server. Nothing in the Career Finder is on Supabase; it all ships inside the app. ccode makes the changes the owner approves, then runs the tests.

## 2. What is in the list

| Part | What | How many |
|---|---|---|
| E | How people reach the Career Finder (Home card, first-run tour stop) | 6 |
| A | Screen text, grouped by screen: start page, questions, results, family list, one family's page, How this works, results wording built from answers, "try a lab" suggestions, required-education labels | 634 |
| D | Labels on each job title's details: KIND OF ROLE, HOW PEOPLE WORK, TYPICAL PREPARATION, status, each family's path line and "where people work" line, source names | 204 |
| T | The job titles, grouped by their 42 families, with "Also called" names | 1,896 |

**How to read Part A:**
- Text in `{curly braces}` is filled in by the app (a number, a name or a list). Keep the braces in any suggestion. If the sentence around one reads wrong once it is filled in (for example "1 titles"), say so.
- Some pieces appear twice on one line. The second is usually the screen-reader version of the same button (what a blind user hears). Review both.
- Short pieces on lines next to each other may show joined into one sentence (for example "Titles cross-checked against public listings from" + a source list). Judge the joined sentence.
- A few lines exist in two or three versions: one for members, one for a learner who is not signed in, one for a guest. Lines that say "Free" are shown only to people who are not members. That is on purpose: members never see "free" or upsell wording.
- A few pieces are a little code with words inside (for example CF-A0265). Review only the words.

## 3. What to look for

**A. AI slop.** Text that sounds machine-written or like a sales page:
- Stock words: journey, unlock, elevate, empower, delve, embark, dive in, seamless, robust, leverage, navigate (meaning "deal with"), landscape, realm, tapestry, vibrant, crucial, pivotal, game-changer, cutting-edge, world of …
- Empty encouragement or a promise the app cannot keep: "find your fit", "your future starts here", "the perfect career".
- Stock patterns:
  - "Whether you're X or Y, …"
  - "It's not just X, it's Y"
  - a list of three when one would do
  - a run of dashes
  - a closing sentence that repeats the one before it
- Stacked hedges ("can often typically"), filler ("truly", "really", "simply", "actually"), and sentences that say nothing.

**B. Bad or odd English:**
- grammar
- agreement ("1 titles")
- missing or doubled words
- a wrong word
- awkward or unnatural phrasing (a candidate: "You'll answer for activities", CF-A0004)
- a sentence too long to follow on a phone

**C. Inconsistency:**
- Capitalization and Title Case vs sentence case (for one kind of item, such as buttons or headings).
- The same thing called by different names: "career family" / "family" / "direction"; "titles" / "careers" / "jobs"; "the Finder" / "the Career Finder".
- Punctuation: · separators, curly vs straight quotes, the ellipsis "…".
- Spelling: US spelling. Standard names keep their own spelling.

**D. Facts that look wrong in passing.** These are not the main job, but flag them if you see them:
- a job title that does not exist or is misnamed
- an "Also called" that is a different job
- a preparation line that understates a required degree, license or certification

## 4. House rules your suggestions must follow

- **Plain English for a beginner.** Short sentences. A technical word is explained the first time it appears.
- **Neutral about the work.** The family descriptions were written as "one neutral sentence describing the WORK, never the worth of the person doing it: no prestige, no promises". Keep that.
- **Required education is never hidden.** The owner's rule: "we must be clear when other education — degrees, certifications, etc. — is required for careers. always. every time." Never suggest removing or softening a degree, license or certification note. Making one clearer is welcome.
- **No "you'll master / build / mix".** Wording about what a learner gets says what things are and how they work (knowledge), not skills.
- **Brand names are fine**, as engineers use them.
- **No "free" or upsell wording in member text.**
- **No mention of institutional, school or academic modes** of the app.
- **Some text is the owner's own words** from the owner's brief of 2026-09-03:
  - the questions and the six answer buttons (Part A, "The questions and the answer buttons")
  - the family names
  - the activity-area names
  - the example titles
  - "Your Audio Career Results"
  - the results intro
  - the feedback question

  For these, still flag real errors, but put **OWNER TEXT** in the Severity column so the owner decides. The ratification sheet is docs/APE_CAREER_FINDER_COPY_2026_09_04.md in the repo, if you want the history.
- **Job titles come from public listings** (U.S. Bureau of Labor Statistics / O*NET, the Audio Engineering Society and others). Flag a title only when it is clearly wrong, misspelled or invented, not because you would word it differently.

## 5. How to send findings back

One file, `C:\Users\profe\Downloads\<date>_FROM_COMP_A_CAREER_FINDER_TEXT_REVIEW.md` (+ .html), with:

1. **A short summary first:** how many findings of each kind (A–D), and the 5 that matter most.
2. **Patterns:** a problem that repeats, written once with every ID it covers (for example "· and , both used as a separator in lists: CF-A…, CF-A…, CF-D…"). Don't repeat the same note on 50 rows.
3. **One table of single findings:**

| ID | Current text | Suggested text | Kind (A slop / B English / C inconsistent / D fact) | Severity (must fix / should fix / nice / OWNER TEXT) | Why (one line) |
|---|---|---|---|---|---|

4. **What you did not check**, if anything.

Rules for the table:
- Use the IDs exactly as in the list (CF-A…, CF-E…, CF-D…, AC-…).
- Quote the current text exactly.
- Give a full replacement, not "reword this".

## 6. What happens next

The owner reads your file and picks what to apply. ccode then:
- makes the changes;
- updates any test that pins the old text;
- runs the full test suite;
- commits to the one branch.

The changes reach phones with the next app update, on the owner's word.
