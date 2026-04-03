/**
 * Touch Signal Collector
 * ──────────────────────
 * Captures touch biometric signals (duration, swipe speed, mock pressure)
 * and POSTs {touch_ms, swipe_px_per_sec, pressure} to /api/behavioral-data
 * every 5 seconds.
 *
 * Pipeline:  JS → Flask → Model → score back
 */

class TouchCollector {
    constructor() {
        // ── Touch state ──────────────────────────────────
        this.t0 = 0;           // touchstart timestamp (ms via performance.now)
        this.x0 = 0;           // touchstart X
        this.y0 = 0;           // touchstart Y

        // ── Computed signals ─────────────────────────────
        this.lastTouchMs        = 0;   // duration of last touch
        this.lastSwipePxPerSec  = 0;   // px/sec of last swipe
        this.lastPressure       = 0;   // mocked pressure value

        // ── Move-tracking accumulator ────────────────────
        this.moveDistance = 0;         // cumulative move px during a touch
        this.lastMoveX    = 0;
        this.lastMoveY    = 0;

        // ── Buffer for batch POST ────────────────────────
        this.buffer = [];              // array of {touch_ms, swipe_px_per_sec, pressure}

        // ── Config ───────────────────────────────────────
        this.POST_INTERVAL_MS = 5000;  // flush every 5 s
        this.API_ENDPOINT     = '/api/behavioral-data';

        // ── Session ──────────────────────────────────────
        this.sessionId = localStorage.getItem('session_id') || '';

        // ── Bind event handlers ──────────────────────────
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd   = this._onTouchEnd.bind(this);
        this._onTouchMove  = this._onTouchMove.bind(this);

        this._attach();
        this._startFlushLoop();

        console.log('📱 TouchCollector initialised');
    }

    /* ===================================================================
     * EVENT HANDLERS
     * =================================================================*/

    /**
     * touchstart → save t0, x0, y0
     */
    _onTouchStart(e) {
        const touch = e.changedTouches[0];
        this.t0           = performance.now();
        this.x0           = touch.clientX;
        this.y0           = touch.clientY;
        this.moveDistance  = 0;
        this.lastMoveX    = touch.clientX;
        this.lastMoveY    = touch.clientY;
    }

    /**
     * touchend → calc duration = t1 - t0, compute swipe speed & mock pressure
     */
    _onTouchEnd(e) {
        const t1 = performance.now();
        const touch = e.changedTouches[0];

        // ── Duration (ms) ────────────────────────────────
        const duration = t1 - this.t0;
        this.lastTouchMs = Math.round(duration);

        // ── Final straight-line distance (fallback if no moves) ──
        if (this.moveDistance === 0) {
            const dx = touch.clientX - this.x0;
            const dy = touch.clientY - this.y0;
            this.moveDistance = Math.sqrt(dx * dx + dy * dy);
        }

        // ── Swipe speed (px / sec) ──────────────────────
        const durationSec = duration / 1000 || 0.001;   // avoid /0
        this.lastSwipePxPerSec = parseFloat((this.moveDistance / durationSec).toFixed(2));

        // ── Mock pressure ────────────────────────────────
        this.lastPressure = parseFloat((0.72 + Math.random() * 0.2).toFixed(4));

        // ── Push to buffer ───────────────────────────────
        this.buffer.push({
            touch_ms:          this.lastTouchMs,
            swipe_px_per_sec:  this.lastSwipePxPerSec,
            pressure:          this.lastPressure,
            timestamp:         Date.now()
        });

        console.log(
            `🖐️  touch  dur=${this.lastTouchMs}ms  swipe=${this.lastSwipePxPerSec}px/s  ` +
            `pressure=${this.lastPressure}`
        );
    }

    /**
     * touchmove → accumulate swipe distance
     */
    _onTouchMove(e) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.lastMoveX;
        const dy = touch.clientY - this.lastMoveY;
        this.moveDistance += Math.sqrt(dx * dx + dy * dy);
        this.lastMoveX = touch.clientX;
        this.lastMoveY = touch.clientY;
    }

    /* ===================================================================
     * NETWORK — POST buffer to /api/behavioral-data every 5 s
     * =================================================================*/

    _startFlushLoop() {
        this._flushTimer = setInterval(() => this._flush(), this.POST_INTERVAL_MS);
    }

    async _flush() {
        if (this.buffer.length === 0) return;

        const payload = {
            session_id: this.sessionId,
            type:       'touch',
            events:     this.buffer.splice(0)   // drain buffer
        };

        try {
            const res = await fetch(this.API_ENDPOINT, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            if (!res.ok) {
                console.warn('⚠️  TouchCollector POST failed:', res.status);
            } else {
                const data = await res.json();
                console.log('✅  Touch data accepted:', data);
            }
        } catch (err) {
            console.error('❌  TouchCollector network error:', err);
        }
    }

    /* ===================================================================
     * LIFECYCLE
     * =================================================================*/

    _attach() {
        document.addEventListener('touchstart', this._onTouchStart, { passive: true });
        document.addEventListener('touchend',   this._onTouchEnd,   { passive: true });
        document.addEventListener('touchmove',  this._onTouchMove,  { passive: true });
    }

    destroy() {
        clearInterval(this._flushTimer);
        document.removeEventListener('touchstart', this._onTouchStart);
        document.removeEventListener('touchend',   this._onTouchEnd);
        document.removeEventListener('touchmove',  this._onTouchMove);
        // Flush remaining buffer one last time
        this._flush();
        console.log('📱 TouchCollector destroyed');
    }
}

// ── Auto-initialise ──────────────────────────────────────────────────
window.touchCollector = new TouchCollector();
