Pod::Spec.new do |s|
  s.name           = 'ApeOptical'
  s.version        = '0.1.0'
  s.summary        = 'AP&E optical (camera-luma) capture for the Light-Pulse Hz counter'
  s.description    = 'AVCaptureSession video-data output, mean-frame luminance from the Y plane, thread-safe ring, pull-based (timestamp, luma) samples. Isolated from ape-dsp (never touches the audio RT thread).'
  s.author         = 'Pro Audio Training Academy'
  s.homepage       = 'https://github.com/cbcreativeservices/ape-studio'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end
