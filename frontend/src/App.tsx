import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { Overview } from './pages/Overview';
import { DeviceManagement } from './pages/DeviceManagement';
import { LiveTelemetry } from './pages/LiveTelemetry';
import { SecureCommunication } from './pages/SecureCommunication';
import { CryptographyStatus } from './pages/CryptographyStatus';
import { AttackSimulationLab } from './pages/AttackSimulationLab';
import { FirmwareSecurity } from './pages/FirmwareSecurity';
import { SecurityEvents } from './pages/SecurityEvents';
import { AuditLogs } from './pages/AuditLogs';
import { SecurityStats } from './types';
import { api } from './services/api';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getSecurityStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch security stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Live polling every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview stats={stats} onNavigate={setCurrentPage} />;
      case 'devices':
        return <DeviceManagement />;
      case 'telemetry':
        return <LiveTelemetry />;
      case 'communication':
        return <SecureCommunication />;
      case 'crypto':
        return <CryptographyStatus />;
      case 'attacks':
        return <AttackSimulationLab />;
      case 'firmware':
        return <FirmwareSecurity />;
      case 'events':
        return <SecurityEvents />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Overview stats={stats} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-[#F3F4F6] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        activeSessions={stats?.active_sessions ?? 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNavbar
          stats={stats}
          onRefresh={fetchStats}
          onLaunchAttack={() => setCurrentPage('attacks')}
          isLoading={loading}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B0F19]">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
