#!/usr/bin/env python3
"""Development server for PsyFi API."""

import uvicorn


def main() -> None:
    """Run the development server."""
    uvicorn.run(
        "psyfi_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
