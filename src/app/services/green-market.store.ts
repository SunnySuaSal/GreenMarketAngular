import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type {
  AuthUser,
  CartItem,
  Order,
  Product,
  ProductComment,
  UserRole,
} from '../models/green-market.models';

@Injectable({ providedIn: 'root' })
export class GreenMarketStore {
  private readonly http = inject(HttpClient);

  readonly userRole = signal<UserRole>('guest');
  readonly username = signal('');
  readonly cart = signal<CartItem[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly products = signal<Product[]>(MOCK_PRODUCTS.map((p) => ({ ...p })));
  readonly lastOrderError = signal<string | null>(null);
  readonly lastAuthError = signal<string | null>(null);
  readonly commentsByProduct = signal<Record<string, ProductComment[]>>({});

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

  /** Pedidos visibles para el cliente (filtra por usuario en modo local). */
  readonly myOrders = computed(() => {
    const list = this.orders();
    const name = this.username();
    if (this.userRole() !== 'user' || !name) {
      return list;
    }
    return list.filter((o) => !o.customerUsername || o.customerUsername === name);
  });

  constructor() {
    this.refreshProducts();
  }

  private refreshProducts(): void {
    this.http.get<Product[]>('/api/products').subscribe({
      next: (list) => {
        this.products.set(list);
        this.useBackend.set(true);
        this.syncCartProductIds(list);
        if (this.userRole() !== 'guest') {
          this.refreshOrders();
        }
      },
      error: () => {
        this.products.set(MOCK_PRODUCTS.map((p) => ({ ...p })));
        this.useBackend.set(false);
      },
    });
  }

  refreshOrders(): void {
    const role = this.userRole();
    if (role === 'guest') {
      this.orders.set([]);
      return;
    }

    if (!this.useBackend()) {
      this.orders.set(this.ordersForRoleLocal());
      return;
    }

    const url =
      role === 'user' && this.username()
        ? `/api/orders?customer=${encodeURIComponent(this.username())}`
        : '/api/orders';

    this.http.get<Order[]>(url).subscribe({
      next: (list) => this.orders.set(list),
      error: () => {
        this.orders.set(this.ordersForRoleLocal());
      },
    });
  }

  private ordersForRoleLocal(): Order[] {
    const all = this.orders();
    if (this.userRole() === 'admin') {
      return all;
    }
    const name = this.username();
    if (!name) {
      return [];
    }
    return all.filter((o) => o.customerUsername === name);
  }

  /** Alinea ids del carrito con los de MongoDB tras cargar el catálogo. */
  private syncCartProductIds(products: Product[]): void {
    this.cart.update((items) =>
      items
        .map((item) => {
          const byId = products.find((p) => p.id === item.id);
          if (byId) {
            return { ...byId, quantity: item.quantity };
          }
          const byName = products.find((p) => p.name === item.name);
          if (byName) {
            return { ...byName, quantity: item.quantity };
          }
          return null;
        })
        .filter((item): item is CartItem => item !== null),
    );
  }

  login(role: UserRole, username: string): void {
    this.userRole.set(role);
    this.username.set(username);
    this.refreshOrders();
  }

  logout(): void {
    this.userRole.set('guest');
    this.username.set('');
    this.cart.set([]);
    this.orders.set([]);
    this.lastOrderError.set(null);
    this.lastAuthError.set(null);
    this.commentsByProduct.set({});
  }

  loginWithCredentials(username: string, password: string): Observable<boolean> {
    this.lastAuthError.set(null);
    const name = username.trim().toLowerCase();

    if (!name || !password) {
      this.lastAuthError.set('Usuario y contraseña requeridos');
      return of(false);
    }

    return this.http.post<AuthUser>('/api/auth/login', { username: name, password }).pipe(
      tap((user) => {
        this.useBackend.set(true);
        this.login(user.role, user.username);
        this.refreshProducts();
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          let role: UserRole = 'user';
          if (name === 'admin' && password === 'admin') {
            role = 'admin';
          }
          this.login(role, name);
          return of(true);
        }
        const message =
          typeof err.error?.message === 'string' ? err.error.message : 'No se pudo iniciar sesión';
        this.lastAuthError.set(message);
        return of(false);
      }),
    );
  }

