import os, json
from typing import Tuple, List

try:
    from openai import OpenAI  # pip install openai
except Exception:
    OpenAI = None

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = """You are Mitra, a warm, practical career and opportunity coach inside the MeMetrics app.
Return concise, supportive, actionable replies.
Always respond in strict JSON with:
- reply: string
- suggestions: list of up to 4 strings.
"""


def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        raise RuntimeError("OPENAI_API_KEY not set or openai not installed")
    return OpenAI(api_key=api_key)


def generate_mitra_reply(message: str, user_id: str, region: str, dvi: int) -> Tuple[str, List[str]]:
    client = _client()
    user_context = f"User: {user_id} | Region: {region} | DVI: {dvi}."
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_context + " Message: " + message}
    ]
    try:
        resp = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        text = resp.choices[0].message.content or '{"reply":"(empty)","suggestions":["+50 plan"]}'
        data = json.loads(text)
        reply = data.get("reply", "Sorry, something went wrong.")
        suggestions = data.get("suggestions", ["+50 plan","Match opps"])
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]
        return reply, suggestions[:4]
    except Exception:
        return ("I couldn't reach my brain right now. Try again later.", ["+50 plan","Match opps","Resume tips"])
