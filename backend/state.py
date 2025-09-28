from __future__ import annotations

from datetime import datetime, timezone
from itertools import count
from typing import Any, Dict, List


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_post_id = count(1000)
_achievement_id = count(2000)
_notification_id = count(3000)


STATE: Dict[str, Any] = {
    "user": {
        "user_id": "mitra",
        "name": "Mitra Explorer",
        "role": "Student",
        "region": "Global",
        "dvi": 768,
        "band": "Catalyst",
        "headline": "Designing inclusion-ready fintech experiences.",
        "about": "Mitra pairs lived experience with AI to surface the hidden potential in underrepresented builders.",
        "skills": ["AI Ethics", "Financial Inclusion", "Product Strategy", "Community Leadership"],
        "achievements": [
            {"id": next(_achievement_id), "title": "EU Inclusion Fellowship", "year": 2024},
            {"id": next(_achievement_id), "title": "Launched community micro-loan pilot", "year": 2023},
            {"id": next(_achievement_id), "title": "Data storytelling bootcamp mentor", "year": 2022},
        ],
    },
    "manifesto": {
        "hero": {
            "title": "MeMetrics is your proof. Mitra is your guardian.",
            "summary": (
                "The Development Value Index (DVI) translates lived resilience into the language banks, "
                "sponsors, and visas understand. Every milestone you capture with MeMetrics is a "
                "receipt that you exist, that you deliver, and that you deserve to unlock the next door."
            ),
            "tags": ["Verified credibility", "AI mentorship", "DVI-powered banking"],
        },
        "pillars": [
            {
                "title": "Identity, verified",
                "body": "Video + document verification protects the community and accelerates trust in every region.",
            },
            {
                "title": "Banking inclusion",
                "body": "Track balances, payments, and micro-loans even if traditional institutions said no.",
            },
            {
                "title": "Mitra beside you",
                "body": "Get coaching, accountability, and tailored opportunities every time you check in.",
            },
        ],
        "voices": [
            {
                "user_id": "amira",
                "quote": "My DVI hit 780 after Mitra guided me into a cybersecurity scholarship. I now mentor others here.",
            },
            {
                "user_id": "leo",
                "quote": "The banking cockpit gave me my first official account. Sponsors finally saw my real track record.",
            },
            {
                "user_id": "sofia",
                "quote": "I was told 'you do not exist.' Now I walk into interviews with a DVI-backed story.",
            },
        ],
    },
    "mitra": {
        "tips": [
            "Log evidence weekly so your DVI momentum never stalls.",
            "Pair each milestone with proof — docs, video, and sponsor notes.",
            "Keep your financial story tidy: repayments on time unlock new credit tiers.",
        ],
        "prompts": [
            "Draft a sponsor update for this week",
            "Design a 30-day banking credibility sprint",
            "Map scholarships aligned with my DVI band",
            "Prep my documents for a cross-border visa",
        ],
    },
    "feed": [
        {
            "id": next(_post_id),
            "user_id": "fatima",
            "display_name": "Fatima Idrissi",
            "dvi": 742,
            "text": "Just completed the fintech bootcamp and accepted an offer at a digital bank! Mitra kept me accountable.",
            "created_at": _utc_iso(),
            "like_count": 42,
        },
        {
            "id": next(_post_id),
            "user_id": "youssef",
            "display_name": "Youssef El-Hassan",
            "dvi": 701,
            "text": "Published v2 of my Android budgeting app. Looking for beta sponsors this quarter.",
            "created_at": _utc_iso(),
            "like_count": 27,
        },
        {
            "id": next(_post_id),
            "user_id": "li",
            "display_name": "Li Wei",
            "dvi": 715,
            "text": "IELTS 8.0 secured! Next up: scholarships across the EU - open to referrals.",
            "created_at": _utc_iso(),
            "like_count": 35,
        },
    ],
    "opportunities": [
        {
            "id": "opp-1",
            "title": "Scholarship Pool - Data Science",
            "org": "Future of Finance Lab",
            "type": "Scholarship",
            "summary": "12-week applied AI residency for inclusion-focused builders.",
            "tags": ["AI", "Scholarship", "Remote"],
            "deadline": "2025-11-15",
            "link": "https://example.com/opportunity/data-science",
        },
        {
            "id": "opp-2",
            "title": "Micro-loan Tranche - EU Students",
            "org": "Mitra Capital",
            "type": "Micro-loan",
            "summary": "EUR 5k - 25k flexible micro-loans for high DVI students scaling their impact.",
            "tags": ["Micro-loan", "Europe", "Finance"],
            "deadline": "2025-12-01",
            "link": "https://example.com/opportunity/microloan",
        },
        {
            "id": "opp-3",
            "title": "Mentorship Grants - Cybersecurity",
            "org": "Parity Guild",
            "type": "Grant",
            "summary": "Funded mentorship for emerging security researchers in the global south.",
            "tags": ["Mentorship", "Security", "Grant"],
            "deadline": "2026-01-10",
            "link": "https://example.com/opportunity/mentorship",
        },
    ],
    "banking": {
        "balance": 12850.72,
        "income": 4150.00,
        "spend": 1890.43,
        "iban_like": "ME00MTRA0001",
        "categories": {
            "Housing": 640.0,
            "Education": 320.5,
            "Community": 220.75,
            "Operations": 708.18,
        },
        "transactions": [
            {
                "id": "txn-1",
                "counterparty": "Impact Fellowship",
                "reference": "Scholarship disbursement",
                "amount": 2200.00,
                "timestamp": _utc_iso(),
            },
            {
                "id": "txn-2",
                "counterparty": "City Housing Co-op",
                "reference": "Housing",
                "amount": -640.00,
                "timestamp": _utc_iso(),
            },
            {
                "id": "txn-3",
                "counterparty": "Learning Partner",
                "reference": "Education stipend",
                "amount": -320.50,
                "timestamp": _utc_iso(),
            },
            {
                "id": "txn-4",
                "counterparty": "Community Kitchen",
                "reference": "Mutual aid",
                "amount": -220.75,
                "timestamp": _utc_iso(),
            },
            {
                "id": "txn-5",
                "counterparty": "Inclusive Bank",
                "reference": "Salary",
                "amount": 1950.00,
                "timestamp": _utc_iso(),
            },
        ],
    },
    "notifications": [
        {
            "id": next(_notification_id),
            "title": "Sponsor follow-up",
            "body": "Tech Angels requested your updated DVI summary.",
            "created_at": _utc_iso(),
        },
        {
            "id": next(_notification_id),
            "title": "Banking milestone",
            "body": "Three on-time repayments logged. Eligible for higher limit.",
            "created_at": _utc_iso(),
        },
    ],
    "investor": {
        "aum": 120000.0,
        "active_sponsorships": 5,
        "roi": 7.2,
        "funds": [
            {
                "title": "Scholarship Pool - Data Science",
                "target": 10000,
                "funded": 6000,
                "focus": "STEM scholarships",
            },
            {
                "title": "Micro-loan Tranche - EU Students",
                "target": 25000,
                "funded": 8750,
                "focus": "Micro-loans",
            },
            {
                "title": "Mentorship Grants - Cybersecurity",
                "target": 5000,
                "funded": 4500,
                "focus": "Mentorship grants",
            },
        ],
    },
}


