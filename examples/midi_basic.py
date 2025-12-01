"""Basic MIDI integration example for PsyFi.

This example demonstrates:
1. Listing MIDI devices
2. Starting MIDI service
3. Registering parameter callbacks
4. Real-time field control via MIDI

Applied Alchemy Labs - ABX-Core v1.3
"""

import time
from typing import Dict

from psyfi_core.midi import MIDI_AVAILABLE, MIDIService, MIDIConfig
from psyfi_core.engine import PsyFiEngine, PsyFiParams


def main():
    """Run basic MIDI integration example."""

    # Check MIDI availability
    if not MIDI_AVAILABLE:
        print("❌ MIDI not available. Install with:")
        print("   pip install mido python-rtmidi")
        return

    print("╔════════════════════════════════════════╗")
    print("║   PsyFi MIDI Integration - Basic Demo ║")
    print("║      Applied Alchemy Labs - ABX v1.3  ║")
    print("╚════════════════════════════════════════╝\n")

    # List available MIDI devices
    print("📟 Available MIDI Devices:")
    service = MIDIService()
    devices = service.list_devices()

    print(f"\n  Input devices ({len(devices['input'])}):")
    for i, device in enumerate(devices['input']):
        print(f"    {i+1}. {device}")

    print(f"\n  Output devices ({len(devices['output'])}):")
    for i, device in enumerate(devices['output']):
        print(f"    {i+1}. {device}")

    if not devices['input']:
        print("\n⚠️  No MIDI input devices found.")
        print("   Connect a MIDI controller or enable virtual MIDI port.")
        return

    # Configure MIDI
    print("\n🎛️  MIDI Configuration:")
    config = MIDIConfig(
        input_device=None,  # Use default
        output_device=None,
        channel=0,
        velocity_curve="linear",
        cc_smooth_factor=0.1,  # Smooth CC changes
    )
    print(f"   Input: {config.input_device or 'Default'}")
    print(f"   Channel: {config.channel}")
    print(f"   Smoothing: {config.cc_smooth_factor}")

    # Create MIDI service
    midi = MIDIService(config)

    # Create PsyFi engine
    print("\n🧠 Creating PsyFi Engine...")
    params = PsyFiParams(
        normalization={"P": 1.8, "V": 0.35},
        coupling_strength=0.7,
        phase_noise=0.2,
        drift_amplitude=0.3,
    )
    engine = PsyFiEngine(params, seed=42, size=32)

    # Register callback for parameter changes
    print("\n🔊 Registering MIDI callbacks...")

    def on_param_change(param_name: str, value: float):
        """Handle MIDI parameter change."""
        print(f"   🎚️  {param_name} → {value:.3f}")

        # Apply to engine (simplified - in production use proper update mechanism)
        if param_name == "phase_noise":
            engine.params.phase_noise = value
        elif param_name == "coupling_strength":
            engine.params.coupling_strength = value
        elif param_name == "drift_amplitude":
            engine.params.drift_amplitude = value

    midi.register_callback(on_param_change)

    # Open MIDI port and start listening
    print("\n▶️  Starting MIDI service...")
    try:
        midi.open(input_device=config.input_device, output_device=None)
        midi.start()
        print("   ✅ MIDI service running")
    except Exception as e:
        print(f"   ❌ Failed to start MIDI: {e}")
        return

    # Display control mappings
    print("\n🎹 MIDI Control Mappings:")
    print("   CC Mappings:")
    for cc, param in midi.control_map.cc_to_param.items():
        print(f"      CC{cc:3d} → {param}")

    print("\n   Note Mappings (C4 = 60):")
    note_map = {
        60: "baseline",
        61: "lsd",
        62: "psilocybin",
        63: "dmt",
        64: "ketamine",
        65: "mdma",
    }
    for note, preset in note_map.items():
        print(f"      {note:3d} → {preset}")

    # Run simulation with MIDI control
    print("\n🌀 Running consciousness field simulation...")
    print("   (MIDI controller changes will update parameters in real-time)\n")
    print("   Press Ctrl+C to stop\n")

    try:
        step = 0
        while True:
            # Step engine
            field = engine.step()

            # Get current MIDI params
            midi_params = midi.get_params()

            # Display metrics every 10 steps
            if step % 10 == 0:
                metrics = engine.get_metrics()
                print(f"   Step {step:4d} | "
                      f"Coherence: {metrics['coherence']:.3f} | "
                      f"Richness: {metrics['richness']:.3f} | "
                      f"Flux: {metrics['flux']:.3f}")

                # Show current MIDI-controlled params
                if midi_params:
                    print(f"            | MIDI: {midi_params}")

            step += 1
            time.sleep(0.1)  # 10 Hz update rate

    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping simulation...")

    finally:
        # Clean up
        midi.close()
        print("   ✅ MIDI service stopped")
        print("\n✨ Demo complete!\n")


if __name__ == "__main__":
    main()
