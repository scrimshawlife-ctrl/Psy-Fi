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
    assert 'src="/static/renderer.js"' in html
    assert 'src="/static/app.js"' in html


def test_service_worker_precaches_renderer_assets() -> None:
    sw = (STATIC / "sw.js").read_text(encoding="utf-8")
    assert "psyfi-shell-v3" in sw
    assert "/static/renderer.js" in sw
    assert "/static/render_worker.js" in sw
    assert "/simulate" in sw  # still treated as network-only path matcher


def test_app_uses_abort_controller_and_worker_renderer() -> None:
    app_js = (STATIC / "app.js").read_text(encoding="utf-8")
    assert "AbortController" in app_js
    assert "PsyFiRenderer" in app_js
    renderer_js = (STATIC / "renderer.js").read_text(encoding="utf-8")
    assert "render_worker.js" in renderer_js
    assert "navigator.gpu" in renderer_js
