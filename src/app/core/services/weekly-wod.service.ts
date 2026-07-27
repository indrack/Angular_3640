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
