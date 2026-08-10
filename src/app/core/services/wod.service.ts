import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, Database } from 'firebase/database';
import { WodItem, ActiveMode, DayName, DayWods } from '../models/wod.model';
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
  public firebaseWeeklyWodsWGirls = signal<DayWods | null>(null);
  public cachedDailyWod = signal<WodItem[] | null>(null);
  public isConnected = signal<boolean>(true);

  private db: Database | null = null;

  constructor() {
    this.loadDailyWodFromCache();
    this.initFirebase();

    // Auto-respaldo transparente en localStorage cuando cambia el WOD del día
    effect(() => {
      const parts = this.currentWodParts();
      const connected = this.isConnected();
      if (parts && parts.length > 0 && connected) {
        this.saveDailyWodToCache(parts);
      }
    });
  }

  private loadDailyWodFromCache(): void {
    try {
      const cachedStr = localStorage.getItem('cached_daily_wod');
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedDailyWod.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Error al leer caché del WOD diario:', e);
    }
  }

  private saveDailyWodToCache(parts: WodItem[]): void {
    try {
      // Ignorar pantallas de carga/espera para no sobrescribir el respaldo con mensajes vacíos
      if (parts.length === 1 && (parts[0].contenido?.includes('Esperando WOD') || parts[0].titulo?.includes('DESCANSO'))) {
        return;
      }
      localStorage.setItem('cached_daily_wod', JSON.stringify(parts));
      this.cachedDailyWod.set(parts);
    } catch (e) {
      console.warn('Error al guardar caché del WOD diario:', e);
    }
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

      onValue(ref(this.db, '.info/connected'), (snapshot) => {
        this.isConnected.set(snapshot.val() === true);
      });

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

      onValue(ref(this.db, 'weeklyWodsWGirls'), (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          this.firebaseWeeklyWodsWGirls.set(val);
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
    const cached = this.cachedDailyWod();

    if (mode === 'miraflores') {
      const mira = this.firebaseMiraflores();
      if (mira.length > 0) return mira;
      if (cached && cached.length > 0) return cached;
      return [{ titulo: 'MIRAFLORES', contenido: 'Esperando WOD...' }];
    }

    if (mode === 'calacoto') {
      const cala = this.firebaseCalacoto();
      if (cala.length > 0) return cala;
      if (cached && cached.length > 0) return cached;
      return [{ titulo: 'CALACOTO', contenido: 'Esperando WOD...' }];
    }

    if (mode === 'wgirls') {
      const firebaseGirls = this.firebaseWeeklyWodsWGirls();
      const girlsData = (firebaseGirls && firebaseGirls[day] && firebaseGirls[day].length > 0)
        ? firebaseGirls[day]
        : WGIRLS_DATA[day];
      return (girlsData && girlsData.length > 0)
        ? girlsData
        : [{ titulo: 'WGIRLS DESCANSO', contenido: 'Box Cerrado / Open Box' }];
    }

    // Default normal WOD
    const firebaseWeekly = this.firebaseWeeklyWods();
    if (firebaseWeekly && firebaseWeekly[day] && firebaseWeekly[day].length > 0) {
      return firebaseWeekly[day];
    }
    // Si no hay datos de Firebase en tiempo real pero tenemos caché guardado en la TV
    if (cached && cached.length > 0) {
      return cached;
    }
    // Respaldo de fábrica estático
    const normalData = WODS_DATA[day];
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

  public isAnimatingSlide = signal<boolean>(false);

  private triggerSlideAnimation(action: () => void): void {
    this.isAnimatingSlide.set(true);
    setTimeout(() => {
      action();
      setTimeout(() => {
        this.isAnimatingSlide.set(false);
      }, 50);
    }, 150);
  }

  public toggleMode(targetMode: Exclude<ActiveMode, null>): void {
    this.triggerSlideAnimation(() => {
      if (this.activeMode() === targetMode) {
        this.activeMode.set(null);
      } else {
        this.activeMode.set(targetMode);
      }
      this.currentSlideIndex.set(0);
    });
  }

  public nextSlide(): void {
    const parts = this.currentWodParts();
    if (this.currentSlideIndex() < parts.length - 1) {
      this.triggerSlideAnimation(() => this.currentSlideIndex.update(i => i + 1));
    }
  }

  public prevSlide(): void {
    if (this.currentSlideIndex() > 0) {
      this.triggerSlideAnimation(() => this.currentSlideIndex.update(i => i - 1));
    }
  }

  public goToSlide(index: number): void {
    const parts = this.currentWodParts();
    if (index >= 0 && index < parts.length && index !== this.currentSlideIndex()) {
      this.triggerSlideAnimation(() => this.currentSlideIndex.set(index));
    }
  }

  public toggleFullView(): void {
    this.isFullViewMode.update(val => !val);
  }

  public formatMarkdownText(text: string): string {
    if (!text) return '';
    let formatted = text;

    // 1. Bold: *text* -> <strong>text</strong>
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // 2. Underline: _text_ -> <u>text</u>
    formatted = formatted.replace(/_(.*?)_/g, '<u>$1</u>');

    // 3. Highlight weights/loads: (e.g. 60/42.5, 92.5/60, 20/14 lbs, 32/24)
    formatted = formatted.replace(/(\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?(?:\s*(?:lbs|kg|in))?\b)/gi, '<span class="highlight-weight">$1</span>');

    // 4. Highlight sets/rounds/schemes/teams: (e.g. 21-15-9, 3 SETS, 2 SETS, 2 ROUNDS, AMRAP 12', AMRAP, Teams of 2, Equipos de 2)
    formatted = formatted.replace(/(\b\d+-\d+-\d+\b|\b\d+\s+(?:SETS|ROUNDS|RFT|AMRAP)\b|\bAMRAP\b|\b(?:(?:IN\s+)?TEAMS?\s+OF|EQUIPOS?\s+DE)\s+\d+\b)/gi, '<span class="highlight-rounds">$1</span>');

    return formatted;
  }
}
