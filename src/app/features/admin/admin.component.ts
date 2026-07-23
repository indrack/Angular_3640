import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, Auth, User } from 'firebase/auth';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../core/config/firebase.config';
import { WodItem } from '../../core/models/wod.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-mode">
      <img src="logo.png" alt="Logo Box" class="admin-logo">

      <!-- LOGIN SECTION -->
      <div *ngIf="step() === 'login'" class="admin-container">
        <h2 class="neon-title">ACCESO STAFF</h2>
        <div class="input-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="admin@crossfit.com">
        </div>
        <div class="input-group relative">
          <label>Contraseña</label>
          <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" placeholder="******">
          <span class="eye-icon" (click)="togglePasswordVisibility()" title="Ver contraseña">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
        </div>
        <button class="btn-action" [disabled]="isSubmitting()" (click)="login()">
          {{ isSubmitting() ? 'Entrando...' : 'Iniciar Sesión' }}
        </button>
        <div *ngIf="loginError()" class="error-msg">{{ loginError() }}</div>
        <button class="btn-action btn-secondary" (click)="goToTv()">Ver Pantalla WOD</button>
      </div>

      <!-- LOADING SECTION -->
      <div *ngIf="step() === 'loading'" class="admin-container">
        <h3 style="color:#fff;">Cargando sistema...</h3>
      </div>

      <!-- STEP 1: LOCATION SELECTION -->
      <div *ngIf="step() === 'location'" class="admin-container">
        <h2 style="color:#fff; margin-bottom:10px;">SELECCIONA SEDE</h2>
        <p style="color:#666; margin-bottom:30px;">¿Qué pantalla quieres controlar?</p>

        <div class="selection-card" (click)="selectLocation('calacoto')">
          <h3>CALACOTO (TV 8)</h3>
          <p>Control Remoto Botón 8</p>
        </div>

        <div class="selection-card" (click)="selectLocation('miraflores')">
          <h3>MIRAFLORES (TV 7)</h3>
          <p>Control Remoto Botón 7</p>
        </div>

        <button class="btn-action btn-secondary" (click)="logout()">Cerrar Sesión</button>
        <button class="btn-action btn-secondary" (click)="goToTv()">Ver Pantalla WOD</button>
      </div>

      <!-- STEP 2: MODE SELECTION -->
      <div *ngIf="step() === 'mode'" class="admin-container">
        <h2 style="color:#fff; margin-bottom:10px;">GESTIÓN WOD</h2>
        <p class="selected-label">SEDE: {{ selectedLocation().toUpperCase() }}</p>

        <div class="selection-card" (click)="selectMode('append')">
          <h3>AGREGAR SLIDE</h3>
          <p>Mantener lo actual y añadir una nueva pantalla</p>
        </div>

        <div class="selection-card" (click)="selectMode('new')">
          <h3>LIMPIAR TODO</h3>
          <p>Borrar todo y crear WOD desde cero</p>
        </div>

        <button class="btn-action btn-secondary" (click)="step.set('location')">Volver</button>
      </div>

      <!-- STEP 3: INITIAL COUNT (IF NEW) -->
      <div *ngIf="step() === 'count'" class="admin-container">
        <h2 style="color:#fff;">NUEVO WOD</h2>
        <p style="color:#aaa; margin-bottom:20px;">¿Cuántas pantallas iniciales?</p>
        <input type="number" [(ngModel)]="slideCount" min="1" max="10" class="count-input">
        <button class="btn-action" (click)="initEditorNew()">Continuar</button>
        <button class="btn-action btn-secondary" (click)="step.set('mode')">Cancelar</button>
      </div>

      <!-- STEP 4: EDITOR -->
      <div *ngIf="step() === 'editor'" class="admin-container editor-container">
        <h2 style="color:#fff; margin-bottom:10px;">EDITAR CONTENIDO</h2>
        <p class="editor-label">
          EDITANDO: {{ selectedLocation().toUpperCase() }} | MODO: {{ selectedMode() === 'new' ? 'REEMPLAZAR TODO' : 'AGREGAR' }}
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
        <button class="btn-action btn-secondary" (click)="goToTv()">Ver Pantalla WOD / Salir</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-mode {
      min-height: 100vh;
      width: 100vw;
      background: #000;
      color: #fff;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .admin-logo {
      width: 150px;
      margin: 20px 0;
      filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
    }

    .admin-container {
      width: 100%;
      max-width: 450px;
      margin-top: 20px;
      padding: 30px;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid #333;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.2);
    }

    .editor-container {
      max-width: 800px;
    }

    .neon-title {
      color: #ff0000;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
    }

    .input-group {
      margin-bottom: 20px;
      text-align: left;
    }

    .relative { position: relative; }

    label {
      display: block;
      color: #aaa;
      margin-bottom: 8px;
      font-size: 0.9em;
      text-transform: uppercase;
    }

    input, textarea {
      width: 100%;
      padding: 12px;
      background: #000;
      border: 1px solid #444;
      color: #fff;
      font-size: 1em;
      border-radius: 5px;
      outline: none;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    input:focus, textarea:focus {
      border-color: #ff0000;
      box-shadow: 0 0 8px rgba(255, 0, 0, 0.4);
    }

    textarea {
      height: 100px;
      resize: vertical;
    }

    .eye-icon {
      position: absolute;
      right: 10px;
      top: 38px;
      cursor: pointer;
      color: #666;
    }

    .count-input {
      text-align: center;
      font-size: 1.5em;
      margin-bottom: 20px;
    }

    .btn-action {
      width: 100%;
      padding: 15px;
      background: #ff0000;
      color: #fff;
      font-weight: bold;
      border: none;
      border-radius: 5px;
      font-size: 1.1em;
      cursor: pointer;
      text-transform: uppercase;
      margin-top: 10px;
      transition: all 0.2s;
    }

    .btn-action:hover:not(:disabled) {
      background: #cc0000;
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.4);
    }

    .btn-secondary {
      background: #333;
      margin-top: 15px;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #444;
      box-shadow: none;
    }

    .dashed-btn {
      margin-bottom: 20px;
      background: #222;
      border: 1px dashed #444;
    }

    .selection-card {
      background: #000;
      border: 1px solid #333;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .selection-card:hover {
      border-color: #ff0000;
      background: #0a0a0a;
      transform: scale(1.02);
    }

    .selection-card h3 { margin: 0 0 5px 0; color: #fff; }
    .selection-card p { margin: 0; color: #888; font-size: 0.9em; }

    .selected-label, .editor-label {
      color: #ff0000;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .error-msg {
      color: #ff4444;
      margin-top: 10px;
      font-size: 0.9em;
    }

    .status-msg {
      margin-top: 15px;
      min-height: 20px;
      font-weight: bold;
    }

    .help-text {
      color: #888;
      font-size: 0.85em;
      margin-bottom: 20px;
      text-align: left;
      background: #111;
      padding: 10px;
      border-radius: 5px;
      border-left: 3px solid #ff0000;
    }

    .slide-block {
      background: #000;
      padding: 15px;
      border: 1px solid #444;
      margin-bottom: 15px;
      border-radius: 8px;
      position: relative;
    }

    .slide-num {
      position: absolute;
      right: 10px;
      top: 10px;
      color: #444;
      font-weight: bold;
    }

    .btn-remove {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
    }
    .btn-remove:hover { color: #ff4444; }

    .txt-import-box {
      margin-bottom: 20px;
    }
    .txt-import-content {
      background: #111;
      padding: 15px;
      border: 1px dashed #0088cc;
      border-radius: 8px;
      margin-top: 10px;
    }
  `]
})
export class AdminComponent implements OnInit {
  public step = signal<'login' | 'loading' | 'location' | 'mode' | 'count' | 'editor'>('loading');
  public selectedLocation = signal<'miraflores' | 'calacoto'>('miraflores');
  public selectedMode = signal<'new' | 'append'>('append');

  public email = '';
  public password = '';
  public showPassword = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public loginError = signal<string>('');

  public slideCount = 1;
  public slides: WodItem[] = [];

  public showTxtImport = signal<boolean>(false);
  public rawTxtInput = '';

  public isPublishing = signal<boolean>(false);
  public statusMsg = signal<string>('');
  public statusColor = signal<string>('#fff');

  private auth: Auth | null = null;
  private db: Database | null = null;

  constructor(private router: Router) {
    this.initFirebase();
  }

  private initFirebase(): void {
    let app: FirebaseApp;
    if (!getApps().length) {
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = getApps()[0];
    }
    this.auth = getAuth(app);
    this.db = getDatabase(app);
  }

  ngOnInit(): void {
    if (this.auth) {
      onAuthStateChanged(this.auth, (user: User | null) => {
        if (user) {
          this.step.set('location');
        } else {
          this.step.set('login');
        }
      });
    } else {
      this.step.set('login');
    }
  }

  public togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  public login(): void {
    if (!this.auth) return;
    this.loginError.set('');
    this.isSubmitting.set(true);

    setPersistence(this.auth, browserSessionPersistence)
      .then(() => signInWithEmailAndPassword(this.auth!, this.email, this.password))
      .then(() => {
        this.isSubmitting.set(false);
      })
      .catch((error) => {
        this.isSubmitting.set(false);
        if (error.code === 'auth/wrong-password') {
          this.loginError.set('Error: Contraseña incorrecta');
        } else if (error.code === 'auth/user-not-found') {
          this.loginError.set('Error: Usuario no encontrado');
        } else if (error.code === 'auth/invalid-email') {
          this.loginError.set('Error: Formato de email inválido');
        } else {
          this.loginError.set(`Error: ${error.message}`);
        }
      });
  }

  public logout(): void {
    if (this.auth) signOut(this.auth);
    this.step.set('login');
  }

  public selectLocation(loc: 'miraflores' | 'calacoto'): void {
    this.selectedLocation.set(loc);
    this.step.set('mode');
  }

  public selectMode(mode: 'new' | 'append'): void {
    this.selectedMode.set(mode);
    if (mode === 'new') {
      this.step.set('count');
    } else {
      this.loadExistingAndEdit();
    }
  }

  public initEditorNew(): void {
    this.slides = [];
    for (let i = 0; i < this.slideCount; i++) {
      this.slides.push({ titulo: '', contenido: '' });
    }
    this.step.set('editor');
  }

  private loadExistingAndEdit(): void {
    if (!this.db) return;
    const dbPath = this.selectedLocation() === 'miraflores' ? 'customWodMiraflores' : 'customWodCalacoto';
    const dbRef = ref(this.db, dbPath);

    get(dbRef).then(snapshot => {
      const data = snapshot.val() || [];
      if (Array.isArray(data) && data.length > 0) {
        this.slides = [...data, { titulo: '', contenido: '' }];
      } else {
        this.slides = [{ titulo: '', contenido: '' }];
      }
      this.step.set('editor');
    }).catch(err => {
      alert('Error cargando datos: ' + err.message);
      this.step.set('location');
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

    const dbPath = this.selectedLocation() === 'miraflores' ? 'customWodMiraflores' : 'customWodCalacoto';
    this.isPublishing.set(true);
    this.statusMsg.set(`Subiendo WOD a ${this.selectedLocation().toUpperCase()}...`);
    this.statusColor.set('#fff');

    set(ref(this.db, dbPath), cleanedData)
      .then(() => {
        this.isPublishing.set(false);
        this.statusMsg.set(`¡WOD PUBLICADO CON ÉXITO EN ${this.selectedLocation().toUpperCase()}!`);
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
      // Si el texto incluye separadores de día (------------------------Lunes---------------------------)
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
      // Bloques separados por doble salto de línea
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

  public goToTv(): void {
    this.router.navigate(['/']);
  }
}
