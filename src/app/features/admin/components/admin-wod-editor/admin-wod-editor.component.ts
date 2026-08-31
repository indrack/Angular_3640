import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../../../core/config/firebase.config';
import { WodItem } from '../../../../core/models/wod.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuditLogService } from '../../../../core/services/audit-log.service';

import { AdminTvSimulatorComponent } from '../admin-tv-simulator/admin-tv-simulator.component';

@Component({
  selector: 'app-admin-wod-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTvSimulatorComponent],
  templateUrl: './admin-wod-editor.component.html'
})
export class AdminWodEditorComponent implements OnInit {
  @Input() selectedLocation: 'miraflores' | 'calacoto' = 'miraflores';
  @Input() selectedMode: 'new' | 'append' = 'append';
  @Input() initialSlideCount = 1;

  @Output() goToTv = new EventEmitter<void>();
  @Output() backToLocation = new EventEmitter<void>();

  public authService = inject(AuthService);
  public auditLogService = inject(AuditLogService);
  public slides: WodItem[] = [];
  public showTxtImport = signal<boolean>(false);
  public rawTxtInput = '';

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');
  public hasDraft = signal<boolean>(false);
  public showPreview = signal<boolean>(false);
  public previewSlideIndex = signal<number>(0);

  public openPreview(index: number = 0): void {
    this.previewSlideIndex.set(index);
    this.showPreview.set(true);
  }

  private db: Database | null = null;

  ngOnInit(): void {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);

    this.checkDraftInLocalStorage();

