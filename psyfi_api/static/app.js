// PsyFi web shell — progressive enhancement on the existing FastAPI static UI.

const SESSION_STORAGE_KEY = 'psyfi.session.v1.last';
const DB_NAME = 'psyfi-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'history';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulationForm');
    const runButton = document.getElementById('runButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorPanel = document.getElementById('errorPanel');
    const networkStatus = document.getElementById('networkStatus');
    const substanceSelect = document.getElementById('substancePreset');
    const substanceGrid = document.getElementById('substanceGrid');
    const presetEmpty = document.getElementById('presetEmpty');
    const resultsEmpty = document.getElementById('resultsEmpty');
    const resultsContent = document.getElementById('resultsContent');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const canvas = document.getElementById('fieldCanvas');

    let lastPayload = null;

    const gridPresets = {
        quick: { width: 32, height: 32, steps: 10 },
        standard: { width: 64, height: 64, steps: 20 },
        detailed: { width: 128, height: 128, steps: 50 },
        deep: { width: 256, height: 256, steps: 100 },
    };

    function setHidden(el, hidden) {
        if (!el) return;
        el.hidden = hidden;
    }

    function showLoading(show) {
        setHidden(loadingOverlay, !show);
        runButton.disabled = show;
    }

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
        });
    });

    function normalizeValue(value, min, max) {
        return (value - min) / (max - min);
    }

    function updateMetric(name, value, barValue) {
        const valueElement = document.getElementById(name);
        valueElement.textContent = value.toFixed(3);
        const barElement = document.getElementById(`${name}Bar`);
        barElement.style.width = `${Math.max(0, Math.min(100, barValue * 100))}%`;
        if (name === 'valence') {
            valueElement.style.color = value > 0
                ? 'var(--color-signal-primary)'
                : 'var(--color-signal-secondary)';
        }
    }

    function renderVisualization(visualization) {
        const summary = document.getElementById('vizSummary');
        if (!visualization || !canvas) {
            if (summary) summary.textContent = '';
            return;
        }

        const values = visualization.field?.values;
        const width = visualization.field?.width;
        const height = visualization.field?.height;
        summary.textContent = visualization.accessibility?.summary || '';

        if (!values || !width || !height) {
            return;
        }

        const ctx = canvas.getContext('2d');
        const image = ctx.createImageData(width, height);
        for (let i = 0; i < width * height; i += 1) {
            const row = values[Math.floor(i / width)];
            const v = row ? row[i % width] : 0;
            const t = Math.max(0, Math.min(1, Number(v) || 0));
            // Cyan → violet ramp using current brand signals.
            const r = Math.round(62 + (143 - 62) * t);
            const g = Math.round(231 + (123 - 231) * t);
            const b = Math.round(242 + (255 - 242) * t);
            const offset = i * 4;
            image.data[offset] = r;
            image.data[offset + 1] = g;
            image.data[offset + 2] = b;
            image.data[offset + 3] = 255;
        }

        // Draw into an offscreen canvas then scale for crisp pixels.
        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        off.getContext('2d').putImageData(image, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    function showResults(data) {
        lastPayload = data;
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

        renderVisualization(data.visualization);
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
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
        if (!payload?.session) {
            throw new Error('No session available to save');
        }
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

    async function refreshHistory() {
        const records = await listHistory();
        historyList.innerHTML = '';
        setHidden(historyEmpty, records.length > 0);
        records.forEach((record) => {
            const item = document.createElement('li');
            item.className = 'history-item';
            item.innerHTML = `
                <div>
                    <strong>${record.width}×${record.height}</strong>
                    · seed <code>${record.seed}</code>
                    · ${record.preset || 'no preset'}
                </div>
                <div class="history-meta">${record.id} · valence ${Number(record.metrics?.valence || 0).toFixed(3)}</div>
                <button type="button" class="btn-secondary history-restore">Restore</button>
            `;
            item.querySelector('.history-restore').addEventListener('click', () => {
                showResults({
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
                });
                document.getElementById('width').value = record.session.parameters.width;
                document.getElementById('height').value = record.session.parameters.height;
                document.getElementById('steps').value = record.session.parameters.steps;
                document.getElementById('seed').value = record.seed;
                if (record.preset) substanceSelect.value = record.preset;
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
            const response = await fetch('/api/presets/');
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
        const rows = [
            {
                name: 'Canvas 2D',
                supported: !!(canvas && canvas.getContext),
                fallback: 'Metrics/provenance text only',
            },
            {
                name: 'WebGL',
                supported: !!document.createElement('canvas').getContext('webgl'),
                fallback: 'Canvas 2D baseline renderer',
            },
            {
                name: 'WebGPU',
                supported: !!navigator.gpu,
                fallback: 'Canvas/WebGL path (optional accel later)',
            },
            {
                name: 'IndexedDB',
                supported: !!window.indexedDB,
                fallback: 'localStorage last-session only',
            },
            {
                name: 'Service Worker',
                supported: 'serviceWorker' in navigator,
                fallback: 'Online-only shell caching',
            },
            {
                name: 'Web MIDI',
                supported: !!(navigator.requestMIDIAccess),
                fallback: 'REST MIDI routes when server has devices',
            },
            {
                name: 'Persistent Storage',
                supported: !!(navigator.storage && navigator.storage.persist),
                fallback: 'Best-effort browser storage',
            },
            {
                name: 'Vibration / Haptics',
                supported: typeof navigator.vibrate === 'function',
                fallback: 'Visual state feedback',
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

        showLoading(true);
        hideError();

        try {
            const body = { width, height, steps, seed };
            if (preset) body.preset = preset;
            const response = await fetch('/simulate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }
            const data = await response.json();
            showResults(data);
            try {
                await saveHistoryRecord(data);
            } catch (error) {
                console.warn('[PsyFi] History save skipped:', error);
            }
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
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

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    loadPresets();
    refreshHistory();
    renderCapabilities();
});
