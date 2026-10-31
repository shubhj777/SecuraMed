import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Radio, Play, RotateCcw, CheckCircle2, 
  AlertTriangle, ShieldX, Terminal, Cpu, Lock, Send, Layers 
} from 'lucide-react';
import { Device, AttackResult } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const AttackSimulationLab: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('MED-001');
  const [selectedAttack, setSelectedAttack] = useState<string>('DEVICE_IMPERSONATION');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [history, setHistory] = useState<AttackResult[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0 && !devs.find(d => d.device_id === selectedDevice)) {
        setSelectedDevice(devs[0].device_id);
      }
    }).catch(() => {});
  }, []);

  const attackScenarios = [
    {
      id: 'DEVICE_IMPERSONATION',
      name: 'Device Impersonation Attack',
      severity: 'HIGH',
      vector: 'Adversary connects using unregistered device ID or forged ML-DSA-65 signature.',
      defense: 'Gateway verifies device trust registry and checks ML-DSA-65 digital signature against registered public key.',
      expected: 'ATTACK BLOCKED - Unregistered or invalid proof-of-possession signature'
    },
    {
      id: 'MESSAGE_TAMPERING',
      name: 'Encrypted Message Tampering',
      severity: 'CRITICAL',
      vector: 'Adversary intercepts encrypted payload and alters ciphertext bits or authentication tag in transit.',
      defense: 'AES-256-GCM authentication tag verification rejects any altered ciphertext or spliced metadata.',
      expected: 'ATTACK BLOCKED - Message authentication failed (GCM Tag Mismatch)'
    },
    {
      id: 'REPLAY_ATTACK',
      name: 'Replay Attack (Sequence Duplication)',
      severity: 'HIGH',
      vector: 'Adversary captures a legitimate valid telemetry packet and re-transmits the identical sequence number.',
      defense: 'Gateway checks sequence number against session sliding window and rejects duplicate sequence states.',
      expected: 'ATTACK BLOCKED - Duplicate sequence number detected'
    },
    {
      id: 'UNAUTHORIZED_COMMAND',
      name: 'Unauthorized Clinical Command',
      severity: 'HIGH',
      vector: 'Adversary attempts to issue clinical actuation / device override commands from a telemetry-only monitor.',
      defense: 'Least-privilege access control validates allowed commands per device profile (read-only telemetry enforced).',
      expected: 'ATTACK BLOCKED - Unauthorized command for device profile'
    },
    {
      id: 'FIRMWARE_TAMPERING',
      name: 'Malicious Firmware Backdoor Injection',
      severity: 'CRITICAL',
      vector: 'Adversary uploads modified firmware package with altered binary or forged manifest.',
      defense: 'SHA-256 binary hash mismatch or invalid ML-DSA-65 manufacturer signature triggers instant rejection.',
      expected: 'ATTACK BLOCKED - SHA-256 hash or ML-DSA-65 signature failure'
    },
    {
      id: 'REQUEST_FLOODING',
      name: 'Request Flooding / Denial of Service',
      severity: 'MEDIUM',
      vector: 'Adversary generates high-frequency burst of requests to overwhelm gateway resources.',
      defense: 'Sliding-window rate limiter throttles traffic exceeding 60 requests/min and protects availability.',
      expected: 'ATTACK MITIGATED - Rate limit quota exceeded (HTTP 429)'
    }
  ];

  const currentScenario = attackScenarios.find(a => a.id === selectedAttack) || attackScenarios[0];

  const handleLaunchAttack = async () => {
    try {
      setIsSimulating(true);
      setResult(null);
      setStatusMsg(null);
      const res = await api.simulateAttack(selectedDevice, selectedAttack);
      setResult(res);
      setHistory(prev => [res, ...prev.slice(0, 9)]);
      setStatusMsg(`Attack scenario executed. Gateway response: ${res.result} (${res.reason})`);
    } catch (e: any) {
      setStatusMsg(`Simulation error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setResult(null);
      setStatusMsg('Simulation test environment and rate limits reset.');
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono mb-2 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Active Cybersecurity Attack Simulation Lab
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Attack Simulator Mode</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Execute controlled attacks against real backend verification engines. Every test touches actual cryptographic checks, sequence tracking, and policy enforcement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Environment</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center justify-between">
          <span>&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Two Column Layout: Attack Configurator vs Gateway Live Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selector & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Configure Attack Vector
            </h2>

            {/* Target Device */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Connected Medical Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
              >
                {devices.map(d => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.device_id} - {d.device_name} ({d.trust_status})
                  </option>
                ))}
              </select>
            </div>

            {/* Attack Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Attack Scenario</label>
              <div className="space-y-2">
                {attackScenarios.map((a) => {
                  const isSelected = selectedAttack === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAttack(a.id); setResult(null); }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 ${
                        isSelected 
                          ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-sm' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{a.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{a.vector}</div>
                      </div>
                      <Badge type={a.severity} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleLaunchAttack}
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Executing Attack Payload...' : 'Launch Controlled Attack'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Execution Output & Technical Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Gateway Live Security Response
              </h2>
              {result && <Badge type={result.result} />}
            </div>

            {/* Scenario Description Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-cyan-400">{currentScenario.name}</div>
              <div className="text-slate-300"><span className="text-slate-400">Attack Vector:</span> {currentScenario.vector}</div>
              <div className="text-slate-300"><span className="text-slate-400">Gateway Defense:</span> {currentScenario.defense}</div>
              <div className="text-emerald-400 font-mono text-[11px]"><span className="text-slate-400">Expected Outcome:</span> {currentScenario.expected}</div>
            </div>

            {/* Real-Time Result Box */}
            {result ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Event ID:</span>
                  <span className="text-cyan-400 font-bold">{result.event_id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Device:</span>
                  <span className="text-white">{result.target_device}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Defense Outcome:</span>
                  <span className={`font-bold ${result.result === 'BLOCKED' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {result.result}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Detection Module:</span>
                  <span className="text-cyan-300">{result.detection_module}</span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-slate-400">Gateway Technical Reason:</div>
                  <div className="p-2.5 rounded bg-black/40 text-rose-300 border border-rose-500/20 leading-relaxed font-sans text-xs">
                    {result.reason}
                  </div>
                </div>

                {result.technical_details && Object.keys(result.technical_details).length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-slate-400">Engine Forensic Trace:</div>
                    <pre className="p-2.5 rounded bg-black/40 text-cyan-300 text-[10px] overflow-x-auto border border-slate-800">
                      {JSON.stringify(result.technical_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
                <div>No attack running. Select a vector and click <span className="text-rose-400 font-semibold">"Launch Controlled Attack"</span>.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
