import { useState, useCallback } from 'react';

const SIMULATED_PRINTERS = [
  { name: 'PT-210 (Termo 58mm)', mac: '80:EA:CA:89:12:03', signal: 95 },
  { name: 'MTP-II (Compact 58mm)', mac: '00:1B:35:11:78:AC', signal: 82 },
  { name: 'POS-80-Bluetooth (80mm)', mac: '04:FE:22:90:54:E5', signal: 70 },
  { name: 'Zebra ZQ320-Mobile', mac: 'AC:3E:B2:D3:5F:1A', signal: 45 },
];

export interface PrinterConfig {
  paperWidth: 58 | 80;
  printCopies: number;
  duplicateAgencia: boolean;
  printBarcode: boolean;
  headerText: string;
  footerText: string;
}

const DEFAULT_CONFIG: PrinterConfig = {
  paperWidth: 58,
  printCopies: 1,
  duplicateAgencia: false,
  printBarcode: true,
  headerText: 'LYBET TAQUILLA\n¡Mucha Suerte!',
  footerText: 'Conserve su ticket de juego.\nRevise su jugada.\n¡Gracias por preferirnos!',
};

export function useBluetooth(onToast: (msg: string, type?: 'ok' | 'err') => void) {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(() =>
    localStorage.getItem('lybet_bt_enabled') === 'true'
  );
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(() =>
    localStorage.getItem('lybet_connected_printer')
  );
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(() => {
    try {
      const saved = localStorage.getItem('lybet_printer_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [scanning, setScanning] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<typeof SIMULATED_PRINTERS>([]);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  const handleToggleBluetooth = useCallback((checked: boolean) => {
    setBluetoothEnabled(checked);
    localStorage.setItem('lybet_bt_enabled', String(checked));
    if (!checked) {
      setConnectedPrinter(null);
      localStorage.removeItem('lybet_connected_printer');
      setFoundPrinters([]);
    }
  }, []);

  const handleStartScan = useCallback(() => {
    setScanning(true);
    setFoundPrinters([]);
    setTimeout(() => {
      setFoundPrinters(SIMULATED_PRINTERS);
      setScanning(false);
    }, 2000);
  }, []);

  const handleConnectPrinter = useCallback((name: string) => {
    setConnectingTo(name);
    setTimeout(() => {
      setConnectedPrinter(name);
      localStorage.setItem('lybet_connected_printer', name);
      setConnectingTo(null);
      onToast(`Conectado a ${name}`);
    }, 1500);
  }, [onToast]);

  const handleDisconnectPrinter = useCallback(() => {
    if (connectedPrinter) {
      const name = connectedPrinter;
      setConnectedPrinter(null);
      localStorage.removeItem('lybet_connected_printer');
      onToast(`Impresora ${name} desconectada`);
    }
  }, [connectedPrinter, onToast]);

  const handleSaveConfig = useCallback(<K extends keyof PrinterConfig>(field: K, val: PrinterConfig[K]) => {
    setPrinterConfig(prev => {
      const next = { ...prev, [field]: val };
      localStorage.setItem('lybet_printer_config', JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    bluetoothEnabled,
    connectedPrinter,
    printerConfig,
    scanning,
    foundPrinters,
    connectingTo,
    handleToggleBluetooth,
    handleStartScan,
    handleConnectPrinter,
    handleDisconnectPrinter,
    handleSaveConfig,
  };
}
