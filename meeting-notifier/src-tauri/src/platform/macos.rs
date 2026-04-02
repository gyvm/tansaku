use super::PlatformServices;

pub struct MacOSPlatform;

impl MacOSPlatform {
    pub fn new() -> Self {
        Self
    }
}

impl PlatformServices for MacOSPlatform {
    fn play_notification_sound(&self) {
        // Use macOS system sound via command
        let _ = std::process::Command::new("afplay")
            .arg("/System/Library/Sounds/Glass.aiff")
            .spawn();
    }
}
