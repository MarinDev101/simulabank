// const { pool: database } = require('../config/database.config');
// const bcrypt = require('bcryptjs');
// const messages = require('../constants/messages.constants');
// const status = require('../constants/statusCodes.constants');

// // Obtener todos los administradores
// const obtenerAdministradores = async (req, res) => {
//   const sql =
//     "SELECT id_usuario, nombre, apellido, telefono, correo FROM usuarios WHERE rol = 'admin'";
//   try {
//     const [results] = await database.query(sql);
//     res.json(results);
//   } catch (err) {
//     return res.status(status.INTERNAL_ERROR).json({ error: messages.ERROR_OBTENER_ADMIN });
//   }
// };

// // Crear nuevo administrador
// const crearAdministrador = async (req, res) => {
//   const { nombre, apellido, telefono, correo, contraseña } = req.body;
//   if (!nombre || !apellido || !correo || !contraseña) {
//     return res.status(status.BAD_REQUEST).json({ error: messages.FALTAN_DATOS });
//   }
//   const hashedPassword = bcrypt.hashSync(contraseña, 10);
//   const sql =
//     "INSERT INTO usuarios (nombre, apellido, telefono, correo, contraseña, rol) VALUES (?, ?, ?, ?, ?, 'admin')";
//   const values = [nombre, apellido, telefono, correo, hashedPassword];
//   try {
//     const [result] = await database.query(sql, values);
//     res.json({ message: messages.ADMIN_CREADO, id: result.insertId });
//   } catch (err) {
//     return res.status(status.INTERNAL_ERROR).json({ error: messages.ERROR_CREAR_ADMIN });
//   }
// };

// // Editar administrador
// const editarAdministrador = async (req, res) => {
//   const { nombre, apellido, telefono, correo, contraseña } = req.body;
//   const id = req.params.id;
//   let sql = 'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, correo = ?';
//   const values = [nombre, apellido, telefono, correo];
//   if (contraseña) {
//     const hashedPassword = bcrypt.hashSync(contraseña, 10);
//     sql += ', contraseña = ?';
//     values.push(hashedPassword);
//   }
//   sql += " WHERE id_usuario = ? AND rol = 'admin'";
//   values.push(id);
//   try {
//     await database.query(sql, values);
//     res.json({ message: messages.ADMIN_ACTUALIZADO });
//   } catch (err) {
//     return res.status(status.INTERNAL_ERROR).json({ error: messages.ERROR_ACTUALIZAR_ADMIN });
//   }
// };

// // Eliminar administrador
// const eliminarAdministrador = async (req, res) => {
//   const id = req.params.id;
//   const sql = "DELETE FROM usuarios WHERE id_usuario = ? AND rol = 'admin'";
//   try {
//     await database.query(sql, [id]);
//     res.json({ message: messages.ADMIN_ELIMINADO });
//   } catch (err) {
//     return res.status(status.INTERNAL_ERROR).json({ error: messages.ERROR_ELIMINAR_ADMIN });
//   }
// };

// module.exports = {
//   obtenerAdministradores,
//   crearAdministrador,
//   editarAdministrador,
//   eliminarAdministrador,
// };
