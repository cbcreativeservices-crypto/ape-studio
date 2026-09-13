# Glossary — temporary device ID + server-side metering · BUILD PLAN

Owner 2026-09-13: *"i need the database to be protected — so the definitions need
to come through a counting gateway on the server"*, resolved to a consent-gated
anonymous session asked for **when the user opens the glossary**.

**Nothing here is applied.** Backend is frozen; the owner is the only DB writer.

---

## The idea, in one line

A guest cannot be metered because they have no identity. So we give them one —
invisibly, with consent, and disposable — and then the database can do the
counting instead of the app.

## The copy (final, owner-approved 2026-09-13)

> **Opening the glossary**
>
> To access the glossary we need to give this device a temporary ID — deleted
> automatically after 7 days, along with your definition count. No name, no
> email, no password, and none of your progress is stored with it.
>
> Free use includes 14 definitions a week; Academy membership removes the limit.
>
> **[ AGREE ]   [ NOT NOW ]**

The closing line is `COPY.glossaryFreeAllowance` **verbatim** — an already-ratified
string — so the positive note creates no new commercial claim.

⚠️ **Treat the rest as ratified once approved.** It is a privacy promise, which
is a heavier commitment than marketing copy, and every clause below has to be
true in code before it ships.

---

## What is already true (verified on the live project, read-only)

| Fact | Why it matters |
|---|---|
| `pg_cron` **1.6.4** installed | The 7-day deletion is schedulable — the promise is keepable |
| `glossary_usage.user_id → auth.users` **ON DELETE CASCADE** | Deleting the anonymous user deletes the count. "along with your definition count" needs NO extra code |
| No non-internal triggers on `auth.users` | Anonymous users get no `public.users` row — and none is needed |
| `glossary_consume()` meters by `auth.uid()`, `authenticated`-only | Works for an anonymous user **unchanged**. No new metering to write |
| `get_glossary_term_count()` is anon-callable + STABLE | The curriculum term count survives the revokes untouched |
| 0 anonymous users today | Clean slate |

---

## ⚠️ THE BIGGEST CLIENT RISK — a guest would start looking like a free account

`EntitlementProvider` decides the tier from the session: **no session ⇒
`'anonymous'`**. An anonymous sign-in IS a session, so every guest would resolve
to `'free'` instead, and `isGuest` is wired to `entitlement === 'anonymous'`
across the app:

- **Settings** would show "Log out" and a DELETE ACCOUNT section for an account
  that does not exist — the exact bug QA night 2026-09-01 fixed;
- **the glossary cap** would flip from device-local to server (`capMode`), which
  is what we WANT, but it must be deliberate;
- **CredentialWall / Awards / Course selection** all branch on it.

**The fix must be explicit: keep "guest" meaning "anonymous auth user OR no
session".** Supabase marks it — `session.user.is_anonymous` — so the provider
should resolve `'anonymous'` when that flag is true, not when the session is
absent. Get this wrong and the damage is spread across five screens, none of
which are obviously about the glossary.

---

## Server work

### 1. Browse view — terms for everyone signed in, definitions for members

```sql
create or replace view public.glossary_browse_v as
select g.id, g.term, g.category, g.difficulty, g.achievement_id,
       g.formula_symbolic, g.formula_words,
       case when public.has_academy_access(auth.uid())
            then g.definition else left(g.definition, 120) end as definition,
       case when public.has_academy_access(auth.uid())
            then g.plain_english else null end as plain_english,
       case when public.has_academy_access(auth.uid())
            then g.common_mistakes else null::text[] end as common_mistakes
from public.glossary g;

grant select on public.glossary_browse_v to authenticated;   -- NOT anon
```

⚠️ `left(definition, 120)` is a deliberate teaser so the list still reads as a
list — it is also what keeps the 2-line preview from `d93efe23` meaningful. If
even that is too much, drop the column and show terms only.

### 2. The counting gateway

⚠️ **REVISED 2026-09-13 after building the client.** The first draft
returned only `definition, plain_english, common_mistakes`. That is not enough.
Today the expanded term reads six more columns out of `glossary`
(`purpose_function`, `practical_application`, `scenario_contexts`,
`related_terms`, `category`, `difficulty`), and the revokes in section 4 take
that read away **from members too**. A narrower RPC would have emptied the
detail body for everyone, silently, and the cause would have looked nothing like
the glossary.

