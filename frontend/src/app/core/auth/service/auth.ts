import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Interfaces
export interface Usuario {
  id: number;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: 'aprendiz' | 'instructor' | 'administrador';
  foto_perfil?: string;
  fecha_nacimiento?: string;
  genero?: string;
  preferencia_tema?: string;
  estado: 'activo' | 'inactivo'; // Cambiar a obligatorio
  fecha_creacion: string; // Cambiar a obligatorio
  ultimo_acceso?: string;
  fecha_actualizacion?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: Usuario;
}

export interface RefreshResponse {
  success: boolean;
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Los services se encargan de la lógica de negocio y comunicación con el backend

  private apiUrl = `${environment.apiBaseUrl}/auth`; // Endpoint del backend. URL base de la API
  private tokenKey = 'access_token'; // clave para almacenar el token
  private refreshTokenKey = 'refresh_token'; // clave para almacenar el refresh token
  private userKey = 'user_data'; // clave para almacenar los datos del usuario
  private rememberKey = 'remember_user'; // clave para saber si se marcó "Recuérdame"

  // Observable para el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Observable para el usuario actual
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuario());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar autenticación al iniciar
    this.checkAuthStatus();
  }

  // ============================================
  // MÉTODOS DE STORAGE (localStorage vs sessionStorage)
  // ============================================

  /**
   * Determina qué storage usar basándose en si el usuario marcó "Recuérdame"
   * - localStorage: persiste después de cerrar el navegador
   * - sessionStorage: se borra al cerrar el navegador/pestaña
   */
  private getStorage(): Storage {
    // Si hay datos en localStorage con remember_user, usar localStorage
    if (localStorage.getItem(this.rememberKey) === 'true') {
      return localStorage;
    }
    // Si hay datos en sessionStorage, usar sessionStorage
    if (sessionStorage.getItem(this.tokenKey)) {
      return sessionStorage;
    }
    // Por defecto, verificar si hay datos en localStorage (para migración)
    if (localStorage.getItem(this.tokenKey)) {
      return localStorage;
    }
    return sessionStorage;
  }

  /**
   * Establece si se debe recordar la sesión
   */
  setRememberMe(remember: boolean): void {
    if (remember) {
      localStorage.setItem(this.rememberKey, 'true');
    } else {
      localStorage.removeItem(this.rememberKey);
    }
  }

  /**
   * Verifica si el usuario marcó "Recuérdame"
   */
  isRememberMe(): boolean {
    return localStorage.getItem(this.rememberKey) === 'true';
  }

  // ============================================
  // MÉTODOS DE AUTENTICACIÓN
  // ============================================

  login(correo: string, contrasena: string, remember: boolean = false): Observable<LoginResponse> {
    // Establecer preferencia de "Recuérdame" ANTES de guardar la sesión
    this.setRememberMe(remember);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { correo, contrasena }).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.setSession(response);
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response.user);
        }
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    return this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearSession();
      }),
      catchError((error) => {
        // Aunque falle, limpiar sesión local
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        if (response.success) {
          const storage = this.getStorage();
          storage.setItem(this.tokenKey, response.token);
          storage.setItem(this.refreshTokenKey, response.refreshToken);
        }
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // GESTIÓN DE SESIÓN
  // ============================================

  private setSession(authResult: LoginResponse): void {
    const storage = this.getStorage();
    storage.setItem(this.tokenKey, authResult.token);
    storage.setItem(this.refreshTokenKey, authResult.refreshToken);
    storage.setItem(this.userKey, JSON.stringify(authResult.user));
  }

  private clearSession(): void {
    // Limpiar ambos storages para asegurar limpieza completa
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.rememberKey);

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);

    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // ============================================
  // MÉTODOS DE VERIFICACIÓN
  // ============================================

  estaAutenticado(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    // Verificar en ambos storages
    return !!(localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey));
  }

  private checkAuthStatus(): void {
    const isAuth = this.hasToken();
    this.isAuthenticatedSubject.next(isAuth);
    if (isAuth) {
      this.currentUserSubject.next(this.obtenerUsuario());
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  getToken(): string | null {
    const storage = this.getStorage();
    return storage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    const storage = this.getStorage();
    return storage.getItem(this.refreshTokenKey);
  }

  obtenerUsuario(): Usuario | null {
    // Buscar en el storage activo
    const storage = this.getStorage();
    const userData = storage.getItem(this.userKey);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  obtenerRol(): string | null {
    const user = this.obtenerUsuario();
    return user?.rol || null;
  }

  obtenerCorreo(): string | null {
  const user = this.obtenerUsuario();
  return user?.correo || null;
}

  // ============================================
  // NAVEGACIÓN SEGÚN ROL
  // ============================================

  navegarSegunRol(usuario?: Usuario): void {
    const user = usuario || this.obtenerUsuario();

    if (!user) {
      this.router.navigate(['/iniciar-sesion']);
      return;
    }

    switch (user.rol) {
      case 'administrador':
        this.router.navigate(['/administrador/inicio']);
        break;
      case 'instructor':
        this.router.navigate(['/instructor/inicio']);
        break;
      case 'aprendiz':
        this.router.navigate(['/aprendiz/inicio']);
        break;
      default:
        this.router.navigate(['/inicio']);
    }
  }

  // ============================================
  // VERIFICACIÓN DE ROLES
  // ============================================

  tieneRol(rolesPermitidos: string[]): boolean {
    const rol = this.obtenerRol();
    return rol ? rolesPermitidos.includes(rol) : false;
  }

  esAdministrador(): boolean {
    return this.obtenerRol() === 'administrador';
  }

  esInstructor(): boolean {
    return this.obtenerRol() === 'instructor';
  }

  esAprendiz(): boolean {
    return this.obtenerRol() === 'aprendiz';
  }
}
