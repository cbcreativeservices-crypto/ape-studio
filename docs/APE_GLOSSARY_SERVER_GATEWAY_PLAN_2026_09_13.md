# Glossary — moving the 14/week from the UI to the server

Owner 2026-09-13: *"i need the database to be protected - so the definitions need
to come through a counting gateway on the server."*

**Nothing here has been applied.** The backend is frozen and the owner is the
only DB writer. This is the plan, the SQL and the blast radius, plus the ONE
decision that has to be made before any of it is worth writing.

---

## ⚠️ THE DECISION: you cannot meter an anonymous caller

This is not a limitation of the design — it is arithmetic. Metering needs an
identity to count against. `glossary_consume()` already exists and counts by
`auth.uid()`, and it is **not** anon-executable, because an anonymous caller has
no uid. Anything `anon` can call, `anon` can call an unlimited number of times.
The only lever against an anonymous client is IP rate limiting (`check_request`
already does that), and a VPN or a switch to mobile data resets it.

So "protect the definitions" forces a choice about **guests**:

| Path | What a guest gets | Protects the data? | Cost |
|---|---|---|---|
| **A — account required for definitions** | Browse and search all 26,855 TERMS; opening a definition asks them to create a free account | **Yes.** Every definition read is tied to a uid and counted | Changes the promise. Today's copy says *"Browse our professional audio glossary immediately — no account required"*, and guest mode currently shows definitions |
| **B — guests keep unlimited definitions** | Exactly what they have now | **No.** The data stays fully readable with the shipped anon key | Zero. This is the status quo, and the 14/week stays a UI convention |
| **C — IP-metered guests** | 14/week per IP | **Weakly.** Resettable at will; also breaks shared IPs (a classroom, an office) | The worst of both: real work, real false positives, still not protection |

**Recommendation: A.** It is the only one that answers the brief. B is what you
have; C buys complexity without protection. But A trades away the
no-account-required glossary, which is the app's front door — that is a business
call, not mine.

**Everything below assumes A.**

---

## What changes on the server

### 1. A browse view WITHOUT full definitions

Anon and authenticated may read this. It carries what browsing and searching
need — and a short teaser so the list still reads as a list rather than a wall
of bare words (this is also what keeps the 2-line preview from `d93efe23`
meaningful).

```sql
create or replace view public.glossary_browse_v as
select
  g.id,
  g.term,
  g.category,
  g.difficulty,
  g.achievement_id,
  g.formula_symbolic,
  g.formula_words,
  -- MEMBERS get the real thing; everyone else gets a teaser only.
  case when public.has_academy_access(auth.uid()) then g.definition
       else left(g.definition, 120) end as definition,
  case when public.has_academy_access(auth.uid()) then g.plain_english
       else null end as plain_english,
  case when public.has_academy_access(auth.uid()) then g.common_mistakes
       else null::text[] end as common_mistakes
from public.glossary g;

grant select on public.glossary_browse_v to anon, authenticated;
```

⚠️ `left(definition, 120)` is a deliberate leak of the first ~120 characters.
That is the price of keeping a browsable list. If even the teaser is too much,
drop the column and accept a terms-only list.

### 2. The counting gateway

```sql
create or replace function public.get_glossary_definition(p_id uuid)
returns table (definition text, plain_english text, common_mistakes text[])
language plpgsql
security definer
set search_path to ''
as $$
declare _allowed boolean;
begin
  -- Members are never metered.
  if public.has_academy_access(auth.uid()) then
    return query
      select g.definition, g.plain_english, g.common_mistakes
      from public.glossary g where g.id = p_id;
    return;
  end if;

  -- Everyone else must be SIGNED IN and must have allowance left.
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;

  select allowed into _allowed from public.glossary_consume();
  if not coalesce(_allowed, false) then
    raise exception 'weekly_limit_reached' using errcode = 'PGRST';
  end if;

  return query
    select g.definition, g.plain_english, null::text[]
    from public.glossary g where g.id = p_id;
end $$;

revoke execute on function public.get_glossary_definition(uuid) from public;
grant  execute on function public.get_glossary_definition(uuid) to authenticated;
```

⚠️ Check `glossary_consume()`'s real return shape before running this — the
`select allowed into _allowed` line assumes a column named `allowed`.

### 3. The actual protection

```sql
revoke select on public.glossary          from anon, authenticated;
revoke select on public.glossary_full_v   from anon, authenticated;
revoke select on public.glossary_study_v  from anon;  -- study needs it signed-in
```

⚠️ **The 2026-08-28 gotcha applies.** A revoke that does not name `public` is a
NO-OP when EXECUTE/SELECT is held by PUBLIC, which anon and authenticated
inherit. Re-read `has_table_privilege` afterwards — "no errors" proves nothing.

---

## Blast radius in the app — 5 files, 10 call sites

| File | Today | After |
|---|---|---|
| `screens/glossary/GlossaryScreen.tsx` | Bulk-loads all 26,855 rows **with definitions**, pages of 1000, session-cached | Bulk-load `glossary_browse_v`; `toggleExpand` fetches the real text through the RPC |
| `features/glossary/GlossaryTermPopup.tsx` | Reads one row from `glossary` | Through the RPC |
| `features/study/api.ts` | `glossary_study_v` + one direct `glossary` read | Direct read must move |
| `features/notifications/localSchedule.ts` | Reads `glossary` for weekly concepts | Needs a definer RPC or a service-role path |
| `features/curriculum/curriculumStats.ts` | `count` only | **Already safe** — `get_glossary_term_count()` exists and is anon-callable |

### The consequence nobody will predict: search

The app searches **client-side over the bulk-loaded list, including definition
text**. Once non-members only hold a 120-character teaser, free users' search
silently stops matching on definition bodies — it will look like the search
broke. Either accept term-and-teaser search for free users, or add a server-side
search RPC (which then needs its own metering, or it becomes the leak).

---

## Order of work

1. Owner decides A / B / C. Nothing below matters until then.
2. Confirm `glossary_consume()`'s return shape.
3. Create the view + RPC, grant them, **verify with `has_table_privilege`**.
4. Ship the client change.
5. **Only then** run the revokes — reversed, the live app breaks for everyone.
6. Re-run the advisors and re-read privileges.

Step 5 is the one that bites: revoke before the client ships and the glossary is
dead in every installed build, including the ones already on phones.
