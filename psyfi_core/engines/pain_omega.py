"""Pain Omega - negative valence and pathology detection."""

import numpy as np

from psyfi_core.models.negative_valence import NegativeValenceSignature


def compute_negative_valence_signature(field: np.ndarray) -> NegativeValenceSignature:
    """Compute negative valence signature from a consciousness field.

    Detects markers of suffering and pathological states:
    - Hyper-sync: Excessive phase locking
    - Spectral spikiness: Sharp peaks in frequency spectrum
    - Gradient energy: High spatial roughness
    - Attractor stability: How trapped the system is

    Args:
        field: 2D complex field (height, width)

    Returns:
        NegativeValenceSignature with pathology markers
    """
    # Extract phase and magnitude
    phases = np.angle(field)
    magnitudes = np.abs(field)

    # 1. Hyper-sync: Excessive phase synchronization
    # Order parameter close to 1 = pathological locking
    mean_complex = np.mean(np.exp(1j * phases))
    order_param = float(np.abs(mean_complex))

    # Hyper-sync is high order parameter
    # But we want to distinguish healthy coherence from pathological locking
    # Use a threshold: > 0.9 is concerning
    hyper_sync = max(0.0, (order_param - 0.9) / 0.1) if order_param > 0.9 else 0.0

    # 2. Spectral spikiness: Sharp peaks in frequency domain
    # FFT of the field
    fft = np.fft.fft2(field)
    fft_magnitude = np.abs(fft)

    # Normalize spectrum
    if fft_magnitude.max() > 0:
        fft_normalized = fft_magnitude / fft_magnitude.max()
    else:
        fft_normalized = fft_magnitude

    # Spikiness = variance of the spectrum
    # High variance = few sharp peaks (bad)
    spectral_spikiness = float(np.var(fft_normalized))

    # 3. Gradient energy: High spatial roughness
    grad_y, grad_x = np.gradient(magnitudes)
    gradient_energy = float(np.mean(np.sqrt(grad_x**2 + grad_y**2)))

    # Normalize by mean magnitude
    if magnitudes.mean() > 0:
        gradient_energy = gradient_energy / magnitudes.mean()

    # 4. Attractor stability: Combination of above
    # High hyper-sync + high gradient = trapped in chaotic attractor
    attractor_stability = (hyper_sync + min(1.0, gradient_energy / 2.0)) / 2.0

    return NegativeValenceSignature(
        hyper_sync=hyper_sync,
        spectral_spikiness=spectral_spikiness,
        gradient_energy=gradient_energy,
        attractor_stability=attractor_stability,
    )
