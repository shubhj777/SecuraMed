"""
Attack Scenario 6: Request Flooding (DoS) Simulator
Generates a strictly bounded local burst of requests to trigger gateway rate limiting.
"""

import httpx

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 6: Request Flooding (DoS) ---")
    with httpx.Client() as client:
        print("[*] Launching request flooding scenario against rate limiter...")
        r = client.post(f"{gateway_url}/api/attacks/simulate", json={
            "target_device": "MED-001",
            "attack_type": "REQUEST_FLOODING"
        })
        print(f"[*] Response: {r.status_code}")
        print(f"[*] Details: {r.json()}")

if __name__ == "__main__":
    run_attack()
