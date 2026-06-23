// ─── Datos estáticos de loterías para la Taquilla ────────────────────────────
// Replican los sorteos del exe Lybet V.01

export interface Loteria {
  id: string;
  nombre: string;
  tipo: 'animalitos' | 'terminales' | 'triples' | 'pandaplus' | 'cuatrocifras';
  horarios: Sorteo[];
  activa: boolean;
}

export interface Sorteo {
  id: string;
  hora: string;           // "12:00 PM"
  label: string;          // "Granja Millonaria 12:00 PM"
  estado: 'abierto' | 'cerrado';
}

function buildSorteos(prefijo: string, horas: string[]): Sorteo[] {
  return horas.map((h, i) => ({
    id: `${prefijo}-${i}`,
    hora: h,
    label: `${prefijo} ${h}`,
    estado: 'abierto' as const,
  }));
}

export const LOTERIAS: Loteria[] = [
  // ── Animalitos (pestaña principal) ──────────────────────────────
  {
    id: 'granja-millonaria',
    nombre: 'Granja Millonaria',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('Granja Millonaria', [
      '12:00 PM', '01:00 PM', '04:00 PM', '05:00 PM',
      '06:00 PM', '07:00 PM', '08:00 PM',
    ]),
  },
  {
    id: 'granjazo',
    nombre: 'Granjazo',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('Granjazo', [
      '12:30 PM', '01:30 PM', '04:30 PM', '05:30 PM',
      '06:30 PM', '07:30 PM', '08:30 PM',
    ]),
  },
  {
    id: 'la-granjita',
    nombre: 'La Granjita',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('La Granjita', [
      '10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM',
      '05:00 PM', '07:00 PM',
    ]),
  },
  {
    id: 'animalitos-del-zulia',
    nombre: 'Animalitos del Zulia',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('A. del Zulia', [
      '12:00 PM', '03:00 PM', '06:00 PM', '09:00 PM',
    ]),
  },
  {
    id: 'andes',
    nombre: 'Andes',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('Andes', [
      '12:00 PM', '03:00 PM', '06:00 PM',
    ]),
  },
  {
    id: 'guacharo',
    nombre: 'El Guácharo',
    tipo: 'animalitos',
    activa: true,
    horarios: buildSorteos('El Guácharo', [
      '11:00 AM', '02:00 PM', '05:00 PM', '08:00 PM',
    ]),
  },

  // ── Panda Plus ─────────────────────────────────────────────────
  {
    id: 'panda-plus',
    nombre: 'Panda Plus',
    tipo: 'pandaplus',
    activa: true,
    horarios: buildSorteos('Panda Plus', [
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
      '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
    ]),
  },

  // ── Terminales ─────────────────────────────────────────────────
  {
    id: 'terminal-activo',
    nombre: 'Terminal Activo',
    tipo: 'terminales',
    activa: true,
    horarios: buildSorteos('Terminal Activo', [
      '01:00 PM', '04:00 PM', '07:00 PM',
    ]),
  },
  {
    id: 'margarita',
    nombre: 'Margarita',
    tipo: 'terminales',
    activa: true,
    horarios: buildSorteos('Margarita', [
      '12:00 PM', '03:00 PM', '06:00 PM', '09:00 PM',
    ]),
  },

  // ── Triples ────────────────────────────────────────────────────
  {
    id: 'triple-chance',
    nombre: 'Triple Chance',
    tipo: 'triples',
    activa: true,
    horarios: buildSorteos('Triple Chance', [
      '12:00 PM', '03:00 PM', '06:00 PM', '09:00 PM',
    ]),
  },
  {
    id: 'triple-corona',
    nombre: 'Triple Corona',
    tipo: 'triples',
    activa: true,
    horarios: buildSorteos('Triple Corona', [
      '12:00 PM', '02:00 PM', '04:00 PM', '07:00 PM',
    ]),
  },

  // ── Cuatro Cifras ──────────────────────────────────────────────
  {
    id: 'cuatro-chance',
    nombre: 'Cuatro Chance',
    tipo: 'cuatrocifras',
    activa: true,
    horarios: buildSorteos('Cuatro Chance', [
      '12:00 PM', '04:00 PM', '08:00 PM',
    ]),
  },
];

