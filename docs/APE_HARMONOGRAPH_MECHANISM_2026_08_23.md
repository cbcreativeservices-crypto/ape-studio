# The Harmonograph — Mechanism & Physics (ground truth for the lab animation)
2026-08-23 · sources: Karl Sims' build (karlsims.com/harmonograph — the owner's
reference video H4YQonwQUDs is this machine), waynesthisandthat.com/harmonographs,
plus the owner's corrections (they have built one).

## 1. The machine (Sims three-pendulum rotary)

- **Table:** 3'×3' plywood, ~37" high, splayed legs. Three 3"-diameter holes:
  the ROTARY pendulum centered in one corner (~8" from each side); the two
  LATERAL pendulums near the opposite edges (~8" from the common side, 3" from
  the other) — so the two laterals sit at right angles around the paper corner.
- **Pendulum shafts:** 4-foot ¾" dowels. **36" hangs BELOW the table** (1"
  floor clearance) and **~12" extends ABOVE it.** The shaft passes through the
  hole; nothing touches the hole.
- **Fulcrum at the table surface:** an oak fulcrum block on the shaft with
  screw tips resting in indentations of metal plates on the tabletop. The screw
  tips define ONE rocking axis for a lateral pendulum — it can swing **only in
  the vertical plane perpendicular to that axis.** Low-friction knife-edge
  rocking, gravity holds it seated. The joint never detaches.
- **Weights BELOW:** ~7½ lb on each lateral, ~5 lb on the rotary, clamped to
  the shaft at an adjustable height. **Tuning:** f ∝ 1/√L (L = fulcrum→weight);
  RAISING the weight = faster. More mass does NOT change frequency — it stores
  more energy against friction, so the drawing lasts longer. Real machines run
  ~1.6 s/cycle (≈0.6 Hz); a ½" shim changes the period only ~0.01 s — tuning
  exact ratios (3:2, 4:3) on a real machine is genuinely hard.

## 2. The lever + linkage (what the animation MUST show)

- The **arm attaches to the TOP of the pendulum shaft** (the ~12" above the
  table), by a pin joint (thin nail; rotates freely, slight vertical play).
  **NOT to the bob, NOT to the table.**
- Because the fulcrum is at the table surface, the shaft is a **lever**: when
  the weight swings one way below the table, the shaft top moves the
  **OPPOSITE way** above it, tracing a shallow arc about the fulcrum.
- Each lateral pendulum's rocking axis is set so its swing plane **aims along
  its own arm toward the pen** — it pushes/pulls the pen radially (in toward
  the paper and back out). The two laterals do this at right angles.
- The two **30" balsa arms** run from the two shaft tops toward the paper and
  their far ends are **joined together (doubled rubber band) — that junction IS
  the pen**, riding on the paper. So: one pendulum drives the pen side-to-side,
  the other front-to-back, through rigid links.
- **RIGID-BODY INVARIANTS (owner's hard rule):** the pendulum length never
  changes; the arm length never changes; the arm ends never lose their
  connections (pin at shaft top, junction at pen). The pen's position at every
  instant is the **circle–circle intersection** of the two fixed arm radii
  about the two moving shaft-top positions. Nothing may stretch, shear, or
  teleport. The bob rides an arc (rises slightly at extremes); the shaft top
  rides the opposite arc.

## 3. The rotary pendulum (ROTARY mode)

- Gimbal fulcrum: a large washer with indentation pairs on perpendicular sides
  → the shaft can rock on ANY axis, i.e. swing in circles/ellipses.
- The **paper platform (11"×11") mounts on TOP of the rotary shaft** and the
  pen draws on it while it moves.
- **The platform TRANSLATES in a circular/elliptical orbit. It does NOT spin
  about its own center** (no torsion axis exists in the gimbal). Every point of
  the platform moves in the same little orbit.
- **The drawing is the RELATIVE motion:** ink = pen position MINUS platform
  position, accumulated in the platform's (translating, non-rotating) frame.
  This relative-motion subtraction is what makes rotary figures so rich —
  same/opposite orbit directions give completely different families.

## 4. The physics (small-angle model the lab already uses — now justified)

- Amplitudes are small vs. lengths (inches vs. feet) → each pendulum is damped
  SHM. Pen axes: x(t) = A·sin(2πf₁t+φ₁)·e^(−d₁t), y(t) = B·sin(2πf₂t+φ₂)·e^(−d₂t);
  ROTARY adds the platform orbit x_p = R·sin(2πf₃t+φ₃)·e^(−d₃t),
  y_p = R·cos(2πf₃t+φ₃)·e^(−d₃t); figure = (x−x_p, y−y_p).
- **Damping** (pen friction on paper is the dominant drag, plus pivots/air)
  decays the amplitudes → the figure **spirals inward**, lines lying beside
  each other instead of retracing — the decay is where the beauty comes from.
- **Ratios:** integer f₁:f₂ → the phase relationship repeats → closed Lissajous
  figure. **Detune slightly** → the fast pendulum pulls ahead and laps the slow
  one → the figure precesses ("eye" forms); tiny detunings make dramatic
  changes. **Phase** is set by how you launch the pendulums (push directions/
  timing; same vs. opposite circles for the rotary).

## 5. What this corrects in every previous attempt

1. Pendulums are VERTICAL, hanging through the table — not flat in the paper plane.
2. Each lateral swings RADIALLY (aimed along its arm at the pen) — not along its table edge.
3. The arm leaves the SHAFT TOP and levers OPPOSITE the bob — not from the bob, not from the table foot.
4. All links are FIXED length with permanent pin joints; pen = true 2-arm junction (circle intersection).
5. ROTARY = the paper ORBITS (translates); it never spins about its center. The ink is the pen-minus-paper relative path.
6. Motion decays exponentially; drawings are born spiraling inward; real machines run ≈0.5–1 Hz (our real-time draw rate work fits reality).

## 6. Animation bar (owner: "better than 1998 — it is 2026")

Production-quality: a properly staged perspective view of the machine (table,
three shafts with weights, fulcrums, arms, pen, orbiting platform), materially
lit in the app's dark/amber language, 60fps UI-thread motion, ink that
accumulates like ink (the existing phosphor ramp), damping visibly shrinking
the swings, and the LATERAL/ROTARY toggle changing the machine itself (rotary
pendulum + orbiting paper appear). Built against §2's rigid-body invariants —
the linkage is computed, never faked.
