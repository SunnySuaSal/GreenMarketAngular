import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Product } from '../../models/green-market.models';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-xl bg-white p-4 shadow">
        <h2 class="text-2xl font-semibold">Panel Admin</h2>
        <p class="mt-2 text-gray-600">Productos activos: {{ store.products().length }}</p>
        <p class="text-gray-600">Pedidos registrados: {{ store.orders().length }}</p>

        <div class="mt-4 flex flex-wrap gap-3 text-sm">
          <span class="rounded-full bg-gray-100 px-3 py-1">Pendientes: {{ store.ordersPendingCount() }}</span>
          <span class="rounded-full bg-gray-100 px-3 py-1">Confirmados: {{ store.ordersConfirmedCount() }}</span>
          <span class="rounded-full bg-gray-100 px-3 py-1">Entregados: {{ store.ordersDeliveredCount() }}</span>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow">
        <h3 class="mb-3 text-lg font-semibold">Administrar productos</h3>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-3 md:col-span-2">
            <div class="text-sm font-medium text-gray-700">
              {{ isEditing ? 'Editar producto' : 'Agregar producto' }}
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Nombre</span>
                <input
                  name="name"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.name"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Precio (USD)</span>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.price"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Imagen URL</span>
                <input
                  name="image"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.image"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Stock</span>
                <input
                  name="stock"
                  type="number"
                  step="1"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.stock"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Categoría</span>
                <input
                  name="category"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.category"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Vendedor</span>
                <input
                  name="seller"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.seller"
                />
              </label>

              <label class="grid gap-1 sm:col-span-2">
                <span class="text-xs font-medium text-gray-700">Descripción</span>
                <textarea
                  name="description"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  rows="2"
                  [(ngModel)]="form.description"
                ></textarea>
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Rating</span>
                <input
                  name="rating"
                  type="number"
                  step="0.1"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.rating"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-xs font-medium text-gray-700">Reviews</span>
                <input
                  name="reviews"
                  type="number"
                  step="1"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  [(ngModel)]="form.reviews"
                />
              </label>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
              @if (!isEditing) {
                <button
                  type="button"
                  class="btn-primary"
                  (click)="addProduct()"
                  [disabled]="!canSave()"
                >
                  Agregar
                </button>
              } @else {
                <button
                  type="button"
                  class="btn-primary"
                  (click)="saveProduct()"
                  [disabled]="!canSave()"
                >
                  Guardar cambios
                </button>
                <button type="button" class="btn-nav" (click)="cancelEdit()">Cancelar</button>
              }
              @if (saveMessage) {
                <span class="self-center text-sm text-gray-700">{{ saveMessage }}</span>
              }
            </div>
          </div>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-gray-600">
              <tr>
                <th class="p-2">Producto</th>
                <th class="p-2">Categoría</th>
                <th class="p-2">Precio</th>
                <th class="p-2">Stock</th>
                <th class="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (product of store.products(); track product.id) {
                <tr class="border-t">
                  <td class="p-2">
                    <div class="font-medium">{{ product.name }}</div>
                    <div class="text-xs text-gray-500">{{ product.seller }}</div>
                  </td>
                  <td class="p-2 text-gray-700">{{ product.category }}</td>
                  <td class="p-2 text-gray-700">{{ product.price | currency: 'USD' }}</td>
                  <td class="p-2 text-gray-700">{{ product.stock }}</td>
                  <td class="p-2">
                    <div class="flex flex-wrap gap-2">
                      <button type="button" class="btn-secondary" (click)="store.adjustProductStock(product.id, -1)">-</button>
                      <button type="button" class="btn-secondary" (click)="store.adjustProductStock(product.id, 1)">+</button>
                      <button type="button" class="btn-nav" (click)="startEdit(product)">Editar</button>
                      <button type="button" class="btn-nav" (click)="deleteProduct(product.id)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow">
        <h3 class="mb-3 text-lg font-semibold">Pedidos</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-gray-600">
              <tr>
                <th class="p-2">Pedido</th>
                <th class="p-2">Fecha</th>
                <th class="p-2">Estado</th>
                <th class="p-2">Total</th>
                <th class="p-2">Items</th>
                <th class="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (order of store.orders(); track order.id) {
                <tr class="border-t">
                  <td class="p-2">#{{ order.id }}</td>
                  <td class="p-2 text-gray-700">{{ order.date }}</td>
                  <td class="p-2 text-gray-700 capitalize">{{ order.status }}</td>
                  <td class="p-2 text-gray-700">{{ order.total | currency: 'USD' }}</td>
                  <td class="p-2 text-gray-700">{{ order.items.length }}</td>
                  <td class="p-2">
                    <div class="flex flex-wrap gap-2">
                      @if (order.status === 'pending') {
                        <button
                          type="button"
                          class="btn-primary px-3 py-1 text-sm"
                          (click)="store.setOrderStatus(order.id, 'confirmed')"
                        >
                          Confirmar
                        </button>
                      }
                      @if (order.status === 'confirmed') {
                        <button
                          type="button"
                          class="btn-primary px-3 py-1 text-sm"
                          (click)="store.setOrderStatus(order.id, 'delivered')"
                        >
                          Entregado
                        </button>
                      }
                      @if (order.status !== 'pending' && order.status !== 'confirmed') {
                        <span class="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                          Listo
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class AdminComponent {
  readonly store = inject(GreenMarketStore);

  // Estado local del formulario (admin CRUD).
  isEditing = false;
  editingId: string | null = null;
  saveMessage: string | null = null;

  form: Omit<Product, 'id'> = {
    name: '',
    price: 0,
    image: '',
    category: '',
    seller: '',
    description: '',
    stock: 0,
    rating: 4.7,
    reviews: 0,
  };

  canSave(): boolean {
    return (
      !!this.form.name.trim() &&
      this.form.price >= 0 &&
      !!this.form.category.trim() &&
      !!this.form.seller.trim()
    );
  }

  startEdit(product: Product): void {
    this.isEditing = true;
    this.editingId = product.id;
    this.saveMessage = null;
    this.form = {
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      seller: product.seller,
      description: product.description,
      stock: product.stock,
      rating: product.rating,
      reviews: product.reviews,
    };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.saveMessage = null;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      name: '',
      price: 0,
      image: '',
      category: '',
      seller: '',
      description: '',
      stock: 0,
      rating: 4.7,
      reviews: 0,
    };
  }

  addProduct(): void {
    this.saveMessage = null;
    if (!this.canSave()) {
      this.saveMessage = 'Completa nombre, precio, categoría y vendedor.';
      return;
    }
    this.store.addProduct(this.form);
    this.saveMessage = 'Producto agregado.';
    this.resetForm();
  }

  saveProduct(): void {
    if (!this.editingId) return;
    if (!this.canSave()) {
      this.saveMessage = 'Completa nombre, precio, categoría y vendedor.';
      return;
    }
    this.store.updateProduct(this.editingId, this.form);
    this.saveMessage = 'Cambios guardados.';
    this.isEditing = false;
    this.editingId = null;
    this.resetForm();
  }

  deleteProduct(productId: string): void {
    const ok = confirm('¿Eliminar este producto?');
    if (!ok) return;

    this.store.deleteProduct(productId);

    if (this.editingId === productId) {
      this.isEditing = false;
      this.editingId = null;
      this.resetForm();
    }
  }
}
