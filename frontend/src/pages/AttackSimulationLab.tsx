import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Play, RotateCcw, CheckCircle2, 
  AlertTriangle, Terminal, Cpu, Lock, Send, Layers, ChevronDown, ChevronUp,
  FlaskConical, Info, XCircle
} from 'lucide-react';
import { Device, AttackResult } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ATTACK_SCENARIOS_HOSPITAL, formatEventToHospitalLanguage } from '../utils/securityLanguage';

export const AttackSimulationLab: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('MED-001');
  const [selectedAttack, setSelectedAttack] = useState<string>('DEVICE_IMPERSONATION');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [history, setHistory] = useState<AttackResult[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    api.getDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0 && !devs.find(d => d.device_id === selectedDevice)) {
        setSelectedDevice(devs[0].device_id);
      }
    }).catch(() => {});
  }, []);

  const attackScenarios = ATTACK_SCENARIOS_HOSPITAL;
  const currentScenario = attackScenarios.find(a => a.id === selectedAttack) || attackScenarios[0];

  const handleLaunchAttack = async () => {
    try {
      setIsSimulating(true);
      setResult(null);
      setStatusMsg(null);
      // Calls real backend attack simulation endpoint
      const res = await api.simulateAttack(selectedDevice, selectedAttack);
      setResult(res);
      setHistory(prev => [res, ...prev.slice(0, 9)]);
      setStatusMsg(`Security test executed. Gateway action: ${res.result}.`);
    } catch (e: any) {
      setStatusMsg(`Security test execution error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setResult(null);
      setStatusMsg('Testing environment and quotas reset successfully.');
    } catch (e) {}
  };

  // Plain Language Explanations for Real Backend Results
  const getPlainLanguageResult = (res: AttackResult) => {
    const isBlocked = ['BLOCKED', 'REJECTED', 'MITIGATED'].includes(res.result.toUpperCase());
    
    if (res.attack_type === 'DEVICE_IMPERSONATION') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'THREAT DETECTED & BLOCKED' : 'CONNECTION PERMITTED',
        attempt: 'An unknown or untrusted device attempted to connect.',
        gatewayAction: isBlocked ? 'Connection rejected.' : 'Connection allowed.',
        reason: 'Device identity could not be verified against the trusted hospital registry.'
      };
    }

    if (res.attack_type === 'MESSAGE_TAMPERING') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'DATA TAMPERING PREVENTED' : 'MESSAGE INGESTED',
        attempt: 'Communication data was modified while traveling across the network.',
        gatewayAction: isBlocked ? 'Message rejected and discarded.' : 'Message accepted.',
        reason: 'Message integrity check failed. The cryptographic authentication tag did not match the modified data.'
      };
    }

    if (res.attack_type === 'REPLAY_ATTACK') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'DUPLICATE MESSAGE DETECTED' : 'MESSAGE ACCEPTED',
        attempt: 'Previously received communication was submitted again.',
        gatewayAction: isBlocked ? 'Duplicate detected and rejected.' : 'Message accepted.',
        reason: 'Previously received communication was submitted again. The gateway detected the duplicate and rejected it.'
      };
    }

    if (res.attack_type === 'UNAUTHORIZED_COMMAND') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'UNAUTHORIZED COMMAND PREVENTED' : 'COMMAND EXECUTED',
        attempt: 'An unauthorized clinical command was attempted on a monitoring device.',
        gatewayAction: isBlocked ? 'Command execution blocked.' : 'Command accepted.',
        reason: 'Medical device profile enforces read-only telemetry. Actuation commands are prohibited.'
      };
    }

    if (res.attack_type === 'FIRMWARE_TAMPERING') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'TAMPERED FIRMWARE REJECTED' : 'FIRMWARE APPROVED',
        attempt: 'An altered or tampered firmware update was submitted.',
        gatewayAction: isBlocked ? 'Firmware rejected and quarantined.' : 'Firmware approved.',
        reason: 'The firmware package was modified after signing. Verification failed and the package was rejected.'
      };
    }

    if (res.attack_type === 'REQUEST_FLOODING') {
      return {
        status: isBlocked ? 'Protected' : 'Alert',
        headline: isBlocked ? 'EXCESSIVE TRAFFIC THROTTLED' : 'TRAFFIC PROCESSED',
        attempt: 'Excessive high-frequency connection requests were sent to the gateway.',
        gatewayAction: isBlocked ? 'Requests throttled (HTTP 429).' : 'Traffic allowed.',
        reason: 'Traffic rate protection engaged to maintain gateway responsiveness for clinical systems.'
      };
    }

    return {
      status: isBlocked ? 'Protected' : 'Event Logged',
      headline: isBlocked ? 'SECURITY THREAT MITIGATED' : 'TEST COMPLETED',
      attempt: `Security test of type ${res.attack_type} performed.`,
      gatewayAction: res.result,
      reason: res.reason
    };
  };

  const plainResult = result ? getPlainLanguageResult(result) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-2 border border-cyan-500/20">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            Controlled Security Testing Lab
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Testing Lab</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Run controlled security tests to understand how the gateway protects connected medical devices against cyber threats.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Test Environment</span>
          </button>
        </div>
      </div>

      {/* Isolated Environment Notice Banner */}
      <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-cyan-200/90 leading-relaxed text-[11px]">
          <span className="font-semibold text-cyan-300">Isolated Testing Environment: </span>
          All security tests run in a sandbox against backend cryptographic verification engines. 
          Tests verify real defensive rules (post-quantum signature validation, sequence-number replay protection, and Galois/Counter Mode authentication) without affecting live medical devices or external hospital networks.
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center justify-between">
          <span>&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Two Column Layout: Threat Configurator vs Gateway Plain Language Defense Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selector & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Select Threat Scenario
            </h2>

            {/* Target Device */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Connected Medical Device</label>
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

            {/* Hospital-Friendly Threat Scenarios */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Choose Test Threat</label>
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
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{a.hospitalDescription}</div>
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
              <span>{isSimulating ? 'Executing Controlled Test...' : 'Run Security Test'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Hospital Plain Language Results & Gateway Live Response (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Gateway Defensive Response
              </h2>
              {result && <Badge type={result.result} />}
            </div>

            {/* Threat Description Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2.5">
              <div className="font-bold text-sm text-cyan-300">{currentScenario.name}</div>
              <div className="text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-400">Hospital Threat: </span>
                {currentScenario.hospitalDescription}
              </div>
              <div className="text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-400">Gateway Defense: </span>
                {currentScenario.defenseDescription}
              </div>
              <div className="text-emerald-400 font-medium text-[11px]">
                <span className="text-slate-400">Expected Outcome: </span>
                {currentScenario.expectedOutcome}
              </div>
            </div>

            {/* Plain Language Real-Time Result Box */}
            {plainResult && result ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    {plainResult.headline}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Status: {plainResult.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Medical Device:</span>
                    <span className="text-cyan-300 font-mono font-bold">{result.target_device}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400">Attempt:</span>
                    <div className="text-slate-200 font-medium bg-black/30 p-2 rounded border border-slate-800">
                      "{plainResult.attempt}"
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400">Gateway Action:</span>
                    <div className="text-rose-300 font-semibold bg-rose-950/30 p-2 rounded border border-rose-900/40">
                      "{plainResult.gatewayAction}"
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400">Reason:</span>
                    <div className="text-slate-300 bg-black/30 p-2 rounded border border-slate-800 leading-relaxed">
                      "{plainResult.reason}"
                    </div>
                  </div>
                </div>

                {/* Expandable Technical Details for Cybersecurity Personnel */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white p-2 rounded-lg bg-black/40 border border-slate-800"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      View Technical Details
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                      <span>{showTechnicalDetails ? 'Hide' : 'Show'}</span>
                      {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-3 p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                      <div><span className="text-slate-500">Event ID:</span> <span className="text-cyan-400 font-bold">{result.event_id}</span></div>
                      <div><span className="text-slate-500">Original Technical Name:</span> <span className="text-amber-300">{currentScenario.technicalName}</span></div>
                      <div><span className="text-slate-500">Detection Module:</span> <span className="text-cyan-300">{result.detection_module}</span></div>
                      <div><span className="text-slate-500">Backend Reason:</span> <span className="text-rose-300">{result.reason}</span></div>
                      {result.technical_details && Object.keys(result.technical_details).length > 0 && (
                        <div className="pt-2">
                          <span className="text-slate-500">Cryptographic Forensic Trace:</span>
                          <pre className="p-2 rounded bg-slate-900 text-cyan-300 text-[10px] overflow-x-auto border border-slate-800 mt-1">
                            {JSON.stringify(result.technical_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-500" />
                <div>Select a threat scenario on the left and click <span className="text-rose-400 font-semibold">"Run Security Test"</span>.</div>
                <div className="text-[11px] text-slate-500">The gateway will execute actual cryptographic verification and display the defense verdict.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
