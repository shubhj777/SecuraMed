"""
Attack Scenario 3: Replay Attack Simulator
Captures a valid encrypted telemetry packet and resends the exact sequence number.
"""

import httpx

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 3: Replay Attack ---")
    with httpx.Client() as client:
        print("[*] Launching replay attack scenario...")
        r = client.post(f"{gateway_url}/api/attacks/simulate", json={
            "target_device": "MED-001",
            "attack_type": "REPLAY_ATTACK"
        })
        print(f"[*] Response: {r.status_code}")
        print(f"[*] Details: {r.json()}")

if __name__ == "__main__":
    run_attack()
