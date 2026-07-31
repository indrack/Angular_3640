import { Injectable, signal, inject } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { DayWods, DayName, WodItem } from '../models/wod.model';
import { WODS_DATA } from '../data/wods.data';
import { AuditLogService } from './audit-log.service';

import { parseWeeklyTxt } from '../utils/txt-parser.util';

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
    const newWeeklyData = parseWeeklyTxt(rawText);
    this.weeklyWodsData.set(newWeeklyData);
    return newWeeklyData;
  }

  public async saveWeeklyWodsToFirebase(data: DayWods, userEmail: string): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');
    this.isLoading.set(true);
    try {
      const previous = this.weeklyWodsData();

      const dayLabels: Record<string, string> = {
        lunes: 'Lunes',
        martes: 'Martes',
        miercoles: 'Miércoles',
        jueves: 'Jueves',
        viernes: 'Viernes',
        sabado: 'Sábado',
        domingo: 'Domingo'
      };

      const changedDays: string[] = [];
      const allDays: DayName[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

      allDays.forEach(day => {
        const prevBlocks = JSON.stringify(previous[day] || []);
        const newBlocks = JSON.stringify(data[day] || []);
        if (prevBlocks !== newBlocks) {
          changedDays.push(dayLabels[day] || day);
        }
      });

      await set(ref(this.db, 'weeklyWods'), data);
      this.weeklyWodsData.set(data);

      let detailsText = '';
      if (changedDays.length === 0) {
        detailsText = 'Rutina semanal guardada sin modificaciones';
      } else if (changedDays.length === 7) {
        detailsText = 'Actualización completa de toda la rutina semanal (7 días)';
      } else {
        detailsText = `Cambios en: ${changedDays.join(', ')} (${changedDays.length} ${changedDays.length === 1 ? 'día modificado' : 'días modificados'})`;
      }

      await this.auditLogService.logAction(userEmail, 'Publicación de Rutina Semanal', detailsText);
    } finally {
      this.isLoading.set(false);
    }
  }
}
