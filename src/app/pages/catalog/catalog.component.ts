import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Product } from '../../models/green-market.models';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section>
      <h2 class="mb-4 text-2xl font-semibold">Catalogo</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (product of store.products(); track product.id) {
          <article class="flex flex-col rounded-xl bg-white p-4 shadow">
            <img [src]="product.image" [alt]="product.name" class="mb-3 h-40 w-full rounded-lg object-cover" />
            <h3 class="font-semibold">{{ product.name }}</h3>
            <p class="text-sm text-gray-600">{{ product.description }}</p>
            <div class="mt-1 flex items-center gap-2 text-sm">
              <span class="text-amber-500" aria-label="Valoración">{{ stars(product.rating) }}</span>
              <span class="text-gray-500">({{ product.reviews }} reseñas)</span>
            </div>
            <div class="mt-2 text-sm text-gray-500">{{ product.seller }} - {{ product.category }}</div>
            <div class="mt-3 flex items-center justify-between">
              <strong>{{ product.price | currency: 'USD' }}</strong>
              @if (store.userRole() === 'user') {
                @if (product.stock > 0) {
                  <button type="button" class="btn-primary px-3 py-1 text-sm" (click)="add(product)">
                    Agregar
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-primary cursor-not-allowed px-3 py-1 text-sm opacity-50"
                    disabled
                  >
                    Agotado
                  </button>
                }
              }
            </div>

            <button
              type="button"
              class="mt-3 text-left text-sm font-medium text-green-700 hover:underline"
              (click)="toggleComments(product.id)"
            >
              {{ expandedId() === product.id ? 'Ocultar comentarios' : 'Ver comentarios' }}
            </button>

            @if (expandedId() === product.id) {
              <div class="mt-3 border-t border-gray-100 pt-3">
                @if (store.getComments(product.id).length === 0) {
                  <p class="text-sm text-gray-500">Sin comentarios aún.</p>
                } @else {
                  <ul class="max-h-40 space-y-2 overflow-y-auto">
                    @for (c of store.getComments(product.id); track c.id) {
                      <li class="rounded-lg bg-gray-50 p-2 text-sm">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-medium text-gray-800">{{ c.username }}</span>
                          <span class="text-amber-500 text-xs">{{ stars(c.rating) }}</span>
                        </div>
                        <p class="mt-1 text-gray-600">{{ c.text }}</p>
                        <p class="mt-1 text-xs text-gray-400">{{ c.createdAt | date: 'short' }}</p>
                      </li>
                    }
                  </ul>
                }

                @if (store.userRole() === 'user') {
                  <form class="mt-3 grid gap-2" (ngSubmit)="submitComment(product.id)">
                    <label class="grid gap-1 text-sm">
                      <span class="font-medium text-gray-700">Tu valoración</span>
                      <select
                        class="rounded-lg border border-gray-200 px-2 py-1"
                        [(ngModel)]="commentRating[product.id]"
                        name="rating-{{ product.id }}"
                      >
                        @for (n of [5, 4, 3, 2, 1]; track n) {
                          <option [value]="n">{{ n }} estrellas</option>
                        }
                      </select>
                    </label>
                    <label class="grid gap-1 text-sm">
                      <span class="font-medium text-gray-700">Comentario</span>
                      <textarea
                        class="rounded-lg border border-gray-200 px-2 py-1"
                        rows="2"
                        [(ngModel)]="commentText[product.id]"
                        name="text-{{ product.id }}"
                        placeholder="Escribe tu opinión..."
                      ></textarea>
                    </label>
                    @if (commentError[product.id]) {
                      <p class="text-xs text-red-600">{{ commentError[product.id] }}</p>
                    }
                    <button type="submit" class="btn-primary text-sm">Publicar comentario</button>
                  </form>
                } @else if (store.userRole() === 'guest') {
                  <p class="mt-2 text-xs text-gray-500">Inicia sesión para dejar un comentario.</p>
                }
              </div>
            }
          </article>
        }
      </div>
    </section>
  `,
})
export class CatalogComponent {
  readonly store = inject(GreenMarketStore);

  readonly expandedId = signal<string | null>(null);
  commentText: Record<string, string> = {};
  commentRating: Record<string, number> = {};
  commentError: Record<string, string> = {};

  add(product: Product): void {
    this.store.addToCart(product);
  }

  stars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  toggleComments(productId: string): void {
    if (this.expandedId() === productId) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(productId);
    if (!this.commentRating[productId]) {
      this.commentRating[productId] = 5;
    }
    this.store.loadComments(productId);
  }

  submitComment(productId: string): void {
    const text = (this.commentText[productId] ?? '').trim();
    const rating = this.commentRating[productId] ?? 5;

    if (!text) {
      this.commentError[productId] = 'Escribe un comentario.';
      return;
    }

    this.commentError[productId] = '';
    this.store.addComment(productId, text, rating).subscribe({
      next: (ok) => {
        if (ok) {
          this.commentText[productId] = '';
          this.commentRating[productId] = 5;
        } else {
          this.commentError[productId] = 'No se pudo publicar el comentario.';
        }
      },
    });
  }
}
