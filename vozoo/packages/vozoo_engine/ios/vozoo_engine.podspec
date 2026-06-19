Pod::Spec.new do |s|
  s.name             = 'vozoo_engine'
  s.version          = '0.1.0'
  s.summary          = 'Vozoo audio DSP engine powered by Rust.'
  s.description      = <<-DESC
Vozoo audio DSP engine with effects processing, powered by Rust.
                       DESC
  s.homepage         = 'https://github.com/example/vozoo'
  s.license          = { :type => 'Proprietary' }
  s.author           = { 'Vozoo' => 'dev@example.com' }

  s.source           = { :path => '.' }
  s.source_files     = 'Classes/**/*'
  s.dependency 'Flutter'
  s.platform = :ios, '13.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386',
  }
  # The Rust FFI symbols (engine_create, etc.) are only referenced from Dart at
  # runtime via DynamicLibrary.process(), so the linker would dead-strip the
  # static archive's objects. Force-load the whole archive into the host app so
  # the symbols survive. Applied to the integrating (Runner) target.
  # See https://docs.flutter.dev/platform-integration/ios/c-interop
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '-force_load "${BUILT_PRODUCTS_DIR}/vozoo_engine/libvozoo_ffi.a"',
  }
  s.swift_version = '5.0'

  # Build Rust library during pod install
  s.script_phase = {
    :name => 'Build Rust Library',
    :execution_position => :before_compile,
    :script => <<-SCRIPT
      cd "${PODS_TARGET_SRCROOT}/.."
      if [ "${PLATFORM_NAME}" = "iphonesimulator" ]; then
        RUST_TARGET="aarch64-apple-ios-sim"
      else
        RUST_TARGET="aarch64-apple-ios"
      fi
      rustup target add "${RUST_TARGET}" >/dev/null 2>&1 || true
      cargo build -p vozoo-ffi --release --target "${RUST_TARGET}"
      cp "target/${RUST_TARGET}/release/libvozoo_ffi.a" "${BUILT_PRODUCTS_DIR}/libvozoo_ffi.a"
    SCRIPT
  }

  s.vendored_libraries = 'libvozoo_ffi.a'
end
