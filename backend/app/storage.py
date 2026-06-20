"""Filesystem location for generated artefacts (pre-filled forms). Owner: Person A.

Served at /files (mounted in main.py) so the URLs in plan.forms[].url resolve. Path is
absolute and anchored to the backend package so it works regardless of CWD.
"""
import os

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
FILES_DIR = os.getenv("FILES_DIR", os.path.join(_BASE, "files"))

os.makedirs(FILES_DIR, exist_ok=True)
