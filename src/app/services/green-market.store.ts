import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type { CartItem, Order, Product, UserRole } from '../models/green-market.models';

@Injectable({ providedIn: 'root' })
export class GreenMarketStore {
  private readonly http = inject(HttpClient);

  readonly userRole = signal<UserRole>('guest');
  readonly cart = signal<CartItem[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly products = signal<Product[]>(MOCK_PRODUCTS.map((p) => ({ ...p })));

  /** Si la API respondió al cargar productos, las mutaciones van a MongoDB vía REST. */
  private readonly useBackend = signal(false);

  readonly cartCount = computed(() => this.cart().length);
  readonly cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  readonly totalSold = computed(() =>
    this.orders()
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + order.total, 0),
  );

  readonly ordersPendingCount = computed(() =>
    this.orders().filter((o) => o.status === 'pending').length,
  );
  readonly ordersConfirmedCount = computed(() =>
    this.orders().filter((o) => o.status === 'confirmed').length,
  );
  readonly ordersDeliveredCount = computed(() =>
    this.orders().filter((o) => o.status === 'delivered').length,
  );

  constructor() {
    this.refreshProducts();
    this.refreshOrders();
  }

  private refreshProducts(): void {
    this.http.get<Product[]>('/api/products').subscribe({
      next: (list) => {
        this.products.set(list);
        this.useBackend.set(true);
      },
      error: () => {
        this.products.set(MOCK_PRODUCTS.map((p) => ({ ...p })));
        this.useBackend.set(false);
      },
    });
  }

  private refreshOrders(): void {
    this.http.get<Order[]>('/api/orders').subscribe({
      next: (list) => this.orders.set(list),
      error: () => {},
    });
  }

  login(role: UserRole): void {
    this.userRole.set(role);
  }

  logout(): void {
    this.userRole.set('guest');
    this.cart.set([]);
  }

  addToCart(product: Product): void {
    this.cart.update((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  }

  clearCart(): void {
    this.cart.set([]);
  }

  updateCartQuantity(productId: string, quantity: number): void {
    this.cart.update((items) => {
      if (quantity <= 0) {
        return items.filter((item) => item.id !== productId);
      }
      return items.map((item) => (item.id === productId ? { ...item, quantity } : item));
    });
  }

  /** Pedido local (sin API / datos mock). */
  private placeOrderLocal(): string | null {
    const items = this.cart();
    if (items.length === 0) {
      return null;
    }

    for (const item of items) {
      this.adjustProductStockLocal(item.id, -item.quantity);
    }

    const total = this.cartTotal();
    const newOrder: Order = {
      id: Math.random().toString(36).slice(2, 9),
      date: new Date().toLocaleDateString(),
      items: [...items],
      total,
      status: 'pending',
    };
    this.orders.update((currentOrders) => [...currentOrders, newOrder]);
    this.cart.set([]);
    return newOrder.id;
  }

  /**
   * Confirma el pedido. Si la API está activa, persiste en MongoDB y actualiza stock en servidor.
   */
  placeOrder(): Observable<string | null> {
    const items = this.cart();
    if (items.length === 0) {
      return of(null);
    }

    if (!this.useBackend()) {
      return of(this.placeOrderLocal());
    }

    const payload = {
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    return this.http.post<Order>('/api/orders', payload).pipe(
      tap(() => {
        this.cart.set([]);
        this.refreshProducts();
        this.refreshOrders();
      }),
      map((order) => order.id),
      catchError(() => of(null)),
    );
  }

  private adjustProductStockLocal(productId: string, delta: number): void {
    this.products.update((items) =>
      items.map((product) => {
        if (product.id !== productId) return product;
        const next = Math.max(0, product.stock + delta);
        return { ...product, stock: next };
      }),
    );
  }

  adjustProductStock(productId: string, delta: number): void {
    if (!this.useBackend()) {
      this.adjustProductStockLocal(productId, delta);
      return;
    }

    this.http.patch<Product>(`/api/products/${encodeURIComponent(productId)}/stock`, { delta }).subscribe({
      next: (updated) => {
        this.products.update((list) =>
          list.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
        );
      },
      error: () => this.adjustProductStockLocal(productId, delta),
    });
  }

  setOrderStatus(orderId: string, status: Order['status']): void {
    if (!this.useBackend()) {
      this.orders.update((orders) =>
        orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
      );
      return;
    }

    this.http
      .patch<Order>(`/api/orders/${encodeURIComponent(orderId)}/status`, { status })
      .subscribe({
        next: (o) => {
          this.orders.update((orders) => orders.map((x) => (x.id === o.id ? o : x)));
        },
        error: () => {
          this.orders.update((orders) =>
            orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
          );
        },
      });
  }

  addProduct(product: Omit<Product, 'id'>): void {
    if (!this.useBackend()) {
      const id = Math.random().toString(36).slice(2, 10);
      this.products.update((items) => [...items, { ...product, id }]);
      return;
    }

    this.http.post<Product>('/api/products', product).subscribe({
      next: (p) => this.products.update((items) => [...items, p]),
      error: () => {
        const id = Math.random().toString(36).slice(2, 10);
        this.products.update((items) => [...items, { ...product, id }]);
      },
    });
  }

  updateProduct(productId: string, changes: Partial<Product>): void {
    if (!this.useBackend()) {
      this.products.update((items) =>
        items.map((product) =>
          product.id === productId
            ? {
                ...product,
                ...changes,
                id: productId,
              }
            : product,
        ),
      );
      return;
    }

    this.http.patch<Product>(`/api/products/${encodeURIComponent(productId)}`, changes).subscribe({
      next: (updated) => {
        this.products.update((items) =>
          items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
        );
      },
      error: () => {
        this.products.update((items) =>
          items.map((product) =>
            product.id === productId ? { ...product, ...changes, id: productId } : product,
          ),
        );
      },
    });
  }

  deleteProduct(productId: string): void {
    if (!this.useBackend()) {
      this.products.update((items) => items.filter((p) => p.id !== productId));
      return;
    }

    this.http.delete(`/api/products/${encodeURIComponent(productId)}`).subscribe({
      next: () => {
        this.products.update((items) => items.filter((p) => p.id !== productId));
      },
      error: () => {
        this.products.update((items) => items.filter((p) => p.id !== productId));
      },
    });
  }
}