// Animales del sistema Lybet
export interface Animal {
  numero: string; // "01" - "38"
  nombre: string;
  emoji: string;
}

export const ANIMALES: Animal[] = [
  { numero: '01', nombre: 'Carnero',   emoji: '🐏' },
  { numero: '02', nombre: 'Toro',      emoji: '🐂' },
  { numero: '03', nombre: 'Ciempiés',  emoji: '🐛' },
  { numero: '04', nombre: 'Alacrán',   emoji: '🦂' },
  { numero: '05', nombre: 'León',      emoji: '🦁' },
  { numero: '06', nombre: 'Rana',      emoji: '🐸' },
  { numero: '07', nombre: 'Perico',    emoji: '🦜' },
  { numero: '08', nombre: 'Ratón',     emoji: '🐭' },
  { numero: '09', nombre: 'Águila',    emoji: '🦅' },
  { numero: '10', nombre: 'Tigre',     emoji: '🐯' },
  { numero: '11', nombre: 'Gato',      emoji: '🐱' },
  { numero: '12', nombre: 'Caballo',   emoji: '🐴' },
  { numero: '13', nombre: 'Mono',      emoji: '🐒' },
  { numero: '14', nombre: 'Paloma',    emoji: '🕊️' },
  { numero: '15', nombre: 'Zorro',     emoji: '🦊' },
  { numero: '16', nombre: 'Oso',       emoji: '🐻' },
  { numero: '17', nombre: 'Pavo',      emoji: '🦃' },
  { numero: '18', nombre: 'Burro',     emoji: '🫏' },
  { numero: '19', nombre: 'Chivo',     emoji: '🐐' },
  { numero: '20', nombre: 'Cochino',   emoji: '🐷' },
  { numero: '21', nombre: 'Gallo',     emoji: '🐓' },
  { numero: '22', nombre: 'Camello',   emoji: '🐪' },
  { numero: '23', nombre: 'Zebra',     emoji: '🦓' },
  { numero: '24', nombre: 'Iguana',    emoji: '🦎' },
  { numero: '25', nombre: 'Gallina',   emoji: '🐔' },
  { numero: '26', nombre: 'Vaca',      emoji: '🐄' },
  { numero: '27', nombre: 'Perro',     emoji: '🐶' },
  { numero: '28', nombre: 'Zamuro',    emoji: '🦅' },
  { numero: '29', nombre: 'Elefante',  emoji: '🐘' },
  { numero: '30', nombre: 'Caimán',    emoji: '🐊' },
  { numero: '31', nombre: 'Lapa',      emoji: '🦫' },
  { numero: '32', nombre: 'Ardilla',   emoji: '🐿️' },
  { numero: '33', nombre: 'Pescado',   emoji: '🐟' },
  { numero: '34', nombre: 'Venado',    emoji: '🦌' },
  { numero: '35', nombre: 'Jífara',    emoji: '🦛' },
  { numero: '36', nombre: 'Culebra',   emoji: '🐍' },
  { numero: '37', nombre: 'Mariposa',  emoji: '🦋' },
  { numero: '38', nombre: 'Conejo',    emoji: '🐰' },
];

// Tipos de pestaña del módulo (como el exe Lybet)
export type TaqTab = 'animalitos' | 'pandaplus' | 'terminales' | 'triples' | 'cuatrocifras';

export const TAQ_TABS: { id: TaqTab; label: string }[] = [
  { id: 'animalitos',   label: 'Animalitos'   },
  { id: 'pandaplus',    label: 'Panda Plus'   },
  { id: 'terminales',   label: 'Terminales'   },
  { id: 'triples',      label: 'Triples'      },
  { id: 'cuatrocifras', label: 'Cuatro Cifras'},
];

export function getLotteriesByTab(tab: TaqTab): Loteria[] {
  return LOTERIAS.filter((l) => l.tipo === tab && l.activa);
}
