"""
SecureMed Gateway - Main Application Entrypoint
Post-Quantum-Ready Cybersecurity Gateway for Connected Medical Devices
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.middleware.security_headers import SecurityHeadersMiddleware
from backend.app.models.models import Device, User, Telemetry
from backend.app.api import authentication, devices, telemetry, security, firmware, attacks, audit
from backend.app.core.signature_manager import signature_manager
from backend.app.core.audit_manager import audit_manager
import hashlib, random
from datetime import timedelta

# Device demo keys cache for emulator use
DEMO_KEYS_FILE = "demo_device_keys.json"
DEMO_DEVICE_KEYS = {}

def seed_demo_environment():
    """Initializes tables and seeds initial administrative users, 12 demo devices and telemetry."""
    global DEMO_DEVICE_KEYS
    import json
    import os

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed admin and analyst accounts
        authentication.seed_default_users(db)

        # Load existing keys file if present
        if os.path.exists(DEMO_KEYS_FILE):
            try:
                with open(DEMO_KEYS_FILE, "r") as f:
                    DEMO_DEVICE_KEYS = json.load(f)
            except Exception:
                DEMO_DEVICE_KEYS = {}

        # 2. Seed demonstration devices with valid ML-DSA-65 keys
        demo_devices_spec = [
            ("MED-001", "Patient Monitor 01 (ICU Bed 4)", "PATIENT_MONITOR", "TRUSTED", "ONLINE"),
            ("MED-002", "Patient Monitor 02 (ICU Bed 5)", "PATIENT_MONITOR", "TRUSTED", "ONLINE"),
            ("MED-003", "Pulse Oximeter 01 (Emergency Ward)", "PULSE_OXIMETER", "TRUSTED", "ONLINE"),
            ("MED-004", "Infusion Pump 01 (ICU Bed 2)", "INFUSION_PUMP", "TRUSTED", "ONLINE"),
            ("MED-005", "Ventilator 01 (ICU Bed 3)", "VENTILATOR", "TRUSTED", "ONLINE"),
            ("MED-006", "ECG Monitor 01 (Cardiology)", "ECG_MONITOR", "TRUSTED", "ONLINE"),
            ("MED-007", "Blood Pressure Monitor 01 (General Ward)", "BLOOD_PRESSURE_MONITOR", "TRUSTED", "ONLINE"),
            ("MED-008", "Temperature Monitor 01 (General Ward)", "TEMPERATURE_MONITOR", "TRUSTED", "OFFLINE"),
            ("MED-009", "Patient Monitor 03 (ICU Bed 7)", "PATIENT_MONITOR", "TRUSTED", "ONLINE"),
            ("MED-010", "Infusion Pump 02 (Emergency Ward)", "INFUSION_PUMP", "SUSPICIOUS", "ONLINE"),
            ("MED-011", "Pulse Oximeter 02 (General Ward)", "PULSE_OXIMETER", "TRUSTED", "ONLINE"),
            ("MED-012", "Ventilator 02 (ICU Bed 6)", "VENTILATOR", "TRUSTED", "OFFLINE"),
        ]

        keys_updated = False
        now = datetime.now(timezone.utc)
        for dev_id, name, dev_type, trust, conn in demo_devices_spec:
            dev = db.query(Device).filter(Device.device_id == dev_id).first()
            if not dev:
                pk, sk = signature_manager.generate_keypair()
                DEMO_DEVICE_KEYS[dev_id] = sk.hex()
                keys_updated = True
                dev = Device(
                    device_id=dev_id,
                    device_name=name,
                    device_type=dev_type,
                    public_key=pk.hex(),
                    trust_status=trust,
                    connection_status=conn,
                    registered_at=now,
                    last_seen=now
                )
                db.add(dev)
            else:
                dev.device_name = name
                dev.device_type = dev_type
                dev.trust_status = trust
                dev.connection_status = conn
        
        db.commit()

        if keys_updated or not os.path.exists(DEMO_KEYS_FILE):
            with open(DEMO_KEYS_FILE, "w") as f:
                json.dump(DEMO_DEVICE_KEYS, f, indent=2)

        # 3. Seed historical demonstration telemetry for online demonstration devices if empty
        for dev_id, name, dev_type, trust, conn in demo_devices_spec:
            t_count = db.query(Telemetry).filter(Telemetry.device_id == dev_id).count()
            if t_count == 0 and conn == "ONLINE":
                for i in range(15, 0, -1):
                    t = now - timedelta(minutes=i)
                    if dev_type == "PATIENT_MONITOR":
                        hr = round(72.0 + random.uniform(-4, 6), 1)
                        spo2 = round(98.0 + random.uniform(-1, 1.5), 1)
                        temp = round(36.8 + random.uniform(-0.2, 0.4), 1)
                        rr = round(16.0 + random.uniform(-2, 2), 1)
                    elif dev_type == "PULSE_OXIMETER":
                        hr = round(70.0 + random.uniform(-3, 5), 1)
                        spo2 = round(98.5 + random.uniform(-0.8, 1.2), 1)
                        temp = None
                        rr = None
                    elif dev_type == "ECG_MONITOR":
                        hr = round(75.0 + random.uniform(-5, 5), 1)
                        spo2 = round(98.0 + random.uniform(-1, 1), 1)
                        temp = round(36.7 + random.uniform(-0.2, 0.3), 1)
                        rr = round(15.0 + random.uniform(-1, 2), 1)
                    elif dev_type == "BLOOD_PRESSURE_MONITOR":
                        hr = round(72.0 + random.uniform(-4, 4), 1)
                        spo2 = round(98.0 + random.uniform(-1, 1), 1)
                        temp = round(36.9 + random.uniform(-0.1, 0.2), 1)
                        rr = None
                    elif dev_type == "INFUSION_PUMP":
                        hr = round(73.0 + random.uniform(-2, 3), 1)
                        spo2 = 99.0
                        temp = 36.6
                        rr = 16.0
                    elif dev_type == "VENTILATOR":
                        hr = round(80.0 + random.uniform(-3, 6), 1)
                        spo2 = round(97.0 + random.uniform(-1.5, 2.0), 1)
                        temp = round(37.0 + random.uniform(-0.2, 0.4), 1)
                        rr = round(18.0 + random.uniform(-2, 3), 1)
                    else:
                        hr, spo2, temp, rr = 72.0, 98.0, 36.8, 16.0

                    entry = Telemetry(
                        device_id=dev_id,
                        timestamp=t,
                        heart_rate=hr,
                        spo2=min(100.0, spo2) if spo2 else None,
                        temperature=temp,
                        respiratory_rate=rr,
                        data_source="SYNTHETIC",
                        raw_payload_hash=hashlib.sha256(f"{dev_id}-{t.isoformat()}".encode()).hexdigest()
                    )
                    db.add(entry)
                db.commit()

        audit_manager.log_event(
            db,
            event_type="GATEWAY_INITIALIZED",
            actor="SYSTEM",
            event_data={
                "gateway_id": settings.GATEWAY_IDENTITY_ID,
                "total_devices": 12,
                "pqc_status": "ML-KEM-768 / ML-DSA-65 ACTIVE"
            }
        )
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_demo_environment()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Post-Quantum-Ready Cybersecurity Gateway for Connected Medical Devices. Implements NIST FIPS 203 (ML-KEM-768), NIST FIPS 204 (ML-DSA-65), AES-256-GCM, and hash-chained audit logging.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Enterprise Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Include Routers under /api
app.include_router(authentication.router, prefix="/api")
app.include_router(devices.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")
app.include_router(security.router, prefix="/api")
app.include_router(firmware.router, prefix="/api")
app.include_router(attacks.router, prefix="/api")
app.include_router(audit.router, prefix="/api")

GATEWAY_START_TIME = datetime.now(timezone.utc)

@app.get("/api/health")
def health_check():
    now = datetime.now(timezone.utc)
    return {
        "status": "HEALTHY",
        "gateway_id": settings.GATEWAY_IDENTITY_ID,
        "environment": settings.ENVIRONMENT,
        "pqc_ready": True,
        "uptime_seconds": int((now - GATEWAY_START_TIME).total_seconds()),
        "timestamp": now.isoformat()
    }

@app.get("/api/demo-keys")
def get_demo_signing_keys():
    """Provides private signing keys for the local simulated patient monitor devices."""
    global DEMO_DEVICE_KEYS
    import json
    import os
    if os.path.exists(DEMO_KEYS_FILE):
        try:
            with open(DEMO_KEYS_FILE, "r") as f:
                DEMO_DEVICE_KEYS = json.load(f)
        except Exception:
            pass
    return DEMO_DEVICE_KEYS
