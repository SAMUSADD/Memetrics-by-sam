from __future__ import annotations

from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from .config import settings
from .services.mitra_llm import generate_mitra_reply
from .state import (
    add_achievement,
    add_post,
    get_achievements,
    get_banking,
    get_feed,
    get_investor_dashboard,
    get_manifesto,
    get_mitra_tips,
    get_notifications,
    get_opportunities,
    get_user,
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
ASSETS_DIR = FRONTEND_DIR / "assets"
INDEX_FILE = FRONTEND_DIR / "index.html"

app = FastAPI(title="MeMetrics SuperApp v5", version="5.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


TIERS = [
    (0, 300, "Foundation", "Focus on verifying identity, uploading evidence, and logging consistent progress so your DVI climbs steadily."),
    (300, 600, "Momentum", "Layer public milestones with proof, request recommendations, and keep your repayment streak clean for higher credit tiers."),
    (600, 901, "Catalyst", "Expand across regions, publish measurable impact, and activate cross-border sponsors to push into the 800s."),
]

KEYWORD_HINTS = {
    "loan": "Draft a repayments plan and share a proof-of-income feed post.",
    "sponsor": "Send a sponsor-ready update that highlights DVI change + social proof.",
    "resume": "Export a resume snippet from your achievements and attach metrics.",
    "visa": "Collect verified ID, financial statements, and language certificates into one folder.",
    "bank": "Review cashflow, repay micro-loans, and request a Mitra credit boost.",
}


def _rule_based_mitra(message: str, user: dict) -> tuple[str, list[str]]:
    lower = message.lower()
    dvi = int(user.get("dvi") or 0)
    region = user.get("region") or "Global"
    user_id = user.get("user_id") or "explorer"

    tier_label = "Catalyst"
    guidance = "You are already operating at catalyst tier. Keep mentoring others and documenting your influence."
    next_cap = None
    for low, high, name, guidance_text in TIERS:
        if dvi < high:
            tier_label = name
            guidance = guidance_text
            next_cap = high if high <= 900 else None
            break

    progress_hint = "Keep stacking weekly proof to unlock more achievements."
    if next_cap and next_cap > dvi:
        remaining = max(next_cap - dvi, 0)
        progress_hint = f"Only {remaining} DVI more to unlock the next achievement slot."
    elif dvi >= 900:
        progress_hint = "You are at the top of the scale. Focus on mentorship and global sponsorships."

    reply = (
        f"Hey {user_id}, your DVI is {dvi} which places you in the {tier_label} band for {region}. "
        f"{guidance} Focus on measurable outcomes, attach proof, and update your feed so Mitra can advocate for you."
    )

    suggestions: List[str] = []
    for keyword, hint in KEYWORD_HINTS.items():
        if keyword in lower:
            suggestions.append(hint)
    if not suggestions:
        if tier_label == "Foundation":
            suggestions.extend([
                "Complete ID verification and upload proof-of-work clips.",
                "Log a new milestone with metrics and supporting media.",
            ])
        elif tier_label == "Momentum":
            suggestions.extend([
                "Post a sponsor-ready update highlighting DVI growth.",
                "Request a mentor testimonial to boost credibility.",
            ])
        else:
            suggestions.extend([
                "Share your DVI dashboard with an investor for a funding call.",
                "Bundle repayments plus community impact into a sponsor brief.",
            ])
    suggestions.append(progress_hint)
    return reply, suggestions[:4]


class LoginRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class PostRequest(BaseModel):
    user_id: str = Field(..., min_length=2)
    text: str = Field(..., min_length=2, max_length=1600)


class AchievementRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    year: int = Field(..., ge=1900, le=2100)


class MitraChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail="Frontend bundle not found")
    return FileResponse(INDEX_FILE)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/auth/login")
async def login(payload: LoginRequest) -> dict:
    user = get_user().copy()
    user["name"] = payload.name.strip()
    user["user_id"] = payload.name.strip().lower().replace(" ", "-") or "guest"
    return {"user": user}


@app.get("/api/manifesto")
async def manifesto() -> dict:
    return get_manifesto()


@app.get("/api/feed")
async def feed() -> dict:
    return {"items": get_feed()}


@app.post("/api/feed")
async def create_post(payload: PostRequest) -> dict:
    post = add_post(payload.user_id, payload.text)
    return {"post": post, "ok": True}


@app.get("/api/profile")
async def profile() -> dict:
    user = get_user()
    return {
        "user": {
            "user_id": user.get("user_id"),
            "name": user.get("name"),
            "role": user.get("role"),
            "region": user.get("region", "Global"),
            "dvi": user.get("dvi"),
            "band": user.get("band"),
            "headline": user.get("headline"),
            "about": user.get("about"),
            "skills": user.get("skills", []),
        },
        "achievements": get_achievements(),
        "notifications": get_notifications(),
    }


@app.post("/api/profile/achievements")
async def profile_achievement(payload: AchievementRequest) -> dict:
    record = add_achievement(payload.title, payload.year)
    return {"achievement": record, "ok": True}


@app.get("/api/opportunities")
async def opportunities() -> dict:
    return {"items": get_opportunities()}


@app.get("/api/banking")
async def banking() -> dict:
    return get_banking()


@app.get("/api/investor")
async def investor() -> dict:
    return get_investor_dashboard()


@app.get("/api/mitra/tips")
async def mitra_tips() -> dict:
    return get_mitra_tips()


@app.post("/api/mitra/chat")
async def mitra_chat(payload: MitraChatRequest) -> dict:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user = get_user()
    dvi = int(user.get("dvi") or 0)
    region = user.get("region", "Global")
    user_id = user.get("user_id") or "explorer"

    reply = ""
    suggestions: List[str] = []
    source = "rule"
    error_detail = None

    if settings.openai_api_key:
        try:
            reply, suggestions = await run_in_threadpool(
                generate_mitra_reply,
                message,
                user_id,
                region,
                dvi,
            )
            source = "openai"
        except RuntimeError:
            source = "fallback"
        except Exception as exc:  # pragma: no cover - network path
            source = "error"
            error_detail = str(exc)
            reply = ""
            suggestions = []

    if not reply:
        reply, suggestions = _rule_based_mitra(message, user)

    payload = {"reply": reply, "suggestions": suggestions, "source": source}
    if error_detail:
        payload["detail"] = error_detail
    return payload


@app.get("/{path:path}", response_class=HTMLResponse)
async def spa_router(path: str) -> HTMLResponse:
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Endpoint not found")
    if "." in Path(path).name:
        raise HTTPException(status_code=404, detail="Asset not found")
    if INDEX_FILE.exists():
        return FileResponse(INDEX_FILE)
    raise HTTPException(status_code=404, detail="Frontend bundle not found")

