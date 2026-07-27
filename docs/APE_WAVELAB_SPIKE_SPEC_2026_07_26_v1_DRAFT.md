# AP&E STUDIO — WAVE PHYSICS LAB: ON-DEVICE FEASIBILITY SPIKE
## Dev-Build Specification (iOS / Metal, 2D-hybrid path)
**Date:** 2026-07-26 · **Version:** v1 · **Status:** 🟠 DRAFT / CANDIDATE — PENDING PROF. BOOTH APPROVAL
**Parent:** `APE_LEARNING_LAB_ECOSYSTEM_ARCHITECTURE_2026_07_26_v4_MASTER_DRAFT.md` §11 (green-lit 2D-hybrid) · resolves **D-LAB-5** (spike checkpoint) and informs **D-LAB-9** (device floor / RAM budget).
**Target repo:** `github.com/cbcreativeservices-crypto/ape-studio` · Expo SDK 57.0.7 / RN 0.86 / TS strict / Hermes · native `modules/ape-dsp/` (header-only C++17 core, Swift + ObjC++ facade `ApeDspCore`; Android JNI + Oboe 1.10.0).

> **This is a throwaway measurement spike, not product code.** Its only job is to answer one question with **measured numbers on the real device**, then be deleted or promoted. It is dev-only, gated behind `devMode`, and never ships. **Honest-metrics rule applies:** the HUD reports real measured FPS / GPU-ms / thermal / RAM — no synthesized values.

---

## 0. THE ONE QUESTION
> Can an **interactive 2D FDTD wavefield at 1–2 kHz**, GPU-rendered on the target iPhone, sustain a smooth frame rate and a bounded RAM/thermal envelope long enough for classroom use — while the geometric-acoustics overlay (image-source reflections) recomputes on parameter change?

If yes → Pillar C (Wave Physics) proceeds on the 2D-hybrid path as specced. If it throttles/overheats/OOMs → we record the **safe grid/band ceiling** and set the device floor (D-LAB-9). Either way the spike returns numbers, not opinions.

---

## 1. SCOPE

### In scope (build these)
1. **2D FDTD solver** (scalar leapfrog, §3) on a rectangular room grid, with absorbing boundaries + per-wall reflectance.
2. **Metal compute** implementation with ping-pong buffers + **substep batching** (§4).
3. **Slow-motion + stress modes** (§4.3) — the key finding lever.
4. **Live render** of the pressure field → colormap texture in a full-screen `MTKView`.
5. **Geometric overlay:** a small **image-source** computation (order ≤ 3) drawing reflection-path lines + arrival markers, recomputed on parameter change (§3.4).
6. **CPU reference kernel** for a small grid → numerical validation vs the GPU kernel (§5).
7. **Instrumentation HUD** (§6): FPS, GPU ms/frame, substeps/frame, phys_footprint MB, available MB, `thermalState`, battery %, elapsed.
8. **Parameter panel:** band (1 kHz / 2 kHz), room size, source position(s), damping, substeps/frame, overlay toggles.
9. **Automated sustained-run harness** that logs a CSV row/second for the pass/fail evaluation (§7, §10).

### Out of scope (explicitly deferred)
- Audio **sonification** (IR convolution of source audio) — optional stretch only (§11 note).
- **3D** FDTD; frequency-dependent/impedance boundary models beyond a scalar reflectance.
- Final UI/UX, Room Builder authoring, Android (measure iOS first; Android/Oboe device pass is a follow-up).
- Any integration with the graded system, glossary, or backend. Zero network, zero DB.

---

## 2. SUCCESS CRITERIA (pass/fail — measured on-device)

| ID | Criterion | Threshold | How measured |
|---|---|---|---|
| **P1 Interactive** | Cinematic (slow-motion) mode stays smooth at 1 kHz **and** 2 kHz grids | **≥30 fps sustained (target 60)**; param change reflected < 100 ms | CADisplayLink fps + interaction timestamp |
| **P2 RAM** | Incremental footprint with wavefield + overlays + textures | **≤ 150 MB** over app baseline (matches §11 budget) | `phys_footprint` delta |
| **P3 Thermal/throttle** | 15-min sustained run, cinematic mode | `thermalState` **≤ .serious**, fps never **< 30** | `ProcessInfo.thermalState` + fps log |
| **P4 Numerical** | GPU kernel matches CPU reference | modal freq within **±2%**; lossless-box energy drift **< 1%/1000 steps** | §5 golden test |
| **P5 Stress ceiling** | Max-substep (audio-rate) mode | Record the grid/band where it holds ≥30 fps & ≤ .serious; note where it breaks | stress sweep |
| **P6 Battery** *(informational)* | Drain over 15-min sustained run | Record **%/15 min** (no hard gate) | `UIDevice.batteryLevel` |

