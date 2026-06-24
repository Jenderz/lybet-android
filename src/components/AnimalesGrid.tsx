import React from 'react';
import type { Animal } from '../pages/Taquilla/taquillaData';

interface AnimalesGridProps {
  animales: Animal[];
  selectedNumero: string;
  onSelect: (numero: string) => void;
}

const AnimalesGrid: React.FC<AnimalesGridProps> = ({ animales, selectedNumero, onSelect }) => (
  <div className="animals-selector-grid">
    {animales.map(a => (
      <button
        key={a.numero}
        className={`animal-card-item ${selectedNumero === a.numero ? 'selected' : ''}`}
        onClick={() => onSelect(a.numero)}
      >
        <span className="animal-emoji-cell">{a.emoji}</span>
        <span className="animal-name-cell">{a.nombre}</span>
        <span className="animal-num-cell">{a.numero}</span>
      </button>
    ))}
  </div>
);

export default AnimalesGrid;
