import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, User, Lock } from 'lucide-react';
import './login.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!usuario || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const success = login(usuario, password);
    if (!success) {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">LB</div>
          <h2>Lybet Taquilla</h2>
          <p>Ingreso al sistema</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Usuario" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn">
            <LogIn size={18} />
            Ingresar
          </button>
        </form>

        <div className="login-footer">
          <p>Demo accounts:</p>
          <p>agencia / 1234</p>
          <p>admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
