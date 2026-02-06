import { useState } from 'react';
import ClockScreen from './components/ClockScreen';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import CashLogin from './components/CashLogin';
import CashMode from './components/CashMode';
import { Branch } from './types';

type AppMode = 'clock' | 'admin-login' | 'admin' | 'cash-login' | 'cash';

function App() {
  const [mode, setMode] = useState<AppMode>('clock');
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

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
    <>
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
