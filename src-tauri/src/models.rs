/// Fetches available AI models from the OpenRouter public API.
///
/// Returns the raw JSON response as a string for the frontend to parse.
/// The endpoint is unauthenticated and requires no API key.
pub async fn fetch_openrouter_models() -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://openrouter.ai/api/v1/models")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "OpenRouter API returned status {}",
            response.status()
        ));
    }

    response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))
}
