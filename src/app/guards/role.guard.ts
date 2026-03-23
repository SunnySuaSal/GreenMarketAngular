import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { UserRole } from '../models/green-market.models';
import { GreenMarketStore } from '../services/green-market.store';

export const roleGuard: CanActivateFn = (route) => {
  const store = inject(GreenMarketStore);
  const router = inject(Router);
  const allowed = route.data['roles'] as UserRole[] | undefined;
  if (!allowed?.length) {
    return true;
  }
  const role = store.userRole();
  if (allowed.includes(role)) {
    return true;
  }
  return router.createUrlTree(['/catalog']);
};
