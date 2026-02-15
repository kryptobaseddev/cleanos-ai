//! Multi-provider AI client for file analysis and cleanup recommendations.
//!
//! Supports OpenAI, Google Gemini, Anthropic Claude, and Moonshot Kimi.
//! Each provider has its own request/response format handled transparently.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::ai_prompts;
use crate::filesystem::FileInfo;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIAnalysis {
    pub file_path: String,
    pub category: String,
    pub importance_score: f64,
    pub recommendation: String,
    pub safe_to_delete: bool,
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CleanupRecommendation {
    pub category: String,
    pub description: String,
    pub estimated_savings: u64,
    pub risk_level: String,
    pub items: Vec<CleanupItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CleanupItem {
    pub path: String,
    pub size: u64,
    pub reason: String,
    pub safe_to_delete: bool,
}

pub struct AIClient {
    client: Client,
    provider: String,
    api_key: String,
    model: String,
    base_url: String,
}

impl AIClient {
    pub fn new(provider: &str, api_key: &str, model: &str) -> Self {
        let base_url = match provider {
            "openai" => "https://api.openai.com/v1/chat/completions".to_string(),
            "gemini" => format!(
                "https://generativelanguage.googleapis.com\
                 /v1beta/models/{model}:generateContent"
            ),
            "claude" => "https://api.anthropic.com/v1/messages".to_string(),
            "kimi" => "https://api.moonshot.cn/v1/chat/completions".to_string(),
            _ => "https://api.openai.com/v1/chat/completions".to_string(),
        };

        AIClient {
            client: Client::new(),
            provider: provider.to_string(),
            api_key: api_key.to_string(),
            model: model.to_string(),
            base_url,
        }
    }

    /// Send a freeform chat message and return the AI response.
    pub async fn chat(&self, message: &str) -> Result<String, String> {
        self.send_message(message).await
    }

    pub async fn test_connection(&self) -> Result<bool, String> {
        let prompt = "Reply with exactly: OK";
        let response = self.send_message(prompt).await?;
        Ok(!response.is_empty())
    }

    pub async fn analyze_file(&self, file_info: &FileInfo) -> Result<AIAnalysis, String> {
        let prompt = ai_prompts::build_file_analysis_prompt(file_info);
        let response = self.send_message(&prompt).await?;
        ai_prompts::parse_file_analysis(&response, &file_info.path)
    }

    pub async fn get_recommendations(
        &self,
        system_stats: &str,
    ) -> Result<Vec<CleanupRecommendation>, String> {
        let prompt = ai_prompts::build_recommendations_prompt(system_stats);
        let response = self.send_message(&prompt).await?;
        ai_prompts::parse_json_response(&response)
    }

    async fn send_message(&self, prompt: &str) -> Result<String, String> {
        match self.provider.as_str() {
            "openai" | "kimi" => self.send_openai_compatible(prompt).await,
            "gemini" => self.send_gemini(prompt).await,
            "claude" => self.send_claude(prompt).await,
            _ => Err(format!("Unsupported provider: {}", self.provider)),
        }
    }

    async fn send_openai_compatible(&self, prompt: &str) -> Result<String, String> {
        let body = json!({
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
        });

        let resp = self
            .client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {e}"))?;

        let json = handle_response(resp).await?;
        json["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "No content in response".to_string())
    }

    async fn send_gemini(&self, prompt: &str) -> Result<String, String> {
        let url = format!("{}?key={}", self.base_url, self.api_key);
        let body = json!({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3}
        });

        let resp = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {e}"))?;

        let json = handle_response(resp).await?;
        let path = &json["candidates"][0]["content"];
        path["parts"][0]["text"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "No content in response".to_string())
    }

    async fn send_claude(&self, prompt: &str) -> Result<String, String> {
        let body = json!({
            "model": self.model,
            "max_tokens": 4096,
            "messages": [
                {"role": "user", "content": prompt}
            ],
        });

        let resp = self
            .client
            .post(&self.base_url)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {e}"))?;

        let json = handle_response(resp).await?;
        json["content"][0]["text"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "No content in response".to_string())
    }
}

async fn handle_response(response: reqwest::Response) -> Result<Value, String> {
    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API error ({status}): {text}"));
    }
    response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {e}"))
}
