"""
Explainer — human-readable reasons for risk decisions.

Takes a current feature vector and a baseline, finds the top-3 features
with the largest deviation, and maps each to a plain-English label.

Returns: [{ signal, delta_pct, label }, ...]
"""

from typing import Dict, List

# ── Feature key → plain-English label ────────────────────────────────────
FEATURE_LABELS: Dict[str, str] = {
    # Keystroke features
    'hold_time_mean':        'Key-press duration changed',
    'hold_time_std':         'Key-hold variability shifted',
    'hold_time_median':      'Median key-hold time changed',
    'flight_time_mean':      'Typing rhythm changed',
    'flight_time_std':       'Typing timing inconsistency',
    'flight_time_median':    'Median inter-key time shifted',
    'typing_speed_wpm':      'Typing speed changed',
    'typing_speed_cpm':      'Characters-per-minute shifted',
    'rhythm_consistency':    'Typing cadence unusual',
    'burst_ratio':           'Burst-typing pattern changed',
    'pause_ratio':           'Pause frequency changed',
    'avg_pause_duration':    'Average pause length changed',
    'speed_variance':        'Typing speed became erratic',
    'speed_trend':           'Typing is speeding up / slowing down',
    'digraph_consistency':   'Two-key combo timing shifted',
    'hold_time_cv':          'Key-hold regularity changed',
    'flight_time_cv':        'Inter-key regularity changed',
    'pressure_consistency':  'Key-press pressure changed',

    # Mouse features
    'velocity_mean':              'Mouse movement unusual',
    'velocity_std':               'Mouse speed variability changed',
    'velocity_median':            'Median mouse speed shifted',
    'acceleration_mean':          'Mouse acceleration unusual',
    'acceleration_std':           'Mouse acceleration variability changed',
    'movement_efficiency':        'Mouse path efficiency changed',
    'curvature_mean':             'Mouse curvature changed',
    'curvature_std':              'Mouse curvature variability shifted',
    'avg_direction_change':       'Mouse direction-change pattern shifted',
    'direction_change_variance':  'Mouse direction variability changed',
    'click_duration_mean':        'Click duration changed',
    'click_duration_std':         'Click timing variability shifted',
    'left_click_ratio':           'Left-click usage changed',
    'right_click_ratio':          'Right-click usage changed',
    'inter_click_mean':           'Time between clicks changed',
    'inter_click_std':            'Click-interval variability shifted',
    'dwell_time_mean':            'Hover dwell time changed',
    'movement_area':              'Screen coverage area changed',
    'movement_centrality':        'Cursor centre-of-mass shifted',
    'velocity_smoothness':        'Mouse smoothness changed',

    # Shorthand aliases the caller might use
    'keystroke_flight_time':      'Typing rhythm changed',
    'mouse_velocity_var':         'Mouse movement unusual',
    'hour_of_day':                'Unusual login hour',

    # Touch features
    'touch_ms_mean':              'Touch duration changed',
    'swipe_px_per_sec_mean':      'Swipe speed changed',
    'pressure_mean':              'Touch pressure changed',
}


def explain(current: Dict[str, float],
            baseline: Dict[str, float],
            top_n: int = 3) -> List[Dict]:
    """
    Compare *current* feature vector against *baseline*, return the
    top-N signals sorted by absolute percentage deviation.

    Args:
        current  – dict of feature_name → float (latest observation)
        baseline – dict of feature_name → float (user's calibrated mean)
        top_n    – how many reasons to return (default 3)

    Returns:
        [
          { "signal": "flight_time_mean",
            "delta_pct": -34.2,
            "label": "Typing rhythm changed" },
          ...
        ]
    """
    deltas = []

    for key, cur_val in current.items():
        base_val = baseline.get(key)
        if base_val is None:
            continue

        # percentage change relative to baseline (guard /0)
        if base_val != 0:
            pct = ((cur_val - base_val) / abs(base_val)) * 100.0
        elif cur_val != 0:
            pct = 100.0
        else:
            continue

        deltas.append({
            'signal':    key,
            'delta_pct': round(pct, 2),
            'label':     FEATURE_LABELS.get(key, key.replace('_', ' ').title()),
        })

    # Sort by largest absolute deviation
    deltas.sort(key=lambda d: abs(d['delta_pct']), reverse=True)

    return deltas[:top_n]
