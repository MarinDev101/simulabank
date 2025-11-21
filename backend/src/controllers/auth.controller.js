const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env.config');
const tokenService = require('../services/token');
const {
  TABLAS,
  CAMPOS_ID,
  ESTADOS,
  ROLES,
} = require('../constants/informacion-database/auth.constants');
const { mapUsuarioToDb, mapDbToUsuario } = require('../models/usuario.model');
const emailService = require('../services/email');
const verificacionService = require('../services/verificacion');

class AuthController {
  async iniciarRegistro(req, res) {
    const { correo, nombres, apellidos, contrasena } = req.body;

    // Validación básica
    if (!correo || !nombres || !apellidos || !contrasena) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos',
      });
    }

    try {
      // Verificar si el correo ya existe
      const [existeUsuario] = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE correo_electronico = ? LIMIT 1',
        [correo]
      );

      if (existeUsuario.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Este correo ya está registrado',
        });
      }

      // Generar y guardar código
      const codigo = await verificacionService.guardarCodigoVerificacion(
        correo,
        nombres,
        apellidos,
        contrasena
      );

      // Enviar código por email
      await emailService.enviarCodigoVerificacion(correo, codigo, nombres);

      return res.json({
        success: true,
        message: 'Código de verificación enviado al correo',
        correo: correo,
      });
    } catch (error) {
      console.error('Error en iniciarRegistro:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al procesar el registro. Intenta nuevamente.',
      });
    }
  }

  async verificarCodigoRegistro(req, res) {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Correo y código son requeridos',
      });
    }

    try {
      // Verificar el código
      const datosVerificacion = await verificacionService.verificarCodigo(correo, codigo);

      if (!datosVerificacion) {
        return res.status(400).json({
          success: false,
          error: 'Código inválido o expirado',
        });
      }

      // Crear el usuario
      const nuevoUsuario = {
        correo_electronico: datosVerificacion.correo_electronico,
        contrasena: datosVerificacion.contrasena_hash,
        nombres: datosVerificacion.nombres,
        apellidos: datosVerificacion.apellidos,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        estado: 'activo',
      };

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Insertar usuario
        const [insertRes] = await conn.query('INSERT INTO usuarios SET ?', nuevoUsuario);
        const userId = insertRes.insertId;

        // Asignar rol de aprendiz por defecto
        await conn.query('INSERT INTO aprendices (id_aprendiz) VALUES (?)', [userId]);

        // Marcar código como usado
        await verificacionService.marcarCodigoUsado(correo, codigo);

        await conn.commit();

        // Generar tokens
        const token = jwt.sign(
          { id: userId, correo: nuevoUsuario.correo_electronico, rol: 'aprendiz' },
          jwtConfig.secret,
          { expiresIn: jwtConfig.expiresIn }
        );

        const refreshToken = jwt.sign({ id: userId }, jwtConfig.secret, {
          expiresIn: jwtConfig.refreshExpiresIn,
        });

        // Guardar refresh token
        const meta = {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        };

        await tokenService.saveRefreshToken(refreshToken, userId, jwtConfig.refreshExpiresIn, meta);

        return res.status(201).json({
          success: true,
          message: 'Cuenta creada exitosamente',
          token,
          refreshToken,
          user: {
            id: userId,
            correo: nuevoUsuario.correo_electronico,
            nombres: nuevoUsuario.nombres,
            apellidos: nuevoUsuario.apellidos,
            rol: 'aprendiz',
          },
        });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error en verificarCodigoRegistro:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar el código. Intenta nuevamente.',
      });
    }
  }

  async registrar(req, res) {
    const { correo, nombres, apellidos, rol = ROLES.APRENDIZ, contrasena } = req.body;

    // Validación básica
    if (!correo || !contrasena || !nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        error: 'correo, contrasena, nombres y apellidos son requeridos',
      });
    }

    // Normalizar rol
    const rolNormalizado = this._normalizarRol(rol);
    if (!rolNormalizado) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Permitidos: aprendiz, instructor',
      });
    }

    // Verificar si el correo existe - CONSULTA PREPARADA CORRECTA
    const queryVerificarCorreo = 'SELECT ?? FROM ?? WHERE correo_electronico = ? LIMIT 1';
    const [exists] = await pool.query(queryVerificarCorreo, [
      CAMPOS_ID.USUARIO,
      TABLAS.USUARIOS,
      correo,
    ]);

    if (exists.length > 0) {
      return res.status(400).json({ success: false, error: 'Correo ya registrado' });
    }

    // Crear usuario
    const hashed = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = mapUsuarioToDb({
      correo_electronico: correo,
      contrasena: hashed,
      nombres,
      apellidos,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      estado: ESTADOS.ACTIVO,
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insertar usuario - usando SET ? que es seguro con mysql2
      const [insertRes] = await conn.query('INSERT INTO ?? SET ?', [TABLAS.USUARIOS, nuevoUsuario]);
      const userId = insertRes.insertId;

      // Insertar en tabla de rol - si es administrador, insertar en administradores; si no, en instructores/aprendices
      if (rolNormalizado === ROLES.ADMINISTRADOR) {
        await conn.query('INSERT INTO ?? (??) VALUES (?)', [
          TABLAS.ADMINISTRADORES,
          CAMPOS_ID.ADMINISTRADOR,
          userId,
        ]);
      } else {
        const tablaRol =
          rolNormalizado === ROLES.INSTRUCTOR ? TABLAS.INSTRUCTORES : TABLAS.APRENDICES;
        const campoId =
          rolNormalizado === ROLES.INSTRUCTOR ? CAMPOS_ID.INSTRUCTOR : CAMPOS_ID.APRENDIZ;
        await conn.query('INSERT INTO ?? (??) VALUES (?)', [tablaRol, campoId, userId]);
      }

      await conn.commit();

      return res.status(201).json({
        success: true,
        id: userId,
        rol: rolNormalizado,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async registrarAdmin(req, res) {
    const { correo, nombres, apellidos, contrasena } = req.body;

    // Validación básica
    if (!correo || !contrasena || !nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        error: 'correo, contrasena, nombres y apellidos son requeridos',
      });
    }

    try {
      // Verificar si el correo existe
      const queryVerificarCorreo = 'SELECT ?? FROM ?? WHERE correo_electronico = ? LIMIT 1';
      const [exists] = await pool.query(queryVerificarCorreo, [
        CAMPOS_ID.USUARIO,
        TABLAS.USUARIOS,
        correo,
      ]);

      if (exists.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Correo ya registrado',
        });
      }

      // Crear usuario con contraseña hasheada
      const hashed = await bcrypt.hash(contrasena, 10);
      const nuevoUsuario = mapUsuarioToDb({
        correo_electronico: correo,
        contrasena: hashed,
        nombres,
        apellidos,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        estado: ESTADOS.ACTIVO,
      });

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Insertar usuario
        const [insertRes] = await conn.query('INSERT INTO ?? SET ?', [
          TABLAS.USUARIOS,
          nuevoUsuario,
        ]);
        const userId = insertRes.insertId;

        // Insertar en tabla de administradores
        await conn.query('INSERT INTO ?? (??) VALUES (?)', [
          TABLAS.ADMINISTRADORES,
          CAMPOS_ID.ADMINISTRADOR,
          userId,
        ]);

        await conn.commit();

        return res.status(201).json({
          success: true,
          message: 'Administrador creado exitosamente',
          id: userId,
          rol: ROLES.ADMINISTRADOR,
          usuario: {
            id: userId,
            correo,
            nombres,
            apellidos,
            rol: ROLES.ADMINISTRADOR,
          },
        });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error en registrarAdmin:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al crear administrador. Intenta nuevamente.',
      });
    }
  }

  // Agregar estos métodos al auth.controller.js existente

  async solicitarRecuperacion(req, res) {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        error: 'El correo es requerido',
      });
    }

    try {
      // Verificar si el correo existe
      const [usuario] = await pool.query(
        'SELECT id_usuario, nombres FROM usuarios WHERE correo_electronico = ? LIMIT 1',
        [correo]
      );

      if (usuario.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No existe una cuenta con este correo electrónico',
        });
      }

      // Generar y guardar código de recuperación
      const codigo = await verificacionService.guardarCodigoRecuperacion(correo);

      // Enviar código por email
      await emailService.enviarCodigoRecuperacion(correo, codigo, usuario[0].nombres);

      return res.json({
        success: true,
        message: 'Código de recuperación enviado al correo',
        correo: correo,
      });
    } catch (error) {
      console.error('Error en solicitarRecuperacion:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al procesar la solicitud. Intenta nuevamente.',
      });
    }
  }

  async verificarCodigoRecuperacion(req, res) {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Correo y código son requeridos',
      });
    }

    try {
      // Reutilizar el servicio de verificación para mantener la misma lógica que el registro
      const datosVerificacion = await verificacionService.verificarCodigoRecuperacion(
        correo,
        codigo
      );

      if (!datosVerificacion) {
        return res.status(400).json({
          success: false,
          error: 'Código inválido o expirado',
        });
      }

      // Generar token temporal (válido por 15 minutos)
      const tokenTemporal = jwt.sign({ correo, tipo: 'recuperacion' }, jwtConfig.secret, {
        expiresIn: '15m',
      });

      // Marcar código como usado usando el servicio (misma lógica que en registro)
      await verificacionService.marcarCodigoUsado(correo, codigo);

      return res.json({
        success: true,
        message: 'Código verificado correctamente',
        token_temporal: tokenTemporal,
      });
    } catch (error) {
      console.error('Error en verificarCodigoRecuperacion:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar el código. Intenta nuevamente.',
      });
    }
  }

  async restablecerContrasena(req, res) {
    const { token_temporal, nueva_contrasena } = req.body;

    if (!token_temporal || !nueva_contrasena) {
      return res.status(400).json({
        success: false,
        error: 'Token temporal y nueva contraseña son requeridos',
      });
    }

    try {
      // Verificar token temporal
      const decoded = jwt.verify(token_temporal, jwtConfig.secret);

      if (decoded.tipo !== 'recuperacion') {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      // Validar que la contraseña cumpla requisitos
      if (nueva_contrasena.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 8 caracteres',
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);

      // Actualizar contraseña
      const [result] = await pool.query(
        'UPDATE usuarios SET contrasena = ?, fecha_actualizacion = NOW() WHERE correo_electronico = ?',
        [hashedPassword, decoded.correo]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      // Opcional: Revocar todos los tokens de sesión activos del usuario
      const [usuario] = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE correo_electronico = ? LIMIT 1',
        [decoded.correo]
      );

      if (usuario.length > 0) {
        await tokenService.revokeAll(usuario[0].id_usuario);
      }

      return res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'El token ha expirado. Solicita un nuevo código.',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      console.error('Error en restablecerContrasena:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al restablecer la contraseña. Intenta nuevamente.',
      });
    }
  }

  async changePassword(req, res) {
    const userId = req.user && req.user.id;
    const { current_password, new_password } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'No autenticado' });
    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ success: false, error: 'Contraseña actual y nueva son requeridas' });
    }

    try {
      const query = 'SELECT contrasena FROM ?? WHERE ?? = ? LIMIT 1';
      const [rows] = await pool.query(query, [TABLAS.USUARIOS, CAMPOS_ID.USUARIO, userId]);
      if (!rows.length)
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

      const hashed = rows[0].contrasena;
      const match = await bcrypt.compare(current_password, hashed);
      if (!match)
        return res.status(401).json({ success: false, error: 'Contraseña actual incorrecta' });

      if (new_password.length < 8) {
        return res
          .status(400)
          .json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
      }

      const newHashed = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE ?? SET contrasena = ?, fecha_actualizacion = NOW() WHERE ?? = ?', [
        TABLAS.USUARIOS,
        newHashed,
        CAMPOS_ID.USUARIO,
        userId,
      ]);

      // Opcional: revocar sesiones activas
      try {
        await tokenService.revokeAll(userId);
      } catch (e) {
        console.warn('No se pudieron revocar sesiones al cambiar contraseña', e);
      }

      return res.json({ success: true, message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
      console.error('Error en changePassword:', error);
      return res.status(500).json({ success: false, error: 'Error al cambiar la contraseña' });
    }
  }

  async actualizarPerfilInicial(req, res) {
    const userId = req.body.userId;
    const { foto_perfil, fecha_nacimiento, genero, nombres, apellidos, eliminar_foto } = req.body;

    // Si se envió un archivo usando multipart/form-data (campo 'foto'), convertirlo a base64
    // y establecer el valor para guardar en la DB.
    if (req.file && req.file.buffer) {
      try {
        const mime = req.file.mimetype || 'image/png';
        const base64 = req.file.buffer.toString('base64');
        // Guarda como data URI para facilitar uso desde el frontend
        // Ejemplo: data:image/png;base64,AAAA...
        req.body.foto_perfil = `data:${mime};base64,${base64}`;
      } catch (err) {
        console.error('Error convirtiendo imagen a base64:', err);
        return res.status(400).json({ success: false, error: 'Error al procesar la imagen' });
      }
    }

    // Validación básica - userId es requerido
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario requerido',
      });
    }

    try {
      // Construir objeto con solo los campos proporcionados
      const datosActualizar = {};
      // Usar el valor actualizado en req.body (puede haber sido establecido desde req.file)
      const fotoValor = req.body.foto_perfil || foto_perfil;
      if (typeof eliminar_foto !== 'undefined' && eliminar_foto) {
        // Marcar para eliminar la foto (se setea NULL en DB)
        datosActualizar.foto_perfil = null;
      } else if (fotoValor) {
        datosActualizar.foto_perfil = fotoValor;
      }
      if (fecha_nacimiento) datosActualizar.fecha_nacimiento = fecha_nacimiento;
      if (genero) datosActualizar.genero = genero;
      if (nombres) datosActualizar.nombres = nombres;
      if (apellidos) datosActualizar.apellidos = apellidos;

      // Si no hay datos para actualizar, retornar éxito
      if (Object.keys(datosActualizar).length === 0) {
        return res.json({
          success: true,
          message: 'No hay datos para actualizar',
        });
      }

      // Actualizar fecha de modificación
      datosActualizar.fecha_actualizacion = new Date();

      // Actualizar usuario en la base de datos
      const queryActualizar = 'UPDATE ?? SET ? WHERE ?? = ?';
      await pool.query(queryActualizar, [
        TABLAS.USUARIOS,
        datosActualizar,
        CAMPOS_ID.USUARIO,
        userId,
      ]);

      return res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        datos: datosActualizar,
      });
    } catch (error) {
      console.error('Error en actualizarPerfilInicial:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el perfil',
      });
    }
  }

  async login(req, res) {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        error: 'correo y contrasena requeridos',
      });
    }

    // Buscar usuario - CONSULTA PREPARADA
    const queryLogin = `
      SELECT *
      FROM ??
      WHERE correo_electronico = ?
      LIMIT 1
    `;
    const [usuarios] = await pool.query(queryLogin, [TABLAS.USUARIOS, correo]);

    if (!usuarios.length) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const user = mapDbToUsuario(usuarios[0]);

    // Verificar estado
    if (String(user.estado || '').toLowerCase() !== ESTADOS.ACTIVO) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta inactiva. Contacte al administrador.',
      });
    }

    // Verificar contraseña
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Determinar rol
    const rol = await this._determinarRol(user.id);

    // Generar tokens (access contiene rol para autorización)
    const token = jwt.sign({ id: user.id, correo: user.correo, rol }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
    const refreshToken = jwt.sign({ id: user.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    // Guardar refresh token
    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    await tokenService.saveRefreshToken(refreshToken, user.id, jwtConfig.refreshExpiresIn, meta);

    // Actualizar último acceso - CONSULTA PREPARADA
    const queryActualizarAcceso = 'UPDATE ?? SET ultimo_acceso = NOW() WHERE ?? = ?';
    await pool.query(queryActualizarAcceso, [TABLAS.USUARIOS, CAMPOS_ID.USUARIO, user.id]);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        correo: user.correo,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol,
        foto_perfil: user.foto_perfil || null,
        fecha_nacimiento: user.fecha_nacimiento || null,
        genero: user.genero || null,
        preferencia_tema: user.preferencia_tema || null,
      },
    });
  }

  async perfil(req, res) {
    // req.user debe estar poblado por middleware de autenticación
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, error: 'No autenticado' });

    const [rows] = await pool.query('SELECT * FROM ?? WHERE ?? = ? LIMIT 1', [
      TABLAS.USUARIOS,
      CAMPOS_ID.USUARIO,
      userId,
    ]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const usuario = mapDbToUsuario(rows[0]);
    const rol = await this._determinarRol(usuario.id);

    return res.json({ success: true, user: { ...usuario, rol } });
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;

    const valid = await tokenService.isRefreshTokenValid(refreshToken);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido' });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    await tokenService.revokeRefreshToken(refreshToken);

    // Generar nuevos tokens
    const newToken = jwt.sign({ id: decoded.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const newRefresh = jwt.sign({ id: decoded.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    await tokenService.saveRefreshToken(newRefresh, decoded.id, jwtConfig.refreshExpiresIn, meta);

    return res.json({
      success: true,
      token: newToken,
      refreshToken: newRefresh,
    });
  }

  async logout(req, res) {
    const { refreshToken } = req.body;
    await tokenService.revokeRefreshToken(refreshToken);
    return res.json({ success: true });
  }

  async listSessions(req, res) {
    const sessions = await tokenService.listSessions(req.user.id);
    return res.json({ success: true, sessions });
  }

  async logoutAll(req, res) {
    await tokenService.revokeAll(req.user.id);
    return res.json({ success: true });
  }

  async revokeSession(req, res) {
    const id = parseInt(req.params.id, 10);
    await tokenService.revokeBySessionId(id);
    return res.json({ success: true });
  }

  async adminEndpoint(req, res) {
    return res.json({
      success: true,
      message: 'Acceso de administrador verificado',
      user: req.user,
    });
  }

  // =========================================================
  // Métodos auxiliares
  // =========================================================
  _normalizarRol(rol) {
    const normalized = rol.toLowerCase();
    if ([ROLES.APRENDIZ, 'aprendices'].includes(normalized)) return ROLES.APRENDIZ;
    if ([ROLES.INSTRUCTOR, 'instructores'].includes(normalized)) return ROLES.INSTRUCTOR;
    return null;
  }

  async _determinarRol(userId) {
    // CONSULTAS PREPARADAS para determinar rol
    const queryAdmin = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
    const queryInstructor = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
    const queryAprendiz = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';

    const [[admin], [instructor], [aprendiz]] = await Promise.all([
      pool.query(queryAdmin, [TABLAS.ADMINISTRADORES, CAMPOS_ID.ADMINISTRADOR, userId]),
      pool.query(queryInstructor, [TABLAS.INSTRUCTORES, CAMPOS_ID.INSTRUCTOR, userId]),
      pool.query(queryAprendiz, [TABLAS.APRENDICES, CAMPOS_ID.APRENDIZ, userId]),
    ]);

    if (admin.length > 0) return ROLES.ADMINISTRADOR;
    if (instructor.length > 0) return ROLES.INSTRUCTOR;
    if (aprendiz.length > 0) return ROLES.APRENDIZ;
    return ROLES.USUARIO;
  }
}

module.exports = new AuthController();
