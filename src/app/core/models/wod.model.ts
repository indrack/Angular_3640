export interface WodItem {
  titulo: string;
  contenido: string;
}

export type DayName = 'domingo' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export interface DayWods {
  [key: string]: WodItem[];
}

export type ActiveMode = 'miraflores' | 'calacoto' | 'wgirls' | null;
