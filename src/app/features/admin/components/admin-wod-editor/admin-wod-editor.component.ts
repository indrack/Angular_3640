import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../../../core/config/firebase.config';
import { WodItem } from '../../../../core/models/wod.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-wod-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container editor-container">
      <h2 style="color:#fff; margin-bottom:10px;">EDITAR CONTENIDO</h2>
      <p class="editor-label">
        EDITANDO: {{ selectedLocation.toUpperCase() }} | MODO: {{ selectedMode === 'new' ? 'REEMPLAZAR TODO' : 'AGREGAR' }}
      </p>

      <div class="help-text">
        <strong>TIP:</strong> Para poner texto en <strong>negrita</strong>, enciérralo entre asteriscos.<br>
        Ejemplo: <code>Calentamiento: *3 Rondas* de...</code>
      </div>

      <div class="txt-import-box">
        <button class="btn-action btn-secondary" (click)="toggleTxtImport()">
          {{ showTxtImport() ? '✕ Cerrar Convertidor TXT' : '📄 Importar / Autoconvertir desde Texto (.TXT)' }}
        </button>

        <div *ngIf="showTxtImport()" class="txt-import-content">
          <p style="color:#aaa; font-size:0.9em; margin:10px 0;">
            Pega el texto de tu WOD o sube un archivo <code>.txt</code>. Las secciones separadas por salto de línea doble se convertirán en pantallas automáticamente.
          </p>
          <div class="input-group">
            <input type="file" (change)="onFileUpload($event)" accept=".txt" style="margin-bottom:10px;">
            <textarea [(ngModel)]="rawTxtInput" placeholder="Ejemplo:&#10;&#10;WARM-UP&#10;*2 SETS*&#10;1:00 Cardio Choice&#10;8 PVC Pass Throughs&#10;&#10;Custom Metcon&#10;For time:&#10;21-15-9..."></textarea>
          </div>
          <button class="btn-action" style="background:#0088cc;" (click)="convertAndApplyTxt()">
            ⚡ Convertir Texto a Pantallas
          </button>
        </div>
      </div>

      <div class="slides-container">
        <div *ngFor="let slide of slides; let i = index" class="slide-block">
          <span class="slide-num">#{{ i + 1 }}</span>
          <h3 style="color:#ff0000; text-align:left; margin-top:0;">Pantalla {{ i + 1 }}</h3>
          <div class="input-group">
            <label>Título</label>
            <input type="text" [(ngModel)]="slide.titulo" placeholder="Ej: WOD, CALENTAMIENTO...">
          </div>
          <div class="input-group">
            <label>Contenido (*usar asteriscos para negrita*)</label>
            <textarea [(ngModel)]="slide.contenido" placeholder="Escribe aquí el ejercicio..."></textarea>
          </div>
          <div style="text-align:right;">
            <button (click)="removeSlide(i)" class="btn-remove">[Eliminar esta pantalla]</button>
          </div>
        </div>
      </div>

      <button class="btn-action btn-secondary dashed-btn" (click)="addSlideField()">
        + Agregar otra pantalla
      </button>

      <button class="btn-action" [disabled]="isPublishing()" (click)="publishToFirebase()">
        ☁️ {{ isPublishing() ? 'PUBLICANDO...' : 'PUBLICAR EN TV' }}
      </button>

      <div *ngIf="statusMsg()" class="status-msg" [style.color]="statusColor()">
        {{ statusMsg() }}
      </div>
      <button class="btn-action btn-secondary" (click)="goToTv.emit()">Ver Pantalla WOD / Salir</button>
    </div>
  `
})
export class AdminWodEditorComponent implements OnInit {
  @Input() selectedLocation: 'miraflores' | 'calacoto' = 'miraflores';
  @Input() selectedMode: 'new' | 'append' = 'append';
  @Input() initialSlideCount = 1;

  @Output() goToTv = new EventEmitter<void>();

  public authService = inject(AuthService);
  public slides: WodItem[] = [];
  public showTxtImport = signal<boolean>(false);
  public rawTxtInput = '';

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');

  private db: Database | null = null;

  ngOnInit(): void {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    this.db = getDatabase(app);

    if (this.selectedMode === 'new') {
      this.initNewSlides();
    } else {
      this.loadExistingSlides();
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
  }

  public removeSlide(index: number): void {
    this.slides.splice(index, 1);
  }

  public publishToFirebase(): void {
    if (!this.db) return;

    if (this.slides.length === 0) {
      if (!confirm('¿Estás seguro de publicar VACÍO? Esto borrará el WOD de la pantalla.')) return;
    }

    const cleanedData = this.slides.map(s => ({
      titulo: s.titulo || 'SIN TÍTULO',
      contenido: s.contenido || ''
    }));

    const dbPath = this.selectedLocation === 'miraflores' ? 'customWodMiraflores' : 'customWodCalacoto';
    this.isPublishing.set(true);
    this.statusMsg.set(`Subiendo WOD a ${this.selectedLocation.toUpperCase()}...`);
    this.statusColor.set('#fff');

    set(ref(this.db, dbPath), cleanedData)
      .then(() => {
        this.isPublishing.set(false);
        this.statusMsg.set(`¡WOD PUBLICADO CON ÉXITO EN ${this.selectedLocation.toUpperCase()}!`);
        this.statusColor.set('#ff0000');
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
