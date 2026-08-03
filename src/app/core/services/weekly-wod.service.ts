import { Injectable, signal, inject } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { DayWods, DayName, WodItem } from '../models/wod.model';
import { WODS_DATA } from '../data/wods.data';
import { WGIRLS_DATA } from '../data/wgirls.data';
import { AuditLogService } from './audit-log.service';

import { parseWeeklyTxt } from '../utils/txt-parser.util';

@Injectable({
  providedIn: 'root'
})
export class WeeklyWodService {
  private db: Database | null = null;
  private auditLogService = inject(AuditLogService);

  public weeklyWodsData = signal<DayWods>(JSON.parse(JSON.stringify(WODS_DATA)));
  public weeklyWodsWGirlsData = signal<DayWods>(JSON.parse(JSON.stringify(WGIRLS_DATA)));
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

  public async fetchWeeklyWodsWGirls(): Promise<DayWods> {
    if (!this.db) return WGIRLS_DATA;
    this.isLoading.set(true);
    try {
      const snapshot = await get(ref(this.db, 'weeklyWodsWGirls'));
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        this.weeklyWodsWGirlsData.set(val as DayWods);
        return val;
      }
    } catch (err) {
      console.warn('Error al cargar WODs W-Girls:', err);
    } finally {
      this.isLoading.set(false);
    }
    return WGIRLS_DATA;
  }

  public parseWeeklyTxt(rawText: string, isWGirls: boolean = false): DayWods {
    const newWeeklyData = parseWeeklyTxt(rawText);
    if (isWGirls) {
      this.weeklyWodsWGirlsData.set(newWeeklyData);
    } else {
      this.weeklyWodsData.set(newWeeklyData);
    }
    return newWeeklyData;
  }

  public async saveWeeklyWodsToFirebase(data: DayWods, userEmail: string, isWGirls: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');
    this.isLoading.set(true);
    const dbNode = isWGirls ? 'weeklyWodsWGirls' : 'weeklyWods';
    const previous = isWGirls ? this.weeklyWodsWGirlsData() : this.weeklyWodsData();

    try {
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

      await set(ref(this.db, dbNode), data);
      if (isWGirls) {
        this.weeklyWodsWGirlsData.set(data);
      } else {
        this.weeklyWodsData.set(data);
      }

      const routineLabel = isWGirls ? 'Rutina W-Girls' : 'Rutina Semanal General';
      let detailsText = '';
      if (changedDays.length === 0) {
        detailsText = `${routineLabel} guardada sin modificaciones`;
      } else if (changedDays.length === 7) {
        detailsText = `Actualización completa de la ${routineLabel.toLowerCase()} (7 días)`;
      } else {
        detailsText = `${routineLabel}: Cambios en ${changedDays.join(', ')} (${changedDays.length} ${changedDays.length === 1 ? 'día modificado' : 'días modificados'})`;
      }

      await this.auditLogService.logAction(userEmail, `Publicación de ${routineLabel}`, detailsText);
    } finally {
      this.isLoading.set(false);
    }
  }
}
