import { DayWods, DayName } from '../models/wod.model';

export function parseWeeklyTxt(rawText: string): DayWods {
  const raw = rawText.trim();
  const daysMap: { [key: string]: DayName } = {
    'domingo': 'domingo',
    'lunes': 'lunes',
    'martes': 'martes',
    'miercoles': 'miercoles',
    'miércoles': 'miercoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'sabado': 'sabado',
    'sábado': 'sabado'
  };

  const daySeparatorRegex = /-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/g;
  const newWeeklyData: DayWods = {
    domingo: [],
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: []
  };

  if (daySeparatorRegex.test(raw)) {
    const parts = raw.split(/-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/);
    for (let i = 1; i < parts.length; i += 2) {
      const dayRaw = parts[i].trim().toLowerCase();
      const dayKey = daysMap[dayRaw];
      if (!dayKey) continue;

      const dayContent = parts[i + 1] ? parts[i + 1].trim() : '';
      if (!dayContent) continue;

      const lines = dayContent.split('\n');
      const headerRegex = /^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY|Strength|Skill|Finisher)(\s*\(.*?\))?$/i;

      let curTitle: string | null = null;
      let curLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (headerRegex.test(trimmed)) {
          if (curTitle !== null) {
            newWeeklyData[dayKey].push({ titulo: curTitle, contenido: curLines.join('\n').trim() });
            curLines = [];
          }
          curTitle = trimmed;
        } else {
          if (curTitle === null && trimmed) {
            curTitle = 'WOD';
          }
          if (curTitle !== null) {
            curLines.push(line);
          }
        }
      }

      if (curTitle !== null) {
        newWeeklyData[dayKey].push({ titulo: curTitle, contenido: curLines.join('\n').trim() });
      }
    }
    return newWeeklyData;
  } else {
    throw new Error('Formato no reconocido. Usa delimitadores como ------------------------Lunes---------------------------');
  }
}
