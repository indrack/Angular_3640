import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { CELEBRATION_PRESETS } from '../../../../core/models/celebration.model';

@Component({
  selector: 'app-admin-tv-simulator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simulator-modal-overlay">
      <div class="simulator-window">
        <div class="simulator-header">
          <span>📺 SIMULADOR DE PANTALLA TV EN VIVO (VISTA PREVIA)</span>
          <button class="btn-close-sim" (click)="close.emit()">✕ Cerrar</button>
        </div>

        <div class="simulator-frame">
          <div class="simulated-tv-screen">
            <div class="sim-header">
              <span class="sim-date">Jueves, 24 de Julio</span>
              <span class="sim-time" style="color:#39ff14;">10:45 AM</span>
              <span class="sim-badge">SEDE MIRAFLORES - 1 / 3</span>
            </div>

            <div class="sim-body">
              <h3 style="color:#ff0000; font-size:2em; margin-bottom:10px;">METCON (TIEMPO)</h3>
              <p style="font-size:1.3em; line-height:1.4;">
                <strong>AMRAP 12'</strong><br>
                15 Wall Balls<br>
                12 Kettlebell Swings (<span style="color:#39ff14; font-weight:bold;">24/16 kg</span>)<br>
                9 Burpees Over Box
              </p>
            </div>

            <!-- Simulación de Banner de Celebración si está activo -->
            <div *ngIf="celebrationService.config().enabled" class="sim-celebration-banner">
              <ng-container *ngIf="celebrationService.config().presetKey === 'custom'">
                <img *ngIf="celebrationService.config().customImageUrl" [src]="celebrationService.config().customImageUrl" class="sim-custom-icon" alt="Icon">
              </ng-container>
              <ng-container *ngIf="celebrationService.config().presetKey !== 'custom'">
                <span style="font-size:1.6em;">{{ getCelebrationIcon() }}</span>
              </ng-container>
              <div>
                <strong style="color:#ffd700; display:block;">{{ celebrationService.config().title }}</strong>
                <span style="color:#ddd; font-size:0.85em;">{{ celebrationService.config().subtitle }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminTvSimulatorComponent {
  public celebrationService = inject(CelebrationService);

  @Output() close = new EventEmitter<void>();

  public getCelebrationIcon(): string {
    const key = this.celebrationService.config().presetKey;
    const preset = CELEBRATION_PRESETS.find(p => p.key === key);
    return preset ? preset.icon : '🎉';
  }
}
