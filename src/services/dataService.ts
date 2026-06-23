import { storageAdapter } from '../adapters/localStorage.adapter';
import type { Ticket, Limit } from '../models/types';

const TICKET_KEY = 'taq_tickets';
const LIMIT_KEY  = 'taq_limits';

// ─── Ticket Service ───────────────────────────────────────────────────────────
export const ticketService = {
  init() {
    const all = storageAdapter.getAll<Ticket>(TICKET_KEY);
    if (all.length === 0) {
      storageAdapter.create<Ticket>(TICKET_KEY, {
        serial: 'TK-00001',
        agenciaId: '',
        bancaId: '',
        grupoId: '',
        monto: 500,
        moneda: 'BS',
        tipo: 'animalitos',
        estado: 'activo',
        fecha: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });
    }
  },
  getAll: () => storageAdapter.getAll<Ticket>(TICKET_KEY),
  getBySerial: (serial: string) =>
    storageAdapter.getAll<Ticket>(TICKET_KEY).find((t) => t.serial === serial) ?? null,
  create: (data: Omit<Ticket, 'id'>) => storageAdapter.create<Ticket>(TICKET_KEY, data),
  update: (id: string, data: Partial<Ticket>) =>
    storageAdapter.update<Ticket>(TICKET_KEY, id, data),
  delete: (id: string) => storageAdapter.remove(TICKET_KEY, id),
  filter: (filters: { tipo?: string; fecha?: string; estado?: string }) => {
    return storageAdapter.getAll<Ticket>(TICKET_KEY).filter((t) => {
      if (filters.tipo   && t.tipo   !== filters.tipo)   return false;
      if (filters.fecha  && t.fecha  !== filters.fecha)  return false;
      if (filters.estado && t.estado !== filters.estado) return false;
      return true;
    });
  },
};

// ─── Limit Service ────────────────────────────────────────────────────────────
export const limitService = {
  init() {
    const all = storageAdapter.getAll<Limit>(LIMIT_KEY);
    if (all.length === 0) {
      const products = ['Animalitos', 'Panda Plus', 'Terminales', 'Triples', 'Cuatro Chance'];
      products.forEach((p) =>
        storageAdapter.create<Limit>(LIMIT_KEY, {
          userId: 'local',
          producto: p,
          cupo_bs: 50000,
          cupo_usd: 2000,
          cierre_min: '20:00',
          activo: true,
        })
      );
    }
  },
  getAll: () => storageAdapter.getAll<Limit>(LIMIT_KEY),
  update: (id: string, data: Partial<Limit>) =>
    storageAdapter.update<Limit>(LIMIT_KEY, id, data),
  create: (data: Omit<Limit, 'id'>) => storageAdapter.create<Limit>(LIMIT_KEY, data),
  delete: (id: string) => storageAdapter.remove(LIMIT_KEY, id),
};
