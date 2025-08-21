# Frontend (SimulaBank)

Este directorio contiene la aplicación frontend del proyecto SimulaBank, creada con Angular (Angular CLI v20.0.1).

## Objetivo

Proveer la interfaz de usuario para SimulaBank.

## Resumen rápido

- Framework: Angular
- Versión recomendada de Angular CLI: 20.0.1
- Lenguaje: TypeScript
- Carpeta principal de código fuente: `src/`

-- Recomendación: usar `npm` (o `pnpm`/`yarn` si el equipo lo prefiere). Las instrucciones abajo usan `npm`.

## Estructura relevante

- `src/` - código fuente de la aplicación Angular.
  - `app/` - componentes, rutas y lógica de la aplicación.
  - `environments/` - configuraciones por entorno (`environment.ts`, `environment.prod.ts`).
- `public/` - activos estáticos (favicon, imágenes, etc.).
- `angular.json`, `package.json`, `tsconfig.*.json` - configuración del proyecto.

## Requisitos previos

- Node.js (recomendada v18+)
- npm (recomendada v9+)
- Angular CLI (global opcional) para generar código: `npm install -g @angular/cli@20`

Si no desea instalar Angular CLI globalmente, puede usar los scripts locales de `package.json` (ej.: `npx ng serve`).

## Instalación

1. Abrir una terminal en `frontend/`.
2. Instalar dependencias:

```powershell
npm install
```

## Comandos útiles

- Iniciar servidor de desarrollo (hot-reload):

```powershell
npm run start
# o
npx ng serve --open
```

Abre la aplicación en `http://localhost:4200/`.

- Construir para producción:

```powershell
npm run build
# o
npx ng build --configuration production
```

Los artefactos se generan en `dist/`.

- Ejecutar tests unitarios (Karma/Jest según configuración):

```powershell
npm test
```

- Ejecutar lint (ESLint):

```powershell
npm run lint
```

- Generar componentes, servicios u otros artefactos con Angular CLI:

```powershell
npx ng generate component nombre-componente
npx ng generate service nombre-servicio
```

Nota: Si el proyecto usa scripts personalizados en `package.json`, utilícelos (`npm run <script>`).

## Configuración de entorno

Variables y endpoints se encuentran en `src/environments/environment.ts` y `environment.prod.ts`.

- Revise y actualice la URL del API/backend según su entorno (desarrollo/producción).
- No suba credenciales al control de versiones. Use un `.env` en el backend o un mecanismo seguro para inyectar secretos.

## Desarrollo local con backend

1. Levante el backend (ver carpeta `backend/` en el repositorio raíz). Normalmente:

```powershell
cd ..\backend
npm install
npm run start
```

2. Iniciar el frontend (`frontend/`) con `npm run start`.

Si el backend corre en otro puerto o dominio, actualice `environment.ts` con la URL correcta y habilite CORS en el backend.

## Consejos para nuevas contribuciones

- Sigue las convenciones de código del proyecto (TypeScript, ESLint).
- Escribe tests unitarios para nuevas funciones o componentes importantes.
- Abre una rama por característica/bug: `feature/<descripcion>` o `fix/<descripcion>`.
- Incluye un pequeño README o notas si añades un módulo complejo.

## Solución de problemas (quick fixes)

- Si la aplicación no compila:
  - Ejecuta `npm install` de nuevo.
  - Verifica la versión de Node (use `node -v`).
  - Revisa errores en la terminal; usualmente faltan tipos o dependencias.

- Si la API no responde desde el frontend:
  - Confirma que el backend está en ejecución.
  - Revisa `environment.ts` para la URL del API.
  - Habilita CORS en el backend para el origen `http://localhost:4200` durante desarrollo.

- Problemas con estilos o assets faltantes:
  - Verifica rutas en `angular.json` y que los archivos existan en `public/` o `src/assets`.

## Recursos y referencias

- Angular CLI: https://angular.dev/cli
- Documentación de Angular: https://angular.io/docs

## Notas finales

Asumí que el proyecto usa `npm` y Angular CLI v20.0.1 (según el README original). Si el equipo usa `yarn` o `pnpm`, puedo añadir los comandos equivalentes y ajustar el README.
