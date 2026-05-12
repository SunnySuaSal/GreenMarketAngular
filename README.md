
# GreenMarket Web App Mockups (Angular)

App Angular + Vite basada en [GreenMarket Web App Mockups (Figma)](https://www.figma.com/design/OemZL9baeD1TUtTdPu5Yoi/GreenMarket-Web-App-Mockups).

## Estructura

- `src/app/app.component.ts` — shell con navegación y `<router-outlet>`
- `src/app/app.config.ts` — `provideRouter`, `provideHttpClient`
- `src/app/app.routes.ts` — rutas y guards
- `src/app/services/green-market.store.ts` — estado con **Angular Signals** y sincronización con la API
- `src/app/pages/*` — una página por pantalla (login, catálogo, carrito, etc.)
- `src/app/guards/*` — `auth`, `guest`, `role`
- `server/` — API **Express + Mongoose** (MongoDB): productos y pedidos

## Base de datos (MongoDB)

1. **Levantar MongoDB** (requiere Docker):

   ```bash
   npm run db:up
   ```

2. **Variables de entorno** (opcional): copia `server/.env.example` a `server/.env` y ajusta `MONGODB_URI` o `PORT` si lo necesitas.

3. **Sembrar productos de demo**:

   ```bash
   npm run db:seed
   ```

4. **Iniciar la API** (puerto 4000 por defecto):

   ```bash
   npm run api
   ```

En desarrollo, Vite hace **proxy** de `/api` hacia `http://localhost:4000`, así que con `npm run dev` las peticiones del front llegan al backend sin CORS extra.

Si la API no está disponible al cargar la app, el catálogo sigue funcionando con los datos mock en memoria.

## Ejecutar el front

```bash
npm i
npm run dev
```

Flujo típico en dos terminales: `npm run api` y `npm run dev`.
