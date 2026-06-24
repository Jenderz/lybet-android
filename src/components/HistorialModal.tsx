import React from 'react';
import { X, FileText, Printer } from 'lucide-react';
import type { Ticket } from '../models/types';

const fmtMoney = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface HistorialModalProps {
  /** FASE 2 FIX: Tipado correcto con Ticket en lugar de any[] */
  tickets: Ticket[];
  onClose: () => void;
  onReimprimir: (ticket: Ticket) => void;
}

const HistorialModal: React.FC<HistorialModalProps> = ({ tickets, onClose, onReimprimir }) => (
  <div className="modal-overlay fade-in">
    <div className="modal-content history-modal">
      <div className="modal-header">
        <h2>Tickets Emitidos Hoy</h2>
        <button className="close-modal" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-body">
        {tickets.length === 0 ? (
          <div className="empty-history">
            <FileText size={48} className="muted-icon" />
            <p>No se han emitido tickets en la sesión actual.</p>
          </div>
        ) : (
          <div className="history-list">
            {tickets.map(t => (
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
                      t.jugadas.map((j, idx) => (
                        <span key={idx} className="jugada-tag">
                          #{j.numero} ({(j as any).loteriaLabel ? (j as any).loteriaLabel.slice(0, 10) : j.tipo})
                        </span>
                      ))
                    ) : (
                      <span className="muted-text">Sin jugadas detalladas</span>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="amount-label">
                      Total: <strong>Bs. {fmtMoney(t.monto)}</strong>
                    </span>
                    <button
                      className="reprint-btn"
                      title="Reimprimir por Bluetooth"
                      onClick={() => onReimprimir(t)}
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
);

export default HistorialModal;
