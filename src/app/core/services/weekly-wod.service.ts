import { Injectable, signal, inject } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { DayWods, DayName, WodItem } from '../models/wod.model';
import { WODS_DATA } from '../data/wods.data';
import { AuditLogService } from './audit-log.service';

@Injectable({
  providedIn: 'root'
})
export class WeeklyWodService {
  private db: Database | null = null;
  private auditLogService = inject(AuditLogService);

  public weeklyWodsData = signal<DayWods>(JSON.parse(JSON.stringify(WODS_DATA)));
  public isLoading = signal<boolean>(false);

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);
  }

  public async fetchWeeklyWods(): Promise<DayWods> {
    if (!this.db) return WODS_DATA;
    this.isLoading.set(true);
    try {
      const snapshot = await get(ref(this.db, 'weeklyWods'));
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        this.weeklyWodsData.set(val as DayWods);
        return val;
      }
    } catch (err) {
      console.warn('Error al cargar WODs semanales:', err);
    } finally {
      this.isLoading.set(false);
    }
    return WODS_DATA;
  }

  public parseWeeklyTxt(rawText: string): DayWods {
    const raw = rawText.trim();
    const daysMap: { [key: string]: DayName } = {
      'domingo': 'domingo', 'lunes': 'lunes', 'martes': 'martes',
      'miercoles': 'miercoles', 'miércoles': 'miercoles',
      'jueves': 'jueves', 'viernes': 'viernes', 'sabado': 'sabado', 'sábado': 'sabado'
    };

    const daySeparatorRegex = /-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/g;
    const newWeeklyData: DayWods = {
      domingo: [], lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: []
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
      this.weeklyWodsData.set(newWeeklyData);
      return newWeeklyData;
    } else {
      throw new Error('Formato no reconocido. Usa delimitadores como ------------------------Lunes---------------------------');
    }
  }

  public async saveWeeklyWodsToFirebase(data: DayWods, userEmail: string): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');
    this.isLoading.set(true);
    try {
      await set(ref(this.db, 'weeklyWods'), data);
      this.weeklyWodsData.set(data);

      let totalBlocks = 0;
      Object.keys(data).forEach(d => {
        totalBlocks += (data[d as DayName] || []).length;
      });

      await this.auditLogService.logAction(userEmail, 'Publicó la Rutina Semanal', `${totalBlocks} bloques actualizados para la semana`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
