"""
Patient Monitor & ECG Monitor Standalone Emulator Runner
Can run continuous synthetic vital sign streaming for demonstrations.
"""

import time
import argparse
import sys
import httpx

from device_emulator.device_identity import DeviceIdentity
from device_emulator.device_client import DeviceClient

def run_emulator(device_id: str, device_name: str, device_type: str, gateway_url: str, interval: float = 3.0, iterations: int = 10):
    print(f"\n==================================================")
    print(f"  SecureMed Device Emulator: {device_name} ({device_id})")
    print(f"  Target Gateway: {gateway_url}")
    print(f"  Notice: All telemetry is SYNTHETIC / DEMO DATA.")
    print(f"==================================================\n")

    # 1. Fetch demo signing key from gateway if pre-seeded, or generate new identity
    with httpx.Client() as client:
        try:
            demo_keys_resp = client.get(f"{gateway_url}/api/demo-keys", timeout=5.0)
            demo_keys = demo_keys_resp.json() if demo_keys_resp.status_code == 200 else {}
        except Exception:
            demo_keys = {}

        if device_id in demo_keys:
            # Fetch device info to get public key
            dev_resp = client.get(f"{gateway_url}/api/devices/{device_id}", timeout=5.0)
            dev_info = dev_resp.json()
            identity = DeviceIdentity.from_existing_keys(
                device_id=device_id,
                device_name=device_name,
                public_key_hex=dev_info["public_key"],
                secret_key_hex=demo_keys[device_id],
                device_type=device_type
            )
            print(f"[+] Loaded registered ML-DSA-65 identity for {device_id}")
        else:
            identity = DeviceIdentity(device_id, device_name, device_type)
            print(f"[+] Generated fresh ML-DSA-65 identity for {device_id}")
            reg_ok = DeviceClient(identity, gateway_url).register(client)
            print(f"[+] Registration status: {'SUCCESS' if reg_ok else 'FAILED'}")

        device = DeviceClient(identity, gateway_url)

        # 2. Handshake
        print("[*] Initiating Authenticated PQC Handshake (ML-KEM-768 + ML-DSA-65)...")
        hs_ok, hs_msg = device.authenticate_and_handshake(client)
        if not hs_ok:
            print(f"[-] Handshake FAILED: {hs_msg}")
            return
        print(f"[+] {hs_msg}")

        # 3. Stream Telemetry
        print(f"[*] Streaming synthetic vital signs (Interval: {interval}s)...")
        count = 0
        while iterations <= 0 or count < iterations:
            ok, resp = device.send_telemetry(client)
            if ok:
                print(f"[+] Packet #{device.sequence_number} ACCEPTED: status={resp.get('status')} at {resp.get('timestamp')}")
            else:
                print(f"[-] Packet #{device.sequence_number} REJECTED: {resp}")
            count += 1
            time.sleep(interval)

    print("[*] Emulator session completed successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SecureMed Medical Device Emulator")
    parser.add_argument("--device-id", default="MED-001", help="Device ID")
    parser.add_argument("--name", default="Patient Monitor 01", help="Device Name")
    parser.add_argument("--type", default="PATIENT_MONITOR", help="Device Type")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="Gateway URL")
    parser.add_argument("--interval", type=float, default=2.0, help="Transmission interval (seconds)")
    parser.add_argument("--iterations", type=int, default=5, help="Number of packets to send (0 for infinite)")
    args = parser.parse_args()

    run_emulator(args.device_id, args.name, args.type, args.url, args.interval, args.iterations)
