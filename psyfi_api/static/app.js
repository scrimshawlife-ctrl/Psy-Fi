// PsyFi - Consciousness Field Simulator
// Applied Alchemy Labs
// Progressive enhancement of the existing static shell.

document.addEventListener('DOMContentLoaded', () => {
    console.log('[PsyFi] Initializing...');

    const form = document.getElementById('simulationForm');
    const runButton = document.getElementById('runButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultsPanel = document.getElementById('resultsPanel');
    const errorPanel = document.getElementById('errorPanel');
    const networkStatus = document.getElementById('networkStatus');
    const exportSessionButton = document.getElementById('exportSessionButton');
    const restoreSessionButton = document.getElementById('restoreSessionButton');

    const SESSION_STORAGE_KEY = 'psyfi.session.v1.last';
    let lastSession = null;

    if (!form) console.error('[PsyFi] Form not found!');
    if (!runButton) console.error('[PsyFi] Run button not found!');

    const presets = {
        quick: { width: 32, height: 32, steps: 10 },
        standard: { width: 64, height: 64, steps: 20 },
        detailed: { width: 128, height: 128, steps: 50 },
        deep: { width: 256, height: 256, steps: 100 }
    };

    function updateNetworkStatus() {
        if (!networkStatus) return;
        if (navigator.onLine) {
            networkStatus.dataset.state = 'online';
            networkStatus.textContent = 'Online — server computation available';
        } else {
            networkStatus.dataset.state = 'offline';
            networkStatus.textContent = 'Offline — server simulations unavailable; local session restore still works';
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    document.querySelectorAll('.preset-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const preset = presets[button.dataset.preset];
            if (!preset) return;
            document.getElementById('width').value = preset.width;
            document.getElementById('height').value = preset.height;
            document.getElementById('steps').value = preset.steps;
            document.querySelectorAll('.preset-btn').forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
        runButton.disabled = show;
    }

    function hideResults() {
        resultsPanel.style.display = 'none';
        resultsPanel.style.opacity = '0';
    }

    function hideError() {
        errorPanel.style.display = 'none';
    }

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        errorPanel.style.display = 'block';
    }

    function normalizeValue(value, min, max) {
        return (value - min) / (max - min);
    }

    function updateMetric(name, value, barValue) {
        const valueElement = document.getElementById(name);
        valueElement.textContent = value.toFixed(3);
        const barElement = document.getElementById(`${name}Bar`);
        const percentage = Math.max(0, Math.min(100, barValue * 100));
        barElement.style.width = `${percentage}%`;
        if (name === 'valence') {
            valueElement.style.color = value > 0 ? 'var(--color-signal-primary)' : 'var(--color-signal-secondary)';
        }
    }

    function showResults(data) {
        document.getElementById('fieldDimensions').textContent = `${data.width} × ${data.height}`;
        updateMetric('valence', data.valence, normalizeValue(data.valence, -1, 1));
        updateMetric('coherence', data.coherence, data.coherence);
        updateMetric('symmetry', data.symmetry, data.symmetry);
        updateMetric('roughness', data.roughness, data.roughness);
        updateMetric('richness', data.richness, data.richness);

        document.getElementById('resultSeed').textContent = data.seed ?? '--';
        document.getElementById('resultProvenance').textContent = data.provenance_id ?? '--';
        document.getElementById('resultModules').textContent = (data.module_chain || []).join(' → ') || '--';

        resultsPanel.style.display = 'block';
        setTimeout(() => {
            resultsPanel.style.opacity = '1';
        }, 10);
    }

    function persistSession(session) {
        lastSession = session;
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch (error) {
            console.warn('[PsyFi] Unable to persist session locally:', error);
        }
    }

    function loadStoredSession() {
        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[PsyFi] Unable to read stored session:', error);
            return null;
        }
    }

    function applySessionToForm(session) {
        if (!session || !session.parameters) return;
        document.getElementById('width').value = session.parameters.width;
        document.getElementById('height').value = session.parameters.height;
        document.getElementById('steps').value = session.parameters.steps;
        if (typeof session.seed === 'number') {
            document.getElementById('seed').value = session.seed;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!navigator.onLine) {
            showError('Server simulation requires network connectivity. Restore a saved session to inspect prior results offline.');
            return;
        }

        const width = parseInt(document.getElementById('width').value, 10);
        const height = parseInt(document.getElementById('height').value, 10);
        const steps = parseInt(document.getElementById('steps').value, 10);
        const seed = parseInt(document.getElementById('seed').value, 10);

        showLoading(true);
        hideResults();
        hideError();

        try {
            const response = await fetch('/simulate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ width, height, steps, seed }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            showResults(data);
            if (data.session) {
                persistSession(data.session);
            }
        } catch (error) {
            console.error('[PsyFi] Error:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    });

    exportSessionButton?.addEventListener('click', () => {
        const session = lastSession || loadStoredSession();
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

    restoreSessionButton?.addEventListener('click', () => {
        const session = loadStoredSession();
        if (!session || !session.result || !session.result.metrics) {
            showError('No locally saved session found.');
            return;
        }
        lastSession = session;
        applySessionToForm(session);
        showResults({
            width: session.parameters.width,
            height: session.parameters.height,
            valence: session.result.metrics.valence,
            coherence: session.result.metrics.coherence,
            symmetry: session.result.metrics.symmetry,
            roughness: session.result.metrics.roughness,
            richness: session.result.metrics.richness,
            seed: session.seed,
            provenance_id: session.provenance?.id,
            module_chain: session.provenance?.module_chain || [],
            session,
        });
        hideError();
    });

    form.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            const min = parseInt(e.target.min, 10);
            const max = parseInt(e.target.max, 10);
            e.target.style.borderColor =
                value < min || value > max ? 'var(--color-status-danger)' : 'var(--pf-border-subtle)';
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    console.log('[PsyFi] Ready! Press Run Simulation or Ctrl+Enter to start.');
});
