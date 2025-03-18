// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, tap, throwError, of, finalize } from 'rxjs';
import { environment } from '../../../environement';

export interface User {
  id: string;
  email: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public error: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Erreur lors du chargement de l\'utilisateur stocké:', e);
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post<{user: User, token: string}>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          const { user, token } = response;
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', token);
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          this.error = error.error?.error || 'Erreur lors de la connexion';
          return throwError(() => this.error);
        })
      );
  }

  register(userData: {email: string, password: string, userName: string}): Observable<any> {
    return this.http.post<{user: User, token: string}>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          const { user, token } = response;
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', token);
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          this.error = error.error?.error || 'Erreur lors de l\'inscription';
          return throwError(() => this.error);
        })
      );
  }

  loginGoogle(): Observable<any> {
    // Pour Google OAuth, vous avez deux options :
    // 1. Obtenir un lien de redirection depuis votre backend
    return this.http.get<{redirectUrl: string}>(`${this.apiUrl}/auth/google/url`)
      .pipe(
        tap(response => {
          // Rediriger vers l'URL fournie par le backend
          window.location.href = response.redirectUrl;
        }),
        catchError(error => {
          this.error = error.error?.error || 'Erreur lors de l\'initialisation de l\'authentification Google';
          return throwError(() => this.error);
        })
      );
    
    // 2. Ou rediriger directement sur votre API backend qui gérera OAuth
    // window.location.href = `${this.apiUrl}/auth/google`;
    // return of(null);
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post<{success: boolean}>(`${this.apiUrl}/auth/logout`, { token })
      .pipe(
        finalize(() => {
          // Toujours exécuter ces étapes, même en cas d'erreur
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
          this.currentUserSubject.next(null);
          this.router.navigate(['/login']);
        })
      );
  }

  refreshSession(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(false);
    }
    
    return this.http.post<{user: User}>(`${this.apiUrl}/auth/verify`, {})
      .pipe(
        map(response => {
          const user = response.user;
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return true;
        }),
        catchError(() => {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
          this.currentUserSubject.next(null);
          return of(false);
        })
      );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  async handleRedirectResult(): Promise<boolean> {
    this.currentUserSubject.next({ id: '', email: '', username: 'User' });
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