`used` / `lim` ride along so the halfway heads-up and the lock countdown cost no
extra round trip - the client already consumes them, and tolerates their absence.

```sql
create or replace function public.get_glossary_definition(p_id uuid)
returns table (
  definition text, plain_english text, purpose_function text,
  practical_application text, scenario_contexts text[], related_terms text[],
  category text, difficulty text, common_mistakes text[],
  used int, lim int, window_start timestamptz
)
language plpgsql security definer set search_path to ''
as $FN$
declare _u record;
begin
  if public.has_academy_access(auth.uid()) then
    return query select g.definition, g.plain_english, g.purpose_function,
                        g.practical_application, g.scenario_contexts, g.related_terms,
                        g.category, g.difficulty, g.common_mistakes,
                        null::int, null::int, null::timestamptz
                 from public.glossary g where g.id = p_id;
    return;
  end if;
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;
  select * into _u from public.glossary_consume();
  if not coalesce(_u.allowed, false) then
    raise exception 'weekly_limit_reached' using errcode = 'PGRST';
  end if;
  -- common_mistakes stays member-only, exactly as glossary_full_v masks it today.
  return query select g.definition, g.plain_english, g.purpose_function,
                      g.practical_application, g.scenario_contexts, g.related_terms,
                      g.category, g.difficulty, null::text[],
                      _u.used, _u.lim, _u.window_start
               from public.glossary g where g.id = p_id;
end $FN$;

revoke execute on function public.get_glossary_definition(uuid) from public;
grant  execute on function public.get_glossary_definition(uuid) to authenticated;
```

(The `$FN$` tags are only to keep this fenced block readable - use whatever
dollar-quoting you prefer when you run it.)

⚠️ **Confirm `glossary_consume()`'s return shape first.** `_u.allowed`,
`_u.used`, `_u.lim` and `_u.window_start` are what the client's `glossaryCap.ts`
already parses, but read the function rather than trusting this.

⚠️ **The client matches the two refusals on their MESSAGE text**
(`sign_in_required`, `weekly_limit_reached`), not on the SQLSTATE - how
`errcode = 'PGRST'` reaches a PostgREST client is an implementation detail; the
message is ours. Keep those two strings exactly as written, or
`test/glossaryGatewayFault.test.ts` is lying.

### 3. The 7-day deletion — the promise

```sql
select cron.schedule(
  'purge-anon-devices', '17 3 * * *',
  $$ delete from auth.users
      where is_anonymous = true
        and created_at < now() - interval '7 days' $$
);
```

The usage rows go with it via the existing CASCADE. **Verify that** on a test row
before the copy ships — the sentence is only true if the cascade fires.

### 4. The revokes — LAST

```sql
revoke select on public.glossary        from anon, authenticated;
revoke select on public.glossary_full_v from anon, authenticated;
revoke select on public.glossary_study_v from anon;
```

⚠️ **The 2026-08-28 gotcha**: a revoke that does not name `public` is a NO-OP
when the privilege is held by PUBLIC, which anon and authenticated inherit.
Re-read `has_table_privilege` afterwards — "no errors" proves nothing.

---

## Client work - BUILT 2026-09-13

### The switch that made it shippable ahead of the server

`probeGateway()` asks once per app session whether `glossary_browse_v` exists.
Until it does, the answer is `absent`, `deviceKeyState()` returns `ready`, and
**nothing changes for anyone** - no dialog, no anonymous sign-in, the same
corpus read, the same device-local cap. The day the SQL above runs, the same
build starts asking. So the client can ship now, which is what the ordering rule
below demands.

A guest reading the view gets `42501` (it is granted to `authenticated` only).
That denial is the SIGNAL that the gateway is live, not a failure.

