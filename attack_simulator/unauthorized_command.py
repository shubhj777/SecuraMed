"""
Attack Scenario 4: Unauthorized Command Simulator
Sends a clinical control / override command from a read-only telemetry device.
"""

import httpx

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 4: Unauthorized Command ---")
    with httpx.Client() as client:
        print("[*] Launching unauthorized command attack scenario...")
        r = client.post(f"{gateway_url}/api/attacks/simulate", json={
            "target_device": "MED-001",
            "attack_type": "UNAUTHORIZED_COMMAND"
        })
        print(f"[*] Response: {r.status_code}")
        print(f"[*] Details: {r.json()}")

if __name__ == "__main__":
    run_attack()
