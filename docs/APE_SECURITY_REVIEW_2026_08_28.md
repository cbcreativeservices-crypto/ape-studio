# AP&E — Backend Security Review (2026-08-28, overnight maintenance pass)

Source: Supabase advisor lint on project `yjgolswjggmlpeowvtxr`
("Audio Program Ecosystem Project"), 231 advisories. **Read-only review — NO
database change was made** (frozen-backend rule; every remediation below is for
the owner to run deliberately).

Caveat: findings are as REPORTED BY THE LINTER plus the repo's own SQL/docs. No
live exploit was attempted against production.

---

## F1 — HIGH · Notification RPCs are callable by anyone with the public anon key

`get_due_concept_subscriptions(check_time)` and `get_next_concept(p_user_id,
p_category)` are `SECURITY DEFINER` and executable by the **`anon`** role.

Why it matters: the edge function `on-weekly-concept` is correctly protected —
it demands `Authorization: Bearer <SERVICE_ROLE_KEY>`
(`docs/APE_NOTIFICATIONS_CCODE_HANDOFF_2026_08_28.md` §45). But that guard
protects only the *edge function*. The RPCs underneath it are reachable
**directly** from any client holding `EXPO_PUBLIC_SUPABASE_ANON_KEY` — which
ships inside every published app build and is therefore public by design. An
anonymous caller can:

- call `get_due_concept_subscriptions(...)` and enumerate **which users are
  subscribed, with their ids/timezones** (a subscriber list is personal data), and
- call `get_next_concept(<any user id>, <category>)` for an arbitrary user.

This is new surface from the 2026-08-27/28 weekly-notifications work, so it has
never been reviewed.

**RESOLVED 2026-08-28** — applied and verified. Final ACL on both functions is
`postgres=X | service_role=X`; `anon` and `authenticated` now return false for
`has_function_privilege(..., 'EXECUTE')`.

```sql
grant  execute on function public.get_due_concept_subscriptions(timestamptz) to service_role;
grant  execute on function public.get_next_concept(uuid, text)               to service_role;
revoke execute on function public.get_due_concept_subscriptions(timestamptz) from public, anon, authenticated;
revoke execute on function public.get_next_concept(uuid, text)               from public, anon, authenticated;
```

⚠️ **Two traps — the first draft of this recipe hit both.** It said
`revoke … from anon, authenticated`, which is a NO-OP here: the ACL was
`=X/postgres`, i.e. **PUBLIC** held EXECUTE and both roles inherited it. The
revoke must name `public`. And because `service_role` also had its access only
via PUBLIC — it does **not** bypass function privileges — revoking PUBLIC
without granting `service_role` first would have broken the `on-weekly-concept`
edge function. Grant first, then revoke.

**Lesson for the remaining items in this doc (F2, F5):** those functions are
very likely PUBLIC-granted too. Check `proacl` before writing any revoke, and
always re-read `has_function_privilege` afterwards — "the SQL ran without
errors" is not evidence that access changed.

---

## F2 — REVIEW · 14 other anon-callable SECURITY DEFINER functions

Also executable without signing in:

`_labs_recompute_af`, `award_complete`, `award_required_topics`,
`evaluate_user_credentials`, `get_glossary_term_count`, `get_scenario_items`,
`has_academy_access`, `is_admin`, `is_instructor_for_user`, `is_ta_or_admin`,
`materialize_discrete_slot`, `public_verify_by_token`,
`public_verify_credentials`, `trg_eval_credentials`.

Triage:

- **Intentional — leave alone.** `public_verify_by_token`,
  `public_verify_credentials`, `evaluate_user_credentials` back the PUBLIC QR
  credential check at `/registry/<token>` (by design, see the QR plan).
- **Probably fine.** `get_glossary_term_count`, `get_scenario_items` — content
  reads that the free/guest tiers legitimately need.
- **Worth a look.** `award_complete`, `award_required_topics`,
  `materialize_discrete_slot`, `_labs_recompute_af`, `trg_eval_credentials` —
  if any of these WRITE (grant an award, materialize a slot), an anonymous
  caller could trigger state changes. `trg_eval_credentials` looks like a
  trigger body that should not be directly callable at all.
- **Info disclosure, low.** `is_admin`, `is_instructor_for_user`,
  `is_ta_or_admin`, `has_academy_access` — probe an id, learn its role/entitlement.

No action taken. Recommend reading the bodies of the five "worth a look" ones
before launch and revoking `anon` EXECUTE wherever a signed-in caller is
actually required.

---

## F3 — LOW/INFO · RLS enabled with no policy on 168 tables

This is the **safe** state, not a hole: RLS-on + no-policy = deny-all to the
anon/authenticated roles, so these tables are reachable only through
SECURITY DEFINER RPCs — which is exactly this app's architecture.

Two notes rather than fixes:

1. **111 of the 168 are snapshot cruft** (`_backup_*`, `_bkp_*`, `_az_stage_*`,
   `glossary_backup_*`, `stage3_*`, `stage4b_*`, `*_backup_2026*`). They are
   dead weight in the schema and each one is a copy of real content. Worth a
   deliberate cleanup pass **after** launch — not overnight, and not by me.
2. **Live tables in the deny-all set** — `access_codes`,
   `access_code_redemptions`, `active_device`, `final_exam_attempts`,
   `final_exam_attempt_items`, `scenario_homework`, `study_pace_records`,
   `user_enrollment_state`, `user_topic_enrollments`, `user_bundle_enrollments`,
   `user_home_cards`, `products`, `glossary_stats`,
   `award_standing_requirements`. If any client code ever queries one of these
   **directly** (rather than via an RPC), it will silently return **zero rows**
   instead of erroring. That failure mode is invisible in testing. Worth
   confirming the new final-exam and awards features go through RPCs.

---

## F4 — ERROR (linter) · 3 SECURITY DEFINER views

`glossary_study_v`, `glossary_full_v`, `mic_catalog_public`.

These execute with the view owner's rights, bypassing the caller's RLS.
`mic_catalog_public` is public by name and intent. The two glossary views are
plausibly intentional too (the glossary has a public tier). Flagged because the
linter rates it ERROR; confirm each is meant to be reader-agnostic, then dismiss.

---

## F5 — LOW · 4 functions with mutable `search_path`

`evaluate_user_credentials`, `trg_eval_credentials`, `gen_verify_code`,
`set_verify_code`. A `SECURITY DEFINER` function without a pinned `search_path`
can, in principle, be steered to a caller-controlled schema. Standard hardening:

```sql
alter function public.<fn>(<args>) set search_path = public, pg_temp;
```

---

## Priority for the owner

1. ~~**F1** — the two notification RPCs~~ ✅ **CLOSED 2026-08-28** (applied and
   privilege-verified; see F1 above for the corrected recipe).
2. **F2** — read the five write-capable anon functions; revoke where needed.
3. **F5** — pin `search_path` (four one-line alters).
4. **F4** — confirm the three views are intentionally reader-agnostic.
5. **F3** — post-launch schema cleanup of ~111 backup tables.
