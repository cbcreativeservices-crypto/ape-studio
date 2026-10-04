# AP&E governance decisions — 2026-10-03

Owner rulings and standing calls made on 2026-10-03. Each one continues D44–D49
(docs/APE_GOVERNANCE_DECISIONS_2026_10_02.md). D48 ("favor consistency and learning outcomes")
remains the tie-breaker.

## D50 · Glossary charging
- Opening a term's definition costs 1 lookup. Once opened, the term is free for the rest of the session.
- Sharing is never an extra charge.
- A paying member is never capped. The server exempts members (`has_academy_access`).
- A term whose read went out and got no answer is not re-sent this session. The exception is a coded server error: that rolled back, so a re-send costs nothing.
- **Server change approved:** a re-open of the same term within 24 h is free and loads the full text. The migration is `supabase/migrations/2026100301_glossary_term_reads_24h.sql`. Comp A applies it; once it is live, ccode removes the client's no-re-send guard.

## D51 · Honesty over silence
- "If it fails the user needs to know": a failed save or read is told, never shown as success or as empty.
- OSHA >130 dBA: "honesty is preferred". Keep counting those levels, and say where the standard's table stops.
- The approved Settings wording: "Couldn't reset permission prompts — Something went wrong on this device. Try again."
- The attemptDraft crash-copy and the exposure log stay silent on a failed write. The app writes them on its own, and a popup must never appear in the middle of an exam.

## D52 · Membership check: four states, one place
- "Once it fails it should know and stop checking." There are four states: open, locked, checking, unconfirmed.
- No 🔒, guest wording ("not signed in") or upsell is ever shown to someone who may be a member.
- A failed check never unlocks members-only content.
- After the retries give up, the app says "Couldn't confirm your membership on this phone. Check your connection and reopen the app."
- The shared helpers are `useMemberGate`, `useUpsellAllowed`, `useGuestWording` and `MEMBERSHIP_NOT_CONFIRMED`, all in tier.ts / useTier.ts. No screen decides this on its own.
- Lab guest WORDING follows `useGuestWording`. Lab save-holds and session-carry stay on the strict guest rule.

## D53 · Calculator references are single and exact
- Every workspace uses one shared exact 0 dBu reference (0.7746 V = √0.6, per AES/IEC).
- Every workspace uses one shared exact 94 dB SPL anchor (20 µPa · 10^(94/20)).
- The NIOSH dose integrates 80–140 dBA (DHHS/NIOSH 98-126). Levels below 80 dBA are excluded, consistent with the OSHA thresholds applied 2026-10-02.
- Physically impossible results are refused or explained in words, never printed as numbers. Examples: a negative length, a negative voltage at the load, a gauge beyond 4/0, a reflected path shorter than the direct path.

## D54 · Left as owner calls (not changed)
- EarLab / LabCategory may open a members-only row in the sub-second window before the first membership read lands (member-favouring).
- The Dashboard study switches still open while membership is 'unconfirmed'; the study screens and the server still gate.
- An offline cold start more than about 1 h after last use goes to the login screen (auth-js behaviour; an offline-mode product decision).

## D55 · Owner rulings 2026-10-04 (morning)
- **Hearing exposure:** lab and clip playback counts toward the daily exposure while sound is actually being output (not while stopped, paused, muted or failed to load).
- **Clipping flag:** the input-clipping indication and the saved flag belong to the tool's own run. They clear when the user moves to another tool.
- **Calculator inputs:** "- 5" / "+ 5" with a space stay refused.
- **Loudness:** a negative margin reads "OVER CEILING BY …" with the positive amount.
- **Glossary cross-links (amends D50):** opening a cross-linked term from inside a definition counts as another lookup.
  - The reader is warned first and chooses Cancel (nothing charged) or Open (charged).
  - Members, members whose check has not settled, already-opened terms and built-in unmetered links are never charged.

## D56 · Owner rulings 2026-10-04 (afternoon)
- **Model:** Fable is retired. All design and lab builds run on **Opus 5.5 at HIGH effort**. The rule to wait for an explicit "go" still stands.
- **Start Here:**
  - first launch lands on the Glossary;
  - the Start Here card is on Home by default;
  - Lesson 3 is called "How High, How Loud";
  - +2 extra full glossary lookups, ONCE per account AND per device, enforced on the server. This must not become a loophole. Missing beginner terms are authored and vetted, and Comp A inserts them.
- **Guest lab credit carries ONLY on a same-session sign-in.** Signing out or closing the app first erases it. A credit leak to the next account is closed.
- **Members can notify each other:**
  - opt-in (off by default);
  - the name only, unless the member turns on "Show message text";
  - blocks and restrictions are respected;
  - nothing pops up in Low-Light;
  - unread badges.
- **Guests are reminded before they begin** that progress is not saved or credited.
- **Career Finder uses the house store** (createLocalStore).
- **Production labs:** `showWhen`, a progress signal, and the Packet screen, then an independent audio-pro and cognition review.
- **The full calculator accuracy audit is done:** 55 workspaces and 163 functions, each with a named source and two hand-computed vectors.

## D57 · Owner rulings 2026-10-04 (evening)
- **A guest is ephemeral.**
  - All guest data is deleted, Career Finder included.
  - A guest launch opens with no user work.
  - Only these survive: the glossary and calculator usage meters, the device id, and device-level intro flags.
  - An UNKNOWN session is never treated as a guest (K1).
- **Guests can open exactly two topics: Pro Audio Safety (gs3060) and DAW Fundamentals (gs3970).** Every other topic shows the paywall gate.
  - Each study stage on those two topics shows a "not saved or credited" reminder.
  - Topic quizzes need an account, because the server refuses guests. The guest is told so where the quiz opens.
- **Home-screen customisation stays sidelined until after launch** (`HOME_SETUP_HIDDEN_FOR_LAUNCH`, as ruled 2026-09-19).
- **"We are a learning app":** a field is hidden only when it is truly meaningless. If hiding it would hide a lesson or a safety habit, it is shown, optionally where that fits. Production specifics:
  - the power sign-off is shown;
  - WHAT'S LEFT lists the actual items;
  - the revision number rises on each successful export;
  - Duplicate clears accepted conditions.
- **Calculators:**
  - NO weight or rigging calculator;
  - YES to the Conductor Ampacity calculator (NEC 2023, copper building wire; cord, aluminium and metric are refused in words; it carries a licence line);
  - platform loudness targets are listed with sources and labelled "playback level, not a mastering requirement".
