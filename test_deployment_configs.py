#!/usr/bin/env python3
"""
Test deployment configuration files for validity.

Applied Alchemy Labs - ABX-Core v1.3
"""

import json
import yaml
import sys
from pathlib import Path


def test_json_file(file_path: str) -> bool:
    """Test if JSON file is valid."""
    try:
        with open(file_path, 'r') as f:
            json.load(f)
        print(f"✅ {file_path}: Valid JSON")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ {file_path}: Invalid JSON - {e}")
        return False
    except FileNotFoundError:
        print(f"⚠️  {file_path}: File not found")
        return False


def test_yaml_file(file_path: str) -> bool:
    """Test if YAML file is valid."""
    try:
        with open(file_path, 'r') as f:
            yaml.safe_load(f)
        print(f"✅ {file_path}: Valid YAML")
        return True
    except yaml.YAMLError as e:
        print(f"❌ {file_path}: Invalid YAML - {e}")
        return False
    except FileNotFoundError:
        print(f"⚠️  {file_path}: File not found")
        return False


def main():
    """Test all deployment configuration files."""
    print("🧪 Testing Deployment Configuration Files\n")
    print("=" * 60)

    results = []

    # Test JSON files
    print("\n📄 JSON Files:")
    json_files = [
        "azure-deploy.json",
    ]
    for file in json_files:
        results.append(test_json_file(file))

    # Test YAML files
    print("\n📄 YAML Files:")
    yaml_files = [
        "render.yaml",
        "render.button.yaml",
        "azure-pipelines.yml",
        "azure.yaml",
        "app.yaml",
        "cloudbuild.yaml",
    ]
    for file in yaml_files:
        results.append(test_yaml_file(file))

    # Test file existence
    print("\n📄 Required Files:")
    required_files = [
        "requirements.txt",
        "Dockerfile",
        "Procfile",
        ".gcloudignore",
        "deploy-buttons.md",
    ]
    for file in required_files:
        if Path(file).exists():
            print(f"✅ {file}: Exists")
            results.append(True)
        else:
            print(f"❌ {file}: Missing")
            results.append(False)

    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)

    print(f"\n📊 Results: {passed}/{total} tests passed")

    if all(results):
        print("\n✅ All deployment configurations are valid!")
        print("   Ready to deploy to Render, Azure, and Google Cloud.")
        return 0
    else:
        print("\n❌ Some configuration files have issues.")
        print("   Fix errors above before deploying.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
