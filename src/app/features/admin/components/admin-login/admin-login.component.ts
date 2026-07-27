import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onLogin()" class="admin-container">
      <h2 class="neon-title">ACCESO STAFF</h2>
      <div class="input-group">
        <label>Email</label>
        <input type="email" name="email" [(ngModel)]="email" placeholder="admin@crossfit.com">
      </div>
      <div class="input-group relative">
        <label>Contraseña</label>
        <input [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" placeholder="******">
        <span class="eye-icon" (click)="togglePasswordVisibility()" title="Ver contraseña">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </span>
      </div>
      <button type="submit"
              class="btn-action"
              [disabled]="authService.isSubmitting() || authService.lockoutSeconds() > 0">
        {{ authService.lockoutSeconds() > 0
            ? 'Bloqueado (' + authService.lockoutSeconds() + 's)'
            : (authService.isSubmitting() ? 'Entrando...' : 'Iniciar Sesión') }}
      </button>
      <div *ngIf="authService.loginError()" class="error-msg">{{ authService.loginError() }}</div>
      <button type="button" class="btn-action btn-secondary" (click)="goToTv.emit()">Ver Pantalla WOD</button>
    </form>
  `
})
export class AdminLoginComponent {
  public authService = inject(AuthService);
  
  public email = '';
  public password = '';
  public showPassword = signal<boolean>(false);

  @Output() goToTv = new EventEmitter<void>();

  public togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  public async onLogin(): Promise<void> {
    await this.authService.login(this.email, this.password);
  }
}
