use super::PlatformServices;

pub struct WindowsPlatform;

impl WindowsPlatform {
    pub fn new() -> Self {
        Self
    }
}

impl PlatformServices for WindowsPlatform {
    fn play_notification_sound(&self) {
        // TODO: Implement Windows notification sound
        log::info!("Windows notification sound not yet implemented");
    }
}
