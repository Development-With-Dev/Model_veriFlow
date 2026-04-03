/**
 * Privacy & Efficiency Layer  v2
 * ────────────────────────────────
 * On-device feature extraction, data minimization, battery-aware
 * adaptive sampling, and resource-efficient processing for
 * behavioral biometrics.
 *
 * Goals
 *   1. Privacy   — extract features locally; transmit aggregated
 *                  metadata instead of raw events.
 *   2. Efficiency — reduce main-thread work and battery drain via
 *                   throttling, adaptive sampling, and idle callbacks.
 *
 * Activated from Settings → "Privacy & Efficiency" panel.
 */

class PrivacyLayer {
    constructor(config = {}) {
        /* ── Settings (runtime-mutable) ────────────────────────── */
        this.settings = {
            onDeviceProcessing : true,   // extract features client-side
            dataMinimization   : true,   // strip raw events from payloads
            lowBatteryMode     : false,  // user toggle
            throttleMs         : 50,     // default move-event throttle
            flushIntervalMs    : 5000,   // network flush cadence
            samplingRate       : 1.0,    // 0→1  fraction of events kept
            ...config
        };

        /* ── Running statistics (Welford-style) ────────────────── */
        this.stats = {
            touch_ms   : this._emptyBucket(),
            swipe_px   : this._emptyBucket(),
            pressure   : this._emptyBucket(),
            hold_time  : this._emptyBucket(),
            flight_time: this._emptyBucket(),
            velocity   : this._emptyBucket()
        };

        /* ── Resource telemetry ────────────────────────────────── */
        this.battery = {
            level    : 1.0,
            charging : true,
            supported: false
        };
        this._droppedEvents = 0;
        this._processedEvents = 0;

        /* ── Init ──────────────────────────────────────────────── */
        this._initBatteryMonitor();

        console.log('🛡️  PrivacyLayer v2 initialised', this.settings);
    }

    /* =================================================================
     *  BATTERY API — automatic low-power adaptation
     * ================================================================*/

    async _initBatteryMonitor() {
        try {
            if (!navigator.getBattery) return;
            const batt = await navigator.getBattery();
            this.battery.supported = true;
            this._syncBattery(batt);

            batt.addEventListener('levelchange',    () => this._syncBattery(batt));
            batt.addEventListener('chargingchange',  () => this._syncBattery(batt));
        } catch (_) { /* Battery API unsupported — ignore */ }
    }

    _syncBattery(batt) {
        this.battery.level    = batt.level;
        this.battery.charging = batt.charging;

        // Auto-engage low-battery mode when ≤ 20 % and not charging
        if (batt.level <= 0.20 && !batt.charging) {
            if (!this.settings.lowBatteryMode) {
                this.settings.lowBatteryMode = true;
                this._applyEfficiencyProfile();
                console.log('🔋 PrivacyLayer: Auto low-battery mode ON (≤ 20 %)');
            }
        }
        // Auto-disengage when charging resumes
        if (batt.charging && this.settings.lowBatteryMode) {
            this.settings.lowBatteryMode = false;
            this._applyEfficiencyProfile();
            console.log('🔌 PrivacyLayer: Charging — low-battery mode OFF');
        }
    }

    /**
     * Adjust throttle / sampling / flush based on battery state
     */
    _applyEfficiencyProfile() {
        if (this.settings.lowBatteryMode) {
            this.settings.throttleMs     = 200;   // ≈5 fps instead of 20
            this.settings.flushIntervalMs = 10000; // flush half as often
            this.settings.samplingRate    = 0.5;   // keep 1-in-2 events
        } else {
            this.settings.throttleMs     = 50;
            this.settings.flushIntervalMs = 5000;
            this.settings.samplingRate    = 1.0;
        }
    }

    /* =================================================================
     *  RUNNING STATISTICS (on-device baseline)
     * ================================================================*/

    _emptyBucket() {
        return { count: 0, sum: 0, sqSum: 0, mean: 0, std: 0, min: Infinity, max: -Infinity };
    }

