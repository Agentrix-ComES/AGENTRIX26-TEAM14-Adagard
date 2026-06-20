"""In-memory state for the 12h demo (swap for Redis/DB later). Owner: Person A."""
SESSIONS: dict = {}        # session_id -> GraphState dict
VERIFICATIONS: dict = {}   # verification_id -> packet dict
