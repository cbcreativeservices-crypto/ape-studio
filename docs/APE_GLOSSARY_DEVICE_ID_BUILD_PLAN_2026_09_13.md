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

```sql
create or replace function public.get_glossary_definition(p_id uuid)
returns table (definition text, plain_english text, common_mistakes text[])
language plpgsql security definer set search_path to ''
as $$
declare _allowed boolean;
begin
  if public.has_academy_access(auth.uid()) then
    return query select g.definition, g.plain_english, g.common_mistakes
                 from public.glossary g where g.id = p_id;
    return;
  end if;
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;
  select allowed into _allowed from public.glossary_consume();
  if not coalesce(_allowed, false) then
    raise exception 'weekly_limit_reached' using errcode = 'PGRST';
  end if;
  return query select g.definition, g.plain_english, null::text[]
               from public.glossary g where g.id = p_id;
end $$;

revoke execute on function public.get_glossary_definition(uuid) from public;
grant  execute on function public.get_glossary_definition(uuid) to authenticated;
```

⚠️ **Confirm `glossary_consume()`'s return shape first** — `select allowed into`
assumes a column named `allowed`.

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

## Client work

| Where | What |
|---|---|
| `screens/glossary/GlossaryScreen.tsx` | On mount: if no session, raise the consent dialog. On AGREE → `supabase.auth.signInAnonymously()`, then load. Bulk load moves to `glossary_browse_v` |
| same, `toggleExpand` | Already calls `gateDefinitionOpen`; point it at `get_glossary_definition` and render what comes back |
| `features/commercial/EntitlementProvider.tsx` | Resolve `'anonymous'` from `session.user.is_anonymous`, **not** from the absence of a session — see the risk above |
| `features/glossary/GlossaryTermPopup.tsx` | Single-term read moves to the RPC |
| `features/study/api.ts` | One direct `glossary` read must move |
| `features/notifications/localSchedule.ts` | Weekly-concept read needs a definer RPC or service-role path |
| `features/curriculum/curriculumStats.ts` | **No change** — already on `get_glossary_term_count()` |

### NOT NOW
Declining leaves the glossary closed for this visit, with a line saying so and an
invitation to sign in. It must be re-askable — never a dead end, and never a
state the user cannot get out of without reinstalling.

---

## Order of operations — the one that bites

1. Confirm `glossary_consume()`'s return shape.
2. **Enable anonymous sign-ins** in the Supabase dashboard (Auth → Providers). It
   is OFF by default; without it `signInAnonymously()` fails at runtime.
3. Create the view + RPC + cron. Verify privileges and the cascade.
4. Ship the client (consent, anon sign-in, browse view, RPC, entitlement fix).
5. **Only then** run the revokes.

Reversed, the glossary dies in every build already on a phone — including the
ones that will never update.

## Residual hole, stated plainly

Clearing app data or reinstalling mints a new ID and a fresh 14. Every
device-scoped limit has that. The gain is real anyway: today one HTTP request
takes all 26,855 definitions; afterwards a scraper needs a sign-in per 14, against
a per-IP rate limiter that already exists.