| Where | What was done |
|---|---|
| `features/commercial/realAccount.ts` | **NEW.** One definition of "has an account". See the blast radius below |
| `features/glossary/deviceKeyState.ts` | **NEW, pure.** `unknown / ready / mint / ask / declined` |
| `features/glossary/deviceKey.ts` | **NEW.** Consent record (AsyncStorage) + `signInAnonymously()`, with the provider-disabled failure told apart from a network one |
| `features/glossary/gatewayFault.ts` | **NEW, pure.** not-deployed / sign-in-required / limit-reached / denied / error |
| `features/glossary/glossaryGateway.ts` | **NEW.** The probe, the corpus relation, the metered RPC |
| `features/glossary/GlossaryDeviceKeyView.tsx` | **NEW.** The NOT NOW card: allow / sign in / exit |
| `screens/glossary/GlossaryScreen.tsx` | Consent dialog on open; corpus from `glossary_browse_v` when live; `toggleExpand` metered through the RPC; the client's own `glossary_consume()` charge is SKIPPED when the server meters |
| `lib/copy.ts` | The consent copy, ADDED (nothing reworded) |
| `features/curriculum/curriculumStats.ts` | **No change** - already on `get_glossary_term_count()` |

### Still outstanding on the client

- `features/glossary/GlossaryTermPopup.tsx` - single-term read still direct.
- `features/study/api.ts` - one direct `glossary` read still to move.
- `features/notifications/localSchedule.ts` - weekly-concept read needs a
  definer RPC or a service-role path.

**These three must be closed before the revokes run**, or those surfaces go
dark. They are not urgent before then; they are blocking after.

### The blast radius was wider than this plan predicted

The plan warned about `EntitlementProvider`. The real count was **twenty call
sites** that read the presence of a session as "this person has an account" -
and an anonymous session is one. Each is now on `isRealAccount()`:

`ensureSession` (a guest could never create the account they came for) *
access-code redemption (entitlement written to a uid the purge deletes) *
`fetchProfile` + `fetchMyRegistryListing` (42501 then "check your connection",
the defect fixed earlier the same day) * Dashboard's "progress isn't saved"
notice * CourseSelection's guest catalogue * Splash routing (a guest would never
see the login screen again, and Settings' "Sign in / create account" bounced
back into the app) * `accountLocalSync` (would have WIPED the guest's device
state on accepting, and again after every purge) * `AudioOutputGate` (minting
arrives as SIGNED_IN and would have silenced the app mid-lab) *
`SessionExpiryGuard` (would have bounced a guest to login when the key reached
the end we scheduled) * SingleDeviceGuard * enrollment sync * the three study
screens' resume merge * tube images * weekly-concept subscriptions.

### The teaser and the corpus

Once the browse view is live, a non-member's corpus row carries a 120-character
teaser and the full text arrives one term at a time. Eight places render
`entry.definition`. The client patches the entry object in place and bumps a
counter in `rowExtraData` rather than threading a second source through all
eight - see the comment on `defRev`. Replacing the `entries` array instead would
rebuild the 26k-term link index on every definition opened.

### NOT NOW
Declining leaves the glossary closed for this visit, with a card offering ALLOW
TEMPORARY ID, SIGN IN INSTEAD and EXIT TO MENU. **Nothing is written to
storage** - "nothing was stored" has to be true. It is not remembered across
visits.

### Renewal after the 7-day purge
Consent is remembered; the KEY is not. A device whose key was purged mints a new
one **without re-asking**: the consent was to the practice (a rolling 7-day key
with nothing else attached), and each individual key still dies on schedule.
Re-asking weekly would be friction with no matching gain in honesty. Stated here
because it is a judgment call, not a technicality - reverse it in
`deviceKeyState()`'s `'mint'` branch if you disagree.

## Order of operations — the one that bites

1. **Ship the client.** DONE 2026-09-13 - and it is INERT until step 4, so it
   could go first. That is the whole point of the probe.
2. Confirm `glossary_consume()`'s return shape.
3. **Enable anonymous sign-ins** in the Supabase dashboard (Auth → Providers).
   It is OFF by default; without it `signInAnonymously()` fails at runtime. The
   client fails OPEN on that failure (the glossary still works, unmetered), so
   the symptom is silence, not breakage - check it rather than assume it.
4. Create the view + RPC + cron. Verify privileges and the cascade. **The moment
   the view exists, every phone running the shipped build starts asking for
   consent** - so treat this step as the feature going live.
5. Close the three outstanding client reads listed above.
6. **Only then** run the revokes.

Reversed, the glossary dies in every build already on a phone — including the
ones that will never update.

## Residual hole, stated plainly

Clearing app data or reinstalling mints a new ID and a fresh 14. Every
device-scoped limit has that. The gain is real anyway: today one HTTP request
takes all 26,855 definitions; afterwards a scraper needs a sign-in per 14, against
a per-IP rate limiter that already exists.