    if (this.selectedMode === 'new') {
      this.initNewSlides();
    } else {
      this.loadExistingSlides();
    }
  }

  private getDraftKey(): string {
    return `wod_draft_${this.selectedLocation}`;
  }

  private checkDraftInLocalStorage(): void {
    try {
      const saved = localStorage.getItem(this.getDraftKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.hasDraft.set(true);
        }
      }
    } catch (e) {
      console.warn('Error al verificar borrador local:', e);
    }
  }

  public saveDraftToLocalStorage(): void {
    try {
      if (this.slides && this.slides.length > 0) {
        localStorage.setItem(this.getDraftKey(), JSON.stringify(this.slides));
        this.hasDraft.set(true);
      }
    } catch (e) {
      console.warn('Error al guardar borrador local:', e);
    }
  }

  public restoreDraft(): void {
    try {
      const saved = localStorage.getItem(this.getDraftKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.slides = parsed;
          this.statusMsg.set('Borrador restaurado con éxito.');
          this.statusColor.set('#00e5ff');
        }
      }
    } catch (e) {
      alert('Error al restaurar borrador: ' + e);
    }
  }

  public clearDraft(): void {
    try {
      localStorage.removeItem(this.getDraftKey());
      this.hasDraft.set(false);
      this.statusMsg.set('Borrador descartado.');
      this.statusColor.set('#aaa');
    } catch (e) {
      console.warn('Error al descartar borrador:', e);
    }
  }

  private initNewSlides(): void {
    this.slides = [];
    for (let i = 0; i < this.initialSlideCount; i++) {
      this.slides.push({ titulo: '', contenido: '' });
    }
  }

  private loadExistingSlides(): void {
    if (!this.db) return;
    const dbPath = this.selectedLocation === 'miraflores' ? 'customWodMiraflores' : 'customWodCalacoto';
    const dbRef = ref(this.db, dbPath);

    get(dbRef).then(snapshot => {
      const data = snapshot.val() || [];
      if (Array.isArray(data) && data.length > 0) {
        this.slides = [...data, { titulo: '', contenido: '' }];
      } else {
        this.slides = [{ titulo: '', contenido: '' }];
      }
    }).catch(err => {
      alert('Error cargando datos: ' + err.message);
    });
  }

  public addSlideField(): void {
    this.slides.push({ titulo: '', contenido: '' });
    this.saveDraftToLocalStorage();
  }

  public removeSlide(index: number): void {
    this.slides.splice(index, 1);
    this.saveDraftToLocalStorage();
  }

  public publishToFirebase(): void {
    if (!this.db) return;

    if (this.slides.length === 0) {
      if (!confirm('¿Estás seguro de publicar VACÍO? Esto borrará el WOD de la pantalla.')) return;
    }

    const allEmpty = this.slides.every(s => !s.titulo?.trim() && !s.contenido?.trim());
    if (allEmpty && this.slides.length > 0) {
      if (!confirm('⚠️ Todas las pantallas de la lista están en blanco. ¿Seguro que deseas publicar en blanco?')) {
        return;
      }
    }

    const cleanedData = this.slides.map(s => ({
      titulo: s.titulo?.trim() || 'WOD',
      contenido: s.contenido?.trim() || ''
    }));

    const dbPath = this.selectedLocation === 'miraflores' ? 'customWodMiraflores' : 'customWodCalacoto';
    this.isPublishing.set(true);
    this.statusMsg.set(`Subiendo WOD a ${this.selectedLocation.toUpperCase()}...`);
    this.statusColor.set('#fff');

    set(ref(this.db, dbPath), cleanedData)
      .then(async () => {
        this.isPublishing.set(false);
        this.statusMsg.set(`¡WOD PUBLICADO CON ÉXITO EN ${this.selectedLocation.toUpperCase()}!`);
        this.statusColor.set('#ff0000');
        this.clearDraft();
        const locationName = this.selectedLocation === 'miraflores' ? 'TV Miraflores' : 'TV Calacoto';
        const modeLabel = this.selectedMode === 'new' ? 'Nueva rutina' : 'Añadir bloques';
        await this.auditLogService.logAction(
          this.authService.currentUserEmail(),
          `Publicó WOD en ${locationName}`,
          `Cambios en ${locationName} (Modo: ${modeLabel}, ${cleanedData.length} bloque(s)/pantalla(s))`
        );
      })
      .catch((err) => {
        this.isPublishing.set(false);
        this.statusMsg.set(`Error: ${err.message}`);
        this.statusColor.set('orange');
      });
  }

  public toggleTxtImport(): void {
    this.showTxtImport.update(v => !v);
  }

  public onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.rawTxtInput = e.target?.result as string || '';
      };
      reader.readAsText(file);
    }
  }

  public convertAndApplyTxt(): void {
    if (!this.rawTxtInput.trim()) {
      alert('Por favor pega texto o sube un archivo .txt');
      return;
    }

    const raw = this.rawTxtInput.trim();
    const daySeparatorRegex = /-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/g;
    const parsedSlides: WodItem[] = [];

    if (daySeparatorRegex.test(raw)) {
      const parts = raw.split(/-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/);
      for (let i = 1; i < parts.length; i += 2) {
        const dayName = parts[i].trim();
        const dayContent = parts[i + 1] ? parts[i + 1].trim() : '';
        if (!dayContent) continue;

        const headerRegex = /^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY)(\s*\(.*?\))?$/i;
        const lines = dayContent.split('\n');

        let curTitle = '';
        let curLines: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (headerRegex.test(trimmed)) {
            if (curTitle) {
              parsedSlides.push({ titulo: `${dayName.toUpperCase()} - ${curTitle}`, contenido: curLines.join('\n').trim() });
              curLines = [];
            }
            curTitle = trimmed;
          } else {
            if (!curTitle && trimmed) {
              curTitle = 'WOD';
            }
            curLines.push(line);
          }
        }
        if (curTitle) {
          parsedSlides.push({ titulo: `${dayName.toUpperCase()} - ${curTitle}`, contenido: curLines.join('\n').trim() });
        }
      }
    } else {
      const blocks = raw.split(/\n\s*\n/).filter(b => b.trim().length > 0);
      for (const block of blocks) {
        const lines = block.trim().split('\n');
        const firstLine = lines[0].trim();

        if (lines.length === 1) {
          parsedSlides.push({ titulo: 'WOD', contenido: firstLine });
        } else if (firstLine.length <= 40) {
          parsedSlides.push({
            titulo: firstLine.replace(/^[#*-\s]+/, '').replace(/[:*]+$/, '').trim(),
            contenido: lines.slice(1).join('\n').trim()
          });
        } else {
          parsedSlides.push({
            titulo: 'WOD',
            contenido: block.trim()
          });
        }
      }
    }

    if (parsedSlides.length > 0) {
      this.slides = parsedSlides;
      this.statusMsg.set(`¡Se convirtieron ${parsedSlides.length} pantallas correctamente!`);
      this.statusColor.set('#00ff00');
      this.showTxtImport.set(false);
    }
  }
}
