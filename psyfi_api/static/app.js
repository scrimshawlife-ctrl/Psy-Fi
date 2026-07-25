// PsyFi - Consciousness Field Simulator
// Applied Alchemy Labs

document.addEventListener('DOMContentLoaded', () => {
    console.log('[PsyFi] Initializing...');

    const form = document.getElementById('simulationForm');
    const runButton = document.getElementById('runButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultsPanel = document.getElementById('resultsPanel');
    const errorPanel = document.getElementById('errorPanel');

    // Verify all elements loaded
    if (!form) console.error('[PsyFi] Form not found!');
    if (!runButton) console.error('[PsyFi] Run button not found!');
    if (!loadingOverlay) console.error('[PsyFi] Loading overlay not found!');
    if (!resultsPanel) console.error('[PsyFi] Results panel not found!');
    if (!errorPanel) console.error('[PsyFi] Error panel not found!');

    console.log('[PsyFi] All elements loaded successfully');

    // Preset configurations
    const presets = {
        quick: { width: 32, height: 32, steps: 10 },
        standard: { width: 64, height: 64, steps: 20 },
        detailed: { width: 128, height: 128, steps: 50 },
        deep: { width: 256, height: 256, steps: 100 }
    };

    // Preset button handlers
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const presetName = button.dataset.preset;
            const preset = presets[presetName];

            if (preset) {
                // Update form values
                document.getElementById('width').value = preset.width;
                document.getElementById('height').value = preset.height;
                document.getElementById('steps').value = preset.steps;

                // Update active state
                presetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Optional: trigger validation
                ['width', 'height', 'steps'].forEach(id => {
                    const input = document.getElementById(id);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        });
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[PsyFi] Form submitted');

        // Get form values
        const width = parseInt(document.getElementById('width').value);
        const height = parseInt(document.getElementById('height').value);
        const steps = parseInt(document.getElementById('steps').value);

        console.log(`[PsyFi] Parameters: ${width}×${height}, ${steps} steps`);

        // Show loading state
        showLoading(true);
        hideResults();
        hideError();

        try {
            console.log('[PsyFi] Calling API...');

            // Call the simulation API
            const response = await fetch('/simulate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    width: width,
                    height: height,
                    steps: steps
                })
            });

            console.log(`[PsyFi] Response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[PsyFi] Results received:', data);

            // Display results
            showResults(data);

        } catch (error) {
            console.error('[PsyFi] Error:', error);
            // Display error
            showError(error.message);
        } finally {
            showLoading(false);
        }
    });

    // Show/hide loading overlay
    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
        runButton.disabled = show;
    }

    // Display simulation results
    function showResults(data) {
        // Update field dimensions
        document.getElementById('fieldDimensions').textContent =
            `${data.width} × ${data.height}`;

        // Update metric values and bars
        updateMetric('valence', data.valence, normalizeValue(data.valence, -1, 1));
        updateMetric('coherence', data.coherence, data.coherence);
        updateMetric('symmetry', data.symmetry, data.symmetry);
        updateMetric('roughness', data.roughness, data.roughness);
        updateMetric('richness', data.richness, data.richness);

        // Show results panel with animation
        resultsPanel.style.display = 'block';
        setTimeout(() => {
            resultsPanel.style.opacity = '1';
        }, 10);
    }

    // Update individual metric
    function updateMetric(name, value, barValue) {
        // Update value display
        const valueElement = document.getElementById(name);
        valueElement.textContent = value.toFixed(3);

        // Update bar
        const barElement = document.getElementById(`${name}Bar`);
        const percentage = Math.max(0, Math.min(100, barValue * 100));
        barElement.style.width = `${percentage}%`;

        // Add color variation based on value
        if (name === 'valence') {
            if (value > 0) {
                valueElement.style.color = 'var(--pf-cyan)';
            } else {
                valueElement.style.color = 'var(--pf-magenta)';
            }
        }
    }

    // Normalize value from range to 0-1
    function normalizeValue(value, min, max) {
        return (value - min) / (max - min);
    }

    // Hide results panel
    function hideResults() {
        resultsPanel.style.display = 'none';
        resultsPanel.style.opacity = '0';
    }

    // Show error message
    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        errorPanel.style.display = 'block';
    }

    // Hide error panel
    function hideError() {
        errorPanel.style.display = 'none';
    }

    // Add input validation and visual feedback
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const min = parseInt(e.target.min);
            const max = parseInt(e.target.max);

            if (value < min || value > max) {
                e.target.style.borderColor = 'var(--pf-danger)';
            } else {
                e.target.style.borderColor = 'var(--pf-border-subtle)';
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to run simulation
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Add subtle animation on load
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 10);

    console.log('[PsyFi] Ready! Press Run Simulation or Ctrl+Enter to start.');

    // Test button click handler
    runButton.addEventListener('click', () => {
        console.log('[PsyFi] Button clicked directly');
    });
});

// ===== Live Experience workspace =====
(function initExperienceWorkspace() {
    const canvas = document.getElementById('experienceCanvas');
    if (!canvas || !window.PsyFiViz) {
        console.warn('[PsyFi] Experience player not available');
        return;
    }

    const substanceSelect = document.getElementById('substanceSelect');
    const experienceSelect = document.getElementById('experienceSelect');
    const modeSelect = document.getElementById('modeSelect');
    const intensityRange = document.getElementById('intensityRange');
    const intensityValue = document.getElementById('intensityValue');
    const seedInput = document.getElementById('seedInput');
    const reduceMotionChk = document.getElementById('reduceMotionChk');
    const dimFlashChk = document.getElementById('dimFlashChk');
    const loadBtn = document.getElementById('loadExperienceBtn');
    const playBtn = document.getElementById('playExperienceBtn');
    const pauseBtn = document.getElementById('pauseExperienceBtn');
    const neutralBtn = document.getElementById('neutralBtn');
    const statusEl = document.getElementById('experienceStatus');
    const provenanceEl = document.getElementById('provenancePanel');

    const player = new PsyFiViz.ExperiencePlayer({
        canvas,
        statusEl,
        provenanceEl,
    });
    player.resize();
    window.addEventListener('resize', () => player.resize());

    // Prefer system reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reduceMotionChk.checked = true;
    }

    intensityRange.addEventListener('input', () => {
        intensityValue.textContent = Number(intensityRange.value).toFixed(2);
    });

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
        // sync mode default from first
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
        try {
            await player.loadTimeline({
                substance: substanceSelect.value || 'lsd',
                experience_id: experienceSelect.value || null,
                mode: modeSelect.value || 'open',
                intensity: Number(intensityRange.value),
                seed: Number(seedInput.value) || 42,
                steps: 20,
                reduce_motion: !!reduceMotionChk.checked,
                dim_flashing: !!dimFlashChk.checked,
                quality_tier: 'balanced',
            });
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

    // Keyboard: N for neutral
    document.addEventListener('keydown', (e) => {
        if (e.key === 'n' || e.key === 'N') {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
            neutralBtn.click();
        }
    });

    loadSubstances()
        .then(loadExperiences)
        .then(() => {
            // Auto-load a default experience so the field isn't empty
            return loadBtn.click();
        })
        .catch((e) => console.error('[PsyFi] experience init failed', e));
})();
