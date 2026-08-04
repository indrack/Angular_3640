import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { CELEBRATION_PRESETS } from '../../../../core/models/celebration.model';

@Component({
  selector: 'app-admin-tv-simulator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-tv-simulator.component.html'
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
