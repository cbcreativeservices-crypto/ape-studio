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
