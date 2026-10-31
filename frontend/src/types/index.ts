export interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  public_key: string;
  trust_status: 'TRUSTED' | 'SUSPICIOUS' | 'REVOKED';
  connection_status: 'ONLINE' | 'OFFLINE';
  registered_at: string;
  last_seen: string;
  revoked_at?: string;
}

export interface SecurityEvent {
  id: number;
  event_id: string;
  event_type: string;
  attack_type: string;
  device_id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  result: 'SUCCESS' | 'BLOCKED' | 'MITIGATED' | 'REJECTED';
  reason: string;
  timestamp: string;
  detection_module: string;
}

export interface SecurityStats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  suspicious_devices: number;
  revoked_devices: number;
  total_attacks_simulated: number;
  attacks_blocked: number;
  active_sessions: number;
  failed_auth_attempts: number;
  firmware_failures: number;
  recent_events: SecurityEvent[];
}

export interface CryptoStatus {
  ml_kem_768_available: boolean;
  ml_dsa_65_available: boolean;
  aes_256_gcm_available: boolean;
  hkdf_sha256_available: boolean;
  argon2id_available: boolean;
  active_sessions_count: number;
  successful_handshakes_count: number;
  failed_signature_verifications: number;
  failed_message_authentications: number;
  replay_attacks_detected: number;
}

export interface BenchmarkMetric {
  operation: string;
  algorithm: string;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  iterations: number;
  key_or_payload_bytes: number;
}

export interface CryptoBenchmark {
  metrics: BenchmarkMetric[];
  system_info: Record<string, string>;
  timestamp: string;
}

export interface TelemetryRecord {
  id: number;
  device_id: string;
  timestamp: string;
  heart_rate?: number;
  spo2?: number;
  temperature?: number;
  respiratory_rate?: number;
  data_source: string;
}

export interface FirmwareRecord {
  firmware_id: string;
  device_model: string;
  firmware_version: string;
  security_version: number;
  file_hash: string;
  signing_key_id: string;
  signature_status: string;
  integrity_status: string;
  compatibility_status: string;
  anti_rollback_status: string;
  verification_result: 'APPROVED' | 'REJECTED';
  reason: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  actor: string;
  event_data: string;
  previous_hash: string;
  current_hash: string;
  timestamp: string;
}

export interface AttackResult {
  event_id: string;
  attack_type: string;
  target_device: string;
  severity: string;
  result: string;
  reason: string;
  timestamp: string;
  detection_module: string;
  technical_details: Record<string, any>;
}
