import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GreenMarketStore } from '../services/green-market.store';

/** Si ya hay sesion, no mostrar login. */
export const guestGuard: CanActivateFn = () => {
  const store = inject(GreenMarketStore);
  const router = inject(Router);
  if (store.userRole() === 'guest') {
    return true;
  }
  return router.createUrlTree(['/catalog']);
};
