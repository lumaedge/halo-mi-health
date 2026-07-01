use reqwest::Client;
use reqwest::header::HeaderName;
use serde_json::Value;

pub struct Supabase {
    client: Client,
    base_url: String,
    anon_key: String,
    service_key: String,
}

impl Supabase {
    pub fn new() -> Self {
        let base_url = option_env!("SUPABASE_URL")
            .unwrap_or("https://ymwgfiazmlvgbdtlszbr.supabase.co")
            .to_string();
        let anon_key = option_env!("SUPABASE_ANON_KEY")
            .unwrap_or("")
            .to_string();
        let service_key = option_env!("SUPABASE_SERVICE_ROLE_KEY")
            .unwrap_or("")
            .to_string();

        Supabase {
            client: Client::new(),
            base_url,
            anon_key,
            service_key,
        }
    }

    fn auth_headers(&self) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            HeaderName::from_static("apikey"),
            self.anon_key.parse().unwrap(),
        );
        headers.insert(
            HeaderName::from_static("authorization"),
            format!("Bearer {}", self.service_key).parse().unwrap(),
        );
        headers.insert(
            HeaderName::from_static("content-type"),
            "application/json".parse().unwrap(),
        );
        headers
    }

    fn storage_headers(&self) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            HeaderName::from_static("apikey"),
            self.anon_key.parse().unwrap(),
        );
        headers.insert(
            HeaderName::from_static("authorization"),
            format!("Bearer {}", self.service_key).parse().unwrap(),
        );
        headers
    }

    pub async fn upsert_profile(&self, user_id: &str, email: &str, full_name: &str) -> Result<Value, String> {
        let url = format!(
            "{}/rest/v1/profiles?on_conflict=user_id",
            self.base_url
        );

        let body = serde_json::json!({
            "user_id": user_id,
            "email": email,
            "full_name": full_name,
            "role": "patient"
        });

        let resp = self.client
            .post(&url)
            .headers(self.auth_headers())
            .header("Prefer", "resolution=merge-failed-rows,return=representation")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Profile upsert failed: {}", text));
        }

        let data: Value = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
        Ok(data)
    }

    pub async fn get_profile_by_user_id(&self, user_id: &str) -> Result<Option<Value>, String> {
        let url = format!(
            "{}/rest/v1/profiles?user_id=eq.{}&select=*",
            self.base_url, user_id
        );

        let resp = self.client
            .get(&url)
            .headers(self.auth_headers())
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Profile fetch failed: {}", resp.status()));
        }

        let data: Vec<Value> = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
        Ok(data.into_iter().next())
    }

    pub async fn get_records(&self, patient_id: &str) -> Result<Vec<Value>, String> {
        let url = format!(
            "{}/rest/v1/medical_records?patient_id=eq.{}&order=date.desc&limit=50",
            self.base_url, patient_id
        );

        let resp = self.client
            .get(&url)
            .headers(self.auth_headers())
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Records fetch failed: {}", resp.status()));
        }

        let data: Vec<Value> = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
        Ok(data)
    }

    pub async fn upload_file(&self, bucket: &str, path: &str, data: Vec<u8>, content_type: &str) -> Result<(), String> {
        let url = format!(
            "{}/storage/v1/object/{}/{}",
            self.base_url, bucket, path
        );

        let resp = self.client
            .post(&url)
            .headers(self.storage_headers())
            .header("Content-Type", content_type)
            .body(data)
            .send()
            .await
            .map_err(|e| format!("Upload network error: {}", e))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Upload failed: {}", text));
        }

        Ok(())
    }

    pub async fn download_file(&self, bucket: &str, path: &str) -> Result<(Vec<u8>, String), String> {
        let url = format!(
            "{}/storage/v1/object/{}/{}",
            self.base_url, bucket, path
        );

        let resp = self.client
            .get(&url)
            .headers(self.storage_headers())
            .send()
            .await
            .map_err(|e| format!("Download network error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Download failed: status {}", resp.status()));
        }

        let content_type = resp
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("application/octet-stream")
            .to_string();

        let bytes = resp.bytes().await.map_err(|e| format!("Read error: {}", e))?;
        Ok((bytes.to_vec(), content_type))
    }

    pub async fn create_record(&self, patient_id: &str, provider_id: Option<&str>, record_type: &str, title: &str, description: &str, file_path: &str) -> Result<Value, String> {
        let url = format!("{}/rest/v1/medical_records", self.base_url);

        let mut body = serde_json::json!({
            "patient_id": patient_id,
            "record_type": record_type,
            "title": title,
            "description": description,
            "is_handwritten": true,
            "original_image_url": file_path,
            "is_approved": false,
            "date": chrono_now(),
        });

        if let Some(pid) = provider_id {
            body["provider_id"] = serde_json::json!(pid);
        }

        let resp = self.client
            .post(&url)
            .headers(self.auth_headers())
            .header("Prefer", "return=representation")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Create record network error: {}", e))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Create record failed: {}", text));
        }

        let data: Value = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
        Ok(data)
    }

    pub async fn create_timeline_event(&self, patient_id: &str, record_id: &str, event_type: &str, title: &str, description: &str) -> Result<(), String> {
        let url = format!("{}/rest/v1/timeline_events", self.base_url);

        let body = serde_json::json!({
            "patient_id": patient_id,
            "record_id": record_id,
            "event_type": event_type,
            "title": title,
            "description": description,
            "date": chrono_now(),
        });

        let resp = self.client
            .post(&url)
            .headers(self.auth_headers())
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Timeline network error: {}", e))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Timeline event failed: {}", text));
        }

        Ok(())
    }

    pub async fn create_audit_log(&self, user_id: &str, action: &str, resource: &str, resource_id: &str, details: &str) -> Result<(), String> {
        let url = format!("{}/rest/v1/audit_logs", self.base_url);

        let details_val: Value = serde_json::from_str(details).unwrap_or(serde_json::json!({}));

        let body = serde_json::json!({
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details_val,
        });

        let resp = self.client
            .post(&url)
            .headers(self.auth_headers())
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Audit log network error: {}", e))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Audit log failed: {}", text));
        }

        Ok(())
    }
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap();
    let secs = now.as_secs();
    // Simple ISO date without external crate
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let minutes = (time_secs % 3600) / 60;
    let seconds = time_secs % 60;

    // Days since epoch to year/month/day - rough calculation
    let mut y = 1970i64;
    let mut d = days as i64;
    loop {
        let days_in_year = if is_leap(y) { 366 } else { 365 };
        if d < days_in_year { break; }
        d -= days_in_year;
        y += 1;
    }
    let months_days = if is_leap(y) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut m = 1;
    for &md in &months_days {
        if d < md { break; }
        d -= md;
        m += 1;
    }
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, m, d + 1, hours, minutes, seconds)
}

fn is_leap(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}
