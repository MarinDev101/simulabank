# Uso de environment en Angular

Angular permite definir variables de entorno para diferentes configuraciones (desarrollo, producción, etc.) usando archivos en `src/environments`.

## Archivos principales

- `environment.ts`: configuración para desarrollo.
- `environment.prod.ts`: configuración para producción.

## Ejemplo de uso

1. Define tus variables en los archivos mencionados:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
```

2. Importa y usa las variables en tu código Angular:

```typescript
import { environment } from '../environments/environment';

console.log(environment.apiBaseUrl);
```

3. Angular selecciona el archivo automáticamente según el comando:

- `ng serve` usa `environment.ts`
- `ng build --configuration production` usa `environment.prod.ts`

## Recomendaciones

- No pongas información sensible en estos archivos, ya que el frontend es visible para el usuario.
- Usa las variables para URLs, flags, y configuraciones públicas.
