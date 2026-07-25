"""Smoke checks that Phase 2 static shell assets remain wired together."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "psyfi_api" / "static"
TEMPLATE = ROOT / "psyfi_api" / "templates" / "index.html"


def test_renderer_and_worker_assets_exist() -> None:
    assert (STATIC / "renderer.js").exists()
    assert (STATIC / "render_worker.js").exists()
    assert (STATIC / "app.js").exists()
    assert (STATIC / "sw.js").exists()


def test_template_wires_cancel_recovery_and_renderer() -> None:
    html = TEMPLATE.read_text(encoding="utf-8")
    assert 'id="cancelButton"' in html
    assert 'id="recoveryBanner"' in html
    assert 'id="fieldCanvasGPU"' in html
    assert 'id="installButton"' in html
    assert 'id="importSessionInput"' in html
    assert 'id="loadingStatus"' in html
    assert 'id="experienceCanvasGL"' in html
    assert 'id="phaseScrub"' in html
    assert 'id="sourcePlaneChk"' in html
    assert 'id="sourcePlaneMix"' in html
    assert 'id="bridgeSimBtn"' in html
    assert 'id="modAudio"' in html
    assert 'id="modHaptics"' in html
    assert 'id="enableAudioBtn"' in html
    assert 'id="enableHapticsBtn"' in html
    assert 'id="enableAvailableSensorsBtn"' in html
    assert 'id="sensorChipRow"' in html
    assert 'href="/gpu/"' in html
    assert 'src="/static/renderer.js"' in html
    assert 'src="/static/viz/parameterFieldWebGL.js"' in html
    assert 'src="/static/viz/deviceSensors.js"' in html
    assert 'src="/static/app.js"' in html
    # Root-scoped SW registration (not /static/sw.js — that cannot control `/`).
    assert "serviceWorker.register('/sw.js'" in html
    assert "scope: '/'" in html


def test_service_worker_precaches_renderer_assets() -> None:
    sw = (STATIC / "sw.js").read_text(encoding="utf-8")
    assert "psyfi-shell-v13" in sw
    assert "/static/renderer.js" in sw
    assert "/static/render_worker.js" in sw
    assert "/static/viz/math.js" in sw
    assert "/static/viz/engines/index.js" in sw
    assert "/static/viz/parameterFieldWebGL.js" in sw
    assert "/static/viz/deviceSensors.js" in sw
    assert "/static/viz/experiencePlayer.js" in sw
    assert "/static/icon-192.png" in sw
    assert "/simulate" in sw  # still treated as network-only path matcher
    assert "isGpuRoute" in sw
    assert "/gpu/" in sw
    # GPU dist must not be shell-precached (separate route decision).
    assert "/gpu/" not in sw.split("SHELL_URLS")[1].split("];")[0]


def test_pwa_gpu_route_decision_documented() -> None:
    doc = (ROOT / "docs" / "PWA_GPU_ROUTE.md").read_text(encoding="utf-8")
    assert "separate route" in doc.lower()
    assert "/gpu/" in doc
    assert "not embed" in doc.lower() or "Do **not** embed" in doc
    manifest = (STATIC / "manifest.json").read_text(encoding="utf-8")
    assert '"url": "/gpu/"' in manifest
    assert '"start_url": "/"' in manifest
    app_js = (STATIC / "app.js").read_text(encoding="utf-8")
    assert 'href="/gpu/"' in app_js
    assert "GPU Lab route" in app_js


def test_pwa_png_icons_exist() -> None:
    assert (STATIC / "icon-192.png").exists()
    assert (STATIC / "icon-512.png").exists()
    assert (STATIC / "icon-192.png").read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def test_app_uses_abort_controller_and_worker_renderer() -> None:
    app_js = (STATIC / "app.js").read_text(encoding="utf-8")
    assert "AbortController" in app_js
    assert "PsyFiRenderer" in app_js
    assert "const API_V1 = '/api/v1'" in app_js
    assert "beforeinstallprompt" in app_js
    assert "importSessionInput" in app_js
    assert "setSourcePlane" in app_js
    assert "lastBridgeField" in app_js
    assert "modAudio" in app_js
    assert "modHaptics" in app_js
    assert "enableAudioBtn" in app_js
    assert "enableHapticsBtn" in app_js
    assert "DeviceSensorHub" in app_js
    assert "enableAvailableSensorsBtn" in app_js
    assert "probeSensorCapabilities" in app_js
    renderer_js = (STATIC / "renderer.js").read_text(encoding="utf-8")
    assert "render_worker.js" in renderer_js
    assert "navigator.gpu" in renderer_js
    player_js = (STATIC / "viz" / "experiencePlayer.js").read_text(encoding="utf-8")
    assert "setSourcePlane" in player_js
    assert "sampleSourcePlane" in player_js
    assert "packSourceField" in player_js
    assert "audio:" in player_js
    assert "haptics:" in player_js
    assert "neutralOn" in player_js
    assert "_materializeNeutral" in player_js
    assert "_liveRematerialize" in player_js
    assert "loadContext" in player_js
    sensors_js = (STATIC / "viz" / "deviceSensors.js").read_text(encoding="utf-8")
    assert "probeSensorCapabilities" in sensors_js
    assert "enableAvailable" in sensors_js
    assert "DeviceOrientation" in sensors_js or "deviceorientation" in sensors_js
    assert "requestMIDIAccess" in sensors_js
    assert "getGamepads" in sensors_js
    gl_js = (STATIC / "viz" / "parameterFieldWebGL.js").read_text(encoding="utf-8")
    assert "u_sourceMix" in gl_js
    assert "u_source" in gl_js
    assert "u_safetyAtten" in gl_js
    assert "measureAtten" in gl_js
    safety_js = (STATIC / "viz" / "safetyPass.js").read_text(encoding="utf-8")
    assert "measureAtten" in safety_js
