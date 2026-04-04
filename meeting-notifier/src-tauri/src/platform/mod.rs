pub trait PlatformServices: Send + Sync {
    fn play_notification_sound(&self);
}

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::MacOSPlatform as CurrentPlatform;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::WindowsPlatform as CurrentPlatform;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod fallback;
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub use fallback::FallbackPlatform as CurrentPlatform;

pub fn create_platform() -> CurrentPlatform {
    CurrentPlatform::new()
}
