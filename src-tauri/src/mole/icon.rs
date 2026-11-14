use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::sync::{LazyLock, Mutex};

unsafe extern "C" {
    fn get_app_icon_png_base64(app_path: *const std::ffi::c_char) -> *mut std::ffi::c_char;
    fn free_app_icon_png_base64(ptr: *mut std::ffi::c_char);
}

static ICON_CACHE: LazyLock<Mutex<HashMap<String, String>>> = LazyLock::new(|| {
    Mutex::new(HashMap::new())
});

pub fn get_app_icon_base64(path: &str) -> Option<String> {
    if let Ok(cache) = ICON_CACHE.lock() {
        if let Some(cached) = cache.get(path) {
            return Some(cached.clone());
        }
    }

    let c_path = CString::new(path).ok()?;
    let icon_str = unsafe {
        let ptr = get_app_icon_png_base64(c_path.as_ptr());
        if ptr.is_null() {
            None
        } else {
            let s = CStr::from_ptr(ptr).to_string_lossy().into_owned();
            free_app_icon_png_base64(ptr);
            Some(s)
        }
    };

    if let Some(ref s) = icon_str {
        if let Ok(mut cache) = ICON_CACHE.lock() {
            cache.insert(path.to_string(), s.clone());
        }
    }

    icon_str
}
