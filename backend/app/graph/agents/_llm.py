"""Gemini free-tier helper shared by agents. Owner: Person A.

Resilient by design: the agent graph must keep working even when the API key is
missing, the free-tier quota is exhausted, or the network is down. Every call is
wrapped — on any failure ``ask`` returns ``""`` and callers fall back to the static
knowledge base (see ``app.graph.knowledge``).
"""
import os
from functools import lru_cache

import google.generativeai as genai


@lru_cache(maxsize=1)
def _model():
    """Build the model lazily so .env (loaded in main.py / vectorizer) is in effect."""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    return genai.GenerativeModel(os.getenv("LLM_MODEL", "gemini-1.5-flash"))


def available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def ask(prompt: str) -> str:
    """Single-shot LLM call. Returns "" on any error so the graph never 500s.

    Keep prompts small to respect free-tier limits.
    """
    if not available():
        return ""
    try:
        resp = _model().generate_content(prompt)
        return (resp.text or "").strip()
    except Exception as exc:  # quota, network, safety blocks, bad key — all non-fatal
        print(f"[_llm] generate_content failed: {exc}")
        return ""
