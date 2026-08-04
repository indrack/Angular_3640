import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../../../core/services/audit-log.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-audit-logs.component.html'
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
