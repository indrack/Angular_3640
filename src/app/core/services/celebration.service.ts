import { Injectable, signal, inject } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { CelebrationConfig, CELEBRATION_PRESETS, DEFAULT_CELEBRATION_CONFIG, CelebrationPresetKey } from '../models/celebration.model';
import { AuditLogService } from './audit-log.service';

@Injectable({
  providedIn: 'root'
})
export class CelebrationService {
  private db: Database | null = null;
  private auditLogService = inject(AuditLogService);

  public config = signal<CelebrationConfig>(DEFAULT_CELEBRATION_CONFIG);
  public presets = CELEBRATION_PRESETS;
  public isLoading = signal<boolean>(false);

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);
    this.initRealtimeListener();
  }

  private initRealtimeListener(): void {
    if (!this.db) return;
    onValue(ref(this.db, 'celebrationConfig'), (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        this.config.set(val as CelebrationConfig);
      } else {
        this.config.set(DEFAULT_CELEBRATION_CONFIG);
      }
    });
  }

  public async fetchConfig(): Promise<CelebrationConfig> {
    if (!this.db) return DEFAULT_CELEBRATION_CONFIG;
    this.isLoading.set(true);
    try {
      const snapshot = await get(ref(this.db, 'celebrationConfig'));
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        this.config.set(val as CelebrationConfig);
        return val;
      }
    } catch (err) {
      console.warn('Error fetching celebration config:', err);
    } finally {
      this.isLoading.set(false);
    }
    return DEFAULT_CELEBRATION_CONFIG;
  }

  public async saveConfig(newConfig: CelebrationConfig, userEmail: string): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');
    this.isLoading.set(true);
    try {
      await set(ref(this.db, 'celebrationConfig'), newConfig);
      this.config.set(newConfig);

      const preset = this.presets.find(p => p.key === newConfig.presetKey);
      const actionText = newConfig.enabled ? `Activó celebración: ${preset?.name || newConfig.title}` : 'Desactivó celebraciones';
      await this.auditLogService.logAction(userEmail, actionText, `Intervalo: ${newConfig.intervalSeconds}s, Duración: ${newConfig.durationSeconds}s`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
