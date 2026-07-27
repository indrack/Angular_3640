import { Injectable, signal, computed } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, Auth, User } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth | null = null;

  public currentUserEmail = signal<string>('');
  public isAuthenticated = computed<boolean>(() => !!this.currentUserEmail());

  public isSuperAdmin = computed<boolean>(() => {
    const email = this.currentUserEmail().toLowerCase().trim();
    if (!email) return false;
    return email === 'asvins25@gmail.com' ||
           email === 'admincross@gmail.com' ||
           email === 'indrack.vargas@gmail.com' ||
           email === 'admin@crossfit3640.com' ||
           email === 'headcoach@crossfit3640.com' ||
           email === 'superadmin@crossfit3640.com';
  });

  public isCelebrationAdmin = computed<boolean>(() => {
    const email = this.currentUserEmail().toLowerCase().trim();
    if (!email) return false;
    return email === 'asvins25@gmail.com' ||
           email.includes('festividades') ||
           email.includes('celebracion') ||
           email.includes('eventos');
  });

  public remainingAttempts = signal<number>(5);
  public lockoutSeconds = signal<number>(0);
  public loginError = signal<string>('');
  public isSubmitting = signal<boolean>(false);
  public isAuthInitialized = signal<boolean>(false);

  private lockoutTimer: any = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase(): void {
    try {
      const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      this.auth = getAuth(app);

      onAuthStateChanged(this.auth, (user: User | null) => {
        if (user && user.email) {
          this.currentUserEmail.set(user.email);
        } else {
          this.currentUserEmail.set('');
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
      }
      return true;
    } catch (error: any) {
      this.isSubmitting.set(false);
      this.handleFailedAttempt(error?.code || '');
      return false;
    }
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

  public async logout(): Promise<void> {
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    this.currentUserEmail.set('');
    this.loginError.set('');
  }
}
