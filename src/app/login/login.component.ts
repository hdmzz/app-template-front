import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';//pour les requetes
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
  }

  async onSubmit(): Promise<void> {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      console.log("info de connexion invalides");
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    console.log(this.loginForm.value)

    try {
      await this.authService.login(this.loginForm.value);
    } catch (error) {
      this.errorMessage = error as string;
      this.loading = false;
      throw error;
    }
  }

}
