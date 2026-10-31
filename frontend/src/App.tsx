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
import { Login } from './pages/Login';
import { SecurityStats } from './types';
import { api } from './services/api';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();

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
    if (isAuthenticated) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0B0F19] text-[#172033] dark:text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#E63946] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-500">Initializing Hospital Security Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

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
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F3F4F6] overflow-hidden transition-colors duration-200">
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

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F5F7FA] dark:bg-[#0B0F19] transition-colors duration-200">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
