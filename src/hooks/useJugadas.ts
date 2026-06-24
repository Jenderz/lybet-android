import { useState, useCallback } from 'react';
import type { TaqTab } from '../pages/Taquilla/taquillaData';

export interface Jugada {
  id: string;
  numero: string;
  monto: number;
  moneda: 'BS' | 'USD';
  sorteoId: string;
  sorteoLabel: string;
  loteriaId: string;
  loteriaLabel: string;
  tipo: TaqTab;
}

let _tid = 0;
const uid = () => `${Date.now()}-${_tid++}`;
const pad = (n: string) => n.padStart(2, '0');

interface UseJugadasOptions {
  allSorteos: Array<{ id: string; label: string; loteriaId: string; loteriaLabel: string }>;
  tab: TaqTab;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  onSuccess?: (count: number) => void;
}

export function useJugadas({ allSorteos, tab, onToast, onSuccess }: UseJugadasOptions) {
  const [jugadas, setJugadas] = useState<Jugada[]>([]);
  const [numero, setNumero] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'BS' | 'USD'>('BS');
  const [selectedSorteos, setSelectedSorteos] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<'numero' | 'monto'>('numero');

  const totalBS = jugadas.filter(j => j.moneda === 'BS').reduce((s, j) => s + j.monto, 0);

  const appendNum = useCallback((n: string, currentTab: TaqTab, currentNumero: string) => {
    const maxLen = currentTab === 'triples' ? 3 : currentTab === 'cuatrocifras' ? 4 : 2;
    if (currentNumero.length < maxLen) {
      setNumero(p => p + n);
    }
  }, []);

  const handleAdd = useCallback(() => {
    const n = numero.trim();
    const m = parseFloat(monto);
    if (!n) return onToast('Ingresa un número', 'err');
    if (!m || m <= 0) return onToast('Monto inválido', 'err');
    if (!selectedSorteos.length) return onToast('Selecciona un sorteo', 'err');

    const nuevas: Jugada[] = [];
    for (const sid of selectedSorteos) {
      const meta = allSorteos.find(s => s.id === sid)!;
      if (!meta) continue;
      nuevas.push({
        id: uid(),
        numero: pad(n),
        monto: m,
        moneda,
        sorteoId: sid,
        sorteoLabel: meta.label,
        loteriaId: meta.loteriaId,
        loteriaLabel: meta.loteriaLabel,
        tipo: tab,
      });
    }

    if (nuevas.length === 0) return;
    setJugadas(p => [...p, ...nuevas]);
    setNumero('');
    setActiveInput('numero');
    onToast(`✓ ${nuevas.length} jugada(s) agregadas`);
    onSuccess?.(nuevas.length);
  }, [numero, monto, moneda, selectedSorteos, allSorteos, tab, onToast, onSuccess]);

  const removeJugada = useCallback((id: string) => {
    setJugadas(p => p.filter(j => j.id !== id));
  }, []);

  const clearJugadas = useCallback(() => {
    setJugadas([]);
    setNumero('');
    setActiveInput('numero');
  }, []);

  const toggleSorteo = useCallback((id: string) => {
    setSelectedSorteos(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  }, []);

  const setAllSorteos = useCallback((all: string[]) => {
    setSelectedSorteos(all);
  }, []);

  const resetForNewTicket = useCallback(() => {
    setJugadas([]);
    setNumero('');
    setMonto('');
    setSelectedSorteos([]);
    setActiveInput('numero');
  }, []);

  return {
    jugadas,
    numero, setNumero,
    monto, setMonto,
    moneda, setMoneda,
    selectedSorteos,
    activeInput, setActiveInput,
    totalBS,
    appendNum,
    handleAdd,
    removeJugada,
    clearJugadas,
    toggleSorteo,
    setAllSorteos,
    resetForNewTicket,
  };
}
