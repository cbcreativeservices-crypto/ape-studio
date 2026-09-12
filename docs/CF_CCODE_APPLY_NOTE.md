# ccode apply — Career Finder correction overrides (from Computer B audit, A-verified)

**Owner:** Computer A → ccode · **2026-09-11** · queues behind the certificate integration.
No Supabase. This is a repo/build change: update the overrides file + rebuild the two data files.

## 1 · Drop-in
Replace `scripts/career-index-overrides.json` with the provided **`career-index-overrides_MERGED.json`**
(existing overrides + A-verified corrections). It adds these keys the current build already honors
(`regulated`, `preparation`, `orientation`, `titleClass`) and four the build does **not** yet handle:
`unregulated`, `tier`, `workModel`, `removeTitles`.

## 2 · Add three hooks to `scripts/build-career-index.py`
In the overrides block (after the existing `titleClass` loop, before the `demote`/preps re-table), add:

```python
# remove a workbook licensure/caution flag for named titles (A audit)
for title in ov.get('unregulated', []):
    for c in each(title): c.pop('reg', None)
# per-title tier / work-model corrections (A audit)
for title, t in ov.get('tier', {}).items():
    for c in each(title): c['tier'] = code(TIER, t, 'tier')
for title, wm in ov.get('workModel', {}).items():
    for c in each(title): c['wm'] = code(WORK_MODEL, wm, 'work model')
```
`each()`, `code()`, `TIER`, `WORK_MODEL` already exist in the script. All override titles were verified to
exist in the workbook exactly once, so `each()` won't error.

**Also add a removal pass** — do this LAST in the overrides block, after every other loop (so the dropped
titles are still present for any earlier lookups), just before the records are serialized to `careerIndex.json`:

```python
# drop titles entirely from the Career Finder (owner content call)
_drop = set(ov.get('removeTitles', []))
records = [c for c in records if c.get('title') not in _drop]
```
Use whatever the script's in-memory record list / title field is actually called (`records`/`c['title']`
here are placeholders — match the real names). Each of the 4 titles exists exactly once, so this removes
exactly 4 rows. **A-verified against the built `careerIndex.json`:** record count 1902 → 1898, no partial/duplicate
matches, and no family is left empty (their families retain 33–74 rows each), so `careerFamilies.json` needs no
family removed.

## 3 · Rebuild + verify
`py scripts/build-career-index.py <workbook.xlsx>` → regenerates `src/data/careerIndex.json` + `careerFamilies.json`.
Confirm after build (A can double-check the diff):
- `reg` count **rises by 15** (4 clinical-voice + 2 contractors + 9 clinical subspecialties) and **falls by 2** (band directors) → net **+13** vs current 81 → **94**.
- The 4 clinical-voice titles carry `reg` **and** an upgraded `prep`; the 9 clinical subspecialties + 2 contractors carry `reg` only.
- `tier`/`wm` changed only for AC-0375, AC-0860 / AC-0725, AC-1829.
- **Total career-record count falls by exactly 4** (the `removeTitles` drop): AC-0024, AC-0132, AC-0187, AC-0235 gone; no partial matches.
- No other rows changed (diff every column, not just the touched ones).

## 4 · Pending (do NOT apply yet)
- (The 9 clinical licence-cautions were APPROVED 2026-09-11 and are already in the merged file.)
- (The 4 title-reality items were RULED 2026-09-11: **drop all 4** — now in the merged file as `removeTitles`, no longer pending.)

*— Computer A. Corrections verified against the built `careerIndex.json`; overrides keyed by exact title, one record each.*