**Decision rule:** **GO** if P1–P4 pass at the 1 kHz grid and P1 passes at 2 kHz in cinematic mode. **GO-with-cap** if only 1 kHz passes → 1 kHz becomes the interactive default, 2 kHz is "quality/pause" mode. **REFINE** if P1/P3 fail at 1 kHz → revisit grid size, PML thickness, buffer-vs-texture, or drop to a coarser interactive band.

---

## 3. THE PHYSICS CORE

### 3.1 Model
Scalar acoustic wave equation, 2D, solved by explicit **leapfrog (2nd-order in space & time)** — the cheapest stable scheme sufficient to measure performance. (Upgrade path: pressure–velocity staggered grid with locally-reacting impedance boundaries — deferred; not needed to answer the perf question.)

Interior update (per cell, per timestep):
```
p_next[i,j] = 2·p_cur[i,j] − p_prev[i,j]
            + S² · ( p_cur[i+1,j] + p_cur[i−1,j] + p_cur[i,j+1] + p_cur[i,j−1] − 4·p_cur[i,j] )
```
where **S = c·Δt/Δx** (Courant number). 2D stability requires **S ≤ 1/√2 ≈ 0.707**; use **S = 0.6** for margin.

### 3.2 Grid parameters (c = 343 m/s, room 10 × 8 m, PPW = 8)
| Band | Δx | Grid (Nx×Ny) | Δt | Sim rate (1/Δt) | Real-time substeps/frame @60 fps |
|---|---|---|---|---|---|
| **≤1 kHz** | 42.9 mm | **233 × 187** (~43.6k cells) | 75 µs | 13.3 kHz | ~222 |
| **≤2 kHz** | 21.4 mm | **466 × 373** (~174k cells) | 37.5 µs | 26.7 kHz | ~445 |

Buffers: three `float` arrays (`p_prev`, `p_cur`, `p_next`) of Nx·Ny, rotated each step. Single precision (r32) — **do not use fp16** (leapfrog accumulates; fp16 drifts/instabilities).

### 3.3 Boundaries
- **Absorbing (open room / anechoic edges):** **Mur 1st-order ABC** on the domain edge (cheap) — or a thin **PML** (8–16 cells) if reflections leak too much. Start with Mur; measure; upgrade to PML only if needed (PML adds cells + cost — a variable to test in P5).
- **Walls (reflective):** a per-cell **reflectance mask** `r ∈ [0,1]` (1 = rigid, <1 = absorptive) applied at boundary cells. This is the hook the Absorption/Reflection modules will later drive; for the spike a single global `r` slider suffices.

### 3.4 Geometric overlay (the "hybrid" half)
On **parameter change only** (source move, room resize), compute **image sources up to order 3** for the shoebox room and draw:
- reflection-path polylines (source → wall image → listener),
- time-of-arrival markers (path length / c).

This is a handful of ms of CPU (a few dozen image sources) and validates that the hybrid split (FDTD for the field, geometric for HF/paths) composes without stalling the render loop. It is **not** on the per-frame path.

---

## 4. GPU COMPUTE DESIGN (Metal)

### 4.1 Data layout
- Three `MTLBuffer`s (`p_prev/p_cur/p_next`), `float`, length Nx·Ny, `.storageModeShared` (unified memory — read footprint cheaply). **Buffers, not textures**, for the stencil (manual indexing, predictable cache) — but also implement a **texture variant** (r32Float, free clamp addressing) and A/B them in P5; the winner informs the production engine.
- `params` constant buffer: Nx, Ny, S², source index/amplitude, reflectance, damping.

### 4.2 Kernels
1. `fdtd_interior` — one thread per interior cell, applies §3.1. Threadgroup 16×16.
2. `fdtd_boundary` — Mur ABC + reflectance on edge cells (separate small dispatch, or branch in kernel 1 guarded by bounds).
3. `inject_source` — add the source term at the source cell(s) (sine burst / impulse / continuous tone).
4. `field_to_color` — render kernel: map `p_cur` → diverging colormap (−/0/+ pressure) into the drawable texture; optional overlays composited in the fragment/render pass.

