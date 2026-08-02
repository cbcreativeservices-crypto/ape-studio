// ape-optical — Android Expo module (owner 2026-07-29): the Android analog of
// ApeOpticalModule.swift. Same JS surface (Name("ApeOptical")) so index.ts
// resolves identically on both platforms.
//
// Pipeline: CameraX ImageAnalysis → on a background executor, average the Y
// (luma) plane over a downsampled central window → thread-safe ring of
// (timestamp_ms, luma 0..1) → JS pulls new samples by monotonic seq.
//
// ISOLATION: no audio, never touches ape-dsp. Uses android.permission.CAMERA
// only; the runtime request is driven from JS (PermissionsAndroid), mirroring
// ape-dsp's mic pattern — start() checks the grant and fails honestly if off.
package expo.modules.apeoptical

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

// Headless capture note: CameraX needs a LifecycleOwner but this module has no
// Activity/Fragment. Rather than hand-roll a LifecycleOwner (whose LifecycleOwner/
// LifecycleRegistry API shape differs across androidx.lifecycle versions), we bind
// to the app-wide ProcessLifecycleOwner supplied by lifecycle-process. It is
// RESUMED whenever the app is foregrounded (which it always is when the user is on
// the Light Pulse screen), so binding opens the camera immediately; when the app
// backgrounds, CameraX auto-unbinds and releases the camera, then re-binds on
// return. stop() calls unbindAll() to release regardless.

/** Thread-safe rolling store of (timestamp_ms, luma) with a monotonic seq. */
private class LumaRing(private val cap: Int = 512) {
  private val ts = DoubleArray(cap)
  private val lum = DoubleArray(cap)
  private var head = 0
  private var seq = 0L
  private var fpsEst = 0.0
  private var lastTs = 0.0
  private val lock = Any()

  fun push(tMs: Double, luma: Double) = synchronized(lock) {
    if (lastTs > 0) {
      val dt = tMs - lastTs
      if (dt > 0) fpsEst = if (fpsEst == 0.0) 1000.0 / dt else fpsEst * 0.9 + (1000.0 / dt) * 0.1
    }
    lastTs = tMs
    ts[head] = tMs; lum[head] = luma
    head = (head + 1) % cap
    seq += 1
  }

  fun drain(sinceSeq: Long): DrainResult = synchronized(lock) {
    val want = seq - sinceSeq
    val n = maxOf(0L, minOf(want, cap.toLong())).toInt()
    val outT = ArrayList<Double>(n); val outL = ArrayList<Double>(n)
    var i = n
    while (i >= 1) {
      val idx = ((head - i) % cap + cap) % cap
      outT.add(ts[idx]); outL.add(lum[idx]); i--
    }
    DrainResult(seq, outT, outL, fpsEst)
  }

  fun reset() = synchronized(lock) { seq = 0; head = 0; lastTs = 0.0; fpsEst = 0.0 }
  fun count(): Long = synchronized(lock) { seq }
}

private data class DrainResult(val seq: Long, val ts: List<Double>, val luma: List<Double>, val fps: Double)

class ApeOpticalModule : Module() {
  private val ring = LumaRing()
  private val analysisExec = Executors.newSingleThreadExecutor()
  private var provider: ProcessCameraProvider? = null
  private var running = false
  private var lastError = ""

  override fun definition() = ModuleDefinition {
    Name("ApeOptical")

    Function("moduleVersion") { 1 }

    Function("getPermissionStatus") {
      val ctx = appContext.reactContext ?: return@Function "undetermined"
      if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
        "granted" else "undetermined"
    }

    AsyncFunction("start") { promise: Promise ->
      val ctx = appContext.reactContext
      if (ctx == null) { promise.reject(Exceptions.ReactContextLost()); return@AsyncFunction }
      if (running) { promise.resolve(null); return@AsyncFunction }
      if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        lastError = "camera permission not granted"
        promise.reject("E_PERMISSION", "Camera access is off — enable it in Settings.", null)
        return@AsyncFunction
      }
      ring.reset()
      val future = ProcessCameraProvider.getInstance(ctx)
      future.addListener({
        try {
          val prov = future.get()
          val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
          analysis.setAnalyzer(analysisExec) { image -> analyze(image) }
          prov.unbindAll()
          prov.bindToLifecycle(
            ProcessLifecycleOwner.get(),
            CameraSelector.DEFAULT_BACK_CAMERA,
            analysis,
          )
          provider = prov
          running = true
          lastError = ""
          promise.resolve(null)
        } catch (e: Exception) {
          lastError = e.message ?: "camera bind failed"
          promise.reject("E_CAMERA", lastError, e)
        }
      }, ContextCompat.getMainExecutor(ctx))
    }

    AsyncFunction("stop") {
      val ctx = appContext.reactContext
      if (ctx != null && provider != null) {
        ContextCompat.getMainExecutor(ctx).execute {
          try { provider?.unbindAll() } catch (_: Exception) {}
          provider = null; running = false
        }
      } else { running = false }
    }

    Function("getSamples") { sinceSeq: Double ->
      val d = ring.drain(sinceSeq.toLong())
      mapOf(
        "seq" to d.seq.toDouble(),
        "ts" to d.ts,
        "luma" to d.luma,
        "fps" to d.fps,
        "running" to running,
        "frameCount" to ring.count().toDouble(),
        "lastError" to lastError,
      )
    }
  }

  /** Mean luminance of the Y plane over a downsampled central window. */
  private fun analyze(image: ImageProxy) {
    try {
      val plane = image.planes[0] // Y plane (YUV_420_888)
      val buf = plane.buffer
      val rowStride = plane.rowStride
      val pixStride = plane.pixelStride
      val w = image.width
      val h = image.height
      val x0 = w * 20 / 100; val x1 = w * 80 / 100
      val y0 = h * 20 / 100; val y1 = h * 80 / 100
      val step = 8
      var sum = 0L; var count = 0L
      var y = y0
      while (y < y1) {
        val rowStart = y * rowStride
        var x = x0
        while (x < x1) {
          val idx = rowStart + x * pixStride
          if (idx < buf.limit()) { sum += (buf.get(idx).toInt() and 0xFF); count++ }
          x += step
        }
        y += step
      }
      if (count > 0) {
        val luma = sum.toDouble() / count.toDouble() / 255.0
        val tMs = image.imageInfo.timestamp / 1_000_000.0 // ns → ms
        ring.push(tMs, luma)
      }
    } catch (e: Exception) {
      lastError = e.message ?: "analyze failed"
    } finally {
      image.close()
    }
  }
}
