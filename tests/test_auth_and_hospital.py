import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.models import Device, User

client = TestClient(app)

def test_hospital_users_seeded():
    db = SessionLocal()
    try:
        users = {u.username: u.role for u in db.query(User).all()}
        assert "admin" in users
        assert users["admin"] == "ADMIN"
        assert "it_admin" in users
        assert users["it_admin"] == "IT_ADMIN"
        assert "analyst" in users
        assert users["analyst"] == "SECURITY_ANALYST"
        assert "operator" in users
        assert users["operator"] == "OPERATOR"
    finally:
        db.close()

def test_hospital_login_success_and_failure():
    # Valid login via username
    res = client.post("/api/auth/login", json={"username": "analyst", "password": "SecureMedAnalyst2026!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "SECURITY_ANALYST"
    
    # Check /auth/me profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["role"] == "SECURITY_ANALYST"
    assert "hospital_name" in me

    # Valid login via email
    res_email = client.post("/api/auth/login", json={"username": "it.admin@hospital.org", "password": "SecureMedIT2026!"})
    assert res_email.status_code == 200
    assert res_email.json()["username"] == "it_admin"

    # Invalid login
    res_bad = client.post("/api/auth/login", json={"username": "analyst", "password": "WrongPassword"})
    assert res_bad.status_code == 401

def test_password_change_flow():
    # Login as operator
    res = client.post("/api/auth/login", json={"username": "operator", "password": "SecureMedOps2026!"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Wrong current password
    bad_change = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "IncorrectPassword123",
            "new_password": "NewSecuraPassword2026!"
        },
        headers=headers
    )
    assert bad_change.status_code == 400

    # Successful change
    good_change = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "SecureMedOps2026!",
            "new_password": "NewSecuraPassword2026!"
        },
        headers=headers
    )
    assert good_change.status_code == 200

    # Verify login with new password
    new_login = client.post("/api/auth/login", json={"username": "operator", "password": "NewSecuraPassword2026!"})
    assert new_login.status_code == 200

    # Revert back for clean test state
    revert_token = new_login.json()["access_token"]
    client.post(
        "/api/auth/change-password",
        json={
            "current_password": "NewSecuraPassword2026!",
            "new_password": "SecureMedOps2026!"
        },
        headers={"Authorization": f"Bearer {revert_token}"}
    )

def test_password_recovery_workflow():
    # Request reset token
    res = client.post("/api/auth/forgot-password", json={"identifier": "admin@hospital.org"})
    assert res.status_code == 200
    reset_token = res.json()["reset_token"]
    assert reset_token is not None

    # Reset password with single-use token
    reset_res = client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "SecureMedAdmin2026!"
        }
    )
    assert reset_res.status_code == 200

    # Token should now be invalidated (single-use)
    repeat_res = client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "SecureMedAdmin2026!"
        }
    )
    assert repeat_res.status_code == 400

def test_demonstration_devices_and_telemetry():
    # Check that at least 12 demonstration devices exist
    res = client.get("/api/devices")
    assert res.status_code == 200
    devices = res.json()
    assert len(devices) >= 12
    device_ids = [d["device_id"] for d in devices]
    for i in range(1, 13):
        assert f"MED-{i:03d}" in device_ids

    # Stream demo telemetry for MED-001
    stream_res = client.post("/api/telemetry/stream-demo/MED-001")
    assert stream_res.status_code == 200
    telemetry = stream_res.json()
    assert telemetry["device_id"] == "MED-001"
    assert telemetry["heart_rate"] is not None
    assert telemetry["spo2"] is not None
    assert telemetry["data_source"] == "SYNTHETIC"

    # Verify history returns chronological records
    hist_res = client.get("/api/telemetry/history/MED-001")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) > 0
    assert hist[-1]["id"] == telemetry["id"]
