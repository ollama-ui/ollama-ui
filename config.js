// Optional site-wide defaults for ollama-ui.
// Users can override the credentials mode from the settings dialog.
window.OLLAMA_UI_CONFIG = {
  // Fetch credentials mode: "omit", "same-origin", or "include".
  // Use "include" when Ollama is behind an authenticating reverse proxy.
  credentialsMode: "include",
};
