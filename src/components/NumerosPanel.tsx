import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { TaqTab } from '../pages/Taquilla/taquillaData';
import { ANIMALES } from '../pages/Taquilla/taquillaData';
import AnimalesGrid from './AnimalesGrid';

interface NumerosPanelProps {
  tab: TaqTab;
  numero: string;
  monto: string;
  moneda: 'BS' | 'USD';
  activeInput: 'numero' | 'monto';
  selectedSorteosCount: number;
  mobileView: 'sorteos' | 'numeros' | 'ticket';
  onSetActiveInput: (v: 'numero' | 'monto') => void;
  onSetMoneda: (v: 'BS' | 'USD') => void;
  onAppendNum: (n: string, tab: TaqTab, currentNumero: string) => void;
  onSetNumero: (v: string) => void;
  onSetMonto: (v: string) => void;
  onAdd: () => void;
}

const NumerosPanel: React.FC<NumerosPanelProps> = ({
  tab, numero, monto, moneda, activeInput, selectedSorteosCount,
  mobileView, onSetActiveInput, onSetMoneda,
  onAppendNum, onSetNumero, onSetMonto, onAdd,
}) => {
  const [animalSearch, setAnimalSearch] = useState('');

  const filteredAnimales = ANIMALES.filter(a =>
    a.nombre.toLowerCase().includes(animalSearch.toLowerCase()) || a.numero.includes(animalSearch)
  );

  const isAnimalTab = tab === 'animalitos' || tab === 'pandaplus';
  const showMobileAnimals = isAnimalTab && activeInput === 'numero';

  const handleNumpadKey = (key: number | 'C' | '.' | '<') => {
    if (key === 'C') {
      if (activeInput === 'numero') onSetNumero('');
      else onSetMonto('');
    } else if (key === '<') {
      if (activeInput === 'numero') onSetNumero(numero.slice(0, -1));
      else onSetMonto(monto.slice(0, -1));
    } else if (key === '.') {
      // FASE 3: Punto decimal para montos
      if (activeInput === 'monto' && !monto.includes('.')) {
        onSetMonto(monto + '.');
      }
    } else {
      if (activeInput === 'numero') onAppendNum(String(key), tab, numero);
      else onSetMonto(monto + String(key));
    }
  };

  const isAddDisabled = !numero || !monto || selectedSorteosCount === 0;

  return (
    <div className={`panel-column panel-numeros ${mobileView === 'numeros' ? 'active-mobile' : 'hidden-mobile'}`}>
      <div className="play-creation-layout">
        <div className="play-inputs-and-keypad">
          {/* Displays de entrada */}
          <div className="input-display">
            <div className="input-group-row">
              <div
                className={`input-box ${activeInput === 'numero' ? 'focused' : ''}`}
                onClick={() => onSetActiveInput('numero')}
              >
                <label>Número</label>
                <div className="val">{numero || '—'}</div>
              </div>
              <div
                className={`input-box ${activeInput === 'monto' ? 'focused' : ''}`}
                onClick={() => onSetActiveInput('monto')}
              >
                <label>Monto</label>
                <div className="monto-wrapper">
                  <button
                    className={`cur-btn ${moneda === 'BS' ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); onSetMoneda('BS'); }}
                  >Bs</button>
                  <button
                    className={`cur-btn ${moneda === 'USD' ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); onSetMoneda('USD'); }}
                  >$</button>
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
              <button
                key={v}
                className="quick-chip"
                onClick={() => { onSetMonto(v); onSetActiveInput('monto'); }}
              >
                +{v}
              </button>
            ))}
          </div>

          {/* Animales en móvil (cuando campo número está activo) */}
          <div className={`mobile-animals-container ${showMobileAnimals ? 'active' : ''}`}>
            <AnimalesGrid
              animales={filteredAnimales}
              selectedNumero={numero}
              onSelect={n => { onSetNumero(n); onSetActiveInput('monto'); }}
            />
          </div>

          {/* Numpad + botón agregar */}
          <div className="numpad-wrapper">
            <div className={`numpad ${showMobileAnimals ? 'hide-on-mobile' : ''}`}>
              {/* FASE 3: Se añade el punto decimal */}
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '.', '<'] as const).map(key => (
                <button
                  key={String(key)}
                  className={`numpad-key ${key === 'C' ? 'clear' : ''} ${key === '.' ? 'decimal' : ''}`}
                  onClick={() => handleNumpadKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              className="add-play-btn"
              onClick={onAdd}
              disabled={isAddDisabled}
            >
              <Plus size={24} /> Agregar Jugada
            </button>
          </div>
        </div>

        {/* Panel Animales en Tablet/Desktop (sin duplicar JSX) */}
        {isAnimalTab && (
          <div className="animals-panel-selector desktop-only">
            <div className="panel-subtitle" style={{ padding: '0 0 10px 0', borderBottom: '1px solid var(--border-1)' }}>
              <div className="search-bar-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar animal (ej: delfín, 0)"
                  value={animalSearch}
                  onChange={e => setAnimalSearch(e.target.value)}
                  className="animal-search-input"
                />
              </div>
            </div>
            {/* FASE 2 FIX: Un solo AnimalesGrid en lugar de dos bloques duplicados */}
            <AnimalesGrid
              animales={filteredAnimales}
              selectedNumero={numero}
              onSelect={n => { onSetNumero(n); onSetActiveInput('monto'); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NumerosPanel;
