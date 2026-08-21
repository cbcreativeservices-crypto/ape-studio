// ape-dsp — Android Expo module (ruling R3, 2026-07-23). The Android analog of
// ApeDspModule.swift: exposes the SAME JS surface (Name("ApeDsp")) so index.ts
// resolves identically on both platforms. Audio capture/output + the DSP core
// live natively (Oboe + the shared C++ core via ApeDspJni.cpp); this class does
// permission handling, the Expo DSL, and Map/ByteArray marshalling.
//
// Frame dictionaries mirror the iOS ApeDspCore keys EXACTLY (engineVersion 3).
package expo.modules.apedsp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MicrophoneInfo
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
  private var bluetoothInput = false  // active input is a Bluetooth mic (SCO) — drives the JS unsupported-input warning
  private var sampleRate = 0.0
  private var framesPerBurst = 0.0
  private var lastError = ""
  // Current OUTPUT route + the route-change callback that drives the route-aware
  // speaker-safety high-pass (built-in speaker → HPF on; else full range).
  private var outputRoute = "unknown"
  private var deviceCallback: AudioDeviceCallback? = null

  companion object {
    init { System.loadLibrary("apedspjni") }
  }

  // ---- JNI (symbols in ApeDspJni.cpp) ----
  // apedsp::kEngineVersion (EngineHub.hpp) — the ONE source of truth for the
  // engine capability version JS gates features on; never hardcode it here.
  private external fun nativeEngineVersion(): Int
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
  private external fun nativeGenSetHpf(h: Long, hz: Double)
  private external fun nativeGenSetStereo(h: Long, on: Boolean, fL: Double, fR: Double)
  private external fun nativeFxSet(h: Long, effectId: Int, paramId: Int, v: Double)
  private external fun nativeFxReset(h: Long)
  private external fun nativeFxGrStatus(h: Long): DoubleArray
  // ADDITIVE (HV-2): flat [f0, a1..a12, p1..p12] — 25 doubles (Hz, 0..1, degrees).
  private external fun nativeGenSetAdditive(h: Long, vals: DoubleArray)
  private external fun nativeGenUnlockCap(h: Long)
  private external fun nativeGenRelockCap(h: Long)
  private external fun nativeGenStatus(h: Long): DoubleArray
  // Wave-2 expansion voices (engineVersion 7).
  private external fun nativeGenSetFm(h: Long, ratio: Double, index: Double, decaySec: Double)
  private external fun nativeBinSetSource(
    h: Long, i: Int, on: Boolean, type: Int, freq: Double, levelDb: Double, az: Double, dist: Double,
  )
  private external fun nativeBinStart(h: Long): Boolean
  private external fun nativeBinStop(h: Long)
  private external fun nativeBinStatus(h: Long): DoubleArray
  private external fun nativeModSet(h: Long, param: Int, v: Double)
  private external fun nativeModStart(h: Long): Boolean
  private external fun nativeModStop(h: Long)
  private external fun nativeModStatus(h: Long): DoubleArray
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
      // React to output route changes (headphone plug/unplug, BT connect) so the
      // speaker-safety HPF follows the route even when only the generator runs.
      val ctx = appContext.reactContext
      val am = ctx?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      if (am != null) {
        val cb = object : AudioDeviceCallback() {
          override fun onAudioDevicesAdded(added: Array<out AudioDeviceInfo>?) { refreshOutputRouteAndHpf() }
          override fun onAudioDevicesRemoved(removed: Array<out AudioDeviceInfo>?) { refreshOutputRouteAndHpf() }
        }
        deviceCallback = cb
        am.registerAudioDeviceCallback(cb, null)
        refreshOutputRouteAndHpf()
      }
    }
    OnDestroy {
      val am = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      deviceCallback?.let { am?.unregisterAudioDeviceCallback(it) }
      deviceCallback = null
      if (handle != 0L) {
        nativeStopCapture(handle)
        nativeGenStop(handle)
        nativeBinStop(handle)
        nativeModStop(handle)
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
      bluetoothInput = detectBluetoothInput()
      lastError = ""
      promise.resolve(infoMap())
    }

    AsyncFunction("stop") { promise: Promise ->
      if (handle != 0L) nativeStopCapture(handle)
      bluetoothInput = false
      promise.resolve(null)
    }

    Function("getInfo") { infoMap() }
    // Manufacturer-declared microphone metadata (API 28+) for the community mic
    // catalog — sensitivity, frequency response, directionality, id. NOT a
    // substitute for calibration; fields may be unknown. null when unavailable.
    Function("getMicrophoneInfo") { micInfoMap() }
    Function("resetPeakHold") { if (handle != 0L) nativeResetPeakHold(handle) }
    Function("resetLeq") { if (handle != 0L) nativeResetLeq(handle) }

    // Legacy Spike-0 frame (rmsDb = Z-fast) — keeps the DspDebug screen working.
    Function("getFrame") {
      val m = if (handle != 0L) nativeMeterFrame(handle) else DoubleArray(18)
      mapOf<String, Any?>(
        "version" to m[0].toInt(), "sequence" to m[1], "settingsEpoch" to m[2].toInt(),
        "rmsDb" to m[3], "peakDb" to m[9], "peakHoldDb" to m[10],
        "droppedFrames" to m[15], "running" to (m[16] == 1.0), "captureStalled" to (m[17] == 1.0),
        "processedInput" to !measurementMode, "bluetoothInput" to bluetoothInput, "interrupted" to false,
        "engineVersion" to nativeEngineVersion(),
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
        "processedInput" to !measurementMode, "bluetoothInput" to bluetoothInput, "interrupted" to false,
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
      // Set the route-aware HPF for the current output route BEFORE starting, so
      // the filter is stable before the first audible sample (no onset gate/puff
      // from a mid-onset engage). The core also guards this via envSettled_.
      refreshOutputRouteAndHpf()
      nativeGenStart(handle)
      promise.resolve(genStatusMap())
    }
    AsyncFunction("genStop") { promise: Promise ->
      if (handle != 0L) nativeGenStop(handle)
      promise.resolve(null)
    }
    Function("genSet") { params: Map<String, Any?> ->
      if (handle == 0L) return@Function
      // ORDER MATTERS: every target key ("frequency", "levelDb", "sweep",
      // "additive", …) is marshaled BEFORE "mode". setMode() arms the core's
      // retrigger, and the RT render callback can land between two native
      // calls — mode-first would let one buffer render the PREVIOUS targets.
      // Targets-first means the retrigger always fires with the new state in
      // place. Same ordering in ApeDspModule.swift — keep them in sync.
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
      // ADDITIVE (HV-2): flat [f0, a1..a12, p1..p12] — 25 numbers (Hz, 0..1,
      // degrees). Same ordering as iOS/JS. Drop the call if any element is
      // non-numeric (sweep-style all-or-nothing guard — Boolean is not Number
      // here, and the Swift bridge rejects CFBoolean to match); the core
      // ignores short arrays. NOTE: "frequency" retunes the SINE path only —
      // retuning the additive f0 means resending the full additive array.
      (params["additive"] as? List<*>)?.let { list ->
        val vals = list.mapNotNull { (it as? Number)?.toDouble() }
        if (vals.size == list.size) nativeGenSetAdditive(handle, vals.toDoubleArray())
      }
      // STEREO dual-oscillator (hard-panned L/R) — { on, fL, fR }. Targets-first
      // like the rest (before mode). Same shape on iOS/JS.
      (params["stereo"] as? Map<*, *>)?.let { st ->
        val fL = (st["fL"] as? Number)?.toDouble()
        val fR = (st["fR"] as? Number)?.toDouble()
        if (fL != null && fR != null) nativeGenSetStereo(handle, (st["on"] as? Boolean) ?: false, fL, fR)
      }
      // FM voice (wave-2, engineVersion 7) — { ratio, index, decaySec }.
      // Targets-first like the rest (before mode). Same shape on iOS/JS.
      (params["fm"] as? Map<*, *>)?.let { fm ->
        val ratio = (fm["ratio"] as? Number)?.toDouble()
        val index = (fm["index"] as? Number)?.toDouble()
        if (ratio != null && index != null) {
          nativeGenSetFm(handle, ratio, index, (fm["decaySec"] as? Number)?.toDouble() ?: 0.0)
        }
      }
      (params["mode"] as? Number)?.let { nativeGenSetMode(handle, it.toInt()) }
    }
    Function("genUnlockCap") { if (handle != 0L) nativeGenUnlockCap(handle) }
    Function("genRelockCap") { if (handle != 0L) nativeGenRelockCap(handle) }
    Function("genStatus") { genStatusMap() }

    // ---- Effects chain (one scalar setter for the whole roster) ----
    Function("fxSet") { effectId: Int, paramId: Int, value: Double ->
      if (handle != 0L) nativeFxSet(handle, effectId, paramId, value)
    }
    Function("fxReset") { if (handle != 0L) nativeFxReset(handle) }
    Function("fxGrStatus") {
      (if (handle != 0L) nativeFxGrStatus(handle) else DoubleArray(3)).toList()
    }

    // ---- Wave-2 expansion voices (engineVersion 7). All output voices share
    // ONE Oboe stream: every start ensures it; every stop closes only when
    // generator + binaural + modular are ALL idle (native side owns this). ----
    AsyncFunction("binStart") { promise: Promise ->
      if (handle == 0L) { promise.reject("E_NO_ENGINE", "engine not created", null); return@AsyncFunction }
      refreshOutputRouteAndHpf()
      if (!nativeBinStart(handle)) {
        promise.reject("E_BIN_START", "Could not start audio output.", null)
        return@AsyncFunction
      }
      promise.resolve(binStatusMap())
    }
    AsyncFunction("binStop") { promise: Promise ->
      if (handle != 0L) nativeBinStop(handle)
      promise.resolve(null)
    }
    // Source i (0..2): { on, type (0 sine·1 white·2 pink), freq, levelDb,
    // azDeg (−180..180, + = right), dist (m) }. Ramped natively — drag-rate safe.
    Function("binSet") { sourceIdx: Int, params: Map<String, Any?> ->
      if (handle == 0L) return@Function
      nativeBinSetSource(
        handle, sourceIdx,
        (params["on"] as? Boolean) ?: false,
        (params["type"] as? Number)?.toInt() ?: 0,
        (params["freq"] as? Number)?.toDouble() ?: 440.0,
        (params["levelDb"] as? Number)?.toDouble() ?: -20.0,
        (params["azDeg"] as? Number)?.toDouble() ?: 0.0,
        (params["dist"] as? Number)?.toDouble() ?: 1.0,
      )
    }
    Function("binStatus") { binStatusMap() }

    AsyncFunction("modStart") { promise: Promise ->
      if (handle == 0L) { promise.reject("E_NO_ENGINE", "engine not created", null); return@AsyncFunction }
      refreshOutputRouteAndHpf()
      if (!nativeModStart(handle)) {
        promise.reject("E_MOD_START", "Could not start audio output.", null)
        return@AsyncFunction
      }
      promise.resolve(modStatusMap())
    }
    AsyncFunction("modStop") { promise: Promise ->
      if (handle != 0L) nativeModStop(handle)
      promise.resolve(null)
    }
    Function("modSet") { param: Int, value: Double ->
      if (handle != 0L) nativeModSet(handle, param, value)
    }
    Function("modStatus") { modStatusMap() }
  }

  /** Detect the OUTPUT route and drive the route-aware speaker-safety HPF: the
   *  built-in speaker gets the protective high-pass (its micro-driver can't
   *  reproduce lows and over-excurses); any wired/BT/USB/line output reproduces
   *  lows fine and gets full range (cutoff 0 = bypass). */
  /** True when the active INPUT device is a Bluetooth mic (SCO). BT audio is
   *  band-limited (HFP), so measurements are unreliable — the JS surfaces the
   *  "unsupported input" warning from this flag. Sampled once per capture start
   *  (owner 2026-08-14). */
  private fun detectBluetoothInput(): Boolean {
    val am = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return false
    return am.getDevices(AudioManager.GET_DEVICES_INPUTS)
      .any { it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO }
  }

  private fun refreshOutputRouteAndHpf() {
    if (handle == 0L) return
    val am = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    val nonSpeaker = intArrayOf(
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES, AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP, AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      AudioDeviceInfo.TYPE_USB_HEADSET, AudioDeviceInfo.TYPE_USB_DEVICE,
      AudioDeviceInfo.TYPE_AUX_LINE, AudioDeviceInfo.TYPE_LINE_ANALOG,
    )
    val outs = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
    val hasNonSpeaker = outs.any { nonSpeaker.contains(it.type) }
    outputRoute = if (hasNonSpeaker) "Headphones" else "Speaker"
    // 150 Hz matches JS speakerSafety SPEAKER_HPF_HZ.
    nativeGenSetHpf(handle, if (hasNonSpeaker) 0.0 else 150.0)
  }

  // Manufacturer-declared built-in microphone metadata (API 28+). Returns null
  // when unavailable / pre-P. Values may be UNKNOWN — mapped to null so the JS
  // side records "not declared" honestly. DIRECT/PROCESSED channel mapping needs
  // an active AudioRecord (getActiveMicrophones); our capture is Oboe-owned, so
  // it is reported "unknown" here.
  private fun micInfoMap(): Map<String, Any?>? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return null
    val am = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return null
    val mics = try { am.microphones } catch (e: Exception) { return null }
    if (mics.isEmpty()) return null
    val mic = mics.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_MIC } ?: mics.first()
    val sens = mic.sensitivity
    val freq = try { mic.frequencyResponse } catch (e: Exception) { emptyList<android.util.Pair<Float, Float>>() }
    val freqOut = if (freq.isNullOrEmpty()) null else freq.map { listOf(it.first, it.second) }
    val addr = mic.address
    return mapOf(
      "sensitivityDbFs" to (if (sens == MicrophoneInfo.SENSITIVITY_UNKNOWN) null else sens),
      "frequencyResponse" to freqOut,
      "channelMapping" to "unknown",
      "directionality" to directionalityName(mic.directionality),
      "address" to (if (addr.isNullOrEmpty()) null else addr),
    )
  }

  private fun directionalityName(d: Int): String? = when (d) {
    MicrophoneInfo.DIRECTIONALITY_OMNI -> "omni"
    MicrophoneInfo.DIRECTIONALITY_BI_DIRECTIONAL -> "bidirectional"
    MicrophoneInfo.DIRECTIONALITY_CARDIOID -> "cardioid"
    MicrophoneInfo.DIRECTIONALITY_HYPER_CARDIOID -> "hypercardioid"
    MicrophoneInfo.DIRECTIONALITY_SUPER_CARDIOID -> "supercardioid"
    else -> null
  }

  private fun infoMap(): Map<String, Any?> = mapOf(
    // v1 = Spike-0; v2 = engine build 2026-07-23; v3 = additive generator
    // (HV-2). Read from apedsp::kEngineVersion via JNI — never hardcoded.
    "engineVersion" to nativeEngineVersion(),
    "sampleRate" to sampleRate,
    "ioBufferDuration" to (if (sampleRate > 0) framesPerBurst / sampleRate else 0.0),
    "measurementMode" to measurementMode,
    "bluetoothInput" to bluetoothInput,
    "routeName" to "Android input",
    "inputPortType" to (if (measurementMode) "unprocessed" else "voice-recognition"),
    "outputRoute" to outputRoute,
    "running" to (handle != 0L && nativeCaptureRunning(handle)),
    "lastError" to lastError,
    "stopReason" to "",
    "events" to emptyList<String>(),
  )

  private fun genStatusMap(): Map<String, Any?> {
    // 8 fixed slots (see nativeGenStatus). additiveNorm (HV-2): 1 = not
    // attenuating; <1 = the additive peak bound is pulling levels down.
    // v4: genHpfHz (0 = bypassed) + genHpfEngaged (route-aware speaker HPF).
    val g = if (handle != 0L) nativeGenStatus(handle) else DoubleArray(8)
    return mapOf(
      "running" to (g[0] == 1.0), "capUnlocked" to (g[1] == 1.0),
      "effectiveLevelDb" to g[2], "defaultLevelDb" to g[3], "capDb" to g[4],
      "additiveNorm" to g[5],
      "genHpfHz" to g[6], "genHpfEngaged" to (g[7] == 1.0),
    )
  }

  private fun binStatusMap(): Map<String, Any?> {
    // [running, busNorm] (see nativeBinStatus) — busNorm < 1 = Q4 sum bound active.
    val b = if (handle != 0L) nativeBinStatus(handle) else DoubleArray(2)
    return mapOf("running" to (b[0] == 1.0), "busNorm" to (if (b.size > 1) b[1] else 1.0))
  }

  private fun modStatusMap(): Map<String, Any?> {
    // [running, envLevel, activeStep] (see nativeModStatus) — live honest meters.
    val m = if (handle != 0L) nativeModStatus(handle) else doubleArrayOf(0.0, 0.0, -1.0)
    return mapOf(
      "running" to (m[0] == 1.0), "envLevel" to m[1],
      "activeStep" to (if (m.size > 2) m[2].toInt() else -1),
    )
  }

  private fun emptyBands(): Map<String, Any?> = mapOf(
    "sequence" to 0.0, "fraction" to 3, "fftSize" to 0, "sampleRate" to 0.0,
    "centers" to emptyList<Any?>(), "levelsDb" to emptyList<Any?>(),
    "peakHoldDb" to emptyList<Any?>(), "resolvable" to emptyList<Any?>(),
  )
}
