from __future__ import annotations

import plistlib
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / "deploy" / "macos"


class MacDeployContractTest(unittest.TestCase):
    def _rendered(
        self, temporary: Path, domain: str | None = "example.ngrok.app"
    ) -> tuple[Path, Path]:
        state = temporary / "private state"
        agents = temporary / "LaunchAgents"
        arguments = [
            sys.executable,
            str(DEPLOY / "render_templates.py"),
            "--templates",
            str(DEPLOY / "templates"),
            "--launch-agents",
            str(agents),
            "--state-dir",
            str(state),
            "--runtime-dir",
            "/Users/tiktok/Services/SynthFlag",
        ]
        if domain:
            arguments.extend(("--domain", domain))
        subprocess.run(arguments, check=True)
        return state, agents

    def test_prepare_only_render_omits_public_ngrok_agent(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            state, agents = self._rendered(Path(temporary), domain=None)
            self.assertTrue((agents / "com.synthflag.inference.plist").is_file())
            self.assertFalse((agents / "com.synthflag.ngrok.plist").exists())
            self.assertTrue((state / "ngrok.yml").is_file())

    def test_launch_agents_are_single_worker_loopback_mps_services(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            state, agents = self._rendered(Path(temporary))
            with (agents / "com.synthflag.inference.plist").open("rb") as source:
                inference = plistlib.load(source)
            arguments = inference["ProgramArguments"]
            self.assertEqual(arguments[arguments.index("--host") + 1], "127.0.0.1")
            self.assertEqual(arguments[arguments.index("--workers") + 1], "1")
            self.assertIn("--no-access-log", arguments)
            self.assertTrue(inference["RunAtLoad"])
            self.assertTrue(inference["KeepAlive"])
            environment = inference["EnvironmentVariables"]
            self.assertEqual(environment["SYNTHFLAG_DEVICE"], "mps")
            self.assertEqual(environment["SYNTHFLAG_EAGER_LOAD"], "1")
            self.assertEqual(environment["PYTORCH_ENABLE_MPS_FALLBACK"], "0")

            with (agents / "com.synthflag.ngrok.plist").open("rb") as source:
                ngrok = plistlib.load(source)
            self.assertIn("http://127.0.0.1:8000", ngrok["ProgramArguments"])
            self.assertIn("https://example.ngrok.app", ngrok["ProgramArguments"])
            self.assertTrue(ngrok["RunAtLoad"])
            self.assertTrue(ngrok["KeepAlive"])
            self.assertIn("web_addr: false", (state / "ngrok.yml").read_text())

    def test_edge_policy_has_exact_routes_and_separate_limits(self) -> None:
        policy = (DEPLOY / "templates" / "traffic-policy.yml").read_text()
        self.assertIn("capacity: 20", policy)
        self.assertIn("capacity: 6", policy)
        self.assertEqual(policy.count("rate: 10m"), 2)
        self.assertEqual(policy.count("bucket_key:"), 2)
        self.assertIn("conn.client_ip", policy)
        self.assertIn("req.url.path == '/v1/analyze'", policy)
        self.assertIn("req.url.path == '/v1/analyze-frames'", policy)
        self.assertIn("req.url.path == '/health'", policy)
        self.assertIn("status_code: 404", policy)

    def test_ngrok_release_is_version_and_checksum_pinned(self) -> None:
        installer = (DEPLOY / "install.sh").read_text()
        self.assertIn('NGROK_VERSION="3.39.11"', installer)
        self.assertIn("ngrok-v3-3.39.11-darwin-arm64.zip", installer)
        self.assertIn(
            "9324a6552d74e25d5bdfdbedc4b32422c96f044fda37877498ad8ef10bddf7f7",
            installer,
        )
        self.assertIn("TeamIdentifier=TEX8MHRDQ9", installer)


if __name__ == "__main__":
    unittest.main()
