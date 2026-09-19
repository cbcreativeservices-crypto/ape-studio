# The compact header — spec of record

**Owner, 2026-09-19, on the Enrollments screen:** *"look at the header in this
screen — we need to use this smaller header in some other screens, so while
here make note of it."*

This is that note. **Nothing was changed to write it.** It records what the
header is, where it lives, and what reusing it will actually cost.

---

## 1. Which header this is

The one on **Enrollments**, which is one of the five pages inside
`src/screens/awards/AwardsScreen.tsx`. Three stacked rows:

```
 ┌─────────────────────────────────────────────────────┐
 │ [logo 34]  PRO AUDIO TRAINING ACADEMY        [HOME] │  brand row
 │ Manage My Learning                              [?] │  title row
 │ [Explore][Certificates][Programs][Registry][Enrol]  │  tab row
 └─────────────────────────────────────────────────────┘
```

### Measurements, as built

| Part | Value |
|---|---|
| Logo | `BrandLogo size={34}` |
| Wordmark | Oswald **Bold 14**, tracking 0.6; "PRO AUDIO" in `textPrimary`, "TRAINING ACADEMY" in `amber` (Oswald Medium) |
| Brand row | `gap 10`, `paddingLeft 14`, `paddingRight 6`, `paddingBottom 8` |
| HOME control | the bottom-nav `NavIcon icon="Home" lit`, `padding 4`, `marginRight 8` |
| Title | Oswald **SemiBold 20**, tracking 0.4, line-height 24, AMBER, `numberOfLines={2}` + `adjustsFontSizeToFit minimumFontScale={0.7}` |
| Title row | `gap 12`, `paddingHorizontal 14`, `paddingBottom 8` |
| Tab button | `flex: 1`, text Oswald SemiBold **12**, tracking 0.8, `numberOfLines={1}` + `adjustsFontSizeToFit minimumFontScale={0.55}` |
| Tab row | `gap 6`, `paddingHorizontal 12`, `paddingBottom 10` |
| Root | `paddingTop: insets.top + 10` |

### Behaviours that are not decoration

- **The whole title row is a Return** (`goBack()`), not just a back chevron.
- **HOME is `popTo('Main', { screen: 'Home' })`, never `navigate`.** Under
  React Navigation 7, `navigate('Main')` PUSHES a second tab shell on top of
  the current screen. `popTo` returns to the one that already exists.
- **HOME is not `goBack()` either** — it must reach Course Select regardless
  of what opened the screen.
- The active tab takes a per-page tint, not one accent: amber (Explore), blue
  (Certificates), purple (Programs), white (Pro Registry), green
  (Enrollments) — `pageTint()`.
- Shrink-to-fit on both the wordmark and the tab labels is load-bearing: five
  tabs at 12px only fit because the longest label is allowed to scale to 55%.

---

## 2. ⛔ It is NOT a component — and it is already copied three times

This is the part that matters before anyone "reuses" it.

`AppHeader` (`src/components/AppHeader.tsx`) is the app's shared header, and
it is **the big one**, not this: logo 47, wordmark 20, plus a
"PROFESSIONAL AUDIO GLOSSARY" eyebrow. Only the Dashboard uses it.

The compact header is inline JSX with local styles, and the same brand row has
been hand-copied into three screens, already drifting:

| Screen | Logo | Wordmark | Brand row |
|---|---|---|---|
| `awards/AwardsScreen` | 34 | Oswald Bold 14 / 0.6 | `gap 10, pl 14, pr 6, pb 8` |
| `curriculum/CurriculumScreen` | 34 | Oswald Bold 14 / 0.6 | `gap 10` only |
| `directory/DirectoryScreen` | 34 | Oswald Bold 14 / 0.6 | `gap 10, marginBottom 4` |

The type is identical in all three; **only the spacing has drifted**, which is
exactly the failure mode of a copied header — it looks the same until two
screens sit side by side.

AwardsScreen also uses `BrandLogo size={30}` in two of its own sub-views, so
even within one file the compact header is not one size.

---

## 3. What reuse should actually do

⛔ **Do not copy it a fourth time.** Extract it, then adopt.

Suggested shape — `src/components/CompactHeader.tsx`:

```tsx
<CompactHeader
  title="Manage My Learning"      // amber headline, 2 lines, shrink-to-fit
  onTitlePress={...}              // the Return; omit to make the title inert
  right={<HelpKey search="enroll" />}
  tabs={...}                      // optional; omit for screens with no tab strip
/>
```

Notes for whoever does it:

- The **tab row is separable**. Screens that want the smaller header may not
  want five tabs; keep it an optional slot rather than baking the five pages
  into the component.
- **HOME belongs in the component**, with the `popTo` rule inside it. It is
  the single most copyable mistake here.
- Adopt `AwardsScreen` first — it is the version the owner pointed at, and it
  is the only one with the title row and tabs, so it exercises every slot.
- Then reconcile Curriculum and Directory onto it; both are brand-row-only
  today, so adopting the component IS the fix for their spacing drift.
- `AppHeader` stays as it is. Two sizes is a deliberate hierarchy: big on
  Home/Dashboard, compact on the interior pages. Do not merge them.

---

## 4. Status

**Noted, not built.** The owner asked for a note while we were in the file;
extraction is a separate piece of work and touches four screens, so it wants
its own go-ahead.
