Pod::Spec.new do |s|
  s.name             = 'vozoo_engine'
  s.version          = '0.1.0'
  s.summary          = 'Vozoo audio DSP engine powered by Rust.'
  s.description      = <<-DESC
Vozoo audio DSP engine with effects processing, powered by Rust.
                       DESC
  s.homepage         = 'https://github.com/example/vozoo'
  s.license          = { :file => '../LICENSE' }
  s.author           = { 'Vozoo' => 'dev@example.com' }

  s.source           = { :path => '.' }
  s.source_files     = 'Classes/**/*'
  s.dependency 'FlutterMacOS'
  s.platform = :osx, '10.15'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  s.swift_version = '5.0'

  # Pre-built Rust static library (run build_rust.sh host before building)
  s.vendored_libraries = 'libvozoo_ffi.a'
end