### 4.3 Substep batching + the slow-motion insight *(the crux)*
Δt is far smaller than a display frame, so each rendered frame advances **`substeps` timesteps** by encoding `substeps` compute dispatches into **one command buffer** (Metal encodes many small dispatches cheaply; ping-pong rotates between dispatches).

**Key finding to validate:** a sound wave crosses a 10 m room in ~29 ms — *too fast to see*. The lab **wants slow motion**, so the production default runs **few substeps/frame** (e.g. 4–32), i.e. **1/10–1/50 real-time**. That is **far** below the ~222–445 "real-time audio-rate" worst case, making the interactive budget easy. The spike measures both:
- **Cinematic mode** — `substeps` ∈ {4, 8, 16, 32} → the real product target (P1/P3).
- **Stress mode** — `substeps` = real-time (222 / 445) → finds the ceiling + thermal headroom (P5).

### 4.4 Timing
Wrap each frame's command buffer with GPU timestamps: `commandBuffer.gpuStartTime` / `gpuEndTime` (seconds) → **GPU ms/frame**. CPU frame time via `CACurrentMediaTime()` deltas in the `MTKViewDelegate.draw`. Report both.

---

## 5. NUMERICAL VALIDATION (golden test — ties to the 61/61 golden-vector discipline)

Two cheap, decisive checks comparing GPU vs a CPU reference kernel (same math, plain Swift/C++ loop) on a **small grid (e.g. 64×48)**:

1. **Modal frequency test.** Rigid rectangular box, impulse in a corner, record pressure at another corner, FFT → the first axial mode should sit at `f = c/(2L)` (L = room length) within **±2%**. Confirms the dispersion/scheme is correct.
2. **Energy conservation.** Lossless box (r = 1, no ABC), measure total field energy Σp² over 1000 steps → drift **< 1%** confirms stability & that GPU≈CPU.

GPU and CPU must agree cell-wise within a tight tolerance (e.g. max abs diff < 1e-4 after 500 steps) on identical inputs.

---

## 6. INSTRUMENTATION & METRICS (exact iOS APIs)
- **FPS / CPU frame ms:** `CADisplayLink` or `CACurrentMediaTime()` deltas in `draw(in:)`.
- **GPU ms/frame:** `MTLCommandBuffer.gpuEndTime − gpuStartTime`.
- **RAM footprint:** `task_info(mach_task_self_, TASK_VM_INFO, …)` → `task_vm_info_data_t.phys_footprint` (bytes). Report delta vs baseline captured before the sim starts.
- **Available memory:** `os_proc_available_memory()` (iOS 13+).
- **Thermal state:** `ProcessInfo.processInfo.thermalState` (`.nominal/.fair/.serious/.critical`) — sample every 1 s; also subscribe to `.thermalStateDidChangeNotification`.
- **Battery:** `UIDevice.current.isBatteryMonitoringEnabled = true` → `batteryLevel` (sample at start/end of the 15-min run).
- **HUD (on-screen, honest):** fps · GPU ms · substeps/frame · grid/band · phys_footprint MB · avail MB · thermalState · battery% · elapsed. All values are the measured ones above.

---

## 7. TEST MATRIX

Run each combination for a **15-minute sustained** pass (P3/P6) plus quick sweeps for the rest:

| Axis | Values |
|---|---|
| Band / grid | ≤1 kHz (233×187) · ≤2 kHz (466×373) |
| Substeps/frame | 4 · 8 · 16 · 32 (cinematic) · real-time (222/445, stress) |
| Sources | 1 · 2 |
| Overlays | off · wavefield only · +reflection paths · +SPL heatmap |
| Boundary | Mur ABC · PML(12 cells) |
| Buffer vs texture | buffer stencil · r32Float texture |
| Thermal start | cold (idle 10 min) · warm (after a prior run) |
| Device | **primary target iPhone** (r34 device `00008130-00022C183651001C`) · **+1 lower-tier iPhone if available** → device floor (D-LAB-9) |

Log a CSV row/second (schema in §10). Prioritize: 1 kHz-cinematic-15min first (the product default), then 2 kHz-cinematic, then stress ceiling.

---

