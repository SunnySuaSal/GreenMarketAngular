import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { GreenMarketStore } from './services/green-market.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-green-600 text-white p-4 shadow-lg">
        <div class="mx-auto flex max-w-7xl items-center justify-between">
          <div class="text-xl font-bold">GreenMarket</div>

          <div class="flex flex-wrap gap-2">
            @if (store.userRole() === 'guest') {
              <a routerLink="/login" class="btn-nav">Entrar</a>
            } @else {
              <a routerLink="/catalog" class="btn-nav">Catalogo</a>
              @if (store.userRole() === 'user') {
                <a routerLink="/cart" class="btn-nav relative">
                  Carrito
                  @if (store.cartCount() > 0) {
                    <span class="badge">{{ store.cartCount() }}</span>
                  }
                </a>
                <a routerLink="/orders" class="btn-nav">Mis pedidos</a>
              }
              @if (store.userRole() === 'admin') {
                <a routerLink="/admin" class="btn-nav">Admin panel</a>
                <a routerLink="/reports" class="btn-nav">Reportes</a>
              }
              <button type="button" class="btn-nav" (click)="logout()">Salir</button>
            }
          </div>
        </div>
      </nav>

      <main class="mx-auto max-w-7xl p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  readonly store = inject(GreenMarketStore);
  private readonly router = inject(Router);

  logout(): void {
    this.store.logout();
    void this.router.navigate(['/login']);
  }
}
