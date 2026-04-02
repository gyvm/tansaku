use super::PlatformServices;

pub struct FallbackPlatform;

impl FallbackPlatform {
    pub fn new() -> Self {
        Self
    }
}

impl PlatformServices for FallbackPlatform {
    fn play_notification_sound(&self) {
        log::info!("Notification sound not available on this platform");
    }
}
