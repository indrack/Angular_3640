import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DayWods, DayName } from '../../../../core/models/wod.model';
import { WODS_DATA } from '../../../../core/data/wods.data';
import { WeeklyWodService } from '../../../../core/services/weekly-wod.service';
import { AuthService } from '../../../../core/services/auth.service';
import { parseWeeklyTxt } from '../../../../core/utils/txt-parser.util';

import { AdminTvSimulatorComponent } from '../admin-tv-simulator/admin-tv-simulator.component';

@Component({
  selector: 'app-admin-weekly-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTvSimulatorComponent],
  templateUrl: './admin-weekly-manager.component.html'
})
export class AdminWeeklyManagerComponent implements OnInit {
  public weeklyWodService = inject(WeeklyWodService);
  public authService = inject(AuthService);

  @Output() backToLocation = new EventEmitter<void>();

  public activeRoutineType = signal<'general' | 'wgirls'>('general');
  public daysList: DayName[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  public selectedWeeklyDay = signal<DayName>('lunes');
  public weeklyWodsData: DayWods = JSON.parse(JSON.stringify(WODS_DATA));

  public showWeeklyTxtImport = signal<boolean>(false);
  public rawWeeklyTxt = '';

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');
  public showWeeklyPreview = signal<boolean>(false);
  public previewSlideIndex = signal<number>(0);

  public openWeeklyPreview(index: number = 0): void {
    this.previewSlideIndex.set(index);
    this.showWeeklyPreview.set(true);
  }

  public getContextTitle(): string {
    const day = this.selectedWeeklyDay().toUpperCase();
    const type = this.activeRoutineType() === 'wgirls' ? 'W-GIRLS' : 'GENERAL';
    return `${day} (${type})`;
  }

  public getSelectedDaySlides(): WodItem[] {
    return this.weeklyWodsData[this.selectedWeeklyDay()] || [];
  }

  async ngOnInit(): Promise<void> {
    await this.loadCurrentRoutine();
  }

  public async switchRoutineType(type: 'general' | 'wgirls'): Promise<void> {
    if (this.activeRoutineType() === type) return;
    this.activeRoutineType.set(type);
    this.statusMsg.set('');
    await this.loadCurrentRoutine();
  }

  private async loadCurrentRoutine(): Promise<void> {
    if (this.activeRoutineType() === 'wgirls') {
      const fetched = await this.weeklyWodService.fetchWeeklyWodsWGirls();
      if (fetched) {
        this.weeklyWodsData = JSON.parse(JSON.stringify(fetched));
      }
    } else {
      const fetched = await this.weeklyWodService.fetchWeeklyWods();
      if (fetched) {
        this.weeklyWodsData = JSON.parse(JSON.stringify(fetched));
      }
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
      const isWGirls = this.activeRoutineType() === 'wgirls';
      const newWeeklyData = this.weeklyWodService.parseWeeklyTxt(this.rawWeeklyTxt, isWGirls);
      this.weeklyWodsData = newWeeklyData;
      this.statusMsg.set(`¡${isWGirls ? 'Rutina W-Girls' : 'Rutina semanal'} parseada correctamente! Revisa las pestañas arriba.`);
      this.statusColor.set('#00ff00');
      this.showWeeklyTxtImport.set(false);
    } catch (err: any) {
      alert(err?.message || 'Error al parsear el archivo .txt semanal.');
    }
  }

  public async saveWeeklyWodsToFirebase(): Promise<void> {
    this.isPublishing.set(true);
    const isWGirls = this.activeRoutineType() === 'wgirls';
    const label = isWGirls ? 'RUTINA W-GIRLS' : 'RUTINA SEMANAL GENERAL';
    this.statusMsg.set(`Publicando ${label.toLowerCase()} en Firebase...`);
    this.statusColor.set('#fff');

    try {
      await this.weeklyWodService.saveWeeklyWodsToFirebase(
        this.weeklyWodsData, 
        this.authService.currentUserEmail(),
        isWGirls
      );
      this.isPublishing.set(false);
      this.statusMsg.set(`¡${label} PUBLICADA CON ÉXITO EN TODAS LAS PANTALLAS!`);
      this.statusColor.set('#00ff00');
    } catch (err: any) {
      this.isPublishing.set(false);
      this.statusMsg.set(`Error al guardar: ${err.message}`);
      this.statusColor.set('orange');
    }
  }

  public copyWeeklyTsCode(): void {
    const isWGirls = this.activeRoutineType() === 'wgirls';
    const varName = isWGirls ? 'WGIRLS_DATA' : 'WODS_DATA';
    const fileName = isWGirls ? 'wgirls.data.ts' : 'wods.data.ts';
    const code = `import { DayWods } from '../models/wod.model';\n\nexport const ${varName}: DayWods = ${JSON.stringify(this.weeklyWodsData, null, 2)};\n`;
    navigator.clipboard.writeText(code).then(() => {
      alert(`¡Código TypeScript copiado al portapapeles! Puedes pegarlo en src/app/core/data/${fileName}`);
    }).catch(err => {
      alert('Error al copiar: ' + err);
    });
  }
}
