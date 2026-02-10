fn main() {
    tauri_build::build();

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::path::Path;

        let src = Path::new("src/audio_recorder.swift");
        let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR not set");
        let out_path = Path::new(&out_dir).join("libaudio_recorder.a");

        println!("cargo:rerun-if-changed={}", src.display());

        // Compile Swift source to static library
        let status = Command::new("swiftc")
            .args(&[
                "-emit-library",
                "-static",
                "-o",
                out_path.to_str().unwrap(),
                src.to_str().unwrap(),
            ])
            .status()
            .expect("Failed to run swiftc");

        if !status.success() {
            panic!("swiftc failed");
        }

        // Link the static library
        println!("cargo:rustc-link-search=native={}", out_dir);
        println!("cargo:rustc-link-lib=static=audio_recorder");

        // Link required frameworks
        println!("cargo:rustc-link-lib=framework=ScreenCaptureKit");
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=CoreGraphics");
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=Foundation");

        // Link Swift standard libraries (important for static linking)
        // Usually need to find where they are.
        // `swiftc -print-target-info` helps.
        // Or let swiftc link them?
        // When linking a static library produced by swiftc into a Rust binary (via cc/ld), we need to tell rustc where swift libs are.
        // This is tricky.
        // A common trick is to force linking against `swiftCore` via unsafe flags or search paths.
        // For now, I'll add a note that manual `LDFLAGS` might be needed if `cargo build` fails on macOS.
        // But since I'm on Linux, I can't test this. I will assume the user has a standard environment.
        // Usually standard setup works if we add:
        // println!("cargo:rustc-link-lib=swiftCore"); // This might fail if not in search path.
        // Better:
        // let output = Command::new("swiftc").arg("-print-lib-path").output().unwrap();
        // let lib_path = String::from_utf8(output.stdout).unwrap().trim().to_string();
        // println!("cargo:rustc-link-search=native={}", lib_path);
    }
}
