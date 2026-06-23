import React, { useState, useEffect, useRef } from 'react';
import { Share } from '@capacitor/share';
import {
  LogOut, Plus, Trash2, CheckSquare,
  Dices, Receipt, Clock, Zap,
  Settings, Bluetooth, Printer, RefreshCw,
  Wifi, WifiOff, X, FileText, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ticketService } from '../../services/dataService';
import {
  TAQ_TABS, getLotteriesByTab, ANIMALES,
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

const SIMULATED_PRINTERS = [
  { name: 'PT-210 (Termo 58mm)', mac: '80:EA:CA:89:12:03', signal: 95 },
  { name: 'MTP-II (Compact 58mm)', mac: '00:1B:35:11:78:AC', signal: 82 },
  { name: 'POS-80-Bluetooth (80mm)', mac: '04:FE:22:90:54:E5', signal: 70 },
  { name: 'Zebra ZQ320-Mobile', mac: 'AC:3E:B2:D3:5F:1A', signal: 45 },
];

const TaquillaPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState<TaqTab>('animalitos');
  const [mobileView, setMobileView] = useState<'sorteos' | 'numeros' | 'ticket'>('sorteos');

  // Jugada state
  const [activeInput, setActiveInput] = useState<'numero' | 'monto'>('numero');
  const [numero, setNumero] = useState('');
  const [animalSearch, setAnimalSearch] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'BS' | 'USD'>('BS');
  const [selectedSorteos, setSelectedSorteos] = useState<string[]>([]);
  const [jugadas, setJugadas] = useState<Jugada[]>([]);

  const [ticketSerial, setTicketSerial] = useState(() => `TK-${String(Date.now()).slice(-6)}`);
  const [toast, setToast] = useState<{ msg: string, type: 'ok' | 'err' } | null>(null);

  // --- Bluetooth Printer States ---
  const [showConfig, setShowConfig] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(() => {
    return localStorage.getItem('lybet_bt_enabled') === 'true';
  });
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(() => {
    return localStorage.getItem('lybet_connected_printer');
  });
  
  const [printerConfig, setPrinterConfig] = useState({
    paperWidth: 58,
    printCopies: 1,
    duplicateAgencia: false,
    printBarcode: true,
    headerText: 'LYBET TAQUILLA\n¡Mucha Suerte!',
    footerText: 'Conserve su ticket de juego.\nRevise su jugada.\n¡Gracias por preferirnos!',
  });

  const [scanning, setScanning] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<Array<{ name: string; mac: string; signal: number }>>([]);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  // Tickets vendidos hoy
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);

  // Simulation Viewer
  const [showPrinterViewer, setShowPrinterViewer] = useState(false);
  const [isPrintingAnim, setIsPrintingAnim] = useState(false);
  const [printingLines, setPrintingLines] = useState<string[]>([]);
  const [visibleLinesCount, setVisibleLinesCount] = useState(0);

  const paperContentRef = useRef<HTMLDivElement>(null);

  // Computed
  const loterias = getLotteriesByTab(tab);
  const allSorteos = loterias.flatMap(l => l.horarios.map(s => ({ ...s, loteriaId: l.id, loteriaLabel: l.nombre })));
  const totalBS = jugadas.filter(j => j.moneda === 'BS').reduce((s, j) => s + j.monto, 0);

  // Load config & history
  useEffect(() => {
    const savedConfig = localStorage.getItem('lybet_printer_config');
    if (savedConfig) {
      try {
        setPrinterConfig(JSON.parse(savedConfig));
      } catch (e) {}
    }
    loadHistory();
  }, [currentUser]);

  // Scroll to bottom of paper container while printing
  useEffect(() => {
    if (paperContentRef.current) {
      paperContentRef.current.scrollTop = paperContentRef.current.scrollHeight;
    }
  }, [visibleLinesCount]);

  const loadHistory = () => {
    const today = new Date().toISOString().split('T')[0];
    const tickets = ticketService.getAll();
    const myTickets = tickets.filter(
      (t) => t.agenciaId === currentUser?.id && t.fecha === today
    );
    myTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setHistoryTickets(myTickets);
  };

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sound generator using Web Audio API to simulate thermal printing buzz
  const playPrinterSound = (durationMs: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const startTime = ctx.currentTime;
      const steps = Math.floor(durationMs / 80);
      
      for (let i = 0; i < steps; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        // Buzz tone
        osc.frequency.setValueAtTime(160 + Math.random() * 50, startTime + i * 0.08);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 2.5;
        
        gain.gain.setValueAtTime(0.06, startTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.08 + 0.06);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime + i * 0.08);
        osc.stop(startTime + i * 0.08 + 0.07);
      }
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  // Formatter for ESC/POS Mono-space tickets
  const formatTicketEscPos = (
    ticket: { serial: string; fecha: string; jugadas?: any[]; monto: number },
    agenciaNombre: string,
    config: {
      paperWidth: number;
      headerText: string;
      footerText: string;
      printBarcode: boolean;
      isCopy?: boolean;
    }
  ) => {
    const width = config.paperWidth === 80 ? 48 : 32;
    const padCenter = (str: string) => {
      if (str.length >= width) return str.slice(0, width);
      const spaces = Math.floor((width - str.length) / 2);
      return ' '.repeat(spaces) + str;
    };
    const line = '-'.repeat(width);
    const doubleLine = '='.repeat(width);
    
    let out: string[] = [];
    
    if (config.isCopy) {
      out.push(padCenter('*** COPIA AGENCIA ***'));
      out.push('');
    }

    if (config.headerText) {
      config.headerText.split('\n').forEach(l => {
        out.push(padCenter(l.trim()));
      });
    } else {
      out.push(padCenter('LYBET TAQUILLA'));
      out.push(padCenter('¡Mucha Suerte!'));
    }
    
    out.push(doubleLine);
    out.push(`Agencia: ${agenciaNombre.slice(0, width - 9)}`);
    out.push(`Ticket:  ${ticket.serial}`);
    
    const dateStr = new Date(ticket.fecha || Date.now()).toLocaleDateString('es-VE');
    const timeStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    out.push(`Fecha:   ${dateStr}`);
    out.push(`Hora:    ${timeStr}`);
    out.push(line);
    
    const plays = ticket.jugadas || [];
    if (width === 48) {
      // 80mm Layout
      out.push('SORTEO/LOTERIA         NÚMERO             MONTO');
      out.push(line);
      plays.forEach((j: any) => {
        const lot = (j.loteriaLabel || j.tipo || '').slice(0, 20);
        const num = `#${j.numero}`;
        const mon = `Bs. ${fmtMoney(j.monto)}`;
        const spaces = width - lot.length - num.length - mon.length;
        if (spaces > 0) {
          out.push(`${lot}${' '.repeat(spaces - 4)}${num}${' '.repeat(4)}${mon}`);
        } else {
          out.push(`${lot.slice(0, 15)} ${num} ${mon}`);
        }
      });
    } else {
      // 58mm Layout
      out.push('SORTEO         JUGADA     MONTO');
      out.push(line);
      plays.forEach((j: any) => {
        const lot = (j.loteriaLabel || j.tipo || '').slice(0, 12);
        const num = `#${j.numero}`;
        const mon = `Bs.${Math.round(j.monto)}`;
        const rightPart = `${num}  ${mon}`;
        const spacesNeeded = width - lot.length - rightPart.length;
        if (spacesNeeded > 0) {
          out.push(`${lot}${' '.repeat(spacesNeeded)}${rightPart}`);
        } else {
          out.push(`${lot.slice(0, 8)} ${num} ${mon}`);
        }
      });
    }
    
    out.push(line);
    const totalLabel = 'TOTAL:';
    const totalValue = `Bs. ${fmtMoney(ticket.monto)}`;
    const totalSpaces = width - totalLabel.length - totalValue.length;
    out.push(`${totalLabel}${' '.repeat(Math.max(1, totalSpaces))}${totalValue}`);
    out.push(doubleLine);
    
    if (config.footerText) {
      config.footerText.split('\n').forEach(l => {
        out.push(padCenter(l.trim()));
      });
    } else {
      out.push(padCenter('Conserve su ticket de juego.'));
      out.push(padCenter('Caduca en 15 días.'));
    }
    
    if (config.printBarcode) {
      out.push('');
      out.push(padCenter('█ || | █ || || █ || | █'));
      out.push(padCenter(`*${ticket.serial}*`));
    }
    
    out.push('\n\n\n');
    return out.join('\n');
  };

  const startSimulationPrint = (ticketText: string) => {
    setPrintingLines(ticketText.split('\n'));
    setVisibleLinesCount(0);
    setShowPrinterViewer(true);
    setIsPrintingAnim(true);
    
    const lines = ticketText.split('\n');
    let currentLine = 0;
    
    playPrinterSound(120);
    
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        currentLine++;
        setVisibleLinesCount(currentLine);
        if (currentLine % 2 === 0) {
          playPrinterSound(70);
        }
      } else {
        clearInterval(interval);
        setIsPrintingAnim(false);
        // Success sound
        playPrinterSound(200);
      }
    }, 85);
  };

  // Confirm and Print Ticket
  const handleConfirm = async () => {
    if (!jugadas.length) return;

    const serial = ticketSerial;
    const montoTotal = totalBS;
    const mappedPlays = jugadas.map(j => ({
      numero: j.numero,
      monto: j.monto,
      tipo: (j.tipo === 'pandaplus' || j.tipo === 'cuatrocifras' ? 'animalitos' : j.tipo) as any,
      loteriaLabel: j.loteriaLabel,
      sorteoLabel: j.sorteoLabel
    }));

    const ticketData = {
      serial: serial,
      agenciaId: currentUser?.id ?? '',
      bancaId: '',
      grupoId: '',
      monto: montoTotal,
      moneda: moneda,
      tipo: (tab === 'pandaplus' || tab === 'cuatrocifras' ? 'animalitos' : tab) as any,
      estado: 'activo' as const,
      fecha: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      jugadas: mappedPlays,
    };

    // 1. Guardar en base de datos
    ticketService.create(ticketData);
    loadHistory();

    // 2. Si está configurado e impresor conectado
    if (bluetoothEnabled && connectedPrinter) {
      let finalPrint = '';
      for (let c = 0; c < printerConfig.printCopies; c++) {
        const isCopy = c > 0;
        finalPrint += formatTicketEscPos(ticketData, currentUser?.nombre ?? 'Agencia', {
          ...printerConfig,
          isCopy: isCopy || printerConfig.duplicateAgencia
        });
        if (c < printerConfig.printCopies - 1) {
          finalPrint += '\n' + '-'.repeat(printerConfig.paperWidth === 80 ? 48 : 32) + '\n\n';
        }
      }
      startSimulationPrint(finalPrint);
      showToast('✓ Guardado e Impreso por Bluetooth');
    } else {
      // Compartir nativo
      let text = `🎟️ TICKET: ${serial}\n`;
      text += `🏢 Agencia: ${currentUser?.nombre}\n`;
      text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}\n\n`;

      jugadas.forEach(j => {
        text += `🎯 ${j.loteriaLabel} - ${j.sorteoLabel}\n`;
        text += `   #️⃣ ${j.numero} - Bs. ${fmtMoney(j.monto)}\n\n`;
      });
      text += `💰 TOTAL: Bs. ${fmtMoney(montoTotal)}\n`;

      try {
        await Share.share({
          title: 'Ticket Lybet',
          text: text,
          dialogTitle: 'Compartir Ticket',
        });
        showToast('✓ Ticket guardado y compartido');
      } catch (e) {
        showToast('✓ Ticket guardado');
      }
    }

    // Reset fields
    setJugadas([]);
    setNumero('');
    setMonto('');
    setSelectedSorteos([]);
    setTicketSerial(`TK-${String(Date.now()).slice(-6)}`);
    setMobileView('sorteos');
  };

  const handleReimprimir = (ticket: any) => {
    if (!bluetoothEnabled || !connectedPrinter) {
      showToast('Debe encender el Bluetooth y conectar una impresora', 'err');
      setShowConfig(true);
      return;
    }

    let finalPrint = '';
    for (let c = 0; c < printerConfig.printCopies; c++) {
      const isCopy = c > 0;
      finalPrint += formatTicketEscPos(ticket, currentUser?.nombre ?? 'Agencia', {
        ...printerConfig,
        isCopy: isCopy || printerConfig.duplicateAgencia
      });
      if (c < printerConfig.printCopies - 1) {
        finalPrint += '\n' + '-'.repeat(printerConfig.paperWidth === 80 ? 48 : 32) + '\n\n';
      }
    }

    startSimulationPrint(finalPrint);
    showToast('✓ Reimprimiendo ticket...');
  };

  // Bluetooth scanning / control handlers
  const handleToggleBluetooth = (checked: boolean) => {
    setBluetoothEnabled(checked);
    localStorage.setItem('lybet_bt_enabled', String(checked));
    if (!checked) {
      setConnectedPrinter(null);
      localStorage.removeItem('lybet_connected_printer');
      setFoundPrinters([]);
    }
  };

  const handleStartScan = () => {
    if (!bluetoothEnabled) return;
    setScanning(true);
    setFoundPrinters([]);
    setTimeout(() => {
      setFoundPrinters(SIMULATED_PRINTERS);
      setScanning(false);
    }, 2000);
  };

  const handleConnectPrinter = (name: string) => {
    setConnectingTo(name);
    setTimeout(() => {
      setConnectedPrinter(name);
      localStorage.setItem('lybet_connected_printer', name);
      setConnectingTo(null);
      showToast(`Conectado a ${name}`);
    }, 1500);
  };

  const handleDisconnectPrinter = () => {
    if (connectedPrinter) {
      const name = connectedPrinter;
      setConnectedPrinter(null);
      localStorage.removeItem('lybet_connected_printer');
      showToast(`Impresora ${name} desconectada`);
    }
  };

  const handleSaveConfig = (field: string, val: any) => {
    const next = { ...printerConfig, [field]: val };
    setPrinterConfig(next);
    localStorage.setItem('lybet_printer_config', JSON.stringify(next));
  };

  // Add play logic
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
    setActiveInput('numero');
    showToast(`✓ ${nuevas.length} jugada(s) agregadas`);
    if (jugadas.length + nuevas.length >= 5) setMobileView('ticket');
  };

  const removeJugada = (id: string) => setJugadas(p => p.filter(j => j.id !== id));

  const appendNum = (n: string) => {
    const maxLen = tab === 'triples' ? 3 : tab === 'cuatrocifras' ? 4 : 2;
    if (numero.length < maxLen) setNumero(p => p + n);
  };

  // Soporte de teclado físico (útil en tablets o PCs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en el buscador
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;
      
      if (/^[0-9]$/.test(key)) {
        if (activeInput === 'numero') appendNum(key);
        else setMonto(p => p + key);
      } else if (key === 'Backspace') {
        if (activeInput === 'numero') setNumero(p => p.slice(0, -1));
        else setMonto(p => p.slice(0, -1));
      } else if (key === 'Escape' || key === 'Delete' || key.toLowerCase() === 'c') {
        if (activeInput === 'numero') setNumero('');
        else setMonto('');
      } else if (key === 'Enter') {
        e.preventDefault();
        handleAdd();
      } else if (key === 'Tab') {
        e.preventDefault();
        setActiveInput(p => p === 'numero' ? 'monto' : 'numero');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInput, numero, monto, selectedSorteos, handleAdd, appendNum]);

  const triggerTestPrint = () => {
    const testTicket = {
      serial: 'TK-PRUEBA',
      fecha: new Date().toISOString().split('T')[0],
      monto: 100.00,
      jugadas: [
        { loteriaLabel: 'Granja Millonaria', numero: '12', monto: 50.00 },
        { loteriaLabel: 'La Granjita', numero: '05', monto: 50.00 }
      ]
    };
    const ticketText = formatTicketEscPos(testTicket, currentUser?.nombre ?? 'Agencia Demo', printerConfig);
    startSimulationPrint(ticketText);
    showToast('✓ Imprimiendo ticket de prueba');
  };

  return (
    <div className="app-layout">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">LB</div>
          <div className="brand-text">Lybet Taquilla</div>
        </div>
        <div className="header-actions">
          <button className="header-action-btn" title="Historial de Ventas" onClick={() => { loadHistory(); setShowHistory(true); }}>
            <Clock size={20} />
          </button>
          <button className="header-action-btn" title="Ajustes de Impresión Bluetooth" onClick={() => setShowConfig(true)}>
            {connectedPrinter ? <Printer size={20} className="active-printer" /> : <Settings size={20} />}
          </button>
          <button className="logout-btn" onClick={logout} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
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
      {/* CONTENT AREA (Workspace Grid) */}
      <main className="main-content taquilla-workspace-grid">
        
        {/* COLUMNA 1: SORTEOS */}
        <div className={`panel-column panel-sorteos ${mobileView === 'sorteos' ? 'active-mobile' : 'hidden-mobile'}`}>
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

        {/* COLUMNA 2: NÚMEROS Y ANIMALES */}
        <div className={`panel-column panel-numeros ${mobileView === 'numeros' ? 'active-mobile' : 'hidden-mobile'}`}>
          <div className="play-creation-layout">
            <div className="play-inputs-and-keypad">
              <div className="input-display">
                <div className="input-group-row">
                  <div className={`input-box ${activeInput === 'numero' ? 'focused' : ''}`} onClick={() => setActiveInput('numero')}>
                    <label>Número</label>
                    <div className="val">{numero || '—'}</div>
                  </div>
                  <div className={`input-box ${activeInput === 'monto' ? 'focused' : ''}`} onClick={() => setActiveInput('monto')}>
                    <label>Monto</label>
                    <div className="monto-wrapper">
                      <button className={`cur-btn ${moneda === 'BS' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setMoneda('BS'); }}>Bs</button>
                      <button className={`cur-btn ${moneda === 'USD' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setMoneda('USD'); }}>$</button>
                      <div className="val" style={{ flex: 1, border: 'none', background: 'transparent' }}>
                        {monto || '0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="quick-amounts">
                {['50', '100', '500', '1000'].map(v => (
                  <button key={v} className="quick-chip" onClick={() => { setMonto(v); setActiveInput('monto'); }}>+{v}</button>
                ))}
              </div>

              {/* Mobile Animals Panel (Solo visible en móvil cuando activeInput === 'numero') */}
              <div className={`mobile-animals-container ${((tab === 'animalitos' || tab === 'pandaplus') && activeInput === 'numero') ? 'active' : ''}`}>
                <div className="animals-selector-grid">
                  {ANIMALES.filter(a => a.nombre.toLowerCase().includes(animalSearch.toLowerCase()) || a.numero.includes(animalSearch)).map(a => (
                    <button
                      key={a.numero}
                      className={`animal-card-item ${numero === a.numero ? 'selected' : ''}`}
                      onClick={() => { setNumero(a.numero); setActiveInput('monto'); }}
                    >
                      <span className="animal-emoji-cell">{a.emoji}</span>
                      <span className="animal-name-cell">{a.nombre}</span>
                      <span className="animal-num-cell">{a.numero}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keypad & Add Button */}
              <div className="numpad-wrapper">
                <div className={`numpad ${((tab === 'animalitos' || tab === 'pandaplus') && activeInput === 'numero') ? 'hide-on-mobile' : ''}`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '<'].map(key => (
                    <button
                      key={key}
                      className={`numpad-key ${key === 'C' ? 'clear' : ''}`}
                      onClick={() => {
                        if (key === 'C') {
                          if (activeInput === 'numero') setNumero('');
                          else setMonto('');
                        } else if (key === '<') {
                          if (activeInput === 'numero') setNumero(p => p.slice(0, -1));
                          else setMonto(p => p.slice(0, -1));
                        } else {
                          if (activeInput === 'numero') appendNum(String(key));
                          else setMonto(p => p + String(key));
                        }
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
            </div>

            {/* PANEL DE ANIMALES (SE MUESTRA EN TABLET/ESCRITORIO) */}
            {(tab === 'animalitos' || tab === 'pandaplus') && (
              <div className="animals-panel-selector desktop-only">
                <div className="panel-subtitle" style={{ padding: '0 0 10px 0', borderBottom: '1px solid var(--border-1)' }}>
                  <div className="search-bar-wrapper" style={{ width: '100%', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)' }} />
                    <input 
                      type="text" 
                      placeholder="Buscar animal (ej: delfín, 0)" 
                      value={animalSearch}
                      onChange={(e) => setAnimalSearch(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-2)',
                        borderRadius: 'var(--r-full)',
                        padding: '8px 10px 8px 34px',
                        color: 'var(--text-1)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>
                </div>
                <div className="animals-selector-grid">
                  {ANIMALES.filter(a => a.nombre.toLowerCase().includes(animalSearch.toLowerCase()) || a.numero.includes(animalSearch)).map(a => (
                    <button
                      key={a.numero}
                      className={`animal-card-item ${numero === a.numero ? 'selected' : ''}`}
                      onClick={() => { setNumero(a.numero); setActiveInput('monto'); }}
                    >
                      <span className="animal-emoji-cell">{a.emoji}</span>
                      <span className="animal-name-cell">{a.nombre}</span>
                      <span className="animal-num-cell">{a.numero}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: TICKET LATERAL */}
        <div className={`panel-column panel-ticket ${mobileView === 'ticket' ? 'active-mobile' : 'hidden-mobile'}`}>
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
                  <div className="j-num-container">
                    {(j.tipo === 'animalitos' || j.tipo === 'pandaplus') ? (
                      (() => {
                        const animal = ANIMALES.find(a => a.numero === j.numero);
                        if (animal) {
                          return (
                            <div className="j-animal-display">
                              <span className="j-animal-emoji">{animal.emoji}</span>
                              <div className="j-animal-text">
                                <span className="j-animal-name">{animal.nombre}</span>
                                <span className="j-animal-number">#{animal.numero}</span>
                              </div>
                            </div>
                          );
                        }
                        return <span className="j-num">{j.numero}</span>;
                      })()
                    ) : (
                      <span className="j-num">{j.numero}</span>
                    )}
                  </div>
                  <button className="j-del" onClick={() => removeJugada(j.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="ticket-actions">
            <button className="btn-secondary" onClick={() => { setJugadas([]); setNumero(''); setActiveInput('numero'); }} title="Limpiar">
              <Trash2 size={24} />
            </button>
            <button className="btn-primary" onClick={handleConfirm} disabled={jugadas.length === 0} title={bluetoothEnabled && connectedPrinter ? "Guardar e Imprimir" : "Guardar y Compartir"}>
              {bluetoothEnabled && connectedPrinter ? (
                <Printer size={24} />
              ) : (
                <CheckSquare size={24} />
              )}
            </button>
          </div>
        </div>
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

      {/* MODAL: CONFIGURACION IMPRESORA BLUETOOTH */}
      {showConfig && (
        <div className="modal-overlay fade-in">
          <div className="modal-content printer-config-modal">
            <div className="modal-header">
              <h2>Impresora Bluetooth</h2>
              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', marginLeft: 'auto', marginRight: '10px' }} onClick={() => setShowGuide(true)}>
                Guía
              </button>
              <button className="close-modal" onClick={() => setShowConfig(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Bluetooth Toggle */}
              <div className="config-section toggle-wrapper">
                <div className="label-block">
                  <span className="section-title">Bluetooth de la App</span>
                  <span className="section-desc">Activar para buscar impresoras térmicas</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={bluetoothEnabled}
                    onChange={e => handleToggleBluetooth(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {bluetoothEnabled ? (
                <>
                  {/* Connection Status */}
                  <div className="config-section connection-status-box">
                    <div className="status-header">
                      {connectedPrinter ? (
                        <>
                          <div className="status-indicator connected">
                            <Wifi size={18} />
                            <span>Conectado a <strong>{connectedPrinter}</strong></span>
                          </div>
                          <button className="disconnect-btn" onClick={handleDisconnectPrinter}>
                            Desconectar
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="status-indicator disconnected">
                            <WifiOff size={18} />
                            <span>Sin impresora vinculada</span>
                          </div>
                          <button className="scan-btn" onClick={handleStartScan} disabled={scanning}>
                            {scanning ? <RefreshCw size={14} className="spin" /> : 'Buscar'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Printer list from scanning */}
                    {scanning && (
                      <div className="scanner-searching">
                        <RefreshCw size={24} className="spin accent-color" />
                        <p>Buscando dispositivos térmicos cercanos...</p>
                      </div>
                    )}

                    {!scanning && foundPrinters.length > 0 && !connectedPrinter && (
                      <div className="printers-list">
                        <h4>Dispositivos encontrados:</h4>
                        {foundPrinters.map(p => (
                          <div key={p.mac} className="printer-item">
                            <div className="printer-info">
                              <Bluetooth size={16} className="bt-icon" />
                              <div>
                                <span className="p-name">{p.name}</span>
                                <span className="p-mac">{p.mac}</span>
                              </div>
                            </div>
                            <button
                              className="connect-item-btn"
                              disabled={connectingTo === p.name}
                              onClick={() => handleConnectPrinter(p.name)}
                            >
                              {connectingTo === p.name ? 'Conectando...' : 'Vincular'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Printer Settings Form */}
                  {connectedPrinter && (
                    <div className="printer-options-form">
                      <h3>Ajustes del Ticket</h3>
                      
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Ancho del papel</label>
                          <div className="segmented-control">
                            <button
                              className={printerConfig.paperWidth === 58 ? 'active' : ''}
                              onClick={() => handleSaveConfig('paperWidth', 58)}
                            >
                              58mm (32col)
                            </button>
                            <button
                              className={printerConfig.paperWidth === 80 ? 'active' : ''}
                              onClick={() => handleSaveConfig('paperWidth', 80)}
                            >
                              80mm (48col)
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Copias a imprimir</label>
                          <div className="copies-selector">
                            <button
                              disabled={printerConfig.printCopies <= 1}
                              onClick={() => handleSaveConfig('printCopies', printerConfig.printCopies - 1)}
                            >
                              -
                            </button>
                            <span>{printerConfig.printCopies}</span>
                            <button
                              disabled={printerConfig.printCopies >= 3}
                              onClick={() => handleSaveConfig('printCopies', printerConfig.printCopies + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="form-checkboxes">
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={printerConfig.duplicateAgencia}
                            onChange={e => handleSaveConfig('duplicateAgencia', e.target.checked)}
                          />
                          <span>Imprimir copia para Agencia (con marca de agua)</span>
                        </label>

                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={printerConfig.printBarcode}
                            onChange={e => handleSaveConfig('printBarcode', e.target.checked)}
                          />
                          <span>Imprimir código de barras al pie</span>
                        </label>
                      </div>

                      <div className="form-group">
                        <label>Texto Cabecera</label>
                        <textarea
                          rows={2}
                          value={printerConfig.headerText}
                          onChange={e => handleSaveConfig('headerText', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Texto Pie de Página</label>
                        <textarea
                          rows={3}
                          value={printerConfig.footerText}
                          onChange={e => handleSaveConfig('footerText', e.target.value)}
                        />
                      </div>

                      <button className="test-print-btn" onClick={triggerTestPrint}>
                        <Printer size={16} /> Imprimir Ticket de Prueba
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bt-disabled-notice">
                  <Bluetooth size={40} className="muted-icon" />
                  <p>Enciende el Bluetooth de la app para poder emparejar tu impresora de tickets.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE TICKETS DE HOY */}
      {showHistory && (
        <div className="modal-overlay fade-in">
          <div className="modal-content history-modal">
            <div className="modal-header">
              <h2>Tickets Emitidos Hoy</h2>
              <button className="close-modal" onClick={() => setShowHistory(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {historyTickets.length === 0 ? (
                <div className="empty-history">
                  <FileText size={48} className="muted-icon" />
                  <p>No se han emitido tickets en la sesión actual.</p>
                </div>
              ) : (
                <div className="history-list">
                  {historyTickets.map(t => (
                    <div key={t.id} className="history-card">
                      <div className="card-header">
                        <span className="serial-no">{t.serial}</span>
                        <span className="time-stamp">
                          {new Date(t.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="jugadas-summary">
                          {t.jugadas && t.jugadas.length > 0 ? (
                            t.jugadas.map((j: any, idx: number) => (
                              <span key={idx} className="jugada-tag">
                                #{j.numero} ({j.loteriaLabel ? j.loteriaLabel.slice(0, 10) : 'Juego'})
                              </span>
                            ))
                          ) : (
                            <span className="muted-text">Sin jugadas detalladas</span>
                          )}
                        </div>
                        <div className="card-footer">
                          <span className="amount-label">Total: <strong>Bs. {fmtMoney(t.monto)}</strong></span>
                          <button
                            className="reprint-btn"
                            title="Reimprimir por Bluetooth"
                            onClick={() => handleReimprimir(t)}
                          >
                            <Printer size={16} /> Reimprimir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISOR SIMULADOR FISICO DE IMPRESORA TERMICA */}
      {showPrinterViewer && (
        <div className="printer-viewer-overlay fade-in">
          <div className="printer-container">
            <div className="printer-hardware">
              <div className="printer-hardware-header">
                <div className="leds-panel">
                  <div className="led-item">
                    <span className={`led-light green ${isPrintingAnim ? 'blink' : 'solid'}`}></span>
                    <span className="led-lbl">POWER</span>
                  </div>
                  <div className="led-item">
                    <span className={`led-light blue ${connectedPrinter ? 'solid' : 'off'}`}></span>
                    <span className="led-lbl">BT</span>
                  </div>
                </div>
                <div className="brand-badge">THERMAL POS-58</div>
              </div>
              
              {/* Paper feed area */}
              <div className="printer-slot">
                <div className="printer-paper-roll" ref={paperContentRef}>
                  <div className="printed-paper">
                    {printingLines.slice(0, visibleLinesCount).join('\n')}
                    {isPrintingAnim && <span className="printing-char-cursor">█</span>}
                  </div>
                </div>
              </div>

              <div className="printer-hardware-footer">
                <button
                  className="cut-btn-action"
                  disabled={isPrintingAnim}
                  onClick={() => setShowPrinterViewer(false)}
                >
                  {isPrintingAnim ? (
                    <span className="printing-loader">
                      <RefreshCw size={14} className="spin" /> Imprimiendo...
                    </span>
                  ) : (
                    '✂ Cortar Papel y Salir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast-message ${toast.type}`}>
          {toast.msg}
        </div>
      )}
      {/* MODAL: GUÍA DE CONFIGURACIÓN BLUETOOTH */}
      {showGuide && (
        <div className="modal-overlay fade-in" style={{ zIndex: 10000 }}>
          <div className="modal-content printer-config-modal">
            <div className="modal-header">
              <h2>Guía: Impresora Bluetooth</h2>
              <button className="close-modal" onClick={() => setShowGuide(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', lineHeight: '1.6', overflowY: 'auto' }}>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li>
                  <strong>Enciende tu impresora térmica</strong> portátil. Asegúrate de que tenga batería y papel.
                </li>
                <li>
                  <strong>Ve a los ajustes de Bluetooth de tu dispositivo Android</strong>, busca la impresora (usualmente "MTP-II", "PT-210" o "POS-58") y vincúlala. El PIN suele ser <code>0000</code> o <code>1234</code>.
                </li>
                <li>
                  <strong>Regresa a esta aplicación Lybet</strong>, abre los "Ajustes de Impresión Bluetooth" (icono de engranaje/impresora arriba).
                </li>
                <li>
                  <strong>Activa el "Bluetooth de la App"</strong> si está apagado, y presiona <strong>Buscar</strong>.
                </li>
                <li>
                  Selecciona tu impresora en la lista de "Dispositivos encontrados". Una vez conectada, podrás imprimir tickets al instante.
                </li>
                <li>
                  <em>Nota:</em> Puedes ajustar el ancho del papel (58mm o 80mm) y las copias automáticas en la configuración de la app.
                </li>
              </ol>
            </div>
            <div className="modal-footer" style={{ padding: '15px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowGuide(false)} style={{ padding: '10px 20px' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaquillaPage;
