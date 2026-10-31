"""
Automated Audit Log & Cryptographic Hash-Chain Tests
Tests tamper-evident SHA-256 hash chaining, verification, and deliberate tampering detection.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_audit_chain_valid():
    resp = client.post("/api/audit/verify-chain")
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["tampered_index"] is None

def test_audit_tampering_detected():
    # 1. Deliberately alter an audit record
    client.post("/api/audit/simulate-tamper")

    # 2. Run verification: must catch the tampering!
    resp = client.post("/api/audit/verify-chain")
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert data["tampered_index"] is not None

    # 3. Repair chain
    r_repair = client.post("/api/audit/repair-chain")
    assert r_repair.status_code == 200

    # 4. Verify chain is restored
    resp2 = client.post("/api/audit/verify-chain")
    assert resp2.json()["valid"] is True
