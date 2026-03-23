import { computed, Injectable, signal } from '@angular/core';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type { CartItem, Order, Product, UserRole } from '../models/green-market.models';

@Injectable({ providedIn: 'root' })
export class GreenMarketStore {
  readonly userRole = signal<UserRole>('guest');
  readonly cart = signal<CartItem[]>([]);
  readonly orders = signal<Order[]>([]);
  // Clonamos para que el panel admin pueda editar stock sin mutar el mock original.
  readonly products = signal<Product[]>(MOCK_PRODUCTS.map((p) => ({ ...p })));

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

  /** Crea el pedido, vacia el carrito y devuelve el id del pedido. */
  placeOrder(): string | null {
    const items = this.cart();
    if (items.length === 0) {
      return null;
    }

    // Descontamos stock en el momento de confirmar el pedido.
    for (const item of items) {
      this.adjustProductStock(item.id, -item.quantity);
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

  adjustProductStock(productId: string, delta: number): void {
    this.products.update((items) =>
      items.map((product) => {
        if (product.id !== productId) return product;
        const next = Math.max(0, product.stock + delta);
        return { ...product, stock: next };
      }),
    );
  }

  setOrderStatus(orderId: string, status: Order['status']): void {
    this.orders.update((orders) =>
      orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const id = Math.random().toString(36).slice(2, 10);
    this.products.update((items) => [...items, { ...product, id }]);
  }

  updateProduct(productId: string, changes: Partial<Product>): void {
    this.products.update((items) =>
      items.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...changes,
              id: productId, // Evita que el admin rompa el id.
            }
          : product,
      ),
    );
  }

  deleteProduct(productId: string): void {
    this.products.update((items) => items.filter((p) => p.id !== productId));
  }
}
