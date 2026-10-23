import { describe, it, expect } from 'vitest';
import { isClassStartTime, CLASS_START_TIMES } from './class-schedule.config';

describe('class-schedule.config', () => {
  it('should identify weekdays class start times accurately (including 12:50)', () => {
    // Weekdays (1: Lunes to 5: Viernes)
    for (let day = 1; day <= 5; day++) {
      expect(isClassStartTime(day, '06:00')).toBe(true);
      expect(isClassStartTime(day, '07:00')).toBe(true);
      expect(isClassStartTime(day, '08:00')).toBe(true);
      expect(isClassStartTime(day, '09:00')).toBe(true);
      expect(isClassStartTime(day, '10:00')).toBe(true);
      expect(isClassStartTime(day, '12:50')).toBe(true);
      expect(isClassStartTime(day, '16:00')).toBe(true);
      expect(isClassStartTime(day, '17:00')).toBe(true);
      expect(isClassStartTime(day, '18:00')).toBe(true);
      expect(isClassStartTime(day, '19:00')).toBe(true);
      expect(isClassStartTime(day, '20:00')).toBe(true);

      // Non-class hours should be false
      expect(isClassStartTime(day, '11:00')).toBe(false);
      expect(isClassStartTime(day, '12:00')).toBe(false);
      expect(isClassStartTime(day, '13:00')).toBe(false);
      expect(isClassStartTime(day, '14:00')).toBe(false);
      expect(isClassStartTime(day, '15:00')).toBe(false);
      expect(isClassStartTime(day, '21:00')).toBe(false);
    }
  });

  it('should identify weekend class start times accurately (Sábado y Domingo)', () => {
    // Sábado (6) y Domingo (0)
    for (const day of [0, 6]) {
      expect(isClassStartTime(day, '09:00')).toBe(true);
      expect(isClassStartTime(day, '10:00')).toBe(true);

      // Non-weekend class hours
      expect(isClassStartTime(day, '06:00')).toBe(false);
      expect(isClassStartTime(day, '07:00')).toBe(false);
      expect(isClassStartTime(day, '08:00')).toBe(false);
      expect(isClassStartTime(day, '12:50')).toBe(false);
      expect(isClassStartTime(day, '16:00')).toBe(false);
      expect(isClassStartTime(day, '18:00')).toBe(false);
      expect(isClassStartTime(day, '19:00')).toBe(false);
      expect(isClassStartTime(day, '20:00')).toBe(false);
    }
  });
});
