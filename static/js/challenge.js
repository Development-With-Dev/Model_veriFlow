// js/challenge.js

document.addEventListener('DOMContentLoaded', () => {
    const challengeInput = document.getElementById('challengeInput');
    const authStatusBox = document.getElementById('authStatusBox');
    const authStatusMessage = document.getElementById('authStatusMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    const SLIDING_WINDOW_SIZE_MS = 30 * 1000; // 30 seconds
    const AUTHENTICATION_INTERVAL_MS = 5 * 1000; // Send data every 5 seconds for continuous auth

    let keystrokeEvents = [];
    let mouseEvents = [];
    let lastKeyDownTime = 0;
    let lastMouseMoveTime = 0;
    let authenticationInterval;
    let webSocket; // Simulated WebSocket

    // --- UI Update Function ---
    function updateAuthStatus(status, message) {
        authStatusBox.classList.remove('auth', 'risk', 'high-risk', 'loading');
        authStatusMessage.textContent = message;

        // Remove previous loading spinner if it exists
        const spinner = authStatusBox.querySelector('svg');
        if (spinner) spinner.remove();

        switch (status) {
            case 'authenticated':
                authStatusBox.classList.add('auth');
                break;
            case 'risk':
                authStatusBox.classList.add('risk');
                break;
            case 'high-risk':
                authStatusBox.classList.add('high-risk');
                // Optionally add a spinner for high-risk if a backend check is initiated
                // addSpinner(authStatusBox);
                break;
            case 'loading':
            default:
                authStatusBox.classList.add('loading');
                addSpinner(authStatusBox);
                break;
        }
    }

    // Helper to add a loading spinner
    function addSpinner(element) {
        const spinnerSvg = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        // Insert spinner at the beginning of the status box
        element.insertAdjacentHTML('afterbegin', spinnerSvg);
    }

    // --- Data Collection ---

    // Keystroke event listeners
    challengeInput.addEventListener('keydown', (e) => {
        if (!e.repeat) {
            const currentTime = performance.now();
            keystrokeEvents.push({
                type: 'keydown',
                key: e.key,
                keyCode: e.keyCode,
                timestamp: currentTime
            });
            lastKeyDownTime = currentTime;
        }
    });

    challengeInput.addEventListener('keyup', (e) => {
        const currentTime = performance.now();
        keystrokeEvents.push({
            type: 'keyup',
            key: e.key,
            keyCode: e.keyCode,
            timestamp: currentTime
        });
    });

    // Mouse event listeners (on the whole document for broader capture)
    document.addEventListener('mousemove', (e) => {
        const currentTime = performance.now();
        if (currentTime - lastMouseMoveTime > 50) {
            mouseEvents.push({
                type: 'mousemove',
                x: e.clientX,
                y: e.clientY,
                timestamp: currentTime
            });
            lastMouseMoveTime = currentTime;
        }
    });

    document.addEventListener('mousedown', (e) => {
        mouseEvents.push({
            type: 'mousedown',
            button: e.button,
            x: e.clientX,
            y: e.clientY,
            timestamp: performance.now()
        });
    });

    document.addEventListener('mouseup', (e) => {
        mouseEvents.push({
            type: 'mouseup',
            button: e.button,
            x: e.clientX,
            y: e.clientY,
            timestamp: performance.now()
        });
    });

    // --- Sliding Window & WebSocket Simulation ---

    function sendBehavioralDataForAuth() {
        const currentTime = performance.now();
        const windowStartTime = currentTime - SLIDING_WINDOW_SIZE_MS;

        // Filter events within the current sliding window
        const windowKeystrokeEvents = keystrokeEvents.filter(event => event.timestamp >= windowStartTime);
        const windowMouseEvents = mouseEvents.filter(event => event.timestamp >= windowStartTime);

        // Remove old events
        keystrokeEvents = windowKeystrokeEvents;
        mouseEvents = windowMouseEvents;

        // Only send data if there's significant activity
        if (windowKeystrokeEvents.length > 5 || windowMouseEvents.length > 10) {
            const dataToSend = {
                keystroke_data: windowKeystrokeEvents,
                mouse_data: windowMouseEvents,
                timestamp: Date.now()
            };

            // Simulate sending data via WebSocket
            console.log('Sending behavioral data for authentication:', dataToSend);
            updateAuthStatus('loading', 'Authenticating your behavior...');

        } else {
            updateAuthStatus('authenticated', 'No activity, session secure.'); // Default if no activity
        }
    }

    // --- Initialization ---
    function initChallenge() {
        // Simulate WebSocket connection
        // webSocket = new WebSocket('ws://your-backend-websocket-url/challenge');
        // webSocket.onopen = () => console.log('WebSocket connected for challenge');
        // webSocket.onmessage = (event) => {
        //     const data = JSON.parse(event.data);
        //     console.log('Received auth status:', data);
        //     updateAuthStatus(data.status, data.message);
        // };
        // webSocket.onerror = (error) => console.error('WebSocket error:', error);
        // webSocket.onclose = () => console.log('WebSocket closed');

        // Start sending data for authentication checks
        authenticationInterval = setInterval(sendBehavioralDataForAuth, AUTHENTICATION_INTERVAL_MS);

        logoutBtn.addEventListener('click', () => {
            clearInterval(authenticationInterval);
            // if (webSocket) webSocket.close();
            console.log('Logged out.');
            window.location.href = 'login.html'; // Redirect to login page on logout
        });

        // Initial status display
        updateAuthStatus('loading', 'Authenticating your behavior...');
        challengeInput.focus();
    }

    initChallenge();
});
/**
 * Challenge/Dashboard Page JavaScript
 * Handles real-time behavioral monitoring and dashboard functionality
 */

class DashboardManager {
    constructor() {
        this.socket = null;
        this.sessionId = localStorage.getItem('session_id');
        this.userId = localStorage.getItem('user_id');
        this.username = localStorage.getItem('username');
        
        // Real-time monitoring state
        this.isMonitoring = false;
        this.behavioralBuffer = {
            keystroke: [],
            mouse: [],
            touch: []
        };
        this.lastMousePosition = null;
        this.lastKeystroke = null;

        // Touch biometric state
        this.touchT0 = 0;
        this.touchX0 = 0;
        this.touchY0 = 0;
        this.touchMoveDistance = 0;
        this.touchLastMoveX = 0;
        this.touchLastMoveY = 0;
        
        // Authentication state
        this.currentAuthScore = 0.0;
        this.confidenceLevel = 0.0;
        this.anomalyRisk = 'Low';
        this.securityScore = 85;
        
        // Charts
        this.behaviorChart = null;
        this.driftChart = null;
        this.patternsChart = null;
        this.timeChart = null;
        
        // Dashboard state
        this.currentSection = 'dashboard';
        this.notificationCount = 0;
        this.securityAlerts = [];
        
        // Timers
        this.authUpdateInterval = null;
        this.chartUpdateInterval = null;
        this.statsUpdateInterval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectWebSocket();
        this.initializeCharts();
        this.startRealTimeMonitoring();
        this.updateUserInfo();
    }

    initializeElements() {
        // Navigation
        this.navLinks = document.querySelectorAll('.nav-link');
        this.contentSections = document.querySelectorAll('.content-section');
        this.pageTitle = document.getElementById('pageTitle');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        
        // Header elements
        this.authStatus = document.getElementById('authStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.sidebarUsername = document.getElementById('sidebarUsername');
        
        // Notifications
        this.notificationBtn = document.getElementById('notificationBtn');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');
        this.markAllRead = document.getElementById('markAllRead');
        
        // Dashboard stats
        this.securityScoreEl = document.getElementById('securityScore');
        this.securityScoreCircle = document.getElementById('securityScoreCircle');
        this.authScoreEl = document.getElementById('authScore');
        this.confidenceLevelEl = document.getElementById('confidenceLevel');
        this.anomalyRiskEl = document.getElementById('anomalyRisk');
        this.keystrokeSamplesEl = document.getElementById('keystrokeSamples');
        this.mouseSamplesEl = document.getElementById('mouseSamples');
        this.monitorStatus = document.getElementById('monitorStatus');
        
        // Activity log
        this.recentActivityList = document.getElementById('recentActivityList');
        this.activityTableBody = document.getElementById('activityTableBody');
        this.activityFilter = document.getElementById('activityFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.refreshActivity = document.getElementById('refreshActivity');
        
        // Quick actions
        this.runSecurityCheck = document.getElementById('runSecurityCheck');
        this.updateModels = document.getElementById('updateModels');
        this.exportLogs = document.getElementById('exportLogs');
        this.testBehavior = document.getElementById('testBehavior');
        
        // Settings
        this.enableRealTimeAuth = document.getElementById('enableRealTimeAuth');
        this.enableAnomalyAlerts = document.getElementById('enableAnomalyAlerts');
        this.enableDriftDetection = document.getElementById('enableDriftDetection');
        this.authThreshold = document.getElementById('authThreshold');
        this.anomalySensitivity = document.getElementById('anomalySensitivity');
        
        // Modals
        this.securityAlertModal = document.getElementById('securityAlertModal');
        this.alertTitle = document.getElementById('alertTitle');
        this.alertMessage = document.getElementById('alertMessage');
        this.alertDetails = document.getElementById('alertDetails');
        this.acknowledgeAlert = document.getElementById('acknowledgeAlert');
        this.investigateAlert = document.getElementById('investigateAlert');
        
        // Test area
        this.testArea = document.getElementById('testArea');
        this.startTest = document.getElementById('startTest');
        this.stopTest = document.getElementById('stopTest');
    }

    setupEventListeners() {
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
        
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });
        
        // Notifications
        this.notificationBtn.addEventListener('click', () => {
            this.toggleNotificationDropdown();
        });
        
        this.markAllRead.addEventListener('click', () => {
            this.markAllNotificationsRead();
        });
        
        // Quick actions
        this.runSecurityCheck.addEventListener('click', () => this.runSecurityCheck());
        this.updateModels.addEventListener('click', () => this.updateModels());
        this.exportLogs.addEventListener('click', () => this.exportLogs());
        this.testBehavior.addEventListener('click', () => this.toggleTestArea());
        
        // Activity log
        this.refreshActivity.addEventListener('click', () => this.loadActivityLog());
        this.activityFilter.addEventListener('change', () => this.loadActivityLog());
        this.dateFilter.addEventListener('change', () => this.loadActivityLog());
        
        // Settings
        this.authThreshold.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            this.updateSettings();
        });
        
        this.anomalySensitivity.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            this.updateSettings();
        });
        
        // Real-time monitoring events
        document.addEventListener('keydown', (e) => this.captureKeystroke(e));
        document.addEventListener('keyup', (e) => this.captureKeystroke(e));
        document.addEventListener('mousemove', (e) => this.captureMouseMovement(e));
        document.addEventListener('mousedown', (e) => this.captureMouseClick(e));
        document.addEventListener('mouseup', (e) => this.captureMouseClick(e));
        document.addEventListener('click', (e) => this.captureMouseClick(e));

        // Touch biometric events
        document.addEventListener('touchstart', (e) => this.captureTouchStart(e), { passive: true });
        document.addEventListener('touchend',   (e) => this.captureTouchEnd(e),   { passive: true });
        document.addEventListener('touchmove',  (e) => this.captureTouchMove(e),  { passive: true });
        
        // Test area
        this.startTest.addEventListener('click', () => this.startBehaviorTest());
        this.stopTest.addEventListener('click', () => this.stopBehaviorTest());
        
        // Alert modal
        this.acknowledgeAlert.addEventListener('click', () => this.acknowledgeSecurityAlert());
        this.investigateAlert.addEventListener('click', () => this.investigateSecurityAlert());
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.notificationBtn.contains(e.target)) {
                this.notificationDropdown.style.display = 'none';
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key) {
                    case 'D':
                        e.preventDefault();
                        this.showSection('dashboard');
                        break;
                    case 'S':
                        e.preventDefault();
                        this.showSection('security');
                        break;
                    case 'A':
                        e.preventDefault();
                        this.showSection('analytics');
                        break;
                    case 'T':
                        e.preventDefault();
                        this.toggleTestArea();
                        break;
                }
            }
        });
    }

    connectWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to dashboard server');
            this.socket.emit('join_session', { session_id: this.sessionId });
            this.updateConnectionStatus(true);
        });
        
        this.socket.on('session_joined', (data) => {
            console.log('Dashboard session joined:', data.message);
            this.statusText.textContent = 'Monitoring Active';
        });
        
        this.socket.on('auth_result', (data) => {
            this.handleAuthResult(data);
        });
        
        this.socket.on('security_alert', (data) => {
            this.handleSecurityAlert(data);
        });
        
        this.socket.on('drift_analysis', (data) => {
            this.handleDriftAnalysis(data);
        });
        
        this.socket.on('session_error', (data) => {
            console.error('Session error:', data.error);
            this.showAlert('Session Error', data.error, 'error');
            setTimeout(() => window.location.href = '/login', 3000);
        });
        
        this.socket.on('error', (data) => {
            console.error('Socket error:', data.error);
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
            this.statusText.textContent = 'Reconnecting...';
            
            // Attempt to reconnect
            setTimeout(() => this.connectWebSocket(), 2000);
        });
    }

    initializeCharts() {
        // Behavior monitoring chart
        const behaviorCtx = document.getElementById('behaviorChart');
        if (behaviorCtx) {
            this.behaviorChart = new Chart(behaviorCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Authentication Score',
                        data: [],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
        
        // Drift analysis chart
        const driftCtx = document.getElementById('driftChart');
        if (driftCtx) {
            this.driftChart = new Chart(driftCtx, {
                type: 'radar',
                data: {
                    labels: ['Typing Speed', 'Key Timing', 'Mouse Velocity', 'Click Patterns', 'Movement Efficiency'],
                    datasets: [{
                        label: 'Current Behavior',
                        data: [0.8, 0.9, 0.7, 0.85, 0.75],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        pointBackgroundColor: 'rgb(99, 102, 241)'
                    }, {
                        label: 'Baseline',
                        data: [0.8, 0.8, 0.8, 0.8, 0.8],
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        pointBackgroundColor: 'rgb(16, 185, 129)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 1,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: 'rgba(255, 255, 255, 0.7)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
        
        // Behavioral patterns chart
        const patternsCtx = document.getElementById('patternsChart');
        if (patternsCtx) {
            this.patternsChart = new Chart(patternsCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Keystroke Patterns',
                        data: [],
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        borderColor: 'rgb(99, 102, 241)'
                    }, {
                        label: 'Mouse Patterns',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgb(16, 185, 129)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
        
        // Time-based analysis chart
        const timeCtx = document.getElementById('timeChart');
        if (timeCtx) {
            this.timeChart = new Chart(timeCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Authenticity Score',
                        data: [],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        yAxisID: 'y'
                    }, {
                        label: 'Anomaly Score',
                        data: [],
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            max: 1,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            max: 1,
                            grid: { drawOnChartArea: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
    }

    startRealTimeMonitoring() {
        this.isMonitoring = true;
        this.updateMonitoringStatus(true);
        
        // Update authentication stats periodically
        this.authUpdateInterval = setInterval(() => {
            this.updateAuthenticationStats();
        }, 5000);
        
        // Update charts periodically
        this.chartUpdateInterval = setInterval(() => {
            this.updateCharts();
        }, 10000);
        
        // Update general stats
        this.statsUpdateInterval = setInterval(() => {
            this.updateGeneralStats();
        }, 30000);

        // Flush touch biometric buffer every 5 s
        this.touchFlushInterval = setInterval(() => {
            this.sendTouchData();
        }, 5000);
    }

    captureKeystroke(e) {
        if (!this.isMonitoring) return;
        
        const keystroke = {
            key: e.key,
            code: e.code,
            type: e.type,
            timestamp: Date.now(),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        };
        
        // Calculate timing metrics
        if (this.lastKeystroke && e.type === 'keydown') {
            keystroke.flightTime = keystroke.timestamp - this.lastKeystroke.timestamp;
        }
        
        if (e.type === 'keydown') {
            keystroke.downTime = keystroke.timestamp;
        } else if (e.type === 'keyup') {
            keystroke.upTime = keystroke.timestamp;
            if (this.lastKeystroke && this.lastKeystroke.downTime) {
                keystroke.holdTime = keystroke.upTime - this.lastKeystroke.downTime;
            }
        }
        
        this.behavioralBuffer.keystroke.push(keystroke);
        this.lastKeystroke = keystroke;
        
        // Send data in batches
        if (this.behavioralBuffer.keystroke.length >= 20) {
            this.sendBehavioralData('keystroke', this.behavioralBuffer.keystroke.slice());
            this.behavioralBuffer.keystroke = [];
        }
    }

    captureMouseMovement(e) {
        if (!this.isMonitoring) return;
        
        const mouseEvent = {
            type: 'move',
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now(),
            target: e.target.tagName
        };
        
        // Calculate movement metrics
        if (this.lastMousePosition) {
            const dx = e.clientX - this.lastMousePosition.x;
            const dy = e.clientY - this.lastMousePosition.y;
            const dt = Date.now() - this.lastMousePosition.timestamp;
            
            mouseEvent.velocity = Math.sqrt(dx * dx + dy * dy) / (dt || 1);
            mouseEvent.distance = Math.sqrt(dx * dx + dy * dy);
            mouseEvent.direction = Math.atan2(dy, dx);
        }
        
        this.lastMousePosition = {
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        };
        
        this.behavioralBuffer.mouse.push(mouseEvent);
        
        // Send data in batches
        if (this.behavioralBuffer.mouse.length >= 50) {
            this.sendBehavioralData('mouse', this.behavioralBuffer.mouse.slice());
            this.behavioralBuffer.mouse = [];
        }
    }

    captureMouseClick(e) {
        if (!this.isMonitoring) return;
        
        const clickEvent = {
            type: 'click',
            button: e.button,
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now(),
            eventType: e.type,
            target: e.target.tagName
        };
        
        this.behavioralBuffer.mouse.push(clickEvent);
    }

    // ─── Touch biometric capture ─────────────────────────────────

    /**
     * touchstart → save t0, x0, y0
     */
    captureTouchStart(e) {
        if (!this.isMonitoring) return;
        const touch = e.changedTouches[0];
        this.touchT0           = performance.now();
        this.touchX0           = touch.clientX;
        this.touchY0           = touch.clientY;
        this.touchMoveDistance = 0;
        this.touchLastMoveX    = touch.clientX;
        this.touchLastMoveY    = touch.clientY;
    }

    /**
     * touchend → calc duration = t1 - t0, swipe speed, mock pressure
     */
    captureTouchEnd(e) {
        if (!this.isMonitoring) return;
        const t1 = performance.now();
        const touch = e.changedTouches[0];

        // Duration (ms)
        const duration = t1 - this.touchT0;
        const touchMs  = Math.round(duration);

        // Fallback straight-line if no moves were accumulated
        if (this.touchMoveDistance === 0) {
            const dx = touch.clientX - this.touchX0;
            const dy = touch.clientY - this.touchY0;
            this.touchMoveDistance = Math.sqrt(dx * dx + dy * dy);
        }

        // Swipe speed (px / sec)
        const durationSec      = duration / 1000 || 0.001;
        const swipePxPerSec    = parseFloat((this.touchMoveDistance / durationSec).toFixed(2));

        // Mock pressure
        const pressure = parseFloat((0.72 + Math.random() * 0.2).toFixed(4));

        // Push to touch buffer
        this.behavioralBuffer.touch.push({
            touch_ms:         touchMs,
            swipe_px_per_sec: swipePxPerSec,
            pressure:         pressure,
            timestamp:        Date.now()
        });

        console.log(
            `🖐️  touch  dur=${touchMs}ms  swipe=${swipePxPerSec}px/s  pressure=${pressure}`
        );
    }

    /**
     * touchmove → accumulate swipe distance for speed calc
     */
    captureTouchMove(e) {
        if (!this.isMonitoring) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchLastMoveX;
        const dy = touch.clientY - this.touchLastMoveY;
        this.touchMoveDistance += Math.sqrt(dx * dx + dy * dy);
        this.touchLastMoveX = touch.clientX;
        this.touchLastMoveY = touch.clientY;
    }

    /**
     * POST buffered touch data to /api/behavioral-data
     */
    async sendTouchData() {
        if (this.behavioralBuffer.touch.length === 0) return;

        const payload = {
            session_id: this.sessionId,
            type:       'touch',
            events:     this.behavioralBuffer.touch.splice(0)
        };

        try {
            const res = await fetch('/api/behavioral-data', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });
            if (!res.ok) {
                console.warn('⚠️  Touch POST failed:', res.status);
            } else {
                const data = await res.json();
                console.log('✅  Touch data accepted:', data);
            }
        } catch (err) {
            console.error('❌  Touch POST error:', err);
        }
    }

    sendBehavioralData(type, data) {
        if (this.socket && data.length > 0) {
            this.socket.emit('behavioral_data', {
                type: type,
                events: data,
                timestamp: Date.now()
            });
        }
    }

    handleAuthResult(data) {
        this.currentAuthScore = data.authenticity_score || 0;
        this.confidenceLevel = (data.confidence || 0) * 100;
        this.anomalyRisk = this.getAnomalyRiskLevel(data.anomaly_score || 0);
        
        this.updateAuthenticationDisplay();
        this.addAuthDataToChart(data);
        
        // Update samples count
        if (this.keystrokeSamplesEl) {
            const current = parseInt(this.keystrokeSamplesEl.textContent) || 0;
            this.keystrokeSamplesEl.textContent = current + 1;
        }
    }

    handleSecurityAlert(data) {
        this.addSecurityAlert(data);
        this.updateNotificationBadge();
        
        if (data.level >= 2) {
            this.showSecurityAlertModal(data);
        }
        
        // Add to activity log
        this.addActivityItem({
            type: 'anomaly',
            message: data.message,
            risk: this.getAlertLevelText(data.level),
            timestamp: new Date().toISOString()
        });
    }

    handleDriftAnalysis(data) {
        if (data.drift_detected) {
            this.addSecurityAlert({
                level: 1,
                message: 'Behavioral drift detected',
                confidence: 0.8,
                recommendations: data.feature_analysis ? ['Monitor behavior changes'] : []
            });
        }
        
        // Update drift chart
        if (this.driftChart && data.feature_analysis) {
            this.updateDriftChart(data.feature_analysis);
        }
    }

    updateAuthenticationDisplay() {
        // Update auth score
        if (this.authScoreEl) {
            this.authScoreEl.textContent = this.currentAuthScore.toFixed(2);
        }
        
        // Update confidence level
        if (this.confidenceLevelEl) {
            this.confidenceLevelEl.textContent = Math.round(this.confidenceLevel) + '%';
        }
        
        // Update anomaly risk
        if (this.anomalyRiskEl) {
            this.anomalyRiskEl.textContent = this.anomalyRisk;
            this.anomalyRiskEl.className = 'metric-value ' + this.anomalyRisk.toLowerCase();
        }
        
        // Update security score
        const newSecurityScore = Math.round(this.currentAuthScore * 100);
        if (this.securityScoreEl && newSecurityScore !== this.securityScore) {
            this.securityScore = newSecurityScore;
            this.securityScoreEl.textContent = this.securityScore;
            this.updateSecurityScoreCircle();
        }
        
        // Update status indicator
        this.updateStatusIndicator();
    }

    updateSecurityScoreCircle() {
        if (this.securityScoreCircle) {
            this.securityScoreCircle.style.setProperty('--score', this.securityScore);
        }
    }

    updateStatusIndicator() {
        const indicator = this.statusIndicator.querySelector('.status-dot');
        
        if (this.currentAuthScore >= 0.8) {
            indicator.style.background = 'var(--secondary-color)';
            this.statusText.textContent = 'Secure';
        } else if (this.currentAuthScore >= 0.6) {
            indicator.style.background = 'var(--accent-color)';
            this.statusText.textContent = 'Monitoring';
        } else {
            indicator.style.background = 'var(--danger-color)';
            this.statusText.textContent = 'Alert';
        }
    }

    addAuthDataToChart(data) {
        if (this.behaviorChart) {
            const chart = this.behaviorChart;
            const now = new Date().toLocaleTimeString();
            
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(data.authenticity_score);
            
            // Keep only last 20 data points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            chart.update('none');
        }
        
        if (this.timeChart) {
            const chart = this.timeChart;
            const now = new Date().toLocaleTimeString();
            
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(data.authenticity_score);
            chart.data.datasets[1].data.push(data.anomaly_score);
            
            // Keep only last 30 data points
            if (chart.data.labels.length > 30) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.update('none');
        }
    }

    updateDriftChart(featureAnalysis) {
        if (!this.driftChart || !featureAnalysis) return;
        
        const keystrokes = featureAnalysis.keystroke || {};
        const mouse = featureAnalysis.mouse || {};
        
        const driftScores = [
            keystrokes.typing_speed_wpm?.drift_score || 0,
            keystrokes.hold_time_mean?.drift_score || 0,
            mouse.velocity_mean?.drift_score || 0,
            mouse.click_duration_mean?.drift_score || 0,
            mouse.movement_efficiency?.drift_score || 0
        ];
        
        this.driftChart.data.datasets[0].data = driftScores;
        this.driftChart.update();
    }

    addSecurityAlert(alert) {
        this.securityAlerts.unshift({
            ...alert,
            id: Date.now(),
            timestamp: new Date(),
            read: false
        });
        
        // Keep only last 50 alerts
        if (this.securityAlerts.length > 50) {
            this.securityAlerts = this.securityAlerts.slice(0, 50);
        }
        
        this.updateNotificationDropdown();
    }

    updateNotificationBadge() {
        const unreadCount = this.securityAlerts.filter(alert => !alert.read).length;
        this.notificationCount = unreadCount;
        
        if (unreadCount > 0) {
            this.notificationBadge.textContent = unreadCount;
            this.notificationBadge.style.display = 'block';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    updateNotificationDropdown() {
        if (this.securityAlerts.length === 0) {
            this.notificationList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-check-circle"></i>
                    <p>No alerts - all systems secure</p>
                </div>
            `;
        } else {
            this.notificationList.innerHTML = this.securityAlerts.slice(0, 10).map(alert => `
                <div class="notification-item ${alert.read ? 'read' : 'unread'}" data-id="${alert.id}">
                    <div class="notification-icon ${this.getAlertLevelClass(alert.level)}">
                        <i class="fas ${this.getAlertIcon(alert.level)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${alert.message}</div>
                        <div class="notification-time">${this.formatRelativeTime(alert.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        }
        
        this.updateNotificationBadge();
    }

    showSecurityAlertModal(alert) {
        this.alertTitle.textContent = `Security Alert - Level ${alert.level}`;
        this.alertMessage.textContent = alert.message;
        
        const details = `
            <div class="alert-detail-item">
                <strong>Confidence:</strong> ${Math.round((alert.confidence || 0) * 100)}%
            </div>
            <div class="alert-detail-item">
                <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            ${alert.recommendations ? `
                <div class="alert-detail-item">
                    <strong>Recommendations:</strong>
                    <ul>
                        ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        this.alertDetails.innerHTML = details;
        this.securityAlertModal.style.display = 'flex';
    }

    showSection(sectionId) {
        // Update navigation
        this.navLinks.forEach(link => {
            link.parentElement.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }
        
        // Show content section
        this.contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`${sectionId}Section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            security: 'Security Status',
            analytics: 'Behavioral Analytics',
            activity: 'Activity Log',
            settings: 'Settings'
        };
        
        this.pageTitle.textContent = titles[sectionId] || 'Dashboard';
        this.currentSection = sectionId;
        
        // Load section-specific data
        switch (sectionId) {
            case 'activity':
                this.loadActivityLog();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'security':
                this.loadSecurityData();
                break;
        }
    }

    toggleNotificationDropdown() {
        const isVisible = this.notificationDropdown.style.display === 'block';
        this.notificationDropdown.style.display = isVisible ? 'none' : 'block';
    }

    markAllNotificationsRead() {
        this.securityAlerts.forEach(alert => alert.read = true);
        this.updateNotificationDropdown();
        this.updateNotificationBadge();
    }

    acknowledgeSecurityAlert() {
        this.securityAlertModal.style.display = 'none';
        // Mark current alert as acknowledged
    }

    investigateSecurityAlert() {
        this.securityAlertModal.style.display = 'none';
        this.showSection('security');
    }

    toggleTestArea() {
        const isVisible = this.testArea.style.display === 'block';
        this.testArea.style.display = isVisible ? 'none' : 'block';
    }

    startBehaviorTest() {
        this.isMonitoring = true;
        this.startTest.disabled = true;
        this.stopTest.disabled = false;
        
        // Clear previous data
        this.behavioralBuffer.keystroke = [];
        this.behavioralBuffer.mouse = [];
        
        console.log('Behavior test started');
    }

    stopBehaviorTest() {
        this.isMonitoring = false;
        this.startTest.disabled = false;
        this.stopTest.disabled = true;
        
        console.log('Behavior test stopped');
    }

    updateConnectionStatus(connected) {
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        if (connected) {
            statusDot.style.background = 'var(--secondary-color)';
            statusDot.style.animation = 'pulse 2s infinite';
        } else {
            statusDot.style.background = 'var(--danger-color)';
            statusDot.style.animation = 'none';
        }
    }

    updateMonitoringStatus(active) {
        const monitorStatus = this.monitorStatus;
        if (monitorStatus) {
            const statusDot = monitorStatus.querySelector('.status-dot');
            const statusText = monitorStatus.querySelector('span');
            
            if (active) {
                statusDot.classList.add('active');
                statusText.textContent = 'Active';
            } else {
                statusDot.classList.remove('active');
                statusText.textContent = 'Inactive';
            }
        }
    }

    updateUserInfo() {
        if (this.sidebarUsername) {
            this.sidebarUsername.textContent = this.username || 'User';
        }
    }

    loadActivityLog() {
        // Simulate loading activity log
        const activities = [
            {
                time: '2 minutes ago',
                type: 'login',
                description: 'User authentication successful',
                risk: 'Low'
            },
            {
                time: '15 minutes ago',
                type: 'anomaly',
                description: 'Unusual typing pattern detected',
                risk: 'Medium'
            },
            {
                time: '1 hour ago',
                type: 'drift',
                description: 'Behavioral drift monitoring started',
                risk: 'Low'
            }
        ];
        
        if (this.activityTableBody) {
            this.activityTableBody.innerHTML = activities.map(activity => `
                <tr>
                    <td>${activity.time}</td>
                    <td>${activity.type}</td>
                    <td>${activity.description}</td>
                    <td><span class="risk-level ${activity.risk.toLowerCase()}">${activity.risk}</span></td>
                    <td><button class="view-details-btn">View</button></td>
                </tr>
            `).join('');
        }
    }

    updateCharts() {
        // Add random data for demonstration
        if (this.patternsChart) {
            const newKeystroke = {
                x: Math.random() * 100,
                y: Math.random() * 100
            };
            const newMouse = {
                x: Math.random() * 100,
                y: Math.random() * 100
            };
            
            this.patternsChart.data.datasets[0].data.push(newKeystroke);
            this.patternsChart.data.datasets[1].data.push(newMouse);
            
            // Keep only last 50 points
            if (this.patternsChart.data.datasets[0].data.length > 50) {
                this.patternsChart.data.datasets[0].data.shift();
                this.patternsChart.data.datasets[1].data.shift();
            }
            
            this.patternsChart.update('none');
        }
    }

    updateGeneralStats() {
        // Update mouse samples count
        if (this.mouseSamplesEl) {
            const current = parseInt(this.mouseSamplesEl.textContent) || 0;
            this.mouseSamplesEl.textContent = current + Math.floor(Math.random() * 5);
        }
    }

    // Utility methods
    getAnomalyRiskLevel(score) {
        if (score < 0.3) return 'Low';
        if (score < 0.7) return 'Medium';
        return 'High';
    }

    getAlertLevelText(level) {
        const levels = ['Info', 'Low', 'Medium', 'High', 'Critical'];
        return levels[level] || 'Unknown';
    }

    getAlertLevelClass(level) {
        const classes = ['info', 'low', 'medium', 'high', 'critical'];
        return classes[level] || 'info';
    }

    getAlertIcon(level) {
        const icons = ['fa-info', 'fa-exclamation', 'fa-exclamation-triangle', 'fa-exclamation-circle', 'fa-times-circle'];
        return icons[level] || 'fa-info';
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    addActivityItem(activity) {
        if (this.recentActivityList) {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <span class="activity-text">${activity.message}</span>
                    <span class="activity-time">${this.formatRelativeTime(new Date(activity.timestamp))}</span>
                </div>
            `;
            
            this.recentActivityList.insertBefore(item, this.recentActivityList.firstChild);
            
            // Keep only last 5 items
            while (this.recentActivityList.children.length > 5) {
                this.recentActivityList.removeChild(this.recentActivityList.lastChild);
            }
        }
    }

    getActivityIcon(type) {
        const icons = {
            login: 'fa-sign-in-alt',
            logout: 'fa-sign-out-alt',
            anomaly: 'fa-exclamation-triangle',
            drift: 'fa-chart-line',
            success: 'fa-check'
        };
        return icons[type] || 'fa-info';
    }

    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clean up intervals
            if (this.authUpdateInterval) clearInterval(this.authUpdateInterval);
            if (this.chartUpdateInterval) clearInterval(this.chartUpdateInterval);
            if (this.statsUpdateInterval) clearInterval(this.statsUpdateInterval);
            if (this.touchFlushInterval)  clearInterval(this.touchFlushInterval);
            
            // Clear local storage and redirect
            localStorage.clear();
            window.location.href = '/login';
        }
    }

    // Placeholder methods for quick actions
    runSecurityCheck() {
        console.log('Running security check...');
        this.addActivityItem({
            type: 'success',
            message: 'Security check completed',
            timestamp: new Date().toISOString()
        });
    }

    updateModels() {
        console.log('Updating behavioral models...');
        this.addActivityItem({
            type: 'success',
            message: 'Behavioral models updated',
            timestamp: new Date().toISOString()
        });
    }

    exportLogs() {
        console.log('Exporting activity logs...');
        // Simulate file download
        const data = 'Activity logs exported at ' + new Date().toISOString();
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'activity-logs.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    updateSettings() {
        console.log('Settings updated');
    }

    loadAnalyticsData() {
        console.log('Loading analytics data...');
    }

    loadSecurityData() {
        console.log('Loading security data...');
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        window.location.href = '/login';
        return;
    }
    
    const dashboardManager = new DashboardManager();
    
    // Handle responsive sidebar
    const handleResize = () => {
        if (window.innerWidth <= 768) {
            dashboardManager.sidebar.classList.remove('open');
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    console.log('🛡️ Behavioral Authentication Dashboard Initialized');
});

// Export for potential use in other modules
window.DashboardManager = DashboardManager;

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();  // Connect to Flask-SocketIO
    const sessionId = localStorage.getItem('session_id');
    const SLIDING_WINDOW_MS = 30000;
    const AUTH_INTERVAL_MS = 5000;

    let keystrokeEvents = [];
    let mouseEvents = [];

    // Emit session join to backend
    socket.emit('join_session', { session_id: sessionId });

    // Listen for input and mouse activity
    document.addEventListener('keydown', e => {
        keystrokeEvents.push({
            key: e.key,
            type: 'keydown',
            timestamp: performance.now()
        });
    });

    document.addEventListener('keyup', e => {
        keystrokeEvents.push({
            key: e.key,
            type: 'keyup',
            timestamp: performance.now()
        });
    });

    document.addEventListener('mousemove', e => {
        mouseEvents.push({
            type: 'move',
            x: e.clientX,
            y: e.clientY,
            timestamp: performance.now()
        });
    });

    document.addEventListener('mousedown', e => {
        mouseEvents.push({
            type: 'mousedown',
            x: e.clientX,
            y: e.clientY,
            timestamp: performance.now()
        });
    });

    document.addEventListener('mouseup', e => {
        mouseEvents.push({
            type: 'mouseup',
            x: e.clientX,
            y: e.clientY,
            timestamp: performance.now()
        });
    });

    setInterval(() => {
        const now = performance.now();
        const start = now - SLIDING_WINDOW_MS;

        const recentKeystrokes = keystrokeEvents.filter(e => e.timestamp >= start);
        const recentMouse = mouseEvents.filter(e => e.timestamp >= start);

        if (recentKeystrokes.length > 5) {
            socket.emit('behavioral_data', {
                type: 'keystroke',
                events: recentKeystrokes,
                timestamp: Date.now()
            });
        }

        if (recentMouse.length > 10) {
            socket.emit('behavioral_data', {
                type: 'mouse',
                events: recentMouse,
                timestamp: Date.now()
            });
        }

        keystrokeEvents = recentKeystrokes;
        mouseEvents = recentMouse;
    }, AUTH_INTERVAL_MS);

    socket.on('auth_result', data => {
        const authScore = data.authenticity_score || 0;
        const confidence = data.confidence || 0;
        const anomaly = data.anomaly_score || 0;

        document.getElementById('authScore').textContent = authScore.toFixed(2);
        document.getElementById('confidenceLevel').textContent = (confidence * 100).toFixed(1) + '%';
        document.getElementById('anomalyRisk').textContent =
            anomaly < 0.3 ? 'Low' : anomaly < 0.7 ? 'Medium' : 'High';

        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusIndicator').querySelector('.status-dot');

        if (authScore >= 0.8) {
            statusText.textContent = 'Authenticated';
            statusDot.className = 'status-dot green';
        } else if (authScore >= 0.6 || anomaly < 0.5) {
            statusText.textContent = 'Risk Detected';
            statusDot.className = 'status-dot yellow';
        } else {
            statusText.textContent = 'High Risk';
            statusDot.className = 'status-dot red';
        }

        // ── Also update the Trust Ring with the auth score ──
        updateTrustRing(authScore);
    });
});

/* =========================================================================
 *  TRUST RING — animated SVG ring, colour by tier, label "Trust: XX%"
 * ========================================================================= */

const RING_CIRCUMFERENCE = 2 * Math.PI * 70; // r = 70 → 439.82

function updateTrustRing(score) {
    const pct      = Math.round(score * 100);
    const offset   = RING_CIRCUMFERENCE * (1 - score);

    // Colour by tier thresholds
    let colour;
    if (score > 0.75) colour = '#10b981';      // green
    else if (score >= 0.45) colour = '#f59e0b'; // amber
    else colour = '#ef4444';                     // red

    const arc   = document.getElementById('trustRingArc');
    const label = document.getElementById('trustPct');
    const badge = document.getElementById('trustTierBadge');

    if (arc) {
        arc.setAttribute('stroke-dashoffset', offset.toFixed(2));
        arc.setAttribute('stroke', colour);
    }
    if (label) label.textContent = pct + '%';

    // Tier badge text + class
    let tierText, tierClass;
    if (score > 0.75) {
        tierText = 'ALLOW'; tierClass = 'tier-allow';
    } else if (score >= 0.45) {
        tierText = 'STEP_UP'; tierClass = 'tier-stepup';
    } else {
        tierText = 'BLOCK'; tierClass = 'tier-block';
    }
    if (badge) {
        badge.textContent = tierText;
        badge.className   = 'trust-tier-badge ' + tierClass;
    }
}

// Refresh the ring every 3 seconds with the latest auth score
setInterval(() => {
    const raw = document.getElementById('authScore');
    if (raw) {
        const val = parseFloat(raw.textContent) || 0;
        updateTrustRing(val);
    }
}, 3000);

// Initial paint
updateTrustRing(0.87);

/* =========================================================================
 *  TRANSFER FORM → POST /api/risk, handle tier response
 * ========================================================================= */

document.getElementById('transferForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const amount        = parseFloat(document.getElementById('transferAmount').value) || 0;
    const recipientType = document.getElementById('recipientType').value;
    const sessionId     = localStorage.getItem('session_id') || '';
    const hour          = new Date().getHours();
    const resultDiv     = document.getElementById('transferResult');

    // Disable button while in-flight
    const btn = document.getElementById('transferBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;"></div> Verifying…';

    try {
        const res = await fetch('/api/risk', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                session_id:         sessionId,
                amount:             amount,
                recipient_type:     recipientType,
                hour:               hour,
                device_seen_before: true      // placeholder for real device fingerprint
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showTransferResult(resultDiv, 'error', data.error || 'Risk check failed');
            return;
        }

        // Update Trust Ring with adjusted score
        updateTrustRing(data.adjusted_score);

        // Render explainability reasons
        renderExplainCard(data.reasons || []);

        // React to tier
        const tier = data.tier || 'ALLOW';
        if (tier === 'ALLOW') {
            showTransferResult(resultDiv, 'success',
                `✅ Approved  —  Trust ${Math.round(data.adjusted_score * 100)}%`);
        } else if (tier === 'STEP_UP') {
            showTransferResult(resultDiv, 'warning',
                `⚠️ Step-Up required  —  Trust ${Math.round(data.adjusted_score * 100)}%`);
            showOtpModal();
        } else {   // BLOCK
            showBlockOverlay(data);
        }
    } catch (err) {
        console.error('Risk call error:', err);
        showTransferResult(resultDiv, 'error', '❌ Network error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> Verify & Send';
    }
});

function showTransferResult(el, type, msg) {
    if (!el) return;
    el.style.display = 'block';
    el.className = type === 'success' ? 'success-message'
                 : type === 'warning' ? 'error-message'   // re-use style, amber colour below
                 : 'error-message';
    if (type === 'warning') {
        el.style.background = 'rgba(245,158,11,0.1)';
        el.style.borderColor = 'rgba(245,158,11,0.3)';
        el.style.color = '#fbbf24';
    }
    el.textContent = msg;
}

/* =========================================================================
 *  EXPLAINABILITY CARD — render top-3 reasons with delta bars
 * ========================================================================= */

function renderExplainCard(reasons) {
    const container = document.getElementById('explainRows');
    if (!container) return;

    if (!reasons || reasons.length === 0) {
        container.innerHTML = `
            <div class="explain-row placeholder-row">
                <span class="explain-label">No deviations detected</span>
                <div class="explain-bar-track"><div class="explain-bar-fill bar-green" style="width:100%"></div></div>
                <span class="explain-delta" style="color:#10b981">✓</span>
            </div>`;
        return;
    }

    container.innerHTML = reasons.map(r => {
        const absPct  = Math.min(Math.abs(r.delta_pct), 100);
        const barCls  = absPct > 50 ? 'bar-red' : absPct > 25 ? 'bar-amber' : 'bar-green';
        const deltaCls = r.delta_pct < 0 ? 'delta-negative' : 'delta-positive';
        const sign     = r.delta_pct >= 0 ? '+' : '';

        return `
            <div class="explain-row">
                <span class="explain-label">${r.label}</span>
                <div class="explain-bar-track">
                    <div class="explain-bar-fill ${barCls}" style="width:${absPct}%"></div>
                </div>
                <span class="explain-delta ${deltaCls}">${sign}${r.delta_pct}%</span>
            </div>`;
    }).join('');
}

/* =========================================================================
 *  OTP STEP-UP MODAL — slide in, blur background, auto-focus digits
 * ========================================================================= */

function showOtpModal() {
    const backdrop = document.getElementById('otpBackdrop');
    if (!backdrop) return;
    backdrop.classList.add('active');

    // Auto-focus first digit
    const digits = backdrop.querySelectorAll('.otp-digit');
    if (digits[0]) digits[0].focus();

    // Auto-advance on input
    digits.forEach((inp, i) => {
        inp.value = '';
        inp.addEventListener('input', () => {
            if (inp.value.length === 1 && i < digits.length - 1) {
                digits[i + 1].focus();
            }
        });
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && inp.value === '' && i > 0) {
                digits[i - 1].focus();
            }
        });
    });
}

function hideOtpModal() {
    const backdrop = document.getElementById('otpBackdrop');
    if (backdrop) backdrop.classList.remove('active');
}

// Submit OTP (mock verification)
document.getElementById('otpSubmitBtn')?.addEventListener('click', () => {
    const digits = document.querySelectorAll('.otp-digit');
    const code   = Array.from(digits).map(d => d.value).join('');
    if (code.length === 6) {
        console.log('OTP submitted:', code);
        hideOtpModal();
        const resultDiv = document.getElementById('transferResult');
        showTransferResult(resultDiv, 'success', '✅ OTP verified — transfer approved');
    }
});

// Resend OTP link
document.getElementById('otpResend')?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('OTP resent');
    alert('A new OTP has been sent to your registered device.');
});

/* =========================================================================
 *  BLOCK OVERLAY — full red overlay, "Session Suspended" card
 * ========================================================================= */

function showBlockOverlay(data) {
    const overlay = document.getElementById('blockOverlay');
    const meta    = document.getElementById('blockMeta');
    if (!overlay) return;

    if (meta && data) {
        meta.innerHTML = `
            <div>Risk Level: <span>${(data.risk_level || 'critical').toUpperCase()}</span></div>
            <div>Anomalies: <span>${data.consecutive_anomalies || '—'}</span></div>`;
    }

    overlay.classList.add('active');
}

// BLOCK overlay → return to login
document.getElementById('blockLogoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
});

/* =========================================================================
 *  🎬  ATTACKER DEMO — hidden key "A" triggers the full sequence
 *  ─────────────────────────────────────────────────────────────────────────
 *  Timeline (8 s total):
 *    0.0s  Ring at 91% green ("browsing normally")
 *    2.0s  Drop to 74% — amber
 *    4.0s  Drop to 58% — amber
 *    6.0s  Drop to 41% — red crossing STEP_UP threshold
 *    8.0s  STEP_UP OTP modal fires + explainability card populates
 *
 *  Press "A" again to reset ring back to 91%.
 * ========================================================================= */

const DEMO_KEYFRAMES = [
    { t: 0,    score: 0.91 },
    { t: 2000, score: 0.74 },
    { t: 4000, score: 0.58 },
    { t: 6000, score: 0.41 },
];

const DEMO_REASONS = [
    { signal: 'flight_time_mean',  delta_pct: -48.2, label: 'Typing rhythm changed' },
    { signal: 'hour_of_day',       delta_pct:  72.0, label: 'Unusual login hour' },
    { signal: 'velocity_mean',     delta_pct:  35.7, label: 'New device pattern' },
];

let demoRunning = false;
let demoTimers  = [];

document.addEventListener('keydown', (e) => {
    // Hidden trigger: uppercase A  (Shift+A  or CapsLock+a)
    if (e.key !== 'A') return;

    // Prevent firing inside form inputs
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (demoRunning) {
        resetDemo();
        return;
    }
    startDemo();
});

function startDemo() {
    demoRunning = true;
    console.log('🎬 DEMO: Attack simulation started — ring will drop over 8 s');

    // Show subtle indicator
    showDemoBanner('🎬 DEMO MODE — simulating session takeover…');

    // Phase 1: paint initial score
    updateTrustRing(0.91);
    document.getElementById('authScore').textContent = '0.91';

    // Phase 2: schedule keyframe drops
    DEMO_KEYFRAMES.forEach(kf => {
        const timer = setTimeout(() => {
            updateTrustRing(kf.score);
            document.getElementById('authScore').textContent = kf.score.toFixed(2);

            // Update the status header
            const statusText = document.getElementById('statusText');
            const statusDot  = document.getElementById('statusIndicator')?.querySelector('.status-dot');
            if (kf.score > 0.75) {
                if (statusText) statusText.textContent = 'Authenticated';
                if (statusDot)  statusDot.className = 'status-dot green';
            } else if (kf.score >= 0.45) {
                if (statusText) statusText.textContent = 'Risk Detected';
                if (statusDot)  statusDot.className = 'status-dot yellow';
            } else {
                if (statusText) statusText.textContent = 'HIGH RISK';
                if (statusDot)  statusDot.className = 'status-dot red';
            }

            console.log(`🎬 DEMO: score → ${kf.score}`);
        }, kf.t);
        demoTimers.push(timer);
    });

    // Phase 3: after the last drop, fire STEP_UP + explainability
    const finalTimer = setTimeout(() => {
        // Populate explainability card
        renderExplainCard(DEMO_REASONS);

        // Fire OTP modal
        showOtpModal();

        showDemoBanner('🔒 STEP_UP fired — attacker cannot provide OTP');

        // Push flagged session to admin (via localStorage so admin.js picks it up)
        pushDemoFlaggedSession();

        console.log('🎬 DEMO: STEP_UP modal fired. Attacker locked out.');
    }, 8000);
    demoTimers.push(finalTimer);
}

function resetDemo() {
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
    demoRunning = false;
    hideOtpModal();

    updateTrustRing(0.91);
    document.getElementById('authScore').textContent = '0.91';

    const statusText = document.getElementById('statusText');
    const statusDot  = document.getElementById('statusIndicator')?.querySelector('.status-dot');
    if (statusText) statusText.textContent = 'Authenticated';
    if (statusDot)  statusDot.className = 'status-dot green';

    // Reset explainability card
    renderExplainCard([]);

    hideDemoBanner();
    console.log('🎬 DEMO: Reset to normal (91% green)');
}

/* ── Push a flagged session to admin page via localStorage ── */
function pushDemoFlaggedSession() {
    const flagged = {
        id:       'sess_DEMO_' + Date.now().toString(36),
        user:     localStorage.getItem('username') || 'demo_user',
        time:     new Date().toLocaleString('sv-SE').replace('T', ' '),
        score:    0.41,
        tier:     'STEP_UP',
        anomalies: 3,
        status:   'otp_pending',
        timeline: [0.91, 0.88, 0.82, 0.74, 0.65, 0.58, 0.49, 0.41],
        reasons:  DEMO_REASONS
    };
    // Store for admin.js to pick up
    const existing = JSON.parse(localStorage.getItem('demo_flagged_sessions') || '[]');
    existing.unshift(flagged);
    localStorage.setItem('demo_flagged_sessions', JSON.stringify(existing));
}

/* ── Subtle floating banner ── */
function showDemoBanner(text) {
    let banner = document.getElementById('demoBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'demoBanner';
        banner.style.cssText = `
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: rgba(99,102,241,0.9); color: #fff;
            padding: 10px 28px; border-radius: 999px;
            font-size: 0.85rem; font-weight: 600; letter-spacing: 0.5px;
            z-index: 9999; backdrop-filter: blur(8px);
            box-shadow: 0 4px 24px rgba(99,102,241,0.4);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        document.body.appendChild(banner);
    }
    banner.textContent = text;
    banner.style.opacity = '1';
}

function hideDemoBanner() {
    const banner = document.getElementById('demoBanner');
    if (banner) banner.style.opacity = '0';
}
