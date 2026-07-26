// ape-dsp — Expo Module (Swift): capture session + engine tap + lifecycle.
// Spike-0 scope (kickoff brief D2/D3/D5):
//  - AVAudioSession .playAndRecord, mode .measurement, VERIFIED after
//    activation (processedInput flag when not honored),
//  - Bluetooth-input detection (bluetoothInput flag — HFP is band-limited),
//  - actual sample-rate / IO-buffer read-back,
//  - route-change + interruption handling (pause/resume + core reset),
//  - RT-safe tap: mono-mix into the C++ ring, NOTHING else on the audio thread,
//  - pull-based frame access (synchronous Function, ≤30 Hz polled by JS).
import AVFoundation
import ExpoModulesCore

public class ApeDspModule: Module {
  private let core = ApeDspCore()
  private var engine: AVAudioEngine?
  private var running = false
  private var interrupted = false
  // Generator output (engine build 2026-07-23): its own AVAudioEngine so the
  // tone/noise generator runs with OR without capture. Q4 caps live in the
  // C++ core — this layer only renders.
  private var outEngine: AVAudioEngine?
  private var outNode: AVAudioSourceNode?

  // Info snapshot (refreshed on start + route change).
  private var sampleRate: Double = 0
  private var bufferDuration: Double = 0
  private var measurementMode = false
  private var bluetoothInput = false
  private var routeName = ""
  private var inputPortType = ""
  private var inputUID: String?
  // Current OUTPUT route + the route-aware speaker-safety high-pass cutoff.
  private var outputRoute = "unknown"
  private let speakerHpfHz = 150.0  // matches JS speakerSafety SPEAKER_HPF_HZ
  private var restarting = false
  private var lastError = ""
  private var stopReason = ""
  private var events: [String] = []
  /// USER INTENT — true from start() until js-stop/destroy (or an interruption
  /// that iOS says not to resume). The recovery watchdog works toward this.
  private var desiredRunning = false
  private var watchdog: DispatchSourceTimer?

  private func logEvent(_ s: String) {
    let t = Date().timeIntervalSince1970
    events.append("\(String(format: "%.1f", t.truncatingRemainder(dividingBy: 10000))) \(s)")
    if events.count > 14 { events.removeFirst() }
  }

