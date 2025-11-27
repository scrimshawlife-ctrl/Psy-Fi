// PsyFi - Consciousness Field Simulator
// Applied Alchemy Labs

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulationForm');
    const runButton = document.getElementById('runButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultsPanel = document.getElementById('resultsPanel');
    const errorPanel = document.getElementById('errorPanel');

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const width = parseInt(document.getElementById('width').value);
        const height = parseInt(document.getElementById('height').value);
        const steps = parseInt(document.getElementById('steps').value);

        // Show loading state
        showLoading(true);
        hideResults();
        hideError();

        try {
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Display results
            showResults(data);

        } catch (error) {
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
                valueElement.style.color = 'var(--cyan-primary)';
            } else {
                valueElement.style.color = 'var(--magenta-primary)';
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
                e.target.style.borderColor = 'rgba(255, 50, 50, 0.5)';
            } else {
                e.target.style.borderColor = 'var(--border-subtle)';
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
});
