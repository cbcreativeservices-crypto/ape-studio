# B17 Crowd and Complete Sports Coverage: GEOMETRY PROPOSAL — defines the COVERAGE PLANNER + DOWNMIX panel

Status: PROPOSAL. Uses frame P, the Lab 5 stereo-array tool (`full_orchestra/GEOMETRY_PROPOSAL.md` §2), the moving-source
tool (B16), the routing panel (B09), the headroom panel (B14).

## 1. Practice scene `sports.practiceCrowd`
A (0,0) action; U1 (−1,2), U2 (0,2), U3 (1,2) audience; stereo centre S (0,4), capsules 1.5 m, aimed at U2; action mic
D (2,0), 1 m, aimed at A; commentary at a separate station. Optional closer viewpoint S′ (0,3). TRIAL values; ranges
DERIVED.

## 2. Arrays (reuse Lab 5 tool; add)
XY 90° (trial), ORTF 170/110 (SOURCED), spaced omni 0.5 m (trial), M/S with a width k slider and the matrix readout
L = M + kS, R = M − kS, (L+R)/2 = M (algebra). **New presets**: "four-channel hemisphere spot" (two base + two height
capsules; geometry drawing default, no maker figure read) and "tetrahedral A-format" (four cardioid capsules on a
tetrahedron, channel labels FLU/FRD/BLD/BRU — standard naming, PRACTICE).

## 3. Coverage planner (build once, `lessons/shared/sports/coverage.ts`)
Role table (commentary / action / audience) × layout (minimal 4 inputs, extensive 14 inputs: 2 + 4 + 4 + 4), each role
with a named fallback; counts computed, never hard-coded in text. Failure drill: mute a role → which feed carries it.

## 4. Downmix panel (static numbers, all labelled examples)
Stereo → mono M = (L+R)/2 (trial); 3/2 → stereo L′ = L + 0.7071 C + 0.7071 LS (ITU example); delivery card: −23 LUFS,
±1 LU live, −1 dBTP (one delivery spec, "use your broadcaster's"). Input peaks vs program loudness kept apart.

## 5. Starting setups
ONE MIC: mono audience mic at S. TWO MICS: XY pair at S. CLOSE · LIVE: local crowd spot at S′. FARTHER BACK · STUDIO:
main ambience + spots. ANOTHER START: M/S at S with width.
