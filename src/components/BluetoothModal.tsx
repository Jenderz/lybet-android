import React from 'react';
import {
  X, Monitor, Moon, Sun, Bluetooth, Printer, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import type { PrinterConfig } from '../hooks/useBluetooth';
import type { ThemeType, FontSizeType } from '../contexts/ThemeContext';

interface BluetoothModalProps {
  settingsTab: 'app' | 'printer';
  theme: string;
  fontSize: string;
  bluetoothEnabled: boolean;
  connectedPrinter: string | null;
  printerConfig: PrinterConfig;
  scanning: boolean;
  foundPrinters: Array<{ name: string; mac: string; signal: number }>;
  connectingTo: string | null;
  onClose: () => void;
  onSetSettingsTab: (t: 'app' | 'printer') => void;
  onShowGuide: () => void;
  onSetTheme: (t: ThemeType) => void;
  onSetFontSize: (s: FontSizeType) => void;
  onToggleBluetooth: (checked: boolean) => void;
  onStartScan: () => void;
  onConnectPrinter: (name: string) => void;
  onDisconnectPrinter: () => void;
  onSaveConfig: <K extends keyof PrinterConfig>(field: K, val: PrinterConfig[K]) => void;
  onTestPrint: () => void;
}

const BluetoothModal: React.FC<BluetoothModalProps> = ({
  settingsTab, theme, fontSize,
  bluetoothEnabled, connectedPrinter, printerConfig,
  scanning, foundPrinters, connectingTo,
  onClose, onSetSettingsTab, onShowGuide,
  onSetTheme, onSetFontSize,
  onToggleBluetooth, onStartScan, onConnectPrinter, onDisconnectPrinter,
  onSaveConfig, onTestPrint,
}) => (
  <div className="modal-overlay fade-in">
    <div className="modal-content printer-config-modal">
      <div className="modal-header">
        <h2>Ajustes de la Aplicación</h2>
        {settingsTab === 'printer' && (
          <button className="btn-secondary guide-btn" onClick={onShowGuide}>
            Guía
          </button>
        )}
        <button className="close-modal" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Pestañas de ajustes */}
      <div className="settings-tabs-nav">
        <button
          className={`settings-tab-btn ${settingsTab === 'app' ? 'active' : ''}`}
          onClick={() => onSetSettingsTab('app')}
        >
          <Monitor size={16} /> Apariencia
        </button>
        <button
          className={`settings-tab-btn ${settingsTab === 'printer' ? 'active' : ''}`}
          onClick={() => onSetSettingsTab('printer')}
        >
          <Printer size={16} /> Impresora
        </button>
      </div>

      <div className="modal-body">
        {settingsTab === 'app' ? (
          <div className="settings-app-section">
            {/* Tema */}
            <div className="config-section" style={{ borderBottom: '1px solid var(--border-2)', paddingBottom: '16px' }}>
              <div className="label-block" style={{ marginBottom: '12px' }}>
                <span className="section-title">Tema Visual</span>
                <span className="section-desc">Elige cómo quieres ver la interfaz</span>
              </div>
              <div className="segmented-control">
                <button className={theme === 'light' ? 'active' : ''} onClick={() => onSetTheme('light')}>
                  <Sun size={14} /> Claro
                </button>
                <button className={theme === 'dark' ? 'active' : ''} onClick={() => onSetTheme('dark')}>
                  <Moon size={14} /> Oscuro
                </button>
                <button className={theme === 'auto' ? 'active' : ''} onClick={() => onSetTheme('auto')}>
                  <Monitor size={14} /> Auto
                </button>
              </div>
            </div>

            {/* Tamaño de letra */}
            <div className="config-section" style={{ paddingBottom: '16px' }}>
              <div className="label-block" style={{ marginBottom: '12px' }}>
                <span className="section-title">Tamaño de la Letra</span>
                <span className="section-desc">Ajusta el tamaño global de los textos</span>
              </div>
              <div className="segmented-control">
                <button className={fontSize === 'small' ? 'active' : ''} onClick={() => onSetFontSize('small')}>Pequeño</button>
                <button className={fontSize === 'medium' ? 'active' : ''} onClick={() => onSetFontSize('medium')}>Mediano</button>
                <button className={fontSize === 'large' ? 'active' : ''} onClick={() => onSetFontSize('large')}>Grande</button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  onChange={e => onToggleBluetooth(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            {bluetoothEnabled ? (
              <>
                {/* Estado de conexión */}
                <div className="config-section connection-status-box">
                  <div className="status-header">
                    {connectedPrinter ? (
                      <>
                        <div className="status-indicator connected">
                          <Wifi size={18} />
                          <span>Conectado a <strong>{connectedPrinter}</strong></span>
                        </div>
                        <button className="disconnect-btn" onClick={onDisconnectPrinter}>Desconectar</button>
                      </>
                    ) : (
                      <>
                        <div className="status-indicator disconnected">
                          <WifiOff size={18} />
                          <span>Sin impresora vinculada</span>
                        </div>
                        <button className="scan-btn" onClick={onStartScan} disabled={scanning}>
                          {scanning ? <RefreshCw size={14} className="spin" /> : 'Buscar'}
                        </button>
                      </>
                    )}
                  </div>

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
                            onClick={() => onConnectPrinter(p.name)}
                          >
                            {connectingTo === p.name ? 'Conectando...' : 'Vincular'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opciones del ticket */}
                {connectedPrinter && (
                  <div className="printer-options-form">
                    <h3>Ajustes del Ticket</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Ancho del papel</label>
                        <div className="segmented-control">
                          <button
                            className={printerConfig.paperWidth === 58 ? 'active' : ''}
                            onClick={() => onSaveConfig('paperWidth', 58)}
                          >58mm (32col)</button>
                          <button
                            className={printerConfig.paperWidth === 80 ? 'active' : ''}
                            onClick={() => onSaveConfig('paperWidth', 80)}
                          >80mm (48col)</button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Copias a imprimir</label>
                        <div className="copies-selector">
                          <button
                            disabled={printerConfig.printCopies <= 1}
                            onClick={() => onSaveConfig('printCopies', printerConfig.printCopies - 1)}
                          >-</button>
                          <span>{printerConfig.printCopies}</span>
                          <button
                            disabled={printerConfig.printCopies >= 3}
                            onClick={() => onSaveConfig('printCopies', printerConfig.printCopies + 1)}
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <div className="form-checkboxes">
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={printerConfig.duplicateAgencia}
                          onChange={e => onSaveConfig('duplicateAgencia', e.target.checked)}
                        />
                        <span>Imprimir copia para Agencia (con marca de agua)</span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={printerConfig.printBarcode}
                          onChange={e => onSaveConfig('printBarcode', e.target.checked)}
                        />
                        <span>Imprimir código de barras al pie</span>
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Texto Cabecera</label>
                      <textarea
                        rows={2}
                        value={printerConfig.headerText}
                        onChange={e => onSaveConfig('headerText', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Texto Pie de Página</label>
                      <textarea
                        rows={3}
                        value={printerConfig.footerText}
                        onChange={e => onSaveConfig('footerText', e.target.value)}
                      />
                    </div>

                    <button className="test-print-btn" onClick={onTestPrint}>
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
          </>
        )}
      </div>
    </div>
  </div>
);

export default BluetoothModal;
