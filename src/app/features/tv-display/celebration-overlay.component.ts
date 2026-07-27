import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../core/config/firebase.config';
import { CelebrationConfig, CELEBRATION_PRESETS, DEFAULT_CELEBRATION_CONFIG, CelebrationPreset } from '../../core/models/celebration.model';

@Component({
  selector: 'app-celebration-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="config().enabled" 
         [class]="'celebration-wrapper position-' + config().position"
         [class.visible]="isVisible()">
      <!-- Particle Effect Background Layer -->
      <div class="particles-layer" [ngSwitch]="activePreset().particleType">
        <!-- Gold Sparks / Anniversary -->
        <ng-container *ngSwitchCase="'gold_sparks'">
          <div *ngFor="let p of particles" class="sparkle gold" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">✨</div>
        </ng-container>

        <!-- Hearts / Valentine -->
        <ng-container *ngSwitchCase="'hearts'">
          <div *ngFor="let p of particles" class="sparkle heart" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">❤️</div>
        </ng-container>

        <!-- Confetti / Carnival -->
        <ng-container *ngSwitchCase="'confetti'">
          <div *ngFor="let p of particles" class="sparkle confetti-item" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">🎉</div>
        </ng-container>

        <!-- Snow / Christmas -->
        <ng-container *ngSwitchCase="'snow'">
          <div *ngFor="let p of particles" class="sparkle snowflake" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">❄️</div>
        </ng-container>

        <!-- Stars / Father / Custom -->
        <ng-container *ngSwitchCase="'stars'">
          <!-- Si es personalizada y hay una imagen cargada, caen copias de la imagen. Si no, caen estrellas ⭐ -->
          <ng-container *ngIf="config().presetKey === 'custom' && config().customImageUrl; else regularStars">
            <div *ngFor="let p of particles" class="sparkle custom-particle" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">
              <img [src]="config().customImageUrl" alt="Particle">
            </div>
          </ng-container>
          <ng-template #regularStars>
            <div *ngFor="let p of particles" class="sparkle star" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">⭐</div>
          </ng-template>
        </ng-container>

        <!-- Roses / Mother -->
        <ng-container *ngSwitchCase="'roses'">
          <div *ngFor="let p of particles" class="sparkle rose" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">🌹</div>
        </ng-container>

        <!-- Purple Sparks / Women's Day -->
        <ng-container *ngSwitchCase="'purple_sparks'">
          <div *ngFor="let p of particles" class="sparkle purple" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">💜</div>
        </ng-container>

        <!-- Bronze / Men's Day -->
        <ng-container *ngSwitchCase="'bronze_shield'">
          <div *ngFor="let p of particles" class="sparkle bronze" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">⚡</div>
        </ng-container>

        <!-- Gold Light / Easter -->
        <ng-container *ngSwitchCase="'gold_light'">
          <div *ngFor="let p of particles" class="sparkle gold" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">🌟</div>
        </ng-container>

        <!-- Pumpkins / Halloween -->
        <ng-container *ngSwitchCase="'pumpkins'">
          <div *ngFor="let p of particles" class="sparkle pumpkin" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">🎃</div>
        </ng-container>

        <!-- Flames / CrossFit Open -->
        <ng-container *ngSwitchCase="'flames'">
          <div *ngFor="let p of particles" class="sparkle flame" [style.left.%]="p.left" [style.animationDelay.s]="p.delay">🔥</div>
        </ng-container>
      </div>

      <!-- Glassmorphic Banner Card -->
      <div [class]="'celebration-card animate-card position-' + config().position" [style.borderColor]="activePreset().badgeColor">
        <div class="icon-header">
          <!-- Si es personalizada, mostramos la imagen si existe. NUNCA mostramos el emoji de pintor 🎨 -->
          <ng-container *ngIf="config().presetKey === 'custom'">
            <img *ngIf="config().customImageUrl" [src]="config().customImageUrl" class="custom-icon-png" alt="Icono de Celebración">
          </ng-container>
          
          <!-- Si NO es personalizada, mostramos el emoji regular -->
          <ng-container *ngIf="config().presetKey !== 'custom'">
            <span class="preset-icon">{{ activePreset().icon }}</span>
          </ng-container>
        </div>

        <div class="card-body">
          <h2 [style.color]="activePreset().badgeColor">{{ config().title || activePreset().title }}</h2>
          <p *ngIf="config().subtitle || activePreset().subtitle">{{ config().subtitle || activePreset().subtitle }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .celebration-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2500;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.45s;
    }

    .celebration-wrapper.visible {
      opacity: 1;
      visibility: visible;
    }

    .particles-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .sparkle {
      position: absolute;
      font-size: 1.8em;
      opacity: 0;
      animation: floatDown 2.2s ease-in-out infinite;
    }

    @keyframes floatDown {
      0% {
        transform: translateY(-40px) rotate(0deg);
        opacity: 0;
      }
      15% {
        opacity: 0.95;
      }
      85% {
        opacity: 0.85;
      }
      100% {
        transform: translateY(100%) rotate(180deg);
        opacity: 0;
      }
    }

    .celebration-card {
      position: absolute;
      left: 50%;
      transform: translateX(-50%) scale(0.9);
      background: rgba(15, 15, 15, 0.92);
      border: 2px solid #ffd700;
      border-radius: 16px;
      padding: 12px 20px;
      text-align: center;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 215, 0, 0.3);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: fit-content;
      max-width: 85%;
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .celebration-wrapper.visible .celebration-card {
      transform: translateX(-50%) scale(1);
    }

    .position-top { top: 25px; }
    .position-center { top: 50%; transform: translate(-50%, -50%) scale(0.9); }
    .celebration-wrapper.visible .position-center { transform: translate(-50%, -50%) scale(1); }
    .position-bottom { bottom: 35px; }

    .animate-card {
      animation: popupBanner 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
    }

    .position-center.animate-card {
      animation: popupBannerCenter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
    }

    @keyframes popupBanner {
      0% { transform: translateX(-50%) scale(0.6); opacity: 0; }
      100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }

    @keyframes popupBannerCenter {
      0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .preset-icon {
      font-size: 2.8em;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));
    }

    .card-body h2 {
      font-size: 1.8em;
      font-weight: 900;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
    }

    .card-body p {
      font-size: 1.1em;
      color: #ddd;
      margin: 2px 0 0 0;
      font-weight: 500;
    }

    .custom-icon-png {
      height: 110px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
      margin-bottom: 0px;
    }

    .custom-particle img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.4));
    }

    @media (max-width: 768px), (orientation: portrait) {
      .celebration-wrapper {
        width: 95% !important;
      }
      .preset-icon { font-size: 2.2em !important; }
      .card-body h2 { font-size: 1.3em !important; }
      .card-body p { font-size: 0.95em !important; }
    }
  `]
})
export class CelebrationOverlayComponent implements OnInit, OnDestroy {
  public config = signal<CelebrationConfig>(DEFAULT_CELEBRATION_CONFIG);
  public isVisible = signal<boolean>(false);
  public activePreset = signal<CelebrationPreset>(CELEBRATION_PRESETS[0]);

  public particles = [
    { left: 3, delay: 0 },
    { left: 10, delay: 0.4 },
    { left: 17, delay: 0.15 },
    { left: 24, delay: 0.7 },
    { left: 31, delay: 0.2 },
    { left: 38, delay: 0.5 },
    { left: 45, delay: 0.3 },
    { left: 52, delay: 0.8 },
    { left: 59, delay: 0.1 },
    { left: 66, delay: 0.6 },
    { left: 73, delay: 0.35 },
    { left: 80, delay: 0.75 },
    { left: 87, delay: 0.05 },
    { left: 94, delay: 0.45 }
  ];

  private timerId: any = null;
  private hideTimerId: any = null;
  private db: Database | null = null;

  ngOnInit(): void {
    let app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);

    if (this.db) {
      onValue(ref(this.db, 'celebrationConfig'), (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          this.applyConfig(val as CelebrationConfig);
        } else {
          this.applyConfig(DEFAULT_CELEBRATION_CONFIG);
        }
      });
    } else {
      this.applyConfig(DEFAULT_CELEBRATION_CONFIG);
    }
  }

  private applyConfig(newConfig: CelebrationConfig): void {
    this.config.set(newConfig);

    const foundPreset = CELEBRATION_PRESETS.find(p => p.key === newConfig.presetKey) || CELEBRATION_PRESETS[0];
    this.activePreset.set(foundPreset);

    this.stopTimers();

    if (newConfig.enabled) {
      const intervalMs = Math.max((newConfig.intervalSeconds || 300) * 1000, 5000);
      this.triggerShow(newConfig.durationSeconds || 8);
      this.timerId = setInterval(() => {
        this.triggerShow(newConfig.durationSeconds || 8);
      }, intervalMs);
    } else {
      this.isVisible.set(false);
    }
  }

  private triggerShow(durationSec: number): void {
    if (this.hideTimerId) clearTimeout(this.hideTimerId);
    requestAnimationFrame(() => {
      this.isVisible.set(true);
    });
    this.hideTimerId = setTimeout(() => {
      this.isVisible.set(false);
    }, durationSec * 1000);
  }

  private stopTimers(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.hideTimerId) clearTimeout(this.hideTimerId);
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }
}
