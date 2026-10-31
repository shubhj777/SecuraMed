"""
Attack Scenario 5: Firmware Tampering Simulator
Alters bytes in a firmware update package to test detection of backdoor injection.
"""

import httpx

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 5: Firmware Tampering ---")
    with httpx.Client() as client:
        print("[*] Launching firmware tampering attack scenario...")
        r = client.post(f"{gateway_url}/api/attacks/simulate", json={
            "target_device": "MED-001",
            "attack_type": "FIRMWARE_TAMPERING"
        })
        print(f"[*] Response: {r.status_code}")
        print(f"[*] Details: {r.json()}")

if __name__ == "__main__":
    run_attack()
