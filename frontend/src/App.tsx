import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { Footer } from './components/Footer';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#F3F6FB] dark:bg-[#071226] text-[#0B1733] dark:text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#35C5E8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500">Initializing SecuraMed IoMT Security Platform...</span>
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
      case 'crypto':
        return <CryptographyStatus />;
      case 'devices':
        return <DeviceManagement />;
      case 'telemetry':
        return <LiveTelemetry />;
      case 'attacks':
        return <AttackSimulationLab />;
      case 'events':
        return <SecurityEvents />;
      case 'communication':
        return <SecureCommunication />;
      case 'firmware':
        return <FirmwareSecurity />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Overview stats={stats} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FB] dark:bg-[#080204] text-[#0B1733] dark:text-[#F8FAFC] p-3 md:p-6 transition-colors duration-200">
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Top Navbar with Navigation, Alerts & User Controls */}
        <TopNavbar
          stats={stats}
          onRefresh={fetchStats}
          onLaunchAttack={() => setCurrentPage('attacks')}
          isLoading={loading}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Floating Sidebar & Main Canvas */}
        <div className="flex gap-6 items-start">
          <Sidebar
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
            activeSessions={stats?.active_sessions ?? 0}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1 min-w-0">
            {renderPage()}
          </main>
        </div>

        {/* Bottom Full-Width Deep Navy Footer */}
        <Footer />
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
