#!/usr/bin/env python3
"""Run the PsyFi overlay server.

This server provides a capability-based API with provenance tracking.

Usage:
    python scripts/run_overlay_server.py
    python scripts/run_overlay_server.py --host 0.0.0.0 --port 8787
"""

if __name__ == "__main__":
    from psyfi_overlay.server import main
    main()
