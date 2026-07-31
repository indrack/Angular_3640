import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, Auth, User } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private auth: Auth | null = null;
  private auditLogService = inject(AuditLogService);

  public currentUserEmail = signal<string>('');
  public currentUserId = signal<string>('');
  public isAuthenticated = computed<boolean>(() => !!this.currentUserEmail());

  public isSuperAdmin = computed<boolean>(() => {
    const uid = this.currentUserId();
    return uid ? (environment.adminUids?.superAdmin ?? []).includes(uid) : false;
  });

  public isWeeklyAdmin = computed<boolean>(() => {
    const uid = this.currentUserId();
    return uid ? (environment.adminUids?.weeklyAdmin ?? []).includes(uid) : false;
  });

  public isCelebrationAdmin = computed<boolean>(() => {
    const uid = this.currentUserId();
    return uid ? (environment.adminUids?.celebrationAdmin ?? []).includes(uid) : false;
  });

  public remainingAttempts = signal<number>(5);
  public lockoutSeconds = signal<number>(0);
  public loginError = signal<string>('');
  public isSubmitting = signal<boolean>(false);
  public isAuthInitialized = signal<boolean>(false);

  private lockoutTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initFirebase();
  }

  ngOnDestroy(): void {
    if (this.lockoutTimer) {
      clearInterval(this.lockoutTimer);
      this.lockoutTimer = null;
    }
  }

  private initFirebase(): void {
    try {
      const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      this.auth = getAuth(app);

      onAuthStateChanged(this.auth, (user: User | null) => {
        if (user && user.email) {
          this.currentUserEmail.set(user.email);
          this.currentUserId.set(user.uid);
        } else {
          this.currentUserEmail.set('');
          this.currentUserId.set('');
        }
        this.isAuthInitialized.set(true);
      });
    } catch (e) {
      console.warn('Firebase Auth initialization warning:', e);
      this.isAuthInitialized.set(true);
    }
  }

  public async login(email: string, password: string): Promise<boolean> {
    if (!this.auth) return false;
    if (this.lockoutSeconds() > 0) {
      this.loginError.set(`Acceso bloqueado por seguridad. Espera ${this.lockoutSeconds()} segundos.`);
      return false;
    }

    this.loginError.set('');
    this.isSubmitting.set(true);

    try {
      await setPersistence(this.auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.isSubmitting.set(false);
      this.remainingAttempts.set(5);
      this.lockoutSeconds.set(0);
      if (this.lockoutTimer) clearInterval(this.lockoutTimer);
      if (userCredential.user && userCredential.user.email) {
        this.currentUserEmail.set(userCredential.user.email);
        this.currentUserId.set(userCredential.user.uid);
        await this.auditLogService.logAction(
          userCredential.user.email,
          'Inicio de Sesión',
          'Ingreso exitoso al panel de administración'
        );
      }
      return true;
    } catch (error: any) {
      this.isSubmitting.set(false);
      this.handleFailedAttempt(email, error?.code || '');
      return false;
    }
  }

  private handleFailedAttempt(attemptedEmail: string, errorCode: string): void {
    if (errorCode === 'auth/network-request-failed') {
      this.loginError.set('Error de conexión a internet. Verifica tu red.');
      return;
    }

    const current = this.remainingAttempts() - 1;
    this.remainingAttempts.set(current);

    // Audit log failed attempt asynchronously
    this.auditLogService.logAction(
      attemptedEmail || 'Anónimo',
      'Intento Fallido de Inicio de Sesión',
      `Credenciales incorrectas. Intentos restantes: ${current}`
    ).catch(() => {});

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
        if (this.lockoutTimer) clearInterval(this.lockoutTimer);
        this.lockoutTimer = null;
        this.lockoutSeconds.set(0);
        this.remainingAttempts.set(5);
        this.loginError.set('Ya puedes intentar iniciar sesión nuevamente.');
      } else {
        this.lockoutSeconds.set(remaining);
        this.loginError.set(`Demasiados intentos fallidos. Botón bloqueado por ${remaining} segundos por seguridad.`);
      }
    }, 1000);
  }

  public async logout(): Promise<void> {
    const userEmail = this.currentUserEmail();
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    if (userEmail) {
      await this.auditLogService.logAction(
        userEmail,
        'Cierre de Sesión',
        'Salida del panel de administración'
      );
    }
    this.currentUserEmail.set('');
    this.currentUserId.set('');
    this.loginError.set('');
  }
}
