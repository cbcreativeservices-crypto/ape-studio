// GestureExclusionView — excludes its own bounds from the system back
// gesture (see ApeGestureExclusionModule.kt for the why and the 200 dp cap).
package expo.modules.apegestureexclusion

import android.content.Context
import android.graphics.Rect
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class GestureExclusionView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  companion object {
    /** Android's per-edge exclusion limit (dp). */
    const val SYSTEM_CAP_DP = 200.0
  }

  private var active = true
  private var maxHeightDp = SYSTEM_CAP_DP

  fun setActive(value: Boolean) {
    if (active == value) return
    active = value
    applyExclusion()
  }

  fun setMaxHeightDp(value: Double) {
    // Never above the system cap: a larger request is ignored by Android.
    val v = max(0.0, min(value, SYSTEM_CAP_DP))
    if (maxHeightDp == v) return
    maxHeightDp = v
    applyExclusion()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    applyExclusion()
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    if (changed) applyExclusion()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    applyExclusion()
  }

  /** The rect, in this view's own coordinates: full width, height clamped to
   *  the cap and centred. Empty when inactive or not laid out. */
  private fun applyExclusion() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
    if (!active || width <= 0 || height <= 0 || maxHeightDp <= 0.0) {
      systemGestureExclusionRects = emptyList()
      return
    }
    val capPx = (maxHeightDp * resources.displayMetrics.density).roundToInt()
    val h = min(height, capPx)
    val top = (height - h) / 2
    systemGestureExclusionRects = listOf(Rect(0, top, width, top + h))
  }
}
