import { DayWods, DayName } from '../models/wod.model';

export function cleanWodTitle(title: string): string {
  if (!title) return '';
  // Remover "(Tiempo)" o "(tiempo)", pero mantener "(Peso)" u otros especificadores
  return title.replace(/\s*\([Tt]iempo\)/g, '').trim();
}

export function formatWodContent(content: string): string {
  if (!content) return '';

  const rawLines = content.split('\n');
  const cleanedLines: string[] = [];

  // 1. Deduplicación de 'For time' consecutivos
  for (const line of rawLines) {
    const trimmed = line.trim();
    const isForTime = /^\*?\s*for time:?\s*\*?$/i.test(trimmed);
    if (isForTime && cleanedLines.length > 0) {
      const prevTrimmed = cleanedLines[cleanedLines.length - 1].trim();
      if (/^\*?\s*for time:?\s*\*?$/i.test(prevTrimmed)) {
        continue;
      }
    }
    cleanedLines.push(line);
  }

  // Regex para líneas completas que deben ir en *...*
  const fullLinePatterns = [
    // Sets y Rounds
    /^\d+\s*(?:SETS?|ROUNDS?|Rounds?|Sets?)(?:\s*(?:of|for quality of|for time of|each))?:?$/i,
    /^\d+\s*ROUND\s*EACH$/i,
    /^EMOM\s*x?\s*[\d:]+.*$/i,
    /^AMRAP\s*[\d:]+.*$/i,
    // Tiempos, Clocks y Caps
    /^(?:For time:?|FOR TIME:?)$/i,
    /^Time cap:?\s*[\d:]+\s*(?:mins?|min|m|horas?|hrs?)?\.?$/i,
    /^ON A\s+[\d:]+\s+CLOCK.*$/i,
    /^Every\s+[\d:]+\s+(?:mins?\s+)?for\s+[\d:]+\s+mins?\.?$/i,
    /^Rest\s+\d+\s*(?:mins?|min|seg|s)\.?$/i,
    /^Into\.{2,3}:?$/i,
    // Equipos y directivas
    /^(?:IN\s+)?TEAMS?\s+OF\s+\d+.*$/i,
    /^Complete in teams of \d+\.?$/i,
    /^Complete as-?$/i,
    // Instrucciones de coaches
    /^Athletes have\s+[\d:]+\s+at each station.*$/i,
    /^All\s+\d+\s+reps unbroken.*$/i
  ];

  // Patrón para prefijos como Minute 1:, Partner 1:
  const minutePartnerRegex = /^(\s*(?:Minute|Minuto|Partner|P)\s+\d+:?)(.*)$/i;

  const formattedLines: string[] = [];

  for (const line of cleanedLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formattedLines.push(line);
      continue;
    }

    // Si ya está envuelta en asteriscos completa, no duplicar
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
      formattedLines.push(line);
      continue;
    }

    // Verificar prefijo Minute / Partner
    const mpMatch = minutePartnerRegex.exec(line);
    if (mpMatch) {
      const prefix = mpMatch[1];
      const rest = mpMatch[2];
      if (!prefix.trim().startsWith('*')) {
        formattedLines.push(`*${prefix.trim()}*${rest}`);
        continue;
      }
    }

    // Verificar coincidencia con línea completa
    const matchesFullLine = fullLinePatterns.some(pattern => pattern.test(trimmed));
    if (matchesFullLine) {
      const leadingSpaces = line.length - line.trimStart().length;
      formattedLines.push(`${' '.repeat(leadingSpaces)}*${trimmed}*`);
    } else {
      formattedLines.push(line);
    }
  }

  return formattedLines.join('\n');
}

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
            newWeeklyData[dayKey].push({
              titulo: cleanWodTitle(curTitle),
              contenido: formatWodContent(curLines.join('\n').trim())
            });
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
        newWeeklyData[dayKey].push({
          titulo: cleanWodTitle(curTitle),
          contenido: formatWodContent(curLines.join('\n').trim())
        });
      }
    }
    return newWeeklyData;
  } else {
    throw new Error('Formato no reconocido. Usa delimitadores como ------------------------Lunes---------------------------');
  }
}
