/**
 * Hospital Security Language & Terminology Utilities
 * Translates low-level cryptographic codes into intuitive, hospital-friendly security explanations
 * while preserving full technical details for technical personnel.
 */

export interface FriendlyEventInfo {
  friendlyTitle: string;
  actionTaken: string;
  actionColor: 'emerald' | 'rose' | 'amber' | 'cyan';
  plainReason: string;
}

export function formatEventToHospitalLanguage(
  eventType: string,
  attackType: string,
  result: string,
  rawReason: string
): FriendlyEventInfo {
  const isBlocked = ['BLOCKED', 'REJECTED', 'MITIGATED'].includes(result.toUpperCase());
  const isSuccess = ['SUCCESS', 'APPROVED', 'VERIFIED'].includes(result.toUpperCase());

  // Default fallback action
  let actionTaken = isBlocked ? 'Blocked' : isSuccess ? 'Allowed' : 'Protected';
  let actionColor: 'emerald' | 'rose' | 'amber' | 'cyan' = isBlocked ? 'rose' : isSuccess ? 'emerald' : 'cyan';

  // 1. Replay / Duplicate
  if (eventType === 'REPLAY_ATTACK' || attackType === 'REPLAY_ATTACK' || rawReason.toLowerCase().includes('replay') || rawReason.toLowerCase().includes('duplicate sequence')) {
    return {
      friendlyTitle: 'Duplicate message detected',
      actionTaken: 'Blocked',
      actionColor: 'rose',
      plainReason: 'Previously received communication was submitted again. The gateway detected the duplicate and rejected it.'
    };
  }

  // 2. Tampering / Modification
  if (eventType === 'TAMPERING_DETECTION' || attackType === 'MESSAGE_TAMPERING' || rawReason.toLowerCase().includes('tamper') || rawReason.toLowerCase().includes('tag verification failed')) {
    return {
      friendlyTitle: 'Modified communication detected',
      actionTaken: 'Blocked',
      actionColor: 'rose',
      plainReason: 'Message integrity verification failed. Data was modified in transit and immediately dropped.'
    };
  }

  // 3. Firmware events
  if (eventType === 'FIRMWARE_VERIFICATION' || eventType === 'FIRMWARE_SIGNATURE_INVALID' || attackType === 'FIRMWARE_TAMPERING') {
    if (isBlocked) {
      if (rawReason.toLowerCase().includes('older') || rawReason.toLowerCase().includes('rollback')) {
        return {
          friendlyTitle: 'Protection against older firmware',
          actionTaken: 'Blocked',
          actionColor: 'rose',
          plainReason: 'This update attempts to install an older software version. The update has been rejected.'
        };
      }
      if (rawReason.toLowerCase().includes('untrusted') || rawReason.toLowerCase().includes('rogue')) {
        return {
          friendlyTitle: 'Firmware authenticity check failed',
          actionTaken: 'Blocked',
          actionColor: 'rose',
          plainReason: 'The firmware was not signed by an authorized manufacturer identity.'
        };
      }
      return {
        friendlyTitle: 'Firmware authenticity verification failed',
        actionTaken: 'Blocked',
        actionColor: 'rose',
        plainReason: 'The firmware package was modified after signing. Verification failed and the package was rejected.'
      };
    } else {
      return {
        friendlyTitle: 'Firmware authenticity check passed',
        actionTaken: 'Approved',
        actionColor: 'emerald',
        plainReason: 'Firmware verified successfully. The package is trusted and eligible for the next update stage.'
      };
    }
  }

  // 4. Device Authentication / Impersonation
  if (eventType === 'DEVICE_AUTHENTICATION' || attackType === 'DEVICE_IMPERSONATION' || eventType === 'AUTHENTICATION_FAILURE') {
    if (isBlocked) {
      return {
        friendlyTitle: 'Device identity verification failed',
        actionTaken: 'Rejected',
        actionColor: 'rose',
        plainReason: 'An unknown or untrusted device attempted to connect. Connection rejected.'
      };
    } else {
      return {
        friendlyTitle: 'Device identity verified',
        actionTaken: 'Allowed',
        actionColor: 'emerald',
        plainReason: 'Device identity verified successfully with registered credentials.'
      };
    }
  }

  // 5. Unauthorized clinical command
  if (eventType === 'COMMAND_EXECUTION' || attackType === 'UNAUTHORIZED_COMMAND') {
    return {
      friendlyTitle: 'Unauthorized device command',
      actionTaken: 'Blocked',
      actionColor: 'rose',
      plainReason: 'Device attempted to execute a command exceeding its authorized medical profile.'
    };
  }

  // 6. Request flooding / Rate limiting
  if (eventType === 'RATE_LIMIT_EXCEEDED' || attackType === 'REQUEST_FLOODING') {
    return {
      friendlyTitle: 'Excessive connection requests',
      actionTaken: 'Throttled',
      actionColor: 'amber',
      plainReason: 'Unusually high connection frequency detected. Traffic throttled to maintain gateway availability.'
    };
  }

  // Generic Handshake / Session
  if (eventType === 'SESSION_ESTABLISHED' || rawReason.toLowerCase().includes('session') || rawReason.toLowerCase().includes('handshake')) {
    return {
      friendlyTitle: 'Secure connection established',
      actionTaken: 'Protected',
      actionColor: 'emerald',
      plainReason: 'Device established a protected session with verified identity and encrypted communication.'
    };
  }

  return {
    friendlyTitle: isBlocked ? 'Security verification failed' : 'Security activity verified',
    actionTaken: actionTaken,
    actionColor: actionColor,
    plainReason: rawReason || 'Security event processed according to gateway policy.'
  };
}

