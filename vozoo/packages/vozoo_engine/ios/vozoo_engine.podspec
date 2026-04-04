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
  s.dependency 'Flutter'
  s.platform = :ios, '13.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386',
  }
  s.swift_version = '5.0'

  # Build Rust library during pod install
  s.script_phase = {
    :name => 'Build Rust Library',
    :script => <<-SCRIPT
      cd "${PODS_TARGET_SRCROOT}/../vozoo_engine"
      if [ "${PLATFORM_NAME}" = "iphonesimulator" ]; then
        RUST_TARGET="aarch64-apple-ios-sim"
      else
        RUST_TARGET="aarch64-apple-ios"
      fi
      cargo build -p vozoo-ffi --release --target ${RUST_TARGET}
      cp "target/${RUST_TARGET}/release/libvozoo_ffi.a" "${BUILT_PRODUCTS_DIR}/libvozoo_ffi.a" 2>/dev/null || true
    SCRIPT
    ,
    :execution_position => :before_compile,
  }

  s.vendored_libraries = 'libvozoo_ffi.a'
end
