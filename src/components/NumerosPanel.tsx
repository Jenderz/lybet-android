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

  // Mostrar animales cuando: tab de animales Y campo número activo
  // Mostrar numpad cuando: tab de lotería O campo monto activo
  const showAnimalsSlot = isAnimalTab && activeInput === 'numero';

  const handleNumpadKey = (key: number | 'C' | '.' | '<') => {
    if (key === 'C') {
      if (activeInput === 'numero') onSetNumero('');
      else onSetMonto('');
    } else if (key === '<') {
      if (activeInput === 'numero') onSetNumero(numero.slice(0, -1));
      else onSetMonto(monto.slice(0, -1));
    } else if (key === '.') {
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

          {/* ── Zona de intercambio: Animales ↔ Numpad ── */}
          <div className="input-zone-switcher">

            {/* ANIMALES: tab animalitos + campo número activo */}
            <div className={`input-zone animals-zone ${showAnimalsSlot ? 'zone-active' : 'zone-hidden'}`}>
              <div className="animals-zone-inner">
                <AnimalesGrid
                  animales={filteredAnimales}
                  selectedNumero={numero}
                  onSelect={n => { onSetNumero(n); onSetActiveInput('monto'); }}
                />
              </div>
            </div>

            {/* NUMPAD: lotería O campo monto activo */}
            <div className={`input-zone numpad-zone ${!showAnimalsSlot ? 'zone-active' : 'zone-hidden'}`}>
              <div className="numpad">
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
            </div>

          </div>

          {/* Botón Agregar — siempre visible */}
          <div className="numpad-wrapper">
            <button
              className="add-play-btn"
              onClick={onAdd}
              disabled={isAddDisabled}
            >
              <Plus size={24} /> Agregar Jugada
            </button>
          </div>

        </div>

        {/* Panel Animales en Tablet/Desktop */}
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
