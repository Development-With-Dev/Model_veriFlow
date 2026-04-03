"""
Tier Engine — maps an adjusted risk score to an action tier.

    score > 0.75  → ALLOW    (silent, no friction)
    0.45 – 0.75   → STEP_UP  (trigger OTP modal)
    < 0.45        → BLOCK    (lock session, fire alert)
"""

ALLOW   = "ALLOW"
STEP_UP = "STEP_UP"
BLOCK   = "BLOCK"


def resolve_tier(score: float) -> str:
    """Return the action tier for a given adjusted score."""
    if score > 0.75:
        return ALLOW
    elif score >= 0.45:
        return STEP_UP
    else:
        return BLOCK
