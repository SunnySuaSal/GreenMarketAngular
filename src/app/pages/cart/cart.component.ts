import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <section>
      <h2 class="mb-4 text-2xl font-semibold">Carrito</h2>
      @if (store.cart().length === 0) {
        <p class="rounded-xl bg-white p-4 shadow">Tu carrito esta vacio.</p>
      } @else {
        <div class="space-y-3">
          @for (item of store.cart(); track item.id) {
            <div class="rounded-xl bg-white p-4 shadow">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="font-semibold">{{ item.name }}</h3>
                  <p class="text-sm text-gray-600">{{ item.price | currency: 'USD' }} c/u</p>
                  <p class="mt-1 text-sm text-gray-500">
                    Subtotal: {{ item.price * item.quantity | currency: 'USD' }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="btn-secondary" (click)="store.updateCartQuantity(item.id, item.quantity - 1)">
                    -
                  </button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button type="button" class="btn-secondary" (click)="store.updateCartQuantity(item.id, item.quantity + 1)">
                    +
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
        <div class="mt-4 space-y-3 rounded-xl bg-white p-4 shadow">
          <div class="flex items-center justify-between">
            <span>Total</span>
            <strong>{{ store.cartTotal() | currency: 'USD' }}</strong>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn-nav"
              (click)="store.clearCart()"
            >
              Vaciar carrito
            </button>
            <button
              type="button"
              class="btn-primary flex-1 min-w-[180px]"
              (click)="confirm()"
            >
              Confirmar pedido
            </button>
          </div>
        </div>
      }
    </section>
  `,
})
export class CartComponent {
  readonly store = inject(GreenMarketStore);
  private readonly router = inject(Router);

  confirm(): void {
    const id = this.store.placeOrder();
    if (id) {
      void this.router.navigate(['/orders']);
    }
  }
}
