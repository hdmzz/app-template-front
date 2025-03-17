import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone:true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private authService: AuthService) {}
  async googleConnection() {
    await this.authService.loginGoogle();
  }
}
