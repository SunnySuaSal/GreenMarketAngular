import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { GreenMarketStore } from '../../services/green-market.store';

interface StatusSlice {
  key: 'pending' | 'confirmed' | 'delivered';
  label: string;
  count: number;
  percent: number;
  barClass: string;
  badgeClass: string;
}

interface TopProductRow {
  name: string;
  units: number;
  revenue: number;
  percent: number;
}

interface CategoryRow {
  name: string;
  revenue: number;
  percent: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CurrencyPipe, PercentPipe],
  template: `
    <section class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-green-700">Panel administrativo</p>
          <h2 class="text-3xl font-bold text-gray-900">Reportes</h2>
          <p class="mt-1 text-gray-600">Resumen de ventas, pedidos e inventario en tiempo real.</p>
        </div>
        <button type="button" class="btn-primary text-sm" (click)="store.refreshOrders()">
          Actualizar datos
        </button>
      </div>

      <!-- KPI cards -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="report-kpi report-kpi--hero sm:col-span-2 xl:col-span-1">
          <div class="report-kpi__icon" aria-hidden="true">$</div>
          <div>
            <p class="report-kpi__label">Total vendido</p>
            <p class="report-kpi__value">{{ store.totalSold() | currency: 'USD' }}</p>
            <p class="report-kpi__hint">Pedidos entregados</p>
          </div>
        </article>

        <article class="report-kpi">
          <div class="report-kpi__icon report-kpi__icon--blue" aria-hidden="true">#</div>
          <div>
            <p class="report-kpi__label">Pedidos totales</p>
            <p class="report-kpi__value">{{ ordersTotal() }}</p>
            <p class="report-kpi__hint">{{ store.ordersPendingCount() }} pendientes</p>
          </div>
        </article>

        <article class="report-kpi">
          <div class="report-kpi__icon report-kpi__icon--amber" aria-hidden="true">Ø</div>
          <div>
            <p class="report-kpi__label">Ticket promedio</p>
            <p class="report-kpi__value">{{ averageOrder() | currency: 'USD' }}</p>
            <p class="report-kpi__hint">Por pedido registrado</p>
          </div>
        </article>

        <article class="report-kpi">
          <div class="report-kpi__icon report-kpi__icon--violet" aria-hidden="true">▦</div>
          <div>
            <p class="report-kpi__label">Productos activos</p>
            <p class="report-kpi__value">{{ store.products().length }}</p>
            <p class="report-kpi__hint">{{ lowStockCount() }} con stock bajo</p>
          </div>
        </article>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Estado de pedidos -->
        <article class="rounded-2xl bg-white p-5 shadow">
          <h3 class="text-lg font-semibold text-gray-900">Estado de pedidos</h3>
          <p class="mt-1 text-sm text-gray-500">Distribución del pipeline de entregas</p>

          @if (ordersTotal() === 0) {
            <p class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Aún no hay pedidos registrados.</p>
          } @else {
            <div class="mt-6 space-y-4">
              @for (slice of statusSlices(); track slice.key) {
                <div>
                  <div class="mb-1 flex items-center justify-between text-sm">
                    <span class="font-medium text-gray-800">{{ slice.label }}</span>
                    <span class="text-gray-600">
                      {{ slice.count }}
                      <span class="text-gray-400">({{ slice.percent | percent: '1.0-0' }})</span>
                    </span>
                  </div>
                  <div class="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      class="h-full rounded-full transition-all duration-500 {{ slice.barClass }}"
                      [style.width.%]="slice.percent * 100"
                    ></div>
                  </div>
                </div>
              }
            </div>

            <div class="mt-6 flex flex-wrap gap-2">
              @for (slice of statusSlices(); track slice.key) {
                <span class="rounded-full px-3 py-1 text-xs font-medium {{ slice.badgeClass }}">
                  {{ slice.label }}: {{ slice.count }}
                </span>
              }
            </div>
          }
        </article>

        <!-- Ventas por categoría -->
        <article class="rounded-2xl bg-white p-5 shadow">
          <h3 class="text-lg font-semibold text-gray-900">Ventas por categoría</h3>
          <p class="mt-1 text-sm text-gray-500">Ingresos según líneas de pedido</p>

          @if (categoryRows().length === 0) {
            <p class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Sin datos de ventas por categoría.</p>
          } @else {
            <ul class="mt-6 space-y-4">
              @for (row of categoryRows(); track row.name) {
                <li>
                  <div class="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span class="font-medium text-gray-800">{{ row.name }}</span>
                    <span class="shrink-0 text-gray-600">{{ row.revenue | currency: 'USD' }}</span>
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                      [style.width.%]="row.percent * 100"
                    ></div>
                  </div>
                </li>
              }
            </ul>
          }
        </article>
      </div>

      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Top productos -->
        <article class="rounded-2xl bg-white p-5 shadow lg:col-span-2">
          <h3 class="text-lg font-semibold text-gray-900">Productos más vendidos</h3>
          <p class="mt-1 text-sm text-gray-500">Por unidades en todos los pedidos</p>

          @if (topProducts().length === 0) {
            <p class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Sin ventas registradas.</p>
          } @else {
            <ol class="mt-6 space-y-4">
              @for (row of topProducts(); track row.name; let i = $index) {
                <li class="flex gap-3">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    [class]="rankClass(i)"
                  >
                    {{ i + 1 }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <p class="truncate font-medium text-gray-900">{{ row.name }}</p>
                      <span class="shrink-0 text-sm text-gray-600">{{ row.units }} u.</span>
                    </div>
                    <p class="text-xs text-gray-500">{{ row.revenue | currency: 'USD' }} en ventas</p>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full bg-green-500"
                        [style.width.%]="row.percent * 100"
                      ></div>
                    </div>
                  </div>
                </li>
              }
            </ol>
          }
        </article>

        <!-- Pedidos recientes -->
        <article class="rounded-2xl bg-white p-5 shadow lg:col-span-3">
          <h3 class="text-lg font-semibold text-gray-900">Pedidos recientes</h3>
          <p class="mt-1 text-sm text-gray-500">Últimos movimientos del marketplace</p>

          @if (store.orders().length === 0) {
            <p class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No hay pedidos para mostrar.</p>
          } @else {
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[520px] text-left text-sm">
                <thead class="border-b text-gray-500">
                  <tr>
                    <th class="py-2 pr-3 font-medium">Pedido</th>
                    <th class="py-2 pr-3 font-medium">Cliente</th>
                    <th class="py-2 pr-3 font-medium">Estado</th>
                    <th class="py-2 pr-3 font-medium">Items</th>
                    <th class="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of recentOrders(); track order.id) {
                    <tr class="border-b border-gray-50 last:border-0">
                      <td class="py-3 pr-3">
                        <span class="font-mono text-xs text-gray-500">#{{ shortId(order.id) }}</span>
                        <div class="text-gray-700">{{ order.date }}</div>
                      </td>
                      <td class="py-3 pr-3 text-gray-800">{{ order.customerUsername ?? '—' }}</td>
                      <td class="py-3 pr-3">
                        <span class="report-status" [attr.data-status]="order.status">
                          {{ statusLabel(order.status) }}
                        </span>
                      </td>
                      <td class="py-3 pr-3 text-gray-700">{{ order.items.length }}</td>
                      <td class="py-3 text-right font-semibold text-gray-900">
                        {{ order.total | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      </div>

      <!-- Ingresos en pipeline -->
      <article class="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Ingresos en pipeline</h3>
            <p class="mt-1 text-sm text-gray-600">
              Suma de pedidos pendientes y confirmados (aún no entregados).
            </p>
          </div>
          <p class="text-2xl font-bold text-green-700">{{ pipelineRevenue() | currency: 'USD' }}</p>
        </div>
      </article>
    </section>
  `,
})
export class ReportsComponent implements OnInit {
  readonly store = inject(GreenMarketStore);

