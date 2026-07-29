import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../../../core/services/audit-log.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container editor-container">
      <h2 style="color:#39ff14; margin-bottom:10px;">📜 HISTORIAL DE CAMBIOS Y ACTIVIDAD</h2>
      <p style="color:#aaa; font-size:0.9em; margin-bottom:20px;">
        Registro de auditoría de todas las modificaciones realizadas en el sistema.
      </p>

      <div style="display:flex; gap:10px; margin-bottom:15px;">
        <button class="btn-action btn-secondary" style="padding: 8px 16px; font-size: 0.9em;" (click)="refreshLogs()">
          🔄 Actualizar Registros
        </button>
      </div>

      <div *ngIf="auditLogService.isLoading()" style="color:#fff; padding:20px;">
        Cargando registros de auditoría...
      </div>

      <div *ngIf="!auditLogService.isLoading()" class="audit-log-list">
        <div *ngFor="let log of auditLogService.logs()" class="audit-log-card">
          <div class="audit-header">
            <span class="audit-date">📅 {{ log.formattedDate }}</span>
            <span class="audit-user">👤 {{ log.email }}</span>
          </div>
          <div class="audit-action">⚡ {{ log.action }}</div>
          <div *ngIf="log.details" class="audit-details">📝 {{ log.details }}</div>
        </div>
        <div *ngIf="auditLogService.logs().length === 0" style="color:#888; padding:20px;">
          No hay registros de actividad aún.
        </div>
      </div>

      <button class="btn-action btn-secondary" style="margin-top:20px;" (click)="backToLocation.emit()">
        ⬅️ Volver a Selección de Sede
      </button>
    </div>
  `
})
export class AdminAuditLogsComponent implements OnInit {
  public auditLogService = inject(AuditLogService);

  @Output() backToLocation = new EventEmitter<void>();

  ngOnInit(): void {
    this.refreshLogs();
  }

  public refreshLogs(): void {
    this.auditLogService.fetchRecentLogs();
  }
}
