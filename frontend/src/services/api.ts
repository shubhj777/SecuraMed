import { 
  Device, SecurityStats, CryptoStatus, CryptoBenchmark, 
  TelemetryRecord, FirmwareRecord, AuditLog, AttackResult, SecurityEvent 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health & Gateway Info
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Devices
  getDevices: async (): Promise<Device[]> => {
    const res = await fetch(`${API_BASE}/devices`);
    return res.json();
  },

  registerDevice: async (payload: { device_id: string; device_name: string; device_type: string; public_key: string }): Promise<Device> => {
    const res = await fetch(`${API_BASE}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  revokeDevice: async (deviceId: string, reason: string): Promise<Device> => {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Revocation failed');
    }
    return res.json();
  },

  getDeviceEvents: async (deviceId: string): Promise<SecurityEvent[]> => {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/events`);
    return res.json();
  },

  // Security Stats & Telemetry
  getSecurityStats: async (): Promise<SecurityStats> => {
    const res = await fetch(`${API_BASE}/security/stats`);
    return res.json();
  },

  getSecurityEvents: async (limit: number = 50): Promise<SecurityEvent[]> => {
    const res = await fetch(`${API_BASE}/security/events?limit=${limit}`);
    return res.json();
  },

  getCryptoStatus: async (): Promise<CryptoStatus> => {
    const res = await fetch(`${API_BASE}/security/crypto-status`);
    return res.json();
  },

  runCryptoBenchmark: async (): Promise<CryptoBenchmark> => {
    const res = await fetch(`${API_BASE}/security/benchmark`, {
      method: 'POST'
    });
    return res.json();
  },

  // Telemetry
  getTelemetryHistory: async (deviceId: string, limit: number = 30): Promise<TelemetryRecord[]> => {
    const res = await fetch(`${API_BASE}/telemetry/history/${deviceId}?limit=${limit}`);
    return res.json();
  },

  // Attack Simulator
  simulateAttack: async (target_device: string, attack_type: string): Promise<AttackResult> => {
    const res = await fetch(`${API_BASE}/attacks/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_device, attack_type }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Attack simulation call failed');
    }
    return res.json();
  },

  resetSimulation: async () => {
    const res = await fetch(`${API_BASE}/attacks/reset`, { method: 'POST' });
    return res.json();
  },

  // Firmware Security
  getFirmwareHistory: async (): Promise<FirmwareRecord[]> => {
    const res = await fetch(`${API_BASE}/firmware/history`);
    return res.json();
  },

  getDemoPackages: async () => {
    const res = await fetch(`${API_BASE}/firmware/demo-packages`);
    return res.json();
  },

  verifyFirmware: async (payload: { firmware_binary_base64: string; manifest: any; signature_hex: string }) => {
    const res = await fetch(`${API_BASE}/firmware/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE}/audit/logs?limit=${limit}`);
    return res.json();
  },

  verifyAuditChain: async () => {
    const res = await fetch(`${API_BASE}/audit/verify-chain`, { method: 'POST' });
    return res.json();
  },

  simulateAuditTamper: async () => {
    const res = await fetch(`${API_BASE}/audit/simulate-tamper`, { method: 'POST' });
    return res.json();
  },

  repairAuditChain: async () => {
    const res = await fetch(`${API_BASE}/audit/repair-chain`, { method: 'POST' });
    return res.json();
  }
};
