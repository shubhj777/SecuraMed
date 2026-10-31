"""
Access Control & Policy Enforcement Module
Implements Role-Based Access Control (RBAC) for human operators and
Least-Privilege Device Command Permission Enforcement for medical IoT devices.
"""

from typing import List, Set, Tuple
from fastapi import HTTPException, status

# Operator Permissions
ROLE_PERMISSIONS = {
    "ADMIN": {
        "devices:view", "devices:register", "devices:revoke", "devices:update",
        "firmware:view", "firmware:verify",
        "attacks:simulate",
        "security:view_events", "audit:view", "audit:verify",
        "users:manage"
    },
    "SECURITY_ANALYST": {
        "devices:view",
        "firmware:view",
        "attacks:simulate",
        "security:view_events", "audit:view", "audit:verify"
    }
}

# Permitted Device Actions
# Connected patient monitoring devices are restricted to streaming telemetry data and status heartbeats.
PERMITTED_DEVICE_COMMANDS = {
    "STREAM_TELEMETRY",
    "HEARTBEAT",
    "FIRMWARE_CHECK_UPDATE"
}

class AccessControlManager:
    @staticmethod
    def check_user_permission(role: str, required_permission: str) -> bool:
        """Verifies if the operator's role possesses the requested permission."""
        perms = ROLE_PERMISSIONS.get(role, set())
        return required_permission in perms

    @staticmethod
    def require_permission(role: str, required_permission: str):
        """Raises 403 Forbidden if the user lacks the required permission."""
        if not AccessControlManager.check_user_permission(role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{role}' lacks permission '{required_permission}'"
            )

    @staticmethod
    def validate_device_command(device_type: str, command: str) -> Tuple[bool, str]:
        """
        Validates if a medical device is authorized to issue a specific command.
        Clinical telemetry devices must never be permitted to execute gateway control commands.
        """
        normalized_command = command.upper().strip()
        if normalized_command not in PERMITTED_DEVICE_COMMANDS:
            return False, f"Unauthorized command '{command}' blocked for device profile '{device_type}'. Only telemetry streaming is permitted."
        return True, "Command authorized"

access_control = AccessControlManager()
