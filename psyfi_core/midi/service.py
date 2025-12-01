"""
PsyFi MIDI Service
Applied Alchemy Labs
ABX-Core v1.3 Compliant

MIDI input/output service for real-time consciousness field control and expression.
Enables hardware controllers, DAWs, and musical interfaces to interact with PsyFi.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

try:
    import mido
    from mido import Message, MidiFile, MidiTrack
    MIDI_AVAILABLE = True
except ImportError:
    MIDI_AVAILABLE = False
    print("Warning: mido not installed. MIDI features disabled. Install with: pip install mido python-rtmidi")

import numpy as np


class MIDIMessageType(str, Enum):
    """MIDI message types."""
    NOTE_ON = "note_on"
    NOTE_OFF = "note_off"
    CONTROL_CHANGE = "control_change"
    PROGRAM_CHANGE = "program_change"
    PITCH_BEND = "pitchbend"


class MIDIChannel(int, Enum):
    """MIDI channels (0-15)."""
    CH_1 = 0
    CH_2 = 1
    CH_3 = 2
    CH_4 = 3
    CH_5 = 4
    CH_6 = 5
    CH_7 = 6
    CH_8 = 7
    CH_9 = 8
    CH_10 = 9
    CH_11 = 10
    CH_12 = 11
    CH_13 = 12
    CH_14 = 13
    CH_15 = 14
    CH_16 = 15


@dataclass
class MIDIControlMap:
    """Mapping between MIDI controls and PsyFi parameters."""

    # Standard CC mappings
    cc_to_param: Dict[int, str] = field(default_factory=lambda: {
        # Modulation wheel -> phase noise
        1: "phase_noise",
        # Breath controller -> drift amplitude
        2: "drift_amplitude",
        # Foot controller -> drift velocity
        4: "drift_velocity",
        # Volume -> coupling strength
        7: "coupling_strength",
        # Pan -> normalization P
        10: "normalization_P",
        # Expression -> normalization V
        11: "normalization_V",
        # General Purpose 1-4 -> custom mappings
        16: "symmetry_bias",
        17: "depth_distortion",
        18: "valence_bias",
        19: "arousal_level",
    })

    # Note mappings for preset triggering
    note_to_preset: Dict[int, str] = field(default_factory=lambda: {
        60: "baseline",      # C4
        61: "lsd",          # C#4
        62: "psilocybin",   # D4
        63: "dmt",          # D#4
        64: "5-meo-dmt",    # E4
        65: "ketamine",     # F4
        66: "mdma",         # F#4
        67: "mescaline",    # G4
        68: "2c-b",         # G#4
        69: "jhana",        # A4
        70: "rem_dream",    # A#4
    })

    # Program change -> preset categories
    program_to_class: Dict[int, str] = field(default_factory=lambda: {
        0: "baseline",
        1: "classic_psychedelic",
        2: "dissociative",
        3: "empathogen",
        4: "meditative",
    })


@dataclass
class MIDIConfig:
    """MIDI service configuration."""
    input_device: Optional[str] = None
    output_device: Optional[str] = None
    channel: int = 0
    velocity_curve: str = "linear"  # linear, exponential, logarithmic
    cc_smooth_factor: float = 0.1  # 0-1, lower = smoother
    note_velocity_to_intensity: bool = True
    enable_clock: bool = False
    tempo_bpm: float = 120.0


class MIDIService:
    """
    MIDI service for real-time consciousness field control.

    Handles:
    - MIDI input from controllers/DAWs
    - Parameter mapping (CC -> PsyFi params)
    - Preset triggering (notes)
    - MIDI output generation (field states -> MIDI)
    - Real-time parameter smoothing
    """

    def __init__(self, config: Optional[MIDIConfig] = None):
        """Initialize MIDI service."""
        if not MIDI_AVAILABLE:
            raise RuntimeError("MIDI not available. Install mido: pip install mido python-rtmidi")

        self.config = config or MIDIConfig()
        self.control_map = MIDIControlMap()

        self.input_port: Optional[mido.ports.BaseInput] = None
        self.output_port: Optional[mido.ports.BaseOutput] = None

        self._running = False
        self._input_thread: Optional[threading.Thread] = None

        # Current parameter values (smoothed)
        self._params: Dict[str, float] = {}
        self._param_lock = threading.Lock()

        # Callbacks
        self._param_callbacks: List[Callable[[str, float], None]] = []
        self._preset_callbacks: List[Callable[[str, float], None]] = []

    def list_devices(self) -> Dict[str, List[str]]:
        """List available MIDI devices."""
        return {
            "input": mido.get_input_names(),
            "output": mido.get_output_names()
        }

    def open(self, input_device: Optional[str] = None, output_device: Optional[str] = None) -> None:
        """
        Open MIDI ports.

        Args:
            input_device: Name of input device (None = first available)
            output_device: Name of output device (None = first available)
        """
        # Open input
        if input_device or self.config.input_device:
            device = input_device or self.config.input_device
            self.input_port = mido.open_input(device)
            print(f"MIDI input opened: {device}")
        else:
            inputs = mido.get_input_names()
            if inputs:
                self.input_port = mido.open_input(inputs[0])
                print(f"MIDI input opened: {inputs[0]}")

        # Open output
        if output_device or self.config.output_device:
            device = output_device or self.config.output_device
            self.output_port = mido.open_output(device)
            print(f"MIDI output opened: {device}")
        else:
            outputs = mido.get_output_names()
            if outputs:
                self.output_port = mido.open_output(outputs[0])
                print(f"MIDI output opened: {outputs[0]}")

    def close(self) -> None:
        """Close MIDI ports."""
        self.stop()

        if self.input_port:
            self.input_port.close()
            self.input_port = None

        if self.output_port:
            self.output_port.close()
            self.output_port = None

    def start(self) -> None:
        """Start MIDI input processing."""
        if not self.input_port:
            print("Warning: No MIDI input port open")
            return

        self._running = True
        self._input_thread = threading.Thread(target=self._input_loop, daemon=True)
        self._input_thread.start()
        print("MIDI input processing started")

    def stop(self) -> None:
        """Stop MIDI input processing."""
        self._running = False
        if self._input_thread:
            self._input_thread.join(timeout=1.0)
            self._input_thread = None

    def _input_loop(self) -> None:
        """MIDI input processing loop."""
        while self._running and self.input_port:
            for msg in self.input_port.iter_pending():
                self._process_message(msg)
            time.sleep(0.001)  # 1ms sleep to prevent busy-wait

    def _process_message(self, msg: Message) -> None:
        """Process incoming MIDI message."""
        if msg.channel != self.config.channel:
            return

        if msg.type == "control_change":
            self._handle_cc(msg.control, msg.value)

        elif msg.type == "note_on" and msg.velocity > 0:
            self._handle_note_on(msg.note, msg.velocity)

        elif msg.type == "note_off" or (msg.type == "note_on" and msg.velocity == 0):
            self._handle_note_off(msg.note)

        elif msg.type == "program_change":
            self._handle_program_change(msg.program)

        elif msg.type == "pitchbend":
            self._handle_pitch_bend(msg.pitch)

    def _handle_cc(self, control: int, value: int) -> None:
        """Handle control change message."""
        # Map CC to parameter
        if control not in self.control_map.cc_to_param:
            return

        param_name = self.control_map.cc_to_param[control]

        # Normalize to 0-1
        normalized = value / 127.0

        # Apply velocity curve
        if self.config.velocity_curve == "exponential":
            normalized = normalized ** 2
        elif self.config.velocity_curve == "logarithmic":
            normalized = np.sqrt(normalized)

        # Smooth parameter
        with self._param_lock:
            if param_name in self._params:
                # Exponential smoothing
                smoothed = (
                    self.config.cc_smooth_factor * normalized +
                    (1 - self.config.cc_smooth_factor) * self._params[param_name]
                )
            else:
                smoothed = normalized

            self._params[param_name] = smoothed

        # Trigger callbacks
        for callback in self._param_callbacks:
            callback(param_name, smoothed)

    def _handle_note_on(self, note: int, velocity: int) -> None:
        """Handle note on message."""
        # Map note to preset
        if note not in self.control_map.note_to_preset:
            return

        preset_name = self.control_map.note_to_preset[note]

        # Calculate intensity from velocity
        if self.config.note_velocity_to_intensity:
            intensity = velocity / 127.0
        else:
            intensity = 1.0

        # Trigger callbacks
        for callback in self._preset_callbacks:
            callback(preset_name, intensity)

    def _handle_note_off(self, note: int) -> None:
        """Handle note off message."""
        # Could trigger preset fade-out or return to baseline
        pass

    def _handle_program_change(self, program: int) -> None:
        """Handle program change message."""
        # Could switch preset categories
        pass

    def _handle_pitch_bend(self, pitch: int) -> None:
        """Handle pitch bend message."""
        # Normalize to -1 to 1
        normalized = (pitch + 8192) / 16384.0 * 2 - 1

        # Could map to phase reset strength or other bipolar parameter
        with self._param_lock:
            self._params["pitch_bend"] = normalized

    def get_params(self) -> Dict[str, float]:
        """Get current parameter values (thread-safe)."""
        with self._param_lock:
            return self._params.copy()

    def on_param_change(self, callback: Callable[[str, float], None]) -> None:
        """Register parameter change callback."""
        self._param_callbacks.append(callback)

    def on_preset_trigger(self, callback: Callable[[str, float], None]) -> None:
        """Register preset trigger callback."""
        self._preset_callbacks.append(callback)

    def send_cc(self, control: int, value: int) -> None:
        """Send control change message."""
        if not self.output_port:
            return

        msg = Message(
            "control_change",
            channel=self.config.channel,
            control=control,
            value=max(0, min(127, value))
        )
        self.output_port.send(msg)

    def send_note(self, note: int, velocity: int, duration: float = 0.1) -> None:
        """Send note on/off pair."""
        if not self.output_port:
            return

        # Note on
        msg_on = Message(
            "note_on",
            channel=self.config.channel,
            note=note,
            velocity=max(0, min(127, velocity))
        )
        self.output_port.send(msg_on)

        # Schedule note off
        def send_off():
            time.sleep(duration)
            msg_off = Message(
                "note_off",
                channel=self.config.channel,
                note=note,
                velocity=0
            )
            if self.output_port:
                self.output_port.send(msg_off)

        threading.Thread(target=send_off, daemon=True).start()

    def field_to_midi(self, field: np.ndarray, metrics: Dict[str, float]) -> None:
        """
        Convert field state to MIDI output.

        Maps field metrics to MIDI CC messages for visualization/sonification.

        Args:
            field: Consciousness field (complex array)
            metrics: Valence metrics dictionary
        """
        if not self.output_port:
            return

        # Map metrics to CC
        cc_map = {
            1: int(metrics.get("coherence", 0) * 127),      # Modulation
            2: int(metrics.get("symmetry", 0) * 127),       # Breath
            7: int(metrics.get("richness", 0) * 127),       # Volume
            10: int((metrics.get("valence", 0) + 1) * 63.5), # Pan (bipolar)
            11: int(metrics.get("roughness", 0) * 127),     # Expression
        }

        for cc, value in cc_map.items():
            self.send_cc(cc, value)

        # Optional: send notes based on field energy
        mean_energy = np.abs(field).mean()
        if mean_energy > 0.5:
            note = 60 + int(metrics.get("coherence", 0) * 24)  # C4 to C6
            velocity = int(mean_energy * 127)
            self.send_note(note, velocity, duration=0.05)

    def export_to_midi_file(
        self,
        metrics_sequence: List[Dict[str, float]],
        output_path: str,
        ticks_per_beat: int = 480
    ) -> None:
        """
        Export metrics sequence to MIDI file.

        Args:
            metrics_sequence: List of metric dictionaries over time
            output_path: Output MIDI file path
            ticks_per_beat: MIDI resolution
        """
        mid = MidiFile(ticks_per_beat=ticks_per_beat)
        track = MidiTrack()
        mid.tracks.append(track)

        # Tempo
        tempo = mido.bpm2tempo(self.config.tempo_bpm)
        track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))

        # Convert metrics to CC messages
        time_delta = ticks_per_beat  # 1 beat between samples

        for i, metrics in enumerate(metrics_sequence):
            delta = time_delta if i > 0 else 0

            # Valence -> CC 1
            valence_cc = int((metrics.get("valence", 0) + 1) * 63.5)
            track.append(Message(
                "control_change",
                channel=self.config.channel,
                control=1,
                value=valence_cc,
                time=delta
            ))

            # Coherence -> CC 2
            coherence_cc = int(metrics.get("coherence", 0) * 127)
            track.append(Message(
                "control_change",
                channel=self.config.channel,
                control=2,
                value=coherence_cc,
                time=0
            ))

            # Symmetry -> CC 3
            symmetry_cc = int(metrics.get("symmetry", 0) * 127)
            track.append(Message(
                "control_change",
                channel=self.config.channel,
                control=3,
                value=symmetry_cc,
                time=0
            ))

        # Save
        mid.save(output_path)
        print(f"MIDI file exported: {output_path}")


# Convenience functions
def create_midi_service(
    input_device: Optional[str] = None,
    output_device: Optional[str] = None,
    channel: int = 0
) -> MIDIService:
    """Create and configure MIDI service."""
    config = MIDIConfig(
        input_device=input_device,
        output_device=output_device,
        channel=channel
    )
    service = MIDIService(config)
    service.open()
    return service


# Example usage
if __name__ == "__main__":
    if not MIDI_AVAILABLE:
        print("MIDI not available. Install with: pip install mido python-rtmidi")
        exit(1)

    # List devices
    service = MIDIService()
    devices = service.list_devices()
    print("Available MIDI devices:")
    print("  Inputs:", devices["input"])
    print("  Outputs:", devices["output"])

    # Open and start
    service.open()

    # Register callbacks
    def on_param(name: str, value: float):
        print(f"Parameter change: {name} = {value:.3f}")

    def on_preset(name: str, intensity: float):
        print(f"Preset triggered: {name} @ {intensity:.3f}")

    service.on_param_change(on_param)
    service.on_preset_trigger(on_preset)

    service.start()

    print("\nMIDI service running. Send MIDI messages to test.")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
        service.close()
