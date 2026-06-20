"""Gemini free-tier helper shared by agents. Owner: Person A."""
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
_model = genai.GenerativeModel(os.getenv("LLM_MODEL", "gemini-1.5-flash"))

def ask(prompt: str) -> str:
    """Single-shot LLM call. Keep prompts small to respect free-tier limits."""
    resp = _model.generate_content(prompt)
    return (resp.text or "").strip()
