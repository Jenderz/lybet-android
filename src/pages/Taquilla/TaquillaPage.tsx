import React, { useState, useEffect, useCallback } from 'react';
import { Share } from '@capacitor/share';
import { LogOut, Clock, Settings, Zap, Dices, Receipt } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ticketService } from '../../services/dataService';
import { getLotteriesByTab, TAQ_TABS, type TaqTab } from './taquillaData';
import type { Ticket } from '../../models/types';


// Hooks
import { useJugadas } from '../../hooks/useJugadas';
import { useBluetooth } from '../../hooks/useBluetooth';
import { usePrinterSim, formatTicketEscPos } from '../../hooks/usePrinterSim';

// Componentes
import SorteosPanel from '../../components/SorteosPanel';
import NumerosPanel from '../../components/NumerosPanel';
import TicketPanel from '../../components/TicketPanel';
import BluetoothModal from '../../components/BluetoothModal';
import HistorialModal from '../../components/HistorialModal';
import PrinterViewer from '../../components/PrinterViewer';
import GuidaModal from '../../components/GuidaModal';

import './taquilla.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genSerial = () => `TK-${String(Date.now()).slice(-6)}`;

// ─── TaquillaPage (Orquestador) ───────────────────────────────────────────────
const TaquillaPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TaqTab>('animalitos');
  const [mobileView, setMobileView] = useState<'sorteos' | 'numeros' | 'ticket'>('sorteos');
  const [settingsTab, setSettingsTab] = useState<'app' | 'printer'>('app');
  const [ticketSerial, setTicketSerial] = useState(genSerial);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // FASE 2 FIX: Tipado correcto con Ticket
  const [historyTickets, setHistoryTickets] = useState<Ticket[]>([]);

  // ── Computed data ────────────────────────────────────────────────────────────
  const loterias = getLotteriesByTab(tab);
  const allSorteos = loterias.flatMap(l =>
    l.horarios.map(s => ({ ...s, loteriaId: l.id, loteriaLabel: l.nombre }))
  );

  // ── Callbacks auxiliares ─────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadHistory = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const tickets = ticketService.getAll();
    const myTickets = tickets.filter(
      t => t.agenciaId === currentUser?.id && t.fecha === today
    );
    myTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setHistoryTickets(myTickets);
  }, [currentUser?.id]);

  useEffect(() => { loadHistory(); }, [currentUser, loadHistory]);

  // ── Hooks de dominio ─────────────────────────────────────────────────────────
  const jugadasHook = useJugadas({
    allSorteos,
    tab,
    onToast: showToast,
    // FASE 3: Auto-navegar a ticket cuando hay ≥5 jugadas
    onSuccess: (addedCount) => {
      const total = jugadasHook.jugadas.length + addedCount;
      if (total >= 5) setMobileView('ticket');
    },
  });

  const bluetoothHook = useBluetooth(showToast);
  const printerHook = usePrinterSim();

  // ── Keyboard support (useCallback estable) ───────────────────────────────────
  // FASE 1 FIX: handleAdd es estable desde el hook con useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const key = e.key;

    if (/^[0-9]$/.test(key)) {
      if (jugadasHook.activeInput === 'numero') {
        jugadasHook.appendNum(key, tab, jugadasHook.numero);
      } else {
        jugadasHook.setMonto(p => p + key);
      }
    } else if (key === 'Backspace') {
      if (jugadasHook.activeInput === 'numero') jugadasHook.setNumero(p => p.slice(0, -1));
      else jugadasHook.setMonto(p => p.slice(0, -1));
    } else if (key === 'Escape' || key === 'Delete' || key.toLowerCase() === 'c') {
      if (jugadasHook.activeInput === 'numero') jugadasHook.setNumero('');
      else jugadasHook.setMonto('');
    } else if (key === 'Enter') {
      e.preventDefault();
      jugadasHook.handleAdd();
    } else if (key === 'Tab') {
      e.preventDefault();
      jugadasHook.setActiveInput(p => p === 'numero' ? 'monto' : 'numero');
    }
  }, [jugadasHook, tab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Confirm ticket ───────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!jugadasHook.jugadas.length) return;

    const serial = ticketSerial;
    const montoTotal = jugadasHook.totalBS;
    const mappedPlays = jugadasHook.jugadas.map(j => ({
      numero: j.numero,
      monto: j.monto,
      tipo: (j.tipo === 'pandaplus' || j.tipo === 'cuatrocifras' ? 'animalitos' : j.tipo) as any,
      loteriaLabel: j.loteriaLabel,
      sorteoLabel: j.sorteoLabel,
    }));

    const ticketData = {
      serial,
      agenciaId: currentUser?.id ?? '',
      bancaId: '',
      grupoId: '',
      monto: montoTotal,
      moneda: jugadasHook.moneda,
      tipo: (tab === 'pandaplus' || tab === 'cuatrocifras' ? 'animalitos' : tab) as any,
      estado: 'activo' as const,
      fecha: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      jugadas: mappedPlays,
    };

    ticketService.create(ticketData);
    loadHistory();

    if (bluetoothHook.bluetoothEnabled && bluetoothHook.connectedPrinter) {
      let finalPrint = '';
      for (let c = 0; c < bluetoothHook.printerConfig.printCopies; c++) {
        finalPrint += formatTicketEscPos(ticketData, currentUser?.nombre ?? 'Agencia', {
          ...bluetoothHook.printerConfig,
          isCopy: c > 0 || bluetoothHook.printerConfig.duplicateAgencia,
        });
        if (c < bluetoothHook.printerConfig.printCopies - 1) {
          finalPrint += '\n' + '-'.repeat(bluetoothHook.printerConfig.paperWidth === 80 ? 48 : 32) + '\n\n';
        }
      }
      printerHook.startSimulationPrint(finalPrint);
      showToast('✓ Guardado e Impreso por Bluetooth');
    } else {
      let text = `🎟️ TICKET: ${serial}\n`;
      text += `🏢 Agencia: ${currentUser?.nombre}\n`;
      text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}\n\n`;
      jugadasHook.jugadas.forEach(j => {
        text += `🎯 ${j.loteriaLabel} - ${j.sorteoLabel}\n`;
        text += `   #️⃣ ${j.numero} - Bs. ${j.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n\n`;
      });
      text += `💰 TOTAL: Bs. ${montoTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n`;

      try {
        await Share.share({ title: 'Ticket Lybet', text, dialogTitle: 'Compartir Ticket' });
        showToast('✓ Ticket guardado y compartido');
      } catch {
        showToast('✓ Ticket guardado');
      }
    }

    jugadasHook.resetForNewTicket();
    setTicketSerial(genSerial());
    setMobileView('sorteos');
  }, [jugadasHook, bluetoothHook, printerHook, ticketSerial, tab, currentUser, loadHistory, showToast]);

  // ── Reimprimir ───────────────────────────────────────────────────────────────
  const handleReimprimir = useCallback((ticket: Ticket) => {
    if (!bluetoothHook.bluetoothEnabled || !bluetoothHook.connectedPrinter) {
      showToast('Debe encender el Bluetooth y conectar una impresora', 'err');
      setShowConfig(true);
      return;
    }
    let finalPrint = '';
    for (let c = 0; c < bluetoothHook.printerConfig.printCopies; c++) {
      finalPrint += formatTicketEscPos(ticket, currentUser?.nombre ?? 'Agencia', {
        ...bluetoothHook.printerConfig,
        isCopy: c > 0 || bluetoothHook.printerConfig.duplicateAgencia,
      });
      if (c < bluetoothHook.printerConfig.printCopies - 1) {
        finalPrint += '\n' + '-'.repeat(bluetoothHook.printerConfig.paperWidth === 80 ? 48 : 32) + '\n\n';
      }
    }
    printerHook.startSimulationPrint(finalPrint);
    showToast('✓ Reimprimiendo ticket...');
  }, [bluetoothHook, printerHook, currentUser, showToast]);

  // ── Test print ───────────────────────────────────────────────────────────────
  const triggerTestPrint = useCallback(() => {
    const testTicket = {
      serial: 'TK-PRUEBA',
      fecha: new Date().toISOString().split('T')[0],
      monto: 100.00,
      jugadas: [
        { loteriaLabel: 'Granja Millonaria', numero: '12', monto: 50.00 },
        { loteriaLabel: 'La Granjita', numero: '05', monto: 50.00 },
      ],
    };
    printerHook.startSimulationPrint(
      formatTicketEscPos(testTicket, currentUser?.nombre ?? 'Agencia Demo', bluetoothHook.printerConfig)
    );
    showToast('✓ Imprimiendo ticket de prueba');
  }, [bluetoothHook.printerConfig, printerHook, currentUser, showToast]);

  // ── Cambio de tab ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((newTab: TaqTab) => {
    setTab(newTab);
    jugadasHook.setAllSorteos([]);
    jugadasHook.setNumero('');
  }, [jugadasHook]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">LB</div>
          <div className="brand-text">Lybet Taquilla</div>
        </div>
        <div className="header-actions">
          <button
            className="header-action-btn"
            title="Historial de Ventas"
            onClick={() => { loadHistory(); setShowHistory(true); }}
          >
            <Clock size={20} />
          </button>
          <button
            className="header-action-btn"
            title="Ajustes de la Aplicación"
            onClick={() => setShowConfig(true)}
          >
            <Settings size={20} />
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
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* WORKSPACE */}
      <main className="main-content taquilla-workspace-grid">
        <SorteosPanel
          loterias={loterias}
          allSorteos={allSorteos}
          selectedSorteos={jugadasHook.selectedSorteos}
          mobileView={mobileView}
          onToggle={jugadasHook.toggleSorteo}
          onSelectAll={() => {
            const allIds = allSorteos.filter(s => s.estado === 'abierto').map(s => s.id);
            jugadasHook.setAllSorteos(
              jugadasHook.selectedSorteos.length === allIds.length ? [] : allIds
            );
          }}
        />

        <NumerosPanel
          tab={tab}
          numero={jugadasHook.numero}
          monto={jugadasHook.monto}
          moneda={jugadasHook.moneda}
          activeInput={jugadasHook.activeInput}
          selectedSorteosCount={jugadasHook.selectedSorteos.length}
          mobileView={mobileView}
          onSetActiveInput={jugadasHook.setActiveInput}
          onSetMoneda={jugadasHook.setMoneda}
          onAppendNum={jugadasHook.appendNum}
          onSetNumero={jugadasHook.setNumero}
          onSetMonto={jugadasHook.setMonto}
          onAdd={jugadasHook.handleAdd}
        />

        <TicketPanel
          ticketSerial={ticketSerial}
          jugadas={jugadasHook.jugadas}
          totalBS={jugadasHook.totalBS}
          bluetoothEnabled={bluetoothHook.bluetoothEnabled}
          connectedPrinter={bluetoothHook.connectedPrinter}
          mobileView={mobileView}
          onRemove={jugadasHook.removeJugada}
          onClear={jugadasHook.clearJugadas}
          onConfirm={handleConfirm}
        />
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${mobileView === 'sorteos' ? 'active' : ''}`}
          onClick={() => setMobileView('sorteos')}
        >
          <div className="nav-icon-wrapper">
            <Zap size={22} />
            {jugadasHook.selectedSorteos.length > 0 && (
              <span className="badge">{jugadasHook.selectedSorteos.length}</span>
            )}
          </div>
          <span>Sorteos</span>
        </button>
        <button
          className={`nav-btn ${mobileView === 'numeros' ? 'active' : ''}`}
          onClick={() => setMobileView('numeros')}
        >
          <div className="nav-icon-wrapper">
            <Dices size={22} />
          </div>
          <span>Números</span>
        </button>
        <button
          className={`nav-btn ${mobileView === 'ticket' ? 'active' : ''}`}
          onClick={() => setMobileView('ticket')}
        >
          <div className="nav-icon-wrapper">
            <Receipt size={22} />
            {jugadasHook.jugadas.length > 0 && (
              <span className="badge red">{jugadasHook.jugadas.length}</span>
            )}
          </div>
          <span>Ticket</span>
        </button>
      </nav>

      {/* MODALES */}
      {showConfig && (
        <BluetoothModal
          settingsTab={settingsTab}
          theme={theme}
          fontSize={fontSize}
          bluetoothEnabled={bluetoothHook.bluetoothEnabled}
          connectedPrinter={bluetoothHook.connectedPrinter}
          printerConfig={bluetoothHook.printerConfig}
          scanning={bluetoothHook.scanning}
          foundPrinters={bluetoothHook.foundPrinters}
          connectingTo={bluetoothHook.connectingTo}
          onClose={() => setShowConfig(false)}
          onSetSettingsTab={setSettingsTab}
          onShowGuide={() => setShowGuide(true)}
          onSetTheme={setTheme}
          onSetFontSize={setFontSize}
          onToggleBluetooth={bluetoothHook.handleToggleBluetooth}
          onStartScan={bluetoothHook.handleStartScan}
          onConnectPrinter={bluetoothHook.handleConnectPrinter}
          onDisconnectPrinter={bluetoothHook.handleDisconnectPrinter}
          onSaveConfig={bluetoothHook.handleSaveConfig}
          onTestPrint={triggerTestPrint}
        />
      )}

      {showHistory && (
        <HistorialModal
          tickets={historyTickets}
          onClose={() => setShowHistory(false)}
          onReimprimir={handleReimprimir}
        />
      )}

      {printerHook.showPrinterViewer && (
        <PrinterViewer
          isPrintingAnim={printerHook.isPrintingAnim}
          printingLines={printerHook.printingLines}
          visibleLinesCount={printerHook.visibleLinesCount}
          connectedPrinter={bluetoothHook.connectedPrinter}
          paperContentRef={printerHook.paperContentRef}
          onClose={printerHook.closePrinterViewer}
        />
      )}

      {showGuide && <GuidaModal onClose={() => setShowGuide(false)} />}

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
