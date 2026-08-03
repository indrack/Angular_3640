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
          <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <span class="audit-tag" [ngStyle]="getBadgeStyle(log)">
              {{ getBadgeLabel(log) }}
            </span>
            <span class="audit-action">⚡ {{ log.action }}</span>
          </div>
          <div *ngIf="log.details" class="audit-details" style="margin-top:8px; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #00e5ff;">
            📝 <b>Detalle del Cambio:</b> {{ log.details }}
          </div>
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

  public getBadgeLabel(log: any): string {
    const text = `${log.action} ${log.details || ''}`.toLowerCase();
    if (text.includes('wgirls') || text.includes('w-girls')) return '💃 RUTINA W-GIRLS';
    if (text.includes('calacoto')) return '📍 TV CALACOTO';
    if (text.includes('miraflores')) return '📍 TV MIRAFLORES';
    if (text.includes('semanal') || text.includes('rutina')) return '📅 RUTINA SEMANAL';
    if (text.includes('celebraci')) return '🎉 CELEBRACIÓN';
    if (text.includes('sesión') || text.includes('sesion')) return '🔑 ACCESO';
    return '📌 SISTEMA';
  }

  public getBadgeStyle(log: any): Record<string, string> {
    const label = this.getBadgeLabel(log);
    let bg = '#444';
    let color = '#fff';

    if (label.includes('W-GIRLS')) { bg = '#ff007f'; color = '#fff'; }
    else if (label.includes('CALACOTO')) { bg = '#0055ff'; color = '#fff'; }
    else if (label.includes('MIRAFLORES')) { bg = '#ff6600'; color = '#fff'; }
    else if (label.includes('SEMANAL')) { bg = '#00a859'; color = '#fff'; }
    else if (label.includes('CELEBRACIÓN')) { bg = '#8a2be2'; color = '#fff'; }
    else if (label.includes('ACCESO')) { bg = '#333'; color = '#aaa'; }

    return {
      'background-color': bg,
      'color': color,
      'padding': '2px 8px',
      'border-radius': '4px',
      'font-size': '0.75em',
      'font-weight': 'bold',
      'display': 'inline-block'
    };
  }
}
