import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, get, query, orderByKey, limitToLast, remove, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../config/firebase.config';

export interface AuditLogEntry {
  id?: string;
  timestamp: number;
  formattedDate: string;
  email: string;
  action: string;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private db: Database | null = null;
  public logs = signal<AuditLogEntry[]>([]);
  public isLoading = signal<boolean>(false);

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);
  }

  public async logAction(email: string, action: string, details?: string): Promise<void> {
    if (!this.db) return;
    const now = new Date();
    const entry: AuditLogEntry = {
      timestamp: now.getTime(),
      formattedDate: `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      email: email || 'Anónimo',
      action,
      details: details || ''
    };

    try {
      await push(ref(this.db, 'activityLogs'), entry);
    } catch (err) {
      console.warn('Error al guardar registro de auditoría:', err);
    }
  }

  public async fetchRecentLogs(limit: number = 50): Promise<void> {
    if (!this.db) return;
    this.isLoading.set(true);
    try {
      const logsRef = query(ref(this.db, 'activityLogs'), orderByKey(), limitToLast(limit));
      const snapshot = await get(logsRef);
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const keysToDelete: string[] = [];

        const list: AuditLogEntry[] = Object.keys(val).map(key => {
          const item = val[key];
          if (item && item.timestamp && item.timestamp < ninetyDaysAgo) {
            keysToDelete.push(key);
          }
          return { id: key, ...item };
        }).filter(item => !item.timestamp || item.timestamp >= ninetyDaysAgo)
          .sort((a, b) => b.timestamp - a.timestamp);

        this.logs.set(list);

        // Auto-purge old logs from Firebase silently
        if (keysToDelete.length > 0) {
          for (const key of keysToDelete) {
            remove(ref(this.db, `activityLogs/${key}`)).catch(() => {});
          }
        }
      } else {
        this.logs.set([]);
      }
    } catch (err) {
      console.warn('Error al obtener registros de auditoría:', err);
      this.logs.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
