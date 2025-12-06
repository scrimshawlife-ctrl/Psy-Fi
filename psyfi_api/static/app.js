// PsyFi - Consciousness Field Simulator
// Applied Alchemy Labs - ABX-Core v1.3

document.addEventListener('DOMContentLoaded', () => {
    console.log('[PsyFi] Initializing comprehensive UI...');
    addLog('System initialized. Ready to simulate.', 'info');

    // Get UI elements
    const generateBtn = document.getElementById('generateBtn');
    const scenarioSelect = document.getElementById('scenarioSelect');
    const seedInput = document.getElementById('seedInput');
    const statusPill = document.getElementById('statusPill');
    const statusText = document.getElementById('statusText');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Left panel inputs
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const stepsInput = document.getElementById('stepsInput');
    const noiseScaleInput = document.getElementById('noiseScaleInput');
    const initModeSelect = document.getElementById('initModeSelect');
    const intentionInput = document.getElementById('intentionInput');

    // Visualization
    const visualizationContainer = document.getElementById('visualizationContainer');
    const fieldCanvas = document.getElementById('fieldCanvas');
    const ctx = fieldCanvas.getContext('2d');

    // Metrics
    const valenceMetric = document.getElementById('valenceMetric');
    const coherenceMetric = document.getElementById('coherenceMetric');
    const symmetryMetric = document.getElementById('symmetryMetric');
    const roughnessMetric = document.getElementById('roughnessMetric');
    const richnessMetric = document.getElementById('richnessMetric');
    const dimensionsMetric = document.getElementById('dimensionsMetric');

    // Advanced drawer
    const advancedDrawer = document.getElementById('advancedDrawer');
    const drawerHandle = document.getElementById('drawerHandle');
    const drawerTabs = document.querySelectorAll('.drawer-tab');
    const rawJsonOutput = document.getElementById('rawJsonOutput');
    const debugInfo = document.getElementById('debugInfo');
    const browserInfo = document.getElementById('browserInfo');
    const timestampInfo = document.getElementById('timestampInfo');
    const sessionInfo = document.getElementById('sessionInfo');

    // Engine toggles
    const engineToggles = document.querySelectorAll('.toggle-switch');
    const engineStates = {};

    // Initialize engine states
    engineToggles.forEach(toggle => {
        const header = toggle.parentElement;
        const engineName = header.dataset.engine;
        engineStates[engineName] = toggle.classList.contains('active');
    });

    // Set debug info
    browserInfo.textContent = navigator.userAgent.split(' ').pop();
    sessionInfo.textContent = generateSessionId();
    updateTimestamp();

    console.log('[PsyFi] All elements loaded successfully');
    addLog('UI components initialized', 'success');

    // Generate button click handler
    generateBtn.addEventListener('click', async () => {
        console.log('[PsyFi] Generate button clicked');
        addLog(`Generating ${scenarioSelect.value} simulation...`, 'info');

        try {
            // Update status
            setStatus('computing');
            loadingOverlay.classList.add('active');

            // Get parameters
            const params = {
                width: parseInt(widthInput.value),
                height: parseInt(heightInput.value),
                steps: parseInt(stepsInput.value),
                scenario: scenarioSelect.value,
                seed: parseInt(seedInput.value) || 42
            };

            console.log('[PsyFi] Parameters:', params);
            addLog(`Parameters: ${params.width}×${params.height}, ${params.steps} steps, seed ${params.seed}`, 'info');

            // Call simulation API
            const response = await fetch('/simulate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[PsyFi] Simulation complete:', data);
            addLog('Simulation completed successfully', 'success');

            // Display results
            displayResults(data, params);

            // Update status
            setStatus('complete');

            // Store to history
            await storeToHistory(data, params);

        } catch (error) {
            console.error('[PsyFi] Error:', error);
            addLog(`Error: ${error.message}`, 'error');
            alert(`Simulation failed: ${error.message}`);
            setStatus('ready');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    // Display simulation results
    function displayResults(data, params) {
        // Update metrics
        valenceMetric.textContent = data.valence?.toFixed(3) || '--';
        coherenceMetric.textContent = data.coherence?.toFixed(3) || '--';
        symmetryMetric.textContent = data.symmetry?.toFixed(3) || '--';
        roughnessMetric.textContent = data.roughness?.toFixed(3) || '--';
        richnessMetric.textContent = data.richness?.toFixed(3) || '--';
        dimensionsMetric.textContent = `${data.width}×${data.height}`;

        // Update raw JSON
        rawJsonOutput.textContent = JSON.stringify(data, null, 2);

        // Draw visualization (magnitude heatmap)
        if (data.magnitude && data.width && data.height) {
            drawFieldVisualization(data.magnitude, data.width, data.height);
        }

        addLog(`Rendered ${params.width}×${params.height} field visualization`, 'success');
    }

    // Draw field visualization on canvas
    function drawFieldVisualization(magnitudeData, width, height) {
        // Set canvas size
        fieldCanvas.width = width;
        fieldCanvas.height = height;

        // Show canvas, hide placeholder
        fieldCanvas.classList.remove('hidden');
        const placeholder = visualizationContainer.querySelector('.placeholder-text');
        if (placeholder) placeholder.style.display = 'none';

        // Create ImageData
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Find min/max for normalization
        const flat = magnitudeData.flat();
        const min = Math.min(...flat);
        const max = Math.max(...flat);
        const range = max - min || 1;

        // Fill pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = magnitudeData[y][x];
                const normalized = (value - min) / range;

                // Cyan-Magenta-Yellow colormap (PsyFi theme)
                const idx = (y * width + x) * 4;

                if (normalized < 0.5) {
                    // Cyan to Magenta
                    const t = normalized * 2;
                    data[idx + 0] = Math.floor(62 + (255 - 62) * t);    // R
                    data[idx + 1] = Math.floor(231 * (1 - t));          // G
                    data[idx + 2] = Math.floor(242 - (242 - 193) * t);  // B
                } else {
                    // Magenta to Yellow
                    const t = (normalized - 0.5) * 2;
                    data[idx + 0] = Math.floor(255);                    // R
                    data[idx + 1] = Math.floor(66 + (181) * t);         // G
                    data[idx + 2] = Math.floor(193 - 122 * t);          // B
                }

                data[idx + 3] = 255; // Alpha
            }
        }

        // Put image data
        ctx.putImageData(imageData, 0, 0);

        console.log('[PsyFi] Visualization rendered:', width, 'x', height);
    }

    // Set status pill
    function setStatus(status) {
        statusPill.className = 'status-pill';

        if (status === 'ready') {
            statusPill.classList.add('status-ready');
            statusText.textContent = 'Ready';
            generateBtn.disabled = false;
        } else if (status === 'computing') {
            statusPill.classList.add('status-computing');
            statusText.textContent = 'Computing';
            generateBtn.disabled = true;
        } else if (status === 'complete') {
            statusPill.classList.add('status-complete');
            statusText.textContent = 'Complete';
            generateBtn.disabled = false;
        }
    }

    // Store to run history
    async function storeToHistory(data, params) {
        try {
            await fetch('/admin/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    scenario: params.scenario,
                    width: params.width,
                    height: params.height,
                    steps: params.steps,
                    seed: params.seed,
                    metrics: {
                        valence: data.valence,
                        coherence: data.coherence,
                        symmetry: data.symmetry,
                        roughness: data.roughness,
                        richness: data.richness
                    },
                    duration_ms: data.duration_ms || null
                })
            });
            addLog('Run saved to history', 'success');
        } catch (error) {
            console.error('[PsyFi] Failed to save to history:', error);
            addLog('Failed to save to history', 'error');
        }
    }

    // Add log entry to drawer
    function addLog(message, type = 'info') {
        const logEntries = document.getElementById('logEntries');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEntries.appendChild(entry);

        // Scroll to bottom
        logEntries.scrollTop = logEntries.scrollHeight;

        // Limit to 100 entries
        while (logEntries.children.length > 100) {
            logEntries.removeChild(logEntries.firstChild);
        }
    }

    // Drawer handle toggle
    drawerHandle.addEventListener('click', () => {
        advancedDrawer.classList.toggle('open');
        const isOpen = advancedDrawer.classList.contains('open');
        drawerHandle.innerHTML = isOpen
            ? '<span style="color: var(--pf-text-subtle); font-size: 0.85rem;">▼ Advanced Debug</span>'
            : '<span style="color: var(--pf-text-subtle); font-size: 0.85rem;">▲ Advanced Debug</span>';
    });

    // Drawer tabs
    drawerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            drawerTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            document.querySelectorAll('.drawer-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });

    // Engine toggles
    engineToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('active');

            const header = toggle.parentElement;
            const engineName = header.dataset.engine;
            engineStates[engineName] = toggle.classList.contains('active');

            console.log('[PsyFi] Engine toggled:', engineName, engineStates[engineName]);
            addLog(`Engine ${engineName}: ${engineStates[engineName] ? 'enabled' : 'disabled'}`, 'info');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateBtn.click();
        }

        // Escape to close drawer
        if (e.key === 'Escape' && advancedDrawer.classList.contains('open')) {
            advancedDrawer.classList.remove('open');
        }

        // D key to toggle drawer
        if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
            const focused = document.activeElement;
            if (focused.tagName !== 'INPUT' && focused.tagName !== 'TEXTAREA') {
                advancedDrawer.classList.toggle('open');
            }
        }
    });

    // Update timestamp every second
    function updateTimestamp() {
        timestampInfo.textContent = new Date().toISOString();
    }
    setInterval(updateTimestamp, 1000);

    // Generate session ID
    function generateSessionId() {
        return Math.random().toString(36).substring(2, 11).toUpperCase();
    }

    // Input validation
    const numericInputs = [widthInput, heightInput, stepsInput, noiseScaleInput, seedInput];
    numericInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const min = parseFloat(e.target.min);
            const max = parseFloat(e.target.max);

            if (value < min || value > max) {
                e.target.style.borderColor = '#ff4444';
            } else {
                e.target.style.borderColor = 'var(--pf-border-subtle)';
            }
        });
    });

    // Scenario change handler
    scenarioSelect.addEventListener('change', () => {
        console.log('[PsyFi] Scenario changed to:', scenarioSelect.value);
        addLog(`Scenario changed to: ${scenarioSelect.value}`, 'info');
    });

    // Page load animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 10);

    console.log('[PsyFi] Ready! Press Generate or Ctrl+Enter to simulate.');
    console.log('[PsyFi] Press D to toggle debug drawer.');
    addLog('Keyboard shortcuts: Ctrl+Enter (generate), D (debug), Esc (close)', 'info');
});
