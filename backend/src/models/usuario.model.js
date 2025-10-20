// Modelo de Usuario para SQL puro
// Este modelo ayuda a mapear objetos JS a la estructura de la tabla `usuarios`

function mapUsuarioToDb(usuario) {
  // Mapea campos desde la API al esquema de la base de datos
  return {
    correo_electronico: usuario.correo_electronico || usuario.correo || usuario.correoElectronico,
    contrasena: usuario.contrasena || usuario.password || usuario.contrasenaHash,
    nombres: usuario.nombres || usuario.nombre || usuario.firstName,
    apellidos: usuario.apellidos || usuario.apellido || usuario.lastName,
    fecha_creacion: usuario.fecha_creacion || usuario.fecha_registro || new Date(),
    fecha_actualizacion: usuario.fecha_actualizacion || new Date(),
    estado: usuario.estado || 'activo',
  };
}

function mapDbToUsuario(dbRow) {
  if (!dbRow) return null;
  return {
    id: dbRow.id_usuario || dbRow.id || null,
    correo: dbRow.correo_electronico,
    contrasena: dbRow.contrasena,
    nombres: dbRow.nombres,
    apellidos: dbRow.apellidos,
    estado: dbRow.estado,
    foto_perfil: dbRow.foto_perfil || null,
    fecha_nacimiento: dbRow.fecha_nacimiento || null,
    genero: dbRow.genero || null,
    preferencia_tema: dbRow.preferencia_tema || null,
    fecha_creacion: dbRow.fecha_creacion,
    fecha_actualizacion: dbRow.fecha_actualizacion,
    ultimo_acceso: dbRow.ultimo_acceso,
  };
}

module.exports = {
  mapUsuarioToDb,
  mapDbToUsuario,
};
