import { storageAdapter } from '../adapters/localStorage.adapter';
import type { User } from '../models/types';

const KEY = 'taq_users';

const SEEDS: Omit<User, 'id'>[] = [
  {
    nombre: 'Agencia Demo',
    usuario: 'agencia',
    password: '1234',
    rol: 'Agencia',
    parentId: null,
    estado: 'activo',
    comision: 2,
    participacion: 10,
    cupo_bs: 50000,
    cupo_usd: 2000,
    codigoBarras: 'AG-001',
    createdAt: new Date().toISOString(),
  },
  {
    nombre: 'Administrador',
    usuario: 'admin',
    password: 'admin123',
    rol: 'Operadora',
    parentId: null,
    estado: 'activo',
    comision: 10,
    participacion: 50,
    cupo_bs: 100000,
    cupo_usd: 5000,
    codigoBarras: 'OP-001',
    createdAt: new Date().toISOString(),
  },
];

export const userService = {
  init() {
    const all = storageAdapter.getAll<User>(KEY);
    if (all.length === 0) {
      SEEDS.forEach((s) => storageAdapter.create<User>(KEY, s));
    }
  },
  getAll: () => storageAdapter.getAll<User>(KEY),
  getById: (id: string) => storageAdapter.getById<User>(KEY, id),
  update: (id: string, data: Partial<User>) => storageAdapter.update<User>(KEY, id, data),
};
