import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DayWods, DayName } from '../../../../core/models/wod.model';
import { WODS_DATA } from '../../../../core/data/wods.data';
import { WeeklyWodService } from '../../../../core/services/weekly-wod.service';
import { AuthService } from '../../../../core/services/auth.service';
import { parseWeeklyTxt } from '../../../../core/utils/txt-parser.util';

@Component({
  selector: 'app-admin-weekly-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container editor-container">
      <h2 style="color:#fff; margin-bottom:5px;">📅 GESTIÓN WODS DE LA SEMANA</h2>
      <p class="editor-label">VISTA COMPACTA Y PROGRAMACIÓN DE LA SEMANA</p>

      <!-- DAY TABS -->
      <div class="day-tabs">
        <button *ngFor="let day of daysList"
                class="day-tab-btn"
                [class.active]="selectedWeeklyDay() === day"
                (click)="selectedWeeklyDay.set(day)">
          {{ day.toUpperCase() }}
          <span class="block-count-badge">{{ (weeklyWodsData[day] || []).length }}</span>
        </button>
      </div>

      <!-- COMPACT DAY VIEW -->
      <div class="compact-day-card">
        <div class="compact-day-header">
          <h3>{{ selectedWeeklyDay().toUpperCase() }}</h3>
          <span style="color:#aaa; font-size:0.85em;">
            {{ (weeklyWodsData[selectedWeeklyDay()] || []).length }} bloque(s) programado(s)
          </span>
        </div>

        <div *ngIf="(weeklyWodsData[selectedWeeklyDay()] || []).length === 0" class="empty-day-msg">
          No hay ejercicios programados para este día. Puedes importar desde .TXT o agregar un bloque.
        </div>

        <div *ngFor="let block of weeklyWodsData[selectedWeeklyDay()]; let bi = index" class="compact-block-item">
          <div class="block-badge-header">
            <span class="block-type-badge" [ngStyle]="{
              'color': getBlockBadgeInfo(block.titulo).color,
              'background': getBlockBadgeInfo(block.titulo).bg,
              'border-color': getBlockBadgeInfo(block.titulo).color
            }">
              {{ getBlockBadgeInfo(block.titulo).label }}
            </span>
            <input type="text" [(ngModel)]="block.titulo" class="compact-title-input" placeholder="Título de bloque...">
            <button (click)="removeWeeklyBlock(selectedWeeklyDay(), bi)" class="btn-remove-compact" title="Eliminar bloque">✕</button>
          </div>
          <textarea [(ngModel)]="block.contenido" class="compact-content-textarea" placeholder="Contenido del ejercicio..."></textarea>
        </div>

        <button class="btn-action btn-secondary dashed-btn" style="margin-top:15px;" (click)="addWeeklyBlock(selectedWeeklyDay())">
          + Agregar bloque a {{ selectedWeeklyDay().toUpperCase() }}
        </button>
      </div>

      <!-- IMPORT WEEKLY TXT BOX -->
      <div class="txt-import-box" style="margin-top:20px;">
        <button class="btn-action btn-secondary" (click)="showWeeklyTxtImport.update(v => !v)">
          {{ showWeeklyTxtImport() ? '✕ Cerrar Importador .TXT Semanal' : '📄 Importar / Parsear Rutina Semanal (.TXT)' }}
        </button>

        <div *ngIf="showWeeklyTxtImport()" class="txt-import-content">
          <p style="color:#aaa; font-size:0.85em; margin:10px 0; text-align:left;">
            Pega el texto de toda la semana usando delimitadores <code>------------------------[Día]---------------------------</code>.
            Se detectarán automáticamente Calentamiento, Skill, Fuerza, WOD, Accesorios, etc.
          </p>
          <div class="input-group">
            <input type="file" (change)="onWeeklyFileUpload($event)" accept=".txt" style="margin-bottom:10px;">
            <textarea [(ngModel)]="rawWeeklyTxt" style="height:150px;" placeholder="------------------------Lunes---------------------------&#10;Warmup&#10;...&#10;Custom Metcon&#10;..."></textarea>
          </div>
          <button class="btn-action" style="background:#0088cc;" (click)="convertAndApplyWeeklyTxt()">
            ⚡ Pasar Texto a la Semana
          </button>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <button class="btn-action" [disabled]="isPublishing()" (click)="saveWeeklyWodsToFirebase()">
        ☁️ {{ isPublishing() ? 'PUBLICANDO...' : 'PUBLICAR RUTINA SEMANAL EN TV EN VIVO' }}
      </button>

      <button class="btn-action btn-secondary" (click)="copyWeeklyTsCode()">
        📋 Copiar Código TypeScript (wods.data.ts)
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
export class AdminWeeklyManagerComponent implements OnInit {
  public weeklyWodService = inject(WeeklyWodService);
  public authService = inject(AuthService);

  @Output() backToLocation = new EventEmitter<void>();

  public daysList: DayName[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  public selectedWeeklyDay = signal<DayName>('lunes');
  public weeklyWodsData: DayWods = JSON.parse(JSON.stringify(WODS_DATA));

  public showWeeklyTxtImport = signal<boolean>(false);
  public rawWeeklyTxt = '';

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');

  async ngOnInit(): Promise<void> {
    const fetched = await this.weeklyWodService.fetchWeeklyWods();
    if (fetched) {
      this.weeklyWodsData = JSON.parse(JSON.stringify(fetched));
    }
  }

  public getBlockBadgeInfo(title: string): { label: string; color: string; bg: string } {
    if (!title) return { label: 'BLOQUE', color: '#a0a0a0', bg: 'rgba(160, 160, 160, 0.2)' };
    const t = title.toLowerCase();
    if (t.includes('warmup') || t.includes('warm-up') || t.includes('calentamiento')) {
      return { label: 'WARM-UP', color: '#ff9900', bg: 'rgba(255, 153, 0, 0.2)' };
    }
    if (t.includes('skill') || t.includes('gymnastics') || t.includes('técnica') || t.includes('tecnica')) {
      return { label: 'SKILL', color: '#0088cc', bg: 'rgba(0, 136, 204, 0.2)' };
    }
    if (t.includes('strength') || t.includes('weightlifting') || t.includes('fuerza') || t.includes('deadlift') || t.includes('clean') || t.includes('snatch') || t.includes('squat')) {
      return { label: 'STRENGTH', color: '#3366ff', bg: 'rgba(51, 102, 255, 0.2)' };
    }
    if (t.includes('metcon') || t.includes('wod') || t.includes('elizabeth') || t.includes('amrap') || t.includes('tiempo') || t.includes('reps') || t.includes('rondas') || t.includes('fortime') || t.includes('for time')) {
      return { label: 'METCON', color: '#ff0000', bg: 'rgba(255, 0, 0, 0.2)' };
    }
    if (t.includes('accesorio') || t.includes('finisher') || t.includes('accessory') || t.includes('quality') || t.includes('core')) {
      return { label: 'ACCESORIO', color: '#00cc66', bg: 'rgba(0, 204, 102, 0.2)' };
    }
    return { label: 'BLOQUE', color: '#a0a0a0', bg: 'rgba(160, 160, 160, 0.2)' };
  }

  public addWeeklyBlock(day: DayName): void {
    if (!this.weeklyWodsData[day]) {
      this.weeklyWodsData[day] = [];
    }
    this.weeklyWodsData[day].push({ titulo: 'NUEVO BLOQUE', contenido: '' });
  }

  public removeWeeklyBlock(day: DayName, index: number): void {
    if (this.weeklyWodsData[day]) {
      this.weeklyWodsData[day].splice(index, 1);
    }
  }

  public onWeeklyFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.rawWeeklyTxt = e.target?.result as string || '';
      };
      reader.readAsText(file);
    }
  }

  public convertAndApplyWeeklyTxt(): void {
    if (!this.rawWeeklyTxt.trim()) {
      alert('Por favor pega texto o sube un archivo .txt semanal');
      return;
    }

    try {
      const newWeeklyData = parseWeeklyTxt(this.rawWeeklyTxt);
      this.weeklyWodsData = newWeeklyData;
      this.statusMsg.set('¡Rutina semanal parseada correctamente! Revisa las pestañas arriba.');
      this.statusColor.set('#00ff00');
      this.showWeeklyTxtImport.set(false);
    } catch (err: any) {
      alert(err?.message || 'Error al parsear el archivo .txt semanal.');
    }
  }

  public async saveWeeklyWodsToFirebase(): Promise<void> {
    this.isPublishing.set(true);
    this.statusMsg.set('Publicando rutina semanal en Firebase...');
    this.statusColor.set('#fff');

    try {
      await this.weeklyWodService.saveWeeklyWodsToFirebase(this.weeklyWodsData, this.authService.currentUserEmail());
      this.isPublishing.set(false);
      this.statusMsg.set('¡RUTINA SEMANAL PUBLICADA CON ÉXITO EN TODAS LAS PANTALLAS!');
      this.statusColor.set('#00ff00');
    } catch (err: any) {
      this.isPublishing.set(false);
      this.statusMsg.set(`Error al guardar: ${err.message}`);
      this.statusColor.set('orange');
    }
  }

  public copyWeeklyTsCode(): void {
    const code = `import { DayWods } from '../models/wod.model';\n\nexport const WODS_DATA: DayWods = ${JSON.stringify(this.weeklyWodsData, null, 2)};\n`;
    navigator.clipboard.writeText(code).then(() => {
      alert('¡Código TypeScript copiado al portapapeles! Puedes pegarlo en src/app/core/data/wods.data.ts');
    }).catch(err => {
      alert('Error al copiar: ' + err);
    });
  }
}
