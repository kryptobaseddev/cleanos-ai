use serde_json::Value;

use crate::ai_client::AIAnalysis;
use crate::filesystem::FileInfo;

pub fn build_file_analysis_prompt(file_info: &FileInfo) -> String {
    let ext = file_info.extension.as_deref().unwrap_or("none");
    format!(
        "Analyze this file and respond with ONLY valid JSON \
         (no markdown, no code blocks):\n\
         File: {}\nPath: {}\nSize: {} bytes\n\
         Extension: {}\nIs Directory: {}\n\n\
         Respond with this exact JSON structure:\n\
         {{\"category\": \"<document|code|media|cache|\
         config|log|temp|other>\", \
         \"importance_score\": <0.0-1.0>, \
         \"recommendation\": \"<keep|review|delete>\", \
         \"safe_to_delete\": <true|false>, \
         \"reason\": \"<brief explanation>\"}}",
        file_info.name, file_info.path, file_info.size, ext, file_info.is_directory,
    )
}

pub fn parse_file_analysis(response: &str, file_path: &str) -> Result<AIAnalysis, String> {
    let parsed: Value =
        try_parse_json(response).map_err(|e| format!("Failed to parse AI response: {e}"))?;

    Ok(AIAnalysis {
        file_path: file_path.to_string(),
        category: parsed["category"].as_str().unwrap_or("other").to_string(),
        importance_score: parsed["importance_score"].as_f64().unwrap_or(0.5),
        recommendation: parsed["recommendation"]
            .as_str()
            .unwrap_or("review")
            .to_string(),
        safe_to_delete: parsed["safe_to_delete"].as_bool().unwrap_or(false),
        reason: parsed["reason"]
            .as_str()
            .unwrap_or("Unable to determine")
            .to_string(),
    })
}

pub fn build_recommendations_prompt(system_stats: &str) -> String {
    format!(
        "Based on these system statistics, provide cleanup \
         recommendations. Respond with ONLY valid JSON \
         (no markdown, no code blocks):\n{system_stats}\n\n\
         Respond with a JSON array of recommendations:\n\
         [{{\"category\": \"<category>\", \
         \"description\": \"<what to clean>\", \
         \"estimated_savings\": <bytes>, \
         \"risk_level\": \"<low|medium|high>\", \
         \"items\": [{{\"path\": \"<path>\", \
         \"size\": <bytes>, \"reason\": \"<why>\", \
         \"safe_to_delete\": <true|false>}}]}}]"
    )
}

pub fn parse_json_response<T: serde::de::DeserializeOwned>(response: &str) -> Result<T, String> {
    let cleaned = response
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();
    serde_json::from_str(cleaned).map_err(|e| format!("Failed to parse AI response: {e}"))
}

fn try_parse_json(text: &str) -> Result<Value, serde_json::Error> {
    serde_json::from_str(text).or_else(|_| {
        let cleaned = text
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();
        serde_json::from_str(cleaned)
    })
}
