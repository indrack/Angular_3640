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
  templateUrl: './admin-celebration-manager.component.html'
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
