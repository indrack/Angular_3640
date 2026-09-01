import { describe, it, expect } from 'vitest';
import { parseWeeklyTxt, cleanWodTitle, formatWodContent } from './txt-parser.util';

describe('txt-parser.util', () => {
  it('should clean redundant (Tiempo) from titles while keeping others', () => {
    expect(cleanWodTitle('Custom Metcon (Tiempo)')).toBe('Custom Metcon');
    expect(cleanWodTitle('Finisher (Tiempo)')).toBe('Finisher');
    expect(cleanWodTitle('Custom Metcon (Peso)')).toBe('Custom Metcon (Peso)');
    expect(cleanWodTitle('Weightlifting (Bench Press)')).toBe('Weightlifting (Bench Press)');
  });

  it('should auto-format content with asterisks and deduplicate For time', () => {
    const rawContent = `For time:
FOR TIME
800m Run
5 rounds of:
25 Pull-ups
Time cap: 20 mins`;

    const formatted = formatWodContent(rawContent);
    expect(formatted).toContain('*For time:*');
    expect(formatted).not.toContain('For time:\nFOR TIME');
    expect(formatted).toContain('*5 rounds of:*');
    expect(formatted).toContain('*Time cap: 20 mins*');
  });

  it('should parse standard weekly txt format and auto-format blocks', () => {
    const raw = `------------------------Lunes---------------------------
Warmup
3 Sets
1:00 Cardio Choice

Gymnastics (Ring Dip)
Ring Dips practice

Custom Metcon (Tiempo)
For time:
21-15-9
Thrusters 60/42.5 kg
Pull-ups
Time cap: 15 mins

------------------------Martes---------------------------
Strength (Deadlift)
5x5 Deadlift 120/80 kg`;

    const result = parseWeeklyTxt(raw);
    expect(result.lunes.length).toBe(3);
    expect(result.lunes[0].titulo).toBe('Warmup');
    expect(result.lunes[0].contenido).toContain('*3 Sets*');
    expect(result.lunes[1].titulo).toBe('Gymnastics (Ring Dip)');
    expect(result.lunes[2].titulo).toBe('Custom Metcon');
    expect(result.lunes[2].contenido).toContain('*For time:*');
    expect(result.lunes[2].contenido).toContain('*Time cap: 15 mins*');
    expect(result.martes.length).toBe(1);
    expect(result.martes[0].titulo).toBe('Strength (Deadlift)');
  });

  it('should throw error when day separators are missing', () => {
    expect(() => parseWeeklyTxt('Just some random text')).toThrow();
  });
});
