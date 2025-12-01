#!/usr/bin/env python3
"""Quick startup test for PsyFi API - verifies app can start without MIDI."""

import sys

print("Testing PsyFi API startup...")
print("-" * 50)

# Test 1: Import FastAPI app
print("\n1. Testing FastAPI app import...")
try:
    from psyfi_api.main import app
    print("   ✅ FastAPI app imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import app: {e}")
    sys.exit(1)

# Test 2: Check MIDI availability
print("\n2. Checking MIDI availability...")
try:
    from psyfi_core.midi import MIDI_AVAILABLE
    if MIDI_AVAILABLE:
        print("   ✅ MIDI is available")
    else:
        print("   ⚠️  MIDI not available (expected on minimal deployments)")
except Exception as e:
    print(f"   ❌ Failed to check MIDI: {e}")
    sys.exit(1)

# Test 3: Test MIDI router handles missing MIDI
print("\n3. Testing MIDI router with MIDI unavailable...")
try:
    from psyfi_api.routers.midi import router
    print("   ✅ MIDI router imported (graceful degradation)")
except Exception as e:
    print(f"   ❌ Failed to import MIDI router: {e}")
    sys.exit(1)

# Test 4: Check core imports
print("\n4. Testing core PsyFi imports...")
try:
    from psyfi_core.engines import evolve_consciousness_omega
    from psyfi_core.models import ResonanceFrame
    print("   ✅ Core PsyFi modules available")
except Exception as e:
    print(f"   ❌ Failed to import core: {e}")
    sys.exit(1)

# Test 5: Check FastAPI routes
print("\n5. Checking FastAPI routes...")
try:
    routes = [route.path for route in app.routes]
    required_routes = ["/health", "/", "/api/info"]
    for route in required_routes:
        if route in routes:
            print(f"   ✅ {route}")
        else:
            print(f"   ❌ Missing route: {route}")
            sys.exit(1)
except Exception as e:
    print(f"   ❌ Failed to check routes: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
print("✅ All startup tests passed!")
print("=" * 50)
print("\nPsyFi API is ready to deploy.")
print("Start with: uvicorn psyfi_api.main:app --host 0.0.0.0 --port 8000")
