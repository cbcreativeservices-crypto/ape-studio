# The compact header — spec of record

**Owner, 2026-09-19, on the Enrollments screen:** *"look at the header in this
screen — we need to use this smaller header in some other screens, so while
here make note of it."*

**Scope, narrowed by the owner immediately after:** *"just the logo and pro
audio training academy part and home on the right."*

So the thing to reuse is the **BRAND ROW ONLY** — logo, wordmark, HOME. NOT
the amber title and NOT the five tabs. Those stay where they are; they belong
to the Awards screen's own paging, and no other screen wants them. The rest
of this note still records the full stack, because the brand row has to be
lifted out of it without disturbing the two rows below.

This note changed nothing to write it.

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

⛔ **Do not copy it a fourth time.** Extract the brand row, then adopt.

Suggested shape — `src/components/CompactBrandBar.tsx` (named for the row it
is, not for a whole header it is not):

```tsx
<CompactBrandBar />                      // logo + wordmark + HOME
<CompactBrandBar right={<Something />} /> // for a screen whose top-right is not HOME
```

That is nearly the whole component. It takes almost no props precisely
because it is the same on every screen — the moment it takes a size or a
colour it is back to drifting.

Notes for whoever does it:

- **HOME belongs inside it**, with the `popTo` rule. That is the single most
  copyable mistake in the pattern, and the only reason this is a component
  rather than a style.
- **Leave the title row and the tab row alone.** They are the Awards screen's
  own paging, they only make sense with five pages behind them, and the owner
  scoped them out. Extracting them "while we are here" would be the kind of
  widening nobody asked for.
- **Curriculum and Directory are the easy adoptions** — both are brand-row-
  only today, so swapping them onto the component IS the fix for their
  spacing drift, with nothing else to disturb.
- **AwardsScreen is the fiddly one**: its brand row sits above the title and
  tabs, and it also renders `BrandLogo size={30}` in two sub-views that are
  NOT this pattern. Do not sweep those into it.
- `AppHeader` stays as it is. Two sizes is a deliberate hierarchy: big on
  Home/Dashboard, compact on the interior pages. Do not merge them.

---

## 4. Status — ✅ EXTRACTED, partially adopted

`src/components/CompactBrandBar.tsx` exists (2026-09-19). It is
almost propless on purpose — the only slot is `right`, for the Pillar C help
key — because a component that takes a size or a colour is a component that
drifts again, which is what happened to the three hand-copies. HOME's
`popTo` rule lives inside it.

| screen | state |
|---|---|
| `tools/ToolsHubScreen` | ✅ adopted. GLOSSARY and STUDY keys removed at the owner's instruction; the back chevron went with them (HOME is where it led, and the hub is entered from the Course Select card). The hub's `HUB_MAX_CONTENT_W` cap stayed at the CALL SITE rather than becoming a prop. |
| `lab/EarLabScreen` (the Lab Menu) | ✅ adopted. It had NO brand row before — straight to a back arrow and a title. The bar was ADDED above that block, not swapped for it, and ⛔ the back chevron STAYS: unlike the hub, this screen is entered from the Audio Learning fork, so HOME would skip the page the user came from. |
| `curriculum/CurriculumScreen` | ⬜ still its own copy — brand-row-only, so adopting is the fix for its spacing drift |
| `directory/DirectoryScreen` | ⬜ still its own copy — same |
| `awards/AwardsScreen` | ⬜ still its own copy. Fiddlier: its brand row sits above the title and tab rows, which are NOT part of this pattern, and it renders `BrandLogo size={30}` in two sub-views that are also not. |

⚠️ Each remaining adoption is a visible change to a screen the owner has
signed off, so take them one at a time and show the result.
