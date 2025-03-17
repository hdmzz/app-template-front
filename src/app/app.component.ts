import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isMenuOpen = false;
  currentUser: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Vérifier si nous venons d'une redirection OAuth
    if (window.location.href.includes('access_token') || 
        window.location.href.includes('#')) {
          
      console.log('Détection de paramètres de redirection OAuth');
      const isAuthenticated = await this.authService.handleRedirectResult();
      
      if (isAuthenticated) {
        // Authentifié avec succès, rediriger vers le tableau de bord
        this.router.navigate(['/dashboard']);
      }
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // Fermer le menu si on clique ailleurs sur la page
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const menuButton = document.getElementById('menu-button');
    if (menuButton && !menuButton.contains(event.target as Node) && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/login']);
  }
}
