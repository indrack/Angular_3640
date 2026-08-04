import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-location-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-location-selector.component.html'
})
export class AdminLocationSelectorComponent {
  public authService = inject(AuthService);

  @Output() selectLocation = new EventEmitter<'miraflores' | 'calacoto'>();
  @Output() openWeeklyManager = new EventEmitter<void>();
  @Output() openCelebrationManager = new EventEmitter<void>();
  @Output() openAuditLogs = new EventEmitter<void>();
  @Output() showSimulator = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() goToTv = new EventEmitter<void>();

  public async onLogout(): Promise<void> {
    await this.authService.logout();
    this.logout.emit();
  }
}
