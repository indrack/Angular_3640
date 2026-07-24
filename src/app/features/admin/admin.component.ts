import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, Auth, User } from 'firebase/auth';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../core/config/firebase.config';
import { WodItem, DayWods, DayName } from '../../core/models/wod.model';
import { WODS_DATA } from '../../core/data/wods.data';
import { CelebrationConfig, CELEBRATION_PRESETS, DEFAULT_CELEBRATION_CONFIG, CelebrationPresetKey } from '../../core/models/celebration.model';
import { AuditLogService } from '../../core/services/audit-log.service';
import { CelebrationService } from '../../core/services/celebration.service';
import { WeeklyWodService } from '../../core/services/weekly-wod.service';

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
        <button class="btn-action" [disabled]="isSubmitting() || lockoutSeconds() > 0" (click)="login()">
          {{ lockoutSeconds() > 0 ? 'Bloqueado (' + lockoutSeconds() + 's)' : (isSubmitting() ? 'Entrando...' : 'Iniciar Sesión') }}
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
        <h2 style="color:#fff; margin-bottom:5px;">SELECCIONA SEDE</h2>
        <p style="color:#888; font-size:0.85em; margin-bottom:25px;">
          Sesión activa: <b style="color:#00e5ff;">{{ currentUserEmail() }}</b>
        </p>

        <div class="selection-card" (click)="selectLocation('calacoto')">
          <h3>CALACOTO (TV 8)</h3>
          <p>Control Remoto Botón 8</p>
        </div>

        <div class="selection-card" (click)="selectLocation('miraflores')">
          <h3>MIRAFLORES (TV 7)</h3>
          <p>Control Remoto Botón 7</p>
        </div>

        <div *ngIf="isSuperAdmin()" class="selection-card weekly-card" (click)="openWeeklyManager()">
          <h3 style="color:#00e5ff;">📅 WODS DE LA SEMANA</h3>
          <p>Ver rutina actual por días, editar o importar .TXT semanal</p>
        </div>

        <div *ngIf="isCelebrationAdmin()" class="selection-card celebration-card" (click)="openCelebrationManager()">
          <h3 style="color:#ffd700;">🎉 CELEBRACIONES Y FESTIVIDADES</h3>
          <p>Aniversario, Navidad, San Valentín, Festividades y PNG Personalizado</p>
        </div>

        <div class="selection-card" style="border-color:#39ff14;" (click)="openAuditLogs()">
          <h3 style="color:#39ff14;">📜 HISTORIAL DE CAMBIOS</h3>
          <p>Registro de auditoría de actividad y modificaciones del sistema</p>
        </div>

        <button class="btn-action" style="margin-top:15px; background:#00e5ff; color:#000; font-weight:bold;" (click)="showLiveSimulator.set(true)">
          👁️ Probar en Simulador TV en Vivo
        </button>

        <button class="btn-action" style="margin-top:15px; background:#cc3333;" (click)="logout()">
          🚪 Cerrar Sesión
        </button>
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

      <!-- STEP 5: WEEKLY MANAGER -->
      <div *ngIf="step() === 'weekly'" class="admin-container editor-container">
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

        <button class="btn-action btn-secondary" (click)="step.set('location')">
          ⬅️ Volver a Selección de Sede
        </button>
      </div>

      <!-- STEP 7: CELEBRATIONS & HOLIDAYS MANAGER -->
      <div *ngIf="step() === 'celebration'" class="admin-container editor-container">
        <h2 style="color:#ffd700; margin-bottom:10px;">🎉 GESTOR DE CELEBRACIONES Y OVERLAYS</h2>
        <p style="color:#aaa; font-size:0.9em; margin-bottom:20px;">
          Configura banners animados festivos para mostrar en todas las TVs del Box (Exclusivo para asvins25).
        </p>

        <!-- ENABLE / DISABLE TOGGLE -->
        <div class="input-group" style="background:rgba(255,215,0,0.1); padding:15px; border-radius:8px; border:1px solid #ffd700;">
          <label style="display:flex; align-items:center; gap:12px; font-weight:bold; cursor:pointer; font-size:1.1em; color:#fff;">
            <input type="checkbox" [(ngModel)]="celebrationForm.enabled" style="width:22px; height:22px;">
            <span>{{ celebrationForm.enabled ? '🟢 Celebración ACTIVADA en Pantalla' : '🔴 Celebración DESACTIVADA' }}</span>
          </label>
        </div>

        <!-- PRESETS GRID -->
        <div class="input-group" style="margin-top:20px;">
          <label style="font-weight:bold; color:#fff; display:block; margin-bottom:10px;">Elige una Festividad o Preset:</label>
          <div class="presets-grid">
            <div *ngFor="let p of celebrationPresets" 
                 class="preset-item" 
                 [class.active]="celebrationForm.presetKey === p.key"
                 (click)="selectCelebrationPreset(p.key)">
              <span class="preset-icon-sm">{{ p.icon }}</span>
              <span class="preset-name">{{ p.name }}</span>
            </div>
          </div>
        </div>

        <!-- CUSTOM TITLE AND SUBTITLE EDITORS -->
        <div class="input-group" style="margin-top:15px;">
          <label style="color:#aaa;">Título en Pantalla:</label>
          <input type="text" [(ngModel)]="celebrationForm.title" class="count-input" style="width:100%; font-size:1.1em; padding:10px; margin-top:5px;" placeholder="Título festivo...">
        </div>

        <div class="input-group">
          <label style="color:#aaa;">Subtítulo o Mensaje Especial:</label>
          <input type="text" [(ngModel)]="celebrationForm.subtitle" class="count-input" style="width:100%; font-size:1.1em; padding:10px; margin-top:5px;" placeholder="Mensaje para los atletas...">
        </div>

        <!-- CUSTOM PNG FILE UPLOAD (IF PRESET IS CUSTOM) -->
        <div *ngIf="celebrationForm.presetKey === 'custom'" class="input-group" style="background:rgba(0,229,255,0.08); padding:15px; border-radius:8px; border:1px solid #00e5ff;">
          <label style="font-weight:bold; color:#00e5ff; display:block; margin-bottom:8px;">Subir Imagen PNG Personalizada (Fondo Transparente):</label>
          <input type="file" (change)="onCustomPngUpload($event)" accept="image/png,image/webp,image/jpeg" style="margin-bottom:10px;">
          <div *ngIf="celebrationForm.customImageUrl" style="margin-top:10px; text-align:center;">
            <p style="color:#aaa; font-size:0.8em; margin-bottom:5px;">Vista previa de imagen cargada:</p>
            <img [src]="celebrationForm.customImageUrl" style="max-height:120px; object-fit:contain;" alt="Preview">
            <br>
            <button class="btn-remove-compact" style="margin-top:5px;" (click)="celebrationForm.customImageUrl = ''">✕ Quitar Imagen</button>
          </div>
        </div>

        <!-- TIMING CONTROLS (CUSTOM FREQUENCY & DURATION) -->
        <div class="input-group" style="margin-top:20px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; text-align:left;">
          <div>
            <label style="color:#ffd700; font-weight:bold; display:block; margin-bottom:5px;">Frecuencia de Aparición (Segundos):</label>
            <input type="number" [(ngModel)]="celebrationForm.intervalSeconds" min="5" max="7200" class="count-input" style="width:100%; padding:10px; font-size:1em;" placeholder="Ej: 300 (5 min)">
            <p style="color:#aaa; font-size:0.8em; margin-top:4px;">
              {{ (celebrationForm.intervalSeconds || 0) >= 60 ? 'Aparece cada ' + ((celebrationForm.intervalSeconds || 0) / 60).toFixed(1) + ' minuto(s)' : 'Aparece cada ' + (celebrationForm.intervalSeconds || 0) + ' segundo(s)' }}
            </p>
            <div style="display:flex; gap:5px; margin-top:6px; flex-wrap:wrap;">
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 60">1 min</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 180">3 min</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 300">5 min</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.intervalSeconds = 600">10 min</button>
            </div>
          </div>

          <div>
            <label style="color:#ffd700; font-weight:bold; display:block; margin-bottom:5px;">Duración en Pantalla (Segundos):</label>
            <input type="number" [(ngModel)]="celebrationForm.durationSeconds" min="1" max="300" class="count-input" style="width:100%; padding:10px; font-size:1em;" placeholder="Ej: 8 (8 seg)">
            <p style="color:#aaa; font-size:0.8em; margin-top:4px;">Permanece visible {{ celebrationForm.durationSeconds || 0 }} segundo(s)</p>
            <div style="display:flex; gap:5px; margin-top:6px; flex-wrap:wrap;">
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 5">5 seg</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 8">8 seg</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 12">12 seg</button>
              <button class="btn-remove-compact" style="background:#222; border:1px solid #444; border-radius:4px; padding:2px 6px; font-size:0.75em; color:#ddd;" (click)="celebrationForm.durationSeconds = 20">20 seg</button>
            </div>
          </div>
        </div>

        <!-- POSITION SELECTOR -->
        <div class="input-group" style="text-align:left;">
          <label style="color:#aaa; display:block; margin-bottom:5px;">Posición en Pantalla:</label>
          <select [(ngModel)]="celebrationForm.position" class="count-input" style="width:100%; padding:10px; background:#222; color:#fff;">
            <option value="top">Superior Centro (Recomendado)</option>
            <option value="center">Centro Flotante</option>
            <option value="bottom">Inferior Centro</option>
          </select>
        </div>

        <!-- SAVE BUTTON -->
        <button class="btn-action" style="background:#ffd700; color:#000; font-weight:bold; margin-top:20px;" [disabled]="isPublishing()" (click)="saveCelebrationToFirebase()">
          ☁️ {{ isPublishing() ? 'GUARDANDO...' : 'GUARDAR Y ACTIVAR CELEBRACIÓN EN TODAS LAS TVs' }}
        </button>

        <div *ngIf="statusMsg()" class="status-msg" [style.color]="statusColor()">
          {{ statusMsg() }}
        </div>

        <button class="btn-action btn-secondary" (click)="step.set('location')">
          ⬅️ Volver a Selección de Sede
        </button>
      </div>

      <!-- STEP 8: AUDIT LOGS SECTION -->
      <div *ngIf="step() === 'audit_logs'" class="admin-container editor-container">
        <h2 style="color:#39ff14; margin-bottom:10px;">📜 HISTORIAL DE CAMBIOS Y ACTIVIDAD</h2>
        <p style="color:#aaa; font-size:0.9em; margin-bottom:20px;">
          Registro de auditoría de todas las modificaciones realizadas en el sistema.
        </p>

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
          <div *ngIf="auditLogService.logs().length === 0" style="color:#666; padding:20px;">
            No hay registros de actividad aún.
          </div>
        </div>

        <button class="btn-action btn-secondary" style="margin-top:20px;" (click)="step.set('location')">
          ⬅️ Volver a Selección de Sede
        </button>
      </div>

      <!-- LIVE TV SIMULATOR OVERLAY MODAL -->
      <div *ngIf="showLiveSimulator()" class="simulator-modal-overlay">
        <div class="simulator-window">
          <div class="simulator-header">
            <span>📺 SIMULADOR DE PANTALLA TV EN VIVO (VISTA PREVIA)</span>
            <button class="btn-close-sim" (click)="showLiveSimulator.set(false)">✕ Cerrar</button>
          </div>

          <div class="simulator-frame">
            <div class="simulated-tv-screen">
              <div class="sim-header">
                <span class="sim-date">Jueves, 24 de Julio</span>
                <span class="sim-time" style="color:#39ff14;">10:45 AM</span>
                <span class="sim-badge">SEDE MIRAFLORES - 1 / 3</span>
              </div>

              <div class="sim-body">
                <h3 style="color:#ff0000; font-size:2em; margin-bottom:10px;">METCON (TIEMPO)</h3>
                <p style="font-size:1.3em; line-height:1.4;">
                  <strong>AMRAP 12'</strong><br>
                  15 Wall Balls<br>
                  12 Kettlebell Swings (<span style="color:#39ff14; font-weight:bold;">24/16 kg</span>)<br>
                  9 Burpees Over Box
                </p>
              </div>

              <!-- Simulación de Banner de Celebración si está activo -->
              <div *ngIf="celebrationService.config().enabled" class="sim-celebration-banner">
                <ng-container *ngIf="celebrationService.config().presetKey === 'custom'">
                  <img *ngIf="celebrationService.config().customImageUrl" [src]="celebrationService.config().customImageUrl" class="sim-custom-icon" alt="Icon">
                </ng-container>
                <ng-container *ngIf="celebrationService.config().presetKey !== 'custom'">
                  <span style="font-size:1.6em;">{{ getCelebrationIcon() }}</span>
                </ng-container>
                <div>
                  <strong style="color:#ffd700; display:block;">{{ celebrationService.config().title }}</strong>
                  <span style="color:#ddd; font-size:0.85em;">{{ celebrationService.config().subtitle }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-mode {
      min-height: 100vh;
      width: 100%;
      box-sizing: border-box;
      background: #000;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 15px;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      user-select: text;
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

    .weekly-card {
      border-color: #00e5ff !important;
    }
    .weekly-card:hover {
      box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
    }

    .day-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      margin-bottom: 20px;
    }

    .day-tab-btn {
      background: #111;
      border: 1px solid #333;
      color: #aaa;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85em;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .day-tab-btn.active {
      background: #0088cc;
      color: #fff;
      border-color: #00e5ff;
      box-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
    }

    .block-count-badge {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 0.75em;
    }

    .compact-day-card {
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 15px;
      text-align: left;
    }

    .compact-day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #222;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .compact-day-header h3 {
      margin: 0;
      color: #00e5ff;
      font-size: 1.1em;
    }

    .empty-day-msg {
      color: #666;
      font-style: italic;
      text-align: center;
      padding: 20px 0;
    }

    .compact-block-item {
      background: #121212;
      border: 1px solid #282828;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .block-badge-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .block-type-badge {
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid;
      white-space: nowrap;
    }

    .compact-title-input {
      flex: 1;
      padding: 6px 10px;
      font-size: 0.9em;
      font-weight: bold;
      background: #000;
      border: 1px solid #333;
    }

    .compact-content-textarea {
      width: 100%;
      height: 75px;
      padding: 8px;
      font-size: 0.85em;
      background: #000;
      border: 1px solid #222;
      color: #ddd;
    }

    .btn-remove-compact {
      background: none;
      border: none;
      color: #666;
      font-size: 1.1em;
      cursor: pointer;
      padding: 0 5px;
    }
    .btn-remove-compact:hover { color: #ff4444; }

    .celebration-card {
      border-color: #ffd700 !important;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }

    .preset-item {
      background: rgba(30, 30, 30, 0.8);
      border: 1px solid #444;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .preset-item:hover {
      border-color: #ffd700;
      transform: translateY(-2px);
    }

    .preset-item.active {
      border-color: #ffd700;
      background: rgba(255, 215, 0, 0.18);
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
    }

    .preset-icon-sm {
      font-size: 1.8em;
    }

    .preset-name {
      font-size: 0.78em;
      color: #ddd;
    }

    .audit-log-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
      text-align: left;
      margin-top: 15px;
    }

    .audit-log-card {
      background: #111;
      border: 1px solid #333;
      border-left: 4px solid #39ff14;
      border-radius: 6px;
      padding: 12px;
    }

    .audit-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8em;
      color: #888;
      margin-bottom: 6px;
    }

    .audit-action {
      font-weight: bold;
      color: #fff;
      font-size: 0.95em;
    }

    .audit-details {
      font-size: 0.85em;
      color: #aaa;
      margin-top: 4px;
    }

    .simulator-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .simulator-window {
      background: #111;
      border: 1px solid #00e5ff;
      border-radius: 12px;
      width: 100%;
      max-width: 700px;
      box-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
      overflow: hidden;
    }

    .simulator-header {
      background: #1a1a1a;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333;
      font-weight: bold;
      color: #00e5ff;
      font-size: 0.9em;
    }

    .btn-close-sim {
      background: none;
      border: none;
      color: #ff4444;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
    }

    .simulator-frame {
      padding: 20px;
      background: #000;
      display: flex;
      justify-content: center;
    }

    .simulated-tv-screen {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #050505;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 15px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .sim-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75em;
      color: #aaa;
    }

    .sim-body {
      text-align: center;
      margin: auto 0;
    }

    .sim-celebration-banner {
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid #ffd700;
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      width: max-content;
      max-width: 90%;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
      z-index: 10;
    }

    .sim-custom-icon {
      height: 48px;
      width: auto;
      max-width: 100px;
      object-fit: contain;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
  `]
})
export class AdminComponent implements OnInit {
  public step = signal<'login' | 'loading' | 'location' | 'mode' | 'count' | 'editor' | 'weekly' | 'celebration' | 'audit_logs'>('loading');
  public selectedLocation = signal<'miraflores' | 'calacoto'>('miraflores');
  public selectedMode = signal<'new' | 'append'>('append');

  public currentUserEmail = signal<string>('');
  public isSuperAdmin = computed<boolean>(() => {
    const email = this.currentUserEmail().toLowerCase();
    return email === 'admincross@gmail.com' || email === 'asvins25@gmail.com';
  });
  public isCelebrationAdmin = computed<boolean>(() => this.currentUserEmail().toLowerCase() === 'asvins25@gmail.com');

  public auditLogService = inject(AuditLogService);
  public celebrationService = inject(CelebrationService);
  public weeklyWodService = inject(WeeklyWodService);
  public showLiveSimulator = signal<boolean>(false);

  public email = '';
  public password = '';
  public showPassword = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public loginError = signal<string>('');

  public slideCount = 1;
  public slides: WodItem[] = [];

  public showTxtImport = signal<boolean>(false);
  public rawTxtInput = '';

  public daysList: DayName[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  public selectedWeeklyDay = signal<DayName>('lunes');
  public weeklyWodsData: DayWods = JSON.parse(JSON.stringify(WODS_DATA));
  public showWeeklyTxtImport = signal<boolean>(false);
  public rawWeeklyTxt = '';

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
        if (user && user.email) {
          this.currentUserEmail.set(user.email);
          this.step.set('location');
        } else {
          this.currentUserEmail.set('');
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

  private getFriendlyErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por favor intenta más tarde por seguridad.';
      case 'auth/network-request-failed':
        return 'Error de conexión a internet. Verifica tu red.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      default:
        return 'No se pudo iniciar sesión. Por favor verifica tus datos e intenta de nuevo.';
    }
  }

  public remainingAttempts = signal<number>(5);
  public lockoutSeconds = signal<number>(0);
  private lockoutTimer: any = null;

  public login(): void {
    if (!this.auth) return;
    if (this.lockoutSeconds() > 0) {
      this.loginError.set(`Acceso bloqueado por seguridad. Espera ${this.lockoutSeconds()} segundos.`);
      return;
    }

    this.loginError.set('');
    this.isSubmitting.set(true);

    setPersistence(this.auth, browserSessionPersistence)
      .then(() => signInWithEmailAndPassword(this.auth!, this.email, this.password))
      .then((userCredential) => {
        this.isSubmitting.set(false);
        this.remainingAttempts.set(5);
        this.lockoutSeconds.set(0);
        if (this.lockoutTimer) clearInterval(this.lockoutTimer);
        if (userCredential.user && userCredential.user.email) {
          this.currentUserEmail.set(userCredential.user.email);
        }
      })
      .catch((error) => {
        this.isSubmitting.set(false);
        this.handleFailedAttempt(error.code || '');
      });
  }

  private handleFailedAttempt(errorCode: string): void {
    if (errorCode === 'auth/network-request-failed') {
      this.loginError.set('Error de conexión a internet. Verifica tu red.');
      return;
    }

    const current = this.remainingAttempts() - 1;
    this.remainingAttempts.set(current);

    if (current > 0) {
      const plural = current === 1 ? 'intento' : 'intentos';
      this.loginError.set(`Correo o contraseña incorrectos. Te ${current === 1 ? 'queda' : 'quedan'} ${current} ${plural}.`);
    } else {
      this.startLockoutTimer(60);
    }
  }

  private startLockoutTimer(seconds: number): void {
    this.lockoutSeconds.set(seconds);
    this.loginError.set(`Demasiados intentos fallidos. Botón bloqueado por ${seconds} segundos por seguridad.`);

    if (this.lockoutTimer) clearInterval(this.lockoutTimer);
    this.lockoutTimer = setInterval(() => {
      const remaining = this.lockoutSeconds() - 1;
      if (remaining <= 0) {
        clearInterval(this.lockoutTimer);
        this.lockoutSeconds.set(0);
        this.remainingAttempts.set(5);
        this.loginError.set('Ya puedes intentar iniciar sesión nuevamente.');
      } else {
        this.lockoutSeconds.set(remaining);
        this.loginError.set(`Demasiados intentos fallidos. Botón bloqueado por ${remaining} segundos por seguridad.`);
      }
    }, 1000);
  }

  public logout(): void {
    if (this.auth) {
      signOut(this.auth).then(() => {
        this.currentUserEmail.set('');
        this.email = '';
        this.password = '';
        this.loginError.set('');
        this.step.set('login');
      }).catch(() => {
        this.currentUserEmail.set('');
        this.step.set('login');
      });
    } else {
      this.step.set('login');
    }
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

  public openWeeklyManager(): void {
    if (!this.isSuperAdmin()) {
      alert('Acceso restringido: Esta opción solo está disponible para Administradores de Rutinas Semanales.');
      return;
    }
    this.statusMsg.set('');
    if (this.db) {
      get(ref(this.db, 'weeklyWods')).then(snapshot => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          this.weeklyWodsData = val;
        }
        this.step.set('weekly');
      }).catch(() => {
        this.step.set('weekly');
      });
    } else {
      this.step.set('weekly');
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
    const raw = this.rawWeeklyTxt.trim();
    const daysMap: { [key: string]: DayName } = {
      'domingo': 'domingo', 'lunes': 'lunes', 'martes': 'martes',
      'miercoles': 'miercoles', 'miércoles': 'miercoles',
      'jueves': 'jueves', 'viernes': 'viernes', 'sabado': 'sabado', 'sábado': 'sabado'
    };

    const daySeparatorRegex = /-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/g;
    const newWeeklyData: DayWods = {
      domingo: [], lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: []
    };

    if (daySeparatorRegex.test(raw)) {
      const parts = raw.split(/-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}/);
      for (let i = 1; i < parts.length; i += 2) {
        const dayRaw = parts[i].trim().toLowerCase();
        const dayKey = daysMap[dayRaw];
        if (!dayKey) continue;

        const dayContent = parts[i + 1] ? parts[i + 1].trim() : '';
        if (!dayContent) continue;

        const lines = dayContent.split('\n');
        const headerRegex = /^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY|Strength|Skill|Finisher)(\s*\(.*?\))?$/i;

        let curTitle: string | null = null;
        let curLines: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (headerRegex.test(trimmed)) {
            if (curTitle !== null) {
              newWeeklyData[dayKey].push({ titulo: curTitle, contenido: curLines.join('\n').trim() });
              curLines = [];
            }
            curTitle = trimmed;
          } else {
            if (curTitle === null && trimmed) {
              curTitle = 'WOD';
            }
            if (curTitle !== null) {
              curLines.push(line);
            }
          }
        }

        if (curTitle !== null) {
          newWeeklyData[dayKey].push({ titulo: curTitle, contenido: curLines.join('\n').trim() });
        }
      }

      this.weeklyWodsData = newWeeklyData;
      this.statusMsg.set('¡Rutina semanal parseada correctamente! Revisa las pestañas arriba.');
      this.statusColor.set('#00ff00');
      this.showWeeklyTxtImport.set(false);
    } else {
      alert('Formato no reconocido. Usa delimitadores como ------------------------Lunes---------------------------');
    }
  }

  public saveWeeklyWodsToFirebase(): void {
    if (!this.db) return;
    this.isPublishing.set(true);
    this.statusMsg.set('Publicando rutina semanal a Firebase...');
    this.statusColor.set('#fff');

    set(ref(this.db, 'weeklyWods'), this.weeklyWodsData)
      .then(() => {
        this.isPublishing.set(false);
        this.statusMsg.set('¡RUTINA SEMANAL PUBLICADA EN TV EN VIVO CON ÉXITO!');
        this.statusColor.set('#00ff00');
      })
      .catch((err) => {
        this.isPublishing.set(false);
        this.statusMsg.set(`Error: ${err.message}`);
        this.statusColor.set('orange');
      });
  }

  public copyWeeklyTsCode(): void {
    const tsLines: string[] = ["import { DayWods } from '../models/wod.model';\n"];
    tsLines.push("export const WODS_DATA: DayWods = {");

    const daysOrder: DayName[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    for (const day of daysOrder) {
      const items = this.weeklyWodsData[day] || [];
      tsLines.push(`  ${day}: [`);
      for (const item of items) {
        const title = item.titulo.replace(/'/g, "\\'");
        const content = item.contenido.replace(/`/g, '\\`').replace(/\${/g, '\\${');
        tsLines.push("    {");
        tsLines.push(`      titulo: '${title}',`);
        tsLines.push(`      contenido: \`${content}\``);
        tsLines.push("    },");
      }
      tsLines.push("  ],");
    }
    tsLines.push("};\n");

    const fullCode = tsLines.join('\n');
    navigator.clipboard.writeText(fullCode).then(() => {
      alert('¡Código TypeScript copiado al portapapeles!');
    }).catch(err => {
      alert('Error copiando: ' + err);
    });
  }

  public celebrationPresets = CELEBRATION_PRESETS;
  public celebrationForm: CelebrationConfig = JSON.parse(JSON.stringify(DEFAULT_CELEBRATION_CONFIG));

  public openCelebrationManager(): void {
    if (!this.isCelebrationAdmin()) {
      alert('Acceso restringido: El módulo de celebraciones es exclusivo para el usuario asvins25@gmail.com');
      return;
    }
    this.statusMsg.set('');
    if (this.db) {
      get(ref(this.db, 'celebrationConfig')).then(snapshot => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          this.celebrationForm = val;
        }
        this.step.set('celebration');
      }).catch(() => {
        this.step.set('celebration');
      });
    } else {
      this.step.set('celebration');
    }
  }

  public selectCelebrationPreset(key: CelebrationPresetKey): void {
    this.celebrationForm.presetKey = key;
    const preset = CELEBRATION_PRESETS.find(p => p.key === key);
    if (preset) {
      this.celebrationForm.title = preset.title;
      this.celebrationForm.subtitle = preset.subtitle;
    }
  }

  public onCustomPngUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.celebrationForm.customImageUrl = e.target?.result as string || '';
      };
      reader.readAsDataURL(file);
    }
  }

  public openAuditLogs(): void {
    this.auditLogService.fetchRecentLogs();
    this.step.set('audit_logs');
  }

  public saveCelebrationToFirebase(): void {
    if (!this.isCelebrationAdmin()) {
      alert('Acceso restringido: No tienes permisos para guardar la configuración de celebraciones.');
      return;
    }
    this.isPublishing.set(true);
    this.statusMsg.set('Guardando configuración de celebración en Firebase...');

    this.celebrationService.saveConfig(this.celebrationForm, this.currentUserEmail())
      .then(() => {
        this.isPublishing.set(false);
        this.statusMsg.set('¡CONFIGURACIÓN DE CELEBRACIÓN PUBLICADA EN TODAS LAS TVs CON ÉXITO!');
        this.statusColor.set('#00ff00');
      })
      .catch((err) => {
        this.isPublishing.set(false);
        this.statusMsg.set(`Error: ${err.message}`);
        this.statusColor.set('orange');
      });
  }

  public getCelebrationIcon(): string {
    const key = this.celebrationService.config().presetKey;
    const preset = this.celebrationPresets.find(p => p.key === key);
    return preset ? preset.icon : '🎉';
  }

  public goToTv(): void {
    this.router.navigate(['/']);
  }
}
