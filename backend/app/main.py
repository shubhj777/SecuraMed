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
from backend.app.models.models import Device, User
from backend.app.api import authentication, devices, telemetry, security, firmware, attacks, audit
from backend.app.core.signature_manager import signature_manager
from backend.app.core.audit_manager import audit_manager

# Device demo keys cache for emulator use
DEMO_KEYS_FILE = "demo_device_keys.json"
DEMO_DEVICE_KEYS = {}

def seed_demo_environment():
    """Initializes tables and seeds initial administrative users and demo devices."""
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

        # 2. Seed initial devices with valid ML-DSA-65 keys if empty
        existing_devices = db.query(Device).count()
        if existing_devices == 0:
            # Patient Monitor 01
            pk1, sk1 = signature_manager.generate_keypair()
            DEMO_DEVICE_KEYS["MED-001"] = sk1.hex()
            dev1 = Device(
                device_id="MED-001",
                device_name="Patient Monitor 01 (ICU Bed 4)",
                device_type="PATIENT_MONITOR",
                public_key=pk1.hex(),
                trust_status="TRUSTED",
                connection_status="OFFLINE",
                registered_at=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc)
            )
            db.add(dev1)

            # ECG Monitor 01
            pk2, sk2 = signature_manager.generate_keypair()
            DEMO_DEVICE_KEYS["MED-002"] = sk2.hex()
            dev2 = Device(
                device_id="MED-002",
                device_name="ECG Telemetry Unit 01 (Cardiology)",
                device_type="ECG_MONITOR",
                public_key=pk2.hex(),
                trust_status="TRUSTED",
                connection_status="OFFLINE",
                registered_at=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc)
            )
            db.add(dev2)
            db.commit()

            with open(DEMO_KEYS_FILE, "w") as f:
                json.dump(DEMO_DEVICE_KEYS, f, indent=2)

            audit_manager.log_event(
                db,
                event_type="GATEWAY_INITIALIZED",
                actor="SYSTEM",
                event_data={
                    "gateway_id": settings.GATEWAY_IDENTITY_ID,
                    "seeded_devices": ["MED-001", "MED-002"],
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

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "gateway_id": settings.GATEWAY_IDENTITY_ID,
        "environment": settings.ENVIRONMENT,
        "pqc_ready": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
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
