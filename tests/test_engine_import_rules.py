"""Tests enforcing purity constraints for psyfi_core engines."""

from __future__ import annotations

import ast
from pathlib import Path


ENGINE_DIR = Path(__file__).resolve().parents[1] / "psyfi_core" / "engines"
FORBIDDEN_IMPORTS = {
    "os",
    "pathlib",
    "requests",
    "httpx",
    "time",
    "datetime",
    "random",
    "uuid",
}


def _engine_files() -> list[Path]:
    return sorted(ENGINE_DIR.glob("*.py"))


def _parse_file(path: Path) -> ast.AST:
    return ast.parse(path.read_text(encoding="utf-8"))


def test_engines_do_not_import_forbidden_modules() -> None:
    violations: list[str] = []

    for path in _engine_files():
        tree = _parse_file(path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    base = alias.name.split(".")[0]
                    if base in FORBIDDEN_IMPORTS:
                        violations.append(f"{path}: import {alias.name}")
            if isinstance(node, ast.ImportFrom):
                if node.module is None:
                    continue
                base = node.module.split(".")[0]
                if base in FORBIDDEN_IMPORTS:
                    violations.append(f"{path}: from {node.module} import ...")

    assert not violations, "Forbidden imports in engines:\n" + "\n".join(violations)


def test_rng_usage_requires_explicit_seed_argument() -> None:
    violations: list[str] = []

    for path in _engine_files():
        tree = _parse_file(path)
        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            rng_access = any(
                isinstance(child, ast.Attribute)
                and child.attr == "rng"
                and isinstance(child.value, ast.Name)
                and child.value.id == "runtime"
                for child in ast.walk(node)
            )
            if rng_access:
                arg_names = [arg.arg for arg in node.args.args]
                if "seed" not in arg_names:
                    violations.append(f"{path}:{node.lineno} {node.name}() missing seed")

    assert not violations, (
        "Engine functions using runtime.rng must accept a seed argument:\n"
        + "\n".join(violations)
    )
