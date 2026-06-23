import { v4 as uuidv4 } from 'uuid';

export interface IStorageAdapter {
  getAll<T>(key: string): T[];
  getById<T>(key: string, id: string): T | null;
  create<T extends { id: string }>(key: string, item: Omit<T, 'id'>): T;
  update<T extends { id: string }>(key: string, id: string, data: Partial<T>): T | null;
  remove(key: string, id: string): void;
  clear(key: string): void;
}

class LocalStorageAdapter implements IStorageAdapter {
  getAll<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getById<T>(key: string, id: string): T | null {
    const all = this.getAll<T & { id: string }>(key);
    return (all.find((item) => item.id === id) as T) ?? null;
  }

  create<T extends { id: string }>(key: string, item: Omit<T, 'id'>): T {
    const newItem = { ...item, id: uuidv4() } as T;
    const all = this.getAll<T>(key);
    all.push(newItem);
    localStorage.setItem(key, JSON.stringify(all));
    return newItem;
  }

  update<T extends { id: string }>(key: string, id: string, data: Partial<T>): T | null {
    const all = this.getAll<T>(key);
    const idx = all.findIndex((item) => (item as { id: string }).id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    localStorage.setItem(key, JSON.stringify(all));
    return all[idx];
  }

  remove(key: string, id: string): void {
    const all = this.getAll<{ id: string }>(key);
    const filtered = all.filter((item) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}

export const storageAdapter: IStorageAdapter = new LocalStorageAdapter();
