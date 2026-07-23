import { Injectable, signal, computed, inject } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, Database } from 'firebase/database';
import { WodItem, ActiveMode, DayName } from '../models/wod.model';
import { WODS_DATA } from '../data/wods.data';
import { WGIRLS_DATA } from '../data/wgirls.data';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { ClockService } from './clock.service';

const DAY_NAMES: DayName[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

@Injectable({
  providedIn: 'root'
})
export class WodService {
  private clockService = inject(ClockService);

  public activeMode = signal<ActiveMode>(null);
  public currentSlideIndex = signal<number>(0);
  public isFullViewMode = signal<boolean>(false);

  public firebaseMiraflores = signal<WodItem[]>([]);
  public firebaseCalacoto = signal<WodItem[]>([]);
  public firebaseWeeklyWods = signal<DayWods | null>(null);

  private db: Database | null = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase(): void {
    try {
      let app: FirebaseApp;
      if (!getApps().length) {
        app = initializeApp(FIREBASE_CONFIG);
      } else {
        app = getApps()[0];
      }
      this.db = getDatabase(app);

      onValue(ref(this.db, 'customWodMiraflores'), (snapshot) => {
        const val = snapshot.val();
        this.firebaseMiraflores.set(Array.isArray(val) ? val : []);
      });

      onValue(ref(this.db, 'customWodCalacoto'), (snapshot) => {
        const val = snapshot.val();
        this.firebaseCalacoto.set(Array.isArray(val) ? val : []);
      });

      onValue(ref(this.db, 'weeklyWods'), (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          this.firebaseWeeklyWods.set(val);
        }
      });
    } catch (e) {
      console.warn('Firebase connection unavailable or using offline mode');
    }
  }

  public currentDayName = computed<DayName>(() => {
    const idx = this.clockService.currentDayIndex();
    return DAY_NAMES[idx] || 'lunes';
  });

  public currentWodParts = computed<WodItem[]>(() => {
    const mode = this.activeMode();
    const day = this.currentDayName();

    if (mode === 'miraflores') {
      const mira = this.firebaseMiraflores();
      return mira.length > 0 ? mira : [{ titulo: 'MIRAFLORES', contenido: 'Esperando WOD...' }];
    }

    if (mode === 'calacoto') {
      const cala = this.firebaseCalacoto();
      return cala.length > 0 ? cala : [{ titulo: 'CALACOTO', contenido: 'Esperando WOD...' }];
    }

    if (mode === 'wgirls') {
      const girlsData = WGIRLS_DATA[day];
      return (girlsData && girlsData.length > 0)
        ? girlsData
        : [{ titulo: 'WGIRLS DESCANSO', contenido: 'Box Cerrado / Open Box' }];
    }

    // Default normal WOD
    const firebaseWeekly = this.firebaseWeeklyWods();
    const normalData = (firebaseWeekly && firebaseWeekly[day]) ? firebaseWeekly[day] : WODS_DATA[day];
    return (normalData && normalData.length > 0)
      ? normalData
      : [{ titulo: 'DESCANSO', contenido: 'Box Cerrado / Open Box' }];
  });

  public currentSlide = computed<WodItem>(() => {
    const parts = this.currentWodParts();
    let idx = this.currentSlideIndex();
    if (idx < 0 || idx >= parts.length) {
      idx = 0;
    }
    return parts[idx] || { titulo: 'DESCANSO', contenido: 'Box Cerrado / Open Box' };
  });

  public indicatorText = computed<string>(() => {
    const mode = this.activeMode();
    const parts = this.currentWodParts();
    const idx = this.currentSlideIndex();

    let modeLabel = '';
    if (mode === 'miraflores') modeLabel = 'MIRAFLORES ';
    if (mode === 'calacoto') modeLabel = 'CALACOTO ';
    if (mode === 'wgirls') modeLabel = 'WGIRLS ';

    return `${modeLabel}${idx + 1} / ${parts.length}`;
  });

  public hasPrev = computed<boolean>(() => this.currentSlideIndex() > 0);
  public hasNext = computed<boolean>(() => this.currentSlideIndex() < this.currentWodParts().length - 1);

  public toggleMode(targetMode: Exclude<ActiveMode, null>): void {
    if (this.activeMode() === targetMode) {
      this.activeMode.set(null);
    } else {
      this.activeMode.set(targetMode);
    }
    this.currentSlideIndex.set(0);
  }

  public nextSlide(): void {
    const parts = this.currentWodParts();
    if (this.currentSlideIndex() < parts.length - 1) {
      this.currentSlideIndex.update(i => i + 1);
    }
  }

  public prevSlide(): void {
    if (this.currentSlideIndex() > 0) {
      this.currentSlideIndex.update(i => i - 1);
    }
  }

  public goToSlide(index: number): void {
    const parts = this.currentWodParts();
    if (index >= 0 && index < parts.length) {
      this.currentSlideIndex.set(index);
    }
  }

  public toggleFullView(): void {
    this.isFullViewMode.update(val => !val);
  }

  public formatMarkdownText(text: string): string {
    if (!text) return '';
    return text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  }
}
