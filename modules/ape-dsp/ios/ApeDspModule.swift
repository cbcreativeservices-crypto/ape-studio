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

  // Info snapshot (refreshed on start + route change).
  private var sampleRate: Double = 0
  private var bufferDuration: Double = 0
  private var measurementMode = false
  private var bluetoothInput = false
  private var routeName = ""
  private var inputPortType = ""
  private var inputUID: String?
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

    OnCreate {
      self.observeNotifications()
      self.startWatchdog()
    }

    OnDestroy {
      self.desiredRunning = false
      self.stopWatchdog()
      self.stopCapture(reason: "module-destroy")
      self.observers.forEach { NotificationCenter.default.removeObserver($0) }
      self.observers.removeAll()
    }
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
      "sampleRate": sampleRate,
      "ioBufferDuration": bufferDuration,
      "measurementMode": measurementMode,
      "bluetoothInput": bluetoothInput,
      "routeName": routeName,
      "inputPortType": inputPortType,
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
        guard let self, self.running, !self.restarting else { return }
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
