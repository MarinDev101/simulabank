# Estructura `src/app`

Se creó una estructura modular para el frontend siguiendo la propuesta:

- core: servicios globales, auth, interceptor y layout
- components: componentes reutilizables pequeños
- guards: guardias adicionales
- models: interfaces/typedata
- pages: vistas principales (home, products, profile)
- services: servicios globales
- shared: directivas, pipes y validadores
- utils: helpers puros

Cómo probar localmente:

1. En la carpeta `frontend` ejecutar:

```powershell
npm install
npm start
```

2. Abrir http://localhost:5555 (o el puerto mostrado)

Notas:
- Los archivos creados son esqueletos; completa la lógica y agrega pruebas si lo desea.
- Si falta alguna carpeta/archivo específico, dime cuál y lo añado.
