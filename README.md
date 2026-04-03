<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow-2.13-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-2.3-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-Real--time-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">🛡️ VeriFlow — Continuous Behavioral Authentication System</h1>

<p align="center">
  <strong>An advanced, real-time behavioral biometrics platform that continuously verifies user identity through keystroke dynamics, mouse movement patterns, and touch gestures — powered by deep learning, on-device privacy processing, and adaptive drift detection.</strong>
</p>

<p align="center">
  <em>No passwords. No tokens. Just you.</em>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Privacy & Efficiency Layer](#-privacy--efficiency-layer)
- [Feature Extraction Engine](#-feature-extraction-engine)
- [Behavioral Drift Detection](#-behavioral-drift-detection)
- [Explainable AI (XAI)](#-explainable-ai-xai)
- [Trust Ring & Tier Engine](#-trust-ring--tier-engine)
- [Admin Dashboard](#-admin-dashboard)
- [Real-Time WebSocket Architecture](#-real-time-websocket-architecture)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Demo Mode](#-demo-mode)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**VeriFlow** is a production-grade continuous authentication system that moves beyond traditional password-based security. Instead of authenticating users once at login, VeriFlow continuously monitors behavioral biometrics in real-time — analyzing *how* a user types, moves their mouse, and interacts with touch surfaces — to build a unique behavioral fingerprint.

If a session is hijacked, a device is stolen, or an unauthorized user gains access after initial login, VeriFlow detects the behavioral anomaly within seconds and triggers an escalation response (step-up authentication or session lock).

### Why VeriFlow?

| Traditional Auth | VeriFlow Continuous Auth |
|---|---|
| One-time password check | Continuous identity verification |
| Vulnerable to session hijacking | Detects unauthorized takeover in real-time |
| Static credentials can be stolen | Behavioral patterns can't be replicated |
| No post-login protection | 24/7 behavioral monitoring |
| Binary pass/fail | Graduated trust scoring (ALLOW → STEP_UP → BLOCK) |

---

## 🚀 Key Features

### 🧠 Multi-Modal Behavioral Biometrics
- **Keystroke Dynamics** — Hold time, flight time, typing speed (WPM/CPM), rhythm consistency, burst/pause ratios, digraph timing, pressure consistency
- **Mouse Dynamics** — Velocity, acceleration, jerk, curvature, movement efficiency, click patterns, dwell time, direction changes, trajectory analysis
- **Touch Biometrics** — Touch duration, swipe speed (px/sec), touch pressure, gesture patterns

### 🤖 Deep Learning Authentication Engine
- **GRU Sequence Model** — Recurrent neural network for temporal behavioral pattern recognition
- **Autoencoder Anomaly Detector** — Unsupervised anomaly detection via reconstruction error
- **One-Class SVM** — Support vector boundary around legitimate behavior distribution
- **Isolation Forest** — Ensemble anomaly detection for outlier identification
- **KNN Classifier** — Instance-based neighbor comparison for real-time scoring
- **Passive-Aggressive Classifier** — Online learning for continuous model adaptation
- **Ensemble Scoring** — Weighted combination of all six models with configurable fusion

### 🛡️ Privacy & Efficiency Layer (On-Device Processing)
- **On-Device Feature Extraction** — Raw events never leave the browser; only aggregated statistical features are transmitted
- **Data Minimization** — Automatic stripping of raw keystroke/mouse/touch events before network transmission
- **Battery API Integration** — Automatic low-power mode at ≤20% battery (disengages on charge)
- **Adaptive Sampling** — Probabilistic event dropping (50% in low-battery mode) to reduce CPU usage
- **Intelligent Throttling** — Move events throttled from 20fps to 5fps in power-save mode
- **Adaptive Flush Intervals** — Network requests halved (5s → 10s) in low-battery mode

### 📊 Behavioral Drift Detection
- **Kolmogorov-Smirnov Test** — Full distribution comparison between current and baseline behavior
- **Mann-Whitney U Test** — Non-parametric median shift detection
- **Levene's Test** — Variance change detection across behavioral features
- **Cohen's d Effect Size** — Mean shift magnitude quantification
- **F-Test Variance Ratio** — Log-ratio analysis for symmetric variance comparison
- **Skewness & Kurtosis Analysis** — Distribution shape change detection
- **Weighted Feature Importance** — Per-feature drift weighting for keystroke and mouse signals
- **Automatic Retraining Trigger** — Model retraining when >50% of features exhibit significant drift

### 💡 Explainable AI (XAI)
- **Top-N Feature Attribution** — Identifies the top-3 features causing risk elevation
- **Human-Readable Labels** — 40+ feature-to-label mappings (e.g., "Typing rhythm changed", "Mouse path efficiency changed")
- **Percentage Deviation** — Shows exact percentage change from baseline for each anomalous feature
- **Real-Time Explainability Card** — Live dashboard widget showing *why* the score changed

### 🎯 Trust Ring & Tier Engine
- **Animated SVG Trust Ring** — Visual representation of real-time authentication score (0-100%)
- **Three-Tier Decision Engine**:
  - `ALLOW` (score > 0.75) — Silent pass, no friction
  - `STEP_UP` (0.45 – 0.75) — Trigger OTP/challenge modal
  - `BLOCK` (< 0.45) — Lock session, fire security alert
- **Color-Coded Status** — Green (authenticated) → Amber (monitoring) → Red (alert)

### 📡 Real-Time WebSocket Architecture
- **Flask-SocketIO** — Bidirectional real-time communication
- **Session-Based Rooms** — Each authenticated session joins a private WebSocket room
- **Live Auth Scoring** — Sub-second authentication result delivery
- **Security Alert Broadcasting** — Instant anomaly notifications to connected clients
- **Drift Analysis Events** — Real-time behavioral drift updates

### 🖥️ Admin Dashboard
- **Flagged Session Review** — Review sessions with anomalous behavior
- **Session Timeline Visualization** — Score progression over time with sparkline charts
- **Anomaly Reason Display** — Shows which behavioral features triggered the flag
- **Session Actions** — Approve, block, or force re-auth on flagged sessions
- **Real-Time Statistics** — Active users, session count, anomaly rate

### 🔐 Enterprise Security
- **bcrypt Password Hashing** — 12-round (dev) / 14-round (prod) password hashing
- **JWT Session Tokens** — 24-hour access tokens, 30-day refresh tokens
- **Account Lockout** — 5 failed attempts → 15-minute lockout
- **Session Management** — Automatic timeout, manual invalidation, activity tracking
- **CORS Protection** — Configurable cross-origin request policies
- **Input Validation** — Server-side validation on all API endpoints

### 🎨 Modern UI/UX
- **Dark Theme** — Premium glassmorphism design with gradient accents
- **Responsive Layout** — Sidebar navigation, mobile-adaptive views
- **Micro-Animations** — Smooth transitions, floating elements, glow effects
- **Real-Time Charts** — Chart.js integration for behavior monitoring, drift radar, scatter patterns
- **Notification System** — Dropdown alerts with read/unread tracking
- **Keyboard Shortcuts** — `Ctrl+Shift+D/S/A/T` for quick navigation

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ Keystroke     │  │ Mouse        │  │ Touch                  ││
│  │ Collector     │  │ Collector    │  │ Collector              ││
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘│
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              🛡️ Privacy & Efficiency Layer                │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐ │  │
│  │  │ On-Device   │ │ Data         │ │ Battery-Aware     │ │  │
│  │  │ Feature     │ │ Minimization │ │ Adaptive          │ │  │
│  │  │ Extraction  │ │ (Strip Raw)  │ │ Sampling          │ │  │
│  │  └─────────────┘ └──────────────┘ └───────────────────┘ │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │  Features Only (no raw data)     │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │         WebSocket (Socket.IO) + REST API                  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK SERVER (Backend)                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ Auth &       │  │ Feature      │  │ Behavioral Drift       ││
│  │ Session      │  │ Extractor    │  │ Detector               ││
│  │ Manager      │  │ (38 feats)   │  │ (KS/MW/Levene tests)  ││
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘│
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ML Ensemble Authentication                   │  │
│  │  ┌─────┐ ┌──────────┐ ┌─────────┐ ┌────┐ ┌───┐ ┌────┐  │  │
│  │  │ GRU │ │Autoencoder│ │   SVM   │ │ IF │ │KNN│ │ PA │  │  │
│  │  └─────┘ └──────────┘ └─────────┘ └────┘ └───┘ └────┘  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │  Tier Engine (ALLOW / STEP_UP / BLOCK)                    │  │
│  │  Explainer  (Top-3 feature attribution)                   │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │              SQLite Database                              │  │
│  │  users | sessions | behavioral_data | auth_events | models│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10+** | Core runtime |
| **Flask 2.3** | Web framework & REST API |
| **Flask-SocketIO 5.3** | Real-time WebSocket communication |
| **TensorFlow 2.13** | Deep learning (GRU, Autoencoder) |
| **scikit-learn 1.3** | Classical ML (SVM, Isolation Forest, KNN, PA) |
| **NumPy / SciPy / Pandas** | Numerical computing & statistical tests |
| **bcrypt** | Password hashing |
| **PyJWT** | JSON Web Token authentication |
| **SQLite3** | Embedded database |
| **Eventlet** | Async WebSocket support |

### Frontend
| Technology | Purpose |
|---|---|
| **Vanilla JavaScript (ES6+)** | Client-side logic, no framework dependency |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Chart.js 3.9** | Data visualization (line, radar, scatter, time-series) |
| **CSS3** | Custom design system with CSS variables, glassmorphism |
| **Battery API** | Power-aware adaptive processing |
| **Performance API** | High-precision timestamps for biometric capture |

---

## 📁 Project Structure

```
Model_veriFlow/
├── app.py                          # Flask application factory & all API routes
├── config.py                       # Multi-environment configuration (Dev/Prod/Test)
├── requirements.txt                # Python dependencies
├── README.md                       # This file
│
├── models/
│   ├── behavioral_models.py        # 6 ML models (GRU, Autoencoder, SVM, IF, KNN, PA)
│   └── saved/                      # Persisted model weights & scalers
│
├── utils/
│   ├── feature_extractor.py        # 38-feature behavioral extractor (18 keystroke + 20 mouse)
│   ├── drift_detector.py           # Statistical drift detection (KS, Mann-Whitney, Levene)
│   ├── explainer.py                # XAI — top-N feature attribution with human labels
│   └── tier_engine.py              # ALLOW / STEP_UP / BLOCK decision engine
│
├── database/
│   ├── db_manager.py               # SQLite ORM — users, sessions, behavioral data, events
│   └── auth_system.db              # SQLite database file
│
├── templates/
│   ├── login.html                  # Login & registration page
│   ├── calib.html                  # Behavioral calibration page
│   ├── challenge.html              # Main dashboard & monitoring page
│   └── admin.html                  # Admin panel for flagged sessions
│
└── static/
    ├── css/
    │   └── styles.css              # Complete design system (3100+ lines)
    └── js/
        ├── login.js                # Authentication UI logic
        ├── calib.js                # Calibration workflow & data collection
        ├── challenge.js            # Dashboard, charts, real-time monitoring
        ├── admin.js                # Admin panel logic
        ├── privacy_layer.js        # On-device processing & battery management
        └── touch_collector.js      # Touch biometric signal collector
```

---

## 🧠 Machine Learning Pipeline

### 38-Feature Behavioral Fingerprint

VeriFlow extracts **38 engineered features** from raw behavioral signals:

#### Keystroke Features (18)

| # | Feature | Description |
|---|---|---|
| 1 | `hold_time_mean` | Average key press duration (ms) |
| 2 | `hold_time_std` | Standard deviation of hold times |
| 3 | `hold_time_median` | Median key press duration |
| 4 | `flight_time_mean` | Average time between successive key presses |
| 5 | `flight_time_std` | Variability in inter-key intervals |
| 6 | `flight_time_median` | Median inter-key interval |
| 7 | `typing_speed_wpm` | Words per minute |
| 8 | `typing_speed_cpm` | Characters per minute |
| 9 | `rhythm_consistency` | Inverse coefficient of variation of inter-key intervals |
| 10 | `burst_ratio` | Fraction of rapid keystroke sequences |
| 11 | `pause_ratio` | Fraction of long pauses between keys |
| 12 | `avg_pause_duration` | Mean duration of typing pauses (ms) |
| 13 | `speed_variance` | Variance of typing speed across sliding windows |
| 14 | `speed_trend` | Linear regression slope of speed over time |
| 15 | `digraph_consistency` | Consistency of two-key combination timings |
| 16 | `hold_time_cv` | Coefficient of variation for hold times |
| 17 | `flight_time_cv` | Coefficient of variation for flight times |
| 18 | `pressure_consistency` | Consistency of key-press pressure |

#### Mouse Features (20)

| # | Feature | Description |
|---|---|---|
| 1 | `velocity_mean` | Average cursor movement speed (px/ms) |
| 2 | `velocity_std` | Speed variability |
| 3 | `velocity_median` | Median cursor speed |
| 4 | `acceleration_mean` | Average cursor acceleration |
| 5 | `acceleration_std` | Acceleration variability |
| 6 | `movement_efficiency` | Ratio of direct distance to total path length |
| 7 | `curvature_mean` | Average path curvature (Menger curvature) |
| 8 | `curvature_std` | Curvature variability |
| 9 | `avg_direction_change` | Mean angular change between movement segments |
| 10 | `direction_change_variance` | Variability of direction changes |
| 11 | `click_duration_mean` | Average mouse click hold time |
| 12 | `click_duration_std` | Click timing variability |
| 13 | `left_click_ratio` | Proportion of left clicks |
| 14 | `right_click_ratio` | Proportion of right clicks |
| 15 | `inter_click_mean` | Average time between successive clicks |
| 16 | `inter_click_std` | Click interval variability |
| 17 | `dwell_time_mean` | Average hover dwell time |
| 18 | `movement_area` | Bounding box area of cursor movement |
| 19 | `movement_centrality` | Mean distance from cursor center of mass |
| 20 | `velocity_smoothness` | Inverse jerk (second derivative of position) |

#### Touch Features (7 — on-device extracted)

| Feature | Description |
|---|---|
| `touch_ms_mean` | Average touch duration |
| `touch_ms_min / max` | Touch duration range |
| `swipe_px_per_sec_mean / max` | Swipe speed statistics |
| `pressure_mean` | Average touch pressure |
| `pressure_std` | Touch pressure variability |

### Six-Model Ensemble

```
                    ┌──────────────────┐
                    │  Feature Vector  │
                    │   (38 features)  │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
    │   GRU   │        │Autoencoder│       │One-Class│
    │Sequence │        │  Anomaly  │       │   SVM   │
    │  Model  │        │ Detector  │       │         │
    └────┬────┘        └─────┬─────┘       └────┬────┘
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
    │Isolation│        │    KNN    │       │Passive- │
    │ Forest  │        │Classifier │       │Aggress. │
    │         │        │           │       │         │
    └────┬────┘        └─────┬─────┘       └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ Weighted Ensemble│
                    │   Score Fusion   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Tier Engine     │
                    │ ALLOW|STEP_UP|   │
                    │     BLOCK        │
                    └──────────────────┘
```

| Model | Type | Learning | Role |
|---|---|---|---|
| **GRU Sequence** | Deep Learning (RNN) | Supervised | Temporal pattern recognition over keystroke/mouse sequences |
| **Autoencoder** | Deep Learning | Unsupervised | Anomaly detection via reconstruction error threshold (95th percentile) |
| **One-Class SVM** | Classical ML | One-class | Decision boundary around genuine user's behavioral distribution |
| **Isolation Forest** | Ensemble | Unsupervised | Isolation-based outlier detection |
| **KNN Classifier** | Instance-based | Lazy | Real-time nearest-neighbor comparison against calibration data |
| **Passive-Aggressive** | Online Learning | Incremental | Continuous model adaptation without full retraining |

---

## 🛡️ Privacy & Efficiency Layer

The Privacy Layer provides **on-device processing** so that raw behavioral signals (every keystroke, every mouse coordinate) **never leave the user's browser**.

### How It Works

```
Raw Events (browser)
    │
    ├─ extractTouchFeatures()    → { touch_ms_mean, swipe_px_per_sec_mean, pressure_std, ... }
    ├─ extractKeystrokeFeatures() → { hold_time_mean, flight_time_std, typing_speed_cpm, ... }
    └─ extractMouseFeatures()    → { velocity_mean, velocity_std, distance_total, ... }
    │
    ▼
filterPayload()
    │
    ├─ payload.features = { ... }     ← aggregated stats only
    ├─ delete payload.events          ← raw data REMOVED
    ├─ payload.on_device = true
    └─ payload.privacy_level = 'high'
    │
    ▼
Network POST → /api/behavioral-data
    │
    ▼
Server receives ONLY statistical features
(never sees individual keystrokes or cursor positions)
```

### Battery-Aware Resource Management

| State | Throttle | Sampling | Flush Interval | Network Load |
|---|---|---|---|---|
| **Normal** | 50ms (20fps) | 100% | 5 seconds | Baseline |
| **Low Battery (≤20%)** | 200ms (5fps) | 50% | 10 seconds | ~75% reduction |
| **Charging** | Auto-restore | Auto-restore | Auto-restore | Baseline |

### Settings UI

Users can control the privacy layer from the dashboard:

- **On-Device Processing** — Toggle local feature extraction (default: ON)
- **Low Battery Mode** — Manual override for power saving
- **Sampling Frequency** — Slider from 10ms to 200ms

---

## 📈 Behavioral Drift Detection

VeriFlow continuously monitors for **behavioral drift** — gradual changes in how a user types or moves their mouse over time (e.g., due to fatigue, injury, device change, or account compromise).

### Statistical Tests Applied

| Test | What It Detects | Threshold |
|---|---|---|
| **Kolmogorov-Smirnov** | Full distribution shape change | p < 0.05 |
| **Mann-Whitney U** | Median shift | p < 0.05 |
| **Levene's Test** | Variance change | p < 0.05 |
| **Cohen's d** | Mean shift magnitude | d > 0.8 (large effect) |
| **F-Test (log ratio)** | Variance doubling/halving | log(ratio) > 0.69 |
| **Skewness / Kurtosis** | Distribution shape deformation | Δ > 2.0 |

### Drift Response

1. **Drift Score < 0.3** — Normal, no action
2. **Drift Score 0.3–0.5** — "Moderate drift — monitor closely"
3. **Drift Score > 0.5** — "Significant changes — recommend retraining"
4. **>50% features drifted** — Automatic model retraining triggered

### Adaptation Suggestions

The drift detector provides human-readable suggestions:
- *"Typing speed changed — consider stress or fatigue factors"*
- *"Mouse movement efficiency changed — possible device or workspace change"*
- *"Mouse movement dynamics changed — consider device sensitivity settings"*

---

## 💡 Explainable AI (XAI)

Every risk decision is accompanied by **human-readable explanations** via the Explainer module.

### How It Works

1. Compare current feature vector against user's calibrated baseline
2. Calculate percentage deviation for each of 38 features
3. Sort by absolute deviation magnitude
4. Return top-3 with human-readable labels

### Example Output

```json
[
  { "signal": "flight_time_mean", "delta_pct": -34.2, "label": "Typing rhythm changed" },
  { "signal": "velocity_mean",    "delta_pct": +52.1, "label": "Mouse movement unusual" },
  { "signal": "pressure_mean",    "delta_pct": -18.7, "label": "Touch pressure changed" }
]
```

### Supported Labels (40+)

Covers all keystroke features (hold time, flight time, speed, rhythm, digraphs, pressure), mouse features (velocity, acceleration, efficiency, curvature, clicks, dwell time), and touch features (duration, swipe speed, pressure).

---

## 🎯 Trust Ring & Tier Engine

### Visual Trust Ring

An **animated SVG ring** on the dashboard shows the real-time authentication score:

- **Green ring (>75%)** — User authenticated, no friction
- **Amber ring (45–75%)** — Elevated risk, step-up auth triggered
- **Red ring (<45%)** — High risk, session locked

### Tier Decision Engine

```python
def resolve_tier(score: float) -> str:
    if score > 0.75:   return "ALLOW"      # Silent pass
    elif score >= 0.45: return "STEP_UP"   # OTP / challenge
    else:               return "BLOCK"     # Lock session
```

---

## 🖥️ Admin Dashboard

The admin panel (`/admin`) provides security operations capabilities:

- **Flagged Sessions Table** — Sessions with anomalous scores, sortable by risk
- **Session Timeline** — Sparkline chart showing score degradation over time
- **Anomaly Reasons** — Which behavioral features triggered the flag
- **Quick Actions** — Approve, block, or force re-authentication
- **Demo Mode** — Simulated attack scenario showing score drop from 91% → 41%

---

## 📡 Real-Time WebSocket Architecture

### Events

| Event | Direction | Purpose |
|---|---|---|
| `join_session` | Client → Server | Register client in session room |
| `session_joined` | Server → Client | Confirm session enrollment |
| `behavioral_data` | Client → Server | Send behavioral features for scoring |
| `auth_result` | Server → Client | Return authenticity score + confidence |
| `security_alert` | Server → Client | Push anomaly notification |
| `drift_analysis` | Server → Client | Push drift detection results |
| `session_error` | Server → Client | Session validation failure |

### Sliding Window

Behavioral data is collected in a **30-second sliding window** and transmitted every **5 seconds** for continuous authentication scoring.

---

## 📚 API Reference

### Pages

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Redirect to login |
| `GET` | `/login` | Login & registration page |
| `GET` | `/calibration` | Behavioral calibration page |
| `GET` | `/challenge` | Main dashboard (requires auth) |
| `GET` | `/admin` | Admin panel |

### Authentication API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/register` | Create new user account |
| `POST` | `/api/login` | Authenticate with credentials |
| `POST` | `/api/logout` | End session |
| `GET` | `/api/session/status` | Check session validity |

### Behavioral Data API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/behavioral-data` | Submit behavioral features (supports both raw events and on-device processed features) |
| `POST` | `/api/calibration/complete` | Finalize calibration and train models |
| `POST` | `/api/risk` | Get real-time risk assessment |

### Data Management API

| Method | Route | Description |
|---|---|---|
| `DELETE` | `/api/user-data` | Delete all user behavioral data (GDPR compliance) |

### Debug API (Development Only)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/debug/calibration-data/<user_id>` | View calibration data |
| `GET` | `/api/debug/feature-dimensions/<user_id>` | Inspect feature dimensions |

---

## 🗄️ Database Schema

```sql
── users ──────────────────────────────────────────
user_id          INTEGER PRIMARY KEY AUTOINCREMENT
username         TEXT UNIQUE NOT NULL
email            TEXT UNIQUE NOT NULL
password_hash    TEXT NOT NULL        -- bcrypt
salt             TEXT NOT NULL
created_at       TIMESTAMP
last_login       TIMESTAMP
is_active        BOOLEAN DEFAULT 1
failed_attempts  INTEGER DEFAULT 0
locked_until     TIMESTAMP
calibration_complete  BOOLEAN DEFAULT 0

── sessions ───────────────────────────────────────
session_id       TEXT PRIMARY KEY     -- SHA-256 hash
user_id          INTEGER FK → users
created_at       TIMESTAMP
last_activity    TIMESTAMP
is_active        BOOLEAN DEFAULT 1
ip_address       TEXT
user_agent       TEXT

── behavioral_data ────────────────────────────────
data_id          INTEGER PRIMARY KEY AUTOINCREMENT
user_id          INTEGER FK → users
session_id       TEXT FK → sessions
timestamp        TIMESTAMP
data_type        TEXT          -- 'keystroke' | 'mouse' | 'touch'
features         TEXT (JSON)   -- aggregated feature vector
raw_data         TEXT (JSON)   -- NULL when privacy layer active
confidence_score REAL
anomaly_score    REAL

── auth_events ────────────────────────────────────
event_id         INTEGER PRIMARY KEY AUTOINCREMENT
user_id          INTEGER FK → users
session_id       TEXT FK → sessions
event_type       TEXT          -- 'login' | 'logout' | 'anomaly' | 'drift'
event_data       TEXT (JSON)
timestamp        TIMESTAMP
ip_address       TEXT

── model_metadata ─────────────────────────────────
user_id          INTEGER PRIMARY KEY FK → users
model_version    INTEGER DEFAULT 1
last_trained     TIMESTAMP
training_samples INTEGER DEFAULT 0
model_accuracy   REAL
drift_detected   BOOLEAN DEFAULT 0
drift_timestamp  TIMESTAMP
```

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| **Password Hashing** | bcrypt with 12 rounds (14 in production) |
| **Session Tokens** | SHA-256 hash of user_id + timestamp + IP |
| **JWT Tokens** | 24-hour access, 30-day refresh tokens |
| **Account Lockout** | 5 failures → 15-minute lock |
| **Session Timeout** | 8-hour automatic expiration |
| **Data Minimization** | Raw events stripped on-device before transmission |
| **CORS** | Configurable allowed origins |
| **Input Sanitization** | Server-side validation on all endpoints |
| **Session Isolation** | WebSocket rooms per session |
| **GDPR Compliance** | `DELETE /api/user-data` for complete data erasure |

---

## ⚡ Installation & Setup

### Prerequisites

- Python 3.10+
- pip

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/VeriFlow.git
cd VeriFlow/Model_veriFlow

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
python app.py
```

The application will start on `http://localhost:5000`.

### First-Time Usage

1. Navigate to `/login` and register a new account
2. Complete the **behavioral calibration** (minimum 5 minutes of typing + mouse movement)
3. After calibration, the ML models are trained on your unique behavioral fingerprint
4. You'll be redirected to the **dashboard** where continuous authentication begins

---

## ⚙️ Configuration

VeriFlow supports three configuration environments:

```python
# config.py

class Config:
    WINDOW_SIZE = 30                    # Sliding window (seconds)
    MIN_CALIBRATION_TIME = 300          # 5 minutes
    GRU_SEQUENCE_LENGTH = 50            # RNN sequence length
    GRU_HIDDEN_UNITS = 64              # GRU hidden layer size
    AUTOENCODER_ENCODING_DIM = 32      # Bottleneck dimension
    ANOMALY_THRESHOLD = 0.15           # Autoencoder anomaly cutoff
    DRIFT_DETECTION_WINDOW = 100       # Samples before drift check
    CONFIDENCE_THRESHOLD = 0.7         # Min confidence for auth
    ANOMALY_SCORE_THRESHOLD = 0.8      # Max anomaly before alert
    CONSECUTIVE_ANOMALIES_LIMIT = 3    # Anomalies before lockout
    DRIFT_ALPHA = 0.05                 # Statistical significance
    BCRYPT_LOG_ROUNDS = 12             # Password hash rounds
    MAX_LOGIN_ATTEMPTS = 5             # Before lockout
    LOCKOUT_DURATION = 15 min          # Lockout period
    SESSION_TIMEOUT = 8 hours          # Auto-expire sessions

class ProductionConfig(Config):
    BCRYPT_LOG_ROUNDS = 14             # Stronger hashing
    CONFIDENCE_THRESHOLD = 0.8         # Stricter auth
    CONSECUTIVE_ANOMALIES_LIMIT = 2    # Faster lockout
```

### Environment Variables

```env
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_PATH=database/auth_system.db
MODELS_PATH=models/saved
DEBUG=False
```

---

## 🎬 Demo Mode

VeriFlow includes a built-in demo mode for presentations and testing:

1. Log in with any account
2. The demo simulates a **session hijack scenario**:
   - Score starts at **91%** (green, ALLOW)
   - Simulated attacker gradually degrades the score
   - Score drops to **41%** (amber, STEP_UP triggered)
   - Explainability card shows: *"Typing rhythm changed (-34%)"*, *"Mouse movement unusual (+52%)"*
   - Session is flagged and appears on the admin panel
3. Score resets back to normal after the demo cycle

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for the future of authentication</strong>
  <br>
  <em>VeriFlow — Because identity is not what you know, it's who you are.</em>
</p>
