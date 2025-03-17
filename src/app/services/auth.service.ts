import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { OAuthResponse, createClient, SupabaseClient } from '@supabase/supabase-js'
import { environment } from '../../../environement';

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public error: string | null = null;

  constructor(private router: Router) {
    this.supabase = createClient(
      environment.SUPABASE_URL as string,
      environment.SUPABASE_KEY as string,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        }
      }
    )
    this.refreshSession().then(isAuthenticated => {
      console.log('État d\'authentification initial:', isAuthenticated);
    });
  }

  async loginGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'email profile',
        },
      });
      
      if (error) throw error;
      
      // La redirection se produit automatiquement ici, donc ce code ne s'exécute pas
      // immédiatement mais est important pour la documentation
      console.log('Redirection vers Google pour authentification...');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'authentification Google:', error);
      throw error;
    }
  }

  async login(userData: {email: string, password: string}) {
    let {data, error} = await this.supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    })

    if (data && data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email as string,
        //@ts-ignore
        username: data.user.user_metadata?.name,
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', data.session?.access_token || '');

      this.currentUserSubject.next(user);
      this.router.navigate(['/dashboard']); 
    }

    if (error) {
      this.error = error.message;
      throw error;
    }
  }

   async register(userData: { email: string; password: string; name: string }) {
    const {data, error} = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (data && data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email as string,
        //@ts-ignore
        username: data.user.user_metadata?.name,
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', data.session?.access_token || '');

      this.currentUserSubject.next(user);
      this.router.navigate(['/dashboard']); 
    }

    if (error) {
      this.error = error.message;
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      
      this.currentUserSubject.next(null);
      
      this.router.navigate(['/login']);

    } catch (error) {
      this.error = "Erreur de deconnexion ?!";
      throw error;
    }
  }

  isAuthenticated(): boolean {  
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  async refreshSession(): Promise<boolean> {
    try {
      // Vérifier d'abord s'il y a une session Supabase active
      const { data: sessionData } = await this.supabase.auth.getSession();
      
      if (sessionData?.session) {
        // Session active trouvée dans Supabase
        const { data: userData } = await this.supabase.auth.getUser();
        
        if (userData?.user) {
          // Créer l'objet utilisateur
          const user: User = {
            id: userData.user.id,
            email: userData.user.email as string,
            //@ts-ignore
            username: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name
          };
          
          // Mettre à jour le stockage et l'état
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', sessionData.session.access_token);
          
          this.currentUserSubject.next(user);
          return true;
        }
      }
      
      // Vérifier ensuite le token Google stocké localement comme fallback
      const tokenOAuth = localStorage.getItem('sb-emjphtvfjcemfkgrjmam-auth-token');
      
      if (tokenOAuth) {
        try {
          const parsedToken = JSON.parse(tokenOAuth);
          if (parsedToken.user) {
            const user: User = {
              id: parsedToken.user.id,
              email: parsedToken.user.email,
              // Selon la structure de votre token, ajustez l'accès aux données
              username: parsedToken.user.user_metadata?.name || 
                      parsedToken.user.identities?.[0]?.identity_data?.full_name ||
                      parsedToken.user.email.split('@')[0]
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', parsedToken.access_token || '');
            
            this.currentUserSubject.next(user);
            return true;
          }
        } catch (e) {
          console.error('Erreur lors du parsing du token OAuth:', e);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return false;
    }
  }

  async handleRedirectResult(): Promise<boolean> {
    try {
      // Cette méthode vérifie si l'URL contient des paramètres de redirection OAuth
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la récupération de la session après redirection:', error);
        return false;
      }
      
      if (data?.session) {
        return await this.refreshSession();
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du traitement de la redirection OAuth:', error);
      return false;
    }
  }
}
