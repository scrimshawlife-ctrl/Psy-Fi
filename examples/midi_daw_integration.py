"""DAW integration example for PsyFi MIDI.

This example demonstrates bidirectional MIDI with a DAW:
1. Receive MIDI from DAW to control PsyFi parameters
2. Send PsyFi metrics as MIDI to DAW for visualization/sonification

Use case: Integrate consciousness field simulation with Ableton Live,
Logic Pro, FL Studio, or any MIDI-capable DAW.

Applied Alchemy Labs - ABX-Core v1.3
"""

import time
from typing import List, Dict

from psyfi_core.midi import MIDI_AVAILABLE, MIDIService, MIDIConfig
from psyfi_core.engine import PsyFiEngine, PsyFiParams


class DAWIntegration:
    """Bidirectional DAW integration for PsyFi."""

    def __init__(self, virtual_port_name: str = "IAC Driver Bus 1"):
        """Initialize DAW integration.

        Args:
            virtual_port_name: Name of virtual MIDI port (IAC Driver, loopMIDI, etc.)
        """
        if not MIDI_AVAILABLE:
            raise RuntimeError("MIDI not available. Install: pip install mido python-rtmidi")

        self.virtual_port = virtual_port_name
        self.midi: MIDIService | None = None
        self.engine: PsyFiEngine | None = None
        self.metrics_history: List[Dict[str, float]] = []

    def setup(self):
        """Setup MIDI and engine."""
        print("╔════════════════════════════════════════╗")
        print("║    PsyFi ↔ DAW Integration Demo       ║")
        print("║   Applied Alchemy Labs - ABX v1.3      ║")
        print("╚════════════════════════════════════════╝\n")

        # Configure MIDI with bidirectional ports
        config = MIDIConfig(
            input_device=self.virtual_port,
            output_device=self.virtual_port,
            channel=0,
            velocity_curve="linear",
            cc_smooth_factor=0.15,  # Slightly more smoothing for DAW
        )

        self.midi = MIDIService(config)

        # Create engine
        params = PsyFiParams(
            normalization={"P": 1.8, "V": 0.35},
            coupling_strength=0.7,
            phase_noise=0.2,
            drift_amplitude=0.3,
        )
        self.engine = PsyFiEngine(params, seed=42, size=32)

        # Register MIDI callbacks
        self.midi.register_callback(self._on_midi_param_change)

        # Open ports and start
        print(f"🔌 Connecting to virtual MIDI port: {self.virtual_port}")
        try:
            self.midi.open(
                input_device=self.virtual_port,
                output_device=self.virtual_port
            )
            self.midi.start()
            print("   ✅ MIDI I/O connected\n")
        except Exception as e:
            print(f"   ❌ Failed to connect: {e}")
            print("\n💡 Setup Instructions:")
            print("   macOS: Enable IAC Driver in Audio MIDI Setup")
            print("   Windows: Install and configure loopMIDI")
            print("   Linux: Configure ALSA MIDI virtual port\n")
            raise

    def _on_midi_param_change(self, param_name: str, value: float):
        """Handle incoming MIDI parameter changes from DAW."""
        print(f"   📥 DAW → PsyFi: {param_name} = {value:.3f}")

        # Update engine parameters
        if param_name == "phase_noise":
            self.engine.params.phase_noise = value
        elif param_name == "coupling_strength":
            self.engine.params.coupling_strength = value
        elif param_name == "drift_amplitude":
            self.engine.params.drift_amplitude = value
        elif param_name == "V":
            self.engine.params.normalization["V"] = value
        elif param_name == "P":
            # Map 0-1 to 1-3 range
            self.engine.params.normalization["P"] = 1.0 + value * 2.0

    def run_simulation(self, duration_seconds: int = 60):
        """Run simulation with DAW integration.

        Args:
            duration_seconds: How long to run simulation
        """
        print("🌀 Starting consciousness field simulation...")
        print(f"   Duration: {duration_seconds} seconds")
        print(f"   Update rate: 10 Hz\n")

        print("🎛️  DAW Control Map:")
        print("   Send MIDI from DAW to control PsyFi:")
        print("      CC1 (Mod Wheel) → phase_noise")
        print("      CC7 (Volume)    → coupling_strength")
        print("      CC10 (Pan)      → drift_amplitude")
        print("      CC11 (Expression) → V (divisive norm)")
        print("      CC74 (Brightness) → P (divisive norm)\n")

        print("📤 PsyFi → DAW Metrics:")
        print("   PsyFi will send consciousness metrics as MIDI CC:")
        print("      Coherence → CC1")
        print("      Richness  → CC7")
        print("      Valence   → CC10")
        print("      Flux      → CC11\n")

        print("   Create a MIDI track in your DAW and route it to the virtual port")
        print("   to visualize these metrics!\n")

        print("▶️  Running... (Ctrl+C to stop)\n")

        start_time = time.time()
        step = 0

        try:
            while (time.time() - start_time) < duration_seconds:
                # Step engine
                field = self.engine.step()

                # Get metrics
                metrics = self.engine.get_metrics()
                self.metrics_history.append({
                    "timestamp": time.time() - start_time,
                    **metrics
                })

                # Send metrics to DAW via MIDI
                if self.midi.output_port:
                    self.midi.field_to_midi(field, metrics)

                # Display every 10 steps
                if step % 10 == 0:
                    print(f"   Step {step:4d} | "
                          f"Coherence: {metrics['coherence']:.3f} | "
                          f"Richness: {metrics['richness']:.3f} | "
                          f"Flux: {metrics['flux']:.3f} | "
                          f"Valence: {metrics.get('valence', 0):.3f}")

                step += 1
                time.sleep(0.1)  # 10 Hz

        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping simulation...")

        elapsed = time.time() - start_time
        print(f"\n✅ Simulation complete: {step} steps in {elapsed:.1f}s")

    def export_midi_file(self, filename: str = "psyfi_metrics.mid"):
        """Export metrics history to MIDI file.

        Args:
            filename: Output MIDI file path
        """
        print(f"\n💾 Exporting metrics to MIDI file: {filename}")

        if not self.metrics_history:
            print("   ⚠️  No metrics to export")
            return

        self.midi.export_to_midi(self.metrics_history, filename)
        print(f"   ✅ Exported {len(self.metrics_history)} timesteps")
        print(f"   📂 Import '{filename}' into your DAW to visualize consciousness metrics!")

    def cleanup(self):
        """Clean up MIDI connections."""
        if self.midi:
            self.midi.close()
            print("\n🔌 MIDI disconnected")


def main():
    """Run DAW integration demo."""

    # Create integration
    daw = DAWIntegration(virtual_port_name="IAC Driver Bus 1")

    try:
        # Setup
        daw.setup()

        # Run simulation
        daw.run_simulation(duration_seconds=60)

        # Export to MIDI file
        daw.export_midi_file("psyfi_metrics.mid")

    except Exception as e:
        print(f"\n❌ Error: {e}")

    finally:
        # Cleanup
        daw.cleanup()
        print("\n✨ Demo complete!\n")


if __name__ == "__main__":
    main()
