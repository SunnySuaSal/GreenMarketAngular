import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <section>
      <h2 class="mb-4 text-2xl font-semibold">Mis pedidos</h2>
      @if (store.myOrders().length === 0) {
        <p class="rounded-xl bg-white p-4 shadow">No hay pedidos aun.</p>
      } @else {
        <div class="space-y-3">
          @for (order of store.myOrders(); track order.id) {
            <div class="rounded-xl bg-white p-4 shadow">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold">Pedido #{{ order.id }}</h3>
                  <p class="text-sm text-gray-600">Fecha: {{ order.date }}</p>
                  <p class="text-sm text-gray-600">Estado: {{ order.status }}</p>
                </div>
                <strong>{{ order.total | currency: 'USD' }}</strong>
              </div>

              <div class="mt-3">
                <div class="text-sm font-medium text-gray-800">Items</div>
                <div class="mt-2 space-y-2">
                  @for (item of order.items; track item.id) {
                    <div class="flex items-center justify-between gap-4 text-sm">
                      <span class="text-gray-700">
                        {{ item.name }} x {{ item.quantity }}
                      </span>
                      <span class="font-medium text-gray-900">
                        {{ item.price | currency: 'USD' }} c/u
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class OrdersComponent implements OnInit {
  readonly store = inject(GreenMarketStore);

  ngOnInit(): void {
    this.store.refreshOrders();
  }
}
