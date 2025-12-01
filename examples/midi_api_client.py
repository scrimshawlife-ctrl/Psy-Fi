"""REST API client example for PsyFi MIDI control.

This example demonstrates controlling PsyFi via HTTP REST API
instead of using the Python MIDI library directly.

Use case: Remote control of PsyFi from web apps, mobile apps,
or other services.

Applied Alchemy Labs - ABX-Core v1.3
"""

import time
import requests
from typing import Dict, Optional


class PsyFiMIDIClient:
    """HTTP client for PsyFi MIDI API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """Initialize client.

        Args:
            base_url: PsyFi API base URL
        """
        self.base_url = base_url.rstrip("/")
        self.api_url = f"{self.base_url}/api/midi"

    def list_devices(self) -> Dict[str, list]:
        """List available MIDI devices.

        Returns:
            Dictionary with 'input' and 'output' device lists
        """
        response = requests.get(f"{self.api_url}/devices")
        response.raise_for_status()
        return response.json()

    def start(
        self,
        input_device: Optional[str] = None,
        output_device: Optional[str] = None,
        channel: int = 0,
        velocity_curve: str = "linear",
        cc_smooth_factor: float = 0.1,
    ) -> Dict[str, str]:
        """Start MIDI service.

        Args:
            input_device: MIDI input device name (None for default)
            output_device: MIDI output device name (None for none)
            channel: MIDI channel (0-15)
            velocity_curve: "linear", "exponential", or "logarithmic"
            cc_smooth_factor: Smoothing factor (0.0-1.0)

        Returns:
            Status dictionary
        """
        payload = {
            "input_device": input_device,
            "output_device": output_device,
            "channel": channel,
            "velocity_curve": velocity_curve,
            "cc_smooth_factor": cc_smooth_factor,
        }
        response = requests.post(f"{self.api_url}/start", json=payload)
        response.raise_for_status()
        return response.json()

    def stop(self) -> Dict[str, str]:
        """Stop MIDI service.

        Returns:
            Status dictionary
        """
        response = requests.post(f"{self.api_url}/stop")
        response.raise_for_status()
        return response.json()

    def get_status(self) -> Dict:
        """Get MIDI service status.

        Returns:
            Status including current parameters
        """
        response = requests.get(f"{self.api_url}/status")
        response.raise_for_status()
        return response.json()

    def get_mappings(self) -> Dict:
        """Get MIDI control mappings.

        Returns:
            CC, note, and program mappings
        """
        response = requests.get(f"{self.api_url}/mappings")
        response.raise_for_status()
        return response.json()

    def send_cc(self, control: int, value: int) -> Dict[str, str]:
        """Send MIDI Control Change.

        Args:
            control: CC number (0-127)
            value: CC value (0-127)

        Returns:
            Status dictionary
        """
        payload = {"control": control, "value": value}
        response = requests.post(f"{self.api_url}/send/cc", json=payload)
        response.raise_for_status()
        return response.json()

    def send_note(self, note: int, velocity: int, duration: float = 0.1) -> Dict[str, str]:
        """Send MIDI note.

        Args:
            note: Note number (0-127)
            velocity: Velocity (0-127)
            duration: Duration in seconds

        Returns:
            Status dictionary
        """
        payload = {"note": note, "velocity": velocity, "duration": duration}
        response = requests.post(f"{self.api_url}/send/note", json=payload)
        response.raise_for_status()
        return response.json()

    def get_params(self) -> Dict[str, float]:
        """Get current MIDI-controlled parameters.

        Returns:
            Parameter dictionary
        """
        response = requests.get(f"{self.api_url}/params")
        response.raise_for_status()
        return response.json()


def main():
    """Run API client demo."""

    print("╔════════════════════════════════════════╗")
    print("║   PsyFi MIDI API Client Demo          ║")
    print("║   Applied Alchemy Labs - ABX v1.3      ║")
    print("╚════════════════════════════════════════╝\n")

    # Create client
    client = PsyFiMIDIClient("http://localhost:8000")

    try:
        # 1. List devices
        print("📟 Listing MIDI devices...")
        devices = client.list_devices()
        print(f"   Input devices: {devices['input']}")
        print(f"   Output devices: {devices['output']}")
        print(f"   MIDI available: {devices['midi_available']}\n")

        if not devices['midi_available']:
            print("❌ MIDI not available. Install:")
            print("   pip install mido python-rtmidi\n")
            return

        # 2. Start MIDI service
        print("▶️  Starting MIDI service...")
        result = client.start(
            input_device=None,  # Use default
            channel=0,
            cc_smooth_factor=0.1
        )
        print(f"   {result['message']}\n")

        # 3. Get mappings
        print("🎹 MIDI Control Mappings:")
        mappings = client.get_mappings()

        print("   CC → Parameter:")
        for cc, param in mappings['cc_to_param'].items():
            print(f"      CC{int(cc):3d} → {param}")

        print("\n   Note → Preset:")
        for note, preset in list(mappings['note_to_preset'].items())[:5]:
            print(f"      {int(note):3d} → {preset}")
        print("      ...\n")

        # 4. Send some MIDI messages
        print("🎚️  Sending MIDI messages...\n")

        # Sweep modulation wheel (CC1 → phase_noise)
        print("   Sweeping CC1 (phase_noise): 0 → 127")
        for value in range(0, 128, 16):
            client.send_cc(control=1, value=value)
            time.sleep(0.1)
            params = client.get_params()
            print(f"      CC1 = {value:3d} → phase_noise = {params.get('phase_noise', 0):.3f}")

        print()

        # Trigger some presets
        print("   Triggering presets via notes:")
        presets = [
            (60, "baseline"),
            (61, "lsd"),
            (62, "psilocybin"),
            (64, "ketamine"),
        ]

        for note, name in presets:
            print(f"      Note {note} (velocity 100) → {name}")
            client.send_note(note=note, velocity=100, duration=0.2)
            time.sleep(0.5)

        print()

        # 5. Monitor status
        print("📊 Monitoring MIDI status for 5 seconds...\n")
        for i in range(5):
            status = client.get_status()
            params = status['current_params']
            print(f"   [{i+1}/5] Running: {status['running']} | "
                  f"Params: {len(params)} active")
            time.sleep(1)

        print()

        # 6. Stop service
        print("⏹️  Stopping MIDI service...")
        result = client.stop()
        print(f"   {result['message']}\n")

        print("✨ Demo complete!\n")

    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to PsyFi API")
        print("   Make sure PsyFi server is running:")
        print("   cd psyfi_api")
        print("   uvicorn main:app --reload\n")

    except requests.exceptions.HTTPError as e:
        print(f"\n❌ HTTP Error: {e}")
        print(f"   Response: {e.response.text}\n")

    except Exception as e:
        print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()
