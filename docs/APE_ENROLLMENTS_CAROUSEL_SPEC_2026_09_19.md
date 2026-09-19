# Manage My Learning › Enrollments — carousel redesign

**Owner spec, 2026-09-19, dictated after a device pass on the Pixel.**
⛔ **NOT BUILT.** Written up so it is ready to hand to Fable. See §6 for why,
and §5 for the questions that need answering before anyone starts.

---

## 1 · What is there now

`src/screens/enrollment/EnrollmentScreen.tsx`. The MY ENROLLMENT panel is a
single vertical list whose rows are **credential containers** —

- a **PROGRAM** row (purple frame, e.g. "Concert and Festival Production")
- **CERTIFICATE** rows (blue frame, e.g. "PA Loudspeaker Systems", "Audio
  Networking (Dante & AV)", "Audio Foundations", …)

— each with a `▸` disclosure that expands to reveal that credential's topics
inline, a `%` figure, and an `✕` remove control. An expanded row shows the
award state, a `LOADED / UNLOADED` chip, a blue STUDY button, a segmented
completion meter and `ADD TOPICS ›`.

Above the panel: `CONTINUE LEARNING · n%` with a STUDY shortcut. In the panel
head: `MY ENROLLMENT`, `n active · n enrolled`, `BROWSE & ADD ▾`,
`⌂ HOME SETUP ›`, and the filter chips `A–Z`, `⌂ On Home`, `Not started`.

Screenshot of the current state: `enroll_screen.png` (session scratchpad).

---

## 2 · What it becomes

**A horizontal carousel replaces the credential containers.** The rows below
the carousel become a plain topic list belonging to whatever the carousel has
centred.

### The carousel

| position | content |
|---|---|
| **Column 1 (default, always present)** | **ALL TOPICS** — the flat enrolled-topic list, which is what the area below shows today |
| **Column 2, 3, 4 …** | each credential the user has added, **in the order they added it** |

- Swipes left/right; the centred card is the selection, exactly like the
  **course cards on the main menu** (`CourseSelectionScreen`, `CARD_W` /
  `sidePad` centring, `FlatList` with snap) — reuse that mechanic rather than
  inventing a second one.
- Certificates and programs share ONE carousel, in add-order. They keep their
  colour identity (blue / purple) as the card accent.
- ⛔ **A credential appears ONLY when the user adds it.** Nothing is
  pre-populated. A new account starts with the topic column alone — which
  already holds the **two free topics** (`FREE_ENROLL_GS = [3060, 3970]`,
  `src/features/enrollment/enrollmentStore.ts`).

### What each credential card carries

1. **Title**
2. **Small thumbnail** — the same credential art used on the Certificates and
   Programs screens (`credentialArtUrl` / `CredentialThumb`)
3. **Study icon** (`assets/icons/nav/nav-study.png`, Study-tab blue `#2f9bff`)
4. **LOADED / UNLOADED** — one toggle covering **all** that credential's topics
5. **Completion meter**

### Below the carousel

Whatever the **centred** card requires:

- topic column centred → the full enrolled-topic list
- a credential centred → **that credential's requirements**

⛔ **Default COLLAPSED, always.** Today things default to expanded; the new
screen opens closed and the user opens what they want.

---

## 3 · Why this is better, in one line

The current screen makes the user scroll a tall stack of containers to compare
two credentials. The carousel puts one credential at a time under the eye with
its requirements beneath it, and makes "what am I actually working on" a swipe
instead of a hunt.

---

## 4 · Reference points in the codebase

| need | where it already exists |
|---|---|
| Centred snap carousel | `src/screens/courses/CourseSelectionScreen.tsx` (`CARD_W`, `sidePad`, `activeIdx`, `listRef`) |
| Credential art + eyebrow | `src/screens/awards/CredentialThumb.tsx` (`credentialArtUrl`, `credentialEyebrow`) |
| Accent colours | cert blue / program purple — `CERT_BLUE`, `PROGRAM_PURPLE` in `StudyAreaExplore.tsx`; `colors.blue` = `#2f9bff` |
| Study icon | `assets/icons/nav/nav-study.png` |
| Enrolled bundles (add-order source) | `EnrolledBundle` / `useBundles` in `src/features/enrollment/enrollmentStore.ts` |
| Load/unload all of a bundle | `setBundleLoad` → `setActiveMany(b.topics, loaded)` + `setBundleLoaded(b.key, loaded)` |
| Free topics | `FREE_ENROLL_GS = [3060, 3970]` |

---

## 5 · ⚠️ QUESTIONS TO ANSWER BEFORE BUILDING

None of these are guessable, and each changes the build.

1. **Does the topic column stay grouped, or go flat?** Today the topics are
   nested under their credential. If credentials move into the carousel, is
   column 1 a **flat A–Z list of every enrolled topic**, or does it still show
   the credential grouping? (I read the spec as flat — "all topics in a list".)
2. **Where does REMOVE live now?** Today each credential row has an `✕`. On a
   card, or only in the requirements list below, or a long-press?
3. **Do the filter chips (`A–Z`, `⌂ On Home`, `Not started`) stay, and do they
   apply only to the topic column** — or also filter which cards appear?
4. **Does `CONTINUE LEARNING` stay above the carousel?** It is a second STUDY
   entry point and may now be redundant with the per-card Study icon.
5. **Does `BROWSE & ADD ▾` / `⌂ HOME SETUP ›` stay in the panel head?**
6. **Ordering when a credential is removed and re-added** — does it go back to
   its old position or to the end? (End is simpler and matches "in order they
   add".)
7. **Card count ceiling** — a user with 20 certificates has a 21-card carousel.
   Is that fine, or is there a cap / an overflow affordance?
8. **What does the completion meter measure** — topics completed within that
   credential only, or including the shared core topics?

---

## 6 · ⛔ Why this was specced and not built

Standing owner rule (2026-08-07, after two violations): *a spec or a prompt is
NOT the go-ahead.* Complex or generative builds need **explicit consent in the
moment** AND a **reminder to switch to Fable first** — owner: *"any lab,
complex generative process I TRY TO ALWAYS USE FABLE."* Small edits are exempt;
a full screen redesign with a new carousel, new card art and new interaction is
not a small edit.

**So: this is the reminder.** When you want it built, say go — and say whether
to do it here or in Fable. The spec above is written to be handed straight over.
