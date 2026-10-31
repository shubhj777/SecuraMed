"""
Automated Attack Simulation Tests
Validates real backend blocking and mitigation across all 6 attack scenarios.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_attack_device_impersonation():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "DEVICE_IMPERSONATION"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "BLOCKED"
    assert data["detection_module"] == "device_auth"

def test_attack_message_tampering():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "MESSAGE_TAMPERING"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "BLOCKED"
    assert data["detection_module"] == "encryption"

def test_attack_replay():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "REPLAY_ATTACK"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "BLOCKED"
    assert data["detection_module"] == "replay_protection"

def test_attack_unauthorized_command():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "UNAUTHORIZED_COMMAND"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "BLOCKED"
    assert data["detection_module"] == "access_control"

def test_attack_firmware_tampering():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "FIRMWARE_TAMPERING"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "BLOCKED"
    assert data["detection_module"] == "firmware_verifier"

def test_attack_request_flooding():
    resp = client.post("/api/attacks/simulate", json={
        "target_device": "MED-001",
        "attack_type": "REQUEST_FLOODING"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "MITIGATED"
    assert data["detection_module"] == "rate_limiter"
