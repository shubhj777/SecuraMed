"""
Attack Scenario 1: Device Impersonation Simulator
Attempts to connect to the gateway using an unregistered device identifier
or a forged/unmatched ML-DSA-65 digital signature.
"""

import httpx
import os
from pqcrypto.sign import ml_dsa_65
from pqcrypto.kem import ml_kem_768

def run_attack(gateway_url: str = "http://127.0.0.1:8000"):
    print("\n--- [ATTACK SIMULATOR] Attack 1: Device Impersonation ---")
    rogue_id = "ROGUE-CLONE-MED-99"
    with httpx.Client() as client:
        # Step 1: Attempt handshake initiation with unregistered identity
        print(f"[*] Attacker attempting connection using unregistered identity '{rogue_id}'...")
        r = client.post(f"{gateway_url}/api/security/handshake/init", json={
            "device_id": rogue_id,
            "client_random": os.urandom(16).hex()
        })
        print(f"[*] Gateway response status: {r.status_code}")
        print(f"[*] Gateway response body: {r.text}")
        if r.status_code == 401:
            print("[+] SUCCESSFUL DEFENSE: Gateway rejected unregistered device identity.")

if __name__ == "__main__":
    run_attack()