## 8. APP INTEGRATION (ape-studio)

Keep it isolated and dev-only.

1. **New native module** `modules/ape-wavelab-spike/` (Expo module; do **not** touch `ape-dsp` / the audio realtime thread — the sim is GPU + render loop, separate from audio).
2. **iOS implementation:** Swift + Metal (`WaveLabSim.swift`, `WaveLabRenderer.swift`, `wavelab.metal`, `WaveLabView.swift` = `MTKView`-backed `UIView`). Bridge a native view to RN via `RCTViewManager` / Expo view, plus a small module for start/stop/params + a metrics event emitter.
3. **Metal file build wiring:** an **Expo config plugin** (`withXcodeProject`) adds `wavelab.metal` to the target's **Metal Compile Sources** build phase and sets `MTL_ENABLE_DEBUG_INFO` for dev. (Metal files aren't auto-added by autolinking — this is the one non-obvious build step.)
4. **Dev-only gating:** reachable only when `src/config/devMode.ts` dev flag is on — a hidden `WaveLabSpikeScreen` (RN) hosting the native view + JS HUD/controls + the CSV-run button. Not linked from any production nav.
5. **JS surface:** `WaveLabSpikeScreen.tsx` — native view fills the screen; overlay controls (band, substeps, sources, overlays, start-15min-run); subscribes to the metrics emitter and renders the HUD + writes the CSV to the app documents dir (share-sheet export).

---

## 9. BUILD & RUN RUNBOOK

> Designed to **avoid the two blockers you already hit**: the **EAS free-plan iOS quota** (resets Aug 1) and the **Metro LAN/firewall** issue. Both are sidestepped by a **local Release build over USB**.

1. `git switch -c wavelab-spike` off `audio-tools-engine` (HEAD `572aa6b`).
2. Add `modules/ape-wavelab-spike/` + the config plugin; `npx expo prebuild -p ios` (regenerates the iOS project with the Metal wiring).
3. Tether the target iPhone via USB. Trust the Mac.
4. **Local Release build (no Metro, no EAS):**
   `npx expo run:ios --configuration Release --device "<iPhone name>"`
   Release bundles the JS into the app → **no dev server**, so the Metro firewall issue is irrelevant and the thermal run isn't polluted by dev-mode overhead. (Use a Debug build only for iteration.)
5. On device: open the hidden dev screen → run the §7 matrix. Start with **1 kHz / cinematic / 15 min**.
6. Export the CSV via the share sheet; pull into the results template (§10).
7. If a lower-tier iPhone is available, repeat the core rows for the device floor.

*Fallback:* if local `run:ios` credentials are a hassle, an **EAS dev build** works too, but the sustained thermal run should still be a Release-config build to be representative; watch the iOS EAS quota (Aug 1 reset).

---

## 10. DELIVERABLE — RESULTS REPORT

**CSV schema (one row/second):**
`t_s, band, grid, substeps, sources, overlays, boundary, storage, fps, gpu_ms, cpu_ms, footprint_mb, avail_mb, thermal_state, battery_pct`

**Report doc `WAVELAB_SPIKE_RESULTS_<date>.md`:**
- Table of each matrix run vs P1–P6 (pass/fail + the numbers).
- The **recommended interactive default** (band + substeps policy) and the **2 kHz "quality" fallback**.
- The **device floor** (min iPhone that holds P1/P3) → feeds **D-LAB-9**.
- Buffer-vs-texture and Mur-vs-PML winners → feed the production engine design.
- **GO / GO-with-cap / REFINE** call → resolves **D-LAB-5**.

---

## 11. RISKS / GOTCHAS (spike-specific)
- **Dispatch overhead** at high substep counts — batch all substeps into one command buffer; if still bound, try 2 substeps per kernel via a wider stencil. (Cinematic mode makes this moot; matters only for stress.)
- **Precision:** r32 only; fp16 will drift/blow up. Watch for NaN propagation (add a periodic energy check in dev).
- **Boundary leakage:** Mur ABC leaks at grazing angles; if it visibly reflects, switch to PML(12) and re-measure cost.
- **RAM measured wrong:** use `phys_footprint`, **not** resident size; capture a clean baseline before allocating grids/textures.
- **Thermal sampling:** `thermalState` is coarse/lagged — pair it with the **fps decay curve** to catch throttling earlier.
- **Isolation vs realism:** measure the sim alone first, then **with the audio engine active** (production has both) — the second run is the real thermal case.
- **Simulator is useless here** — Metal GPU perf/thermal only mean anything on a **physical device**.
- **Stretch (optional, only if time):** convolve a source stem with the image-source IR to prove sonification is cheap; don't let it gate the perf finding.

