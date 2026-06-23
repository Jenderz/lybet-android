import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import {
  LogOut, Plus, Trash2, CheckSquare,
  Dices, Receipt, Clock, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ticketService } from '../../services/dataService';
import {
  TAQ_TABS, getLotteriesByTab,
  type TaqTab
} from './taquillaData';
import './taquilla.css';

interface Jugada {
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
const fmtMoney = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TaquillaPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState<TaqTab>('animalitos');
  const [mobileView, setMobileView] = useState<'sorteos' | 'numeros' | 'ticket'>('sorteos');

  // Jugada state
  const [numero, setNumero] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'BS' | 'USD'>('BS');
  const [selectedSorteos, setSelectedSorteos] = useState<string[]>([]);
  const [jugadas, setJugadas] = useState<Jugada[]>([]);

  const [ticketSerial, setTicketSerial] = useState(() => `TK-${String(Date.now()).slice(-6)}`);
  const [toast, setToast] = useState<{ msg: string, type: 'ok' | 'err' } | null>(null);

  // Computed
  const loterias = getLotteriesByTab(tab);
  const allSorteos = loterias.flatMap(l => l.horarios.map(s => ({ ...s, loteriaId: l.id, loteriaLabel: l.nombre })));
  const totalBS = jugadas.filter(j => j.moneda === 'BS').reduce((s, j) => s + j.monto, 0);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = () => {
    const n = numero.trim();
    const m = parseFloat(monto);
    if (!n) return showToast('Ingresa un número', 'err');
    if (!m || m <= 0) return showToast('Monto inválido', 'err');
    if (!selectedSorteos.length) return showToast('Selecciona un sorteo', 'err');

    const nuevas: Jugada[] = [];

    for (const sid of selectedSorteos) {
      const meta = allSorteos.find(s => s.id === sid)!;
      nuevas.push({
        id: uid(), numero: pad(n), monto: m, moneda,
        sorteoId: sid, sorteoLabel: meta.label,
        loteriaId: meta.loteriaId, loteriaLabel: meta.loteriaLabel,
        tipo: tab,
      });
    }

    setJugadas(p => [...p, ...nuevas]);
    setNumero('');
    showToast(`✓ ${nuevas.length} jugada(s) agregadas`);

    // Auto-navigate to ticket if many plays
    if (jugadas.length + nuevas.length >= 5) setMobileView('ticket');
  };

  const removeJugada = (id: string) => setJugadas(p => p.filter(j => j.id !== id));

