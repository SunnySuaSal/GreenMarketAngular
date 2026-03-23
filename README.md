
# GreenMarket Web App Mockups (Angular)

This is an Angular + Vite version of GreenMarket Web App Mockups. The original project is available at https://www.figma.com/design/OemZL9baeD1TUtTdPu5Yoi/GreenMarket-Web-App-Mockups.

## Estructura

- `src/app/app.component.ts` — shell con navegación y `<router-outlet>`
- `src/app/app.config.ts` — `provideRouter`
- `src/app/app.routes.ts` — rutas y guards
- `src/app/services/green-market.store.ts` — estado con **Angular Signals**
- `src/app/pages/*` — una página por pantalla (login, catálogo, carrito, etc.)
- `src/app/guards/*` — `auth`, `guest`, `role`

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.
  