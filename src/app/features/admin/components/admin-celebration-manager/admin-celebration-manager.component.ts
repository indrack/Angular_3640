import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CelebrationConfig, CELEBRATION_PRESETS, DEFAULT_CELEBRATION_CONFIG, CelebrationPresetKey } from '../../../../core/models/celebration.model';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-celebration-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container editor-container">
      <h2 style="color:#ffd700; margin-bottom:10px;">🎉 GESTOR DE CELEBRACIONES Y OVERLAYS</h2>
      <p style="color:#aaa; font-size:0.9em; margin-bottom:20px;">
        Configura banners animados festivos para mostrar en todas las TVs del Box.
      </p>

      <!-- ENABLE / DISABLE TOGGLE -->
      <div class="input-group" style="background:rgba(255,215,0,0.1); padding:15px; border-radius:8px; border:1px solid #ffd700;">
        <label style="display:flex; align-items:center; gap:12px; font-weight:bold; cursor:pointer; font-size:1.1em; color:#fff;">
          <input type="checkbox" [(ngModel)]="celebrationForm.enabled" style="width:22px; height:22px;">
          <span>{{ celebrationForm.enabled ? '🟢 Celebración ACTIVADA en Pantalla' : '🔴 Celebración DESACTIVADA' }}</span>
        </label>
      </div>

      <!-- PRESETS GRID -->
      <div class="input-group" style="margin-top:20px;">
        <label style="font-weight:bold; color:#fff; display:block; margin-bottom:10px;">Elige una Festividad o Preset:</label>
        <div class="presets-grid">
          <div *ngFor="let p of celebrationPresets" 
               class="preset-item" 
               [class.active]="celebrationForm.presetKey === p.key"
               (click)="selectCelebrationPreset(p.key)">
            <span class="preset-icon-sm">{{ p.icon }}</span>
            <span class="preset-name">{{ p.name }}</span>
          </div>
        </div>
      </div>

      <!-- CUSTOM TITLE AND SUBTITLE EDITORS -->
      <div class="input-group" style="margin-top:15px;">
        <label style="color:#aaa;">Título en Pantalla:</label>
        <input type="text" [(ngModel)]="celebrationForm.title" class="count-input" style="width:100%; font-size:1.1em; padding:10px; margin-top:5px;" placeholder="Título festivo...">
      </div>

      <div class="input-group">
        <label style="color:#aaa;">Subtítulo o Mensaje Especial:</label>
        <input type="text" [(ngModel)]="celebrationForm.subtitle" class="count-input" style="width:100%; font-size:1.1em; padding:10px; margin-top:5px;" placeholder="Mensaje para los atletas...">
      </div>

      <!-- CUSTOM PNG FILE UPLOAD (IF PRESET IS CUSTOM) -->
      <div *ngIf="celebrationForm.presetKey === 'custom'" class="input-group" style="background:rgba(0,229,255,0.08); padding:15px; border-radius:8px; border:1px solid #00e5ff;">
        <label style="font-weight:bold; color:#00e5ff; display:block; margin-bottom:8px;">Subir Imagen PNG Personalizada (Fondo Transparente):</label>
        <input type="file" (change)="onCustomPngUpload($event)" accept="image/png,image/webp,image/jpeg" style="margin-bottom:10px;">
        <div *ngIf="celebrationForm.customImageUrl" style="margin-top:10px; text-align:center;">
          <p style="color:#aaa; font-size:0.8em; margin-bottom:5px;">Vista previa de imagen cargada:</p>
          <img [src]="celebrationForm.customImageUrl" style="max-height:120px; object-fit:contain;" alt="Preview">
          <br>
          <button class="btn-remove-compact" style="margin-top:5px;" (click)="celebrationForm.customImageUrl = ''">✕ Quitar Imagen</button>
        </div>
      </div>

      <!-- TIMING CONTROLS (CUSTOM FREQUENCY & DURATION) -->
      <div class="input-group" style="margin-top:20px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; text-align:left;">
        <div>
          <label style="color:#ffd700; font-weight:bold; display:block; margin-bottom:5px;">Frecuencia de Aparición (Segundos):</label>
          <input type="number" [(ngModel)]="celebrationForm.intervalSeconds" min="5" max="7200" class="count-input" style="width:100%; padding:10px; font-size:1em;" placeholder="Ej: 300 (5 min)">
          <p style="color:#aaa; font-size:0.8em; margin-top:4px;">
            {{ (celebrationForm.intervalSeconds || 0) >= 60 ? 'Aparece cada ' + ((celebrationForm.intervalSeconds || 0) / 60).toFixed(1) + ' minuto(s)' : 'Aparece cada ' + (celebrationForm.intervalSeconds || 0) + ' segundo(s)' }}
          </p>
          <div style="display:flex; gap:5px; margin-top:6px; flex-wrap:wrap;">
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 60">1 min</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 180">3 min</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 300">5 min</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 600">10 min</button>
          </div>
        </div>

        <div>
          <label style="color:#ffd700; font-weight:bold; display:block; margin-bottom:5px;">Duración en Pantalla (Segundos):</label>
          <input type="number" [(ngModel)]="celebrationForm.durationSeconds" min="1" max="300" class="count-input" style="width:100%; padding:10px; font-size:1em;" placeholder="Ej: 8 (8 seg)">
          <p style="color:#aaa; font-size:0.8em; margin-top:4px;">Permanece visible {{ celebrationForm.durationSeconds || 0 }} segundo(s)</p>
          <div style="display:flex; gap:5px; margin-top:6px; flex-wrap:wrap;">
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 5">5 seg</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 8">8 seg</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 12">12 seg</button>
            <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 20">20 seg</button>
          </div>
        </div>
      </div>

      <!-- POSITION SELECTOR -->
      <div class="input-group" style="text-align:left;">
        <label style="color:#aaa; display:block; margin-bottom:5px;">Posición en Pantalla:</label>
        <select [(ngModel)]="celebrationForm.position" class="count-input" style="width:100%; padding:10px; background:#222; color:#fff;">
          <option value="top">Superior Centro (Recomendado)</option>
          <option value="center">Centro Flotante</option>
          <option value="bottom">Inferior Centro</option>
        </select>
      </div>

      <!-- SAVE BUTTON -->
      <button class="btn-action" style="background:#ffd700; color:#000; font-weight:bold; margin-top:20px;" [disabled]="isPublishing()" (click)="saveCelebrationToFirebase()">
        ☁️ {{ isPublishing() ? 'GUARDANDO...' : 'GUARDAR Y ACTIVAR CELEBRACIÓN EN TODAS LAS TVs' }}
      </button>

      <div *ngIf="statusMsg()" class="status-msg" [style.color]="statusColor()">
        {{ statusMsg() }}
      </div>

      <button class="btn-action btn-secondary" (click)="backToLocation.emit()">
        ⬅️ Volver a Selección de Sede
      </button>
    </div>
  `
})
export class AdminCelebrationManagerComponent implements OnInit {
  public celebrationService = inject(CelebrationService);
  public authService = inject(AuthService);

  @Output() backToLocation = new EventEmitter<void>();

  public celebrationPresets = CELEBRATION_PRESETS;
  public celebrationForm: CelebrationConfig = JSON.parse(JSON.stringify(DEFAULT_CELEBRATION_CONFIG));

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');

  ngOnInit(): void {
    const currentConfig = this.celebrationService.config();
    if (currentConfig) {
      this.celebrationForm = JSON.parse(JSON.stringify(currentConfig));
    }
  }

  public selectCelebrationPreset(key: CelebrationPresetKey): void {
    this.celebrationForm.presetKey = key;
    const preset = CELEBRATION_PRESETS.find(p => p.key === key);
    if (preset) {
      this.celebrationForm.title = preset.title;
      this.celebrationForm.subtitle = preset.subtitle;
    }
  }

  public onCustomPngUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.celebrationForm.customImageUrl = e.target?.result as string || '';
      };
      reader.readAsDataURL(file);
    }
  }

  public async saveCelebrationToFirebase(): Promise<void> {
    if (!this.authService.isCelebrationAdmin()) {
      alert('Acceso restringido: No tienes permisos para guardar la configuración de celebraciones.');
      return;
    }

    this.isPublishing.set(true);
    this.statusMsg.set('Guardando configuración de celebración en Firebase...');

    try {
      await this.celebrationService.saveConfig(this.celebrationForm, this.authService.currentUserEmail());
      this.isPublishing.set(false);
      this.statusMsg.set('¡CONFIGURACIÓN DE CELEBRACIÓN PUBLICADA EN TODAS LAS TVs CON ÉXITO!');
      this.statusColor.set('#00ff00');
    } catch (err: any) {
      this.isPublishing.set(false);
      this.statusMsg.set(`Error: ${err?.message || err}`);
      this.statusColor.set('orange');
    }
  }
}
