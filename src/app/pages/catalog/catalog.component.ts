import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import type { Product } from '../../models/green-market.models';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <section>
      <h2 class="mb-4 text-2xl font-semibold">Catalogo</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (product of store.products(); track product.id) {
          <article class="rounded-xl bg-white p-4 shadow">
            <img [src]="product.image" [alt]="product.name" class="mb-3 h-40 w-full rounded-lg object-cover" />
            <h3 class="font-semibold">{{ product.name }}</h3>
            <p class="text-sm text-gray-600">{{ product.description }}</p>
            <div class="mt-2 text-sm text-gray-500">{{ product.seller }} - {{ product.category }}</div>
            <div class="mt-3 flex items-center justify-between">
              <strong>{{ product.price | currency: 'USD' }}</strong>
              @if (store.userRole() === 'user') {
                @if (product.stock > 0) {
                  <button
                    type="button"
                    class="btn-primary px-3 py-1 text-sm"
                    (click)="add(product)"
                  >
                    Agregar
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-primary px-3 py-1 text-sm opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Agotado
                  </button>
                }
              }
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class CatalogComponent {
  readonly store = inject(GreenMarketStore);

  add(product: Product): void {
    this.store.addToCart(product);
  }
}
