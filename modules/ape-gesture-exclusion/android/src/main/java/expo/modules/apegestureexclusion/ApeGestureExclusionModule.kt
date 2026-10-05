// ape-gesture-exclusion — Android Expo module (2026-10-04).
//
// Owner report (Pixel 7 Pro, gesture navigation): grabbing a lab fader at
// either end "wants to scroll (swipe gesture) to next screen". Android's
// gesture navigation claims a touch that starts in the back-gesture strip at
// either screen edge and moves inward. The JS fix keeps the fader cap ≥ 40 dp
// from the edges (laneEdgeGuard.ts); this module is the platform's own
// answer, View.setSystemGestureExclusionRects (API 29+), for drag surfaces
// that cannot simply move away from the edge (a placement stage).
//
// One native view, GestureExclusionView: a LEAF (no children) that the JS
// side lays over a drag surface as an absolute fill with pointerEvents
// "none". On every layout it asks the system to exclude its own bounds.
//
// ⚠️ THE 200 dp CAP: Android honours at most 200 dp of exclusion height PER
// EDGE per window (anything above it is ignored by the system). The view
// therefore clamps its rect to `maxHeightDp` (default 200), centred
// vertically, and callers keep the sum on one screen ≤ 200 dp: the dock lane
// (48 dp) + a stage band of 140 dp = 188 dp.
//
// No-op below Android 10 (no gesture navigation there). Not built for iOS:
// the iOS edge swipe-back is already off on every lab route (RootNavigator's
// app-wide gestureEnabled:false), and the JS wrapper renders nothing on iOS,
// on web, and on any build that predates this module.
package expo.modules.apegestureexclusion

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApeGestureExclusionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApeGestureExclusion")

    /** Bump when the native surface changes. */
    Function("moduleVersion") { 1 }

    View(GestureExclusionView::class) {
      Prop("active") { view: GestureExclusionView, active: Boolean? ->
        view.setActive(active ?: true)
      }
      Prop("maxHeightDp") { view: GestureExclusionView, maxHeightDp: Double? ->
        view.setMaxHeightDp(maxHeightDp ?: GestureExclusionView.SYSTEM_CAP_DP)
      }
    }
  }
}
