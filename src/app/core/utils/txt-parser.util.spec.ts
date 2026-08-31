import { describe, it, expect } from 'vitest';
import { parseWeeklyTxt } from './txt-parser.util';

describe('txt-parser.util', () => {
  it('should parse standard weekly txt format correctly', () => {
    const raw = `------------------------Lunes---------------------------
Warmup
3 Sets
1:00 Cardio Choice

Gymnastics (Ring Dip)
Ring Dips practice

Custom Metcon (Tiempo)
21-15-9
Thrusters 60/42.5 kg
Pull-ups

------------------------Martes---------------------------
Strength (Deadlift)
5x5 Deadlift 120/80 kg`;

    const result = parseWeeklyTxt(raw);
    expect(result.lunes.length).toBe(3);
    expect(result.lunes[0].titulo).toBe('Warmup');
    expect(result.lunes[0].contenido).toContain('3 Sets');
    expect(result.lunes[1].titulo).toBe('Gymnastics (Ring Dip)');
    expect(result.lunes[2].titulo).toBe('Custom Metcon (Tiempo)');
    expect(result.martes.length).toBe(1);
    expect(result.martes[0].titulo).toBe('Strength (Deadlift)');
  });

  it('should throw error when day separators are missing', () => {
    expect(() => parseWeeklyTxt('Just some random text')).toThrow();
  });
});