---

## 12. EFFORT & SEQUENCE
Rough tiers (not calendar): (1) FDTD CPU reference + golden test → (2) Metal port + ping-pong + substep batching → (3) render + colormap → (4) HUD + CSV harness → (5) image-source overlay → (6) config-plugin/build wiring + dev screen → (7) run the matrix + write the report. Steps 1–4 are the core; 5–7 are integration + measurement.

---

## 13. WHAT THIS RESOLVES
- **D-LAB-5** — GO / GO-with-cap / REFINE on the 2D-hybrid Wave Physics engine, with numbers.
- **D-LAB-9** — the device floor + the RAM/texture budget, from the measured footprint + the lower-tier device run.
- De-risks Pillar C before any Room-Builder/module build starts (§16 of the master).

---

## APPENDIX A — CODE SKETCHES (reference, not final)

**A.1 Metal interior kernel (`wavelab.metal`)**
```metal
kernel void fdtd_interior(
    device const float* pPrev [[buffer(0)]],
    device const float* pCur  [[buffer(1)]],
    device float*       pNext [[buffer(2)]],
    constant Params&    P     [[buffer(3)]],
    uint2 gid [[thread_position_in_grid]])
{
    if (gid.x==0 || gid.y==0 || gid.x>=P.Nx-1 || gid.y>=P.Ny-1) return;
    uint idx = gid.y*P.Nx + gid.x;
    float lap = pCur[idx+1] + pCur[idx-1] + pCur[idx+P.Nx] + pCur[idx-P.Nx] - 4.0f*pCur[idx];
    pNext[idx] = (2.0f*pCur[idx] - pPrev[idx] + P.S2*lap) * P.damping;
}
```

**A.2 Swift substep loop (per frame, one command buffer)**
```swift
func draw(in view: MTKView) {
    let cb = queue.makeCommandBuffer()!
    for _ in 0..<substepsPerFrame {
        let ce = cb.makeComputeCommandEncoder()!
        ce.setComputePipelineState(interiorPSO)
        ce.setBuffers([pPrev, pCur, pNext, params], offsets: [0,0,0,0], range: 0..<4)
        ce.dispatchThreadgroups(grid, threadsPerThreadgroup: MTLSize(16,16,1))
        ce.endEncoding()
        applyBoundary(cb); injectSource(cb)
        rotate(&pPrev, &pCur, &pNext)          // ping-pong
    }
    encodeFieldToColor(cb, into: view.currentDrawable!)
    cb.present(view.currentDrawable!)
    cb.addCompletedHandler { self.gpuMs = ($0.gpuEndTime - $0.gpuStartTime)*1000 }
    cb.commit()
}
```

**A.3 Metrics (Swift)**
```swift
func footprintMB() -> Double {
    var info = task_vm_info_data_t(); var count = mach_msg_type_number_t(MemoryLayout<task_vm_info>.size)/4
    let kr = withUnsafeMutablePointer(to:&info){ $0.withMemoryRebound(to:integer_t.self,capacity:Int(count)){
        task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count) } }
    return kr == KERN_SUCCESS ? Double(info.phys_footprint)/1_048_576 : -1
}
let thermal = ProcessInfo.processInfo.thermalState   // .nominal/.fair/.serious/.critical
let availMB = Double(os_proc_available_memory())/1_048_576
```

**A.4 Expo config plugin (adds the Metal file to the target)**
```js
// plugin adds wavelab.metal to the iOS target's source build phase via withXcodeProject
const { withXcodeProject } = require('@expo/config-plugins');
module.exports = (config) => withXcodeProject(config, (c) => {
  const proj = c.modResults;
  proj.addSourceFile('wavelab.metal', null, proj.getFirstTarget().uuid); // .metal compiles into the default library
  return c;
});
```

*End of DRAFT v1 — pending Prof. Booth approval. On approval this becomes the build ticket for a Claude Code / Cursor session; its output is `WAVELAB_SPIKE_RESULTS_<date>.md` feeding D-LAB-5 / D-LAB-9.*