export const ATTACK_SCENARIOS_HOSPITAL = [
  {
    id: 'DEVICE_IMPERSONATION',
    name: 'Fake Device Connection',
    technicalName: 'Device Impersonation Attack',
    severity: 'HIGH',
    hospitalDescription: 'An unrecognized or fake medical device attempts to connect to the hospital network.',
    defenseDescription: 'The gateway checks the trusted medical device registry and verifies device identity using post-quantum signatures.',
    expectedOutcome: 'Protected - Connection rejected because the device is unknown or not authorized.',
    technicalVector: 'Adversary connects using unregistered device ID or forged ML-DSA-65 signature.'
  },
  {
    id: 'MESSAGE_TAMPERING',
    name: 'Message Modification',
    technicalName: 'Encrypted Message Tampering',
    severity: 'CRITICAL',
    hospitalDescription: 'An attacker intercepts and tries to alter patient telemetry or device messages while in transit.',
    defenseDescription: 'Encrypted communication uses tamper-evident verification (AES-256-GCM) that instantly detects any altered byte.',
    expectedOutcome: 'Protected - Modified message detected and discarded before reaching clinical systems.',
    technicalVector: 'Adversary intercepts encrypted payload and alters ciphertext bits or authentication tag in transit.'
  },
  {
    id: 'REPLAY_ATTACK',
    name: 'Duplicate Message Attack',
    technicalName: 'Replay Attack (Sequence Duplication)',
    severity: 'HIGH',
    hospitalDescription: 'Previously sent legitimate medical data is intercepted and resent to falsify patient vitals.',
    defenseDescription: 'Duplicate message protection tracks communication sequence numbers and rejects duplicate transmissions.',
    expectedOutcome: 'Protected - Duplicate message detected and discarded.',
    technicalVector: 'Adversary captures a legitimate valid telemetry packet and re-transmits the identical sequence number.'
  },
  {
    id: 'UNAUTHORIZED_COMMAND',
    name: 'Unauthorized Device Command',
    technicalName: 'Unauthorized Clinical Command',
    severity: 'HIGH',
    hospitalDescription: 'An unauthorized override or dosing command is attempted from a device meant only for monitoring.',
    defenseDescription: 'Role-based access control enforces least privilege, blocking non-permitted commands on monitoring devices.',
    expectedOutcome: 'Protected - Command blocked because the device profile is restricted to read-only monitoring.',
    technicalVector: 'Adversary attempts to issue clinical actuation / device override commands from a telemetry-only monitor.'
  },
  {
    id: 'FIRMWARE_TAMPERING',
    name: 'Malicious Firmware Attempt',
    technicalName: 'Malicious Firmware Backdoor Injection',
    severity: 'CRITICAL',
    hospitalDescription: 'An attacker attempts to upload an altered or unauthorized software update to a medical device.',
    defenseDescription: 'Firmware authenticity check inspects manufacturer digital signatures and verifies file integrity before approval.',
    expectedOutcome: 'Protected - Tampered update rejected and flagged for hospital cybersecurity inspection.',
    technicalVector: 'Adversary uploads modified firmware package with altered binary or forged manifest.'
  },
  {
    id: 'REQUEST_FLOODING',
    name: 'Excessive Connection Requests',
    technicalName: 'Request Flooding / Denial of Service',
    severity: 'MEDIUM',
    hospitalDescription: 'A device floods the gateway with high-frequency connections that could degrade hospital network availability.',
    defenseDescription: 'Traffic rate protection limits request quotas per device to ensure continuous gateway availability.',
    expectedOutcome: 'Protected - Connection requests throttled without interrupting vital hospital traffic.',
    technicalVector: 'Adversary generates high-frequency burst of requests to overwhelm gateway resources.'
  }
];
