import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login/LoginPage';
import TaquillaPage from './pages/Taquilla/TaquillaPage';

const AppShell: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {isAuthenticated ? <TaquillaPage /> : <LoginPage />}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
