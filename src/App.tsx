import { useState, useEffect } from 'react';
import ClockScreen from './components/ClockScreen';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import CashLogin from './components/CashLogin';
import CashMode from './components/CashMode';
import { Branch } from './types';
import { Moon, Sun } from 'lucide-react';

type AppMode = 'clock' | 'admin-login' | 'admin' | 'cash-login' | 'cash';

function App() {
  const [mode, setMode] = useState<AppMode>('clock');
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleAdminAccess = () => {
    setMode('admin-login');
  };

  const handleAdminSuccess = () => {
    setMode('admin');
  };

  const handleAdminExit = () => {
    setMode('clock');
  };

  const handleCashAccess = () => {
    setMode('cash-login');
  };

  const handleCashSuccess = (branch: Branch) => {
    setActiveBranch(branch);
    setMode('cash');
  };

  const handleCashExit = () => {
    setActiveBranch(null);
    setMode('clock');
  };

  const handleCancelLogin = () => {
    setMode('clock');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-6 left-6 p-4 bg-white dark:bg-slate-800 shadow-lg rounded-full z-[60] hover:scale-110 transition-all border border-slate-200 dark:border-slate-700"
        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-slate-700" />
        )}
      </button>

      {mode === 'clock' && (
        <ClockScreen
          onAdminAccess={handleAdminAccess}
          onCashAccess={handleCashAccess}
        />
      )}

      {mode === 'admin-login' && (
        <AdminLogin
          onSuccess={handleAdminSuccess}
          onCancel={handleCancelLogin}
        />
      )}

      {mode === 'admin' && (
        <AdminPanel onExit={handleAdminExit} />
      )}

      {mode === 'cash-login' && (
        <CashLogin
          onSuccess={handleCashSuccess}
          onCancel={handleCancelLogin}
        />
      )}

      {mode === 'cash' && activeBranch && (
        <CashMode
          branch={activeBranch}
          onExit={handleCashExit}
        />
      )}
    </>
  );
}

export default App;
