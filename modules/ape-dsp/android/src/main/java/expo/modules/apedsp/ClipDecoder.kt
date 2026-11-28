// ape-dsp — CLIP decoder (engine 13, 2026-11-27, build must-do D16 / A15).
// Decodes one LOCAL audio file (the lab-audio AAC/M4A, or a WAV) to
// deinterleaved float PCM at the FILE's own rate, with the platform's own
// decoders: MediaExtractor (container) + MediaCodec (codec). Nothing new is
// linked — both are android.media, in every Android since API 16.
//
// Runs on the Expo AsyncFunction thread that called loadClip — never the Oboe
// callback and never the JS thread. The C++ core resamples to the output rate
// at render time (Generator.hpp clipSample), so nothing is resampled here.
//
// Limits match the core (Clip.hpp genclip): at most 60 s; mono or the first two
// channels; 16-bit or float PCM out of the codec (anything else is refused, not
// guessed). Errors are ClipDecodeException with the same codes the iOS bridge
// uses: unsupported · not_found · decode · too_long · empty.
package expo.modules.apedsp

import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import android.os.Build
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal class ClipDecodeException(val code: String, message: String) : Exception(message)

internal class DecodedClip(val left: FloatArray, val right: FloatArray?, val frames: Int, val sampleRate: Int)

internal object ClipDecoder {
  /** apedsp::genclip::kMaxSeconds — keep in lockstep with Clip.hpp. */
  private const val MAX_SECONDS = 60.0
  private const val TIMEOUT_US = 10_000L
  /** Dequeue attempts that produced nothing, after input ended, before giving up. */
  private const val MAX_IDLE_POLLS = 500

  /** A local path from a `file://` URI or an absolute path; null for anything else. */
  fun pathFromUri(uri: String): String? {
    if (uri.startsWith("/")) return uri
    val u = Uri.parse(uri)
    return if (u.scheme == "file") u.path else null
  }

