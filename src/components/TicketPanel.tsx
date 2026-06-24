import React, { useState } from 'react';
import { Trash2, Receipt, CheckSquare, Printer } from 'lucide-react';
import { ANIMALES } from '../pages/Taquilla/taquillaData';
import type { Jugada } from '../hooks/useJugadas';

const fmtMoney = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface TicketPanelProps {
  ticketSerial: string;
  jugadas: Jugada[];
  totalBS: number;
  bluetoothEnabled: boolean;
  connectedPrinter: string | null;
  mobileView: 'sorteos' | 'numeros' | 'ticket';
  onRemove: (id: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}

/** FASE 3: Diálogo de confirmación de limpieza */
const ConfirmClearDialog: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="confirm-overlay fade-in" role="dialog" aria-modal="true" aria-label="Confirmar limpieza">
    <div className="confirm-box">
      <p className="confirm-title">¿Limpiar ticket?</p>
      <p className="confirm-desc">Se eliminarán todas las jugadas del ticket actual. Esta acción no se puede deshacer.</p>
      <div className="confirm-actions">
        <button className="confirm-btn-cancel" onClick={onCancel}>Cancelar</button>
        <button className="confirm-btn-ok" onClick={onConfirm}>Limpiar</button>
      </div>
    </div>
  </div>
);

const TicketPanel: React.FC<TicketPanelProps> = ({
  ticketSerial, jugadas, totalBS, bluetoothEnabled, connectedPrinter,
  mobileView, onRemove, onClear, onConfirm,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const hasPrinter = bluetoothEnabled && connectedPrinter;

  return (
    <div className={`panel-column panel-ticket ${mobileView === 'ticket' ? 'active-mobile' : 'hidden-mobile'}`}>
      {showConfirm && (
        <ConfirmClearDialog
          onConfirm={() => { setShowConfirm(false); onClear(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

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
            /* FASE 3: clase jugada-row-new para animación de entrada */
            <div key={j.id} className="jugada-row jugada-row-new">
              <div className="j-info">
                <div className="j-title">{j.loteriaLabel} - {j.sorteoLabel}</div>
                <div className="j-monto">{j.moneda === 'BS' ? 'Bs.' : '$'} {fmtMoney(j.monto)}</div>
              </div>
              <div className="j-num-container">
                {(j.tipo === 'animalitos' || j.tipo === 'pandaplus') ? (() => {
                  const animal = ANIMALES.find(a => a.numero === j.numero);
                  if (animal) return (
                    <div className="j-animal-display">
                      <span className="j-animal-emoji">{animal.emoji}</span>
                      <div className="j-animal-text">
                        <span className="j-animal-name">{animal.nombre}</span>
                        <span className="j-animal-number">#{animal.numero}</span>
                      </div>
                    </div>
                  );
                  return <span className="j-num">{j.numero}</span>;
                })() : (
                  <span className="j-num">{j.numero}</span>
                )}
              </div>
              <button className="j-del" onClick={() => onRemove(j.id)} title="Eliminar jugada">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="ticket-actions">
        <button
          className="btn-secondary"
          onClick={() => jugadas.length > 0 ? setShowConfirm(true) : undefined}
          title="Limpiar ticket"
          disabled={jugadas.length === 0}
        >
          <Trash2 size={24} />
        </button>
        <button
          className="btn-primary"
          onClick={onConfirm}
          disabled={jugadas.length === 0}
          title={hasPrinter ? 'Guardar e Imprimir' : 'Guardar y Compartir'}
        >
          {hasPrinter ? <Printer size={24} /> : <CheckSquare size={24} />}
        </button>
      </div>
    </div>
  );
};

export default TicketPanel;
