fn main() {
    #[cfg(target_os = "macos")]
    {
        cc::Build::new()
            .file("src/mole/icon.m")
            .flag("-fmodules")
            .compile("mole_icon");
        println!("cargo:rustc-link-lib=framework=Cocoa");
    }
    tauri_build::build()
}
