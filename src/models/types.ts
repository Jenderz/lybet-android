// ─── Roles del sistema ───────────────────────────────────────────────────────
export type UserRole = 'Operadora' | 'SuperBanca' | 'Banca' | 'Grupo' | 'Agencia';
export type UserStatus = 'activo' | 'inactivo';
export type Currency = 'BS' | 'USD';

export const ROLE_HIERARCHY: UserRole[] = [
  'Operadora', 'SuperBanca', 'Banca', 'Grupo', 'Agencia',
];

export type LotteryType = 'animalitos' | 'triples' | 'terminales';
export type TicketStatus = 'activo' | 'ganador' | 'anulado' | 'pagado';

// ─── Usuario ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  nombre: string;
  usuario: string;
  password: string;
  rol: UserRole;
  parentId: string | null;
  estado: UserStatus;
  comision: number;
  participacion: number;
  cupo_bs: number;
  cupo_usd: number;
  codigoBarras?: string;
  createdAt: string;
}

// ─── Ticket / Apuesta ─────────────────────────────────────────────────────────
export interface Jugada {
  numero: string;
  monto: number;
  tipo: LotteryType;
}

export interface Ticket {
  id: string;
  serial: string;
  agenciaId: string;
  bancaId: string;
  grupoId: string;
  monto: number;
  moneda: Currency;
  tipo: LotteryType;
  estado: TicketStatus;
  jugadas?: Jugada[];
  fecha: string;
  createdAt: string;
  premio?: number;
}

// ─── Límites ──────────────────────────────────────────────────────────────────
export interface Limit {
  id: string;
  userId: string;
  producto: string;
  cupo_bs: number;
  cupo_usd: number;
  cierre_min: string;
  activo: boolean;
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}
