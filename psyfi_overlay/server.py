from __future__ import annotations

import argparse
import json
import socketserver
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, Tuple

from .provenance import make_provenance
from .capabilities import route_capability

JSON_CT = "application/json; charset=utf-8"


def _read_json(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        obj = json.loads(raw.decode("utf-8"))
        if not isinstance(obj, dict):
            raise ValueError("root must be object")
        return obj
    except Exception as e:
        raise ValueError(f"invalid json: {e}")


def _write_json(handler: BaseHTTPRequestHandler, status: int, body: Dict[str, Any]) -> None:
    raw = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", JSON_CT)
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


class PsyFiOverlayHandler(BaseHTTPRequestHandler):
    server_version = "psyfi-overlay/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        # Keep logs minimal and deterministic-ish
        return

    def do_GET(self) -> None:
        if self.path == "/health":
            _write_json(self, 200, {"ok": True, "service": "psyfi_overlay"})
            return
        _write_json(self, 404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/run":
            _write_json(self, 404, {"ok": False, "error": "not found"})
            return

        try:
            req = _read_json(self)
        except ValueError as e:
            _write_json(self, 400, {"ok": False, "error": str(e)})
            return

        # Expected envelope from AAL-core runner:
        # { "input": {...}, "provenance": {...}, "policy": {...}, "capability": "psyfi.echo", "seed": "..." }
        cap = req.get("capability", "psyfi.echo")
        seed = req.get("seed")
        input_payload = req.get("input", {})
        if not isinstance(input_payload, dict):
            _write_json(self, 400, {"ok": False, "error": "input must be an object"})
            return

        prov = make_provenance("psyfi", cap, input_payload, seed=seed).to_dict()
        ok, result_or_err = route_capability(cap, input_payload)

        if ok:
            _write_json(self, 200, {"ok": True, "result": result_or_err, "error": None, "provenance": prov})
        else:
            _write_json(self, 200, {"ok": False, "result": None, "error": result_or_err, "provenance": prov})


class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8787)
    args = ap.parse_args()

    srv = ThreadedHTTPServer((args.host, args.port), PsyFiOverlayHandler)
    print(f"[psyfi_overlay] Starting server on {args.host}:{args.port}")
    print(f"[psyfi_overlay] Endpoints: GET /health, POST /run")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[psyfi_overlay] Shutting down...")
    finally:
        srv.server_close()


if __name__ == "__main__":
    main()
