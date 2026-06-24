import { useState, useRef, useCallback } from 'react';
import type { PrinterConfig } from './useBluetooth';

const fmtMoney = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Genera sonido buzzer de impresora térmica usando Web Audio API */
function playPrinterSound(durationMs: number) {
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
}

/** Formatea el ticket en texto monoespacio ESC/POS para 58mm (32col) o 80mm (48col) */
export function formatTicketEscPos(
  ticket: { serial: string; fecha: string; jugadas?: any[]; monto: number },
  agenciaNombre: string,
  config: PrinterConfig & { isCopy?: boolean }
): string {
  const width = config.paperWidth === 80 ? 48 : 32;
  const padCenter = (str: string) => {
    if (str.length >= width) return str.slice(0, width);
    const spaces = Math.floor((width - str.length) / 2);
    return ' '.repeat(spaces) + str;
  };
  const line = '-'.repeat(width);
  const doubleLine = '='.repeat(width);

  const out: string[] = [];

  if (config.isCopy) {
    out.push(padCenter('*** COPIA AGENCIA ***'));
    out.push('');
  }

  if (config.headerText) {
    config.headerText.split('\n').forEach(l => out.push(padCenter(l.trim())));
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
    out.push('SORTEO/LOTERIA         NÚMERO             MONTO');
    out.push(line);
    plays.forEach((j: any) => {
      const lot = (j.loteriaLabel || j.tipo || '').slice(0, 20);
      const num = `#${j.numero}`;
      const mon = `Bs. ${fmtMoney(j.monto)}`;
      const spaces = width - lot.length - num.length - mon.length;
      out.push(spaces > 0
        ? `${lot}${' '.repeat(spaces - 4)}${num}${' '.repeat(4)}${mon}`
        : `${lot.slice(0, 15)} ${num} ${mon}`
      );
    });
  } else {
    out.push('SORTEO         JUGADA     MONTO');
    out.push(line);
    plays.forEach((j: any) => {
      const lot = (j.loteriaLabel || j.tipo || '').slice(0, 12);
      const num = `#${j.numero}`;
      const mon = `Bs.${Math.round(j.monto)}`;
      const rightPart = `${num}  ${mon}`;
      const spacesNeeded = width - lot.length - rightPart.length;
      out.push(spacesNeeded > 0
        ? `${lot}${' '.repeat(spacesNeeded)}${rightPart}`
        : `${lot.slice(0, 8)} ${num} ${mon}`
      );
    });
  }

  out.push(line);
  const totalLabel = 'TOTAL:';
  const totalValue = `Bs. ${fmtMoney(ticket.monto)}`;
  const totalSpaces = width - totalLabel.length - totalValue.length;
  out.push(`${totalLabel}${' '.repeat(Math.max(1, totalSpaces))}${totalValue}`);
  out.push(doubleLine);

  if (config.footerText) {
    config.footerText.split('\n').forEach(l => out.push(padCenter(l.trim())));
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
}

export function usePrinterSim() {
  const [showPrinterViewer, setShowPrinterViewer] = useState(false);
  const [isPrintingAnim, setIsPrintingAnim] = useState(false);
  const [printingLines, setPrintingLines] = useState<string[]>([]);
  const [visibleLinesCount, setVisibleLinesCount] = useState(0);
  const paperContentRef = useRef<HTMLDivElement>(null);
  // FASE 1 FIX: guardamos ref al interval para limpiar en desmontaje
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulationPrint = useCallback((ticketText: string) => {
    const lines = ticketText.split('\n');
    setPrintingLines(lines);
    setVisibleLinesCount(0);
    setShowPrinterViewer(true);
    setIsPrintingAnim(true);

    playPrinterSound(120);

    let currentLine = 0;

    // Limpiar interval anterior si existiera
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (currentLine < lines.length) {
        currentLine++;
        setVisibleLinesCount(currentLine);
        if (currentLine % 2 === 0) playPrinterSound(70);
      } else {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsPrintingAnim(false);
        playPrinterSound(200);
      }
    }, 85);
  }, []);

  const closePrinterViewer = useCallback(() => {
    // FASE 1 FIX: limpiar interval al cerrar
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setShowPrinterViewer(false);
    setIsPrintingAnim(false);
  }, []);

  return {
    showPrinterViewer,
    isPrintingAnim,
    printingLines,
    visibleLinesCount,
    paperContentRef,
    startSimulationPrint,
    closePrinterViewer,
  };
}
