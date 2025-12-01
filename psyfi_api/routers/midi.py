"""MIDI API endpoints for PsyFi."""

from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from psyfi_core.midi import MIDI_AVAILABLE, MIDIService, MIDIConfig, create_midi_service

# Global MIDI service instance
_midi_service: Optional[MIDIService] = None

router = APIRouter(prefix="/api/midi", tags=["MIDI"])


# Request/Response models
class MIDIDevicesResponse(BaseModel):
    """Available MIDI devices."""
    input: List[str]
    output: List[str]
    midi_available: bool


class MIDIConfigRequest(BaseModel):
    """MIDI configuration."""
    input_device: Optional[str] = None
    output_device: Optional[str] = None
    channel: int = Field(default=0, ge=0, le=15)
    velocity_curve: str = Field(default="linear", pattern="^(linear|exponential|logarithmic)$")
    cc_smooth_factor: float = Field(default=0.1, ge=0.0, le=1.0)


class MIDIStatusResponse(BaseModel):
    """MIDI service status."""
    running: bool
    input_device: Optional[str]
    output_device: Optional[str]
    channel: int
    current_params: Dict[str, float]


class MIDICCRequest(BaseModel):
    """Send MIDI CC message."""
    control: int = Field(ge=0, le=127)
    value: int = Field(ge=0, le=127)


class MIDINoteRequest(BaseModel):
    """Send MIDI note."""
    note: int = Field(ge=0, le=127)
    velocity: int = Field(ge=0, le=127)
    duration: float = Field(default=0.1, ge=0.0, le=10.0)


class MIDIControlMapResponse(BaseModel):
    """Current MIDI control mappings."""
    cc_to_param: Dict[int, str]
    note_to_preset: Dict[int, str]
    program_to_class: Dict[int, str]


@router.get("/devices", response_model=MIDIDevicesResponse)
async def list_midi_devices() -> MIDIDevicesResponse:
    """
    List available MIDI input and output devices.

    Returns:
        Dictionary with input/output device lists
    """
    if not MIDI_AVAILABLE:
        return MIDIDevicesResponse(
            input=[],
            output=[],
            midi_available=False
        )

    try:
        service = MIDIService()
        devices = service.list_devices()
        return MIDIDevicesResponse(
            input=devices["input"],
            output=devices["output"],
            midi_available=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list MIDI devices: {str(e)}")


@router.post("/start")
async def start_midi_service(config: MIDIConfigRequest) -> Dict[str, str]:
    """
    Start MIDI service with configuration.

    Args:
        config: MIDI configuration

    Returns:
        Status message
    """
    global _midi_service

    if not MIDI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="MIDI not available. Install with: pip install mido python-rtmidi"
        )

    if _midi_service and _midi_service._running:
        raise HTTPException(status_code=409, detail="MIDI service already running")

    try:
        # Create config
        midi_config = MIDIConfig(
            input_device=config.input_device,
            output_device=config.output_device,
            channel=config.channel,
            velocity_curve=config.velocity_curve,
            cc_smooth_factor=config.cc_smooth_factor,
        )

        # Create and start service
        _midi_service = MIDIService(midi_config)
        _midi_service.open(config.input_device, config.output_device)
        _midi_service.start()

        return {
            "status": "started",
            "message": "MIDI service started successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start MIDI service: {str(e)}")


@router.post("/stop")
async def stop_midi_service() -> Dict[str, str]:
    """
    Stop MIDI service.

    Returns:
        Status message
    """
    global _midi_service

    if not _midi_service:
        raise HTTPException(status_code=404, detail="MIDI service not running")

    try:
        _midi_service.close()
        _midi_service = None

        return {
            "status": "stopped",
            "message": "MIDI service stopped successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop MIDI service: {str(e)}")


@router.get("/status", response_model=MIDIStatusResponse)
async def get_midi_status() -> MIDIStatusResponse:
    """
    Get current MIDI service status.

    Returns:
        Service status and current parameters
    """
    if not _midi_service:
        return MIDIStatusResponse(
            running=False,
            input_device=None,
            output_device=None,
            channel=0,
            current_params={}
        )

    return MIDIStatusResponse(
        running=_midi_service._running,
        input_device=_midi_service.config.input_device,
        output_device=_midi_service.config.output_device,
        channel=_midi_service.config.channel,
        current_params=_midi_service.get_params()
    )


@router.get("/mappings", response_model=MIDIControlMapResponse)
async def get_midi_mappings() -> MIDIControlMapResponse:
    """
    Get current MIDI control mappings.

    Returns:
        CC, note, and program change mappings
    """
    if not _midi_service:
        raise HTTPException(status_code=404, detail="MIDI service not running")

    return MIDIControlMapResponse(
        cc_to_param=_midi_service.control_map.cc_to_param,
        note_to_preset={
            k: v for k, v in _midi_service.control_map.note_to_preset.items()
        },
        program_to_class=_midi_service.control_map.program_to_class
    )


@router.post("/send/cc")
async def send_midi_cc(request: MIDICCRequest) -> Dict[str, str]:
    """
    Send MIDI Control Change message.

    Args:
        request: CC message parameters

    Returns:
        Status message
    """
    if not _midi_service:
        raise HTTPException(status_code=404, detail="MIDI service not running")

    if not _midi_service.output_port:
        raise HTTPException(status_code=503, detail="No MIDI output device open")

    try:
        _midi_service.send_cc(request.control, request.value)
        return {
            "status": "sent",
            "message": f"CC {request.control} = {request.value} sent"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send CC: {str(e)}")


@router.post("/send/note")
async def send_midi_note(request: MIDINoteRequest) -> Dict[str, str]:
    """
    Send MIDI note on/off.

    Args:
        request: Note message parameters

    Returns:
        Status message
    """
    if not _midi_service:
        raise HTTPException(status_code=404, detail="MIDI service not running")

    if not _midi_service.output_port:
        raise HTTPException(status_code=503, detail="No MIDI output device open")

    try:
        _midi_service.send_note(request.note, request.velocity, request.duration)
        return {
            "status": "sent",
            "message": f"Note {request.note} velocity {request.velocity} sent"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send note: {str(e)}")


@router.get("/params")
async def get_midi_params() -> Dict[str, float]:
    """
    Get current MIDI-controlled parameters.

    Returns:
        Dictionary of parameter name -> value
    """
    if not _midi_service:
        return {}

    return _midi_service.get_params()