  public func definition() -> ModuleDefinition {
    Name("ApeDsp")

    AsyncFunction("start") { (promise: Promise) in
      self.desiredRunning = true
      self.requestPermissionAndStart(promise: promise)
    }

    AsyncFunction("stop") { () -> Void in
      self.desiredRunning = false
      self.stopCapture(reason: "js-stop")
    }

    // Synchronous pull — small dictionary at display rate (≤30 Hz from JS).
    Function("getFrame") { () -> [String: Any] in
      var frame: [String: Any] = self.core.frame()
      frame["processedInput"] = !self.measurementMode
      frame["bluetoothInput"] = self.bluetoothInput
      frame["interrupted"] = self.interrupted
      return frame
    }

    Function("getInfo") { () -> [String: Any] in
      return self.infoDict()
    }

    Function("resetPeakHold") { () -> Void in
      self.core.resetPeakHold()
    }

    // ---- Engine build (2026-07-23): analysis config + per-tool frames ----
    // All pull-based at ≤30 Hz (spike bridge rules). Scalars/small arrays ride
    // the dictionary bridge; spectrum + waveform arrays ride Data (Uint8Array
    // on the JS side — the typed-array path required at spectrogram sizes).

    Function("setEngineConfig") { (config: [String: Any]) -> Void in
      self.core.setEngineConfig(config)
    }
    Function("getMeterFrame") { () -> [String: Any] in
      var f: [String: Any] = self.core.meterFrame()
      f["processedInput"] = !self.measurementMode
      f["bluetoothInput"] = self.bluetoothInput
      f["interrupted"] = self.interrupted
      return f
    }
    Function("getBandsFrame") { () -> [String: Any] in
      return self.core.bandsFrame()
    }
    Function("getPitchFrame") { () -> [String: Any] in
      return self.core.pitchFrame()
    }
    Function("getSpectrumMeta") { () -> [String: Any] in
      return self.core.spectrumMeta()
    }
    Function("getSpectrumData") { () -> Data in
      return self.core.spectrumData()
    }
    Function("getWaveformData") { () -> Data in
      return self.core.waveformData()
    }
    Function("resetLeq") { () -> Void in
      self.core.resetLeq()
    }

    // ---- RT60 guided capture (spec §13) ----
    Function("rt60Arm") { () -> Void in
      self.core.rt60Arm()
    }
    Function("rt60Cancel") { () -> Void in
      self.core.rt60Cancel()
    }
    Function("getRt60Frame") { () -> [String: Any] in
      return self.core.rt60Frame()
    }

    // ---- Generator (Tool 6). Q4 caps enforced in the C++ core. ----
    AsyncFunction("genStart") { (promise: Promise) in
      do {
        try self.startGeneratorOutput()
        self.core.genStart()
        promise.resolve(self.core.genStatus())
      } catch {
        promise.reject("E_GEN_START", "Could not start audio output: \(error.localizedDescription)")
      }
    }
    AsyncFunction("genStop") { () -> Void in
      self.core.genStop()
      // Let the 10 ms fade finish before tearing the graph down.
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
        if let e = self.outEngine, self.coreGenIdle() {
          e.stop()
          self.outEngine = nil
          self.outNode = nil
        }
      }
    }
    Function("genSet") { (params: [String: Any]) -> Void in
      // ORDER MATTERS: every target key ("frequency", "levelDb", "sweep",
      // "additive", …) is marshaled BEFORE "mode". setMode() arms the core's
      // retrigger, and the RT render callback can land between two native
      // calls — mode-first would let one buffer render the PREVIOUS targets
      // (e.g. sine→additive sounding the stale/default model for ~5–10 ms).
      // Targets-first means the retrigger always fires with the new state in
      // place. Same ordering in ApeDspModule.kt — keep them in sync.
      if let f = params["frequency"] as? Double { self.core.genSetFrequency(f) }
      if let l = params["levelDb"] as? Double { self.core.genSetLevelDb(l) }
      if let bpm = params["clickBpm"] as? Double { self.core.genSetClickBpm(bpm) }
      if let s = params["sweep"] as? [String: Any],
         let s0 = s["startHz"] as? Double, let s1 = s["endHz"] as? Double,
         let secs = s["seconds"] as? Double {
        self.core.genSetSweepStart(s0, end: s1, seconds: secs, repeat: (s["repeat"] as? Bool) ?? true)
      }
      // ADDITIVE (HV-2): flat [f0, a1..a12, p1..p12] — 25 numbers (Hz, 0..1,
      // degrees). Same ordering on Android/JS. Drop the call if any element is
      // non-numeric (mirrors the sweep all-or-nothing guard); the core ignores
      // short arrays. Booleans are REJECTED explicitly: JS true/false bridge
      // as NSNumber (CFBoolean) and would silently coerce to 1/0 here while
      // Android's `as? Number` check drops the whole call — mirror Android's
      // strictness so malformed payloads behave identically cross-platform.
      // NOTE: "frequency" retunes the SINE path only — retuning the additive
      // f0 means resending the full additive array.
      if let arr = params["additive"] as? [Any] {
        let boolTypeID = CFBooleanGetTypeID()
        let vals = arr.compactMap { (v: Any) -> Double? in
          guard let n = v as? NSNumber, CFGetTypeID(n) != boolTypeID else { return nil }
          return n.doubleValue
        }
        if vals.count == arr.count {
          self.core.genSetAdditive(vals.map { NSNumber(value: $0) })
        }
      }
      if let m = params["mode"] as? Int { self.core.genSetMode(Int32(m)) }
    }
    Function("genUnlockCap") { () -> Void in
      self.core.genUnlockCap()
    }
    Function("genRelockCap") { () -> Void in
      self.core.genRelockCap()
    }
    Function("genStatus") { () -> [String: Any] in
      return self.core.genStatus()
    }

