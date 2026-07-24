// ape-dsp — Android Expo module (ruling R3, 2026-07-23). The Android analog of
// ApeDspModule.swift: exposes the SAME JS surface (Name("ApeDsp")) so index.ts
// resolves identically on both platforms. Audio capture/output + the DSP core
// live natively (Oboe + the shared C++ core via ApeDspJni.cpp); this class does
// permission handling, the Expo DSL, and Map/ByteArray marshalling.
//
// Frame dictionaries mirror the iOS ApeDspCore keys EXACTLY (engineVersion 2).
package expo.modules.apedsp

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApeDspModule : Module() {
  private var handle: Long = 0L

  // Cached from the last successful startCapture() — used for getInfo() and to
  // add the audio-path honesty flags to each meter frame (mirrors how the iOS
  // module carries measurementMode across getFrame calls).
  private var measurementMode = false
  private var sampleRate = 0.0
  private var framesPerBurst = 0.0
  private var lastError = ""

  companion object {
    init { System.loadLibrary("apedspjni") }
  }

  // ---- JNI (symbols in ApeDspJni.cpp) ----
  private external fun nativeCreate(): Long
  private external fun nativeDestroy(h: Long)
  private external fun nativeStartCapture(h: Long, unprocessedSupported: Boolean): DoubleArray
  private external fun nativeStopCapture(h: Long)
  private external fun nativeResetPeakHold(h: Long)
  private external fun nativeResetLeq(h: Long)
  private external fun nativeSetEngineConfig(
    h: Long, fftSize: Int, fraction: Int, spectrum: Boolean, pitch: Boolean,
    waveform: Boolean, bandAvgAlpha: Double,
  )
  private external fun nativeMeterFrame(h: Long): DoubleArray
  private external fun nativeBandsPacked(h: Long): FloatArray
  private external fun nativePitchFrame(h: Long): DoubleArray
  private external fun nativeSpectrumMeta(h: Long): DoubleArray
  private external fun nativeSpectrumData(h: Long): ByteArray
  private external fun nativeWaveformData(h: Long): ByteArray
  private external fun nativeCaptureRunning(h: Long): Boolean
  private external fun nativeGenStart(h: Long): Boolean
  private external fun nativeGenStop(h: Long)
  private external fun nativeGenSetMode(h: Long, mode: Int)
  private external fun nativeGenSetFrequency(h: Long, hz: Double)
  private external fun nativeGenSetLevelDb(h: Long, db: Double)
  private external fun nativeGenSetSweep(h: Long, s0: Double, s1: Double, secs: Double, repeat: Boolean)
  private external fun nativeGenSetClickBpm(h: Long, bpm: Double)
  private external fun nativeGenUnlockCap(h: Long)
  private external fun nativeGenRelockCap(h: Long)
  private external fun nativeGenStatus(h: Long): DoubleArray
  private external fun nativeRt60Arm(h: Long)
  private external fun nativeRt60Cancel(h: Long)
  private external fun nativeRt60State(h: Long): Int
  private external fun nativeRt60Bands(h: Long): DoubleArray
  private external fun nativeRt60Curve(h: Long): FloatArray
  private external fun nativeRt60CurveStep(h: Long): Double

  override fun definition() = ModuleDefinition {
    Name("ApeDsp")

    OnCreate {
      handle = nativeCreate()
    }
    OnDestroy {
      if (handle != 0L) {
        nativeStopCapture(handle)
        nativeGenStop(handle)
        nativeDestroy(handle)
        handle = 0L
      }
    }

    // ---- Capture lifecycle ----
    AsyncFunction("start") { promise: Promise ->
      if (handle == 0L) { promise.reject("E_NO_ENGINE", "engine not created", null); return@AsyncFunction }
      val ctx = appContext.reactContext
      if (ctx == null) { promise.reject(Exceptions.ReactContextLost()); return@AsyncFunction }
      val granted = ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) ==
        PackageManager.PERMISSION_GRANTED
      if (!granted) {
        // Runtime permission request is driven from JS (expo permissions) or the
        // OS prompt; if it's not granted we fail honestly rather than capture silence.
        lastError = "microphone permission not granted"
        promise.reject("E_MIC_DENIED", "Microphone access is off — enable it in Settings.", null)
        return@AsyncFunction
      }
      // Does the device support the Unprocessed (raw) audio source?
      val am = ctx.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
      val unprocessedSupported =
        am.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true"
      val r = nativeStartCapture(handle, unprocessedSupported)
      if (r.isEmpty() || r[0] != 1.0) {
        lastError = "could not start audio capture"
        promise.reject("E_CAPTURE_START", "Could not start audio capture.", null)
        return@AsyncFunction
      }
      sampleRate = r[1]
      framesPerBurst = r[2]
      measurementMode = r[3] == 1.0
      lastError = ""
      promise.resolve(infoMap())
    }

    AsyncFunction("stop") { promise: Promise ->
      if (handle != 0L) nativeStopCapture(handle)
      promise.resolve(null)
    }

    Function("getInfo") { infoMap() }
    Function("resetPeakHold") { if (handle != 0L) nativeResetPeakHold(handle) }
    Function("resetLeq") { if (handle != 0L) nativeResetLeq(handle) }

    // Legacy Spike-0 frame (rmsDb = Z-fast) — keeps the DspDebug screen working.
    Function("getFrame") {
      val m = if (handle != 0L) nativeMeterFrame(handle) else DoubleArray(18)
      mapOf<String, Any?>(
        "version" to m[0].toInt(), "sequence" to m[1], "settingsEpoch" to m[2].toInt(),
        "rmsDb" to m[3], "peakDb" to m[9], "peakHoldDb" to m[10],
        "droppedFrames" to m[15], "running" to (m[16] == 1.0), "captureStalled" to (m[17] == 1.0),
        "processedInput" to !measurementMode, "bluetoothInput" to false, "interrupted" to false,
        "engineVersion" to 2,
      )
    }

    // ---- Engine config + frames ----
    Function("setEngineConfig") { config: Map<String, Any?> ->
      if (handle == 0L) return@Function
      nativeSetEngineConfig(
        handle,
        (config["fftSize"] as? Number)?.toInt() ?: 4096,
        (config["fraction"] as? Number)?.toInt() ?: 3,
        (config["spectrumEnabled"] as? Boolean) ?: false,
        (config["pitchEnabled"] as? Boolean) ?: false,
        (config["waveformEnabled"] as? Boolean) ?: false,
        (config["bandAvgAlpha"] as? Number)?.toDouble() ?: 0.35,
      )
    }

    Function("getMeterFrame") {
      val m = if (handle != 0L) nativeMeterFrame(handle) else DoubleArray(18)
      mapOf<String, Any?>(
        "version" to m[0].toInt(), "sequence" to m[1], "settingsEpoch" to m[2].toInt(),
        "zFastDb" to m[3], "zSlowDb" to m[4], "aFastDb" to m[5], "aSlowDb" to m[6],
        "cFastDb" to m[7], "cSlowDb" to m[8], "peakDb" to m[9], "peakHoldDb" to m[10],
        "clipRuns" to m[11], "leqZDb" to m[12], "leqADb" to m[13], "elapsedSec" to m[14],
        "droppedFrames" to m[15], "running" to (m[16] == 1.0), "captureStalled" to (m[17] == 1.0),
        // Android has no OS "processed input" query beyond the preset we got; if
        // Unprocessed wasn't honored the input is processed (uncalibrated warning).
        "processedInput" to !measurementMode, "bluetoothInput" to false, "interrupted" to false,
      )
    }

    // One packed snapshot (see nativeBandsPacked) — arrays + scalars consistent.
    Function("getBandsFrame") {
      if (handle == 0L) return@Function emptyBands()
      val p = nativeBandsPacked(handle)
      if (p.size < 5) return@Function emptyBands()
      val n = p[4].toInt()
      if (n < 0 || p.size < 5 + 4 * n) return@Function emptyBands()
      val base = 5
      mapOf<String, Any?>(
        "sequence" to p[0].toDouble(), "fraction" to p[1].toInt(), "fftSize" to p[2].toInt(),
        "sampleRate" to p[3].toDouble(),
        "centers" to (base until base + n).map { p[it].toDouble() },
        "levelsDb" to (base + n until base + 2 * n).map { p[it].toDouble() },
        "peakHoldDb" to (base + 2 * n until base + 3 * n).map { p[it].toDouble() },
        "resolvable" to (base + 3 * n until base + 4 * n).map { p[it] == 1.0f },
      )
    }

    Function("getPitchFrame") {
      val p = if (handle != 0L) nativePitchFrame(handle) else DoubleArray(5)
      mapOf<String, Any?>(
        "sequence" to p[0], "freq" to p[1], "confidence" to p[2],
        "voiced" to (p[3] == 1.0), "levelDb" to p[4],
      )
    }

    Function("getSpectrumMeta") {
      val s = if (handle != 0L) nativeSpectrumMeta(handle) else DoubleArray(4)
      mapOf<String, Any?>(
        "sequence" to s[0], "fftSize" to s[1].toInt(), "sampleRate" to s[2], "bins" to s[3].toInt(),
      )
    }
    // ByteArray → Uint8Array in JS (matches index.ts getSpectrumData(): Uint8Array).
    Function("getSpectrumData") { if (handle != 0L) nativeSpectrumData(handle) else ByteArray(0) }
    Function("getWaveformData") { if (handle != 0L) nativeWaveformData(handle) else ByteArray(0) }

    // ---- RT60 ----
    Function("rt60Arm") { if (handle != 0L) nativeRt60Arm(handle) }
    Function("rt60Cancel") { if (handle != 0L) nativeRt60Cancel(handle) }
    Function("getRt60Frame") {
      if (handle == 0L) return@Function mapOf<String, Any?>(
        "state" to 0, "bands" to emptyList<Any?>(), "curveDb" to emptyList<Any?>(), "curveStepSec" to 0.0,
      )
      val state = nativeRt60State(handle)
      val bands = mutableListOf<Map<String, Any?>>()
      if (state == 3) {
        val flat = nativeRt60Bands(handle)
        var i = 0
        while (i + 8 < flat.size) {
          bands.add(
            mapOf(
              "bandHz" to flat[i], "edtSec" to flat[i + 1], "t20Rt60Sec" to flat[i + 2],
              "t30Rt60Sec" to flat[i + 3], "r2" to flat[i + 4], "t20R2" to flat[i + 5],
              "t30R2" to flat[i + 6], "decayRangeDb" to flat[i + 7], "valid" to (flat[i + 8] == 1.0),
            )
          )
          i += 9
        }
      }
      mapOf<String, Any?>(
        "state" to state,
        "bands" to bands,
        "curveDb" to (if (state == 3) nativeRt60Curve(handle).toList() else emptyList<Any?>()),
        "curveStepSec" to (if (state == 3) nativeRt60CurveStep(handle) else 0.0),
      )
    }

    // ---- Generator (Q4 caps enforced in the C++ core) ----
    AsyncFunction("genStart") { promise: Promise ->
      if (handle == 0L) { promise.reject("E_NO_ENGINE", "engine not created", null); return@AsyncFunction }
      nativeGenStart(handle)
      promise.resolve(genStatusMap())
    }
    AsyncFunction("genStop") { promise: Promise ->
      if (handle != 0L) nativeGenStop(handle)
      promise.resolve(null)
    }
    Function("genSet") { params: Map<String, Any?> ->
      if (handle == 0L) return@Function
      (params["mode"] as? Number)?.let { nativeGenSetMode(handle, it.toInt()) }
      (params["frequency"] as? Number)?.let { nativeGenSetFrequency(handle, it.toDouble()) }
      (params["levelDb"] as? Number)?.let { nativeGenSetLevelDb(handle, it.toDouble()) }
      (params["clickBpm"] as? Number)?.let { nativeGenSetClickBpm(handle, it.toDouble()) }
      (params["sweep"] as? Map<*, *>)?.let { sw ->
        val s0 = (sw["startHz"] as? Number)?.toDouble()
        val s1 = (sw["endHz"] as? Number)?.toDouble()
        val secs = (sw["seconds"] as? Number)?.toDouble()
        if (s0 != null && s1 != null && secs != null) {
          nativeGenSetSweep(handle, s0, s1, secs, (sw["repeat"] as? Boolean) ?: true)
        }
      }
    }
    Function("genUnlockCap") { if (handle != 0L) nativeGenUnlockCap(handle) }
    Function("genRelockCap") { if (handle != 0L) nativeGenRelockCap(handle) }
    Function("genStatus") { genStatusMap() }
  }

  private fun infoMap(): Map<String, Any?> = mapOf(
    "engineVersion" to 2,
    "sampleRate" to sampleRate,
    "ioBufferDuration" to (if (sampleRate > 0) framesPerBurst / sampleRate else 0.0),
    "measurementMode" to measurementMode,
    "bluetoothInput" to false,
    "routeName" to "Android input",
    "inputPortType" to (if (measurementMode) "unprocessed" else "voice-recognition"),
    "running" to (handle != 0L && nativeCaptureRunning(handle)),
    "lastError" to lastError,
    "stopReason" to "",
    "events" to emptyList<String>(),
  )

  private fun genStatusMap(): Map<String, Any?> {
    val g = if (handle != 0L) nativeGenStatus(handle) else DoubleArray(5)
    return mapOf(
      "running" to (g[0] == 1.0), "capUnlocked" to (g[1] == 1.0),
      "effectiveLevelDb" to g[2], "defaultLevelDb" to g[3], "capDb" to g[4],
    )
  }

  private fun emptyBands(): Map<String, Any?> = mapOf(
    "sequence" to 0.0, "fraction" to 3, "fftSize" to 0, "sampleRate" to 0.0,
    "centers" to emptyList<Any?>(), "levelsDb" to emptyList<Any?>(),
    "peakHoldDb" to emptyList<Any?>(), "resolvable" to emptyList<Any?>(),
  )
}
