import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
})
export class SignUpComponent implements OnInit{
  signUpForm!: FormGroup;
  errorMessage: null | string = null;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}
  
  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      userName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    })
  }

  async onSubmit() {
    this.signUpForm.markAllAsTouched();

    if (this.signUpForm.invalid) {
      const invalidFields = Object.keys(this.signUpForm.controls)
        .filter(key => this.signUpForm.controls[key].invalid)
        .map(key => {
          const errors = this.signUpForm.controls[key].value;
          return `${key}: ${JSON.stringify(errors)}`;
        });
    
      console.log(`Formulaire invalide. Champs avec erreurs: ${invalidFields.join(', ')}`);
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    try {
      await this.authService.register(this.signUpForm.value)
    } catch (error) {
      this.errorMessage = error as string;
      this.loading = false;

      return
    }

    this.router.navigate(['/dashboard']);
    console.log('Inscription en cours...');
  }
}
