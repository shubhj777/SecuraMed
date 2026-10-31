"""
Automated Secure Firmware Verification Tests
Verifies hash integrity, ML-DSA-65 signatures, untrusted key rejection, and anti-rollback policy.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_genuine_firmware_accepted():
    demo_packages = client.get("/api/firmware/demo-packages").json()
    genuine = demo_packages["genuine"]

    resp = client.post("/api/firmware/verify", json=genuine)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_result"] == "APPROVED"
    assert data["integrity_status"] == "MATCH"
    assert data["signature_status"] == "VERIFIED"
    assert data["anti_rollback_status"] == "PASSED"

def test_tampered_firmware_binary_rejected():
    demo_packages = client.get("/api/firmware/demo-packages").json()
    tampered = demo_packages["tampered_binary"]

    resp = client.post("/api/firmware/verify", json=tampered)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_result"] == "REJECTED"
    assert data["integrity_status"] == "MISMATCH"

def test_untrusted_signing_key_rejected():
    demo_packages = client.get("/api/firmware/demo-packages").json()
    untrusted = demo_packages["untrusted_key"]

    resp = client.post("/api/firmware/verify", json=untrusted)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_result"] == "REJECTED"
    assert data["signature_status"] == "UNTRUSTED_KEY"

def test_rollback_exploit_rejected():
    demo_packages = client.get("/api/firmware/demo-packages").json()
    # First ensure a higher version (security version 5) is verified
    client.post("/api/firmware/verify", json=demo_packages["genuine"])

    # Now attempt to upload older version (security version 1)
    rollback = demo_packages["rollback_exploit"]
    resp = client.post("/api/firmware/verify", json=rollback)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_result"] == "REJECTED"
    assert data["anti_rollback_status"] == "ROLLBACK_DETECTED"
