// PsyFi web shell — progressive enhancement on the existing FastAPI static UI.

const SESSION_STORAGE_KEY = 'psyfi.session.v1.last';
const RECOVERY_DISMISS_KEY = 'psyfi.session.v1.recovery_dismissed';
const DB_NAME = 'psyfi-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const API_V1 = '/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulationForm');
    const runButton = document.getElementById('runButton');
    const cancelButton = document.getElementById('cancelButton');
    const installButton = document.getElementById('installButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingStatus = document.getElementById('loadingStatus');
    const errorPanel = document.getElementById('errorPanel');
    const networkStatus = document.getElementById('networkStatus');
    const substanceSelect = document.getElementById('substancePreset');
    const substanceGrid = document.getElementById('substanceGrid');
    const presetEmpty = document.getElementById('presetEmpty');
    const resultsEmpty = document.getElementById('resultsEmpty');
    const resultsContent = document.getElementById('resultsContent');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const canvas2d = document.getElementById('fieldCanvas');
    const canvasGpu = document.getElementById('fieldCanvasGPU');
    const vizBackend = document.getElementById('vizBackend');
    const recoveryBanner = document.getElementById('recoveryBanner');
    const preferWebGPU = document.getElementById('preferWebGPU');
    const importSessionInput = document.getElementById('importSessionInput');

    let lastPayload = null;
    let activeAbort = null;
    let activeJobId = null;
    let cancelRequested = false;
    let recoveryRecord = null;
    let deferredInstallPrompt = null;

    const gridPresets = {
        quick: { width: 32, height: 32, steps: 10, resolution: '32x32' },
        standard: { width: 64, height: 64, steps: 20, resolution: '64x64' },
        detailed: { width: 128, height: 128, steps: 50, resolution: '128x128' },
        deep: { width: 256, height: 256, steps: 100, resolution: '256x256' },
    };
    const resolutionSelect = document.getElementById('resolutionSelect');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');

    function syncResolutionSelectFromInputs() {
        if (!resolutionSelect || !widthInput || !heightInput) return;
        const key = `${widthInput.value}x${heightInput.value}`;
        const known = ['32x32', '64x64', '128x128', '256x256', '512x512'];
        resolutionSelect.value = known.includes(key) ? key : 'custom';
    }

    function applyResolutionSelection(value, { syncSteps } = { syncSteps: true }) {
        if (window.PsyFiViz && typeof window.PsyFiViz.applyFieldResolution === 'function' && value !== 'custom') {
            window.PsyFiViz.applyFieldResolution(value, { syncSteps });
            return;
        }
        const map = {
            '32x32': gridPresets.quick,
            '64x64': gridPresets.standard,
            '128x128': gridPresets.detailed,
            '256x256': gridPresets.deep,
            '512x512': { width: 512, height: 512, steps: 100 },
        };
        const preset = map[value];
        if (!preset) return;
        if (widthInput) widthInput.value = String(preset.width);
        if (heightInput) heightInput.value = String(preset.height);
        if (syncSteps) {
            const stepsEl = document.getElementById('steps');
            if (stepsEl) stepsEl.value = String(preset.steps);
        }
        if (resolutionSelect) resolutionSelect.value = value;
    }

    function setHidden(el, hidden) {
        if (!el) return;
        el.hidden = hidden;
    }

    let loadingWatchdog = 0;

    function showLoading(show, statusText) {
        setHidden(loadingOverlay, !show);
        if (loadingOverlay) {
            loadingOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
        }
        runButton.disabled = show;
        if (cancelButton) {
            setHidden(cancelButton, !show);
            cancelButton.disabled = !show;
        }
        const dismissBtn = document.getElementById('loadingDismissBtn');
        if (dismissBtn) setHidden(dismissBtn, !show);
        if (loadingStatus && statusText) {
            loadingStatus.textContent = statusText;
        } else if (loadingStatus && show) {
            loadingStatus.textContent = 'Computing consciousness field…';
        }
        if (loadingWatchdog) {
            clearTimeout(loadingWatchdog);
            loadingWatchdog = 0;
        }
        // Never leave the overlay stuck if a job poll hangs.
        if (show) {
            loadingWatchdog = setTimeout(() => {
                showLoading(false);
                showError('Simulation timed out. Dismissed the loading overlay — try a smaller grid or fewer steps.');
                cancelRequested = true;
                if (activeJobId) {
                    fetch(`${API_V1}/jobs/${activeJobId}`, { method: 'DELETE' }).catch(() => {});
                }
            }, 90000);
        }
    }

    document.getElementById('loadingDismissBtn')?.addEventListener('click', () => {
        cancelRequested = true;
        if (activeAbort) activeAbort.abort();
        if (activeJobId) {
            fetch(`${API_V1}/jobs/${activeJobId}`, { method: 'DELETE' }).catch(() => {});
        }
        showLoading(false);
        showError('Loading dismissed. No result was applied.');
    });

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        setHidden(errorPanel, false);
    }

    function hideError() {
        setHidden(errorPanel, true);
    }

    function updateNetworkStatus() {
        if (!networkStatus) return;
        if (navigator.onLine) {
            networkStatus.dataset.state = 'online';
            networkStatus.textContent = 'Online — server computation available';
        } else {
            networkStatus.dataset.state = 'offline';
            networkStatus.textContent = 'Offline — server simulations unavailable; history restore still works';
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    document.querySelectorAll('.preset-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const preset = gridPresets[button.dataset.preset];
            if (!preset) return;
            document.getElementById('width').value = preset.width;
            document.getElementById('height').value = preset.height;
            document.getElementById('steps').value = preset.steps;
            document.querySelectorAll('.preset-btn').forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            if (resolutionSelect) resolutionSelect.value = preset.resolution || 'custom';
            try {
                sessionStorage.setItem('psyfi.resolution.v1', preset.resolution || 'custom');
            } catch (_e) {
                /* ignore */
            }
        });
    });

    resolutionSelect?.addEventListener('change', () => {
        if (resolutionSelect.value === 'custom') return;
        applyResolutionSelection(resolutionSelect.value, { syncSteps: true });
    });
    widthInput?.addEventListener('change', syncResolutionSelectFromInputs);
    heightInput?.addEventListener('change', syncResolutionSelectFromInputs);
    window.addEventListener('psyfi:resolution-change', () => syncResolutionSelectFromInputs());
    syncResolutionSelectFromInputs();

    function normalizeValue(value, min, max) {
        return (value - min) / (max - min);
    }

    function updateMetric(name, value, barValue) {
        const valueElement = document.getElementById(name);
        valueElement.textContent = value.toFixed(3);
        document.getElementById(`${name}Bar`).style.width =
            `${Math.max(0, Math.min(100, barValue * 100))}%`;
        if (name === 'valence') {
            valueElement.style.color = value > 0
                ? 'var(--color-signal-primary)'
                : 'var(--color-signal-secondary)';
        }
    }

    async function renderVisualization(visualization) {
        const summary = document.getElementById('vizSummary');
        if (summary) {
            summary.textContent = visualization?.accessibility?.summary || '';
        }
        if (!window.PsyFiRenderer) {
            return;
        }
        const result = await window.PsyFiRenderer.renderVisualization({
            canvas2d,
            canvasGpu,
            visualization,
            preferWebGPU: !preferWebGPU || preferWebGPU.checked,
        });
        if (vizBackend) {
            vizBackend.textContent = `Renderer: ${result.backend}` +
                (result.lastError ? ` (fallback note: ${result.lastError})` : '');
        }
    }

    async function showResults(data) {
        lastPayload = data;
        window.PsyFiLastSim = {
            payload: data,
            width: data.width,
            height: data.height,
            seed: data.seed,
            preset: data.preset || null,
            substance: data.preset || data.session?.preset || null,
            provenance_id: data.provenance_id,
            visualization: data.visualization || null,
        };
        setHidden(resultsEmpty, true);
        setHidden(resultsContent, false);

        document.getElementById('fieldDimensions').textContent =
            `${data.width} × ${data.height}`;
        updateMetric('valence', data.valence, normalizeValue(data.valence, -1, 1));
        updateMetric('coherence', data.coherence, data.coherence);
        updateMetric('symmetry', data.symmetry, data.symmetry);
        updateMetric('roughness', data.roughness, data.roughness);
        updateMetric('richness', data.richness, data.richness);

        document.getElementById('resultSeed').textContent = data.seed ?? '--';
        document.getElementById('resultPreset').textContent = data.preset || data.session?.preset || 'none';
        document.getElementById('resultProvenance').textContent = data.provenance_id ?? '--';
        document.getElementById('resultModules').textContent =
            (data.module_chain || []).join(' → ') || '--';

        await renderVisualization(data.visualization);
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                ...data,
                interrupted: false,
            }));
        } catch (error) {
            console.warn('[PsyFi] localStorage unavailable:', error);
        }
    }

    async function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('updated_at', 'updated_at');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveHistoryRecord(payload) {
        if (!payload?.session) throw new Error('No session available to save');
        const db = await openDb();
        const record = {
            id: payload.session.provenance.id,
            updated_at: payload.session.updated_at || new Date().toISOString(),
            session: payload.session,
            visualization: payload.visualization || null,
            metrics: {
                valence: payload.valence,
                coherence: payload.coherence,
                symmetry: payload.symmetry,
                roughness: payload.roughness,
                richness: payload.richness,
            },
            width: payload.width,
            height: payload.height,
            seed: payload.seed,
            preset: payload.preset || null,
            module_chain: payload.module_chain || [],
            provenance_id: payload.provenance_id,
        };
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
        await refreshHistory();
        return record;
    }

    async function listHistory() {
        try {
            const db = await openDb();
            const records = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const request = tx.objectStore(STORE_NAME).getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
            db.close();
            return records.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
        } catch (error) {
            console.warn('[PsyFi] IndexedDB unavailable:', error);
            return [];
        }
    }

    function applyRecordToForm(record) {
        if (!record?.session?.parameters) return;
        document.getElementById('width').value = record.session.parameters.width;
        document.getElementById('height').value = record.session.parameters.height;
        document.getElementById('steps').value = record.session.parameters.steps;
        document.getElementById('seed').value = record.seed;
        if (record.preset) substanceSelect.value = record.preset;
    }

    function recordToPayload(record) {
        return {
            width: record.width,
            height: record.height,
            valence: record.metrics.valence,
            coherence: record.metrics.coherence,
            symmetry: record.metrics.symmetry,
            roughness: record.metrics.roughness,
            richness: record.metrics.richness,
            seed: record.seed,
            preset: record.preset,
            provenance_id: record.provenance_id,
            module_chain: record.module_chain,
            session: record.session,
            visualization: record.visualization,
        };
    }

    async function refreshHistory() {
        const records = await listHistory();
        historyList.innerHTML = '';
        setHidden(historyEmpty, records.length > 0);
        records.forEach((record) => {
            const item = document.createElement('li');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-title">
                    <span class="pf-icon pf-icon-console" aria-hidden="true"></span>
                    <strong>${record.width}×${record.height}</strong>
                    · seed <code>${record.seed}</code>
                    · ${record.preset || 'no preset'}
                </div>
                <div class="history-meta">${record.id} · valence ${Number(record.metrics?.valence || 0).toFixed(3)}</div>
                <button type="button" class="btn-secondary history-restore">Restore</button>
            `;
            item.querySelector('.history-restore').addEventListener('click', async () => {
                applyRecordToForm(record);
                await showResults(recordToPayload(record));
                hideError();
            });
            historyList.appendChild(item);
        });
    }

    async function clearHistory() {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
        await refreshHistory();
    }

    async function loadPresets() {
        try {
            const response = await fetch(`${API_V1}/presets/`);
            if (!response.ok) throw new Error(`Preset catalog failed (${response.status})`);
            const data = await response.json();
            substanceSelect.innerHTML = '<option value="">None (baseline coupling)</option>';
            substanceGrid.innerHTML = '';
            data.presets.forEach((preset) => {
                const option = document.createElement('option');
                option.value = preset.id;
                option.textContent = `${preset.name} (${preset.substance_class})`;
                substanceSelect.appendChild(option);

                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'substance-card';
                card.innerHTML = `
                    <span class="preset-name">${preset.name}</span>
                    <span class="preset-desc">${preset.substance_class}</span>
                `;
                card.addEventListener('click', () => {
                    substanceSelect.value = preset.id;
                    document.querySelectorAll('.substance-card').forEach((el) => el.classList.remove('active'));
                    card.classList.add('active');
                });
                substanceGrid.appendChild(card);
            });
            setHidden(presetEmpty, true);
            setHidden(substanceGrid, false);
        } catch (error) {
            presetEmpty.textContent = `Preset catalog unavailable: ${error.message}`;
            setHidden(presetEmpty, false);
            setHidden(substanceGrid, true);
        }
    }

    function renderCapabilities() {
        const renderer = window.PsyFiRenderer ? window.PsyFiRenderer.getRendererState() : {};
        const sensors =
            (window.PsyFiViz && window.PsyFiViz.probeSensorCapabilities
                ? window.PsyFiViz.probeSensorCapabilities()
                : {}) || {};
        const monitor =
            window.PsyFiViz && typeof window.PsyFiViz.probeMonitor === 'function'
                ? window.PsyFiViz.probeMonitor()
                : { ok: !!(window.screen && window.screen.width), detail: 'screen metrics' };
        const gpuCache = window.__psyfiGpuProbe || null;
        const rows = [
            {
                name: 'Monitor / display',
                supported: !!monitor.ok,
                fallback: monitor.detail || 'Display metrics unavailable',
            },
            {
                name: 'GPU adapter',
                supported: !!(gpuCache ? gpuCache.ok : renderer.webgpuSupported),
                fallback: gpuCache
                    ? gpuCache.detail
                    : renderer.webgpuSupported
                      ? 'WebGPU feature present — open <a href="/gpu/">GPU Lab</a>'
                      : 'Worker + Canvas 2D · GPU Lab unavailable',
            },
            { name: 'Canvas 2D', supported: !!(canvas2d && canvas2d.getContext), fallback: 'Metrics/provenance text only' },
            { name: 'Web Worker rasterizer', supported: !!renderer.workerSupported, fallback: 'Main-thread Canvas rasterize' },
            { name: 'WebGL', supported: !!document.createElement('canvas').getContext('webgl'), fallback: 'Canvas 2D baseline renderer' },
            {
                name: 'WebGPU',
                supported: !!(gpuCache ? gpuCache.webgpu : renderer.webgpuSupported),
                fallback: (gpuCache ? gpuCache.webgpu : renderer.webgpuSupported)
                    ? 'Open <a href="/gpu/">GPU Lab</a> (separate /gpu/ route)'
                    : 'Worker + Canvas 2D · GPU Lab unavailable',
            },
            { name: 'IndexedDB', supported: !!window.indexedDB, fallback: 'localStorage last-session only' },
            { name: 'Service Worker', supported: 'serviceWorker' in navigator, fallback: 'Online-only shell caching' },
            { name: 'Web MIDI', supported: !!sensors.webMidi, fallback: 'REST MIDI routes when server has devices' },
            { name: 'Camera (getUserMedia)', supported: !!sensors.camera, fallback: 'Manual camera modulator slider' },
            { name: 'Microphone (getUserMedia)', supported: !!sensors.microphone, fallback: 'Manual audio modulator slider' },
            {
                name: 'DeviceMotion',
                supported: !!sensors.deviceMotion,
                fallback: sensors.motionNeedsGesture
                    ? 'Needs user gesture / permission'
                    : 'Manual motion slider',
            },
            {
                name: 'DeviceOrientation',
                supported: !!sensors.deviceOrientation,
                fallback: sensors.orientationNeedsGesture
                    ? 'Needs user gesture / permission'
                    : 'Blended into motion channel when enabled',
            },
            { name: 'AmbientLightSensor', supported: !!sensors.ambientLight, fallback: 'Camera luminance proxy / manual slider' },
            { name: 'Gamepad', supported: !!sensors.gamepad, fallback: 'Manual motion slider' },
            { name: 'Vibration / Haptics', supported: !!sensors.vibrate, fallback: 'Visual state feedback only' },
            { name: 'Battery Status', supported: !!sensors.battery, fallback: 'Used for GPU quality tier only — not a field modulator' },
            { name: 'Geolocation', supported: !!sensors.geolocation, fallback: 'Not used as a modulator (privacy)' },
            { name: 'AbortController cancel', supported: typeof AbortController !== 'undefined', fallback: 'Wait for request completion' },
            {
                name: 'GPU Lab route',
                supported: true,
                fallback: '<a href="/gpu/">/gpu/</a> · not embedded in shell (see docs/PWA_GPU_ROUTE.md)',
            },
        ];
        const tbody = document.querySelector('#capabilityTable tbody');
        tbody.innerHTML = '';
        rows.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.name}</td>
                <td data-ok="${row.supported}">${row.supported ? 'yes' : 'no'}</td>
                <td>${row.fallback}</td>
            `;
            tbody.appendChild(tr);
        });
        renderSensorChips(sensors);
        syncSensorButtons(sensors);
    }

    function renderSensorChips(sensors) {
        const row = document.getElementById('sensorChipRow');
        if (!row) return;
        const chips = [
            ['Camera', sensors.camera],
            ['Mic', sensors.microphone],
            ['Motion', sensors.deviceMotion],
            ['Orientation', sensors.deviceOrientation],
            ['Web MIDI', sensors.webMidi],
            ['Gamepad', sensors.gamepad],
            ['Ambient', sensors.ambientLight],
            ['Haptics', sensors.vibrate],
        ];
        row.innerHTML = chips
            .map(
                ([label, ok]) =>
                    `<span class="sensor-chip" data-ok="${!!ok}">${label}: ${ok ? 'available' : 'unavailable'}</span>`,
            )
            .join('');
    }

    function syncSensorButtons(sensors) {
        const map = [
            ['enableCameraBtn', sensors.camera],
            ['enableAudioBtn', sensors.microphone],
            ['enableMotionBtn', sensors.deviceMotion || sensors.deviceOrientation],
            ['enableMidiBtn', sensors.webMidi],
            ['enableGamepadBtn', sensors.gamepad],
            ['enableAmbientBtn', sensors.ambientLight],
            ['enableHapticsBtn', sensors.vibrate],
        ];
        map.forEach(([id, ok]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.disabled = !ok;
            btn.title = ok ? '' : 'Not available on this device/browser';
        });
    }

    async function maybeShowRecoveryBanner() {
        if (!recoveryBanner) return;
        if (sessionStorage.getItem(RECOVERY_DISMISS_KEY) === '1') {
            setHidden(recoveryBanner, true);
            return;
        }
        const history = await listHistory();
        if (history[0]) {
            recoveryRecord = history[0];
        } else {
            try {
                const raw = localStorage.getItem(SESSION_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.session) {
                        recoveryRecord = {
                            width: parsed.width || parsed.session.parameters.width,
                            height: parsed.height || parsed.session.parameters.height,
                            seed: parsed.seed || parsed.session.seed,
                            preset: parsed.preset || parsed.session.preset,
                            provenance_id: parsed.provenance_id || parsed.session.provenance.id,
                            module_chain: parsed.module_chain || parsed.session.provenance.module_chain,
                            metrics: parsed.metrics || parsed.session.result?.metrics,
                            session: parsed.session,
                            visualization: parsed.visualization || null,
                        };
                    }
                }
            } catch (error) {
                console.warn('[PsyFi] recovery parse failed', error);
            }
        }
        if (recoveryRecord?.session) {
            document.getElementById('recoveryText').textContent =
                `Recover session ${recoveryRecord.provenance_id || recoveryRecord.id} ` +
                `(${recoveryRecord.width}×${recoveryRecord.height}, seed ${recoveryRecord.seed})?`;
            setHidden(recoveryBanner, false);
        }
    }

    async function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function runViaJob(body) {
        showLoading(true, 'Queueing simulation job…');
        const create = await fetch(`${API_V1}/jobs/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!create.ok) {
            const errorData = await create.json().catch(() => ({}));
            throw new Error(errorData.detail || `Job create failed (${create.status})`);
        }
        const created = await create.json();
        activeJobId = created.id;
        showLoading(true, `Job ${activeJobId} running…`);

        const started = Date.now();
        while (true) {
            if (Date.now() - started > 85000) {
                throw new Error('Simulation job timed out');
            }
            if (cancelRequested && activeJobId) {
                await fetch(`${API_V1}/jobs/${activeJobId}`, { method: 'DELETE' });
            }
            const poll = await fetch(`${API_V1}/jobs/${activeJobId}`);
            if (!poll.ok) throw new Error(`Job poll failed (${poll.status})`);
            const job = await poll.json();
            showLoading(true, `Job ${activeJobId}: ${job.status}`);
            if (job.status === 'completed' && job.result) {
                return job.result;
            }
            if (job.status === 'cancelled') {
                const err = new Error(job.error || 'Simulation cancelled');
                err.name = 'AbortError';
                throw err;
            }
            if (job.status === 'failed') {
                throw new Error(job.error || 'Simulation job failed');
            }
            await sleep(120);
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!navigator.onLine) {
            showError('Server simulation requires network connectivity. Restore a history item to inspect prior results offline.');
            return;
        }

        const width = parseInt(document.getElementById('width').value, 10);
        const height = parseInt(document.getElementById('height').value, 10);
        const steps = parseInt(document.getElementById('steps').value, 10);
        const seed = parseInt(document.getElementById('seed').value, 10);
        const preset = substanceSelect.value || null;

        cancelRequested = false;
        activeJobId = null;
        if (activeAbort) activeAbort.abort();
        activeAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;

        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                interrupted: true,
                width, height, steps, seed, preset,
                updated_at: new Date().toISOString(),
            }));
        } catch (_error) { /* ignore */ }

        showLoading(true);
        hideError();

        try {
            const body = { width, height, steps, seed };
            if (preset) body.preset = preset;

            // Job API enables true server-side cancellation via should_cancel.
            const data = await runViaJob(body);
            if (cancelRequested) {
                const err = new Error('Simulation cancelled');
                err.name = 'AbortError';
                throw err;
            }
            await showResults(data);
            try {
                await saveHistoryRecord(data);
            } catch (error) {
                console.warn('[PsyFi] History save skipped:', error);
            }
        } catch (error) {
            if (error && error.name === 'AbortError') {
                showError('Simulation cancelled on the server. No result was applied.');
            } else {
                showError(error.message || String(error));
            }
        } finally {
            activeAbort = null;
            activeJobId = null;
            cancelRequested = false;
            showLoading(false);
        }
    });

    cancelButton?.addEventListener('click', async () => {
        cancelRequested = true;
        if (activeAbort) activeAbort.abort();
        if (activeJobId) {
            try {
                await fetch(`${API_V1}/jobs/${activeJobId}`, { method: 'DELETE' });
            } catch (_error) { /* ignore */ }
        }
    });

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        setHidden(installButton, false);
    });

    installButton?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
            showError('Install is unavailable in this browser. On iPhone use Share → Add to Home Screen.');
            return;
        }
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        setHidden(installButton, true);
    });

    importSessionInput?.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const session = JSON.parse(text);
            if (!session || session.schema_version !== 'psyfi.session.v1' || !session.parameters) {
                throw new Error('File is not a psyfi.session.v1 document');
            }
            const payload = {
                width: session.parameters.width,
                height: session.parameters.height,
                valence: session.result?.metrics?.valence ?? 0,
                coherence: session.result?.metrics?.coherence ?? 0,
                symmetry: session.result?.metrics?.symmetry ?? 0,
                roughness: session.result?.metrics?.roughness ?? 0,
                richness: session.result?.metrics?.richness ?? 0,
                seed: session.seed,
                preset: session.preset,
                provenance_id: session.provenance?.id,
                module_chain: session.provenance?.module_chain || [],
                session,
                visualization: null,
            };
            applyRecordToForm(payload);
            await showResults(payload);
            hideError();
        } catch (error) {
            showError(`Import failed: ${error.message || error}`);
        } finally {
            importSessionInput.value = '';
        }
    });

    document.getElementById('exportSessionButton')?.addEventListener('click', () => {
        const session = lastPayload?.session;
        if (!session) {
            showError('No session available to export. Run a simulation first.');
            return;
        }
        const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `psyfi-session-${session.provenance?.id || 'export'}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('saveHistoryButton')?.addEventListener('click', async () => {
        try {
            await saveHistoryRecord(lastPayload);
            hideError();
        } catch (error) {
            showError(error.message);
        }
    });

    document.getElementById('clearHistoryButton')?.addEventListener('click', async () => {
        try {
            await clearHistory();
        } catch (error) {
            showError(error.message);
        }
    });

    document.getElementById('recoveryRestore')?.addEventListener('click', async () => {
        if (!recoveryRecord) return;
        applyRecordToForm(recoveryRecord);
        if (recoveryRecord.metrics) {
            await showResults(recordToPayload(recoveryRecord));
        }
        setHidden(recoveryBanner, true);
        sessionStorage.setItem(RECOVERY_DISMISS_KEY, '1');
        hideError();
    });

    document.getElementById('recoveryDismiss')?.addEventListener('click', () => {
        setHidden(recoveryBanner, true);
        sessionStorage.setItem(RECOVERY_DISMISS_KEY, '1');
    });

    preferWebGPU?.addEventListener('change', async () => {
        if (lastPayload?.visualization) {
            await renderVisualization(lastPayload.visualization);
        }
        renderCapabilities();
    });

    const telemetryOptIn = document.getElementById('telemetryOptIn');
    telemetryOptIn?.addEventListener('change', async () => {
        try {
            await fetch(`${API_V1}/telemetry/opt-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opt_in: !!telemetryOptIn.checked }),
            });
        } catch (error) {
            console.warn('[PsyFi] telemetry opt-in failed', error);
        }
    });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
        if (event.key === 'Escape') {
            cancelRequested = true;
            if (activeAbort) activeAbort.abort();
            if (activeJobId) {
                fetch(`${API_V1}/jobs/${activeJobId}`, { method: 'DELETE' }).catch(() => {});
            }
        }
    });

    // Explicit offline empty-state copy for results when never run + offline.
    if (!navigator.onLine && resultsEmpty) {
        resultsEmpty.textContent = 'You are offline. Restore a history item or import a session JSON to inspect prior modeled results.';
    }

    // Service worker update nudge
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] New service worker activated');
        });
    }

    loadPresets();
    refreshHistory().then(maybeShowRecoveryBanner);
    renderCapabilities();

    // Splash finished (or skipped) — refresh capability/sensor UI against final probes.
    window.PsyFiBoot = window.PsyFiBoot || {};
    window.PsyFiBoot.onLaunchReady = function onLaunchReady(results) {
        const gpu = Array.isArray(results) ? results.find((r) => r.id === 'gpu') : null;
        if (gpu && gpu.raw) window.__psyfiGpuProbe = gpu.raw;
        renderCapabilities();
        syncResolutionSelectFromInputs();
    };
    window.addEventListener('psyfi:launch-ready', async (event) => {
        const results = event.detail && event.detail.results;
        const gpu = Array.isArray(results) ? results.find((r) => r.id === 'gpu') : null;
        if (gpu && gpu.raw) {
            window.__psyfiGpuProbe = gpu.raw;
        } else if (window.PsyFiViz && typeof window.PsyFiViz.probeGpu === 'function') {
            window.__psyfiGpuProbe = await window.PsyFiViz.probeGpu();
        }
        renderCapabilities();
        syncResolutionSelectFromInputs();
    });
    // If splash already entered before this handler bound, sync once.
    if (!document.body.classList.contains('launch-pending')) {
        if (window.PsyFiViz && typeof window.PsyFiViz.probeGpu === 'function') {
            window.PsyFiViz.probeGpu().then((gpu) => {
                window.__psyfiGpuProbe = gpu;
                renderCapabilities();
            });
        } else {
            renderCapabilities();
        }
    }
});

// ===== Live Experience workspace =====
(function initExperienceWorkspace() {
    const canvas = document.getElementById('experienceCanvas');
    const glCanvas = document.getElementById('experienceCanvasGL');
    if (!canvas || !window.PsyFiViz || !window.PsyFiViz.ExperiencePlayer) {
        console.warn('[PsyFi] Experience player not available');
        return;
    }

    const substanceSelect = document.getElementById('substanceSelect');
    const experienceSelect = document.getElementById('experienceSelect');
    const modeSelect = document.getElementById('modeSelect');
    const intensityRange = document.getElementById('intensityRange');
    const intensityValue = document.getElementById('intensityValue');
    const seedInput = document.getElementById('seedInput');
    const phaseScrub = document.getElementById('phaseScrub');
    const phaseLabel = document.getElementById('phaseLabel');
    const reduceMotionChk = document.getElementById('reduceMotionChk');
    const dimFlashChk = document.getElementById('dimFlashChk');
    const preferWebGLChk = document.getElementById('preferWebGLChk');
    const sourcePlaneChk = document.getElementById('sourcePlaneChk');
    const sourcePlaneMix = document.getElementById('sourcePlaneMix');
    const sourcePlaneMixValue = document.getElementById('sourcePlaneMixValue');
    const sourcePlaneMixGroup = document.getElementById('sourcePlaneMixGroup');
    const loadBtn = document.getElementById('loadExperienceBtn');
    const playBtn = document.getElementById('playExperienceBtn');
    const pauseBtn = document.getElementById('pauseExperienceBtn');
    const neutralBtn = document.getElementById('neutralBtn');
    const statusEl = document.getElementById('experienceStatus');
    function syncFieldStatusLive(msg) {
        if (!statusEl) return;
        const t = String(msg || '');
        const live = /running|loading|bridging|Computing|Playing|timeline/i.test(t)
            && !/idle|paused|failed|Neutral/i.test(t);
        statusEl.dataset.live = live ? 'true' : 'false';
    }
    if (statusEl && typeof MutationObserver !== 'undefined') {
        syncFieldStatusLive(statusEl.textContent);
        new MutationObserver(() => syncFieldStatusLive(statusEl.textContent)).observe(statusEl, {
            characterData: true,
            childList: true,
            subtree: true,
        });
    }

    const provenanceEl = document.getElementById('experienceProvenancePanel');
    const modCamera = document.getElementById('modCamera');
    const modMotion = document.getElementById('modMotion');
    const modMidi = document.getElementById('modMidi');
    const modAudio = document.getElementById('modAudio');
    const modHaptics = document.getElementById('modHaptics');
    let lastBridgeField = null;

    function syncSourcePlaneUI() {
        const on = !!(sourcePlaneChk && sourcePlaneChk.checked && lastBridgeField);
        if (sourcePlaneMixGroup) sourcePlaneMixGroup.hidden = !on;
        if (!on) {
            player.clearSourcePlane();
            return;
        }
        const mix = sourcePlaneMix ? Number(sourcePlaneMix.value) : 0.32;
        if (sourcePlaneMixValue) sourcePlaneMixValue.textContent = mix.toFixed(2);
        player.setSourcePlane(lastBridgeField, mix);
    }

    const player = new PsyFiViz.ExperiencePlayer({
        canvas,
        glCanvas,
        statusEl,
        provenanceEl,
        preferWebGL: !!(preferWebGLChk && preferWebGLChk.checked),
    });
    const viewportResolutionSelect = document.getElementById('viewportResolutionSelect');
    if (viewportResolutionSelect) {
        player.setViewportResolution(viewportResolutionSelect.value);
        viewportResolutionSelect.addEventListener('change', () => {
            player.setViewportResolution(viewportResolutionSelect.value);
        });
    } else {
        player.resize();
    }
    window.addEventListener('resize', () => player.resize());

    // Optional: poll server MIDI activity into the MIDI modulator slider (fallback if no Web MIDI)
    let midiPoll = null;
    function startMidiPoll() {
        if (midiPoll) return;
        if (sensorHub && sensorHub.active && sensorHub.active.webMidi) return;
        midiPoll = setInterval(async () => {
            try {
                const res = await fetch('/api/v1/midi/status');
                if (!res.ok) return;
                const st = await res.json();
                if (!st.running || !modMidi) return;
                const level = typeof st.activity === 'number' ? st.activity : 0.35;
                modMidi.value = Math.min(1, Math.max(Number(modMidi.value), level)).toFixed(2);
                syncModulators();
            } catch (_e) { /* ignore */ }
        }, 1200);
    }
    document.getElementById('modMidi')?.addEventListener('pointerdown', startMidiPoll);

    const sensorHub =
        window.PsyFiViz && window.PsyFiViz.DeviceSensorHub
            ? new window.PsyFiViz.DeviceSensorHub({
                  status: (msg) => {
                      if (statusEl) statusEl.textContent = msg;
                  },
                  onChannels: (ch) => {
                      if (modCamera) modCamera.value = Number(ch.camera || 0).toFixed(2);
                      if (modMotion) modMotion.value = Number(ch.motion || 0).toFixed(2);
                      if (modMidi) modMidi.value = Number(ch.midi || 0).toFixed(2);
                      if (modAudio) modAudio.value = Number(ch.audio || 0).toFixed(2);
                      if (modHaptics) modHaptics.value = Number(ch.haptics || 0).toFixed(2);
                      syncModulators();
                  },
              })
            : null;
    player.onPhaseIndex = (idx, total) => {
        if (!phaseScrub) return;
        phaseScrub.max = String(Math.max(0, total - 1));
        phaseScrub.value = String(idx);
        const frame = player.timeline && player.timeline.frames[idx];
        if (phaseLabel && frame) phaseLabel.textContent = frame.phase || String(idx);
    };

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reduceMotionChk.checked = true;
    }

    intensityRange.addEventListener('input', () => {
        intensityValue.textContent = Number(intensityRange.value).toFixed(2);
    });

    function syncModulators() {
        player.setModulators({
            camera: Number(modCamera?.value || 0),
            motion: Number(modMotion?.value || 0),
            midi: Number(modMidi?.value || 0),
            audio: Number(modAudio?.value || 0),
            haptics: Number(modHaptics?.value || 0),
        });
    }
    [modCamera, modMotion, modMidi, modAudio, modHaptics].forEach((el) =>
        el?.addEventListener('change', syncModulators),
    );

    let neutralOn = false;
    neutralBtn.addEventListener('click', () => {
        neutralOn = !neutralOn;
        player.neutral(neutralOn);
        neutralBtn.textContent = neutralOn ? 'Exit Neutral' : 'Neutral View';
        statusEl.textContent = neutralOn ? 'Neutral view enabled' : 'Field restored';
    });

    playBtn.addEventListener('click', () => {
        player.play();
        statusEl.textContent = 'Field running';
    });
    pauseBtn.addEventListener('click', () => {
        player.pause();
        statusEl.textContent = 'Field paused';
    });

    document.getElementById('regenSeedBtn')?.addEventListener('click', () => {
        seedInput.value = String(Math.floor(Math.random() * 1e9));
    });

    preferWebGLChk?.addEventListener('change', () => {
        player.setPreferWebGL(!!preferWebGLChk.checked);
        statusEl.textContent = `Renderer preference: ${player.backend}`;
    });

    sourcePlaneChk?.addEventListener('change', () => {
        syncSourcePlaneUI();
        statusEl.textContent = sourcePlaneChk.checked
            ? 'Sim source plane enabled'
            : 'Sim source plane cleared';
    });
    sourcePlaneMix?.addEventListener('input', () => {
        if (sourcePlaneMixValue) sourcePlaneMixValue.textContent = Number(sourcePlaneMix.value).toFixed(2);
        if (sourcePlaneChk?.checked && lastBridgeField) {
            player.setSourceMix(Number(sourcePlaneMix.value));
        }
    });

    phaseScrub?.addEventListener('input', () => {
        player.pause();
        player.setPhaseIndex(Number(phaseScrub.value));
        const frame = player.timeline && player.timeline.frames[player.idx];
        if (phaseLabel && frame) phaseLabel.textContent = frame.phase || phaseScrub.value;
    });

    document.getElementById('exportTimelineBtn')?.addEventListener('click', () => {
        try {
            player.exportTimelineJson();
        } catch (err) {
            alert(err.message || String(err));
        }
    });
    document.getElementById('exportViewportBtn')?.addEventListener('click', () => {
        player.exportViewportPng();
    });

    document.getElementById('bridgeSimBtn')?.addEventListener('click', async () => {
        statusEl.textContent = 'Bridging simulation field…';
        const last = window.PsyFiLastSim;
        try {
            let data;
            if (last?.visualization && last?.payload) {
                // Prefer last completed workspace simulation (no extra compute).
                const substance = last.substance || substanceSelect.value || 'lsd';
                if (substanceSelect && substance) substanceSelect.value = substance;
                const timeline = await player.loadTimeline({
                    substance,
                    experience_id: experienceSelect.value || null,
                    mode: modeSelect.value || 'open',
                    intensity: Number(intensityRange.value),
                    seed: Number(last.seed ?? seedInput.value) || 42,
                    steps: 12,
                    reduce_motion: !!reduceMotionChk.checked,
                    dim_flashing: !!dimFlashChk.checked,
                    quality_tier: 'balanced',
                });
                data = {
                    kind: 'field_frame',
                    seed: last.seed,
                    substance,
                    simulation: {
                        width: last.width,
                        height: last.height,
                        visualization: last.visualization,
                        provenance_id: last.provenance_id,
                        api_version: last.payload.api_version,
                        metrics: {
                            valence: last.payload.valence,
                            coherence: last.payload.coherence,
                            symmetry: last.payload.symmetry,
                            roughness: last.payload.roughness,
                            richness: last.payload.richness,
                        },
                    },
                    parameter_field: timeline.frames?.[0] || timeline.frame,
                    note: 'Bridged from last workspace simulation (cached visualization + fresh ParameterField).',
                };
                if (data.parameter_field) {
                    player.setFrame(data.parameter_field);
                    player.play();
                }
            } else {
                data = await player.loadFieldBridge({
                    width: 32,
                    height: 32,
                    steps: 4,
                    seed: Number(seedInput.value) || 42,
                    substance: substanceSelect.value || 'lsd',
                    preset: substanceSelect.value || 'lsd',
                    mode: modeSelect.value || 'open',
                    intensity: Number(intensityRange.value),
                });
                if (data.parameter_field) {
                    player.timeline = {
                        frames: [data.parameter_field],
                        timeline_hash: data.parameter_field.hash,
                        seed: data.seed,
                        experience_id: null,
                    };
                    player.setFrame(data.parameter_field);
                    player.play();
                }
            }
            lastBridgeField = data.simulation?.visualization?.field || null;
            if (lastBridgeField && sourcePlaneChk) {
                sourcePlaneChk.checked = true;
            }
            syncSourcePlaneUI();
            provenanceEl.innerHTML = `
              <div><strong>Bridge</strong> simulation → ParameterField</div>
              <div><strong>Provenance</strong> ${data.simulation?.provenance_id || '—'}</div>
              <div><strong>Field hash</strong> ${data.parameter_field?.hash || '—'}</div>
              <div><strong>Source plane</strong> ${lastBridgeField && sourcePlaneChk?.checked ? 'on' : 'off'}</div>
              <div class="muted">${data.note || ''}</div>
            `;
            statusEl.textContent = lastBridgeField && sourcePlaneChk?.checked
                ? 'Simulation bridge loaded · source plane active'
                : 'Simulation bridge loaded';
        } catch (err) {
            console.error(err);
            statusEl.textContent = 'Bridge failed';
            alert(err.message || String(err));
        }
    });

    async function withSensorError(label, fn) {
        if (!sensorHub) {
            alert('Device sensor hub unavailable.');
            return;
        }
        try {
            await fn();
        } catch (err) {
            alert(`${label}: ${err.message || err}`);
        }
    }

    document.getElementById('enableAvailableSensorsBtn')?.addEventListener('click', async () => {
        await withSensorError('Sensors', async () => {
            const result = await sensorHub.enableAvailable();
            if (!result.enabled.length) {
                alert('No sensors could be enabled on this device. Use the manual sliders instead.');
            }
        });
    });
    document.getElementById('disableSensorsBtn')?.addEventListener('click', () => {
        sensorHub?.disableAll();
        syncModulators();
    });
    document.getElementById('enableCameraBtn')?.addEventListener('click', () =>
        withSensorError('Camera', () => sensorHub.enableCamera()),
    );
    document.getElementById('enableMotionBtn')?.addEventListener('click', () =>
        withSensorError('Motion', () => sensorHub.enableMotion()),
    );
    document.getElementById('enableAudioBtn')?.addEventListener('click', () =>
        withSensorError('Microphone', () => sensorHub.enableAudio()),
    );
    document.getElementById('enableMidiBtn')?.addEventListener('click', () =>
        withSensorError('Web MIDI', () => sensorHub.enableWebMidi()),
    );
    document.getElementById('enableGamepadBtn')?.addEventListener('click', () =>
        withSensorError('Gamepad', () => sensorHub.enableGamepad()),
    );
    document.getElementById('enableAmbientBtn')?.addEventListener('click', () =>
        withSensorError('Ambient light', () => sensorHub.enableAmbientLight()),
    );
    document.getElementById('enableHapticsBtn')?.addEventListener('click', () =>
        withSensorError('Haptics', () => sensorHub.enableHaptics()),
    );

    async function loadSubstances() {
        const res = await fetch('/api/v1/substances');
        const data = await res.json();
        substanceSelect.innerHTML = '';
        (data.substances || []).forEach((s) => {
            if (!s.recipe_count && !['lsd','psilocybin','dmt','mescaline','ketamine','5-meo-dmt'].includes(s.id)) return;
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.id} (${s.recipe_count || 0})`;
            substanceSelect.appendChild(opt);
        });
        if (!substanceSelect.value) {
            const opt = document.createElement('option');
            opt.value = 'lsd';
            opt.textContent = 'lsd';
            substanceSelect.appendChild(opt);
        }
        substanceSelect.value = 'lsd';
    }

    async function loadExperiences() {
        const substance = substanceSelect.value || 'lsd';
        const res = await fetch(`/api/v1/experiences?substance=${encodeURIComponent(substance)}&valence=positive`);
        const data = await res.json();
        experienceSelect.innerHTML = '';
        const items = data.items || [];
        if (!items.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No positive recipes';
            experienceSelect.appendChild(opt);
            return;
        }
        items.forEach((item) => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.title || item.id;
            experienceSelect.appendChild(opt);
        });
        if (items[0] && items[0].mode_default) {
            modeSelect.value = items[0].mode_default;
        }
    }

    experienceSelect.addEventListener('change', async () => {
        const id = experienceSelect.value;
        if (!id) return;
        try {
            const res = await fetch(`/api/v1/experiences/${encodeURIComponent(id)}`);
            const data = await res.json();
            const mode = data.recipe && data.recipe.visual_recipe && data.recipe.visual_recipe.mode_default;
            if (mode) modeSelect.value = mode;
        } catch (e) {
            console.warn(e);
        }
    });

    substanceSelect.addEventListener('change', () => loadExperiences());

    loadBtn.addEventListener('click', async () => {
        loadBtn.disabled = true;
        statusEl.textContent = 'Loading timeline…';
        neutralOn = false;
        neutralBtn.textContent = 'Neutral View';
        if (typeof player.neutral === 'function') player.neutral(false);
        syncModulators();
        try {
            const data = await player.loadTimeline({
                substance: substanceSelect.value || 'lsd',
                experience_id: experienceSelect.value || null,
                mode: modeSelect.value || 'open',
                intensity: Number(intensityRange.value),
                seed: Number(seedInput.value) || 42,
                steps: 20,
                reduce_motion: !!reduceMotionChk.checked,
                dim_flashing: !!dimFlashChk.checked,
                quality_tier: 'balanced',
                modulators: {
                    camera: Number(modCamera?.value || 0),
                    motion: Number(modMotion?.value || 0),
                    midi: Number(modMidi?.value || 0),
                    audio: Number(modAudio?.value || 0),
                    haptics: Number(modHaptics?.value || 0),
                },
            });
            if (phaseScrub && data.frames) {
                phaseScrub.disabled = false;
                phaseScrub.max = String(Math.max(0, data.frames.length - 1));
                phaseScrub.value = '0';
                if (phaseLabel) phaseLabel.textContent = data.frames[0].phase || 'comeup';
            }
            player.resize();
            player.play();
            statusEl.textContent = 'Experience loaded';
        } catch (err) {
            console.error(err);
            statusEl.textContent = 'Load failed';
            alert(err.message || String(err));
        } finally {
            loadBtn.disabled = false;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'n' || e.key === 'N') {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
            neutralBtn.click();
        }
    });

    loadSubstances()
        .then(loadExperiences)
        .then(() => loadBtn.click())
        .catch((e) => console.error('[PsyFi] experience init failed', e));
})();
