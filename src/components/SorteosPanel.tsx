import React from 'react';
import { Zap, Clock, CheckSquare } from 'lucide-react';
import type { Loteria } from '../pages/Taquilla/taquillaData';

interface SorteosPanelProps {
  loterias: Loteria[];
  allSorteos: Array<{ id: string; label: string; hora: string; estado: 'abierto' | 'cerrado'; loteriaId: string; loteriaLabel: string }>;
  selectedSorteos: string[];
  mobileView: 'sorteos' | 'numeros' | 'ticket';
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}

const SorteosPanel: React.FC<SorteosPanelProps> = ({
  loterias,
  allSorteos,
  selectedSorteos,
  mobileView,
  onToggle,
  onSelectAll,
}) => {
  const allSelected = selectedSorteos.length === allSorteos.length && allSorteos.length > 0;

  return (
    <div className={`panel-column panel-sorteos ${mobileView === 'sorteos' ? 'active-mobile' : 'hidden-mobile'}`}>
      <div className="section-header">
        <h3>Selecciona Sorteos</h3>
        <button className="select-all-btn" onClick={onSelectAll}>
          {allSelected ? 'Ninguno' : 'Todos'}
        </button>
      </div>

      <div className="sorteos-list">
        {loterias.map(l => (
          <div key={l.id} className="lottery-group">
            <div className="group-title">
              <Zap size={14} color="var(--red)" /> {l.nombre}
            </div>
            <div className="sorteos-grid">
              {l.horarios.map(s => {
                const isSel = selectedSorteos.includes(s.id);
                const isClosed = s.estado === 'cerrado';
                return (
                  <button
                    key={s.id}
                    className={`sorteo-card ${isSel ? 'selected' : ''} ${isClosed ? 'closed' : ''}`}
                    onClick={() => !isClosed && onToggle(s.id)}
                    disabled={isClosed}
                    title={isClosed ? 'Sorteo cerrado' : s.label}
                  >
                    {/* FASE 3: Icono diferente para cerrados */}
                    {isClosed
                      ? <CheckSquare size={14} className="closed-icon" />
                      : <Clock size={14} />
                    }
                    {s.hora}
                    {isClosed && <span className="sorteo-closed-badge">Cerrado</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SorteosPanel;