    OnCreate {
      self.observeNotifications()
      self.startWatchdog()
    }

    OnDestroy {
      self.desiredRunning = false
      self.stopWatchdog()
      self.stopCapture(reason: "module-destroy")
      self.core.genStop()
      self.outEngine?.stop()
      self.outEngine = nil
      self.outNode = nil
      self.observers.forEach { NotificationCenter.default.removeObserver($0) }
      self.observers.removeAll()
    }
  }

  // MARK: - Generator output graph (engine build 2026-07-23)

  private func coreGenIdle() -> Bool {
    return ((core.genStatus()["running"] as? Bool) ?? false) == false
  }

  private func startGeneratorOutput() throws {
    if let e = outEngine, e.isRunning { return }
    let session = AVAudioSession.sharedInstance()
    // Reuse the capture category when capture runs; otherwise configure a
    // playback-capable session (still playAndRecord so a later capture start
    // does not fight the category).
    if !running {
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
      try session.setActive(true, options: [])
    }
    let sr = session.sampleRate > 0 ? session.sampleRate : 48_000
    core.configureSampleRate(sr)
    guard let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1) else {
      throw NSError(domain: "ApeDsp", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "no output format"])
    }
    let engine = AVAudioEngine()
    let node = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
      guard let self else { return noErr }
      let abl = UnsafeMutableAudioBufferListPointer(audioBufferList)
      guard let mData = abl.first?.mData else { return noErr }
      let ptr = mData.assumingMemoryBound(to: Float.self)
      self.core.genRender(ptr, frames: frameCount)
      return noErr
    }
    engine.attach(node)
    engine.connect(node, to: engine.mainMixerNode, format: format)
    engine.prepare()
    try engine.start()
    outEngine = engine
    outNode = node
    // Set the route-aware HPF for the current output before the first buffer.
    refreshOutputRouteAndHpf()
    logEvent("generator output STARTED (\(Int(sr)) Hz)")
  }

  private var observers: [NSObjectProtocol] = []

  // MARK: - Permission + start

  private func requestPermissionAndStart(promise: Promise) {
    let session = AVAudioSession.sharedInstance()
    session.requestRecordPermission { granted in
      DispatchQueue.main.async {
        guard granted else {
          self.logEvent("mic permission DENIED")
          promise.reject("E_MIC_DENIED", "Microphone access is off — enable it in Settings.")
          return
        }
        do {
          try self.startCapture()
          self.lastError = ""
          promise.resolve(self.infoDict())
        } catch {
          self.stopCapture(reason: "start-failure")
          self.lastError = "start: \(error.localizedDescription)"
          promise.reject("E_CAPTURE_START", "Could not start audio capture: \(error.localizedDescription)")
        }
      }
    }
  }

  private func infoDict() -> [String: Any] {
    return [
      // v1 = Spike-0; v2 = engine build 2026-07-23; v3 = additive generator
      // (HV-2). Read from the C++ constant (apedsp::kEngineVersion via the
      // ApeDspCore accessor) — never hardcoded, so a core bump can't skew
      // getInfo() vs frame() vs Android.
      "engineVersion": ApeDspCore.engineVersion(),
      "sampleRate": sampleRate,
      "ioBufferDuration": bufferDuration,
      "measurementMode": measurementMode,
      "bluetoothInput": bluetoothInput,
      "routeName": routeName,
      "inputPortType": inputPortType,
      "outputRoute": outputRoute,
      "running": running,
      "desiredRunning": desiredRunning,
      "lastError": lastError,
      "stopReason": stopReason,
      "events": events,
    ]
  }

  private func startCapture() throws {
    if running { return }
    let session = AVAudioSession.sharedInstance()

    // Category + MEASUREMENT mode (functional spec §1.2 — non-negotiable).
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker])
    // Request, then READ BACK — the hardware decides (tech spec §2.1).
    try? session.setPreferredSampleRate(48_000)
    try? session.setPreferredIOBufferDuration(0.01)
    try session.setActive(true, options: [])

    refreshRouteInfo()
    // Engine build: weighting/FFT/pitch must run at the ACTUAL session rate
    // (read back, not requested — tech spec §2.1 / finding F3 discipline).
    core.configureSampleRate(sampleRate)

    let engine = AVAudioEngine()
    let input = engine.inputNode
    let format = input.inputFormat(forBus: 0)
    // Tap: copy/mix into the ring. Nothing else on the RT thread.
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
      guard let self, let channels = buffer.floatChannelData else { return }
      let nch = Int(buffer.format.channelCount)
      let frames = Int(buffer.frameLength)
      // UnsafePointer<UnsafeMutablePointer<Float>> → const float* const*
      channels.withMemoryRebound(to: UnsafePointer<Float>?.self, capacity: nch) { rebound in
        self.core.writeChannels(rebound, channelCount: Int32(nch), frameCount: frames)
      }
    }

    engine.prepare()
    try engine.start()

    self.engine = engine
    core.reset()
    core.start()
    running = true
    interrupted = false
    stopReason = ""
    logEvent("capture STARTED (\(routeName), \(Int(sampleRate)) Hz)")
  }

  private func stopCapture(reason: String) {
    guard running || engine != nil else { return }
    stopReason = reason
    logEvent("capture STOPPED (\(reason))")
    engine?.inputNode.removeTap(onBus: 0)
    engine?.stop()
    engine = nil
    core.stop()
    running = false
    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
  }

  private func refreshRouteInfo() {
    let session = AVAudioSession.sharedInstance()
    sampleRate = session.sampleRate
    bufferDuration = session.ioBufferDuration
    // VERIFY measurement mode was honored (tech spec §2.1) — do not trust the request.
    measurementMode = session.mode == .measurement
    let inputs = session.currentRoute.inputs
    inputPortType = inputs.first?.portType.rawValue ?? "none"
    routeName = inputs.first?.portName ?? "no input"
    inputUID = inputs.first?.uid
    // Never accept Bluetooth INPUT routes (HFP band-limits/compresses).
    let btTypes: [AVAudioSession.Port] = [.bluetoothHFP, .bluetoothLE, .bluetoothA2DP]
    bluetoothInput = inputs.contains { btTypes.contains($0.portType) }
    refreshOutputRouteAndHpf()
  }

  /// Detect the OUTPUT route and drive the route-aware speaker-safety HPF: the
  /// built-in speaker gets the protective high-pass (its micro-driver can't
  /// reproduce lows and over-excurses); every other output (headphones, BT,
  /// line-out) reproduces lows fine and gets full range (cutoff 0 = bypass).
  private func refreshOutputRouteAndHpf() {
    let outs = AVAudioSession.sharedInstance().currentRoute.outputs
    outputRoute = outs.first?.portType.rawValue ?? "unknown"
    let isSpeaker = outputRoute == AVAudioSession.Port.builtInSpeaker.rawValue
    core.genSetHpf(isSpeaker ? speakerHpfHz : 0.0)
  }

  // MARK: - Recovery watchdog (Booth 2026-07-09, Spike-0 field finding)
  // iOS did NOT deliver interruption notifications when a phone call seized
  // the mic (observed on-device: route flapped to uid=nil, no BEGAN event,
  // capture silently stalled). Notifications are therefore advisory only —
  // this 2 s loop works toward the USER'S intent (`desiredRunning`): a stalled
  // session is torn down and restarted; a dead session is restarted as soon as
  // an input route exists again (e.g. the call ended). Failed attempts retry
  // on the next tick and are logged honestly.

  private func startWatchdog() {
    stopWatchdog()
    let t = DispatchSource.makeTimerSource(queue: .main)
    t.schedule(deadline: .now() + 2, repeating: 2)
    t.setEventHandler { [weak self] in
      guard let self, self.desiredRunning, !self.restarting, !self.interrupted else { return }
      if self.running {
        let stalled = (self.core.frame()["captureStalled"] as? Bool) ?? false
        guard stalled else { return }
        self.logEvent("watchdog: capture stalled — restarting")
        self.stopCapture(reason: "watchdog-stall")
      }
      guard !AVAudioSession.sharedInstance().currentRoute.inputs.isEmpty else {
        self.logEvent("watchdog: no input route — waiting")
        return
      }
      do {
        try self.startCapture()
        self.lastError = ""
      } catch {
        self.lastError = "watchdog restart: \(error.localizedDescription)"
        self.logEvent("watchdog: restart failed — retrying")
      }
    }
    t.resume()
    watchdog = t
  }

  private func stopWatchdog() {
    watchdog?.cancel()
    watchdog = nil
  }

  // MARK: - Route changes + interruptions (tech spec §2.1/§6)
  // Block-based observers (Expo's Module base is not guaranteed NSObject, so
  // no #selector targets). Delivered on the main queue.

  private func observeNotifications() {
    let nc = NotificationCenter.default
    observers.append(
      nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) {
        [weak self] note in
        guard let self else { return }
        // Re-evaluate the OUTPUT route on EVERY route change — the generator can
        // be running without capture (the labs play tones with no mic), so the
        // speaker-safety HPF must follow speaker↔headphone transitions even when
        // the capture-restart path below is skipped.
        self.refreshOutputRouteAndHpf()
        guard self.running, !self.restarting else { return }
        // iOS fires a route-change for OUR OWN session configuration
        // (.categoryChange/.override) the moment capture starts — reacting to
        // those tears down a healthy session (Spike-0 field bug: running=false,
        // sequence=0 right after start). Only restart when a DEVICE actually
        // changed, and only if the input route really differs.
        let reasonRaw = (note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt) ?? 0
        let reason = AVAudioSession.RouteChangeReason(rawValue: reasonRaw) ?? .unknown
        let newUID = AVAudioSession.sharedInstance().currentRoute.inputs.first?.uid
        self.logEvent("routeChange reason=\(reasonRaw) uid=\(newUID ?? "nil")")
        let deviceReasons: [AVAudioSession.RouteChangeReason] = [
          .newDeviceAvailable, .oldDeviceUnavailable, .routeConfigurationChange,
        ]
        guard deviceReasons.contains(reason) else { return }
        guard newUID != self.inputUID else { return }

        // Full restart: new format, fresh meters (stale EMAs must not bleed
        // across routes — tech spec §6). Retry once — rapid route churn can
        // make the first activation attempt fail transiently.
        self.restarting = true
        self.stopCapture(reason: "route-change")
        do {
          try self.startCapture()
          self.restarting = false
        } catch {
          self.lastError = "route restart: \(error.localizedDescription)"
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            do {
              try self.startCapture()
              self.lastError = ""
            } catch {
              self.lastError = "route restart retry: \(error.localizedDescription)"
            }
            self.restarting = false
          }
        }
      })
    observers.append(
      nc.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) {
        [weak self] note in
        guard let self,
              let info = note.userInfo,
              let typeRaw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeRaw)
        else { return }
        switch type {
        case .began:
          self.logEvent("interruption BEGAN")
          if self.running {
            self.interrupted = true
            self.stopCapture(reason: "interruption")
          }
        case .ended:
          let optsRaw = (info[AVAudioSessionInterruptionOptionKey] as? UInt) ?? 0
          let opts = AVAudioSession.InterruptionOptions(rawValue: optsRaw)
          self.logEvent("interruption ENDED shouldResume=\(opts.contains(.shouldResume))")
          if self.interrupted && !opts.contains(.shouldResume) {
            // Apple explicitly says don't auto-resume — respect it: this ends
            // the user's session (they restart manually). Otherwise the
            // watchdog resumes toward desiredRunning on its next tick.
            self.desiredRunning = false
          }
          self.interrupted = false
        @unknown default:
          break
        }
      })
  }
}
