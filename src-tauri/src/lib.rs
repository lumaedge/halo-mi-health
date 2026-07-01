mod commands;
mod models;
mod supabase;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::upsert_profile,
            commands::get_patient_records,
            commands::upload_handwritten_note,
            commands::get_record_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
