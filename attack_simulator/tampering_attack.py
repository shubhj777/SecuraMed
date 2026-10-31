"""
Attack Scenario 2: Message Tampering Simulator
Captures an authenticated encrypted message and modifies ciphertext / tag bits in transit.
"""

import httpx

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 2: Message Tampering ---")
    with httpx.Client() as client:
        print("[*] Launching message tampering scenario via Gateway Attack Simulator...")
        r = client.post(f"{gateway_url}/api/attacks/simulate", json={
            "target_device": "MED-001",
            "attack_type": "MESSAGE_TAMPERING"
        })
        print(f"[*] Response: {r.status_code}")
        print(f"[*] Details: {r.json()}")

if __name__ == "__main__":
    run_attack()
