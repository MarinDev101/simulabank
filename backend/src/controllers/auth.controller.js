// const { pool: database } = require('../config/database.config');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const messages = require('../constants/messages.constants');
// const status = require('../constants/statusCodes.constants');
// const { sendMail } = require('../helpers/mailer.helper');

// // Registro de usuario
// const registrarUsuario = async (req, res) => {
//   const { nombre, apellido, telefono, correo, contraseña, rol } = req.body;

//   try {
//     // 1. Verificar si el correo o teléfono ya existen
//     const [resultados] = await database.query(
//       'SELECT * FROM usuarios WHERE correo = ? OR telefono = ?',
//       [correo, telefono]
//     );

//     if (resultados.length > 0) {
//       const existeCorreo = resultados.some((u) => u.correo === correo);
//       const existeTelefono = resultados.some((u) => u.telefono === telefono);

//       if (existeCorreo && existeTelefono) {
//         return res.status(400).json({ error: 'El correo y teléfono ya están registrados' });
//       } else if (existeCorreo) {
//         return res.status(400).json({ error: messages.CORREO_YA_VINCULADO });
//       } else {
//         return res.status(400).json({ error: 'El teléfono ya está registrado' });
//       }
//     }

//     // 2. Encriptar contraseña
//     const salt = await bcrypt.genSalt(10);
//     const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

//     // 3. Crear objeto cliente
//     const cliente = {
//       nombre,
//       apellido,
//       telefono,
//       correo,
//       contraseña: contraseñaEncriptada,
//       rol: rol || 'cliente', // Valor por defecto si no se especifica
//       fecha_registro: new Date(),
//     };

//     // 4. Insertar directamente con database.query()
//     const [resultado] = await database.query('INSERT INTO usuarios SET ?', [cliente]);

//     // Verificar que se insertó correctamente
//     if (resultado.affectedRows === 1) {
//       // Obtener el usuario recién creado para devolverlo
//       const [usuarioCreado] = await database.query('SELECT * FROM usuarios WHERE id_usuario = ?', [
//         resultado.insertId,
//       ]);

//       return res.status(201).json({
//         message: messages.CLIENTE_REGISTRADO,
//         cliente: usuarioCreado[0],
//       });
//     } else {
//       throw new Error('No se pudo crear el usuario');
//     }
//   } catch (error) {
//     console.error('Error en registro de usuario:', error);
//     return res.status(500).json({
//       error: messages.ERROR_REGISTRAR_CLIENTE,
//       detalle: error.message,
//     });
//   }
// };

// // Login de usuario
// const loginUsuario = async (req, res) => {
//   const { correo, contraseña } = req.body;
//   try {
//     const [resultados] = await database.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
//     if (resultados.length === 0) {
//       return res
//         .status(status.BAD_REQUEST)
//         .json({ error: messages.CORREO_O_CONTRASENA_INCORRECTOS });
//     }
//     const usuario = resultados[0];
//     const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
//     if (!isMatch) {
//       return res
//         .status(status.BAD_REQUEST)
//         .json({ error: messages.CORREO_O_CONTRASENA_INCORRECTOS });
//     }
//     const token = jwt.sign(
//       { id: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
//       'mi_clave_secreta'
//     );
//     res.json({ token, rol: usuario.rol });
//   } catch (error) {
//     console.error(messages.ERROR_BD, error);
//     return res.status(status.INTERNAL_ERROR).json({ error: messages.ERROR_BD });
//   }
// };

// // Obtener usuario logueado
// const obtenerUsuario = async (req, res) => {
//   const { id } = req.user;

//   try {
//     const [resultados] = await database.query(
//       'SELECT nombre, apellido, correo, telefono FROM usuarios WHERE id_usuario = ?',
//       [id]
//     );

//     if (resultados.length === 0) {
//       return res.status(400).json({ error: 'Usuario no encontrado' });
//     }

//     const usuario = resultados[0];
//     res.json({
//       nombre: usuario.nombre,
//       apellido: usuario.apellido, // Campo añadido
//       correo: usuario.correo,
//       telefono: usuario.telefono,
//     });
//   } catch (error) {
//     console.error('Error al obtener los datos del usuario:', error);
//     return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
//   }
// };

// // Actualizar perfil de usuario - Versión mejorada
// const actualizarPerfil = async (req, res) => {
//   const { correo, telefono, contraseña } = req.body;
//   const { id } = req.user;

//   try {
//     // Verificar si el nuevo correo o teléfono ya existen en otros usuarios
//     const [existentes] = await database.query(
//       'SELECT * FROM usuarios WHERE (correo = ? OR telefono = ?) AND id_usuario != ?',
//       [correo, telefono, id]
//     );

//     if (existentes.length > 0) {
//       const existeCorreo = existentes.some((u) => u.correo === correo);
//       const existeTelefono = existentes.some((u) => u.telefono === telefono);

//       if (existeCorreo && existeTelefono) {
//         return res
//           .status(400)
//           .json({ error: 'El correo y teléfono ya están registrados por otro usuario' });
//       } else if (existeCorreo) {
//         return res.status(400).json({ error: 'El correo ya está registrado por otro usuario' });
//       } else {
//         return res.status(400).json({ error: 'El teléfono ya está registrado por otro usuario' });
//       }
//     }

