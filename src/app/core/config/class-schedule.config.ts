/**
 * Horarios de inicio de clases para CrossFit 3640 (Calacoto & Miraflores).
 * Formato HH:mm (24 horas).
 *
 * En cada uno de estos horarios, la pantalla del WOD diario volverá automáticamente
 * al primer slide (Warm-up / Slide 1), sin afectar si la TV está en modo especial
 * (por ejemplo TV Miraflores o TV Calacoto abiertas con teclas 7 u 8).
 */

export interface ClassScheduleConfig {
  [dayOfWeek: number]: string[];
}

// 0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado
export const CLASS_START_TIMES: ClassScheduleConfig = {
  // Domingo: 09:00, 10:00
  0: ['09:00', '10:00'],

  // Lunes: 06:00, 07:00, 08:00, 09:00, 10:00, 12:50, 16:00, 17:00, 18:00, 19:00, 20:00
  1: ['06:00', '07:00', '08:00', '09:00', '10:00', '12:50', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Martes: 06:00, 07:00, 08:00, 09:00, 10:00, 12:50, 16:00, 17:00, 18:00, 19:00, 20:00
  2: ['06:00', '07:00', '08:00', '09:00', '10:00', '12:50', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Miércoles: 06:00, 07:00, 08:00, 09:00, 10:00, 12:50, 16:00, 17:00, 18:00, 19:00, 20:00
  3: ['06:00', '07:00', '08:00', '09:00', '10:00', '12:50', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Jueves: 06:00, 07:00, 08:00, 09:00, 10:00, 12:50, 16:00, 17:00, 18:00, 19:00, 20:00
  4: ['06:00', '07:00', '08:00', '09:00', '10:00', '12:50', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Viernes: 06:00, 07:00, 08:00, 09:00, 10:00, 12:50, 16:00, 17:00, 18:00, 19:00, 20:00
  5: ['06:00', '07:00', '08:00', '09:00', '10:00', '12:50', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Sábado: 09:00, 10:00
  6: ['09:00', '10:00'],
};

/**
 * Determina si una hora específica (HH:mm) corresponde al inicio de una clase
 * para el día de la semana indicado.
 */
export function isClassStartTime(dayOfWeek: number, timeHHMM: string): boolean {
  const times = CLASS_START_TIMES[dayOfWeek];
  if (!times) return false;
  return times.includes(timeHHMM);
}
