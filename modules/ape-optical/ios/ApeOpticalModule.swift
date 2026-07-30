// ape-optical — Expo Module (Swift): camera-luminance capture for the
// Light-Pulse frequency counter (owner 2026-07-29).
//
// Pipeline: AVCaptureSession → AVCaptureVideoDataOutput (420f biplanar) →
// on a dedicated queue, average the Y (luma) plane over a downsampled central
// window → push (timestamp_ms, luma 0..1) into a thread-safe ring → JS pulls
// new samples by monotonic seq and estimates frequency by autocorrelation.
//
// ISOLATION: this module never touches AVAudioSession or the ape-dsp audio
// thread. It uses .video authorization only.
//
// GOTCHA (from ape-dsp memory): the Expo Module base is NOT NSObject, so the
// AVCaptureVideoDataOutputSampleBufferDelegate lives on a SEPARATE NSObject
// (`LumaProbe`) that the module owns. Never put #selector/delegate conformance
// on the Module itself.
import AVFoundation
import ExpoModulesCore

/// Thread-safe rolling store of (timestamp_ms, luma) samples with a monotonic
/// per-sample sequence so JS can pull only what's new.
final class LumaProbe: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let cap = 512
  private var ts = [Double](repeating: 0, count: 512)
  private var lum = [Double](repeating: 0, count: 512)
  private var head = 0            // next write index
  private var seq: Int64 = 0      // monotonic count of samples ever written
  private var fpsEst: Double = 0
  private var lastTs: Double = 0
  private let lock = NSLock()

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let pb = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    CVPixelBufferLockBaseAddress(pb, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(pb, .readOnly) }
    // Y (luma) plane = plane 0 of a biplanar 420 buffer.
    guard let base = CVPixelBufferGetBaseAddressOfPlane(pb, 0) else { return }
    let w = CVPixelBufferGetWidthOfPlane(pb, 0)
    let h = CVPixelBufferGetHeightOfPlane(pb, 0)
    let rowBytes = CVPixelBufferGetBytesPerRowOfPlane(pb, 0)
    let ptr = base.assumingMemoryBound(to: UInt8.self)
    // Average a downsampled central window (skip edges/vignette): every 8th
    // pixel over the middle 60% — cheap and steady.
    let x0 = w * 20 / 100, x1 = w * 80 / 100
    let y0 = h * 20 / 100, y1 = h * 80 / 100
    let step = 8
    var sum: Int64 = 0
    var count: Int64 = 0
    var y = y0
    while y < y1 {
      let row = ptr + y * rowBytes
      var x = x0
      while x < x1 {
        sum += Int64(row[x])
        count += 1
        x += step
      }
      y += step
    }
    guard count > 0 else { return }
    let luma = Double(sum) / Double(count) / 255.0

    let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    let tMs = CMTimeGetSeconds(pts) * 1000.0

    lock.lock()
    if lastTs > 0 {
      let dt = tMs - lastTs
      if dt > 0 { fpsEst = fpsEst == 0 ? 1000.0 / dt : fpsEst * 0.9 + (1000.0 / dt) * 0.1 }
    }
    lastTs = tMs
    ts[head] = tMs
    lum[head] = luma
    head = (head + 1) % cap
    seq += 1
    lock.unlock()
  }

  /// Pull samples with sequence > sinceSeq (oldest→newest), capped to the ring.
  func drain(since sinceSeq: Int64) -> (seq: Int64, ts: [Double], luma: [Double], fps: Double) {
    lock.lock(); defer { lock.unlock() }
    let want = seq - sinceSeq
    let n = Int(max(0, min(want, Int64(cap))))
    var outT = [Double](); var outL = [Double]()
    if n > 0 {
      outT.reserveCapacity(n); outL.reserveCapacity(n)
      for i in stride(from: n, through: 1, by: -1) {
        let idx = ((head - i) % cap + cap) % cap
        outT.append(ts[idx]); outL.append(lum[idx])
      }
    }
    return (seq, outT, outL, fpsEst)
  }

  func reset() {
    lock.lock(); seq = 0; head = 0; lastTs = 0; fpsEst = 0; lock.unlock()
  }

  var frameCount: Int64 { lock.lock(); defer { lock.unlock() }; return seq }
}

public class ApeOpticalModule: Module {
  private let probe = LumaProbe()
  private var session: AVCaptureSession?
  private let queue = DispatchQueue(label: "ape.optical.capture")
  private var running = false
  private var lastError = ""

  public func definition() -> ModuleDefinition {
    Name("ApeOptical")

    Function("moduleVersion") { () -> Int in 1 }

    Function("getPermissionStatus") { () -> String in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized: return "granted"
      case .denied, .restricted: return "denied"
      default: return "undetermined"
      }
    }

    AsyncFunction("start") { (promise: Promise) in
      AVCaptureDevice.requestAccess(for: .video) { granted in
        guard granted else {
          self.lastError = "camera permission denied"
          promise.reject("E_PERMISSION", self.lastError); return
        }
        self.queue.async { self.startSession(promise) }
      }
    }

    AsyncFunction("stop") { () -> Void in
      self.queue.async { self.stopSession() }
    }

    Function("getSamples") { (sinceSeq: Double) -> [String: Any] in
      let d = self.probe.drain(since: Int64(sinceSeq))
      return [
        "seq": Double(d.seq),
        "ts": d.ts,
        "luma": d.luma,
        "fps": d.fps,
        "running": self.running,
        "frameCount": Double(self.probe.frameCount),
        "lastError": self.lastError,
      ]
    }
  }

  private func startSession(_ promise: Promise) {
    if running { promise.resolve(nil); return }
    self.probe.reset()
    let s = AVCaptureSession()
    s.beginConfiguration()
    s.sessionPreset = .low // luminance only — small frames, steady frame rate
    guard let dev = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
      ?? AVCaptureDevice.default(for: .video),
      let input = try? AVCaptureDeviceInput(device: dev), s.canAddInput(input) else {
      lastError = "no camera input"
      promise.reject("E_CAMERA", lastError); return
    }
    s.addInput(input)
    let out = AVCaptureVideoDataOutput()
    out.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
    out.alwaysDiscardsLateVideoFrames = true
    out.setSampleBufferDelegate(probe, queue: queue)
    guard s.canAddOutput(out) else {
      lastError = "cannot add video output"
      promise.reject("E_CAMERA", lastError); return
    }
    s.addOutput(out)
    s.commitConfiguration()
    session = s
    s.startRunning()
    running = true
    lastError = ""
    promise.resolve(nil)
  }

  private func stopSession() {
    session?.stopRunning()
    session = nil
    running = false
  }
}
