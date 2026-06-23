import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User } from '../models/types';
import { userService } from '../services/userService';
import { ticketService, limitService } from '../services/dataService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (usuario: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
  });

  useEffect(() => {
    userService.init();
    ticketService.init();
    limitService.init();

    try {
      const saved = localStorage.getItem('lybet_taq_session');
      if (saved) {
        const user = JSON.parse(saved) as User;
        if (user.rol === 'Agencia') {
          setState({ isAuthenticated: true, currentUser: user });
        } else {
          localStorage.removeItem('lybet_taq_session');
        }
      }
    } catch {
      // sesión inválida, ignorar
    }
  }, []);

  const login = (usuario: string, password: string): { success: boolean; error?: string } => {
    const users = userService.getAll();
    const user = users.find(
      (u) => u.usuario === usuario && u.password === password && u.estado === 'activo'
    );
    if (user) {
      if (user.rol !== 'Agencia') {
        return {
          success: false,
          error: 'Acceso denegado: Esta aplicación está reservada exclusivamente para cuentas de tipo Agencia.',
        };
      }
      setState({ isAuthenticated: true, currentUser: user });
      localStorage.setItem('lybet_taq_session', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  };

  const logout = () => {
    setState({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem('lybet_taq_session');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
