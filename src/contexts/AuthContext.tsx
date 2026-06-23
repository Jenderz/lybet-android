import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User } from '../models/types';
import { userService } from '../services/userService';
import { ticketService, limitService } from '../services/dataService';

interface AuthContextType extends AuthState {
  login: (usuario: string, password: string) => boolean;
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
        setState({ isAuthenticated: true, currentUser: user });
      }
    } catch {
      // sesión inválida, ignorar
    }
  }, []);

  const login = (usuario: string, password: string): boolean => {
    const users = userService.getAll();
    const user = users.find(
      (u) => u.usuario === usuario && u.password === password && u.estado === 'activo'
    );
    if (user) {
      setState({ isAuthenticated: true, currentUser: user });
      localStorage.setItem('lybet_taq_session', JSON.stringify(user));
      return true;
    }
    return false;
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
