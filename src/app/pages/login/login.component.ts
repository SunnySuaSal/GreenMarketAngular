import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type { UserRole } from '../../models/green-market.models';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
      <h1 class="mb-3 text-2xl font-bold text-green-700">GreenMarket</h1>
      <p class="mb-6 text-sm text-gray-600">Ingresa usuario y contraseña</p>

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
            autocomplete="current-password"
          />
        </label>

        @if (error) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
        }

        <button type="submit" class="btn-primary w-full">Entrar</button>

        <p class="text-xs text-gray-500">
          Demo: admin/admin para admin (cualquier otro usuario/contraseña válida entra como cliente).
        </p>
      </form>
    </section>
  `,
})
export class LoginComponent {
  private readonly store = inject(GreenMarketStore);
  private readonly router = inject(Router);

  username = '';
  password = '';
  error: string | null = null;

  onSubmit(): void {
    this.error = null;
    const username = this.username.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.error = 'Debes ingresar usuario y contraseña.';
      return;
    }

    let role: UserRole = 'user';
    if (username === 'admin' && password === 'admin') {
      role = 'admin';
    }

    this.store.login(role, username);
    const next = role === 'admin' ? '/admin' : '/catalog';
    void this.router.navigate([next]);
  }
}
