import { 
  Device, SecurityStats, CryptoStatus, CryptoBenchmark, 
  TelemetryRecord, FirmwareRecord, AuditLog, AttackResult, SecurityEvent,
  UserProfile, LoginResponse
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

  // Telemetry stream demo
  streamDemoTelemetry: async (deviceId: string): Promise<TelemetryRecord> => {
    const res = await fetch(`${API_BASE}/telemetry/stream-demo/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Telemetry stream failed');
    }
    return res.json();
  },

  // Authentication & Hospital Profile
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Hospital authentication failed');
    }
    return res.json();
  },

  getMe: async (token?: string): Promise<UserProfile> => {
    const authToken = token || localStorage.getItem('securemed_token');
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to retrieve profile');
    }
    return res.json();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const authToken = localStorage.getItem('securemed_token');
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Password change failed');
    }
    return res.json();
  },

  forgotPassword: async (identifier: string): Promise<{ status: string; message: string; reset_token?: string }> => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Password recovery failed');
    }
    return res.json();
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Password reset failed');
    }
    return res.json();
  },

  logout: async (): Promise<void> => {
    const authToken = localStorage.getItem('securemed_token');
    if (authToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {
        console.warn('Logout API notification failed:', e);
      }
    }
    localStorage.removeItem('securemed_token');
    localStorage.removeItem('securemed_user');
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

