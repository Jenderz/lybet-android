import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LoginPage from './pages/Login/LoginPage';
import TaquillaPage from './pages/Taquilla/TaquillaPage';
import { Monitor, Moon, Sun } from 'lucide-react';

const ThemeSelectorModal: React.FC = () => {
  const { hasChosenTheme, theme, setTheme, completeThemeSelection } = useTheme();

  if (hasChosenTheme) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '10px' }}>¡Bienvenido a Lybet!</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: '20px' }}>
          Elige el diseño de tu preferencia. Podrás cambiarlo luego en configuración.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn-secondary ${theme === 'light' ? 'selected' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }}
            onClick={() => setTheme('light')}
          >
            <Sun size={20} /> Claro
          </button>
          <button 
            className={`btn-secondary ${theme === 'dark' ? 'selected' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }}
            onClick={() => setTheme('dark')}
          >
            <Moon size={20} /> Oscuro
          </button>
          <button 
            className={`btn-secondary ${theme === 'auto' ? 'selected' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }}
            onClick={() => setTheme('auto')}
          >
            <Monitor size={20} /> Automático
          </button>
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '15px' }} onClick={completeThemeSelection}>
          Continuar
        </button>
      </div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ThemeSelectorModal />
      {isAuthenticated ? <TaquillaPage /> : <LoginPage />}
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