  register(username: string, password: string): Observable<boolean> {
    this.lastAuthError.set(null);
    const name = username.trim().toLowerCase();

    if (!this.useBackend()) {
      this.lastAuthError.set('Registro disponible solo con la API activa');
      return of(false);
    }

    return this.http.post<AuthUser>('/api/auth/register', { username: name, password }).pipe(
      tap((user) => {
        this.useBackend.set(true);
        this.login(user.role, user.username);
        this.refreshProducts();
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        const message =
          typeof err.error?.message === 'string' ? err.error.message : 'No se pudo registrar';
        this.lastAuthError.set(message);
        return of(false);
      }),
    );
  }

  getComments(productId: string): ProductComment[] {
    return this.commentsByProduct()[productId] ?? [];
  }

  loadComments(productId: string): void {
    if (!this.useBackend()) {
      return;
    }

    this.http.get<ProductComment[]>(`/api/products/${encodeURIComponent(productId)}/comments`).subscribe({
      next: (list) => {
        this.commentsByProduct.update((map) => ({ ...map, [productId]: list }));
      },
    });
  }

  addComment(productId: string, text: string, rating: number): Observable<boolean> {
    const username = this.username().trim().toLowerCase();
    if (!username || this.userRole() !== 'user') {
      return of(false);
    }

    if (!this.useBackend()) {
      const comment: ProductComment = {
        id: Math.random().toString(36).slice(2, 10),
        productId,
        username,
        text: text.trim(),
        rating,
        createdAt: new Date().toISOString(),
      };
      this.commentsByProduct.update((map) => ({
        ...map,
        [productId]: [comment, ...(map[productId] ?? [])],
      }));
      this.updateProductRatingLocal(productId);
      return of(true);
    }

    return this.http
      .post<{ comment: ProductComment; product: { id: string; rating: number; reviews: number } }>(
        `/api/products/${encodeURIComponent(productId)}/comments`,
        { username, text: text.trim(), rating },
      )
      .pipe(
        tap(({ comment, product }) => {
          this.commentsByProduct.update((map) => ({
            ...map,
            [productId]: [comment, ...(map[productId] ?? [])],
          }));
          this.products.update((list) =>
            list.map((p) =>
              p.id === product.id ? { ...p, rating: product.rating, reviews: product.reviews } : p,
            ),
          );
        }),
        map(() => true),
        catchError(() => of(false)),
      );
  }

  private updateProductRatingLocal(productId: string): void {
    const comments = this.commentsByProduct()[productId] ?? [];
    const count = comments.length;
    const avg = count === 0 ? 0 : comments.reduce((s, c) => s + c.rating, 0) / count;
    this.products.update((list) =>
      list.map((p) =>
        p.id === productId
          ? { ...p, reviews: count, rating: Math.round(avg * 10) / 10 }
          : p,
      ),
    );
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
    const customer = this.username().trim();
    if (items.length === 0 || !customer) {
      return null;
    }

    for (const item of items) {
      this.adjustProductStockLocal(item.id, -item.quantity);
    }

    const total = this.cartTotal();
    const newOrder: Order = {
      id: Math.random().toString(36).slice(2, 9),
      date: new Date().toLocaleDateString('es-ES'),
      customerUsername: customer,
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
    this.lastOrderError.set(null);
    const items = this.cart();
    const customer = this.username().trim();

    if (items.length === 0) {
      this.lastOrderError.set('El carrito está vacío.');
      return of(null);
    }
    if (!customer) {
      this.lastOrderError.set('Debes iniciar sesión para confirmar el pedido.');
      return of(null);
    }

    if (!this.useBackend()) {
      const id = this.placeOrderLocal();
      if (!id) {
        this.lastOrderError.set('No se pudo registrar el pedido.');
      }
      return of(id);
    }

    const payload = {
      customerUsername: customer,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    return this.http.post<Order>('/api/orders', payload).pipe(
      tap((order) => {
        this.cart.set([]);
        this.orders.update((current) => {
          if (this.userRole() === 'admin') {
            return [order, ...current];
          }
          return [order, ...current.filter((o) => o.customerUsername === customer)];
        });
        this.refreshProducts();
        this.refreshOrders();
      }),
      map((order) => order.id),
      catchError((err: HttpErrorResponse) => {
        const message =
          typeof err.error?.message === 'string'
            ? err.error.message
            : 'No se pudo confirmar el pedido. Comprueba que la API y MongoDB estén activos.';
        this.lastOrderError.set(message);
        return of(null);
      }),
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
