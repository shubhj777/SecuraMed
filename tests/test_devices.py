"""
Automated Device Security & Registry Tests
Tests registration, duplicate rejection, identity verification, and revocation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.signature_manager import signature_manager

client = TestClient(app)

def test_register_device_success():
    pk, sk = signature_manager.generate_keypair()
    resp = client.post("/api/devices/register", json={
        "device_id": "TEST-MED-101",
        "device_name": "Test Infusion Pump",
        "device_type": "INFUSION_PUMP",
        "public_key": pk.hex()
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["device_id"] == "TEST-MED-101"
    assert data["trust_status"] == "TRUSTED"

def test_reject_duplicate_device_registration():
    pk, sk = signature_manager.generate_keypair()
    # 1. First registration succeeds
    r1 = client.post("/api/devices/register", json={
        "device_id": "TEST-DUP-01",
        "device_name": "Original Unit",
        "device_type": "INFUSION_PUMP",
        "public_key": pk.hex()
    })
    assert r1.status_code == 201

    # 2. Duplicate registration rejected with 409 Conflict
    r2 = client.post("/api/devices/register", json={
        "device_id": "TEST-DUP-01",
        "device_name": "Duplicate Attempt",
        "device_type": "INFUSION_PUMP",
        "public_key": pk.hex()
    })
    assert r2.status_code == 409

def test_reject_unregistered_device_handshake():
    resp = client.post("/api/security/handshake/init", json={
        "device_id": "UNKNOWN-DEV-999",
        "client_random": "aabbccddeeff00112233445566778899"
    })
    assert resp.status_code == 401

def test_revoke_device():
    pk, sk = signature_manager.generate_keypair()
    # 1. Register device
    r_reg = client.post("/api/devices/register", json={
        "device_id": "TEST-REVOKE-01",
        "device_name": "Device to Revoke",
        "device_type": "PATIENT_MONITOR",
        "public_key": pk.hex()
    })
    assert r_reg.status_code == 201

    # 2. Revoke device
    resp = client.post("/api/devices/TEST-REVOKE-01/revoke", json={
        "reason": "Test unit retirement"
    })
    assert resp.status_code == 200
    assert resp.json()["trust_status"] == "REVOKED"

    # 3. Subsequent handshake must be denied
    r2 = client.post("/api/security/handshake/init", json={
        "device_id": "TEST-REVOKE-01",
        "client_random": "aabbccddeeff00112233445566778899"
    })
    assert r2.status_code == 401
