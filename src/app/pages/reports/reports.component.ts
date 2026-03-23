import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GreenMarketStore } from '../../services/green-market.store';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <section class="rounded-xl bg-white p-4 shadow">
      <h2 class="text-2xl font-semibold">Reportes</h2>
      <p class="mt-2 text-gray-600">Total vendido: {{ store.totalSold() | currency: 'USD' }}</p>
      <div class="mt-4 flex flex-wrap gap-3 text-sm">
        <span class="rounded-full bg-gray-100 px-3 py-1">Pendientes: {{ store.ordersPendingCount() }}</span>
        <span class="rounded-full bg-gray-100 px-3 py-1">Confirmados: {{ store.ordersConfirmedCount() }}</span>
        <span class="rounded-full bg-gray-100 px-3 py-1">Entregados: {{ store.ordersDeliveredCount() }}</span>
      </div>
    </section>
  `,
})
export class ReportsComponent {
  readonly store = inject(GreenMarketStore);
}
