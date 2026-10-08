# F07 Wildlife and Distant Sources: GEOMETRY PROPOSAL — defines the shared PARABOLIC DISH (also Lab 7 B12)

Status: PROPOSAL. Frame G, sites, wind layers, safety cards, field log: `field_ambience/GEOMETRY_PROPOSAL.md`
(reuse). Shotgun model: `foley_footsteps/SOURCES.md` §c. Path tool: `field_moving_passby/GEOMETRY_PROPOSAL.md` §2.

## 1. Scene (plan, frame G; section for the dish)
- Origin = the recordist's **permitted observation point** (feet planted, L43). Site presets: `woodland` (a single
  bird in the canopy at a bearing and range), `meadow` (a flock crossing — moves on the path tool), `distant` (a
  low-pitched distant animal, far range). Ranges drawing default (none sourced).
- Animal tokens carry a **setback ring** (25 yd ≈ 22.9 m most wildlife; 100 yd ≈ 91.4 m bears/wolves — NPS-WILD,
  US-park preset; conv.). The observation point must be outside the ring (fail state = "you are too close").
- Nests / sensitive habitat = no-go areas; trails and roads = keep-outs; the recordist never steps backward while
  aiming (copy, L38).

## 2. The parabolic dish model (NEW, pure + tested: `lessons/shared/field/dish.ts`; art `DishArt.tsx`)

| Item | Value | Class |
|---|---|---|
| Diameter D | 570 mm default; presets 585 mm and 500 mm | SOURCED (CORNELL-MIC 57 cm; SCH-DISH; INNERCORE) |
| Focal length f | 0.36·D default (205 mm); presets 210 mm (585) and 140 mm (500) | SOURCED presets; default DERIVED from SCH-DISH ratio |
| Profile | paraboloid z = r² / (4f) (focus on the axis at f from the vertex) | SOURCED form (INNERCORE "y = x²/4" in focal units) + geometry |
| Capsule | at the focus, **facing the dish** (0° toward the reflector) | SOURCED (SCH-DISH, INNERCORE) |
| Little dish help below | f_D = c / D (587 Hz for 585 mm; 602 Hz for 570 mm; 686 Hz for 500 mm) | DERIVED from CORNELL-MIC's rule + CALC-C; label "about" |
| Dish gain curve | G(f) = 20·log10(3.25·D·E/λ), D and λ in inches, E ≤ 1 | Medium (LS-DISH) — **drawn only if owner O-9 approves**, as "a simplified picture, best case" |
| Beam | drawn narrowing as frequency rises (a few frequency bands), never a number | ILLUSTRATIVE (CORNELL-MIC qualitative) |
| Aim error | the learner aims with a finger; off-target the "dish help" indicator drops (words + a bar from the illustrative beam) | ILLUSTRATIVE |
| Weight (for the handling card) | 874 g (one maker's set) | SOURCED, internal |

Section view draws the reflector, the capsule on its holder at the focus, the handle/shock mount, a fur windscreen
over the capsule area (Cornell: custom windscreens exist for dishes) and headphones.

## 3. Starting setups

| Setup | Geometry | Class | Role |
|---|---|---|---|
| Shotgun in a basket + fur on a pistol grip, aimed at the bird | at the observation point | method SOURCED (L12, CORNELL-MIC) | **ONE MIC** (worked example) |
| Dish aimed at the single bird | capsule at the focus, D 570 mm | SOURCED | ANOTHER START ("a dish for one caller"; wildlife has no close/live role — recorded in `SETUP_PICKS`) |
| Shotgun + a separate wide habitat pair (ORTF) | two channels, labelled | method SOURCED (L29) | **TWO MICS** |
| Wide omni/cardioid for a group | at the observation point | method SOURCED (L18) | **FARTHER BACK** role as a "wider view" (recorded in `SETUP_PICKS`) |
| Autonomous recorder | a fixed unit at an authorised spot, logged | method (L21) | ANOTHER START (card) |

## 4. Readouts
Bearing and range to the target; the target inside / outside the drawn beam; "little help from the dish below about
N Hz" (DERIVED from the drawn D); shotgun lobe (banded, simplified); inverse-square between two ranges (relative
only; distance never "disappears", L3).

## 5. Owner list
O-9 draw a dish gain curve (Medium source) or words only · animal art and species · US-park distances shown as
examples · role labels for wildlife setups.