//     const updateData = {};
//     if (correo) updateData.correo = correo;
//     if (telefono) updateData.telefono = telefono;

//     if (contraseña) {
//       const salt = await bcrypt.genSalt(10);
//       updateData.contraseña = await bcrypt.hash(contraseña, salt);
//     }

//     const [resultado] = await database.query('UPDATE usuarios SET ? WHERE id_usuario = ?', [
//       updateData,
//       id,
//     ]);

//     if (resultado.affectedRows === 0) {
//       return res.status(404).json({ error: 'Usuario no encontrado' });
//     }

//     res.json({
//       message: 'Perfil actualizado',
//       usuario: { correo, telefono }, // Devolver los datos actualizados
//     });
//   } catch (error) {
//     console.error('Error al actualizar los datos del usuario:', error);
//     return res.status(500).json({
//       error: 'Error al actualizar los datos del usuario',
//       detalle: error.message,
//     });
//   }
// };

// // Enviar código de autenticación al correo
// const enviarCodigoAutenticacion = async (req, res) => {
//   const { correo } = req.body;
//   try {
//     // Verificar si el correo existe
//     const [resultados] = await database.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
//     if (resultados.length === 0) {
//       return res.status(400).json({ error: 'Correo no registrado' });
//     }
//     // Generar código de 6 dígitos
//     const codigo = Math.floor(100000 + Math.random() * 900000).toString();
//     // Guardar el código en un JWT temporal (expira en 15 min)
//     const tokenCodigo = jwt.sign({ correo, codigo }, 'mi_clave_secreta', { expiresIn: '15m' });
//     // Enviar correo con el código
//     await sendMail({
//       to: correo,
//       subject: 'Código de autenticación BikeStore',
//       html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 40px 10px;">
//         <div style="max-width: 520px; margin: auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 16px rgba(44,62,80,0.12); padding: 36px 28px; text-align: center;">
//           <img src="https://res.cloudinary.com/ddpdfgxjq/image/upload/v1751602642/logo_iwqxmf.png" alt="BikeStore Logo" style="width: 220px; max-width: 100%; height: auto; margin-bottom: 22px; border-radius: 10px; box-shadow: 0 2px 8px rgba(44,62,80,0.08);" />
//           <h2 style="color: #2c3e50; margin-bottom: 14px;">Tu código de autenticación</h2>
//           <p style="color: #34495e; font-size: 18px; margin-bottom: 22px;">
//             Usa este código para continuar con la recuperación de tu contraseña:<br>
//             <span style="font-size: 32px; font-weight: bold; color: #0984e3; letter-spacing: 4px;">${codigo}</span>
//           </p>
//           <div style="margin-top: 34px; font-size: 14px; color: #b2bec3;">BikeStore &copy; 2025</div>
//         </div>
//       </div>`,
//     });
//     // Enviar el token al frontend (el frontend debe guardarlo temporalmente)
//     res.status(200).json({ ok: true, token: tokenCodigo, message: 'Código enviado al correo' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ ok: false, message: 'Error al enviar el código' });
//   }
// };

// // Verificar solo el código de recuperación
// const verificarCodigo = async (req, res) => {
//   const { token, codigo } = req.body;
//   if (!token || !codigo) {
//     return res.status(400).json({ error: 'Datos incompletos' });
//   }
//   try {
//     const decoded = jwt.verify(token, 'mi_clave_secreta');
//     if (decoded.codigo !== codigo) {
//       return res.status(401).json({ error: 'Código incorrecto' });
//     }
//     return res.status(200).json({ message: 'Código verificado correctamente' });
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'El token ha expirado' });
//     }
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ error: 'Token inválido' });
//     }
//     return res.status(500).json({ error: 'Error al procesar la solicitud' });
//   }
// };

// // Cambiar la contraseña solo si el código es correcto
// const actualizarContrasenaConCodigo = async (req, res) => {
//   const { token, codigo, nuevaContrasena } = req.body;
//   if (!token || !codigo || !nuevaContrasena) {
//     return res.status(400).json({ error: 'Datos incompletos' });
//   }
//   try {
//     const decoded = jwt.verify(token, 'mi_clave_secreta');
//     if (decoded.codigo !== codigo) {
//       return res.status(401).json({ error: 'Código incorrecto' });
//     }
//     if (nuevaContrasena.length < 6) {
//       return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
//     }
//     const salt = await bcrypt.genSalt(10);
//     const contraseñaEncriptada = await bcrypt.hash(nuevaContrasena, salt);
//     const [resultado] = await database.query(
//       'UPDATE usuarios SET contraseña = ? WHERE correo = ?',
//       [contraseñaEncriptada, decoded.correo]
//     );
//     if (resultado.affectedRows === 0) {
//       return res.status(404).json({ error: 'No se encontró usuario con ese correo' });
//     }
//     res.status(200).json({ message: 'Contraseña actualizada con éxito' });
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'El token ha expirado' });
//     }
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ error: 'Token inválido' });
//     }
//     return res.status(500).json({ error: 'Error al procesar la solicitud' });
//   }
// };

// // Exportar las nuevas funciones
// module.exports = {
//   registrarUsuario,
//   loginUsuario,
//   obtenerUsuario,
//   actualizarPerfil,
//   enviarCodigoAutenticacion,
//   verificarCodigo,
//   actualizarContrasenaConCodigo,
// };
