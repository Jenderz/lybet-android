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

/** Solo guardamos campos mínimos en sesión — jamás la contraseña. */
interface SessionData {
  id: string;
  nombre: string;
  usuario: string;
  rol: User['rol'];
  estado: User['estado'];
  parentId: string | null;
  comision: number;
  participacion: number;
  cupo_bs: number;
  cupo_usd: number;
  codigoBarras?: string;
  createdAt: string;
}

const SESSION_KEY = 'lybet_taq_session_v2';

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
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved) as SessionData;
        if (session.rol === 'Agencia') {
          // Reconstruimos el User sin password
          const user: User = { ...session, password: '' };
          setState({ isAuthenticated: true, currentUser: user });
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // sesión inválida, ignorar
      localStorage.removeItem(SESSION_KEY);
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

      // FASE 1 FIX: Guardar sesión SIN password
      const session: SessionData = {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
        estado: user.estado,
        parentId: user.parentId,
        comision: user.comision,
        participacion: user.participacion,
        cupo_bs: user.cupo_bs,
        cupo_usd: user.cupo_usd,
        codigoBarras: user.codigoBarras,
        createdAt: user.createdAt,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  };

  const logout = () => {
    setState({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem(SESSION_KEY);
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