  fun decode(uri: String): DecodedClip {
    val path = pathFromUri(uri) ?: throw ClipDecodeException("unsupported", "Only a local file can be loaded")
    if (!File(path).isFile) throw ClipDecodeException("not_found", "No file at that path")
    val ex = MediaExtractor()
    var codec: MediaCodec? = null
    try {
      try {
        ex.setDataSource(path)
      } catch (e: Exception) {
        throw ClipDecodeException("decode", "Not a readable audio file")
      }
      var track = -1
      var fmt: MediaFormat? = null
      for (i in 0 until ex.trackCount) {
        val f = ex.getTrackFormat(i)
        if ((f.getString(MediaFormat.KEY_MIME) ?: "").startsWith("audio/")) {
          track = i
          fmt = f
          break
        }
      }
      if (track < 0 || fmt == null) throw ClipDecodeException("decode", "No audio track")
      ex.selectTrack(track)
      val mime = fmt.getString(MediaFormat.KEY_MIME) ?: throw ClipDecodeException("decode", "No audio type")
      var rate = fmt.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      var channels = fmt.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      val durationUs = if (fmt.containsKey(MediaFormat.KEY_DURATION)) fmt.getLong(MediaFormat.KEY_DURATION) else -1L
      if (durationUs > (MAX_SECONDS * 1e6).toLong() + 500_000L) throw ClipDecodeException("too_long", "Longer than 60 s")
      // Encoder priming (AAC): only trimmed below if the decoder did not already.
      val encoderDelay = if (fmt.containsKey("encoder-delay")) fmt.getInteger("encoder-delay") else 0
      // Ask for float out (API 24+); a decoder may still answer 16-bit — handled.
      if (Build.VERSION.SDK_INT >= 24) fmt.setInteger(MediaFormat.KEY_PCM_ENCODING, AudioFormat.ENCODING_PCM_FLOAT)
      val c = try {
        MediaCodec.createDecoderByType(mime)
      } catch (e: Exception) {
        throw ClipDecodeException("decode", "No decoder for $mime")
      }
      codec = c
      c.configure(fmt, null, null, 0)
      c.start()
      var encoding = pcmEncoding(c.outputFormat)
      val acc = PcmAccumulator()
      val info = MediaCodec.BufferInfo()
      var inputDone = false
      var idle = 0
      while (true) {
        if (!inputDone) {
          val inIdx = c.dequeueInputBuffer(TIMEOUT_US)
          if (inIdx >= 0) {
            val inBuf = c.getInputBuffer(inIdx) ?: throw ClipDecodeException("decode", "No input buffer")
            val n = ex.readSampleData(inBuf, 0)
            if (n < 0) {
              c.queueInputBuffer(inIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              inputDone = true
            } else {
              c.queueInputBuffer(inIdx, 0, n, ex.sampleTime, 0)
              ex.advance()
            }
          }
        }
        val outIdx = c.dequeueOutputBuffer(info, TIMEOUT_US)
        if (outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          val of = c.outputFormat
          rate = of.getInteger(MediaFormat.KEY_SAMPLE_RATE)
          channels = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
          encoding = pcmEncoding(of)
        } else if (outIdx >= 0) {
          idle = 0
          val ob = c.getOutputBuffer(outIdx)
          if (ob != null && info.size > 0) {
            ob.position(info.offset)
            ob.limit(info.offset + info.size)
            acc.append(ob.slice().order(ByteOrder.nativeOrder()), encoding, channels)
            if (acc.frames > rate * MAX_SECONDS + rate) throw ClipDecodeException("too_long", "Longer than 60 s")
          }
          c.releaseOutputBuffer(outIdx, false)
          if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) break
        } else if (inputDone && ++idle > MAX_IDLE_POLLS) {
          throw ClipDecodeException("decode", "The decoder stopped answering")
        }
      }
      var start = 0
      var frames = acc.frames
      // Trim AAC priming/padding the decoder left in: only when we got a FEW
      // more frames than the container's duration says (priming + padding
      // scale, ≤ 8192), the priming only when the container names a delay. A
      // decoder that already trimmed, or a WAV, leaves this a no-op.
      if (durationUs > 0) {
        val expected = Math.round(durationUs * rate / 1e6).toInt()
        val excess = frames - expected
        if (expected > 0 && excess in 1..8192) {
          if (encoderDelay > 0 && excess >= encoderDelay / 2) start = minOf(encoderDelay, excess)
          frames = expected + start
        }
      }
      val n = frames - start
      if (n <= 0) throw ClipDecodeException("empty", "No audio in the file")
      if (n > rate * MAX_SECONDS) throw ClipDecodeException("too_long", "Longer than 60 s")
      val left = acc.left.copyOfRange(start, start + n)
      val right = if (channels >= 2) acc.right.copyOfRange(start, start + n) else null
      return DecodedClip(left, right, n, rate)
    } finally {
      try { codec?.stop() } catch (e: Exception) {}
      try { codec?.release() } catch (e: Exception) {}
      try { ex.release() } catch (e: Exception) {}
    }
  }

  private fun pcmEncoding(f: MediaFormat): Int =
    if (Build.VERSION.SDK_INT >= 24 && f.containsKey(MediaFormat.KEY_PCM_ENCODING)) {
      f.getInteger(MediaFormat.KEY_PCM_ENCODING)
    } else {
      AudioFormat.ENCODING_PCM_16BIT
    }

  /** Growable deinterleaved float store (L, R) for the decoder's output. */
  private class PcmAccumulator {
    var left = FloatArray(1 shl 16)
    var right = FloatArray(1 shl 16)
    var frames = 0

    private fun ensure(extra: Int) {
      if (frames + extra <= left.size) return
      var cap = left.size
      while (cap < frames + extra) cap *= 2
      left = left.copyOf(cap)
      right = right.copyOf(cap)
    }

    fun append(buf: ByteBuffer, encoding: Int, channels: Int) {
      if (channels < 1) throw ClipDecodeException("decode", "No channels")
      when (encoding) {
        AudioFormat.ENCODING_PCM_FLOAT -> {
          val fb = buf.asFloatBuffer()
          val n = fb.remaining() / channels
          ensure(n)
          for (i in 0 until n) {
            val l = fb.get(i * channels)
            left[frames + i] = l
            right[frames + i] = if (channels >= 2) fb.get(i * channels + 1) else l
          }
          frames += n
        }
        AudioFormat.ENCODING_PCM_16BIT -> {
          val sb = buf.asShortBuffer()
          val n = sb.remaining() / channels
          ensure(n)
          for (i in 0 until n) {
            val l = sb.get(i * channels) / 32768f
            left[frames + i] = l
            right[frames + i] = if (channels >= 2) sb.get(i * channels + 1) / 32768f else l
          }
          frames += n
        }
        else -> throw ClipDecodeException("decode", "Unsupported PCM encoding $encoding")
      }
    }
  }
}
