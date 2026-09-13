# Security & vulnerability audit — 2026-09-13 (overnight)

Read-only. **No database change was made** (frozen backend). Branch
`audio-tools-engine`, project `yjgolswjggmlpeowvtxr`.

Headline: **nothing here blocks launch.** The two things worth your attention
are a business decision, not a hole, and a schema-cleanup chore.

---

## 1. Dependencies — 9 high / 20 moderate, and NONE reach a user's phone

`npm audit` reports 29 vulnerabilities. Every HIGH is build-time tooling. I
checked rather than assumed — none of these packages is imported anywhere in
`src/` or `modules/`:

| Package | Reached via | Runs |
|---|---|---|
| `metro`, `metro-config`, `metro-transform-worker`, `image-size` | `react-native` / `expo` | bundler, build machine |
| `browserslist`, `brace-expansion`, `js-yaml` | `expo` | CLI, build machine |
| `svgo` | `react-native-svg-transformer` (**devDependency**) | SVG transform, build machine |
| `@xmldom/xmldom` | `expo-sharing → @expo/config-plugins → xcode → simple-plist → plist` | iOS project-file generation, build machine |

The xmldom one is the only chain that starts at a runtime dependency, and it
ends in the iOS project generator — it is never bundled into the app.

**Action: none before launch.** Worth a routine `npm audit fix` pass afterwards
so the list does not grow unreadable.

## 2. Secrets — clean

- `.env` is gitignored (`.gitignore:34`); only `.env.example` files are tracked.
- **No JWT-shaped string in any tracked file.** The single `eyJ…` hit is an npm
  integrity hash in `web/package-lock.json`.
- `service_role` appears only in archive prose *about* grants, never as a value.
- `src/lib/env.ts` exposes exactly `SUPABASE_URL` + the publishable anon key,
  with a comment forbidding anything else. Correct — the anon key is meant to
  ship.

## 3. Backend anon surface — tight

**Anon-executable `SECURITY DEFINER` functions: 11.** Ten are `STABLE` (cannot
write) and are the deliberate public surface — the QR credential check
(`public_verify_*`, `public_profile_by_token`), the community registry
(`community_profile_public*`), a glossary count, and the RLS predicate helpers
(`is_admin`, `has_academy_access`, …).

**Exactly one is VOLATILE: `check_request()`** — and it is the rate limiter
itself, so anon must be able to reach it. It is correctly built:

- `SET search_path TO ''` — no search-path injection;
- keyed on the caller's **own** IP/uid, so it cannot be used to rate-limit
  someone else;
- returns `void` and swallows everything except `PGRST`.

⚠️ One property worth knowing rather than fixing: it **fails open**. If
`private.rl_check` ever errors, rate limiting silently stops instead of blocking
users. That is the right availability trade-off, but it means an outage in the
limiter is invisible.

### ✅ The August item is CLOSED

`security-review-2026-08-28` flagged *"5 possibly write-capable anon-callable
definer functions — worth reading before launch"*. All five are now
`anon_exec = false`:

| Function | anon | authenticated | volatility |
|---|---|---|---|
| `award_complete` | ✗ | ✗ | stable |
| `award_required_topics` | ✗ | ✓ | **stable** — cannot write |
| `materialize_discrete_slot` | ✗ | ✗ | volatile |
| `_labs_recompute_af` | ✗ | ✗ | volatile |
| `trg_eval_credentials` | ✗ | ✗ | volatile |

## 4. Advisors — 231 → 4

| Advisory | Level | Verdict |
|---|---|---|
| `security_definer_view` (3 views) | ERROR | **Not a leak.** `glossary_full_v` and `glossary_study_v` are definer *so that* they can apply `has_academy_access(auth.uid())` centrally — verified in their definitions. `mic_catalog_public` is public by design |
| `anon_security_definer_function_executable` (11) | WARN | §3 above — reviewed, all intended |
| `authenticated_security_definer_function_executable` (58) | WARN | Signed-in surface; not reviewed line by line this pass |
| `rls_enabled_no_policy` (246) | INFO | **Safe.** RLS on + no policy = deny-all. The findings are `archive._backup_*` / `archive._az_stage_*` — schema cruft. Post-launch cleanup, not a risk |

### Sensitive tables are locked

| Table | RLS | anon SELECT | policies |
|---|---|---|---|
| `users` | on | **✗** | 4 |
| `entitlements` | on | **✗** | 1 |
| `glossary` | on | ✓ | 3 |
| `achievements` | on | ✓ | 3 |

`users` being anon-denied is the same fact that produced the `42501` in the
Profile fix — the app and the database agree.

---

## 5. ⚠️ THE ONE THING TO DECIDE: the glossary limit is a UI convention, not a boundary

`glossary` is **anon-SELECTable by design**, and `glossary_full_v` returns every
column to anon except one:

```sql
CASE WHEN has_academy_access(auth.uid()) THEN common_mistakes ELSE NULL END
```

So term, definition, plain_english, related_terms, category, difficulty,
scenario_contexts, purpose_function and practical_application are all readable by
anyone holding the anon key — which ships in every build.

**This means the 14-definitions-a-week allowance is enforced in the UI only.**
Yesterday's fix (`d93efe23`) made the app honour it, but anyone technical can
pull all 26,855 definitions straight from the REST API.

That may be exactly right: the product's own words are *"Browse our professional
audio glossary immediately — no account required"*, and the free glossary is the
draw. It is only a problem if the business is relying on that limit.

**If the limit must be real**, the shape is: revoke anon SELECT on `glossary`,
serve definitions through a metering RPC, and let `common_mistakes` stay masked
as it already is. That is a backend change and therefore yours.

`common_mistakes` — the genuinely member-only field — **is** properly protected
server-side. That part is not affected either way.
