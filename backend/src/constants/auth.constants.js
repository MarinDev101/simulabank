// Constantes relacionadas con autenticación y tablas de usuarios
const TABLAS = {
  USUARIOS: 'usuarios',
  APRENDICES: 'aprendices',
  INSTRUCTORES: 'instructores',
  ADMINISTRADORES: 'administradores',
};

const CAMPOS_ID = {
  USUARIO: 'id_usuario',
  APRENDIZ: 'id_aprendiz',
  INSTRUCTOR: 'id_instructor',
  ADMINISTRADOR: 'id_administrador',
};

const ESTADOS = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
};

const ROLES = {
  APRENDIZ: 'aprendiz',
  INSTRUCTOR: 'instructor',
  ADMINISTRADOR: 'administrador',
  USUARIO: 'usuario',
};

module.exports = {
  TABLAS,
  CAMPOS_ID,
  ESTADOS,
  ROLES,
};
