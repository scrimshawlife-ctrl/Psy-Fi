#!/usr/bin/env python3
"""
Deploy PsyFi to Render using the Render API.

Applied Alchemy Labs - ABX-Core v1.3

Usage:
    1. Get your Render API key from https://dashboard.render.com/account/api-keys
    2. Set environment variable: export RENDER_API_KEY="your-key-here"
    3. Run: python scripts/render_deploy.py
"""

import os
import sys
import json
import time
import requests
from typing import Dict, Optional


class RenderDeployer:
    """Deploy PsyFi to Render using API."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize deployer.

        Args:
            api_key: Render API key (or set RENDER_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("RENDER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Render API key required. Set RENDER_API_KEY environment variable or pass as argument.\n"
                "Get your key from: https://dashboard.render.com/account/api-keys"
            )

        self.base_url = "https://api.render.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make API request to Render.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body data

        Returns:
            Response JSON
        """
        url = f"{self.base_url}{endpoint}"

        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=data)
            elif method == "PATCH":
                response = requests.patch(url, headers=self.headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP Error: {e}")
            print(f"Response: {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            raise

    def list_services(self) -> list:
        """List all services in account.

        Returns:
            List of service objects
        """
        response = self._request("GET", "/services")
        return response

    def find_service_by_name(self, name: str) -> Optional[Dict]:
        """Find service by name.

        Args:
            name: Service name to find

        Returns:
            Service object or None
        """
        services = self.list_services()
        for service in services:
            if service.get("service", {}).get("name") == name:
                return service["service"]
        return None

    def create_service(
        self,
        name: str = "psyfi-api",
        repo_url: str = "https://github.com/scrimshawlife-ctrl/Psy-Fi",
        branch: str = "claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv",
        region: str = "oregon",
    ) -> Dict:
        """Create new web service.

        Args:
            name: Service name
            repo_url: GitHub repository URL
            branch: Git branch to deploy
            region: Render region

        Returns:
            Created service object
        """
        print(f"🚀 Creating service '{name}'...")

        service_data = {
            "type": "web_service",
            "name": name,
            "repo": repo_url,
            "branch": branch,
            "region": region,
            "plan": "starter",
            "env": "python",
            "buildCommand": "pip install --upgrade pip && pip install -r requirements.txt",
            "startCommand": "uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT",
            "healthCheckPath": "/health",
            "envVars": [
                {"key": "ENVIRONMENT", "value": "production"},
                {"key": "LOG_LEVEL", "value": "info"},
                {"key": "ENABLE_SAFETY_CLAMP", "value": "true"},
                {"key": "PYTHON_VERSION", "value": "3.11.0"},
            ],
        }

        try:
            response = self._request("POST", "/services", service_data)
            print(f"✅ Service created: {response.get('service', {}).get('id')}")
            return response["service"]
        except Exception as e:
            print(f"❌ Failed to create service: {e}")
            raise

    def get_service(self, service_id: str) -> Dict:
        """Get service details.

        Args:
            service_id: Service ID

        Returns:
            Service object
        """
        return self._request("GET", f"/services/{service_id}")

    def trigger_deploy(self, service_id: str) -> Dict:
        """Trigger manual deploy.

        Args:
            service_id: Service ID

        Returns:
            Deploy object
        """
        print(f"🔄 Triggering deploy for service {service_id}...")
        response = self._request("POST", f"/services/{service_id}/deploys")
        print(f"✅ Deploy triggered: {response.get('id')}")
        return response

    def get_deploys(self, service_id: str) -> list:
        """Get service deploys.

        Args:
            service_id: Service ID

        Returns:
            List of deploy objects
        """
        response = self._request("GET", f"/services/{service_id}/deploys")
        return response

    def wait_for_deploy(self, service_id: str, timeout: int = 600) -> bool:
        """Wait for deploy to complete.

        Args:
            service_id: Service ID
            timeout: Max wait time in seconds

        Returns:
            True if deploy succeeded, False otherwise
        """
        print(f"⏳ Waiting for deploy to complete (timeout: {timeout}s)...")

        start_time = time.time()
        last_status = None

        while time.time() - start_time < timeout:
            deploys = self.get_deploys(service_id)
            if not deploys:
                time.sleep(5)
                continue

            latest_deploy = deploys[0]
            status = latest_deploy.get("status")

            if status != last_status:
                print(f"   Status: {status}")
                last_status = status

            if status == "live":
                print(f"✅ Deploy successful!")
                return True
            elif status in ["failed", "canceled"]:
                print(f"❌ Deploy {status}")
                return False

            time.sleep(10)

        print(f"⏱️ Deploy timed out after {timeout}s")
        return False

    def get_service_url(self, service_id: str) -> Optional[str]:
        """Get service URL.

        Args:
            service_id: Service ID

        Returns:
            Service URL or None
        """
        service = self.get_service(service_id)
        return service.get("serviceDetails", {}).get("url")


def main():
    """Deploy PsyFi to Render."""

    print("╔════════════════════════════════════════╗")
    print("║   PsyFi Render Deployment via API     ║")
    print("║   Applied Alchemy Labs - ABX v1.3      ║")
    print("╚════════════════════════════════════════╝\n")

    # Check API key
    api_key = os.getenv("RENDER_API_KEY")
    if not api_key:
        print("❌ Error: RENDER_API_KEY environment variable not set\n")
        print("📝 Setup Instructions:")
        print("   1. Go to https://dashboard.render.com/account/api-keys")
        print("   2. Click 'Create API Key'")
        print("   3. Copy the key")
        print("   4. Set environment variable:")
        print("      export RENDER_API_KEY='rnd_xxxxxxxxxxxxxxxxxxxxx'\n")
        print("   5. Run this script again\n")
        sys.exit(1)

    try:
        # Initialize deployer
        deployer = RenderDeployer(api_key)

        # Check if service already exists
        print("🔍 Checking for existing service...")
        existing_service = deployer.find_service_by_name("psyfi-api")

        if existing_service:
            service_id = existing_service["id"]
            print(f"✅ Found existing service: {service_id}")
            print(f"   URL: {existing_service.get('serviceDetails', {}).get('url')}\n")

            # Trigger redeploy
            response = input("Trigger redeploy? [y/N]: ")
            if response.lower() == "y":
                deployer.trigger_deploy(service_id)

                # Wait for deploy
                if deployer.wait_for_deploy(service_id):
                    url = deployer.get_service_url(service_id)
                    print(f"\n🎉 Deployment successful!")
                    print(f"   Service URL: {url}")
                    print(f"   Health check: {url}/health")
                    print(f"   Docs: {url}/docs")
                else:
                    print("\n❌ Deployment failed. Check Render dashboard for logs.")
                    sys.exit(1)
            else:
                print("Skipping redeploy.")

        else:
            print("No existing service found.\n")

            # Get repository info
            repo_url = input("Repository URL [https://github.com/scrimshawlife-ctrl/Psy-Fi]: ").strip()
            if not repo_url:
                repo_url = "https://github.com/scrimshawlife-ctrl/Psy-Fi"

            branch = input("Branch [claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv]: ").strip()
            if not branch:
                branch = "claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv"

            print()

            # Create service
            service = deployer.create_service(
                name="psyfi-api",
                repo_url=repo_url,
                branch=branch,
                region="oregon",
            )

            service_id = service["id"]

            # Wait for initial deploy
            if deployer.wait_for_deploy(service_id):
                url = deployer.get_service_url(service_id)
                print(f"\n🎉 Deployment successful!")
                print(f"   Service URL: {url}")
                print(f"   Health check: {url}/health")
                print(f"   Docs: {url}/docs")
            else:
                print("\n❌ Deployment failed. Check Render dashboard for logs.")
                print(f"   Dashboard: https://dashboard.render.com/")
                sys.exit(1)

        print("\n✨ Done!")

    except KeyboardInterrupt:
        print("\n\n⏹️  Deployment canceled by user")
        sys.exit(1)

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
