# Backend (SimulaBank)

Este directorio contiene el backend de SimulaBank: una API REST construida con Node.js y Express

## Objetivo

Proveer todos los servicios del lado servidor (API, acceso a base de datos, envío de correos, manejo de tokens, validaciones, seguridad, etc.) para ser consumidos por el frontend.

## Tecnologías principales

- Node.js (CommonJS)
- Express
- MySQL (mysql2)
- Autenticación: JSON Web Tokens (jsonwebtoken)
- Hash de passwords: bcryptjs
- Uploads: multer
- Envío de correos: nodemailer
- Seguridad: helmet, express-rate-limit, xss-clean, cors
- Logging: winston, morgan
- Variables de entorno: dotenv + dotenv-safe
- Herramientas de desarrollo: nodemon, eslint, prettier

## Estructura relevante

- `server.js` - punto de entrada que carga `src/app` y arranca el servidor.
- `src/` - código fuente principal.
  - `config/` - configuración de base de datos (`database.config.js`) y otros adaptadores.
  - `routes/` - definición de rutas (ej.: `auth.simple.routes.js`, `productos.routes.js`).
  - `controllers/`, `services/`, `middlewares/`, `utils/` - lógica, servicios y utilidades.
- `database/` - scripts/SQL y diagramas (en la raíz del repo hay un folder con DDL ejemplo).

## Requisitos previos

- Node.js (recomendada v18+)
- npm (recomendada v9+)
- MySQL accesible (o configure la URL/credenciales en variables de entorno)
- (Opcional) Redis si desea usar el `tokenService` con `REDIS_URL`.

## Instalación

Abrir una terminal en `backend/` y ejecutar:

```powershell
npm install
```
