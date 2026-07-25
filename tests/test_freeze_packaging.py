"""P0 freeze-prep packaging checks."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_freeze_docs_and_goldens_exist() -> None:
    frozen = ROOT / "docs" / "contracts" / "frozen"
    assert (frozen / "API_V1_FREEZE.md").exists()
    assert (frozen / "MANIFEST.json").exists()
    assert (frozen / "openapi.v1.json").exists()
    assert (frozen / "psyfi_visual_frame.v1.json").exists()
    assert (ROOT / "docs" / "PHASE4_USABILITY.md").exists()
    assert (ROOT / "docs" / "BROWSER_CAPABILITY_MATRIX.md").exists()
    assert (ROOT / "docs" / "images" / "psyfi-hero.jpg").exists()
    assert (ROOT / "data" / "phenomenology" / "derived" / "motif_lexicon.v1.json").exists()
    goldens = ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json"
    assert goldens.exists()
    text = goldens.read_text(encoding="utf-8")
    for substance in ("lsd", "psilocybin", "dmt", "5-meo-dmt", "mescaline", "ketamine"):
        assert substance in text


def test_viz_modules_and_dual_canvas_wired() -> None:
    static = ROOT / "psyfi_api" / "static" / "viz"
    for name in (
        "math.js",
        "safetyPass.js",
        "engines/index.js",
        "parameterFieldWebGL.js",
        "experiencePlayer.js",
    ):
        assert (static / name).exists(), name

    html = (ROOT / "psyfi_api" / "templates" / "index.html").read_text(encoding="utf-8")
    assert 'id="experienceCanvas"' in html
    assert 'id="experienceCanvasGL"' in html
    assert "/static/viz/parameterFieldWebGL.js" in html
    assert 'id="phaseScrub"' in html
    assert 'id="bridgeSimBtn"' in html
