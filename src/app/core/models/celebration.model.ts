export type CelebrationPresetKey =
  | 'anniversary'
  | 'valentine'
  | 'carnival'
  | 'christmas'
  | 'fathers_day'
  | 'mothers_day'
  | 'womens_day'
  | 'mens_day'
  | 'easter'
  | 'halloween'
  | 'crossfit_open'
  | 'custom';

export interface CelebrationConfig {
  enabled: boolean;
  presetKey: CelebrationPresetKey;
  title: string;
  subtitle?: string;
  customImageUrl?: string;
  intervalSeconds: number; // e.g. 300 = every 5 minutes
  durationSeconds: number; // e.g. 8 = 8 seconds on screen
  position: 'top' | 'center' | 'bottom';
}

export interface CelebrationPreset {
  key: CelebrationPresetKey;
  name: string;
  icon: string;
  title: string;
  subtitle: string;
  particleType: 'gold_sparks' | 'hearts' | 'confetti' | 'snow' | 'stars' | 'roses' | 'purple_sparks' | 'bronze_shield' | 'gold_light' | 'pumpkins' | 'flames' | 'none';
  badgeColor: string;
}

export const CELEBRATION_PRESETS: CelebrationPreset[] = [
  {
    key: 'anniversary',
    name: 'Aniversario CrossFit 3640',
    icon: '🎂',
    title: '10º ANIVERSARIO CROSSFIT 3640',
    subtitle: '10 Años Forjando Comunidad y Leyendas',
    particleType: 'gold_sparks',
    badgeColor: '#ffd700'
  },
  {
    key: 'valentine',
    name: 'Amor y Amistad / San Valentín',
    icon: '❤️',
    title: '¡FELIZ DÍA DEL AMOR Y LA AMISTAD!',
    subtitle: 'Comunidad, Pasión y Familia 3640',
    particleType: 'hearts',
    badgeColor: '#ff2a6d'
  },
  {
    key: 'carnival',
    name: 'Carnavales',
    icon: '🎭',
    title: '¡FELICES CARNAVALES!',
    subtitle: 'Energía, Alegría y Entrenamiento al Máximo',
    particleType: 'confetti',
    badgeColor: '#ff00ff'
  },
  {
    key: 'christmas',
    name: 'Navidad y Año Nuevo',
    icon: '🎄',
    title: '¡FELICES FIESTAS Y PRÓSPERO AÑO NUEVO!',
    subtitle: 'Que tus Metcons se llenen de Fuerza y Paz',
    particleType: 'snow',
    badgeColor: '#00ff66'
  },
  {
    key: 'fathers_day',
    name: 'Día del Padre',
    icon: '👨',
    title: '¡FELIZ DÍA DEL PADRE!',
    subtitle: 'A los Papás Fuertes que Inspiran cada Día',
    particleType: 'stars',
    badgeColor: '#00a8ff'
  },
  {
    key: 'mothers_day',
    name: 'Día de la Madre',
    icon: '👩',
    title: '¡FELIZ DÍA DE LA MADRE!',
    subtitle: 'Guerreras Inquebrantables del Box 3640',
    particleType: 'roses',
    badgeColor: '#ff007f'
  },
  {
    key: 'womens_day',
    name: 'Día de la Mujer',
    icon: '💜',
    title: '¡FELIZ DÍA DE LA MUJER!',
    subtitle: 'Fuerza, Valentía y Liderazgo sin Límites',
    particleType: 'purple_sparks',
    badgeColor: '#9b51e0'
  },
  {
    key: 'mens_day',
    name: 'Día del Hombre',
    icon: '🦸',
    title: '¡FELIZ DÍA DEL HOMBRE!',
    subtitle: 'Disciplina, Esfuerzo y Compañerismo en el WOD',
    particleType: 'bronze_shield',
    badgeColor: '#cd7f32'
  },
  {
    key: 'easter',
    name: 'Semana Santa',
    icon: '✝️',
    title: 'SEMANA SANTA EN 3640',
    subtitle: 'Reflexión, Unión y Renovación de Fuerza',
    particleType: 'gold_light',
    badgeColor: '#ffcc00'
  },
  {
    key: 'halloween',
    name: 'Halloween / Spooky WOD',
    icon: '🎃',
    title: '¡SPOOKY HALLOWEEN WOD!',
    subtitle: 'Sobrevive al entrenamiento de terror',
    particleType: 'pumpkins',
    badgeColor: '#ff6600'
  },
  {
    key: 'crossfit_open',
    name: 'CrossFit Open / Competencia',
    icon: '🏆',
    title: '¡CROSSFIT GAMES OPEN / COMPETENCIA!',
    subtitle: 'Da todo en cada repetición por tu Box',
    particleType: 'flames',
    badgeColor: '#ff3300'
  },
  {
    key: 'custom',
    name: 'Personalizado (Subir PNG)',
    icon: '🎨',
    title: 'CELEBRACIÓN ESPECIAL',
    subtitle: 'CrossFit 3640',
    particleType: 'stars',
    badgeColor: '#00e5ff'
  }
];

export const DEFAULT_CELEBRATION_CONFIG: CelebrationConfig = {
  enabled: false,
  presetKey: 'anniversary',
  title: '10º ANIVERSARIO CROSSFIT 3640',
  subtitle: '10 Años Forjando Comunidad y Leyendas',
  intervalSeconds: 300, // 5 minutes
  durationSeconds: 8,   // 8 seconds
  position: 'top'
};