    updateStats(type, value) {
        if (!this.stats[type]) this.stats[type] = this._emptyBucket();
        const s = this.stats[type];
        s.count++;
        s.sum   += value;
        s.sqSum += value * value;
        s.mean   = s.sum / s.count;
        if (value < s.min) s.min = value;
        if (value > s.max) s.max = value;
        const variance = (s.sqSum / s.count) - (s.mean * s.mean);
        s.std = Math.sqrt(Math.max(0, variance));
    }

    /**
     * On-device Z-score anomaly check — returns true when |z| > 3σ.
     */
    isLocalAnomaly(type, value) {
        const s = this.stats[type];
        if (!s || s.count < 10) return false;
        return Math.abs(value - s.mean) / (s.std || 1) > 3;
    }

    /* =================================================================
     *  ON-DEVICE FEATURE EXTRACTION
     * ================================================================*/

    /** Helper: mean of numeric array */
    static _mean(arr) {
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    /** Helper: population std-dev */
    static _std(arr) {
        if (arr.length < 2) return 0;
        const m = PrivacyLayer._mean(arr);
        return Math.sqrt(arr.map(x => (x - m) ** 2).reduce((a, b) => a + b, 0) / arr.length);
    }

    /**
     * Extract touch features from a batch of touch events.
     * Mirrors the server-side logic in app.py receive_behavioral_data().
     */
    extractTouchFeatures(events) {
        if (!events || events.length === 0) return null;

        const touchMs  = events.map(e => e.touch_ms          || 0);
        const swipePx  = events.map(e => e.swipe_px_per_sec  || 0);
        const pressure = events.map(e => e.pressure          || 0);

        const features = {
            touch_ms_mean         : PrivacyLayer._mean(touchMs),
            touch_ms_min          : Math.min(...touchMs),
            touch_ms_max          : Math.max(...touchMs),
            swipe_px_per_sec_mean : PrivacyLayer._mean(swipePx),
            swipe_px_per_sec_max  : Math.max(...swipePx),
            pressure_mean         : PrivacyLayer._mean(pressure),
            pressure_std          : PrivacyLayer._std(pressure),
            event_count           : events.length,
            processed_on_device   : true,
            timestamp             : Date.now()
        };

        // Update running baseline
        this.updateStats('touch_ms', features.touch_ms_mean);
        this.updateStats('swipe_px', features.swipe_px_per_sec_mean);
        this.updateStats('pressure', features.pressure_mean);

        return features;
    }

    /**
     * Extract keystroke features from a batch of key events.
     */
    extractKeystrokeFeatures(events) {
        if (!events || events.length < 2) return null;

        const holdTimes  = [];
        const flightTimes = [];
        const downs = events.filter(e => e.type === 'keydown');
        const ups   = events.filter(e => e.type === 'keyup');

        // Pair keydown→keyup per key for hold time
        for (const up of ups) {
            const matchDown = downs.find(
                d => d.key === up.key && d.timestamp < up.timestamp
            );
            if (matchDown) {
                holdTimes.push(up.timestamp - matchDown.timestamp);
            }
        }

        // Flight time = gap between successive keydown events
        for (let i = 1; i < downs.length; i++) {
            flightTimes.push(downs[i].timestamp - downs[i - 1].timestamp);
        }

        const features = {
            hold_time_mean   : PrivacyLayer._mean(holdTimes),
            hold_time_std    : PrivacyLayer._std(holdTimes),
            flight_time_mean : PrivacyLayer._mean(flightTimes),
            flight_time_std  : PrivacyLayer._std(flightTimes),
            typing_speed_cpm : downs.length > 0
                ? (downs.length / ((downs[downs.length - 1].timestamp - downs[0].timestamp) / 60000))
                : 0,
            event_count      : events.length,
            processed_on_device : true,
            timestamp        : Date.now()
        };

        this.updateStats('hold_time',  features.hold_time_mean);
        this.updateStats('flight_time', features.flight_time_mean);

        return features;
    }

    /**
     * Extract mouse movement features from a batch of mouse events.
     */
    extractMouseFeatures(events) {
        if (!events || events.length < 2) return null;

        const moves = events.filter(e => e.type === 'move' || e.type === 'mousemove');
        const velocities = [];
        const distances  = [];

        for (let i = 1; i < moves.length; i++) {
            const dx = moves[i].x - moves[i - 1].x;
            const dy = moves[i].y - moves[i - 1].y;
            const dt = (moves[i].timestamp - moves[i - 1].timestamp) || 1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            distances.push(dist);
            velocities.push(dist / dt);
        }

        const clicks = events.filter(e => e.type === 'click' || e.type === 'mousedown');

        const features = {
            velocity_mean    : PrivacyLayer._mean(velocities),
            velocity_std     : PrivacyLayer._std(velocities),
            distance_total   : distances.reduce((a, b) => a + b, 0),
            click_count      : clicks.length,
            move_count       : moves.length,
            event_count      : events.length,
            processed_on_device : true,
            timestamp        : Date.now()
        };

        this.updateStats('velocity', features.velocity_mean);

        return features;
    }

    /* =================================================================
     *  SAMPLING — probabilistic event dropping  (Efficiency)
     * ================================================================*/

    /**
     * Returns true if this event should be KEPT.
     * When samplingRate < 1.0, events are randomly discarded.
     */
    shouldSample() {
        if (this.settings.samplingRate >= 1.0) return true;
        const keep = Math.random() < this.settings.samplingRate;
        if (!keep) this._droppedEvents++;
        return keep;
    }

    /* =================================================================
     *  PAYLOAD FILTER  (Privacy — data minimization)
     * ================================================================*/

    /**
     * Applies privacy + efficiency filters to a payload object
     * BEFORE it is sent over the network.
     *
     *  • Extracts on-device features from events
     *  • Strips raw events when data-minimization is on
     *  • Annotates payload with privacy metadata
     */
    filterPayload(payload) {
        if (!this.settings.onDeviceProcessing) {
            payload.privacy_level = 'standard';
            return payload;
        }

        // Compute on-device features if events are present
        if (payload.events && payload.events.length > 0) {
            const type = payload.type || 'touch';

            switch (type) {
                case 'touch':
                    payload.features = this.extractTouchFeatures(payload.events);
                    break;
                case 'keystroke':
                    payload.features = this.extractKeystrokeFeatures(payload.events);
                    break;
                case 'mouse':
                    payload.features = this.extractMouseFeatures(payload.events);
                    break;
                default:
                    payload.features = this.extractTouchFeatures(payload.events);
            }

            this._processedEvents += payload.events.length;
        }

        // Strip raw events for maximum privacy
        if (this.settings.dataMinimization && payload.features) {
            delete payload.events;
        }

        // Annotate
        payload.privacy_level     = this.settings.dataMinimization ? 'high' : 'standard';
        payload.on_device         = true;
        payload.battery_level     = this.battery.level;
        payload.low_battery_mode  = this.settings.lowBatteryMode;

        return payload;
    }

    /* =================================================================
     *  THROTTLE  (Efficiency)
     * ================================================================*/

    /**
     * Returns a throttled version of `func` that fires at most
     * once per `limit` ms.  Trailing call is guaranteed.
     */
    throttle(func, limit) {
        let timer  = null;
        let lastTs = 0;
        return function (...args) {
            const now = Date.now();
            const remaining = limit - (now - lastTs);
            if (remaining <= 0) {
                func.apply(this, args);
                lastTs = now;
            } else if (!timer) {
                timer = setTimeout(() => {
                    func.apply(this, args);
                    lastTs = Date.now();
                    timer  = null;
                }, remaining);
            }
        };
    }

    /* =================================================================
     *  SETTINGS API  (called from UI toggles)
     * ================================================================*/

    /**
     * Merge new settings and re-apply efficiency profile.
     * Called by challenge.js when the user changes settings.
     */
    applySettings(partial) {
        Object.assign(this.settings, partial);
        this._applyEfficiencyProfile();
        console.log('🛡️  PrivacyLayer settings updated', this.settings);
    }

    /**
     * Return a snapshot for the admin/debug panel.
     */
    getStatus() {
        return {
            settings        : { ...this.settings },
            battery         : { ...this.battery },
            processedEvents : this._processedEvents,
            droppedEvents   : this._droppedEvents,
            baselineStats   : Object.fromEntries(
                Object.entries(this.stats).map(([k, v]) => [k, { mean: v.mean, std: v.std, count: v.count }])
            )
        };
    }
}

/* ── Global singleton ──────────────────────────────────────────── */
window.privacyLayer = new PrivacyLayer();
