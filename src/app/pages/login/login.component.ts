import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
      <h1 class="mb-3 text-2xl font-bold text-green-700">GreenMarket</h1>

      <div class="mb-4 flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          class="flex-1 rounded-md py-2 font-medium transition"
          [class.bg-white]="mode() === 'login'"
          [class.shadow]="mode() === 'login'"
          (click)="setMode('login')"
        >
          Entrar
        </button>
        <button
          type="button"
          class="flex-1 rounded-md py-2 font-medium transition"
          [class.bg-white]="mode() === 'register'"
          [class.shadow]="mode() === 'register'"
          (click)="setMode('register')"
        >
          Registrarse
        </button>
      </div>

      <p class="mb-4 text-sm text-gray-600">
        @if (mode() === 'login') {
          Ingresa con tu cuenta guardada en la base de datos.
        } @else {
          Crea una cuenta nueva (se guardará en MongoDB).
        }
      </p>

      <form class="grid gap-4" (ngSubmit)="onSubmit()">
        <label class="grid gap-1">
          <span class="text-sm font-medium text-gray-700">Usuario</span>
          <input
            name="username"
            type="text"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
            [(ngModel)]="username"
            autocomplete="username"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm font-medium text-gray-700">Contraseña</span>
          <input
            name="password"
            type="password"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
            [(ngModel)]="password"
            [attr.autocomplete]="mode() === 'register' ? 'new-password' : 'current-password'"
          />
        </label>

        @if (store.lastAuthError()) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ store.lastAuthError() }}</div>
        }

        <button type="submit" class="btn-primary w-full" [disabled]="submitting">
          {{ mode() === 'login' ? 'Entrar' : 'Crear cuenta' }}
        </button>
      </form>
    </section>
  `,
})
export class LoginComponent {
  readonly store = inject(GreenMarketStore);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');

  username = '';
  password = '';
  submitting = false;

  setMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.store.lastAuthError.set(null);
  }

  onSubmit(): void {
    const username = this.username.trim();
    const password = this.password;

    if (!username || !password) {
      this.store.lastAuthError.set('Debes ingresar usuario y contraseña.');
      return;
    }

    this.submitting = true;
    const request =
      this.mode() === 'login'
        ? this.store.loginWithCredentials(username, password)
        : this.store.register(username, password);

    request.subscribe({
      next: (ok) => {
        this.submitting = false;
        if (ok) {
          const role = this.store.userRole();
          const next = role === 'admin' ? '/admin' : '/catalog';
          void this.router.navigate([next]);
        }
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
