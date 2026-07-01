use crate::models::*;
use crate::supabase::Supabase;
use base64::Engine;
use uuid::Uuid;

#[tauri::command]
pub async fn upsert_profile(user_id: String, email: String, full_name: String) -> ProfileResponse {
    let supabase = Supabase::new();
    match supabase.upsert_profile(&user_id, &email, &full_name).await {
        Ok(data) => {
            let profile = Profile {
                id: data["id"].as_str().unwrap_or("").to_string(),
                user_id: data["user_id"].as_str().unwrap_or("").to_string(),
                role: data["role"].as_str().unwrap_or("patient").to_string(),
                full_name: data["full_name"].as_str().unwrap_or(&full_name).to_string(),
                email: data["email"].as_str().unwrap_or(&email).to_string(),
            };
            ProfileResponse { profile: Some(profile), error: None }
        }
        Err(e) => ProfileResponse { profile: None, error: Some(e) }
    }
}

#[tauri::command]
pub async fn get_patient_records(user_id: String) -> RecordsResponse {
    let supabase = Supabase::new();

    let profile = match supabase.get_profile_by_user_id(&user_id).await {
        Ok(Some(p)) => p,
        Ok(None) => return RecordsResponse { records: vec![], error: Some("Profile not found".into()) },
        Err(e) => return RecordsResponse { records: vec![], error: Some(e) },
    };

    let patient_id = profile["id"].as_str().unwrap_or("");
    if patient_id.is_empty() {
        return RecordsResponse { records: vec![], error: Some("Invalid profile".into()) };
    }

    match supabase.get_records(patient_id).await {
        Ok(records_data) => {
            let records: Vec<MedicalRecord> = records_data.into_iter().map(|r| {
                let original_url = r["original_image_url"].as_str().map(|s| s.to_string());

                MedicalRecord {
                    id: r["id"].as_str().unwrap_or("").to_string(),
                    patient_id: r["patient_id"].as_str().unwrap_or("").to_string(),
                    provider_id: r["provider_id"].as_str().map(|s| s.to_string()),
                    record_type: r["record_type"].as_str().unwrap_or("note").to_string(),
                    title: r["title"].as_str().unwrap_or("").to_string(),
                    description: r["description"].as_str().map(|s| s.to_string()),
                    date: r["date"].as_str().unwrap_or("").to_string(),
                    is_approved: r["is_approved"].as_bool().unwrap_or(false),
                    is_handwritten: r["is_handwritten"].as_bool().unwrap_or(false),
                    original_image_url: original_url,
                    enhanced_image_url: r["enhanced_image_url"].as_str().map(|s| s.to_string()),
                    ocr_text: r["ocr_text"].as_str().map(|s| s.to_string()),
                    ai_summary: r["ai_summary"].as_str().map(|s| s.to_string()),
                    tags: r["tags"].as_array().map(|a| {
                        a.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
                    }),
                    created_at: r["created_at"].as_str().unwrap_or("").to_string(),
                    updated_at: r["updated_at"].as_str().unwrap_or("").to_string(),
                }
            }).collect();

            RecordsResponse { records, error: None }
        }
        Err(e) => RecordsResponse { records: vec![], error: Some(e) }
    }
}

#[tauri::command]
pub async fn upload_handwritten_note(
    user_id: String,
    user_email: String,
    user_full_name: String,
    file_data: Vec<u8>,
    file_name: String,
    file_type: String,
    title: String,
    description: String,
    record_type: String,
) -> UploadResult {
    let supabase = Supabase::new();

    // Upsert profile
    let profile = match supabase.upsert_profile(&user_id, &user_email, &user_full_name).await {
        Ok(data) => data,
        Err(e) => return UploadResult { success: false, record_id: None, error: Some(e) },
    };

    let patient_id = profile["id"].as_str().unwrap_or("").to_string();
    if patient_id.is_empty() {
        return UploadResult { success: false, record_id: None, error: Some("Could not get patient ID".into()) };
    }

    let ext = file_name.rsplit('.').next().unwrap_or("jpg");
    let file_path = format!("{}/{}.{}", patient_id, Uuid::new_v4(), ext);

    // Upload file
    if let Err(e) = supabase.upload_file("medical-images", &file_path, file_data, &file_type).await {
        return UploadResult { success: false, record_id: None, error: Some(e) };
    }

    // Create record
    let record = match supabase.create_record(
        &patient_id, None, &record_type, &title, &description, &file_path
    ).await {
        Ok(r) => r,
        Err(e) => {
            let _ = supabase.upload_file("medical-images", &file_path, vec![], "application/octet-stream").await;
            return UploadResult { success: false, record_id: None, error: Some(e) };
        }
    };

    let record_id = record["id"].as_str().unwrap_or("").to_string();

    // Create timeline event
    let _ = supabase.create_timeline_event(
        &patient_id, &record_id, &record_type, &title, &description
    ).await;

    // Create audit log
    let details = serde_json::json!({
        "patient_id": patient_id,
        "file_path": file_path,
        "record_type": record_type,
    });
    let _ = supabase.create_audit_log(
        &user_id, "upload_handwritten_record", "medical_records", &record_id,
        &details.to_string()
    ).await;

    UploadResult { success: true, record_id: Some(record_id), error: None }
}

#[tauri::command]
pub async fn get_record_image(path: String) -> ImageResponse {
    let supabase = Supabase::new();

    // Check if it's a full URL and extract path
    let storage_path = if path.contains("://") {
        // Extract path after /medical-images/
        path.split("/medical-images/").nth(1).unwrap_or(&path)
    } else {
        &path
    };

    match supabase.download_file("medical-images", storage_path).await {
        Ok((bytes, mime_type)) => {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            ImageResponse {
                data: Some(b64),
                mime_type: Some(mime_type),
                error: None,
            }
        }
        Err(e) => ImageResponse { data: None, mime_type: None, error: Some(e) }
    }
}
