import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  private sessionActiveKey = 'session_active'; // clave para detectar nueva sesión de navegador

  // Para evitar peticiones duplicadas simultáneas
  private isRefreshingProfile = false;
  private lastRefreshTime = 0;
  private readonly MIN_REFRESH_INTERVAL = 2000; // Mínimo 2 segundos entre refreshes

  // Observable para el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Observable para el usuario actual
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuario());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone
  ) {
    // Verificar si debe limpiar sesión (usuario no marcó "Recuérdame" y cerró el navegador)
    this.verificarSesionNavegador();
    // Verificar autenticación al iniciar
    this.checkAuthStatus();
    // Escuchar cambios de autenticación en otras pestañas
    this.listenToStorageChanges();
    // Configurar actualización de perfil en cambios de página y visibilidad
    this.setupProfileAutoRefresh();
  }

  // ============================================
  // AUTO-REFRESH DEL PERFIL
  // ============================================

  /**
   * Configura la actualización automática del perfil cuando:
   * - Se cambia de página (NavigationEnd) - solo en rutas autenticadas
   * - La pestaña vuelve a estar visible
   */
  private setupProfileAutoRefresh(): void {
    // Rutas públicas donde no necesitamos refrescar el perfil
    const rutasPublicas = ['/inicio', '/iniciar-sesion', '/registrarse', '/crear-cuenta', '/recuperar-contrasena'];

    // Flag para ignorar la primera navegación (al cargar la página)
    let isFirstNavigation = true;

    // Actualizar perfil cuando se navega a una nueva página (solo rutas autenticadas)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        const esRutaPublica = rutasPublicas.some((ruta) => navEvent.urlAfterRedirects.startsWith(ruta));

        // Actualizar timestamp de actividad en cada navegación (si está autenticado)
        if (this.estaAutenticado()) {
          localStorage.setItem('last_activity_timestamp', Date.now().toString());
        }

        // Ignorar la primera navegación para evitar refresh innecesario al cargar
        if (isFirstNavigation) {
          isFirstNavigation = false;
          return;
        }

        // Solo refrescar si no es ruta pública
        if (!esRutaPublica) {
          this.refrescarPerfil();
        }
      });

    // Actualizar perfil cuando la pestaña vuelve a estar activa
    // Usamos un timeout para evitar llamadas inmediatas que puedan causar problemas
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Pequeño delay para evitar race conditions al cambiar de pestaña
        setTimeout(() => {
          this.ngZone.run(() => {
            // Verificar que estemos autenticados antes de intentar refrescar
            if (!this.estaAutenticado()) {
              return;
            }

            // Actualizar timestamp de actividad
            localStorage.setItem('last_activity_timestamp', Date.now().toString());

            // Verificar que no estemos en ruta pública
            const urlActual = this.router.url;
            const esRutaPublica = rutasPublicas.some((ruta) => urlActual.startsWith(ruta));

            if (!esRutaPublica) {
              this.refrescarPerfil();
            }
          });
        }, 500);
      }
    });
  }

  /**
   * Refresca el perfil del usuario desde el servidor
   * Incluye protección contra peticiones muy frecuentes
   */
  private refrescarPerfil(): void {
    if (!this.estaAutenticado()) return;
    if (this.isRefreshingProfile) return;

    // Evitar peticiones muy frecuentes (mínimo 2 segundos entre cada una)
    const now = Date.now();
    if (now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL) {
      return;
    }

    this.isRefreshingProfile = true;
    this.lastRefreshTime = now;

    this.obtenerPerfilServidor().subscribe({
      next: () => {
        this.isRefreshingProfile = false;
      },
      error: () => {
        this.isRefreshingProfile = false;
      },
    });
  }

  /**
   * Método público para forzar actualización del perfil
   * Útil para componentes que necesitan datos frescos
   */
  public forzarActualizacionPerfil(): void {
    if (!this.estaAutenticado()) return;

    // Ignorar el intervalo mínimo y el flag de refresh
    this.isRefreshingProfile = false;
    this.lastRefreshTime = 0;
    this.refrescarPerfil();
  }

  // ============================================
  // CONTROL DE SESIÓN POR NAVEGADOR
  // ============================================

  /**
   * Verifica si el usuario cerró el navegador sin "Recuérdame"
   *
   * IMPORTANTE: sessionStorage persiste durante recargas de página pero NO entre
   * sesiones de navegador (cerrar y abrir navegador).
   *
   * Lógica:
   * - Si marcó "Recuérdame" (remember_user = true), la sesión siempre persiste
   * - Si NO marcó "Recuérdame":
   *   - Usamos sessionStorage.browser_session como indicador de sesión de navegador
   *   - Si browser_session no existe pero hay token, significa que el navegador se cerró y reabrió
   *   - En ese caso, limpiamos la sesión
   *
   * NOTA: Al recargar la página, sessionStorage DEBE mantener browser_session.
   * Si por alguna razón no lo tiene, primero lo establecemos para evitar pérdida de sesión.
   */
  private verificarSesionNavegador(): void {
    const browserSession = sessionStorage.getItem('browser_session');
    const rememberMe = localStorage.getItem(this.rememberKey) === 'true';
    const hasToken = localStorage.getItem(this.tokenKey);

    // Si el usuario marcó "Recuérdame", siempre mantener la sesión
    if (rememberMe) {
      // Asegurar que browser_session esté establecido
      sessionStorage.setItem('browser_session', 'true');
      localStorage.setItem(this.sessionActiveKey, 'true');
      return;
    }

    // Si hay token y NO hay browser_session, verificar si es una nueva sesión de navegador
    // o simplemente una recarga de página donde sessionStorage aún no se ha inicializado
    if (hasToken && !browserSession) {
      // Verificar si hay un timestamp de última actividad en localStorage
      // que indique que la sesión estaba activa recientemente
      const lastActivity = localStorage.getItem('last_activity_timestamp');
      const now = Date.now();

      // Si la última actividad fue hace menos de 30 segundos, es probablemente una recarga
      // y no un cierre de navegador. Los navegadores modernos pueden tardar en restaurar sessionStorage.
      if (lastActivity) {
        const timeSinceLastActivity = now - parseInt(lastActivity, 10);
        const THIRTY_SECONDS = 30 * 1000;

        if (timeSinceLastActivity < THIRTY_SECONDS) {
          // Es una recarga reciente, mantener la sesión
          sessionStorage.setItem('browser_session', 'true');
          localStorage.setItem(this.sessionActiveKey, 'true');
          return;
        }
      }

      // Si llegamos aquí, es una nueva sesión de navegador - limpiar
      this.clearSessionSilent();
    }

    // Marcar que esta es una sesión activa del navegador
    // sessionStorage se limpia automáticamente al cerrar el navegador
    sessionStorage.setItem('browser_session', 'true');

    // También marcar en localStorage para que otras pestañas sepan que hay actividad
    localStorage.setItem(this.sessionActiveKey, 'true');

    // Guardar timestamp de actividad para detectar recargas vs nuevo navegador
    localStorage.setItem('last_activity_timestamp', Date.now().toString());
  }

  /**
   * Limpia la sesión sin notificar a los observadores (usado al iniciar)
   */
  private clearSessionSilent(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.rememberKey);
    localStorage.removeItem(this.sessionActiveKey);
    localStorage.removeItem('last_activity_timestamp');

    // Limpiar datos de simulación (evita que persistan entre usuarios)
    localStorage.removeItem('simulacion_activa');
    localStorage.removeItem('estado_simulacion');
    localStorage.removeItem('ultima_sincronizacion');
    localStorage.removeItem('version_estado');
    localStorage.removeItem('simulacion_usuario_id');
  }

  // ============================================
  // SINCRONIZACIÓN ENTRE PESTAÑAS
  // ============================================

  /**
   * Escucha cambios en localStorage desde otras pestañas
   * Esto permite sincronizar el estado de autenticación entre pestañas
   * NOTA: El evento 'storage' SOLO se dispara en OTRAS pestañas, no en la que hace el cambio
   */
  private listenToStorageChanges(): void {
    window.addEventListener('storage', (event) => {
      // Solo reaccionar a cambios en nuestras claves de autenticación
      if (event.key === this.tokenKey) {
        this.ngZone.run(() => {
          const teníaToken = this.isAuthenticatedSubject.getValue();
          const tieneTokenAhora = !!event.newValue;

          if (!teníaToken && tieneTokenAhora) {
            // CASO: No estaba autenticado y ahora sí (otra pestaña hizo login)
            // Recargar la página para que cargue la vista del usuario correctamente
            window.location.reload();
          } else if (teníaToken && !tieneTokenAhora) {
            // CASO: Estaba autenticado y ahora no (otra pestaña hizo logout)
            this.isAuthenticatedSubject.next(false);
            this.currentUserSubject.next(null);
            // Limpiar tema al cerrar sesión
            this.limpiarTema();
            this.router.navigate(['/inicio'], { replaceUrl: true });
          }
        });
      } else if (event.key === this.userKey && this.isAuthenticatedSubject.getValue()) {
        // CASO: Ya autenticado, solo se actualizaron los datos del usuario
        this.ngZone.run(() => {
          const usuarioActualizado = this.obtenerUsuario();
          this.currentUserSubject.next(usuarioActualizado);
          // Aplicar el tema actualizado automáticamente en otras pestañas
          if (usuarioActualizado?.preferencia_tema) {
            this.aplicarTemaUsuario(usuarioActualizado.preferencia_tema);
          }
        });
      }
    });
  }

  // ============================================
  // MÉTODOS DE STORAGE
  // ============================================

  /**
   * Establece si se debe recordar la sesión (para cerrar navegador)
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
          // Aplicar el tema del usuario al iniciar sesión
          this.aplicarTemaUsuario(response.user.preferencia_tema);
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
        this.router.navigate(['/inicio'], { replaceUrl: true });
      }),
      catchError((error) => {
        // Aunque falle, limpiar sesión local y redirigir
        this.clearSession();
        this.router.navigate(['/inicio'], { replaceUrl: true });
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
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.refreshTokenKey, response.refreshToken);
        }
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el perfil actualizado del usuario desde el servidor
   * y actualiza el estado local
   */
  obtenerPerfilServidor(): Observable<{ success: boolean; user: Usuario }> {
    // Si no está autenticado, no hacer petición
    if (!this.estaAutenticado()) {
      return throwError(() => new Error('No autenticado'));
    }

    return this.http.get<{ success: boolean; user: Usuario }>(`${this.apiUrl}/perfil`).pipe(
      tap((response) => {
        if (response.success && response.user) {
          // Actualizar datos en localStorage
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          // Notificar a los observadores
          this.currentUserSubject.next(response.user);
          // Aplicar el tema del usuario cuando se carga el perfil
          this.aplicarTemaUsuario(response.user.preferencia_tema);
        }
      }),
      catchError((error) => {
        console.error('Error al obtener perfil:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // GESTIÓN DE SESIÓN
  // ============================================

  private setSession(authResult: LoginResponse): void {
    // Siempre usar localStorage para compartir entre pestañas
    localStorage.setItem(this.tokenKey, authResult.token);
    localStorage.setItem(this.refreshTokenKey, authResult.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(authResult.user));

    // Establecer marcadores de sesión activa
    sessionStorage.setItem('browser_session', 'true');
    localStorage.setItem(this.sessionActiveKey, 'true');
    localStorage.setItem('last_activity_timestamp', Date.now().toString());
  }

  private clearSession(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.rememberKey);
    localStorage.removeItem(this.sessionActiveKey);
    localStorage.removeItem('last_activity_timestamp');

    // Limpiar datos de simulación (evita que persistan entre usuarios)
    localStorage.removeItem('simulacion_activa');
    localStorage.removeItem('estado_simulacion');
    localStorage.removeItem('ultima_sincronizacion');
    localStorage.removeItem('version_estado');
    localStorage.removeItem('simulacion_usuario_id');

    // Limpiar sessionStorage
    sessionStorage.removeItem('browser_session');

    // Limpiar tema al cerrar sesión (volver al tema claro por defecto)
    this.limpiarTema();

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
    // Solo verificar en localStorage (fuente única de verdad)
    return !!localStorage.getItem(this.tokenKey);
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
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  obtenerUsuario(): Usuario | null {
    const userData = localStorage.getItem(this.userKey);
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
      this.router.navigate(['/inicio'], { replaceUrl: true });
      return;
    }

    switch (user.rol) {
      case 'administrador':
        this.router.navigate(['/administrador/inicio'], { replaceUrl: true });
        break;
      case 'instructor':
        this.router.navigate(['/instructor/inicio'], { replaceUrl: true });
        break;
      case 'aprendiz':
        this.router.navigate(['/aprendiz/inicio'], { replaceUrl: true });
        break;
      default:
        this.router.navigate(['/inicio'], { replaceUrl: true });
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

  // ============================================
  // ACTUALIZACIÓN DE USUARIO
  // ============================================

  /**
   * Actualiza los datos del usuario en el storage y notifica a los observadores
   * @param usuario Datos actualizados del usuario (parciales o completos)
   */
  actualizarUsuario(datosActualizados: Partial<Usuario>): void {
    const usuarioActual = this.obtenerUsuario();
    if (!usuarioActual) return;

    const usuarioNuevo: Usuario = {
      ...usuarioActual,
      ...datosActualizados,
    };

    localStorage.setItem(this.userKey, JSON.stringify(usuarioNuevo));
    this.currentUserSubject.next(usuarioNuevo);
  }

  /**
   * Refresca los datos del usuario desde el storage
   */
  refrescarUsuario(): void {
    const usuario = this.obtenerUsuario();
    this.currentUserSubject.next(usuario);
  }

  // ============================================
  // GESTIÓN DE TEMA
  // ============================================

  /**
   * Actualiza la preferencia de tema del usuario en el servidor
   * @param tema 'claro' | 'oscuro' | 'auto'
   */
  actualizarTemaServidor(tema: 'claro' | 'oscuro' | 'auto'): Observable<{ success: boolean; preferencia_tema: string }> {
    return this.http.put<{ success: boolean; preferencia_tema: string }>(`${this.apiUrl}/actualizar-tema`, { tema }).pipe(
      tap((response) => {
        if (response.success) {
          // Actualizar datos locales del usuario
          this.actualizarUsuario({ preferencia_tema: tema });
        }
      }),
      catchError((error) => {
        console.error('Error al actualizar tema:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aplica el tema guardado del usuario al documento
   * Se llama cuando el usuario inicia sesión o cuando se carga el perfil
   */
  aplicarTemaUsuario(preferenciaTema?: string): void {
    const tema = preferenciaTema || this.obtenerUsuario()?.preferencia_tema;

    if (!tema || tema === 'auto') {
      // Usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTemaDocumento(prefersDark ? 'dark' : 'light');
    } else {
      this.setTemaDocumento(tema === 'oscuro' ? 'dark' : 'light');
    }
  }

  /**
   * Aplica el tema al documento HTML
   */
  private setTemaDocumento(tema: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', tema);
    if (tema === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * Limpia el tema (se usa al cerrar sesión para volver al tema por defecto)
   */
  limpiarTema(): void {
    localStorage.removeItem('theme');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }
}
