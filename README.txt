# MeMetrics SuperApp v5.1

Fast, single-command setup for the Mitra experience: the FastAPI backend serves the glassmorphism SPA, exposes JSON APIs, and now streams Mitra coaching through OpenAI.

## Run it
1. scripts\run_backend.bat
2. Head to http://127.0.0.1:8000

### Optional: enable Mitra AI
Set an OpenAI API key before launching:
`
setx OPENAI_API_KEY "sk-..."
`
You can also override the model with OPENAI_MODEL (defaults to gpt-4o-mini).

## Highlights
- Hash-based navigation with top + bottom nav bars, investor mode toggle, and animated fintech background.
- Feed, profile, opportunities, banking, investor cockpit, and Mitra live panel all pull from the same backend APIs.
- Mitra panel fetches curated prompts and chats through /api/mitra/chat, falling back gracefully if the AI is offline.
- Designed for zero build steps: edit the files, restart the backend, refresh the browser.

Enjoy building with Mitra.
