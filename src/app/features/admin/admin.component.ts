import { Component, OnInit, signal, effect, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminLocationSelectorComponent } from './components/admin-location-selector/admin-location-selector.component';
import { AdminWodEditorComponent } from './components/admin-wod-editor/admin-wod-editor.component';
import { AdminWeeklyManagerComponent } from './components/admin-weekly-manager/admin-weekly-manager.component';
import { AdminCelebrationManagerComponent } from './components/admin-celebration-manager/admin-celebration-manager.component';
import { AdminAuditLogsComponent } from './components/admin-audit-logs/admin-audit-logs.component';
import { AdminTvSimulatorComponent } from './components/admin-tv-simulator/admin-tv-simulator.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminLoginComponent,
    AdminLocationSelectorComponent,
    AdminWodEditorComponent,
    AdminWeeklyManagerComponent,
    AdminCelebrationManagerComponent,
    AdminAuditLogsComponent,
    AdminTvSimulatorComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  public step = signal<'login' | 'loading' | 'location' | 'mode' | 'count' | 'editor' | 'weekly' | 'celebration' | 'audit_logs'>('loading');
  public selectedLocation = signal<'miraflores' | 'calacoto'>('miraflores');
  public selectedMode = signal<'new' | 'append'>('append');
  public slideCount = 1;

  public showLiveSimulator = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.authService.isAuthInitialized()) {
        if (this.authService.isAuthenticated()) {
          if (this.step() === 'login' || this.step() === 'loading') {
            this.step.set('location');
          }
        } else {
          this.step.set('login');
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthInitialized()) {
      if (this.authService.isAuthenticated()) {
        this.step.set('location');
      } else {
        this.step.set('login');
      }
    }
  }

  public onSelectLocation(loc: 'miraflores' | 'calacoto'): void {
    this.selectedLocation.set(loc);
    this.step.set('mode');
  }

  public selectMode(mode: 'new' | 'append'): void {
    this.selectedMode.set(mode);
    if (mode === 'new') {
      this.step.set('count');
    } else {
      this.step.set('editor');
    }
  }

  public openWeeklyManager(): void {
    if (!this.authService.isWeeklyAdmin()) {
      alert('Acceso restringido: Esta opción solo está disponible para Administradores de Rutinas Semanales.');
      return;
    }
    this.step.set('weekly');
  }

  public openCelebrationManager(): void {
    if (!this.authService.isCelebrationAdmin()) {
      alert('Acceso restringido: El módulo de celebraciones es exclusivo para administradores autorizados.');
      return;
    }
    this.step.set('celebration');
  }

  public openAuditLogs(): void {
    this.step.set('audit_logs');
  }

  public onLogout(): void {
    this.step.set('login');
  }

  public goToTv(): void {
    this.router.navigate(['/']);
  }
}
