use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub id: String,
    pub user_id: String,
    pub role: String,
    pub full_name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MedicalRecord {
    pub id: String,
    pub patient_id: String,
    pub provider_id: Option<String>,
    pub record_type: String,
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub is_approved: bool,
    pub is_handwritten: bool,
    pub original_image_url: Option<String>,
    pub enhanced_image_url: Option<String>,
    pub ocr_text: Option<String>,
    pub ai_summary: Option<String>,
    pub tags: Option<Vec<String>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResult {
    pub success: bool,
    pub record_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordsResponse {
    pub records: Vec<MedicalRecord>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageResponse {
    pub data: Option<String>,
    pub mime_type: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileResponse {
    pub profile: Option<Profile>,
    pub error: Option<String>,
}