  readonly ordersTotal = computed(() => this.store.orders().length);

  readonly averageOrder = computed(() => {
    const orders = this.store.orders();
    if (orders.length === 0) return 0;
    return orders.reduce((sum, o) => sum + o.total, 0) / orders.length;
  });

  readonly pipelineRevenue = computed(() =>
    this.store
      .orders()
      .filter((o) => o.status === 'pending' || o.status === 'confirmed')
      .reduce((sum, o) => sum + o.total, 0),
  );

  readonly statusSlices = computed((): StatusSlice[] => {
    const total = this.ordersTotal();
    const pending = this.store.ordersPendingCount();
    const confirmed = this.store.ordersConfirmedCount();
    const delivered = this.store.ordersDeliveredCount();

    const mk = (
      key: StatusSlice['key'],
      label: string,
      count: number,
      barClass: string,
      badgeClass: string,
    ): StatusSlice => ({
      key,
      label,
      count,
      percent: total === 0 ? 0 : count / total,
      barClass,
      badgeClass,
    });

    return [
      mk('pending', 'Pendientes', pending, 'bg-amber-400', 'bg-amber-100 text-amber-800'),
      mk('confirmed', 'Confirmados', confirmed, 'bg-blue-500', 'bg-blue-100 text-blue-800'),
      mk('delivered', 'Entregados', delivered, 'bg-green-500', 'bg-green-100 text-green-800'),
    ];
  });

  readonly topProducts = computed((): TopProductRow[] => {
    const totals = new Map<string, { units: number; revenue: number }>();

    for (const order of this.store.orders()) {
      for (const item of order.items) {
        const prev = totals.get(item.name) ?? { units: 0, revenue: 0 };
        totals.set(item.name, {
          units: prev.units + item.quantity,
          revenue: prev.revenue + item.price * item.quantity,
        });
      }
    }

    const rows = [...totals.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const maxUnits = rows[0]?.units ?? 1;
    return rows.map((row) => ({
      ...row,
      percent: row.units / maxUnits,
    }));
  });

  readonly categoryRows = computed((): CategoryRow[] => {
    const totals = new Map<string, number>();

    for (const order of this.store.orders()) {
      for (const item of order.items) {
        const cat = item.category || 'Sin categoría';
        totals.set(cat, (totals.get(cat) ?? 0) + item.price * item.quantity);
      }
    }

    const rows = [...totals.entries()]
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const max = rows[0]?.revenue ?? 1;
    return rows.map((row) => ({
      ...row,
      percent: row.revenue / max,
    }));
  });

  readonly recentOrders = computed(() => this.store.orders().slice(0, 8));

  ngOnInit(): void {
    this.store.refreshOrders();
  }

  lowStockCount(): number {
    return this.store.products().filter((p) => p.stock <= 5).length;
  }

  shortId(id: string): string {
    return id.length > 8 ? id.slice(-8) : id;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      delivered: 'Entregado',
    };
    return labels[status] ?? status;
  }

  rankClass(index: number): string {
    if (index === 0) return 'bg-amber-100 text-amber-800';
    if (index === 1) return 'bg-gray-200 text-gray-700';
    if (index === 2) return 'bg-orange-100 text-orange-800';
    return 'bg-green-50 text-green-700';
  }
}