  const handleConfirm = async () => {
    if (!jugadas.length) return;

    // 1. Guardar ticket
    ticketService.create({
      serial: ticketSerial,
      agenciaId: currentUser?.id ?? '',
      bancaId: '', grupoId: '',
      monto: totalBS, moneda: 'BS',
      tipo: 'animalitos', estado: 'activo',
      fecha: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      jugadas: jugadas.map(j => ({ numero: j.numero, monto: j.monto, tipo: 'animalitos' })),
    });

    // 2. Formatear texto para compartir
    let text = `🎟️ TICKET: ${ticketSerial}\n`;
    text += `🏢 Agencia: ${currentUser?.nombre}\n`;
    text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}\n\n`;

    jugadas.forEach(j => {
      text += `🎯 ${j.loteriaLabel} - ${j.sorteoLabel}\n`;
      text += `   #️⃣ ${j.numero} - Bs. ${fmtMoney(j.monto)}\n\n`;
    });
    text += `💰 TOTAL: Bs. ${fmtMoney(totalBS)}\n`;

    // 3. Compartir nativo (WhatsApp, Telegram, etc.)
    try {
      await Share.share({
        title: 'Ticket Lybet',
        text: text,
        dialogTitle: 'Compartir Ticket',
      });
      showToast('Ticket guardado y compartido');
    } catch (e) {
      // Si falla (ej. en web desktop), al menos guardamos
      showToast('Ticket guardado');
    }

    // Reset
    setJugadas([]);
    setNumero('');
    setMonto('');
    setSelectedSorteos([]);
    setTicketSerial(`TK-${String(Date.now()).slice(-6)}`);
    setMobileView('sorteos');
  };

  // Numpad handler
  const appendNum = (n: string) => {
    const maxLen = tab === 'triples' ? 3 : tab === 'cuatrocifras' ? 4 : 2;
    if (numero.length < maxLen) setNumero(prev => prev + n);
  };

  return (
    <div className="app-layout">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">LB</div>
          <div className="brand-text">Lybet Taquilla</div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} />
        </button>
      </header>

      {/* TABS Loterías */}
      <div className="lottery-tabs-container">
        {TAQ_TABS.map(t => (
          <button
            key={t.id}
            className={`lottery-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setTab(t.id); setSelectedSorteos([]); setNumero(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <main className="main-content">

        {/* VIEW: SORTEOS */}
        {mobileView === 'sorteos' && (
          <div className="view-sorteos fade-in">
            <div className="section-header">
              <h3>Selecciona Sorteos</h3>
              <button
                className="select-all-btn"
                onClick={() => setSelectedSorteos(selectedSorteos.length === allSorteos.length ? [] : allSorteos.map(s => s.id))}
              >
                {selectedSorteos.length === allSorteos.length ? 'Ninguno' : 'Todos'}
              </button>
            </div>

            <div className="sorteos-list">
              {loterias.map(l => (
                <div key={l.id} className="lottery-group">
                  <div className="group-title"><Zap size={14} color="var(--red)" /> {l.nombre}</div>
                  <div className="sorteos-grid">
                    {l.horarios.map(s => {
                      const isSel = selectedSorteos.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          className={`sorteo-card ${isSel ? 'selected' : ''}`}
                          onClick={() => setSelectedSorteos(p => isSel ? p.filter(id => id !== s.id) : [...p, s.id])}
                        >
                          <Clock size={14} /> {s.hora}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: NUMEROS (TECLADO TÁCTIL) */}
        {mobileView === 'numeros' && (
          <div className="view-numeros fade-in">
            <div className="input-display">
              <div className="input-group-row">
                <div className="input-box">
                  <label>Número</label>
                  <div className="val">{numero || '—'}</div>
                </div>
                <div className="input-box">
                  <label>Monto</label>
                  <div className="monto-wrapper">
                    <button className={`cur-btn ${moneda === 'BS' ? 'active' : ''}`} onClick={() => setMoneda('BS')}>Bs</button>
                    <button className={`cur-btn ${moneda === 'USD' ? 'active' : ''}`} onClick={() => setMoneda('USD')}>$</button>
                    <input
                      type="number"
                      className="monto-input"
                      placeholder="0"
                      value={monto}
                      onChange={e => setMonto(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="quick-amounts">
              {['50', '100', '500', '1000'].map(v => (
                <button key={v} className="quick-chip" onClick={() => setMonto(v)}>+{v}</button>
              ))}
            </div>

            {/* Numpad */}
            <div className="numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '<'].map(key => (
                <button
                  key={key}
                  className={`numpad-key ${key === 'C' ? 'clear' : ''}`}
                  onClick={() => {
                    if (key === 'C') setNumero('');
                    else if (key === '<') setNumero(p => p.slice(0, -1));
                    else appendNum(String(key));
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              className="add-play-btn"
              onClick={handleAdd}
              disabled={!numero || !monto || !selectedSorteos.length}
            >
              <Plus size={24} /> Agregar Jugada
            </button>
          </div>
        )}

        {/* VIEW: TICKET */}
        {mobileView === 'ticket' && (
          <div className="view-ticket fade-in">
            <div className="ticket-header-info">
              <div>Ticket: <strong>{ticketSerial}</strong></div>
              <div>Tot: <strong>Bs {fmtMoney(totalBS)}</strong></div>
            </div>

            <div className="jugadas-list">
              {jugadas.length === 0 ? (
                <div className="empty-state">
                  <Receipt size={40} opacity={0.2} />
                  <p>Ticket vacío</p>
                </div>
              ) : (
                jugadas.map(j => (
                  <div key={j.id} className="jugada-row">
                    <div className="j-info">
                      <div className="j-title">{j.loteriaLabel} - {j.sorteoLabel}</div>
                      <div className="j-monto">{j.moneda === 'BS' ? 'Bs.' : '$'} {fmtMoney(j.monto)}</div>
                    </div>
                    <div className="j-num">{j.numero}</div>
                    <button className="j-del" onClick={() => removeJugada(j.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="ticket-actions">
              <button className="btn-secondary" onClick={() => { setJugadas([]); setNumero(''); }}>
                <Trash2 size={20} /> Limpiar
              </button>
              <button className="btn-primary" onClick={handleConfirm} disabled={jugadas.length === 0}>
                <CheckSquare size={20} /> Compartir y Guardar
              </button>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${mobileView === 'sorteos' ? 'active' : ''}`} onClick={() => setMobileView('sorteos')}>
          <div className="nav-icon-wrapper">
            <Zap size={22} />
            {selectedSorteos.length > 0 && <span className="badge">{selectedSorteos.length}</span>}
          </div>
          <span>Sorteos</span>
        </button>
        <button className={`nav-btn ${mobileView === 'numeros' ? 'active' : ''}`} onClick={() => setMobileView('numeros')}>
          <div className="nav-icon-wrapper">
            <Dices size={22} />
          </div>
          <span>Números</span>
        </button>
        <button className={`nav-btn ${mobileView === 'ticket' ? 'active' : ''}`} onClick={() => setMobileView('ticket')}>
          <div className="nav-icon-wrapper">
            <Receipt size={22} />
            {jugadas.length > 0 && <span className="badge red">{jugadas.length}</span>}
          </div>
          <span>Ticket</span>
        </button>
      </nav>

      {/* TOAST */}
      {toast && (
        <div className={`toast-message ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default TaquillaPage;
