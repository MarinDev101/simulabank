export function obtenerProductoEspecifico(nombreProducto, listaProductos) {
  if (!nombreProducto || typeof nombreProducto !== 'string') {
    throw new Error('El nombre del producto debe ser una cadena válida');
  }

  if (!listaProductos || typeof listaProductos !== 'object') {
    throw new Error('La lista de productos no es válida');
  }

  const producto = listaProductos[nombreProducto];

  if (!producto) {
    throw new Error(`Producto financiero no encontrado: ${nombreProducto}`);
  }

  return producto;
}

export function obtenerTipoClienteAleatorio(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error('La lista debe ser un arreglo no vacío');
  }
  const indiceAleatorio = Math.floor(Math.random() * lista.length);
  return lista[indiceAleatorio];
}

export function obtenerPerfilPorProducto(nombreProducto, PERFILES_CLIENTES) {
  const perfilesRelacionados = Object.entries(PERFILES_CLIENTES)
    .filter(([, perfil]) =>
      perfil.productos.some((p) => p.toLowerCase().includes(nombreProducto.toLowerCase()))
    )
    .map(([nombre, perfil]) => ({ nombre, ...perfil }));

  if (perfilesRelacionados.length === 0)
    throw new Error(`No se encontró un perfil relacionado con el producto: "${nombreProducto}"`);

  return perfilesRelacionados[Math.floor(Math.random() * perfilesRelacionados.length)];
}
