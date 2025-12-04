from pathlib import Path


def test_render_yaml_contains_render_web_service():
    content = Path("render.yaml").read_text()

    expected_fragments = [
        "type: web",
        "env: python",
        "buildCommand: pip install --upgrade pip && pip install -r requirements.txt",
        "startCommand: uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT",
        "healthCheckPath: /health",
    ]

    for fragment in expected_fragments:
        assert (
            fragment in content
        ), f"Expected '{fragment}' to be present in render.yaml for Render deployment"



def test_render_yaml_includes_production_defaults():
    content = Path("render.yaml").read_text()

    assert "name: psyfi-api" in content
    assert "plan: starter" in content

    expected_env_vars = [
        "ENVIRONMENT",
        "LOG_LEVEL",
        "ENABLE_SAFETY_CLAMP",
        "PYTHON_VERSION",
    ]

    for var in expected_env_vars:
        assert var in content, f"Missing '{var}' env var in render.yaml"
