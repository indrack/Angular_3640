import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html'
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