def get_manifesto() -> Dict[str, Any]:
    return STATE["manifesto"]


def get_user() -> Dict[str, Any]:
    return STATE["user"]


def get_feed() -> List[Dict[str, Any]]:
    return STATE["feed"]


def add_post(user_id: str, text: str) -> Dict[str, Any]:
    post = {
        "id": next(_post_id),
        "user_id": user_id,
        "display_name": get_user().get("name", "Community member"),
        "dvi": get_user().get("dvi", 0),
        "text": text,
        "created_at": _utc_iso(),
        "like_count": 0,
    }
    STATE["feed"].insert(0, post)
    return post


def get_achievements() -> List[Dict[str, Any]]:
    return get_user().get("achievements", [])


def add_achievement(title: str, year: int) -> Dict[str, Any]:
    record = {"id": next(_achievement_id), "title": title, "year": year}
    get_user().setdefault("achievements", []).insert(0, record)
    return record


def get_banking() -> Dict[str, Any]:
    return STATE["banking"]


def get_opportunities() -> List[Dict[str, Any]]:
    return STATE["opportunities"]


def get_notifications() -> List[Dict[str, Any]]:
    return STATE["notifications"]


def get_mitra_tips() -> Dict[str, List[str]]:
    return {
        "tips": STATE["mitra"]["tips"],
        "prompts": STATE["mitra"].get("prompts", []),
    }


def get_investor_dashboard() -> Dict[str, Any]:
    return STATE["investor"]


__all__ = [
    "get_manifesto",
    "get_user",
    "get_feed",
    "add_post",
    "get_achievements",
    "add_achievement",
    "get_banking",
    "get_opportunities",
    "get_notifications",
    "get_mitra_tips",
    "get_investor_dashboard",
]


